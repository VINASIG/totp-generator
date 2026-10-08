import { copy } from '../lib/copy.ts';
import { checkQrImage, provisioningQr, QrError } from '../lib/qr.ts';

interface Hooks {
  start: () => void;
  apply: (uri: string) => Promise<void>;
  restore: () => Promise<void>;
}
export function installQrControls(hooks: Hooks) {
  const c = copy[document.documentElement.lang === 'en' ? 'en' : 'vi'].qr;
  function element<T extends HTMLElement>(id: string, type: new () => T): T {
    const node = document.getElementById(id);
    if (!(node instanceof type)) throw new Error('Missing QR control');
    return node;
  }
  const panel = element('qr-import', HTMLDetailsElement);
  const file = element('qr-file', HTMLInputElement);
  const upload = element('qr-upload', HTMLButtonElement);
  const paste = element('qr-paste', HTMLTextAreaElement);
  const dropzone = element('qr-dropzone', HTMLDivElement);
  const camera = element('qr-camera', HTMLButtonElement);
  const cameraPanel = element('qr-camera-panel', HTMLDivElement);
  const video = element('qr-video', HTMLVideoElement);
  const cameraError = element('qr-camera-error', HTMLParagraphElement);
  const stop = element('qr-cancel', HTMLButtonElement);
  const stopLabel = element('qr-cancel-label', HTMLSpanElement);
  const status = element('qr-status', HTMLParagraphElement);
  const fileError = element('qr-file-error', HTMLParagraphElement);
  const pasteError = element('qr-paste-error', HTMLParagraphElement);
  let revision = 0;
  let active: AbortController | undefined;
  let pause: ReturnType<typeof setTimeout> | undefined;
  let composing = false;
  function errors() {
    fileError.textContent = '';
    fileError.hidden = true;
    pasteError.textContent = '';
    pasteError.hidden = true;
    cameraError.textContent = '';
    cameraError.hidden = true;
    upload.setAttribute('aria-invalid', 'false');
    paste.setAttribute('aria-invalid', 'false');
    camera.setAttribute('aria-invalid', 'false');
  }
  function cancel() {
    revision++;
    active?.abort();
    active = undefined;
    cameraPanel.hidden = true;
    camera.setAttribute('aria-expanded', 'false');
    if (pause !== undefined) clearTimeout(pause);
    pause = undefined;
    panel.setAttribute('aria-busy', 'false');
    stop.hidden = true;
    file.value = '';
    paste.value = '';
    errors();
    status.textContent = '';
  }
  async function run(
    source: Blob | string | null,
    origin: 'file' | 'paste' | 'camera' = 'file',
  ) {
    cancel();
    const id = revision;
    const controller = new window.AbortController();
    active = controller;
    hooks.start();
    panel.open = true;
    panel.setAttribute('aria-busy', 'true');
    stop.hidden = false;
    stopLabel.textContent = origin === 'camera' ? c.stopCamera : c.cancel;
    status.textContent = origin === 'camera' ? c.cameraRequest : c.scanning;
    const current = () =>
      revision === id && !controller.signal.aborted && !document.hidden;
    try {
      let uri: string;
      if (origin === 'camera') {
        cameraPanel.hidden = false;
        camera.setAttribute('aria-expanded', 'true');
        const scanner = await import('./qr-camera.ts');
        if (!current()) return;
        uri = await scanner.scanCamera(video, controller.signal, () => {
          if (current()) status.textContent = c.cameraScanning;
        });
      } else if (typeof source === 'string') {
        if (!source.trim()) throw new QrError('pasteUnavailable');
        uri = provisioningQr([source.trim()]);
      } else if (source instanceof Blob) {
        await checkQrImage(source);
        const reader = await import('./qr-reader.ts');
        if (!current()) return;
        uri = await reader.decodeQr(source, controller.signal);
      } else throw new QrError('pasteUnavailable');
      if (!current()) return;
      await hooks.apply(uri);
      if (current()) {
        status.textContent = c.imported;
      }
    } catch (error) {
      if (!current()) return;
      const reason =
        error instanceof QrError
          ? error.code
          : origin === 'camera'
            ? 'cameraBusy'
            : 'imageUnreadable';
      const message =
        origin === 'camera'
          ? cameraError
          : origin === 'paste'
            ? pasteError
            : fileError;
      message.textContent = c.errors[reason];
      message.hidden = false;
      (origin === 'camera'
        ? camera
        : origin === 'paste'
          ? paste
          : upload
      ).setAttribute('aria-invalid', 'true');
      status.textContent = '';
      await hooks.restore();
    } finally {
      if (current()) {
        active = undefined;
        panel.setAttribute('aria-busy', 'false');
        stop.hidden = true;
        file.value = '';
        cameraPanel.hidden = true;
        camera.setAttribute('aria-expanded', 'false');
      }
    }
  }
  upload.addEventListener('click', () => {
    file.click();
  });
  camera.addEventListener('click', () => {
    void run(null, 'camera');
  });
  dropzone.addEventListener('click', () => {
    paste.focus();
  });
  file.addEventListener('change', () => {
    const image = file.files?.[0];
    if (image) void run(image);
  });
  function receive(data: DataTransfer | null) {
    const files = [...(data?.files ?? [])];
    if (files.length > 1) {
      cancel();
      pasteError.textContent = c.errors.pasteMultiple;
      pasteError.hidden = false;
      paste.setAttribute('aria-invalid', 'true');
      void hooks.restore();
      return;
    }
    const source = files[0] ?? data?.getData('text/plain') ?? '';
    void run(source, 'paste');
  }
  panel.addEventListener('paste', (event) => {
    if (!(event instanceof ClipboardEvent) || paste.disabled) return;
    event.preventDefault();
    receive(event.clipboardData);
  });
  dropzone.addEventListener('dragover', (event) => {
    if (paste.disabled) return;
    event.preventDefault();
    dropzone.dataset['dragging'] = 'true';
  });
  dropzone.addEventListener('dragleave', () => {
    delete dropzone.dataset['dragging'];
  });
  dropzone.addEventListener('drop', (event) => {
    if (paste.disabled) return;
    event.preventDefault();
    delete dropzone.dataset['dragging'];
    receive(event.dataTransfer);
  });
  paste.addEventListener('input', () => {
    if (composing) return;
    const value = paste.value;
    const wasBusy = Boolean(active);
    cancel();
    paste.value = value;
    if (wasBusy) void hooks.restore();
    if (value)
      pause = setTimeout(() => {
        void run(value, 'paste');
      }, 200);
  });
  paste.addEventListener('compositionstart', () => {
    composing = true;
    cancel();
  });
  paste.addEventListener('compositionend', () => {
    composing = false;
    paste.dispatchEvent(new Event('input', { bubbles: true }));
  });
  paste.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !composing) {
      event.preventDefault();
      void run(paste.value, 'paste');
    }
  });
  stop.addEventListener('click', () => {
    const wasCamera = !cameraPanel.hidden;
    cancel();
    status.textContent = wasCamera ? c.cameraCancelled : c.cancelled;
    void hooks.restore();
    (wasCamera ? camera : upload).focus();
  });
  panel.addEventListener('toggle', () => {
    if (!panel.open && active) {
      cancel();
      void hooks.restore();
    }
  });
  panel.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && active) {
      event.preventDefault();
      stop.click();
    }
  });
  return {
    cancel,
    reset: () => {
      cancel();
      composing = false;
      panel.open = false;
    },
  };
}
