#!/usr/bin/env node
// Sign in through the real login form and save a Playwright storage state for capture / audit.
//
//   TALKUP_PASSWORD=… node login.mjs <base url> --email <email> [--password-env VAR] [--out file]
//
// The password is read from an environment variable (TALKUP_PASSWORD by default), never from
// the command line, so it stays out of shell history and process lists. The state holds a live
// session: it is written to the system temp folder by default, outside the repo. Never commit it.
// capture.mjs and run-audit.mjs save the rotated session back after each run; if one reports it
// was sent to /login (exit code 3), run this again.
import { chromium } from "@playwright/test";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const DEFAULT_STATE = join(tmpdir(), "talkup-storage-state.json");

function parse(argv) {
  const o = {
    base: null,
    email: null,
    passwordEnv: "TALKUP_PASSWORD",
    out: DEFAULT_STATE,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--email") o.email = argv[++i];
    else if (a === "--password-env") o.passwordEnv = argv[++i];
    else if (a === "--out") o.out = argv[++i];
    else if (a.startsWith("--")) {
      console.error(
        a === "--password"
          ? "--password is not accepted: put the password in TALKUP_PASSWORD (or --password-env VAR)."
          : `unknown option ${a}`,
      );
      process.exit(2);
    } else o.base = a.replace(/\/$/, "");
  }
  return o;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const o = parse(process.argv.slice(2));
  const password = process.env[o.passwordEnv];
  if (!o.base || !o.email || !password) {
    console.error(
      "usage: TALKUP_PASSWORD=… node login.mjs <base url> --email <email> [--password-env VAR] [--out file]",
    );
    process.exit(2);
  }
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${o.base}/login`);
    await page.fill("#email", o.email);
    await page.fill("#password", password);
    try {
      await Promise.all([
        page.waitForURL((u) => !u.pathname.startsWith("/login"), {
          timeout: 15000,
        }),
        page.keyboard.press("Enter"),
      ]);
    } catch {
      console.error(
        "Still on /login after 15 s: check the email and password, and that the API is running.",
      );
      process.exit(1);
    }
    await context.storageState({ path: o.out });
    console.log(o.out);
  } finally {
    await browser.close();
  }
}
