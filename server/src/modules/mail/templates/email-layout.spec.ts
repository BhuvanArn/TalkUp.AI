import { LOGO_CID, escapeHtml, renderOtpEmail } from "./email-layout";

describe("escapeHtml", () => {
  it("escapes html-significant characters", () => {
    expect(escapeHtml(`<a href="x">&'`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;&amp;&#39;",
    );
  });

  it("leaves plain text untouched", () => {
    expect(escapeHtml("Acme Inc")).toBe("Acme Inc");
  });
});

describe("renderOtpEmail", () => {
  const base = {
    heading: "Confirm your email",
    intro: "Your one-time verification code is:",
    code: "482917",
    expiryMinutes: 15,
  };

  it("includes the code in html and text", () => {
    const { html, text } = renderOtpEmail(base);
    expect(html).toContain("482917");
    expect(text).toContain("482917");
  });

  it("includes the heading and expiry copy", () => {
    const { html, text } = renderOtpEmail(base);
    expect(html).toContain("Confirm your email");
    expect(html).toContain("expires in 15 minutes");
    expect(text).toContain("expires in 15 minutes");
  });

  it("references the logo via cid", () => {
    const { html } = renderOtpEmail(base);
    expect(html).toContain(`cid:${LOGO_CID}`);
    expect(html).toContain('alt="TalkUp"');
  });

  it("omits cta and preHeading when not provided", () => {
    const { html } = renderOtpEmail(base);
    expect(html).not.toContain("verify-email");
    expect(html).not.toContain("created an account");
  });

  it("renders preHeading and ctaBlock when provided", () => {
    const { html, text } = renderOtpEmail({
      ...base,
      preHeading: "Acme Inc created an account for you.",
      ctaBlock: {
        html: '<a href="https://talkup.example/verify-email">Verify</a>',
        text: "Verify: https://talkup.example/verify-email",
      },
    });
    expect(html).toContain("Acme Inc created an account for you.");
    expect(html).toContain("https://talkup.example/verify-email");
    expect(text).toContain("Verify: https://talkup.example/verify-email");
  });

  it("wraps at 600px and uses brand primary band", () => {
    const { html } = renderOtpEmail(base);
    expect(html).toContain("max-width:600px");
    expect(html).toContain("#29457a");
  });

  it("gives Outlook a fixed width (attribute + MSO conditional)", () => {
    const { html } = renderOtpEmail(base);
    expect(html).toContain('width="600"');
    expect(html).toContain("[if mso]");
  });

  it("uses font longhand, never the font shorthand", () => {
    const { html } = renderOtpEmail(base);
    // Word engine drops `font:` shorthand → Times New Roman fallback.
    expect(html).not.toMatch(/font:\s*\d/);
    expect(html).toContain("font-family:");
    expect(html).toContain("font-size:");
  });

  it("renders the code chip as light text on the dark primary band", () => {
    const { html } = renderOtpEmail(base);
    // Chip must survive dark-mode inversion: white text on primary, not dark-on-light.
    const chip = html.slice(
      html.indexOf("482917") - 400,
      html.indexOf("482917"),
    );
    expect(chip).toContain("#29457a");
    expect(chip).toContain("#ffffff");
  });

  it("declares supported-color-schemes", () => {
    const { html } = renderOtpEmail(base);
    expect(html).toContain("supported-color-schemes");
  });
});
