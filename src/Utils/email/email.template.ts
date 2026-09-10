interface EmailTemplateOptions {
  title: string;
  greeting: string;
  message: string;
  otpCode?: string;
  buttonText?: string;
  buttonUrl?: string;
  footerNote?: string;
}

const BRAND_COLOR = "#4F46E5"; // أزرق-بنفسجي أساسي
const BRAND_COLOR_DARK = "#4338CA"; // نفس اللون أغمق (Header)
const BRAND_COLOR_LIGHT = "#EEF2FF"; // نفس اللون فاتح جداً (خلفية صندوق OTP)
const BRAND_COLOR_BORDER = "#C7D2FE"; // حدود صندوق OTP

export const generateEmailTemplate = ({
  title,
  greeting,
  message,
  otpCode,
  buttonText,
  buttonUrl,
  footerNote,
}: EmailTemplateOptions): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0; padding:0; background-color:#f0f0f3; font-family: Arial, Helvetica, sans-serif;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f0f3; padding: 40px 0;">
    <tr>
      <td align="center">

        <table role="presentation" width="460" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background-color:${BRAND_COLOR_DARK}; padding:40px 32px 32px 32px; text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" align="center">
                <tr>
                  <td style="width:56px; height:56px; background-color:#ffffff; border-radius:16px; text-align:center; vertical-align:middle; font-size:24px; font-weight:bold; color:${BRAND_COLOR_DARK};">
                    JS
                  </td>
                </tr>
              </table>
              <p style="color:#ffffff; font-size:15px; font-weight:bold; margin:18px 0 0 0;">
                Job Search App
              </p>
              <p style="color:#c7c9f5; font-size:12px; margin:4px 0 0 0;">
                Secure verification
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 36px 32px 36px; text-align:center;">
              <h2 style="color:#16161d; margin:0 0 12px 0; font-size:21px; font-weight:bold;">
                ${title}
              </h2>
              <p style="color:#6b6b74; font-size:14px; line-height:1.7; margin:0 0 8px 0;">
                ${greeting}
              </p>
              <p style="color:#6b6b74; font-size:14px; line-height:1.7; margin:0 0 30px 0;">
                ${message}
              </p>

              ${
                otpCode
                  ? `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND_COLOR_LIGHT}; border:1px solid ${BRAND_COLOR_BORDER}; border-radius:14px; margin-bottom:8px;">
                <tr>
                  <td style="padding:24px; text-align:center;">
                    <p style="color:#8a8a95; font-size:11px; letter-spacing:1px; text-transform:uppercase; margin:0 0 12px 0;">
                      Your verification code
                    </p>
                    <p style="color:${BRAND_COLOR}; font-size:32px; font-weight:bold; letter-spacing:8px; margin:0; font-family: 'Courier New', monospace;">
                      ${otpCode}
                    </p>
                  </td>
                </tr>
              </table>
              <p style="color:#a7a7ae; font-size:12px; margin:16px 0 0 0;">
                ⏱ Expires in 10 minutes
              </p>
              `
                  : ""
              }

              ${
                buttonText && buttonUrl
                  ? `
              <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:28px 0 0 0;">
                <tr>
                  <td style="background-color:${BRAND_COLOR}; border-radius:8px;">
                    <a href="${buttonUrl}" style="display:inline-block; padding:14px 32px; color:#ffffff; text-decoration:none; font-size:15px; font-weight:bold;">
                      ${buttonText}
                    </a>
                  </td>
                </tr>
              </table>
              `
                  : ""
              }

              ${
                footerNote
                  ? `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
                <tr><td style="border-top:1px solid #efeff2; padding-top:20px;">
                  <p style="color:#b0b0b6; font-size:12px; line-height:1.6; margin:0;">
                    ${footerNote}
                  </p>
                </td></tr>
              </table>
              `
                  : ""
              }
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#fafafb; padding:20px 32px; text-align:center; border-top:1px solid #f0f0f2;">
              <p style="color:#b0b0b6; font-size:11px; margin:0;">
                © ${new Date().getFullYear()} Job Search App. All rights reserved.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
  `;
};
