#!/usr/bin/env node
// French typography: no-break spaces where French requires them.
//
//   node fr-typo.mjs <file.html>     fix text inside data-lang="fr" elements, in place
//   import { frTypo } from './fr-typo.mjs'   for a string (e.g. a fr locale value)
//
// Narrow no-break space (U+202F) before ; ! ? » and after «; no-break space (U+00A0)
// before : and between a number and its unit. URLs and clock times are left alone.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const NNBSP = " ";
const NBSP = " ";
const UNITS = [
  "min",
  "h",
  "s",
  "ms",
  "€",
  "%",
  "Mo",
  "Ko",
  "Go",
  "km",
  "jours?",
  "ans?",
  "mois",
  "sem\\.",
];

export function frTypo(text) {
  // Keep URLs untouched: swap them out, fix the rest, swap them back.
  const urls = [];
  let t = text.replace(
    /https?:\/\/\S+/g,
    (u) => `\u0000${urls.push(u) - 1}\u0000`,
  );
  t = t
    // At the very start of a text node with no space before, the mark follows an element: leave it.
    .replace(/[ \u00a0\u202f]*([;!?\u00bb])/g, (m, p, off) =>
      off === 0 && m === p ? p : `${NNBSP}${p}`,
    )
    .replace(/\u00ab[ \u00a0\u202f]*/g, `\u00ab${NNBSP}`)
    .replace(/(\S)[ \u00a0\u202f]*:(?!\d)(?=\s|$)/g, `$1${NBSP}:`)
    .replace(/^[ \u00a0\u202f]+:(?=\s|$)/, `${NBSP}:`)
    .replace(
      new RegExp(`(\\d) (${UNITS.join("|")})(?![\\p{L}])`, "gu"),
      `$1${NBSP}$2`,
    );
  return t.replace(/\u0000(\d+)\u0000/g, (m, i) => urls[+i]);
}

// Apply frTypo to text inside elements marked data-lang="fr" (not <html>, which only sets
// the page default), skipping <style> and <script>. Nested markup keeps the nearest data-lang.
const VOID = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "source",
  "track",
  "wbr",
]);

export function frTypoHtml(html) {
  const stack = []; // { tag, lang }
  let raw = null; // inside <style>/<script>
  return html
    .split(/(<[^>]+>)/)
    .map((part) => {
      if (part.startsWith("<")) {
        const m = /^<\/?([a-zA-Z][\w-]*)/.exec(part);
        if (!m) return part;
        const tag = m[1].toLowerCase();
        if (part.startsWith("</")) {
          if (raw === tag) raw = null;
          const at = stack.map((e) => e.tag).lastIndexOf(tag);
          if (at >= 0) stack.length = at;
        } else if (!VOID.has(tag) && !part.endsWith("/>")) {
          if (tag === "style" || tag === "script") raw = tag;
          // data-lang (pistes toggle) or lang (e.g. English user data shown in the FR view)
          const lang =
            tag === "html"
              ? null
              : (/\s(?:data-)?lang="([a-z]+)/.exec(part) || [])[1] || null;
          stack.push({ tag, lang });
        }
        return part;
      }
      if (raw) return part;
      const lang = [...stack].reverse().find((e) => e.lang)?.lang;
      return lang === "fr" ? frTypo(part) : part;
    })
    .join("");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const file = process.argv[2];
  if (!file) {
    console.error("usage: node fr-typo.mjs <file.html>");
    process.exit(2);
  }
  const before = readFileSync(file, "utf8");
  const after = frTypoHtml(before);
  writeFileSync(file, after);
  console.log(
    before === after ? "No change." : `Fixed French spacing in ${file}.`,
  );
}
