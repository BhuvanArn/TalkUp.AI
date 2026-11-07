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
