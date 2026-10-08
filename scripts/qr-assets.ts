import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import {
  ZXING_CPP_COMMIT,
  ZXING_WASM_SHA256,
  ZXING_WASM_VERSION,
} from 'zxing-wasm/reader';

const wasm = await readFile(
  'node_modules/zxing-wasm/dist/reader/zxing_reader.wasm',
);
if (createHash('sha256').update(wasm).digest('hex') !== ZXING_WASM_SHA256)
  throw new Error('Decoder integrity mismatch');
await writeFile(
  'dist/decoder-info.json',
  JSON.stringify(
    {
      version: ZXING_WASM_VERSION,
      cppCommit: ZXING_CPP_COMMIT,
      wasmSha256: ZXING_WASM_SHA256,
      bytes: wasm.byteLength,
    },
    null,
    2,
  ) + '\n',
);
