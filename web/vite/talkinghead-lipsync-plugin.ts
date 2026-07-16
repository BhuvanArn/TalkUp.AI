import fs from 'fs';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Plugin } from 'vite';

const require = createRequire(import.meta.url);
const pluginDir = path.dirname(fileURLToPath(import.meta.url));

function resolveLipsyncDir(): string {
  try {
    const pkgJson = require.resolve('@met4citizen/talkinghead/package.json');
    return path.join(path.dirname(pkgJson), 'modules');
  } catch {
    // Fallback for environments where require.resolve differs at config load time.
    return path.resolve(
      pluginDir,
      '../../node_modules/@met4citizen/talkinghead/modules',
    );
  }
}

/**
 * TalkingHead dynamically imports `./lipsync-*.mjs` next to its bundle chunk.
 * Vite resolves those paths at build time but does not emit the raw .mjs files,
 * so production (e.g. Vercel) returns index.html for /assets/lipsync-fr.mjs.
 */
export function talkingHeadLipsyncPlugin(): Plugin {
  const lipsyncDir = resolveLipsyncDir();

  return {
    name: 'talkinghead-lipsync-resolver',
    enforce: 'pre',
    resolveId(source, importer) {
      if (!importer?.includes('@met4citizen/talkinghead')) return null;
      if (!source.startsWith('./lipsync-') || !source.endsWith('.mjs')) {
        return null;
      }
      return path.join(lipsyncDir, source.slice(2));
    },
    generateBundle() {
      if (!fs.existsSync(lipsyncDir)) {
        this.warn(
          `[talkinghead-lipsync] modules directory not found: ${lipsyncDir}`,
        );
        return;
      }

      for (const file of fs.readdirSync(lipsyncDir)) {
        if (!file.startsWith('lipsync-') || !file.endsWith('.mjs')) continue;

        const source = fs.readFileSync(path.join(lipsyncDir, file));
        this.emitFile({
          type: 'asset',
          fileName: `assets/${file}`,
          source,
        });
      }
    },
  };
}
