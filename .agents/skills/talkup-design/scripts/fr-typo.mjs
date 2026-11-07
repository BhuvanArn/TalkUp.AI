#!/usr/bin/env node
// French typography: no-break spaces where French requires them.
//
//   node fr-typo.mjs <file.html>     fix text inside data-lang="fr" elements, in place
//   import { frTypo } from './fr-typo.mjs'   for a string (e.g. a fr locale value)
//
// Narrow no-break space (U+202F) before ; ! ? » and after «; no-break space (U+00A0)
// before : and between a number and its unit. URLs and clock times are left alone.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const NNBSP = ' ';
const NBSP = ' ';
const UNITS = ['min', 'h', 's', 'ms', '€', '%', 'Mo', 'Ko', 'Go', 'km', 'jours?', 'ans?', 'mois', 'sem\\.'];

export function frTypo(text) {
  // Keep URLs untouched: swap them out, fix the rest, swap them back.
  const urls = [];
  let t = text.replace(/https?:\/\/\S+/g, (u) => `\u0000${urls.push(u) - 1}\u0000`);
  t = t
    .replace(/[ \u00a0\u202f]*([;!?\u00bb])/g, (m, p, off) => (off === 0 ? p : `${NNBSP}${p}`))
    .replace(/\u00ab[ \u00a0\u202f]*/g, `\u00ab${NNBSP}`)
    .replace(/(\S)[ \u00a0\u202f]*:(?!\d)(?=\s|$)/g, `$1${NBSP}:`)
    .replace(new RegExp(`(\\d) (${UNITS.join('|')})(?![\\p{L}])`, 'gu'), `$1${NBSP}$2`);
  return t.replace(/\u0000(\d+)\u0000/g, (m, i) => urls[+i]);
}

// Apply frTypo to text nodes inside elements marked data-lang="fr" (simple, non-nested markup).
export function frTypoHtml(html) {
  return html.replace(/(<([a-zA-Z][\w-]*)\b[^>]*\bdata-lang="fr"[^>]*>)([\s\S]*?)(<\/\2>)/g, (m, open, tag, inner, close) =>
    `${open}${inner.split(/(<[^>]*>)/).map((part) => (part.startsWith('<') ? part : frTypo(part))).join('')}${close}`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const file = process.argv[2];
  if (!file) {
    console.error('usage: node fr-typo.mjs <file.html>');
    process.exit(2);
  }
  const before = readFileSync(file, 'utf8');
  const after = frTypoHtml(before);
  writeFileSync(file, after);
  console.log(before === after ? 'No change.' : `Fixed French spacing in ${file}.`);
}
