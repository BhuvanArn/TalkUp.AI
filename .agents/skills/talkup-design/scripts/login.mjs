#!/usr/bin/env node
// Sign in through the real login form and save a Playwright storage state for capture / audit.
//
//   node login.mjs <base url> --email <email> --password <password> [--out state.json]
//
// Sessions use refresh-token rotation and expire quickly: run this right before a batch of
// captures or audits, and again if one of them reports it was sent to /login (exit code 3).
import { chromium } from "@playwright/test";
import { fileURLToPath } from "node:url";

function parse(argv) {
  const o = { base: null, email: null, password: null, out: "state.json" };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--email") o.email = argv[++i];
    else if (argv[i] === "--password") o.password = argv[++i];
    else if (argv[i] === "--out") o.out = argv[++i];
    else o.base = argv[i].replace(/\/$/, "");
  }
  return o;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const o = parse(process.argv.slice(2));
  if (!o.base || !o.email || !o.password) {
    console.error(
      "usage: node login.mjs <base url> --email <email> --password <password> [--out state.json]",
    );
    process.exit(2);
  }
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${o.base}/login`);
    await page.fill("#email", o.email);
    await page.fill("#password", o.password);
    await Promise.all([
      page.waitForURL((u) => !u.pathname.startsWith("/login"), {
        timeout: 15000,
      }),
      page.keyboard.press("Enter"),
    ]);
    await context.storageState({ path: o.out });
    console.log(o.out);
  } finally {
    await browser.close();
  }
}
