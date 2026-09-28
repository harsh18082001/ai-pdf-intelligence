interface EmailTemplateOptions {
  heading: string;
  intro: string;
  ctaLabel: string;
  ctaLink: string;
  footnote: string;
}

export function renderEmailTemplate({ heading, intro, ctaLabel, ctaLink, footnote }: EmailTemplateOptions): string {
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:#eef2f7;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef2f7;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 24px rgba(30,41,59,0.08);">
            <tr>
              <td bgcolor="#1e3a8a" style="background-color:#1e3a8a;background:linear-gradient(135deg,#1e3a8a,#3730a3);padding:32px 40px;">
                <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.3px;">DocIQ</span>
              </td>
            </tr>
            <tr>
              <td style="padding:40px 40px 24px 40px;">
                <h1 style="margin:0 0 16px 0;font-size:20px;color:#0f172a;font-weight:600;">${heading}</h1>
                <p style="margin:0 0 28px 0;font-size:15px;line-height:1.6;color:#475569;">${intro}</p>
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td bgcolor="#1e3a8a" style="border-radius:10px;background-color:#1e3a8a;background:linear-gradient(135deg,#1e3a8a,#3730a3);">
                      <a href="${ctaLink}" style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:600;color:#ffffff !important;text-decoration:none;">${ctaLabel}</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:28px 0 0 0;font-size:13px;line-height:1.6;color:#94a3b8;">
                  If the button doesn't work, copy this link into your browser:<br/>
                  <a href="${ctaLink}" style="color:#3730a3;word-break:break-all;">${ctaLink}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 40px 32px 40px;border-top:1px solid #eef2f7;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;">${footnote}</p>
              </td>
            </tr>
          </table>
          <p style="margin:24px 0 0 0;font-size:12px;color:#94a3b8;">DocIQ — AI-powered PDF intelligence</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
