import { addedLines, scanText } from '../tells.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const CASES = [
  ['hex-literal', '<div style={{ color: "#7c3aed" }} />'],
  ['raw-palette', '<div className="bg-gray-100 text-slate-700" />'],
  ['raw-palette', '<div className="text-indigo-500" />'],
  ['gradient-text', '<h1 className="bg-clip-text text-transparent bg-accent">Hi</h1>'],
  ['gradient-bg', '<div className="bg-gradient-to-r from-accent to-success" />'],
  ['gradient-bg', '<div className="bg-brand-gradient" />'],
  ['pill-button', '<Button className="rounded-full px-6">Start</Button>'],
  ['arbitrary-radius', '<div className="rounded-[20px]" />'],
  ['glass', '<div className="backdrop-blur-md bg-surface/50" />'],
  ['glow-shadow', '<div className="shadow-lg shadow-purple-500/50" />'],
  ['transition-all', '<div className="transition-all duration-300" />'],
  ['emoji', '<p>Ready to ace your interview? 🚀</p>'],
  ['decor-icon', "import { Sparkles } from '@phosphor-icons/react';"],
  ['arrow-cta', '<Button>Get started →</Button>'],
  ['eyebrow-caps', '<span className="text-label-s uppercase tracking-widest">New</span>'],
  ['buzzword', 'title: "Supercharge your job search"'],
  ['buzzword', '"hero": "Booster votre carrière avec l\'IA"'],
  ['text-white-in-dark', '<span className="text-white">Save</span>'],
];

for (const [id, line] of CASES) {
  test(`detects ${id}: ${line.slice(0, 40)}`, () => {
    const tells = scanText('web/src/components/x.tsx', `const a = 1;\n${line}\n`);
    const hit = tells.filter((t) => t.id === id);
    assert.equal(hit.length, 1, JSON.stringify(tells));
    assert.equal(hit[0].line, 2);
    assert.ok(hit[0].instead.length > 10);
  });
}

test('skips token source file', () => {
  assert.deepEqual(scanText('web/src/styles/tailwind.css', '--color-accent: #2b70c9;'), []);
});

test('clean file has no tells', () => {
  const src = `export function Card() {\n  return <div className="rounded-lg bg-surface text-text border border-border p-4">Applications</div>;\n}\n`;
  assert.deepEqual(scanText('web/src/components/card.tsx', src), []);
});

test('ignores hex in comments and test ids', () => {
  assert.deepEqual(scanText('web/src/a.tsx', '// issue #123 fixed\n<div data-testid="row-#1" />'), []);
});

test('line opt-out comment', () => {
  assert.deepEqual(scanText('web/src/a.tsx', '<Button className="rounded-full">Go</Button> {/* design-ok: icon-only round toggle */}'), []);
});

test('addedLines keeps only added lines with their new line numbers', () => {
  const diff = [
    'diff --git a/web/src/a.tsx b/web/src/a.tsx',
    '--- a/web/src/a.tsx',
    '+++ b/web/src/a.tsx',
    '@@ -10,0 +11,2 @@',
    '+<div className="transition-all" />',
    '+<p>ok</p>',
    '@@ -20 +22 @@',
    '-<old />',
    '+<span className="text-white">x</span>',
    'diff --git a/web/src/gone.tsx b/web/src/gone.tsx',
    '+++ /dev/null',
  ].join('\n');
  assert.deepEqual(addedLines(diff), {
    'web/src/a.tsx': [
      [11, '<div className="transition-all" />'],
      [12, '<p>ok</p>'],
      [22, '<span className="text-white">x</span>'],
    ],
  });
});

test('skips the inlined token block of a pistes page', () => {
  const html = ['<style>', '/* TOKENS:START */', ':root { --color-accent: #2b70c9; }', '/* TOKENS:END */', '.x { color: #ff00aa; }', '</style>'].join('\n');
  const tells = scanText('docs/design/pistes/x/index.html', html);
  assert.deepEqual(tells.map((t) => [t.id, t.line]), [['hex-literal', 5]]);
});

test('arrows and check marks are not emoji', () => {
  assert.deepEqual(scanText('web/src/a.tsx', '<dt>Écarts Figma ↔ code ✓ ← ×</dt>'), []);
  assert.equal(scanText('web/src/a.tsx', '<p>Bravo ✨</p>').filter((t) => t.id === 'emoji').length, 1);
});
