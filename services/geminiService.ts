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

/**
 * Limpia y normaliza el tratamiento "C.L." (Compañero León)
 * eliminando duplicados consecutivos y eliminando C.L. que hayan quedado intercalados entre nombres y apellidos.
 */
export const cleanAndDeduplicateCL = (text: string): string => {
  if (!text) return text;
  let cleaned = text;

  // 1. Eliminar C.L. duplicados consecutivos (ej. "C.L. C.L. Juan", "C.L. C.L. C.L.")
  cleaned = cleaned.replace(/(?:(?:\bC\.L\.|\bCL\b|\bC\.L\b|Compañero León)\s*){2,}/gi, 'C.L. ');

  // 2. Eliminar C.L. intercalados erróneamente entre nombres y apellidos (ej. "Edwin C.L. Pacheco", "Juan C.L. Carlos")
  cleaned = cleaned.replace(/(\b[A-ZÁÉÍÓÚ][a-zñáéíóú]+)\s+C\.L\.\s+([A-ZÁÉÍÓÚ][a-zñáéíóú]+)/g, '$1 $2');
  cleaned = cleaned.replace(/(\b[A-ZÁÉÍÓÚ][a-zñáéíóú]+)\s+C\.L\.\s+([A-ZÁÉÍÓÚ][a-zñáéíóú]+)/g, '$1 $2');

  // 3. Normalizar espacios después de C.L.
  cleaned = cleaned.replace(/\bC\.L\.\s+/g, 'C.L. ');

  // 4. Limpieza de posibles "C.L. :" o "C.L.:" sueltos
  cleaned = cleaned.replace(/\bC\.L\.\s*:\s*/g, '');

  return cleaned.trim();
};

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
   * Corrige ortografía habitual, limpia redundancias y asegura que los acuerdos queden formalizados sin duplicar C.L.
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
      return cleanAndDeduplicateCL(cleaned);
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
        debate = cleanAndDeduplicateCL(debate);
        if (!debate.endsWith('.') && !debate.endsWith(';') && !debate.endsWith('!')) {
          debate = `${debate}.`;
        }
      }

      let acuerdo = fixSpelling((p.acuerdo || '').trim());
      if (!acuerdo || acuerdo.toLowerCase().includes('sin acuerdo') || acuerdo.length < 5) {
        const cleanSocio = p.socioSolicitante ? p.socioSolicitante.replace(/^C\.L\.\s*/i, '').trim() : '';
        const propuestoPor = cleanSocio ? ` presentada por el C.L. ${cleanSocio}` : '';
        acuerdo = `Por unanimidad de votos de los socios miembros presentes en la asamblea, se ACUERDA: Aprobar y respaldar la propuesta relativa a "${tema}"${propuestoPor}, encomendando a la Junta Directiva y a la comisión respectiva la ejecución, seguimiento y debido cumplimiento de lo resuelto.`;
      } else {
        if (!acuerdo.toLowerCase().includes('acuerda') && !acuerdo.toLowerCase().includes('resuelve') && !acuerdo.toLowerCase().includes('por unanimidad')) {
          acuerdo = `Por decisión de la asamblea de socios, se ACUERDA: ${acuerdo.charAt(0).toUpperCase() + acuerdo.slice(1)}`;
        }
        acuerdo = cleanAndDeduplicateCL(acuerdo);
        if (!acuerdo.endsWith('.') && !acuerdo.endsWith(';')) {
          acuerdo = `${acuerdo}.`;
        }
      }

      return {
        tema,
        debate: cleanAndDeduplicateCL(debate),
        acuerdo: cleanAndDeduplicateCL(acuerdo),
        socioSolicitante: p.socioSolicitante ? p.socioSolicitante.replace(/^C\.L\.\s*/i, '').trim() : undefined,
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
2. REGLA ESTRICTA DE TRATAMIENTO LEONÍSTICO (C.L.):
   - El prefijo "C.L." (Compañero León) se coloca ÚNICAMENTE UNA SOLA VEZ antes del nombre completo de cada socio (ejemplo correcto: "C.L. Edwin Ernesto Pacheco López:").
   - ESTÁ ESTRICTAMENTE PROHIBIDO colocar "C.L." entre nombres y apellidos (incorrecto: "Edwin C.L. Pacheco" o "Juan C.L. Carlos Gómez").
   - ESTÁ ESTRICTAMENTE PROHIBIDO duplicar "C.L. C.L.".
   - Si el texto original ya tiene "C.L." o "Compañero León" o repeticiones, unifícalo a un único "C.L. [Nombre y Apellidos]".
3. TÍTULO / TEMA:
   - Redáctalo con mayúsculas y minúsculas formales, claro, sobrio y conciso.
4. DEBATE Y DISCUSIÓN (LENGUAJE PROTOCOLARIO LEONÍSTICO):
   - Transforma las notas coloquiales, apuntes rápidos o viñetas en una redacción formal solemne en tercera persona.
   - Dale fluidez, solemnidad y coherencia sintáctica impecable.
5. ACUERDO / RESOLUCIÓN (OBLIGATORIO Y COMPLETO):
   - NUNCA devuelvas el campo "acuerdo" vacío, nulo o con la frase "Sin acuerdo".
   - Si el usuario no escribió un acuerdo o es muy breve (ej. "se aprobó"), deduce y redacta formalmente la resolución solemne adoptada por la asamblea (ej. "Por unanimidad de votos de los socios presentes en la asamblea, se ACUERDA: Aprobar la realización de... encomendando a la Junta Directiva y a la comisión respectiva el seguimiento y ejecución de lo acordado.").
   - Si ya venía un acuerdo redactado, perfecciona su estilo reglamentario institucional.
6. FORMATO DE RESPUESTA:
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
            const itemTema = cleanAndDeduplicateCL(String(item.tema || original.tema || `Punto #${idx + 1}`).trim());
            const itemDebate = cleanAndDeduplicateCL(String(item.debate || original.debate || '').trim());
            let itemAcuerdo = cleanAndDeduplicateCL(String(item.acuerdo || original.acuerdo || '').trim());

            if (!itemAcuerdo || itemAcuerdo.toLowerCase().includes('sin acuerdo')) {
              itemAcuerdo = `Por unanimidad de votos de los socios miembros de la asamblea, se ACUERDA: Aprobar y dar curso a lo deliberado sobre "${itemTema}", encomendando a la directiva su debido seguimiento y ejecución.`;
            }

            return {
              tema: itemTema,
              debate: itemDebate,
              acuerdo: itemAcuerdo,
              socioSolicitante: item.socioSolicitante ? cleanAndDeduplicateCL(item.socioSolicitante).replace(/^C\.L\.\s*/i, '') : original.socioSolicitante,
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

  /**
   * Reconoce placa de circulación y color de vehículo a partir de una imagen (Base64 JPEG/PNG)
   * utilizando Gemini Vision con fallback a múltiples modelos para máxima disponibilidad.
   */
  async recognizeLicensePlate(base64Image: string): Promise<LicensePlateRecognitionResult> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return {
        success: false,
        error: 'NO_API_KEY'
      };
    }

    // Limpiar data URL si viene con data:image/...;base64,
    let mimeType = 'image/jpeg';
    let cleanBase64 = base64Image;
    if (base64Image.includes(';base64,')) {
      const parts = base64Image.split(';base64,');
      cleanBase64 = parts[1];
      const mimeMatch = parts[0].match(/data:(image\/[a-zA-Z+]+)/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
      }
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Analiza detalladamente esta fotografía de un vehículo tomada en el parqueo del Club de Leones de Quetzaltenango, Guatemala.
Tu objetivo es identificar la placa de circulación y el color de la carrocería del vehículo.

REGLAS PARA GUATEMALA:
1. Prefijo de tipo de placa:
   - 'P' (Particular / automóvil personal)
   - 'C' (Comercial / pick-up o camión de carga)
   - 'M' (Motocicleta)
   - 'A' (Alquiler / taxi)
   - 'O' (Oficial de gobierno)
   - 'CD' (Cuerpo Diplomático)
   - 'Extranjera' (si la placa es de México, El Salvador u otro país)
2. Formato del número de placa:
   - En automóviles suele tener 3 números seguidos de 3 letras (ejemplo: 123ABC).
   - En motocicletas puede tener 3 o 4 números y 2 o 3 letras.
   - En placas oficiales suele tener números (ejemplo: 12345).
   - En 'numeroPlaca' coloca ÚNICAMENTE los números y letras de la placa, SIN el prefijo de tipo si ya fue extraído en 'tipoPlaca', y SIN guiones ni espacios.
3. Color del vehículo:
   - Debe coincidir EXACTAMENTE con una de las siguientes opciones de la paleta oficial:
     ["Blanco", "Negro", "Gris / Plata", "Rojo", "Azul", "Amarillo", "Verde", "Café", "Beige", "Naranja", "Corinto", "Azul Marino"]
4. Si la imagen no muestra un vehículo con placa legible, devuelve "placaLegible": false.

Responde ÚNICAMENTE con un JSON válido con esta estructura:
{
  "placaLegible": true,
  "tipoPlaca": "P",
  "numeroPlaca": "123ABC",
  "color": "Gris / Plata",
  "esExtranjera": false,
  "confianza": 0.95
}`;

    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    let lastError = '';

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              inlineData: {
                mimeType,
                data: cleanBase64
              }
            },
            prompt
          ],
          config: {
            temperature: 0.1,
            responseMimeType: "application/json"
          }
        });

        const text = response.text || '';
        let jsonStr = text.trim();
        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
          jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }

        const parsed = JSON.parse(jsonStr);
        if (parsed.placaLegible === false || !parsed.numeroPlaca) {
          return {
            success: false,
            error: 'PLACA_NO_LEGIBLE'
          };
        }

        return {
          success: true,
          tipoPlaca: parsed.tipoPlaca || 'P',
          numeroPlaca: String(parsed.numeroPlaca).toUpperCase().replace(/[\s-]/g, ''),
          color: parsed.color || 'Blanco',
          esExtranjera: Boolean(parsed.esExtranjera || parsed.tipoPlaca === 'Extranjera'),
          confianza: typeof parsed.confianza === 'number' ? parsed.confianza : 0.9
        };
      } catch (err: any) {
        lastError = err?.message || String(err);
        console.warn(`Intento recognizeLicensePlate con ${model} falló:`, lastError);
      }
    }

    return {
      success: false,
      error: lastError || 'NETWORK_OR_API_ERROR'
    };
  }
}

export interface LicensePlateRecognitionResult {
  success: boolean;
  tipoPlaca?: string;
  numeroPlaca?: string;
  color?: string;
  esExtranjera?: boolean;
  confianza?: number;
  error?: string;
}

export const geminiService = new GeminiService();
