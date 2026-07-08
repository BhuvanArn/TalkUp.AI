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

  it("omits cta, note and preHeading when not provided", () => {
    const { html } = renderOtpEmail(base);
    expect(html).not.toContain("verify-email");
    expect(html).not.toContain("created an account");
    expect(html).not.toContain("<a ");
  });

  it("renders a structured cta (button + helper) and preHeading", () => {
    const { html, text } = renderOtpEmail({
      ...base,
      preHeading: "Acme Inc created an account for you.",
      cta: {
        href: "https://talkup.example/verify-email",
        label: "Verify your account",
        helperText: "Or copy this link: https://talkup.example/verify-email",
      },
    });
    expect(html).toContain("Acme Inc created an account for you.");
    expect(html).toContain('href="https://talkup.example/verify-email"');
    expect(html).toContain("Verify your account");
    expect(html).toContain("Or copy this link:");
    expect(html).toContain("#2b70c9"); // BRAND_ACCENT on the button
    expect(text).toContain(
      "Verify your account: https://talkup.example/verify-email",
    );
    expect(text).toContain(
      "Or copy this link: https://talkup.example/verify-email",
    );
  });

  it("escapes cta label, href and helperText — no raw injection", () => {
    const { html } = renderOtpEmail({
      ...base,
      cta: {
        href: 'https://talkup.example/verify?x="><script>alert(1)</script>',
        label: "<script>alert(2)</script>",
        helperText: "<img src=x onerror=alert(3)>",
      },
    });
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).not.toContain("<script>alert(2)</script>");
    expect(html).not.toContain("<img src=x onerror=alert(3)>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("drops a non-http cta href and renders the note fallback instead", () => {
    const { html, text } = renderOtpEmail({
      ...base,
      cta: {
        href: "javascript:alert(1)",
        label: "Verify your account",
      },
      note: "Verify your email using the TalkUp sign-in flow on the website.",
    });
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("<a "); // no anchor rendered at all
    expect(html).toContain("TalkUp sign-in flow");
    expect(text).toContain("TalkUp sign-in flow");
  });

  it("renders the note when no cta is provided", () => {
    const { html } = renderOtpEmail({
      ...base,
      note: "Use the TalkUp website to verify your email.",
    });
    expect(html).toContain("Use the TalkUp website to verify your email.");
    expect(html).not.toContain("<a ");
  });

  it("escapes the note", () => {
    const { html } = renderOtpEmail({
      ...base,
      note: "<script>alert(4)</script>",
    });
    expect(html).not.toContain("<script>alert(4)</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("omits the helper paragraph when helperText is absent", () => {
    const { html } = renderOtpEmail({
      ...base,
      cta: {
        href: "https://talkup.example/verify-email",
        label: "Verify your account",
      },
    });
    expect(html).toContain("Verify your account");
    expect(html).not.toContain("Or copy this link:");
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
