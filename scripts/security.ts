import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
for (const file of ['dist/index.html', 'dist/en/index.html']) {
  let html = await readFile(file, 'utf8');
  const hashes = [
    ...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g),
  ].map(
    (match) =>
      "'sha256-" +
      createHash('sha256')
        .update(match[1] ?? '')
        .digest('base64') +
      "'",
  );
  const policy = `default-src 'self'; script-src 'self' 'wasm-unsafe-eval' ${hashes.join(' ')}; worker-src blob:; frame-src 'none'; style-src 'self'; img-src 'self' data: blob:; media-src blob:; font-src 'self'; connect-src 'self'; form-action 'none'; base-uri 'none'; object-src 'none'`;
  html = html.replace(
    '<meta charset="utf-8">',
    `<meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${policy}">`,
  );
  await writeFile(file, html);
}
