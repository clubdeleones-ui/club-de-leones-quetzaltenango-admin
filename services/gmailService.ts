import { ConvencionRegistro } from '../types';

export const DEFAULT_GMAIL_SENDER = 'clubdeleonesquetzaltenango@gmail.com';
export const DEFAULT_GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwN-mwP87KpWN7AFjNL5W6bfi_Cc0h2RtZzufyOo15kHlEW-G_sRB7DSW2P1vJujV3V/exec';

export type TipoCorreoConvencion = 
  | 'pre_registro' 
  | 'pago_confirmado' 
  | 'recordatorio_pago' 
  | 'info_sedes_hospedaje' 
  | 'personalizado';

export interface EmailTemplateData {
  asunto: string;
  cuerpoTexto: string;
  cuerpoHtml: string;
}

export const gmailService = {
  /**
   * Genera el enlace oficial directo para redactar en Gmail Web
   */
  getGmailComposeUrl: (params: { to: string; subject: string; body: string }): string => {
    const baseUrl = 'https://mail.google.com/mail/?view=cm&fs=1';
    const toParam = encodeURIComponent(params.to || '');
    const suParam = encodeURIComponent(params.subject || '');
    const bodyParam = encodeURIComponent(params.body || '');
    return `${baseUrl}&to=${toParam}&su=${suParam}&body=${bodyParam}`;
  },

  /**
   * Genera plantillas dinámicas formales leonísticas para cada etapa del registro
   */
  generateTemplate: (
    tipo: TipoCorreoConvencion, 
    registro: ConvencionRegistro, 
    extra?: { customSubject?: string; customBody?: string; customWelcomeText?: string }
  ): EmailTemplateData => {
    const webUrl = 'https://clubdeleonesquetzaltenango.org/#/convencion';
    const botUrl = 'https://t.me/ConvencionLeonesbot';
    const montoStr = `Q${(registro.montoPagar || 650).toLocaleString()}`;
    const paqueteStr = registro.paquete || 'Inscripción Convención';
    const nombre = registro.nombre || 'Estimado(a) Compañero(a) León';
    const club = registro.club || 'Club de Leones';
    const cargo = registro.cargo || 'Socio';
    const folio = registro.id || 'N/A';

    if (tipo === 'pago_confirmado') {
      const asunto = `🎟️ ¡Pago Confirmado y Entrada QR Oficial! - LXXV Convención Nacional Club de Leones (Folio: ${folio})`;
      const cuerpoTexto = `
¡Estimado(a) ${nombre}!

Nos complace informarte que tu pago para la LXXV CONVENCIÓN NACIONAL DE CLUBES DE LEONES - QUETZALTENANGO 2027 ha sido CONFIRMADO Y REGISTRADO EXITOSAMENTE.

DETALLES DE TU ACREDITACIÓN OFICIAL:
----------------------------------------
• Folio de Entrada: ${folio}
• Participante: ${nombre}
• Club: ${club}
• Cargo: ${cargo}
• Paquete: ${paqueteStr}
• Monto Pagado: ${montoStr}
• Estado: ACREDITADO / PAGADO OFICIAL

TU ENTRADA QR OFICIAL:
Puedes consultar, descargar y guardar tu Entrada QR oficial para el acceso a todas las sesiones y eventos aquí:
👉 ${webUrl} (Haz clic en "¿Ya te registraste? Encuentra tu Entrada QR Oficial" e ingresa tu correo ${registro.email} o folio ${folio})

CANAL DE TELEGRAM OFICIAL:
Únete a nuestro bot de Telegram para recibir alertas en tiempo real, mapas de sedes y agenda:
👉 ${botUrl}?start=qr_${folio}

¡Te esperamos con los brazos abiertos en la Ciudad de la Estrella, Quetzaltenango!

Comité Organizador LXXV Convención Nacional
Club de Leones Quetzaltenango
Correo: ${DEFAULT_GMAIL_SENDER}
      `.trim();

      const cuerpoHtml = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
  <div style="background: linear-gradient(135deg, #1e3a8a, #0f172a); padding: 32px 24px; text-align: center; color: #ffffff;">
    <h1 style="color: #fbbf24; margin: 0; font-size: 22px; font-weight: 900; letter-spacing: 0.5px;">LXXV CONVENCIÓN NACIONAL</h1>
    <p style="color: #93c5fd; margin: 6px 0 0 0; font-size: 13px; font-weight: 600;">Club de Leones Quetzaltenango 2027</p>
    <div style="margin-top: 14px; display: inline-block; background-color: #10b981; color: #ffffff; padding: 4px 14px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">
      ✅ Pago Confirmado & Acreditado
    </div>
  </div>

  <div style="padding: 28px 24px; color: #1e293b;">
    <p style="font-size: 16px; font-weight: 700; margin-top: 0;">¡Estimado(a) ${nombre}!</p>
    <p style="font-size: 14px; line-height: 1.6; color: #475569;">
      Confirmamos con gran alegría la recepción de tu pago para la LXXV Convención Nacional. Tu acreditación y cupo están plenamente asegurados.
    </p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0;">
      <h3 style="margin: 0 0 12px 0; font-size: 13px; color: #1e3a8a; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px;">Credencial de Acceso Oficial</h3>
      <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
        <tr><td style="padding: 4px 0; color: #64748b; font-weight: 600;">Folio:</td><td style="padding: 4px 0; font-weight: 700; font-family: monospace; color: #0f172a;">${folio}</td></tr>
        <tr><td style="padding: 4px 0; color: #64748b; font-weight: 600;">Participante:</td><td style="padding: 4px 0; font-weight: 700; color: #0f172a;">${nombre}</td></tr>
        <tr><td style="padding: 4px 0; color: #64748b; font-weight: 600;">Club:</td><td style="padding: 4px 0; color: #0f172a;">${club}</td></tr>
        <tr><td style="padding: 4px 0; color: #64748b; font-weight: 600;">Cargo:</td><td style="padding: 4px 0; color: #0f172a;">${cargo}</td></tr>
        <tr><td style="padding: 4px 0; color: #64748b; font-weight: 600;">Paquete:</td><td style="padding: 4px 0; font-weight: 700; color: #b45309;">${paqueteStr}</td></tr>
        <tr><td style="padding: 4px 0; color: #64748b; font-weight: 600;">Monto:</td><td style="padding: 4px 0; font-weight: 800; color: #15803d;">${montoStr}</td></tr>
      </table>
    </div>

    <div style="text-align: center; margin: 26px 0;">
      <a href="${webUrl}" style="background: #1e3a8a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 800; font-size: 13px; display: inline-block; box-shadow: 0 4px 10px rgba(30, 58, 138, 0.2);">
        🎟️ Ver y Descargar Mi Entrada QR Oficial
      </a>
    </div>

    <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 8px; margin-top: 20px; font-size: 12px; color: #1e40af;">
      <strong>¿Telegram Activo?</strong> Conéctate a nuestro bot oficial <a href="${botUrl}" style="color: #2563eb; font-weight: bold;">@ConvencionLeonesbot</a> para recibir itinerarios en vivo y novedades de primera mano.
    </div>

    <p style="font-size: 12px; color: #94a3b8; margin-top: 28px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 16px;">
      Club de Leones Quetzaltenango • Donde la Amistad se Vuelve Servicio<br/>
      Contacto: <a href="mailto:${DEFAULT_GMAIL_SENDER}" style="color: #64748b;">${DEFAULT_GMAIL_SENDER}</a>
    </p>
  </div>
</div>
      `.trim();

      return { asunto, cuerpoTexto, cuerpoHtml };
    }

    if (tipo === 'recordatorio_pago') {
      const asunto = `⏳ Recordatorio: Completa tu Pago para la LXXV Convención Nacional (Folio: ${folio})`;
      const cuerpoTexto = `
¡Estimado(a) ${nombre}!

Te recordamos que tu pre-registro a la LXXV CONVENCIÓN NACIONAL DE CLUBES DE LEONES - QUETZALTENANGO 2027 se encuentra registrado con estatus PENDIENTE DE PAGO.

RESUMEN DE REGISTRO:
----------------------------------------
• Folio: ${folio}
• Paquete Seleccionado: ${paqueteStr}
• Monto Total: ${montoStr}
• Club: ${club}

MÉTODOS DE PAGO DISPONIBLES:
1. Transferencia Bancaria Directa:
   - Banco Industrial: Cuenta Monetaria No. 018-009876-5 (Club de Leones Quetzaltenango)
   - Banco G&T Continental: Cuenta Monetaria No. 066-001234-9 (Club de Leones Quetzaltenango)
   (Favor enviar tu boleta por WhatsApp o a este correo electrónico indicando tu folio ${folio}).

2. Pago con Tarjeta de Crédito/Débito en Línea:
   Puedes generar tu pago seguro en línea desde la página oficial:
   👉 ${webUrl}

¡Asegura tu lugar con tarifa temprana antes del cierre de cupos!

Comité Organizador LXXV Convención Nacional
Club de Leones Quetzaltenango
Correo: ${DEFAULT_GMAIL_SENDER}
      `.trim();

      const cuerpoHtml = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #1e3a8a, #0f172a); padding: 28px 24px; text-align: center; color: #ffffff;">
    <h1 style="color: #fbbf24; margin: 0; font-size: 20px; font-weight: 900;">LXXV CONVENCIÓN NACIONAL</h1>
    <p style="color: #93c5fd; margin: 4px 0 0 0; font-size: 13px;">Club de Leones Quetzaltenango</p>
    <div style="margin-top: 12px; display: inline-block; background-color: #f59e0b; color: #ffffff; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase;">
      ⏳ Pendiente de Pago
    </div>
  </div>

  <div style="padding: 24px; color: #1e293b;">
    <p style="font-size: 15px; font-weight: 700;">¡Hola, ${nombre}!</p>
    <p style="font-size: 13px; line-height: 1.6; color: #475569;">
      Te recordamos amablemente que tu lugar para la Convención Nacional está reservado bajo el folio <strong>${folio}</strong>. Para completar tu acreditación oficial y recibir tu código QR definitivo, puedes realizar tu pago de <strong>${montoStr}</strong> mediante:
    </p>

    <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 16px; margin: 18px 0; font-size: 13px;">
      <strong style="color: #92400e;">Opciones de Pago:</strong>
      <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #78350f; line-height: 1.6;">
        <li><strong>Banco Industrial:</strong> Cuenta Monetaria No. 018-009876-5</li>
        <li><strong>Banco G&T Continental:</strong> Cuenta Monetaria No. 066-001234-9</li>
        <li><strong>En línea con Tarjeta:</strong> Directamente en la plataforma web</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 22px 0;">
      <a href="${webUrl}" style="background: #d97706; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 800; font-size: 13px; display: inline-block;">
        Pagar o Reportar Boleta en Línea
      </a>
    </div>

    <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px;">
      Club de Leones Quetzaltenango • ${DEFAULT_GMAIL_SENDER}
    </p>
  </div>
</div>
      `.trim();

      return { asunto, cuerpoTexto, cuerpoHtml };
    }

    if (tipo === 'info_sedes_hospedaje') {
      const asunto = `🏨 Guía de Sedes, Hospedaje y Clima - LXXV Convención Nacional Quetzaltenango`;
      const cuerpoTexto = `
¡Estimado(a) Compañero(a) León ${nombre}!

Nos complace compartir contigo la información logística clave para tu estadía en Quetzaltenango durante la LXXV Convención Nacional:

SEDE PRINCIPAL:
• Centro de Convenciones Los Altos / Gran Karmel, Quetzaltenango.
• Parqueo privado con seguridad para delegaciones.

HOTELES CON TARIFA ESPECIAL LEONÍSTICA:
• Hotel Pension Bonifaz (Parque Central) - Código descuento: LIONS2027
• Hotel Latam Plaza Pradera Xela - Código descuento: CONVENCIONLEONES
• Hotel Villa Real Plaza - Código descuento: LEONISMOXELA

RECOMENDACIONES DE VESTIMENTA Y CLIMA:
• Clima de Quetzaltenango: Templado durante el día (18°C - 22°C) y fresco por las noches (8°C - 12°C).
• Se sugiere ropa abrigada para eventos nocturnos y traje formal leonístico para la Cena de Gala.

Consulta el programa completo y actualizaciones:
👉 ${webUrl}

Fraternalmente,
Comité de Hospedaje y Logística
Club de Leones Quetzaltenango
      `.trim();

      const cuerpoHtml = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #1e3a8a, #0f172a); padding: 26px 20px; text-align: center; color: #ffffff;">
    <h1 style="color: #fbbf24; margin: 0; font-size: 20px; font-weight: 900;">GUÍA DE SEDES Y HOSPEDAJE</h1>
    <p style="color: #93c5fd; margin: 4px 0 0 0; font-size: 12px;">LXXV Convención Nacional • Quetzaltenango 2027</p>
  </div>
  <div style="padding: 24px; color: #1e293b; font-size: 13px; line-height: 1.6;">
    <p style="font-weight: bold; font-size: 15px;">¡Estimado(a) ${nombre}!</p>
    <p style="color: #475569;">Compartimos las tarifas especiales de hoteles aliados y detalles de la sede principal para tu comodidad:</p>
    
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; margin: 16px 0;">
      <strong style="color: #1e3a8a;">Hoteles con Convenio Oficial:</strong>
      <ul style="margin: 6px 0 0 0; padding-left: 18px; color: #334155;">
        <li><strong>Hotel Pension Bonifaz</strong> (Centro Histórico) • Código: <code>LIONS2027</code></li>
        <li><strong>Hotel Latam Xela</strong> (Zona Pradera) • Código: <code>CONVENCIONLEONES</code></li>
        <li><strong>Hotel Villa Real Plaza</strong> • Código: <code>LEONISMOXELA</code></li>
      </ul>
    </div>

    <div style="text-align: center; margin: 20px 0;">
      <a href="${webUrl}" style="background: #1e3a8a; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; font-size: 13px; display: inline-block;">
        Ver Agenda y Mapa de Sedes
      </a>
    </div>
  </div>
</div>
      `.trim();

      return { asunto, cuerpoTexto, cuerpoHtml };
    }

    if (tipo === 'personalizado') {
      const asunto = extra?.customSubject || `Aviso Oficial Convención Leones - ${nombre}`;
      const cuerpoTexto = extra?.customBody || `Estimado(a) ${nombre},\n\nNos comunicamos del Club de Leones de Quetzaltenango.`;
      const cuerpoHtml = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #1e3a8a, #0f172a); padding: 24px; text-align: center; color: #ffffff;">
    <h2 style="color: #fbbf24; margin: 0; font-size: 18px; font-weight: 900;">COMUNICADO OFICIAL</h2>
    <p style="color: #93c5fd; margin: 4px 0 0 0; font-size: 12px;">Club de Leones Quetzaltenango</p>
  </div>
  <div style="padding: 24px; color: #1e293b; font-size: 14px; line-height: 1.6;">
    <p style="white-space: pre-wrap; color: #334155;">${cuerpoTexto}</p>
    <p style="font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px;">
      Club de Leones Quetzaltenango • ${DEFAULT_GMAIL_SENDER}
    </p>
  </div>
</div>
      `.trim();
      return { asunto, cuerpoTexto, cuerpoHtml };
    }

    // Default: 'pre_registro'
    const defaultWelcome = extra?.customWelcomeText || 
      "¡Bienvenido, Compañero León! Tu pre-inscripción a la Convención ha sido confirmada con éxito. A partir de este momento recibirás información oportuna de primera mano sobre los avances, actividades y beneficios tempranos por tu confirmación.";

    const asunto = `🦁 Confirmación de Pre-Inscripción: LXXV Convención Nacional (Folio: ${folio})`;
    const cuerpoTexto = `
¡Estimado(a) ${nombre}!

${defaultWelcome}

RESUMEN DE REGISTRO:
----------------------------------------
• Folio: ${folio}
• Participante: ${nombre}
• Club: ${club}
• Cargo: ${cargo}
• Paquete: ${paqueteStr}
• Monto a Pagar: ${montoStr}
• Estado: ${registro.estadoPago || 'Pendiente'}

CONSULTA TU ENTRADA QR:
Puedes consultar el estado de tu inscripción y acceder a tu credencial con código QR en cualquier momento desde nuestra plataforma oficial:
👉 ${webUrl} (Opción: "¿Ya te registraste? Encuentra tu Entrada QR Oficial")

COMUNIDAD EN TELEGRAM:
Te invitamos a sumarte a nuestro canal en Telegram para recibir alertas en vivo:
👉 ${botUrl}?start=qr_${folio}

Comité Organizador LXXV Convención Nacional
Club de Leones Quetzaltenango
Correo Oficial: ${DEFAULT_GMAIL_SENDER}
    `.trim();

    const cuerpoHtml = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #1e3a8a, #0f172a); padding: 30px 24px; text-align: center; color: #ffffff;">
    <h1 style="color: #fbbf24; margin: 0; font-size: 21px; font-weight: 900;">LXXV CONVENCIÓN NACIONAL</h1>
    <p style="color: #93c5fd; margin: 4px 0 0 0; font-size: 13px;">Club de Leones Quetzaltenango 2027</p>
    <div style="margin-top: 12px; display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase;">
      🦁 Pre-Inscripción Registrada
    </div>
  </div>

  <div style="padding: 24px; color: #1e293b;">
    <p style="font-size: 15px; font-weight: 700; margin-top: 0;">¡Estimado(a) ${nombre}!</p>
    <p style="font-size: 13px; line-height: 1.6; color: #475569;">
      ${defaultWelcome}
    </p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 18px 0;">
      <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
        <tr><td style="padding: 4px 0; color: #64748b; font-weight: 600;">Folio:</td><td style="padding: 4px 0; font-weight: 700; font-family: monospace;">${folio}</td></tr>
        <tr><td style="padding: 4px 0; color: #64748b; font-weight: 600;">Club:</td><td style="padding: 4px 0;">${club} (${cargo})</td></tr>
        <tr><td style="padding: 4px 0; color: #64748b; font-weight: 600;">Paquete:</td><td style="padding: 4px 0; font-weight: 700; color: #b45309;">${paqueteStr}</td></tr>
        <tr><td style="padding: 4px 0; color: #64748b; font-weight: 600;">Monto:</td><td style="padding: 4px 0; font-weight: 800; color: #1e3a8a;">${montoStr}</td></tr>
      </table>
    </div>

    <div style="text-align: center; margin: 24px 0;">
      <a href="${webUrl}" style="background: #1e3a8a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 800; font-size: 13px; display: inline-block;">
        Ver Mi Entrada QR Oficial
      </a>
    </div>

    <p style="font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 16px;">
      Club de Leones Quetzaltenango • ${DEFAULT_GMAIL_SENDER}
    </p>
  </div>
</div>
    `.trim();

    return { asunto, cuerpoTexto, cuerpoHtml };
  },

  /**
   * Envía un correo automático vía Google Apps Script Webhook (desde clubdeleonesquetzaltenango@gmail.com)
   */
  sendRegistrationEmail: async (
    registro: ConvencionRegistro, 
    tipo: TipoCorreoConvencion = 'pre_registro',
    extra?: { customSubject?: string; customBody?: string; customWelcomeText?: string },
    customScriptUrl?: string
  ): Promise<boolean> => {
    const scriptUrl = customScriptUrl || 
      (import.meta as any).env?.VITE_GOOGLE_SCRIPT_URL || 
      DEFAULT_GOOGLE_SCRIPT_URL;

    if (!scriptUrl) {
      console.warn("No hay URL de Google Apps Script configurada para el envío de correos.");
      return false;
    }

    if (!registro.email || !registro.email.includes('@')) {
      console.warn("Correo del destinatario no válido:", registro.email);
      return false;
    }

    const template = gmailService.generateTemplate(tipo, registro, extra);

    try {
      await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send_email',
          tipo: tipo,
          id: registro.id,
          nombre: registro.nombre,
          email: registro.email,
          telefono: registro.telefono,
          club: registro.club,
          cargo: registro.cargo,
          distrito: registro.distrito,
          monto: registro.montoPagar,
          estadoPago: registro.estadoPago,
          fechaRegistro: registro.fechaRegistro,
          asunto: template.asunto,
          mensajeBienvenida: template.cuerpoTexto,
          htmlBody: template.cuerpoHtml
        })
      });
      return true;
    } catch (error) {
      console.error("Error enviando correo vía Google Apps Script:", error);
      return false;
    }
  },

  /**
   * Envía un correo de prueba para validar el webhook de Google Apps Script
   */
  sendTestEmail: async (toEmail: string, customScriptUrl?: string): Promise<boolean> => {
    const scriptUrl = customScriptUrl || 
      (import.meta as any).env?.VITE_GOOGLE_SCRIPT_URL || 
      DEFAULT_GOOGLE_SCRIPT_URL;

    if (!scriptUrl || !toEmail) return false;

    const fechaHora = new Date().toLocaleString('es-GT');
    const asunto = `🧪 Prueba de Conexión Gmail - Club de Leones Quetzaltenango (${fechaHora})`;
    const cuerpo = `Hola,\n\nEste es un correo de prueba enviado automáticamente desde la plataforma administrativa de la Convención mediante Google Apps Script y Gmail (${DEFAULT_GMAIL_SENDER}).\n\nFecha y hora del test: ${fechaHora}\n\n¡La integración con Gmail está funcionando correctamente!`;

    try {
      await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_connection',
          email: toEmail,
          asunto: asunto,
          mensajeBienvenida: cuerpo,
          htmlBody: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 500px;">
              <h2 style="color: #1e3a8a; margin-top: 0;">🦁 Integración con Gmail Exitosa</h2>
              <p style="color: #334155; font-size: 14px;">Este es un correo de prueba del sistema de la <strong>LXXV Convención Nacional</strong>.</p>
              <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; padding: 12px; border-radius: 8px; font-size: 13px;">
                ✅ Conexión con Gmail verificada correctamente: <strong>${toEmail}</strong>
              </div>
              <p style="color: #94a3b8; font-size: 11px; margin-top: 16px;">Hora del test: ${fechaHora}</p>
            </div>
          `
        })
      });
      return true;
    } catch (e) {
      console.error("Error en test de Gmail:", e);
      return false;
    }
  },

  /**
   * Envío masivo de boletines o comunicados informativos
   */
  sendMassBroadcast: async (
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
      if (!reg.email || !reg.email.includes('@')) continue;
      try {
        const template = gmailService.generateTemplate('personalizado', reg, {
          customSubject: asunto,
          customBody: mensajeBody
        });

        await fetch(scriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'broadcast_email',
            id: reg.id,
            nombre: reg.nombre,
            email: reg.email,
            telefono: reg.telefono,
            club: reg.club,
            cargo: reg.cargo,
            asunto: template.asunto,
            mensajeBienvenida: template.cuerpoTexto,
            htmlBody: template.cuerpoHtml,
            esBoletinMasivo: true
          })
        });
        enviados++;
      } catch (e) {
        console.error("Error enviando correo masivo a " + reg.email, e);
      }
    }
    return enviados;
  }
};
