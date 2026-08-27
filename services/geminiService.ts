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
      (typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') || '' : '') ||
      env.geminiApiKey ||
      import.meta.env.VITE_GEMINI_API_KEY ||
      import.meta.env.GEMINI_API_KEY ||
      ''
    );
  }

  /**
   * Generador protocolario y sintetizador inteligente de respaldo.
   * Garantiza que NUNCA quede un campo de acuerdo vacío y genera redacción formal Leonística.
   */
  private formatAndSynthesizePuntosLocal(params: ImproveActaPuntosParams): PuntoAgendaItem[] {
    const { puntos } = params;

    return puntos.map((p, idx) => {
      let tema = (p.tema || `Punto de Agenda #${idx + 1}`).trim();
      // Capitalizar tema si viene en minúsculas
      if (tema.length > 0) {
        tema = tema.charAt(0).toUpperCase() + tema.slice(1);
      }

      let debate = (p.debate || '').trim();
      if (!debate && p.agendaContenido) {
        debate = `Se dio lectura y consideración a la propuesta presentada por ${p.socioSolicitante || 'el socio proponente'}: "${p.agendaContenido}". Los miembros de la asamblea deliberaron sobre su viabilidad y conveniencia para el club.`;
      } else if (!debate) {
        debate = `Los socios presentes procedieron al análisis y discusión del tema "${tema}", evaluando las distintas alternativas y consideraciones pertinentes para beneficio del club.`;
      } else {
        // Asegurar puntuación final
        if (!debate.endsWith('.') && !debate.endsWith(';') && !debate.endsWith('!')) {
          debate = `${debate}.`;
        }
      }

      let acuerdo = (p.acuerdo || '').trim();
      // Si el usuario no escribió acuerdo o es muy corto, generar resolución formal solemne
      if (!acuerdo || acuerdo.toLowerCase().includes('sin acuerdo') || acuerdo.length < 5) {
        const propuestoPor = p.socioSolicitante ? ` presentada por ${p.socioSolicitante}` : '';
        acuerdo = `Por unanimidad de votos de los socios miembros presentes en la asamblea, se ACUERDA: Aprobar y respaldar la propuesta relativa a "${tema}"${propuestoPor}, encomendando a la Junta Directiva y a la comisión respectiva la ejecución, seguimiento y debido cumplimiento de lo resuelto.`;
      } else {
        // Formalizar acuerdo existente si no tiene encabezado protocolario
        if (!acuerdo.toLowerCase().includes('acuerda') && !acuerdo.toLowerCase().includes('resuelve') && !acuerdo.toLowerCase().includes('por unanimidad')) {
          acuerdo = `Por decisión de la asamblea de socios, se ACUERDA: ${acuerdo.charAt(0).toUpperCase() + acuerdo.slice(1)}`;
        }
        if (!acuerdo.endsWith('.') && !acuerdo.endsWith(';')) {
          acuerdo = `${acuerdo}.`;
        }
      }

      return {
        tema,
        debate,
        acuerdo,
        socioSolicitante: p.socioSolicitante,
        agendaContenido: p.agendaContenido
      };
    });
  }

  /**
   * Resume actas mediante Gemini IA.
   */
  async summarizeActas(actas: Acta[], query: string): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return "Para usar la búsqueda con IA, configure una clave de API de Gemini válida.";
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
   * Escribe y registra los textos directamente en cada campo.
   */
  async improveAndFormatPuntosAgenda(params: ImproveActaPuntosParams): Promise<PuntoAgendaItem[]> {
    const apiKey = this.getApiKey();
    const { puntos, titulo, categoria } = params;

    if (!puntos || puntos.length === 0) {
      return [];
    }

    // Si no hay API key configurada, usamos el motor protocolario inteligente local inmediatamente
    if (!apiKey) {
      console.info("Gemini API Key no configurada. Utilizando sintetizador protocolario Leonístico integrado.");
      return this.formatAndSynthesizePuntosLocal(params);
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
   - Si hay notas cortas o ideas en viñetas, redacta un párrafo continuo, fluido y solemne que refleje la deliberación ocurrida.
   - Si se incluyó contenido de propuesta o socio solicitante, dale un contexto ordenado.
4. ACUERDO / RESOLUCIÓN (OBLIGATORIO):
   - NUNCA devuelvas el campo "acuerdo" vacío ni con "Sin acuerdo".
   - Si el usuario dejó el acuerdo vacío o incompleto (ej. "se aprobó", "comprar"), deduce y redacta formalmente la resolución acordada por la asamblea en lenguaje protocolario solemne (ej. "Por unanimidad de votos de los socios presentes en la asamblea, se ACUERDA: Aprobar la realización de... encomendando su ejecución y seguimiento a la comisión respectiva.").
   - Si ya contenía un acuerdo, formalízalo con solemnidad reglamentaria.
5. PRESERVACIÓN: Devuelve exactamente la misma cantidad de puntos y conserva las propiedades socioSolicitante y agendaContenido si venían presentes.

DEBES RESPONDER EXCLUSIVAMENTE CON UN ARREGLO JSON VÁLIDO.
Ejemplo de salida esperada:
[
  {
    "tema": "Título formal del punto",
    "debate": "Redacción formal, fluida y corregida de las deliberaciones...",
    "acuerdo": "Por unanimidad de votos, se ACUERDA: ...",
    "socioSolicitante": "Nombre si aplica",
    "agendaContenido": "Propuesta si aplica"
  }
]`;

    const userContent = `Aquí tienes los puntos de agenda originales ingresados para esta acta:

${JSON.stringify(puntos, null, 2)}

Por favor, devuélveme el arreglo JSON perfeccionado con todas las correcciones, redacción fluida y acuerdos solemnes generados.`;

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

        const cleanedText = rawText
          .replace(/^```(?:json)?\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim();

        const parsed = JSON.parse(cleanedText);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item, idx) => {
            const original = puntos[idx] || ({} as PuntoAgendaItem);
            const itemTema = String(item.tema || original.tema || `Punto #${idx + 1}`).trim();
            const itemDebate = String(item.debate || original.debate || '').trim();
            let itemAcuerdo = String(item.acuerdo || original.acuerdo || '').trim();

            if (!itemAcuerdo || itemAcuerdo.toLowerCase().includes('sin acuerdo')) {
              itemAcuerdo = `Por unanimidad de votos de los socios miembros de la asamblea, se ACUERDA: Aprobar y dar curso a lo deliberado sobre "${itemTema}", encomendando a la directiva su debido seguimiento y ejecución.`;
            }

            return {
              tema: itemTema,
              debate: itemDebate,
              acuerdo: itemAcuerdo,
              socioSolicitante: item.socioSolicitante || original.socioSolicitante,
              agendaContenido: item.agendaContenido || original.agendaContenido,
            };
          });
        }
      } catch (err) {
        console.warn(`Intento con modelo ${modelName} no completado:`, err);
      }
    }

    // Fallback inteligente: si la API no responde, el sintetizador protocolario formaliza y genera los acuerdos inmediatamente
    console.info("Aplicando sintetizador protocolario Leonístico de respaldo para formalizar y rellenar acuerdos.");
    return this.formatAndSynthesizePuntosLocal(params);
  }
}

export const geminiService = new GeminiService();
