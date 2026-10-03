# Guía y Código de Google Apps Script: Integración de Gmail

Este script se instala en [script.google.com](https://script.google.com/) con la cuenta de Google institucional:
`clubdeleonesquetzaltenango@gmail.com`

Permite enviar correos automatizados con plantillas institucionales HTML, confirmaciones de pre-registro, comprobantes de pago con Entrada QR, recordatorios y comunicados masivos sin costo y con alta entregabilidad desde la propia bandeja de Gmail.

---

## Código del Script (`Código.gs`)

Copia y pega este código en el editor de Apps Script:

```javascript
/**
 * Google Apps Script Webhook - LXXV Convención Nacional Club de Leones Quetzaltenango
 * Envío de correos automáticos mediante GmailApp
 */

function doPost(e) {
  try {
    var rawData = e.postData ? e.postData.contents : null;
    if (!rawData) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "No data received" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var data = JSON.parse(rawData);
    var destinatario = data.email;
    var asunto = data.asunto || "LXXV Convención Nacional - Club de Leones Quetzaltenango";
    var mensajeTexto = data.mensajeBienvenida || "Gracias por comunicarte con el Club de Leones de Quetzaltenango.";
    var htmlBody = data.htmlBody || null;

    if (!destinatario) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Falta email destinatario" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Configuración de envío con GmailApp
    var options = {
      name: "Club de Leones Quetzaltenango",
      replyTo: "clubdeleonesquetzaltenango@gmail.com"
    };

    if (htmlBody) {
      options.htmlBody = htmlBody;
    }

    GmailApp.sendEmail(destinatario, asunto, mensajeTexto, options);

    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Correo enviado con éxito a " + destinatario }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log("Error enviando correo: " + error.toString());
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("Webhook de Gmail para LXXV Convención Nacional activo y listo.")
    .setMimeType(ContentService.MimeType.TEXT);
}
```

---

## Pasos para Implementar / Actualizar
1. Abre [script.google.com](https://script.google.com/) con `clubdeleonesquetzaltenango@gmail.com`.
2. Crea un **Nuevo proyecto** (o abre el existente de la Convención).
3. Pega el código de arriba.
4. Haz clic en **Implementar** > **Nueva implementación**.
5. Selecciona tipo: **Aplicación web**.
6. En *Ejecutar como*, selecciona: **Yo (clubdeleonesquetzaltenango@gmail.com)**.
7. En *Quién tiene acceso*, selecciona: **Cualquier usuario** (Even Anonymous).
8. Haz clic en **Implementar** y autoriza los permisos de envío de Gmail.
9. Copia la URL resultante (`https://script.google.com/macros/s/.../exec`) y configúrala en el Dashboard de la Convención en la pestaña de Configuración.
