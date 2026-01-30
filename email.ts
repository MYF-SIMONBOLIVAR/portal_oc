import nodemailer from "nodemailer";
import { ENV } from "./_core/env";

/**
 * Crea un transportador de correo configurado con Gmail SMTP
 */
function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: ENV.emailFrom,
      pass: ENV.emailPassword,
    },
  });
}

/**
 * Genera el HTML del correo de verificación
 */
function getVerificationEmailHTML(
  razonSocial: string,
  token: string,
  frontendUrl: string = "https://portal-proveedores.manus.space"
): string {
  const verificationLink = `${frontendUrl}?tab=register&token=${token}`;

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #007bff;
          padding-bottom: 20px;
        }
        .header h1 {
          color: #007bff;
          margin: 0;
          font-size: 24px;
        }
        .content {
          margin: 30px 0;
        }
        .content p {
          margin: 15px 0;
        }
        .token-section {
          background-color: #f8f9fa;
          padding: 20px;
          border-radius: 6px;
          margin: 20px 0;
          border-left: 4px solid #007bff;
        }
        .token-label {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 8px;
        }
        .token-value {
          font-family: 'Courier New', monospace;
          font-size: 16px;
          font-weight: bold;
          color: #007bff;
          word-break: break-all;
        }
        .button-container {
          text-align: center;
          margin: 30px 0;
        }
        .button {
          display: inline-block;
          background-color: #007bff;
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
          transition: background-color 0.3s;
        }
        .button:hover {
          background-color: #0056b3;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          font-size: 12px;
          color: #999;
        }
        .warning {
          background-color: #fff3cd;
          border: 1px solid #ffc107;
          color: #856404;
          padding: 12px;
          border-radius: 4px;
          margin: 15px 0;
          font-size: 13px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Verificación de Correo</h1>
        </div>

        <div class="content">
          <p>Hola <strong>${razonSocial}</strong>,</p>

          <p>Gracias por registrarte en el <strong>Portal de Proveedores</strong>. Para completar tu registro, necesitamos verificar tu correo electrónico.</p>

          <div class="token-section">
            <div class="token-label">Tu código de verificación:</div>
            <div class="token-value">${token}</div>
          </div>

          <p>Ingresa este código en el portal para completar tu registro. El código es válido por <strong>24 horas</strong>.</p>

          <div class="button-container">
            <a href="${verificationLink}" class="button">Verificar Correo</a>
          </div>

          <p>O copia y pega este enlace en tu navegador:</p>
          <p style="word-break: break-all; font-size: 12px; color: #666;">${verificationLink}</p>

          <div class="warning">
            ⚠️ <strong>Seguridad:</strong> Si no solicitaste este registro, ignora este correo. No compartas tu código de verificación con nadie.
          </div>
        </div>

        <div class="footer">
          <p>© 2024 Portal de Proveedores. Todos los derechos reservados.</p>
          <p>Este es un correo automático, por favor no respondas a esta dirección.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Envía un correo de verificación con el token
 */
export async function sendVerificationEmail(
  email: string,
  razonSocial: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!ENV.emailFrom || !ENV.emailPassword) {
      console.error("[Email] Credenciales de correo no configuradas");
      return {
        success: false,
        error: "Credenciales de correo no configuradas",
      };
    }

    const transporter = createTransporter();

    const htmlContent = getVerificationEmailHTML(razonSocial, token);

    const mailOptions = {
      from: ENV.emailFrom,
      to: email,
      subject: "Verifica tu correo - Portal de Proveedores",
      html: htmlContent,
      text: `Hola ${razonSocial},\n\nTu código de verificación es: ${token}\n\nEste código es válido por 24 horas.\n\nSi no solicitaste este registro, ignora este correo.`,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(`[Email] Correo enviado exitosamente a ${email}. MessageId: ${info.messageId}`);

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    console.error(`[Email] Error al enviar correo a ${email}:`, errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}
