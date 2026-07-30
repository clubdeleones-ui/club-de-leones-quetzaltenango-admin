import { ConvencionRegistro } from '../types';

/**
 * Servicio para envío de notificaciones automáticas mediante Telegram Bot API (100% Gratuito)
 */
export const telegramService = {
  /**
   * Envía un mensaje en formato HTML a un grupo o chat ID de Telegram usando el bot configurado.
   */
  sendMessage: async (botToken: string, chatId: string, text: string): Promise<boolean> => {
    if (!botToken || !chatId) {
      console.warn("Telegram Bot Token o Chat ID no configurados. Omitiendo envío de Telegram.");
      return false;
    }

    try {
      const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'HTML',
          disable_web_page_preview: true
        })
      });

      const data = await response.json();
      if (!data.ok) {
        console.error("Error al enviar mensaje de Telegram:", data);
        return false;
      }
      return true;
    } catch (error) {
      console.error("Excepción en telegramService.sendMessage:", error);
      return false;
    }
  },

  /**
   * Notifica una nueva inscripción a la Convención en el grupo de Telegram del comité organizador.
   */
  notifyNuevaInscripcionConvencion: async (
    registro: ConvencionRegistro, 
    botToken?: string, 
    chatId?: string
  ): Promise<boolean> => {
    // Si no se proporciona token específico, intenta usar variables de entorno o valores por defecto
    const token = botToken || (import.meta as any).env?.VITE_TELEGRAM_BOT_TOKEN;
    const targetChat = chatId || (import.meta as any).env?.VITE_TELEGRAM_CHAT_ID;

    if (!token || !targetChat) {
      return false;
    }

    const mensajeHtml = `
🦁 <b>¡NUEVA INSCRIPCIÓN A LA CONVENCIÓN!</b> 🦁

<b>Nombre:</b> ${registro.nombre}
<b>Club:</b> ${registro.club}
<b>Cargo:</b> ${registro.cargo}
<b>Email:</b> ${registro.email}
<b>Teléfono / Telegram:</b> ${registro.telefono}
${registro.esAcompanante ? `<b>Es Acompañante de:</b> ${registro.nombreTitular || 'N/A'}` : ''}
<b>Fecha de Registro:</b> ${new Date(registro.fechaRegistro).toLocaleString('es-GT')}

<i>Notificación automática del Sistema Club de Leones Quetzaltenango</i>
    `.trim();

    return await telegramService.sendMessage(token, targetChat, mensajeHtml);
  }
};
