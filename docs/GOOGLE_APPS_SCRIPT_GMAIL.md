# Backend Serverless: Google Apps Script (Gmail + Pasarela CyberSource / BAC)

Este script se instala en [script.google.com](https://script.google.com/) con la cuenta oficial:
`convencionleones27@gmail.com`

Cumple una doble función fundamental sin costos de infraestructura:
1. **Envío de correos oficiales mediante Gmail**: Notificaciones, confirmaciones de pre-registro, comprobantes de pago con Entrada QR y recordatorios masivos.
2. **Proxy Seguro para CyberSource / BAC Credomatic con 3D Secure 2.x**:
   - Resuelve las restricciones de CORS del navegador.
   - Realiza la firma criptográfica obligatoria HMAC-SHA256 del estándar de CyberSource en servidor.
   - Protege el `Shared Secret Key` para que jamás quede expuesto en el frontend del cliente.

---

## Código del Script (`Código.gs`)

Copia y pega este código en el editor de Apps Script reemplazando el contenido actual:

```javascript
/**
 * Backend Webhook Oficial: Club de Leones Quetzaltenango
 * Servicios integrados:
 * 1. Envío de correos por GmailApp (Entradas QR y confirmaciones)
 * 2. Pasarela de Pagos CyberSource / BAC Credomatic con protocolo 3D Secure 2.x
 */

// Credenciales por defecto de CyberSource BAC Sandbox
var DEFAULT_MERCHANT_ID = "test_bac_gt_clubdeleonesdeqtng";
var DEFAULT_KEY_ID = "e8791aa5-4287-49f7-a74d-619f9be36ccb";
var DEFAULT_SHARED_SECRET = "AJa07UXrBul2OIm5zm8q8xeS7Um2bd+4/PAYyLRTLFY=";

function doPost(e) {
  try {
    var rawData = e.postData ? e.postData.contents : null;
    if (!rawData) {
      return responseJson({ status: "error", message: "No se recibieron datos en la solicitud" });
    }

    var data = JSON.parse(rawData);

    // ========================================================
    // CASO 1: PROCESAMIENTO DE PAGO CYBERSOURCE / BAC (3DS)
    // ========================================================
    if (data.action === "cybersource_3ds_payment") {
      return handleCyberSourcePayment(data);
    }

    // ========================================================
    // CASO 2: ENVÍO DE CORREOS AUTOMÁTICOS (GMAIL)
    // ========================================================
    var destinatario = data.email;
    var asunto = data.asunto || "LXXV Convención Nacional - Club de Leones Quetzaltenango";
    var mensajeTexto = data.mensajeBienvenida || "Gracias por comunicarte con el Club de Leones de Quetzaltenango.";
    var htmlBody = data.htmlBody || null;

    if (!destinatario) {
      return responseJson({ status: "error", message: "Falta email destinatario" });
    }

    var options = {
      name: "Club de Leones Quetzaltenango",
      replyTo: "convencionleones27@gmail.com"
    };

    if (htmlBody) {
      options.htmlBody = htmlBody;
    }

    GmailApp.sendEmail(destinatario, asunto, mensajeTexto, options);

    return responseJson({
      status: "success",
      message: "Correo enviado con éxito a " + destinatario
    });

  } catch (error) {
    Logger.log("Error general en doPost: " + error.toString());
    return responseJson({ status: "error", message: error.toString() });
  }
}

/**
 * Orquestación del flujo 3D Secure con CyberSource / BAC
 */
function handleCyberSourcePayment(data) {
  var isTest = data.isTestMode !== false;
  var host = isTest ? "apitest.cybersource.com" : "api.cybersource.com";
  var merchantId = data.merchantId || DEFAULT_MERCHANT_ID;
  var keyId = data.keyId || DEFAULT_KEY_ID;
  var sharedSecret = data.sharedSecret || DEFAULT_SHARED_SECRET;

  var card = data.card;
  var customer = data.customer;
  var amount = data.amount;
  var currency = data.currency || "GTQ";
  var orderCode = data.orderCode || ("ORD-" + new Date().getTime());

  // PASO 1: 3DS Authentication Setup
  var setupPayload = {
    clientReferenceInformation: { code: orderCode + "-SETUP" },
    paymentInformation: {
      card: {
        type: card.type || "001",
        expirationMonth: card.expirationMonth,
        expirationYear: card.expirationYear,
        number: card.number
      }
    }
  };

  var setupRes = callCyberSource(host, "/risk/v1/authentication-setups", setupPayload, merchantId, keyId, sharedSecret);
  if (setupRes.status !== 201) {
    return responseJson({
      status: "error",
      message: "Fallo en verificación 3DS: " + (setupRes.body.message || "Error de tarjeta")
    });
  }

  var referenceId = setupRes.body.consumerAuthenticationInformation
    ? setupRes.body.consumerAuthenticationInformation.referenceId
    : null;

  // PASO 2: 3DS Check Enrollment
  var authPayload = {
    clientReferenceInformation: { code: orderCode + "-3DS" },
    orderInformation: {
      amountDetails: { currency: currency, totalAmount: amount },
      billTo: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        address1: customer.address || "Quetzaltenango",
        locality: customer.city || "Quetzaltenango",
        postalCode: "09001",
        country: customer.country || "GT",
        email: customer.email,
        phoneNumber: customer.phoneNumber || "50200000000"
      }
    },
    paymentInformation: {
      card: {
        type: card.type || "001",
        expirationMonth: card.expirationMonth,
        expirationYear: card.expirationYear,
        number: card.number,
        securityCode: card.securityCode
      }
    },
    consumerAuthenticationInformation: {
      referenceId: referenceId,
      returnUrl: "https://clubdeleonesquetzaltenango.org"
    },
    deviceInformation: data.device || {
      ipAddress: "186.151.60.10",
      httpAcceptContent: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      httpBrowserLanguage: "es-GT",
      httpBrowserColorDepth: "24",
      httpBrowserScreenHeight: "1080",
      httpBrowserScreenWidth: "1920",
      httpBrowserTimeDifference: "-360",
      userAgentBrowserValue: "Mozilla/5.0",
      httpBrowserJavaEnabled: false,
      httpBrowserJavaScriptEnabled: true
    }
  };

  var authRes = callCyberSource(host, "/risk/v1/authentications", authPayload, merchantId, keyId, sharedSecret);
  var authBody = authRes.body;

  // PASO 3: Payment Authorization & Capture
  var commerceIndicator = "internet";
  var authTxnId = null;
  if (authBody.consumerAuthenticationInformation) {
    authTxnId = authBody.consumerAuthenticationInformation.authenticationTransactionId;
    if (authBody.consumerAuthenticationInformation.ecommerceIndicator) {
      commerceIndicator = authBody.consumerAuthenticationInformation.ecommerceIndicator;
    }
  }

  var payPayload = {
    clientReferenceInformation: { code: orderCode + "-PAY" },
    processingInformation: {
      capture: false, // Authorization
      commerceIndicator: commerceIndicator
    },
    paymentInformation: {
      card: {
        number: card.number,
        expirationMonth: card.expirationMonth,
        expirationYear: card.expirationYear,
        securityCode: card.securityCode
      }
    },
    orderInformation: {
      amountDetails: {
        totalAmount: amount,
        currency: currency
      },
      billTo: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        address1: customer.address || "Quetzaltenango",
        locality: customer.city || "Quetzaltenango",
        postalCode: "09001",
        country: customer.country || "GT",
        email: customer.email,
        phoneNumber: customer.phoneNumber || "50200000000"
      }
    },
    consumerAuthenticationInformation: {
      authenticationTransactionId: authTxnId
    }
  };

  var payRes = callCyberSource(host, "/pts/v2/payments", payPayload, merchantId, keyId, sharedSecret);
  var payBody = payRes.body;

  if (payRes.status === 201 && payBody.status === "AUTHORIZED") {
    return responseJson({
      success: true,
      status: "AUTHORIZED",
      transactionId: payBody.id,
      approvalCode: payBody.processorInformation ? payBody.processorInformation.approvalCode : "APROBADA",
      orderCode: orderCode,
      submitTimeUtc: payBody.submitTimeUtc || new Date().toISOString()
    });
  } else {
    var errorMsg = payBody.message || payBody.reason || "La transacción no pudo ser autorizada.";
    return responseJson({
      success: false,
      status: payBody.status || "DECLINED",
      message: errorMsg,
      transactionId: payBody.id || null
    });
  }
}

/**
 * Cliente HTTP con firma HMAC-SHA256 para CyberSource
 */
function callCyberSource(host, resource, payloadObj, merchantId, keyId, sharedSecret) {
  var payloadString = JSON.stringify(payloadObj);
  var date = new Date().toUTCString();

  var digestBytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, payloadString, Utilities.Charset.UTF_8);
  var digest = "SHA-256=" + Utilities.base64Encode(digestBytes);

  var signatureHeaders = "host date (request-target) digest v-c-merchant-id";
  var signatureString = "host: " + host + "\n" +
                        "date: " + date + "\n" +
                        "(request-target): post " + resource + "\n" +
                        "digest: " + digest + "\n" +
                        "v-c-merchant-id: " + merchantId;

  var decodedSecret = Utilities.base64Decode(sharedSecret);
  var hmacBytes = Utilities.computeHmacSha256Signature(signatureString, decodedSecret);
  var signature = Utilities.base64Encode(hmacBytes);

  var signatureHeaderValue = 'keyid="' + keyId + '", algorithm="HmacSHA256", headers="' + signatureHeaders + '", signature="' + signature + '"';

  var options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "v-c-merchant-id": merchantId,
      "date": date,
      "host": host,
      "digest": digest,
      "signature": signatureHeaderValue
    },
    payload: payloadString,
    muteHttpExceptions: true
  };

  var res = UrlFetchApp.fetch("https://" + host + resource, options);
  return {
    status: res.getResponseCode(),
    body: JSON.parse(res.getContentText())
  };
}

function responseJson(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return ContentService.createTextOutput("Servidor Proxy de CyberSource BAC y Gmail activo.")
    .setMimeType(ContentService.MimeType.TEXT);
}
```

---

## Pasos para Actualizar en Google Apps Script
1. Abre [script.google.com](https://script.google.com/) con `convencionleones27@gmail.com`.
2. Abre el proyecto existente del Club de Leones.
3. Reemplaza el contenido de `Código.gs` con el código de arriba.
4. Haz clic en **Implementar** > **Administrar implementaciones**.
5. Haz clic en el ícono de lápiz (Editar) y en versión selecciona **Nueva versión**.
6. Haz clic en **Implementar**.
