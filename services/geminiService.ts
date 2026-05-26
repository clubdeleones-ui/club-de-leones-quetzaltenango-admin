
import { GoogleGenAI } from "@google/genai";
import { Acta } from "../types";

export class GeminiService {
  /**
   * Summarizes club minutes based on a user query using Gemini AI.
   * Creates a fresh GoogleGenAI instance for each request to ensure the latest API key is used.
   */
  async summarizeActas(actas: Acta[], query: string): Promise<string> {
    // API key is handled via Vite environment variables
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || '';
    const ai = new GoogleGenAI({ apiKey });

    const context = actas.map(a => `Fecha: ${a.fecha} - Título: ${a.titulo}: ${a.contenido}`).join("\n\n");
    
    try {
      // Use gemini-3-flash-preview for basic text tasks like summarization
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Eres un asistente administrativo del Club de Leones de Quetzaltenango. 
        Basado en las siguientes actas de reuniones:
        
        ${context}
        
        Responde a la siguiente consulta del socio de forma precisa y amable: ${query}`,
        config: {
          temperature: 0.7,
        }
      });

      // The .text property directly returns the extracted string output.
      return response.text || "No se pudo generar una respuesta.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Hubo un error al procesar tu búsqueda inteligente.";
    }
  }
}

export const geminiService = new GeminiService();
