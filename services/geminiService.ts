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

export interface ImproveActaResult {
  puntos: PuntoAgendaItem[];
  source: 'gemini' | 'local';
  error?: string;
}

export class GeminiService {
  getApiKey(): string {
    return (
      (typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') || '' : '') ||
      env.geminiApiKey ||
      import.meta.env.VITE_GEMINI_API_KEY ||
      import.meta.env.GEMINI_API_KEY ||
      ''
    );
  }

  setApiKey(key: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gemini_api_key', key.trim());
    }
  }

  /**
   * Corrector y sintetizador protocolario local profundo de respaldo.
   * Corrige ortografía habitual, limpia redundancias y asegura que los acuerdos queden formalizados.
   */
  private formatAndSynthesizePuntosLocal(params: ImproveActaPuntosParams): PuntoAgendaItem[] {
    const { puntos } = params;

    const commonSpellingFixes: Record<string, string> = {
      'sesion': 'sesión',
      'sesiones': 'sesiones',
      'acta': 'acta',
      'comite': 'comité',
      'comision': 'comisión',
      'comisiones': 'comisiones',
      'asamblea': 'asamblea',
      'reunion': 'reunión',
      'reuniones': 'reuniones',
      'ordinaria': 'ordinaria',
      'extraordinaria': 'extraordinaria',
      'aprobacion': 'aprobación',
      'aprobado': 'aprobado',
      'quorun': 'quórum',
      'quorum': 'quórum',
      'presupuesto': 'presupuesto',
      'presuspuesto': 'presupuesto',
      'beneficiario': 'beneficiario',
      'donacion': 'donación',
      'donaciones': 'donaciones',
      'socio': 'socio',
      'socios': 'socios',
      'presidente': 'presidente',
      'secretario': 'secretario',
      'tesorero': 'tesorero',
      'mas': 'más',
      'tambien': 'también',
      'ademas': 'además',
      'despues': 'después',
      'estubo': 'estuvo',
      'hizo': 'hizo',
      'hiso': 'hizo',
      'desicion': 'decisión',
      'resolucion': 'resolución',
      'organizacion': 'organización',
      'actividad': 'actividad',
      'actividades': 'actividades'
    };

    const fixSpelling = (text: string): string => {
      let cleaned = text;
      Object.entries(commonSpellingFixes).forEach(([wrong, right]) => {
        const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
        cleaned = cleaned.replace(regex, (match) => {
          if (match[0] === match[0].toUpperCase()) {
            return right.charAt(0).toUpperCase() + right.slice(1);
          }
          return right;
        });
      });
      return cleaned;
    };

    return puntos.map((p, idx) => {
      let tema = fixSpelling((p.tema || `Punto de Agenda #${idx + 1}`).trim());
      if (tema.length > 0) {
        tema = tema.charAt(0).toUpperCase() + tema.slice(1);
      }

      let debate = fixSpelling((p.debate || '').trim());
      if (!debate && p.agendaContenido) {
        debate = `Se dio lectura y consideración a la propuesta presentada por ${p.socioSolicitante ? `el C.L. ${p.socioSolicitante}` : 'el socio proponente'}: "${p.agendaContenido}". Los miembros de la asamblea deliberaron sobre su viabilidad y conveniencia para los fines del club.`;
      } else if (!debate) {
        debate = `Los socios presentes procedieron al análisis y discusión del tema "${tema}", evaluando las distintas consideraciones pertinentes en beneficio de las obras del club.`;
      } else {
        // Asegurar que las menciones lleven C.L.
        debate = debate.replace(/\b([A-ZÁÉÍÓÚ][a-zñáéíóú]+ [A-ZÁÉÍÓÚ][a-zñáéíóú]+):/g, (match, name) => {
          if (!match.startsWith('C.L.')) {
            return `C.L. ${name}:`;
          }
          return match;
        });

        if (!debate.endsWith('.') && !debate.endsWith(';') && !debate.endsWith('!')) {
          debate = `${debate}.`;
        }
      }

      let acuerdo = fixSpelling((p.acuerdo || '').trim());
      if (!acuerdo || acuerdo.toLowerCase().includes('sin acuerdo') || acuerdo.length < 5) {
        const propuestoPor = p.socioSolicitante ? ` presentada por el C.L. ${p.socioSolicitante}` : '';
        acuerdo = `Por unanimidad de votos de los socios miembros presentes en la asamblea, se ACUERDA: Aprobar y respaldar la propuesta relativa a "${tema}"${propuestoPor}, encomendando a la Junta Directiva y a la comisión respectiva la ejecución, seguimiento y debido cumplimiento de lo resuelto.`;
      } else {
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
      return "Para usar la búsqueda con IA, configure una clave de API de Gemini válida en la configuración.";
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
   * Perfecciona, corrige ortografía y gramática a profundidad, formaliza la redacción y autocompleta/estructura
   * los puntos de agenda y acuerdos de un acta con estilo institucional Leonístico de alto nivel.
   */
  async improveAndFormatPuntosAgenda(params: ImproveActaPuntosParams): Promise<ImproveActaResult> {
    const apiKey = this.getApiKey();
    const { puntos, titulo, categoria } = params;

    if (!puntos || puntos.length === 0) {
      return { puntos: [], source: 'local' };
    }

    if (!apiKey) {
      console.warn("No se encontró API Key de Gemini. Ejecutando sintetizador protocolario local.");
      return {
        puntos: this.formatAndSynthesizePuntosLocal(params),
        source: 'local',
        error: 'NO_API_KEY'
      };
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `Eres el redactor oficial mayor y asesor de secretaría del Club de Leones de Quetzaltenango (Lions International).
Tu misión es realizar una CORRECCIÓN PROFUNDA, EXHAUSTIVA Y ESTILÍSTICA de los puntos de agenda para el acta oficial de la sesión "${categoria || 'Asamblea Ordinaria'}" titulada "${titulo || 'Sesión Ordinaria'}".

REGLAS ESTRICTAS DE CORRECCIÓN PROFUNDA:
1. ORTOGRAFÍA Y GRAMÁTICA RIGUROSA:
   - Corrige TODAS las faltas ortográficas, palabras mal escritas, erratas tipográficas, palabras incompletas o fuera de contexto.
   - Corrige la acentuación (tildes), signos de puntuación, mayúsculas y concordancia de género/número.
   - Si una palabra está mal escrita o parece un error de tipeo (ej. "presuspuesto" -> "presupuesto", "estubo" -> "estuvo", "hiso" -> "hizo"), corrígela inmediatamente al término correcto según el contexto.
2. TÍTULO / TEMA:
   - Redáctalo con mayúsculas y minúsculas formales, claro, sobrio y conciso.
3. DEBATE Y DISCUSIÓN (LENGUAJE PROTOCOLARIO LEONÍSTICO):
   - Transforma las notas coloquiales, apuntes rápidos o viñetas en una redacción formal solemne en tercera persona.
   - Si intervienen socios, mantén SIEMPRE su nombre precedido por el tratamiento leonístico "C.L. [Nombre del Socio]" (ej. "El C.L. Juan Pérez expuso... a lo cual el C.L. Mario Gómez secundó...").
   - Dale fluidez, solemnidad y coherencia sintáctica impecable.
4. ACUERDO / RESOLUCIÓN (OBLIGATORIO Y COMPLETO):
   - NUNCA devuelvas el campo "acuerdo" vacío, nulo o con la frase "Sin acuerdo".
   - Si el usuario no escribió un acuerdo o es muy breve (ej. "se aprobó"), deduce y redacta formalmente la resolución solemne adoptada por la asamblea (ej. "Por unanimidad de votos de los socios presentes en la asamblea, se ACUERDA: Aprobar la realización de... encomendando a la Junta Directiva y a la comisión respectiva el seguimiento y ejecución de lo acordado.").
   - Si ya venía un acuerdo redactado, perfecciona su estilo reglamentario institucional.
5. FORMATO DE RESPUESTA:
   - Debes responder ÚNICA Y EXCLUSIVAMENTE con un arreglo JSON válido con los mismos índices de puntos.

Estructura JSON esperada:
[
  {
    "tema": "Tema corregido y formal",
    "debate": "Redacción formal, fluida y corregida ortográficamente...",
    "acuerdo": "Por unanimidad de votos, se ACUERDA: ...",
    "socioSolicitante": "Nombre si aplica",
    "agendaContenido": "Propuesta si aplica"
  }
]`;

    const userContent = `Puntos de agenda a corregir y perfeccionar:

${JSON.stringify(puntos, null, 2)}

Devuelve únicamente el arreglo JSON con la corrección ortográfica profunda y redacción formal Leonística.`;

    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    let lastErrorMsg = '';

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: `${systemPrompt}\n\n${userContent}`,
          config: {
            temperature: 0.2,
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
          const formattedPoints = parsed.map((item, idx) => {
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

          return {
            puntos: formattedPoints,
            source: 'gemini'
          };
        }
      } catch (err: any) {
        lastErrorMsg = err?.message || String(err);
        console.warn(`Intento con ${modelName} falló:`, lastErrorMsg);
      }
    }

    console.warn("Fallo en llamada a Gemini API. Aplicando sintetizador protocolario local.");
    return {
      puntos: this.formatAndSynthesizePuntosLocal(params),
      source: 'local',
      error: lastErrorMsg || 'API_CALL_FAILED'
    };
  }
}

export const geminiService = new GeminiService();
