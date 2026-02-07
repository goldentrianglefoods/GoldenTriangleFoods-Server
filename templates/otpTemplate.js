// templates/otpTemplate.js
function otpHtmlTemplate({ name = "User", otp = "123456", minutes = 5 }) {
  const expiryText = `${minutes} minute${minutes > 1 ? "s" : ""}`;
  return `
  <!doctype html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
  </head>
  <body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:30px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 8px 30px rgba(19,22,39,0.08);">
            <tr>
              <td style="padding:28px 36px 0; text-align:center; background: linear-gradient(90deg,#6f7cff,#55e6c1); color:#fff;">
                <h1 style="margin:0;font-size:20px;font-weight:700;">Verify your email</h1>
                <p style="margin:6px 0 0;font-size:14px;opacity:0.95;">One more step to secure your account</p>
              </td>
            </tr>

            <tr>
              <td style="padding:26px 36px 10px; text-align:left; color:#111;">
                <p style="margin:0 0 12px; font-size:15px;">Hey <strong>${escapeHtml(name)}</strong>,</p>
                <p style="margin:0 0 18px; font-size:14px; color:#444;">
                  Use the following One-Time Password (OTP) to verify your email address.
                  This code will expire in <strong>${expiryText}</strong>.
                </p>

                <div style="text-align:center; margin:25px 0;">
                  <div style="display:inline-block;background:#f6f8ff;padding:18px 28px;border-radius:10px;">
                    <p style="margin:0;font-size:28px;letter-spacing:10px;font-weight:700;color:#1f2b6c;">
                      ${otp.split("").map(d => `<span style="display:inline-block;padding:0 6px;">${d}</span>`).join("")}
                    </p>
                  </div>
                </div>

                <p style="margin:0;color:#999;font-size:12px;text-align:center;">
                  If you didn’t request this, please ignore this email.
                  This OTP will expire in ${expiryText}.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:20px 36px 28px; background:#fafbff; color:#7b8196; font-size:13px; text-align:center;">
                <div style="margin-bottom:6px;">Need help? Reply to this email or contact support.</div>
                <div style="font-size:12px;margin-top:6px;">© ${new Date().getFullYear()} Golden Triangle Foods. All rights reserved.</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}

function escapeHtml(unsafe) {
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

module.exports = { otpHtmlTemplate };
