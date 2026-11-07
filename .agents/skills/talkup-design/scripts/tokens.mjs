// Extract TalkUp design tokens from web/src/styles/tailwind.css so standalone pages
// (pistes) render with the real values, in light, dark and organization view.
//
//   extractTokens(css) → { light, dark, org, orgDark, utilities }
//   tokensToCss(tokens) → CSS scoped on <html data-theme="dark"> / data-view="organization"

const BLOCKS = {
  light: [/^@theme\s*\{/m, /^:root\s*\{/m, /^@theme inline\s*\{/m],
  dark: [/^\.dark\s*\{/m],
  org: [/^:root\[data-view='organization'\]\s*\{/m],
  orgDark: [/^:root\.dark\[data-view='organization'\]\s*\{/m],
};

// Body of the `{ … }` block that starts at `index` (brace-balanced).
function blockAt(css, index) {
  const open = css.indexOf("{", index);
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}" && --depth === 0) return css.slice(open + 1, i);
  }
  return "";
}

const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "");

function vars(body) {
  const out = {};
  for (const m of stripComments(body).matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g))
    out[m[1]] = m[2].trim();
  return out;
}

export function extractTokens(css) {
  const t = {};
  for (const [name, starts] of Object.entries(BLOCKS)) {
    t[name] = {};
    for (const re of starts) {
      const m = re.exec(css);
      if (m) Object.assign(t[name], vars(blockAt(css, m.index)));
    }
  }
  // Typography utilities (.text-h1 … .text-button-s) are plain CSS on the tokens: reuse them.
  const layer = /^@layer utilities\s*\{/m.exec(css);
  const body = layer ? stripComments(blockAt(css, layer.index)) : "";
  t.utilities = [...body.matchAll(/^\s*(\.text-[\w-]+)\s*\{([^}]*)\}/gm)]
    .map((m) => `${m[1]} {${m[2]}}`)
    .join("\n");
  return t;
}

const decl = (o) =>
  Object.entries(o)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n");

export function tokensToCss(t) {
  return [
    `:root {\n${decl(t.light)}\n}`,
    `[data-theme='dark'] {\n${decl(t.dark)}\n}`,
    `[data-view='organization'] {\n${decl(t.org)}\n}`,
    `[data-theme='dark'][data-view='organization'] {\n${decl(t.orgDark)}\n}`,
    t.utilities,
  ].join("\n\n");
}
