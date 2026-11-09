import { test } from "node:test";
import assert from "node:assert/strict";
import { frTypo, frTypoHtml } from "../fr-typo.mjs";

const NNBSP = " ";
const NBSP = " ";

test("narrow no-break space before ; ! ? and inside guillemets", () => {
  assert.equal(
    frTypo("Prêt ? Oui ! « Envoyer »"),
    `Prêt${NNBSP}? Oui${NNBSP}! «${NNBSP}Envoyer${NNBSP}»`,
  );
});

test("no-break space before colon, numbers and units", () => {
  assert.equal(
    frTypo("Statut : envoyée, 10 min, 12 €, 3 h"),
    `Statut${NBSP}: envoyée, 10${NBSP}min, 12${NBSP}€, 3${NBSP}h`,
  );
});

test("leaves URLs, times and already-correct text alone", () => {
  assert.equal(
    frTypo("https://talkup.ai/a?b=1 à 14:30"),
    "https://talkup.ai/a?b=1 à 14:30",
  );
  assert.equal(frTypo(`Prêt${NNBSP}?`), `Prêt${NNBSP}?`);
});

test('frTypoHtml only touches text inside data-lang="fr" elements', () => {
  const html =
    '<span data-lang="fr">Prêt ?</span><span data-lang="en">Ready ?</span><p>Hors : FR</p>';
  assert.equal(
    frTypoHtml(html),
    `<span data-lang="fr">Prêt${NNBSP}?</span><span data-lang="en">Ready ?</span><p>Hors : FR</p>`,
  );
});

test("frTypoHtml ignores the html element, style and script, and handles nesting", () => {
  const html =
    '<html data-lang="fr"><head><style>p { line-height: 1.2; }</style></head><body>' +
    '<p data-lang="en">Not received ?</p>' +
    '<p data-lang="fr">Pas reçu ? <strong>Renvoyer</strong> : maintenant</p>' +
    "<script>const a = b ? c : d;</script></body></html>";
  const out = frTypoHtml(html);
  assert.ok(out.includes("<style>p { line-height: 1.2; }</style>"));
  assert.ok(out.includes('<p data-lang="en">Not received ?</p>'));
  assert.ok(
    out.includes(
      `Pas reçu${NNBSP}? <strong>Renvoyer</strong>${NBSP}: maintenant`,
    ),
  );
  assert.ok(out.includes("<script>const a = b ? c : d;</script>"));
});

test('lang="en" inside a French element is left alone', () => {
  const html =
    '<p data-lang="fr">Angle : <q lang="en">limit it: correctness first</q> ?</p>';
  assert.equal(
    frTypoHtml(html),
    `<p data-lang="fr">Angle${NBSP}: <q lang="en">limit it: correctness first</q>${NNBSP}?</p>`,
  );
});

test("HTML entities and ?! stay intact", () => {
  assert.equal(
    frTypo("Questions &amp; réponses&nbsp;: l&rsquo;offre ?!"),
    `Questions &amp; réponses${NBSP}: l&rsquo;offre${NNBSP}?!`,
  );
});
