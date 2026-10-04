import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { lstat, mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));
export const digest = (bytes: Uint8Array | string): string =>
  createHash('sha256').update(bytes).digest('hex');

export function record(value: unknown): Record<string, unknown> {
  assert(
    value !== null && typeof value === 'object' && !Array.isArray(value),
    'Expected an object',
  );
  return value as Record<string, unknown>;
}

export function text(value: unknown): string {
  assert(
    typeof value === 'string' && value.length > 0,
    'Expected nonempty text',
  );
  return value;
}

export function checksum(value: unknown): string {
  const result = text(value);
  assert(/^[a-f0-9]{64}$/.test(result), 'Invalid SHA-256');
  return result;
}

export function parseJson(bytes: Uint8Array): unknown {
  return JSON.parse(Buffer.from(bytes).toString('utf8')) as unknown;
}

export function safeRelative(value: string): void {
  const parts = value.split('/');
  assert(
    parts.length > 0 &&
      parts.every(
        (part) =>
          /^[A-Za-z0-9_. -]+$/.test(part) && part !== '.' && part !== '..',
      ),
    `Unsafe path: ${value}`,
  );
}

function missing(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

export async function directoryRoot(directory: string): Promise<string> {
  const target = path.resolve(directory);
  const stat = await lstat(target);
  assert(
    stat.isDirectory() && !stat.isSymbolicLink(),
    'Target must be a real directory',
  );
  return realpath(target);
}

export async function localPath(
  root: string,
  relative: string,
  allowMissing = false,
): Promise<string> {
  safeRelative(relative);
  let current = root;
  for (const part of relative.split('/')) {
    current = path.join(current, part);
    try {
      assert(
        !(await lstat(current)).isSymbolicLink(),
        `Symlink boundary: ${relative}`,
      );
    } catch (error) {
      if (allowMissing && missing(error)) continue;
      throw error;
    }
  }
  return current;
}

export async function readLocal(
  root: string,
  relative: string,
): Promise<Buffer> {
  return readFile(await localPath(root, relative));
}

export async function readOptional(
  root: string,
  relative: string,
): Promise<Buffer | null> {
  try {
    return await readFile(await localPath(root, relative, true));
  } catch (error) {
    if (missing(error)) return null;
    throw error;
  }
}

export async function writeOutput(
  root: string,
  relative: string,
  value: string,
): Promise<void> {
  assert(relative.startsWith('output/'), 'Reports must stay inside output/');
  const target = await localPath(root, relative, true);
  await mkdir(path.dirname(target), { recursive: true });
  await localPath(root, relative, true);
  await writeFile(target, value, 'utf8');
}

export const message = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);
