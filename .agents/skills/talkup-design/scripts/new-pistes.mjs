#!/usr/bin/env node
// Create a pistes page from the template, with the current TalkUp tokens inlined.
//
//   node new-pistes.mjs <slug> --title "<titre>" [--count 2|3] [--out docs/design/pistes]
//
// Writes <out>/<slug>/index.html (--out is the parent folder; the slug folder is added).
// Refuses to overwrite an existing folder.
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { extractTokens, tokensToCss } from "./tokens.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(here, "..", "..", "..", "..");
const TEMPLATE = join(here, "..", "templates", "pistes.html");
const TAILWIND = join(REPO, "web", "src", "styles", "tailwind.css");

const LETTERS = "ABC";

const pisteSkeleton = (letter) => `
        <section class="piste" data-piste="${letter}" aria-labelledby="piste-${letter}-title">
          <div class="piste-meta">
            <h2 id="piste-${letter}-title">Piste ${letter} : <!-- nom court --></h2>
            <!-- One sentence per line: the page must be read in five minutes. -->
            <dl>
              <div><dt>Intention</dt><dd><!-- une phrase : ce que la piste cherche à faire pour l'utilisateur --></dd></div>
              <div><dt>Idée forte</dt><dd><!-- l'unique élément audacieux de l'écran ; le reste est calme --></dd></div>
              <div><dt>Références</dt><dd><ul><li><!-- <a href="…">produit réel</a> : ce qu'on en retient --></li></ul></dd></div>
              <div><dt>Lois UX</dt><dd><!-- ex. Proximité (Gestalt), Fitts, Hick : comment elles s'appliquent ici --></dd></div>
              <div><dt>États et mesures</dt><dd><!-- chiffres mesurés sur la maquette : contrastes (ex. 6,2:1), cibles (40 px), écarts (16 / 32 px), états montrés --></dd></div>
              <div><dt>Compromis</dt><dd><!-- ce que cette piste sacrifie --></dd></div>
              <div><dt>Écarts Figma ↔ code</dt><dd><!-- éléments de docs/design/figma-backlog.md concernés, ou « aucun » --></dd></div>
            </dl>
          </div>
          <div class="piste-canvas">
            <!-- Maquette. Tokens only (var(--color-…), .text-h3 …). Real content at real length, in both languages:
                 <span data-lang="fr">Toutes les candidatures</span><span data-lang="en">All applications</span>
                 Check it at 390 px: nothing cut off. Same persona and data in every piste.
                 Small change: a capture of the real screen cropped to the zone at real size (capture.mjs --clip) in
                 <div class="context"><img src="context.png" alt="…">
                 <div class="slot" style="left:…;top:…;width:…">variant</div></div>. -->
            <p data-lang="fr">Maquette de la piste ${letter}</p>
            <p data-lang="en">Piste ${letter} mockup</p>
          </div>
        </section>`;

function parse(argv) {
  const o = {
    count: 3,
    out: join(REPO, "docs", "design", "pistes"),
    title: null,
    slug: null,
  };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--title") o.title = argv[++i];
    else if (argv[i] === "--count") o.count = Number(argv[++i]);
    else if (argv[i] === "--out") o.out = resolve(argv[++i]);
    else o.slug = argv[i];
  }
  return o;
}

const o = parse(process.argv.slice(2));
if (
  !o.slug ||
  !/^[a-z0-9-]+$/.test(o.slug) ||
  !o.title ||
  ![2, 3].includes(o.count)
) {
  console.error(
    'usage: node new-pistes.mjs <kebab-slug> --title "<titre>" [--count 2|3] [--out dir]',
  );
  process.exit(2);
}
const dir = join(o.out, o.slug);
if (existsSync(dir)) {
  console.error(`${dir} exists: pick another slug or edit the existing page.`);
  process.exit(1);
}

const escape = (s) =>
  s.replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
const now = new Date();
const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
const tokens = tokensToCss(extractTokens(await readFile(TAILWIND, "utf8")));
const html = (await readFile(TEMPLATE, "utf8"))
  .replace("/* TOKENS:END */", `${tokens}\n      /* TOKENS:END */`)
  .replaceAll("{{TITLE}}", escape(o.title))
  .replaceAll("{{SLUG}}", o.slug)
  .replaceAll("{{DATE}}", date)
  .replace(
    "<!-- PISTES -->",
    [...LETTERS.slice(0, o.count)].map(pisteSkeleton).join("\n"),
  );

await mkdir(dir, { recursive: true });
await writeFile(join(dir, "index.html"), html);
console.log(join(dir, "index.html"));
