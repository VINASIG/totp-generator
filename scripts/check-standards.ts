import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  checksum,
  digest,
  directoryRoot,
  message,
  parseJson,
  readLocal,
  readOptional,
  record,
  repositoryRoot,
  text,
  writeOutput,
} from './local.ts';

const begin = '<!-- VINASIG STANDARDS BEGIN -->';
const end = '<!-- VINASIG STANDARDS END -->';

export async function verifyStandards(directory = repositoryRoot): Promise<{
  files: number;
  instructionBytes: number;
  runtimeDiscovery: 'NOT_RUN';
}> {
  const root = await directoryRoot(directory);
  const provenance = record(
    parseJson(await readLocal(root, '.vinasig/provenance.json')),
  );
  assert.equal(provenance['format'], 1, 'Unsupported provenance format');
  assert.equal(provenance['repository'], 'VINASIG/agent-standards');
  assert.match(text(provenance['sourceCommit']), /^[a-f0-9]{40}$/);
  assert.equal(
    provenance['profile'],
    'web-typescript',
    'Unexpected consumer profile',
  );
  const bytes = await readLocal(root, '.vinasig/manifest.json');
  assert.equal(
    digest(bytes),
    checksum(provenance['manifestSha256']),
    'Manifest differs from reviewed provenance',
  );
  const manifest = record(parseJson(bytes));
  assert.equal(manifest['format'], 1, 'Unsupported manifest format');
  assert.equal(manifest['version'], text(provenance['version']));
  assert.equal(manifest['profile'], provenance['profile']);
  assert.equal(manifest['bundleSha256'], checksum(provenance['bundleSha256']));
  const source = record(manifest['source']);
  assert.equal(source['repository'], provenance['repository']);
  assert.equal(source['kind'], 'local-content-snapshot');
  assert.match(text(source['ref']), /^sha256:[a-f0-9]{64}$/);
  const files = Object.entries(record(manifest['files']));
  assert(files.length > 0, 'Empty managed snapshot');
  for (const [file, expected] of files) {
    assert(
      file.startsWith('.vinasig/standards/') ||
        /^\.agents\/skills\/vinasig-[a-z0-9-]+\//.test(file),
      `Unmanaged path: ${file}`,
    );
    assert.equal(
      digest(await readLocal(root, file)),
      checksum(expected),
      `Snapshot integrity failed: ${file}`,
    );
  }
  assert.equal(
    await readOptional(root, 'AGENTS.override.md'),
    null,
    'Root override shadows the standards entrypoint',
  );
  const agentsBytes = await readLocal(root, 'AGENTS.md');
  assert(
    agentsBytes.length <= 8192,
    'Root instructions exceed the 8 KiB budget',
  );
  const agents = agentsBytes.toString('utf8');
  assert.equal(
    agents.split(begin).length,
    2,
    'Missing or duplicated standards beginning',
  );
  assert.equal(
    agents.split(end).length,
    2,
    'Missing or duplicated standards ending',
  );
  assert(
    agents.indexOf(end) > agents.indexOf(begin),
    'Invalid standards block order',
  );
  const block = agents.slice(
    agents.indexOf(begin),
    agents.indexOf(end) + end.length,
  );
  assert.equal(
    digest(block),
    checksum(manifest['agentBlock']),
    'Managed instruction block differs from the snapshot',
  );
  return {
    files: files.length,
    instructionBytes: agentsBytes.length,
    runtimeDiscovery: 'NOT_RUN',
  };
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const result = await verifyStandards();
    await writeOutput(
      repositoryRoot,
      'output/checks/standards.json',
      `${JSON.stringify({ status: 'PASS', ...result }, null, 2)}\n`,
    );
    console.log(
      `Standards integrity passed: ${String(result.files)} owned files; ${String(result.instructionBytes)} instruction bytes. Codex runtime discovery NOT_RUN.`,
    );
  } catch (error) {
    console.error(`Standards integrity failed: ${message(error)}`);
    process.exitCode = 1;
  }
}
