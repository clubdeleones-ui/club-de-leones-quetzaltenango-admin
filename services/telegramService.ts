import { ConvencionRegistro } from '../types';

export const DEFAULT_GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwN-mwP87KpWN7AFjNL5W6bfi_Cc0h2RtZzufyOo15kHlEW-G_sRB7DSW2P1vJujV3V/exec';

/**
 * Servicio para envío de notificaciones automáticas mediante Telegram Bot API y Google Apps Script Webhook
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
    const token = botToken || (import.meta as any).env?.VITE_TELEGRAM_BOT_TOKEN;
    const targetChat = chatId || (import.meta as any).env?.VITE_TELEGRAM_CHAT_ID;

    if (!token || !targetChat) {
      return false;
    }

    const mensajeHtml = `
🦁 <b>¡NUEVA PRE-INSCRIPCIÓN A LA CONVENCIÓN!</b> 🦁

<b>Nombre:</b> ${registro.nombre}
<b>Club:</b> ${registro.club}
<b>Cargo:</b> ${registro.cargo}
<b>Email:</b> ${registro.email}
<b>Teléfono / Telegram:</b> ${registro.telefono}
${(registro as any).esAcompanante ? `<b>Acompañante de:</b> ${(registro as any).nombreTitular || 'N/A'}` : ''}
<b>Fecha de Registro:</b> ${new Date(registro.fechaRegistro).toLocaleString('es-GT')}

<i>Sistema Club de Leones Quetzaltenango</i>
    `.trim();

    return await telegramService.sendMessage(token, targetChat, mensajeHtml);
  },

  /**
   * Envía los datos del registro al Webhook de Google Apps Script para el envío automático del correo de confirmación.
   */
  sendGoogleScriptWebhook: async (
    registro: ConvencionRegistro, 
    customScriptUrl?: string,
    customWelcomeText?: string
  ): Promise<boolean> => {
    const scriptUrl = customScriptUrl || 
      (import.meta as any).env?.VITE_GOOGLE_SCRIPT_URL || 
      DEFAULT_GOOGLE_SCRIPT_URL;

    if (!scriptUrl) {
      console.warn("No se encontró la URL del Webhook de Google Apps Script.");
      return false;
    }

    const defaultMsg = "¡Bienvenido, Compañero León! Tu pre-inscripción a la Convención ha sido confirmada con éxito. A partir de este momento recibirás información oportuna de primera mano sobre los avances, actividades y beneficios tempranos por tu confirmación.";

    try {
      await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: registro.id,
          nombre: registro.nombre,
          email: registro.email,
          telefono: registro.telefono,
          club: registro.club,
          cargo: registro.cargo,
          distrito: registro.distrito,
          fechaRegistro: registro.fechaRegistro,
          asunto: "¡Bienvenido! Pre-Inscripción Confirmada - Convención Lionística Quetzaltenango",
          mensajeBienvenida: customWelcomeText || defaultMsg
        })
      });
      return true;
    } catch (error) {
      console.error("Error enviando webhook a Google Apps Script:", error);
      return false;
    }
  },

  /**
   * Envía un boletín/comunicado masivo por correo electrónico a la lista de inscritos.
   */
  sendBroadcastEmail: async (
    destinatarios: ConvencionRegistro[], 
    asunto: string, 
    mensajeBody: string, 
    customScriptUrl?: string
  ): Promise<number> => {
    const scriptUrl = customScriptUrl || 
      (import.meta as any).env?.VITE_GOOGLE_SCRIPT_URL || 
      DEFAULT_GOOGLE_SCRIPT_URL;

    if (!scriptUrl || destinatarios.length === 0) return 0;

    let enviados = 0;
    for (const reg of destinatarios) {
      try {
        await fetch(scriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: reg.id,
            nombre: reg.nombre,
            email: reg.email,
            telefono: reg.telefono,
            club: reg.club,
            cargo: reg.cargo,
            asunto: asunto,
            mensajeBienvenida: mensajeBody,
            esBoletinMasivo: true
          })
        });
        enviados++;
      } catch (e) {
        console.error("Error enviando boletín a " + reg.email, e);
      }
    }
    return enviados;
  }
};
