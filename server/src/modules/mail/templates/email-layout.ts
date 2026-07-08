export const LOGO_CID = "talkup-logo";

// Single source for the brand accent used on CTA buttons across mail
// templates (e.g. the "Verify your account" button in mail.listener.ts).
export const BRAND_ACCENT = "#2b70c9";

const HEADING_STACK = "'Saira', 'Segoe UI', Arial, sans-serif";
const BODY_STACK = "'Inter', 'Segoe UI', Arial, sans-serif";

const COLORS = {
  primary: "#29457a",
  accent: BRAND_ACCENT,
  surface: "#f8f9ff",
  card: "#ffffff",
  text: "#24242d",
  textWeaker: "#5f5f77",
  textIdle: "#57585e",
  border: "#d9dbeb",
  white: "#ffffff",
} as const;

// Longhand font helper — never emit the `font:` shorthand (Word engine drops it).
function font(stack: string, size: string, weight: number, lineHeight: string) {
  return `font-family:${stack};font-size:${size};font-weight:${weight};line-height:${lineHeight};`;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * A verify-account call to action. The renderer owns all HTML construction and
 * escaping — callers pass only data, never markup, so there is no way to forget
 * an escape. The `href` is scheme-guarded to http(s) inside the renderer; a
 * non-http href is dropped and the `note` fallback is used instead.
 */
export interface OtpEmailCta {
  href: string;
  label: string;
  helperText?: string;
}

export interface OtpEmailInput {
  heading: string;
  intro: string;
  code: string;
  expiryMinutes: number;
  preHeading?: string;
  /** Structured verify CTA. Rendered only when `href` is a valid http(s) URL. */
  cta?: OtpEmailCta;
  /** Fallback copy shown when there is no valid CTA (e.g. no verify link). */
  note?: string;
  /**
   * Anti-phishing warning shown under the expiry line. The leading clause up to
   * the first period is emphasised (bold). Rendered only when provided.
   */
  securityNote?: string;
  /** Sign-off line shown above the footer (e.g. "— The TalkUp Team"). */
  signoff?: string;
}

const HTTP_SCHEME = /^https?:\/\//i;

function renderCta(
  cta: OtpEmailCta | undefined,
  note: string | undefined,
): {
  html: string;
  text: string;
} {
  if (cta && HTTP_SCHEME.test(cta.href)) {
    const helperHtml = cta.helperText
      ? `<p style="margin:12px 0 0;${font(BODY_STACK, "12px", 400, "1.5")}color:${COLORS.textIdle};">${escapeHtml(
          cta.helperText,
        )}</p>`
      : "";
    const html = `<div style="margin:0 0 20px;"><a href="${escapeHtml(
      cta.href,
    )}" style="display:inline-block;padding:12px 24px;background:${COLORS.accent};color:${COLORS.white};border-radius:8px;${font(
      HEADING_STACK,
      "14px",
      700,
      "1",
    )}text-decoration:none;">${escapeHtml(cta.label)}</a>${helperHtml}</div>`;
    const text = [`${cta.label}: ${cta.href}`, cta.helperText]
      .filter(Boolean)
      .join("\n");
    return { html, text };
  }

  if (note) {
    return {
      html: `<div style="margin:0 0 20px;"><p style="margin:0;${font(BODY_STACK, "15px", 400, "1.6")}color:${COLORS.textWeaker};">${escapeHtml(
        note,
      )}</p></div>`,
      text: note,
    };
  }

  return { html: "", text: "" };
}

/**
 * Split a security note into its emphasised lead ("Do NOT share this code.")
 * and the remaining plain sentence(s), on the first period. The caller passes
 * plain text; escaping happens here.
 */
function renderSecurityNote(securityNote: string | undefined): {
  html: string;
  text: string;
} {
  if (!securityNote) {
    return { html: "", text: "" };
  }
  const firstStop = securityNote.indexOf(".");
  const lead =
    firstStop === -1 ? securityNote : securityNote.slice(0, firstStop + 1);
  const rest = firstStop === -1 ? "" : securityNote.slice(firstStop + 1).trim();
  const restHtml = rest ? ` ${escapeHtml(rest)}` : "";
  const html = `<p style="margin:16px 0 0;${font(BODY_STACK, "13px", 400, "1.6")}color:${COLORS.textWeaker};"><strong style="color:${COLORS.text};">${escapeHtml(
    lead,
  )}</strong>${restHtml}</p>`;
  return { html, text: securityNote };
}

export function renderOtpEmail(input: OtpEmailInput): {
  html: string;
  text: string;
} {
  const {
    heading,
    intro,
    code,
    expiryMinutes,
    preHeading,
    cta,
    note,
    securityNote,
    signoff,
  } = input;
  const expiryLine = `This code expires in ${expiryMinutes} minutes.`;
  const securityContent = renderSecurityNote(securityNote);
  const signoffHtml = signoff
    ? `<p style="margin:20px 0 0;${font(BODY_STACK, "13px", 400, "1.6")}color:${COLORS.textIdle};">${escapeHtml(
        signoff,
      )}</p>`
    : "";

  const preHeadingHtml = preHeading
    ? `<p style="margin:0 0 16px;${font(BODY_STACK, "15px", 400, "1.6")}color:${COLORS.textWeaker};">${escapeHtml(
        preHeading,
      )}</p>`
    : "";

  const ctaContent = renderCta(cta, note);
  const ctaHtml = ctaContent.html;

  // Code chip: light text on the dark primary band so it stays legible under
  // client dark-mode inversion (Gmail inverts regardless of color-scheme meta,
  // and strips <head> — so head CSS cannot be relied on for legibility).
  const codeChip = `<div style="margin:0 0 20px;padding:18px 24px 18px 32px;background:${COLORS.primary};border-radius:8px;text-align:center;${font(
    BODY_STACK,
    "30px",
    700,
    "1",
  )}letter-spacing:8px;color:${COLORS.white};">${escapeHtml(code)}</div>`;

  // Outlook (Word engine) ignores max-width; give it a fixed-width MSO table +
  // the width="600" attribute. Everyone else gets width:100%;max-width:600px.
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.surface};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.surface};padding:24px 0;">
<tr><td align="center">
<!--[if mso]>
<table role="presentation" width="600" cellpadding="0" cellspacing="0" align="center"><tr><td>
<![endif]-->
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;border-collapse:collapse;">
<tr>
<td style="background:${COLORS.primary};border-radius:10px 10px 0 0;padding:20px 32px;">
<img src="cid:${LOGO_CID}" alt="TalkUp" width="32" height="32" style="vertical-align:middle;border:0;display:inline-block;">
<span style="vertical-align:middle;margin-left:10px;${font(HEADING_STACK, "20px", 700, "1")}color:${COLORS.white};">TalkUp</span>
</td>
</tr>
<tr>
<td style="background:${COLORS.card};border:1px solid ${COLORS.border};border-top:0;border-radius:0 0 10px 10px;padding:32px;">
<h1 style="margin:0 0 12px;${font(HEADING_STACK, "24px", 700, "1.3")}color:${COLORS.text};">${escapeHtml(
    heading,
  )}</h1>
${preHeadingHtml}
<p style="margin:0 0 16px;${font(BODY_STACK, "15px", 400, "1.6")}color:${COLORS.textWeaker};">${escapeHtml(
    intro,
  )}</p>
${ctaHtml}
${codeChip}
<p style="margin:0;${font(BODY_STACK, "13px", 400, "1.6")}color:${COLORS.textIdle};">${escapeHtml(
    expiryLine,
  )}</p>
${securityContent.html}
${signoffHtml}
</td>
</tr>
<tr>
<td style="padding:20px 32px;${font(BODY_STACK, "12px", 400, "1.6")}color:${COLORS.textIdle};text-align:center;">
Sent by TalkUp. If you didn't request this, you can safely ignore this email.
</td>
</tr>
</table>
<!--[if mso]>
</td></tr></table>
<![endif]-->
</td></tr>
</table>
</body>
</html>`;

  const text = [
    heading,
    preHeading,
    intro,
    ctaContent.text,
    `Code: ${code}`,
    expiryLine,
    securityContent.text,
    signoff,
    "Sent by TalkUp. If you didn't request this, you can safely ignore this email.",
  ]
    .filter(Boolean)
    .join("\n\n");

  return { html, text };
}
