import { execFile } from 'node:child_process';
import { mkdtemp, writeFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

const CAPTURE = join(dirname(fileURLToPath(import.meta.url)), '..', 'capture.mjs');
const run = promisify(execFile);

const png = async (file) => {
  const b = Buffer.from(await (await import('node:fs/promises')).readFile(file));
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
};

test('captures a region in dark without dev overlays', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'cap-'));
  const page = join(dir, 'p.html');
  await writeFile(page, `<!doctype html><html><head><style>body{margin:0}.box{width:300px;height:120px;background:#fff}.dark .box{background:#17253f}
    .TanStackRouterDevtools{position:fixed;top:0;left:0;width:300px;height:120px;background:red}</style></head>
    <body><div class="box" id="hero"></div><footer class="TanStackRouterDevtools"></footer></body></html>`);
  const out = join(dir, 'context.png');
  await run(process.execPath, [CAPTURE, pathToFileURL(page).href, '--out', out, '--theme', 'dark', '--width', '800', '--clip', '#hero']);
  assert.deepEqual(await png(out), { w: 300, h: 120 });
  assert.ok((await stat(out)).size > 0);
});
