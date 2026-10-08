import { prepareZXingModule, readBarcodes } from 'zxing-wasm/reader';
import wasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url';

const options = {
  overrides: {
    locateFile: (path: string, prefix: string) =>
      path.endsWith('.wasm')
        ? new URL(wasmUrl, globalThis.location.origin).href
        : prefix + path,
  },
  fireImmediately: true,
};
globalThis.onmessage = (
  event: MessageEvent<{ width: number; height: number; pixels: ArrayBuffer }>,
) => {
  void (async () => {
    const pixels = new ImageData(
      new Uint8ClampedArray(event.data.pixels),
      event.data.width,
      event.data.height,
    );
    let ready = false;
    try {
      await prepareZXingModule(options);
      ready = true;
      const codes = await readBarcodes(pixels, {
        formats: ['QRCode'],
        tryHarder: true,
        tryRotate: true,
        tryInvert: true,
        maxNumberOfSymbols: 16,
        textMode: 'Plain',
      });
      globalThis.postMessage({
        texts: codes.filter((code) => code.isValid).map((code) => code.text),
      });
    } catch {
      globalThis.postMessage({
        error: ready ? 'imageUnreadable' : 'decoderUnavailable',
      });
    } finally {
      pixels.data.fill(0);
    }
  })();
};
