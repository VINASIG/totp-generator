import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function local(root, relative) {
  assert(
    typeof relative === 'string' &&
      relative.length > 0 &&
      !relative.includes('\\') &&
      !path.isAbsolute(relative) &&
      relative
        .split('/')
        .every((part) => part && part !== '.' && part !== '..'),
    'Unsafe license path',
  );
  return path.join(root, relative);
}

export async function verifyLicenses(root, built = false) {
  const read = (relative) => readFile(local(root, relative));
  const pkg = JSON.parse(await read('package.json'));
  const lock = JSON.parse(await read('package-lock.json'));
  const id = pkg.license;
  assert(
    ['AGPL-3.0-or-later', 'GPL-3.0-or-later', 'LGPL-3.0-or-later'].includes(id),
    'Select an explicit supported software SPDX license',
  );
  assert.equal(lock.license, id, 'Lockfile software license drift');
  assert.equal(lock.packages[''].license, id, 'Root package license drift');
  const sources = JSON.parse(await read('docs/license-text-sources.json'));
  assert(Array.isArray(sources) && sources.length >= 2);
  assert(sources.some((source) => source.id === id));
  assert(sources.some((source) => source.id === 'CC-BY-SA-4.0'));
  const scope = (await read('LICENSES.md')).toString();
  assert(scope.includes(id) && scope.includes('CC-BY-SA-4.0'));
  assert(scope.includes('either version 3 of the License'));
  assert(scope.includes('any later version'));
  assert(scope.includes('BRAND_POLICY.md'));
  const policy = (await read('BRAND_POLICY.md')).toString();
  assert(policy.includes('Written permission required'));
  assert(policy.includes('imposes no additional restriction'));
  let files = 0;
  let primary = false;
  for (const source of sources) {
    assert.match(source.sha256, /^[a-f0-9]{64}$/);
    assert(new URL(source.url).protocol === 'https:');
    assert(Array.isArray(source.files) && source.files.length > 0);
    for (const relative of source.files) {
      if (relative === 'LICENSE') primary = true;
      const bytes = await read(relative);
      assert.equal(
        createHash('sha256').update(bytes).digest('hex'),
        source.sha256,
        'Changed standard license text ' + relative,
      );
      files++;
      if (
        built &&
        (relative.startsWith('public/') ||
          relative.startsWith('assets/licenses/'))
      ) {
        const distributed = relative.startsWith('public/')
          ? 'dist/' + relative.slice(7)
          : 'dist/' + relative;
        assert.deepEqual(await read(distributed), bytes, 'Built license drift');
      }
    }
  }
  assert(primary, 'No primary LICENSE recorded');
  if (id === 'AGPL-3.0-or-later') {
    const folder = pkg.name.includes('unphar')
      ? 'assets/licenses/'
      : 'public/licenses/';
    const notice = (await read(folder + 'NOTICE.txt')).toString();
    assert(notice.includes('Corresponding Source'));
    assert(notice.includes('https://github.com/VINASIG/'));
    assert.deepEqual(
      await read(folder + 'BRAND_POLICY.md'),
      await read('BRAND_POLICY.md'),
    );
    if (built) {
      const published = folder.startsWith('public/')
        ? 'dist/licenses/'
        : 'dist/' + folder;
      assert.deepEqual(
        await read(published + 'NOTICE.txt'),
        await read(folder + 'NOTICE.txt'),
      );
      assert.deepEqual(
        await read(published + 'BRAND_POLICY.md'),
        await read('BRAND_POLICY.md'),
      );
    }
  }
  return { status: 'PASS', software: id, licenseFiles: files, built };
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  console.log(
    JSON.stringify(
      await verifyLicenses(process.cwd(), process.argv.includes('--built')),
    ),
  );
