import path from 'path';
import type { Plugin } from 'vite';

/**
 * TalkingHead dynamically imports `./lipsync-*.mjs` relative to its module.
 * Vite's dep optimizer cannot resolve those paths — this plugin maps them
 * to the real files in node_modules.
 */
export function talkingHeadLipsyncPlugin(): Plugin {
  const lipsyncDir = path.resolve(
    __dirname,
    '../../node_modules/@met4citizen/talkinghead/modules',
  );

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
  };
}
