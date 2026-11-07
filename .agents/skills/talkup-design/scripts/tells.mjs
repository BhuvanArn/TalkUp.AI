#!/usr/bin/env node
// Scan source for the mechanical "looks AI-generated" tells listed in ../references/ai-tells.md.
//
//   node tells.mjs [files...]            scan these files
//   node tells.mjs --diff [base]         scan only lines added since base (default origin/staging),
//                                        plus uncommitted ones, in web/src/**/*.{ts,tsx,css}
//                                        and docs/design/pistes/**/*.html
//
// A line can opt out with a justification: `design-ok: <why>` in a comment on that line.
// Exit code 1 when any tell is found. A tell is a question, not a verdict: fix it or justify it.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const TOKEN_SOURCES = [/web\/src\/styles\/tailwind\.css$/];

const BUZZ_EN = ['unlock', 'supercharge', 'seamless', 'seamlessly', 'effortless', 'effortlessly', 'revolutionize', 'revolutionise', 'empower', 'game-changer', 'game changer', 'next-level', 'cutting-edge', 'elevate your'];
const BUZZ_FR = ['révolutionner', 'révolutionnez', 'booster', 'boostez', "propulsé par l'ia", 'propulsé par l’ia', 'sans effort', 'nouvelle génération'];

// Each rule: id, test(line, raw) → boolean, instead (what to do).
export const RULES = [
  {
    id: 'hex-literal',
    re: /(^|[^&\w])#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3}(?:[0-9a-fA-F]{2})?)?\b/,
    instead: 'Use a semantic token (bg-accent, text-text-weak, border-border…). A missing colour becomes a new token in tailwind.css, never a literal.',
  },
  {
    id: 'raw-palette',
    re: /\b(?:bg|text|border|from|to|via|ring|fill|stroke|shadow)-(?:gray|slate|zinc|neutral|stone|purple|violet|indigo|fuchsia|pink)-\d{2,3}\b/,
    instead: 'Raw Tailwind palette bypasses the theme and breaks dark mode. Use the semantic tokens; purple/indigo is the first AI-default tell.',
  },
  {
    id: 'gradient-text',
    test: (l) => /\bbg-clip-text\b/.test(l) && /\btext-transparent\b/.test(l),
    instead: 'Gradient text is a stock AI flourish. Get emphasis from size, weight and space; one colour.',
  },
  {
    id: 'gradient-bg',
    re: /\bbg-(?:gradient-to|linear-to|radial|conic)-|\bbg-brand-gradient\b|linear-gradient\(/,
    instead: 'Flat surfaces (DESIGN.md). The seminar removed the chatbot gradient. If depth is needed, use surface steps or the dark-mode glow token.',
  },
  {
    id: 'pill-button',
    test: (l) => /<(?:button|Button|LinkButton)\b/.test(l) && /\brounded-full\b/.test(l),
    instead: 'Buttons use the 8px radius everywhere ("la rondeur des boutons fait très IA slop"). Round is for avatars and icon toggles only.',
  },
  {
    id: 'arbitrary-radius',
    re: /\brounded(?:-[trbl]{1,2})?-\[[^\]]+\]/,
    instead: 'One radius system: buttons 8px, cards ~12px. Use the radius tokens, not one-off values.',
  },
  {
    id: 'glass',
    re: /\bbackdrop-blur\b|\bbackdrop-blur-/,
    instead: 'Default glassmorphism reads as template. Use an opaque surface token; blur only for an overlay with a real reason.',
  },
  {
    id: 'glow-shadow',
    re: /\bshadow-(?:purple|indigo|violet|blue|fuchsia|pink|sky|cyan)-\d{2,3}/,
    instead: 'Coloured glows are an AI tell. Elevation is borders and surface steps; dark-mode glow only through the token, on large titles or illustrations.',
  },
  {
    id: 'transition-all',
    re: /\btransition-all\b|transition:\s*all\b/,
    instead: 'Animate only the property that changes (transition-colors, transition-transform), 100–200ms for micro-interactions.',
  },
  {
    id: 'emoji',
    re: /\p{Emoji_Presentation}/u,
    instead: 'No emoji as icons or decoration. Use the Icon atom (functional) or a seminar-style illustration (emotional moment).',
  },
  {
    id: 'decor-icon',
    re: /\b(?:Sparkles?|Zap|Rocket|MagicWand|Wand|Lightning|Stars?)\b/,
    instead: '"✨ AI" icons are decoration. Show what the AI does (Tali avatar, a verb, the result).',
  },
  {
    id: 'arrow-cta',
    re: /(?:→|-&gt;|&rarr;)\s*<\/(?:button|Button|LinkButton|a|Link)>|>[^<]*\s(?:→|&rarr;)\s*</,
    instead: 'An arrow on every CTA is a template tic. A clear verb is enough ("Analyse my CV").',
  },
  {
    id: 'eyebrow-caps',
    test: (l) => /\buppercase\b/.test(l) && /\btracking-(?:wide|wider|widest|\[)/.test(l),
    instead: 'Small all-caps eyebrows above headings are a stock pattern. Let the heading carry the hierarchy; use a label only if it tells something true.',
  },
  {
    id: 'buzzword',
    test: (l) => {
      const low = l.toLowerCase();
      return [...BUZZ_EN, ...BUZZ_FR].some((w) => new RegExp(`(^|[^\\p{L}])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\p{L}]|$)`, 'u').test(low));
    },
    instead: 'Hollow marketing verbs. Say what the product does for this user, concretely ("Compare your CV with the offer in 2 minutes").',
  },
  {
    id: 'text-white-in-dark',
    re: /\b(?:text|bg|border)-white\b(?!\/)/,
    instead: '--color-white is redefined in .dark, so white labels turn dark (Figma Audit). Use on-accent / surface tokens.',
  },
];

const stripNonCode = (line) =>
  line
    .replace(/\{\/\*.*?\*\/\}/g, '')
    .replace(/\/\*.*?\*\//g, '')
    .replace(/(^|\s)\/\/.*$/, '$1')
    .replace(/data-testid="[^"]*"/g, '')
    .replace(/https?:\/\/\S+/g, '');

export function scanText(path, text) {
  if (TOKEN_SOURCES.some((re) => re.test(path))) return [];
  const out = [];
  let inTokens = false;
  text.split(/\r?\n/).forEach((raw, i) => {
    // pistes pages inline the real tokens (hex by nature) between these markers
    if (raw.includes('TOKENS:START')) inTokens = true;
    if (inTokens) {
      if (raw.includes('TOKENS:END')) inTokens = false;
      return;
    }
    if (/design-ok:\s*\S/.test(raw)) return;
    const line = stripNonCode(raw);
    if (!line.trim()) return;
    for (const r of RULES) {
      const hit = r.re ? r.re.test(line) : r.test(line);
      if (hit) out.push({ id: r.id, file: path, line: i + 1, excerpt: raw.trim().slice(0, 120), instead: r.instead });
    }
  });
  return out;
}

// Parse a unified diff (git diff -U0) into { file: [[newLineNumber, text], ...] } for added lines.
export function addedLines(diff) {
  const out = {};
  let file = null;
  let n = 0;
  for (const l of diff.split(/\r?\n/)) {
    if (l.startsWith('+++ ')) {
      file = l === '+++ /dev/null' ? null : l.slice(4).replace(/^b\//, '');
      if (file && !out[file]) out[file] = [];
    } else if (l.startsWith('@@')) {
      n = Number(/\+(\d+)/.exec(l)[1]);
    } else if (file && l.startsWith('+')) {
      out[file].push([n, l.slice(1)]);
      n++;
    } else if (file && !l.startsWith('-') && !l.startsWith('\\') && !l.startsWith('diff ')) n++;
  }
  for (const f of Object.keys(out)) if (!out[f].length) delete out[f];
  return out;
}

const SCANNED = (f) => (/^web\/src\/.*\.(tsx?|css)$/.test(f) || /^docs\/design\/pistes\/.*\.html$/.test(f)) && !/\.(test|spec)\.tsx?$/.test(f);

function diffTells(base) {
  const git = (args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const added = { ...addedLines(git(['diff', '-U0', '--no-color', `${base}...HEAD`])) };
  for (const [f, lines] of Object.entries(addedLines(git(['diff', '-U0', '--no-color'])))) added[f] = (added[f] || []).concat(lines);
  const tells = [];
  for (const [f, lines] of Object.entries(added)) {
    if (!SCANNED(f)) continue;
    for (const [n, text] of lines) for (const t of scanText(f, text)) tells.push({ ...t, line: n });
  }
  return { tells, files: Object.keys(added).filter(SCANNED).length };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  let tells, count;
  if (args[0] === '--diff') ({ tells, files: count } = diffTells(args[1] || 'origin/staging'));
  else {
    tells = args.flatMap((f) => scanText(f, readFileSync(f, 'utf8')));
    count = args.length;
  }
  const byId = new Map();
  for (const t of tells) {
    console.log(`${t.file}:${t.line}  [${t.id}]  ${t.excerpt}`);
    byId.set(t.id, t.instead);
  }
  if (tells.length) {
    console.log(`\n${tells.length} tell(s) in ${count} file(s). Fix each, or justify it on the line with "design-ok: <why>".`);
    for (const [id, instead] of byId) console.log(`  ${id}: ${instead}`);
  } else console.log(`No tells in ${count} file(s).`);
  process.exit(tells.length ? 1 : 0);
}
