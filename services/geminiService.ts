import { GoogleGenAI } from "@google/genai";
import { Acta } from "../types";
import { env } from "../config/env";

export interface PuntoAgendaItem {
  tema: string;
  debate: string;
  acuerdo: string;
  socioSolicitante?: string;
  agendaContenido?: string;
}

export interface ImproveActaPuntosParams {
  titulo?: string;
  categoria?: string;
  puntos: PuntoAgendaItem[];
}

export class GeminiService {
  private getApiKey(): string {
    return (
      env.geminiApiKey ||
      import.meta.env.VITE_GEMINI_API_KEY ||
      import.meta.env.GEMINI_API_KEY ||
      (typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') || '' : '')
    );
  }

  /**
   * Summarizes club minutes based on a user query using Gemini AI.
   */
  async summarizeActas(actas: Acta[], query: string): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return "Para usar la búsqueda con IA, por favor configure la variable GEMINI_API_KEY.";
    }

    const ai = new GoogleGenAI({ apiKey });
    const context = actas.map(a => `Fecha: ${a.fecha} - Título: ${a.titulo}: ${a.contenido}`).join("\n\n");
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Eres un asistente administrativo del Club de Leones de Quetzaltenango. 
        Basado en las siguientes actas de reuniones:
        
        ${context}
        
        Responde a la siguiente consulta del socio de forma precisa y amable: ${query}`,
        config: {
          temperature: 0.7,
        }
      });

      return response.text || "No se pudo generar una respuesta.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Hubo un error al procesar tu búsqueda inteligente.";
    }
  }

  /**
   * Perfecciona, corrige ortografía y gramática, formaliza la redacción y autocompleta/estructura
   * los puntos de agenda y acuerdos de un acta con estilo institucional Leonístico.
   */
  async improveAndFormatPuntosAgenda(params: ImproveActaPuntosParams): Promise<PuntoAgendaItem[]> {
    const apiKey = this.getApiKey();
    const { puntos, titulo, categoria } = params;

    if (!puntos || puntos.length === 0) {
      return [];
    }

    if (!apiKey) {
      console.warn("Gemini API Key no encontrada. Se conservan los puntos originales.");
      return puntos;
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `Eres el redactor oficial y asesor de secretaría del Club de Leones de Quetzaltenango (Lions International).
Tu función es transformar, corregir y perfeccionar las notas y borradores de los puntos de agenda tratados en una sesión de ${categoria || 'Asamblea Ordinaria'} titulada "${titulo || 'Sesión de Club'}".

INSTRUCCIONES CLAVE DE REDACCIÓN Y ESTILO:
1. ORTOGRAFÍA Y GRAMÁTICA: Corrige rigurosamente tildes, puntuación, mayúsculas, concordancia y tiempos verbales.
2. TEMA DEL PUNTO: Mantén o mejora el título del asunto para que sea formal, conciso y claro.
3. DEBATE Y DISCUSIÓN:
   - Redacta en tercera persona formal e institucional (estilo de acta notarial/corporativa de club de servicio).
   - Si se mencionan nombres de socios (ej. "Socio X dijo...", "Hermano León Y apoyó..."), mantén explícitamente sus intervenciones con respeto y fluidez.
   - Si hay notas cortas o ideas en viñetas, redacta un párrafo continuo, fluido y solemne que refleje la deliberación ocurrida sin inventar datos que contradigan lo discutido.
   - Si se incluyó contenido de propuesta o socio solicitante, dale un contexto ordenado.
4. ACUERDO / RESOLUCIÓN:
   - Si el usuario dejó el acuerdo vacío o incompleto (ej. "se aprobó", "comprar"), deduce y redacta formalmente la resolución acordada por la asamblea en lenguaje protocolario (ej. "Por unanimidad de votos de los socios presentes, se ACUERDA: Aprobar la realización de... encomendando su seguimiento a la comisión respectiva.").
   - Si ya contenía un acuerdo, formalízalo con la solemnidad reglamentaria correspondiente.
5. PRESERVACIÓN: Devuelve exactamente la misma cantidad de puntos y conserva las propiedades socioSolicitante y agendaContenido si venían presentes.

DEBES RESPONDER EXCLUSIVAMENTE CON UN ARREGLO JSON VÁLIDO.
Ejemplo de estructura de salida esperada:
[
  {
    "tema": "Título formal del punto",
    "debate": "Redacción formal, fluida y corregida de las deliberaciones...",
    "acuerdo": "Por unanimidad, se ACUERDA: ...",
    "socioSolicitante": "Nombre si aplica",
    "agendaContenido": "Propuesta si aplica"
  }
]`;

    const userContent = `Aquí tienes los puntos de agenda originales ingresados para esta acta:

${JSON.stringify(puntos, null, 2)}

Por favor, devuélveme el arreglo JSON perfeccionado con todas las correcciones, redacción fluida y acuerdos solemnes.`;

    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: `${systemPrompt}\n\n${userContent}`,
          config: {
            temperature: 0.3,
            responseMimeType: "application/json",
          }
        });

        const rawText = response.text?.trim() || '';
        if (!rawText) continue;

        // Limpiar posibles delimitadores de código markdown si los hubiera
        const cleanedText = rawText
          .replace(/^```(?:json)?\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim();

        const parsed = JSON.parse(cleanedText);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Asegurar que cada elemento tenga los campos requeridos
          return parsed.map((item, idx) => ({
            tema: String(item.tema || puntos[idx]?.tema || '').trim(),
            debate: String(item.debate || puntos[idx]?.debate || '').trim(),
            acuerdo: String(item.acuerdo || puntos[idx]?.acuerdo || '').trim(),
            socioSolicitante: item.socioSolicitante || puntos[idx]?.socioSolicitante,
            agendaContenido: item.agendaContenido || puntos[idx]?.agendaContenido,
          }));
        }
      } catch (err) {
        console.warn(`Intento con modelo ${modelName} falló:`, err);
      }
    }

    // Fallback: si los modelos fallan, devolvemos los puntos originales sin romper el flujo
    console.error("No se pudo completar el pulido con Gemini. Se mantienen los puntos originales.");
    return puntos;
  }
}

export const geminiService = new GeminiService();
