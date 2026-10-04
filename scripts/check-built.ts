import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { FileSystemConfigLoader, HtmlValidate } from 'html-validate';
import {
  digest,
  parseJson,
  readLocal,
  record,
  repositoryRoot,
  text,
  writeOutput,
} from './local.ts';
for (const [route, lang] of [
  ['', 'vi'],
  ['en/', 'en'],
] as const) {
  const html = (await readFile('dist/' + route + 'index.html')).toString();
  const validation = await new HtmlValidate(
    new FileSystemConfigLoader(),
  ).validateString(html, 'dist/' + route + 'index.html');
  assert(
    validation.valid,
    JSON.stringify(
      validation.results.flatMap((result) => result.messages),
      null,
      2,
    ),
  );
  assert(html.includes(`<html lang="${lang}">`));
  assert(html.includes(`href="https://totp.vinasig.io.vn/${route}"`));
  assert.equal((html.match(/hreflang=/g) ?? []).length, 4);
  assert(
    html.includes('WebApplication') && html.includes('UtilitiesApplication'),
  );
  assert(
    html.includes("connect-src 'none'") && html.includes("form-action 'none'"),
  );
  assert(!html.includes('name="secret"'));
  assert(html.includes('data-source-link'));
  for (const match of html.matchAll(
    /<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g,
  ))
    assert(
      html.includes(
        createHash('sha256')
          .update(match[1] ?? '')
          .digest('base64'),
      ),
    );
  assert(
    (await readFile('dist/sitemap.xml', 'utf8')).includes(
      `https://totp.vinasig.io.vn/${route}`,
    ),
  );
}
const manifest = record(
  parseJson(await readLocal(repositoryRoot, 'docs/asset-manifest.json')),
);
const assets = Object.entries(record(manifest['files']));
assert.equal(assets.length, 9);
for (const [file, expected] of assets) {
  const bytes = await readLocal(repositoryRoot, file);
  assert.equal(digest(bytes), text(expected), 'Changed asset ' + file);
  assert.deepEqual(
    await readLocal(repositoryRoot, 'dist/' + file.slice(7)),
    bytes,
  );
}
assert.deepEqual(
  await readFile('public/licenses/lucide.txt'),
  await readFile('node_modules/@lucide/astro/LICENSE'),
);
await writeOutput(
  repositoryRoot,
  'output/checks/built.json',
  JSON.stringify({
    status: 'PASS',
    routes: 2,
    preservedAssets: assets.length,
    csp: 'hash-based scripts; no connections or form submissions',
  }),
);
console.log('Bilingual HTML, metadata, CSP and preserved assets passed.');
