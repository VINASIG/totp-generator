import { copy } from '../lib/copy.ts';
import {
  defaults,
  supportsCrypto,
  hotp,
  importSecret,
  parseSecret,
  timeWindow,
  TotpError,
} from '../lib/totp.ts';
import type { InputError, Options } from '../lib/totp.ts';

function element<T extends HTMLElement>(id: string, type: new () => T): T {
  const value = document.getElementById(id);
  if (!(value instanceof type))
    throw new Error('Missing interface element ' + id);
  return value;
}
const c = copy[document.documentElement.lang === 'en' ? 'en' : 'vi'];
const form = element('totp-form', HTMLFormElement);
const secret = element('secret', HTMLInputElement);
const period = element('period', HTMLInputElement);
const offset = element('offset', HTMLInputElement);
const code = element('code', HTMLOutputElement);
const result = element('result', HTMLDivElement);
const empty = element('empty', HTMLParagraphElement);
const status = element('status', HTMLParagraphElement);
const copyStatus = element('copy-status', HTMLParagraphElement);
const copyButton = element('copy', HTMLButtonElement);
const clear = element('clear', HTMLButtonElement);
const reveal = element('reveal', HTMLButtonElement);
const progress = element('progress', HTMLProgressElement);
const remaining = element('remaining', HTMLElement);
const advanced = element('advanced', HTMLDetailsElement);
const technical = element('technical', HTMLDetailsElement);
let revision = 0;
let key: CryptoKey | null = null;
let options: Options = { ...defaults };
let adjustment = 0;
let renderedCounter: bigint | null = null;
let generating = false;
let composing = false;
let importUriPending = false;
let pointerValidationPending = false;
let timer: ReturnType<typeof setInterval> | undefined;
let pause: ReturnType<typeof setTimeout> | undefined;
let label = '';
let currentError: {
  field: 'secret' | 'period' | 'offset';
  code: InputError;
} | null = null;
const touched = new Set<string>();
const timeFormat = new Intl.DateTimeFormat(
  document.documentElement.lang === 'en' ? 'en-GB' : 'vi-VN',
  { hour: '2-digit', minute: '2-digit', second: '2-digit' },
);

function blankOutput() {
  code.value = '';
  result.hidden = true;
  empty.hidden = false;
  technical.hidden = true;
  copyButton.disabled = true;
  renderedCounter = null;
  copyStatus.textContent = '';
}
function invalidate() {
  revision++;
  key = null;
  generating = false;
  if (timer !== undefined) clearInterval(timer);
  if (pause !== undefined) clearTimeout(pause);
  blankOutput();
}
function showErrors(explicit = false) {
  if (pointerValidationPending && !explicit) return;
  for (const field of [secret, period, offset]) {
    const message = element(field.id + '-error', HTMLParagraphElement);
    const visible =
      currentError?.field === field.id && (explicit || touched.has(field.id));
    message.hidden = !visible;
    message.textContent =
      visible && currentError ? c.errors[currentError.code] : '';
    field.setAttribute('aria-invalid', String(visible));
    if (visible && field !== secret) advanced.open = true;
  }
}
function announce(text: string, error = false) {
  status.textContent = text;
  status.dataset['state'] = error ? 'error' : 'ready';
}
function fail(error: unknown, field: 'secret' | 'period' | 'offset') {
  const errorCode = error instanceof TotpError ? error.code : 'crypto';
  currentError = { field, code: errorCode };
  showErrors();
  announce(
    secret.value.trim() ? c.invalid : c.empty,
    Boolean(secret.value.trim()),
  );
}
function readOptions(): Options {
  const chosen = form.querySelector<HTMLInputElement>(
    'input[name="algorithm"]:checked',
  )?.value;
  const digits = form.querySelector<HTMLInputElement>(
    'input[name="digits"]:checked',
  )?.value;
  if (chosen !== 'SHA1' && chosen !== 'SHA256' && chosen !== 'SHA512')
    throw new TotpError('algorithm');
  if (digits !== '6' && digits !== '8') throw new TotpError('digits');
  return {
    algorithm: chosen,
    digits: digits === '8' ? 8 : 6,
    period: Number(period.value),
  };
}
function setChoice(name: string, value: string) {
  for (const input of form.querySelectorAll<HTMLInputElement>(
    'input[type="radio"]',
  )) {
    if (input.name === name) input.checked = input.value === value;
  }
}

async function tick() {
  if (!key || composing) return;
  const localRevision = revision;
  const localKey = key;
  const localOptions = options;
  const windowInfo = timeWindow(Date.now(), localOptions.period, adjustment);
  if (renderedCounter !== windowInfo.counter) {
    // Hide an expired code before the asynchronous signature completes.
    blankOutput();
    if (generating) return;
    generating = true;
    try {
      const value = await hotp(
        localKey,
        windowInfo.counter,
        localOptions.digits,
      );
      if (localRevision !== revision || document.hidden) return;
      if (
        timeWindow(Date.now(), localOptions.period, adjustment).counter !==
        windowInfo.counter
      )
        return;
      code.value = value;
      renderedCounter = windowInfo.counter;
      result.hidden = false;
      empty.hidden = true;
      technical.hidden = false;
      copyButton.disabled = false;
      announce(c.ready);
    } catch (error) {
      if (localRevision === revision) {
        invalidate();
        fail(error, 'secret');
      }
    } finally {
      if (localRevision === revision) generating = false;
    }
  }
  if (localRevision !== revision || renderedCounter !== windowInfo.counter)
    return;
  const seconds = Math.ceil(windowInfo.remaining);
  remaining.textContent = String(seconds);
  element('countdown-unit', HTMLElement).textContent =
    seconds === 1 ? c.second : c.seconds;
  progress.max = localOptions.period;
  progress.value = windowInfo.remaining;
  element('clock', HTMLElement).textContent = timeFormat.format(Date.now());
  element('expiry', HTMLElement).textContent = timeFormat.format(
    windowInfo.expiresAt,
  );
  element('algorithm-value', HTMLElement).textContent = localOptions.algorithm;
  element('digits-value', HTMLElement).textContent = String(
    localOptions.digits,
  );
  element('period-value', HTMLElement).textContent = String(
    localOptions.period,
  );
  element('account', HTMLElement).textContent = label;
  element('account-row', HTMLElement).hidden = !label;
}

async function update() {
  if (composing) return;
  invalidate();
  currentError = null;
  showErrors();
  const localRevision = revision;
  let parsed;
  try {
    parsed = parseSecret(secret.value);
  } catch (error) {
    fail(error, 'secret');
    return;
  }
  try {
    if (importUriPending && parsed.fromUri) {
      setChoice('algorithm', parsed.options.algorithm);
      setChoice('digits', String(parsed.options.digits));
      period.value = String(parsed.options.period);
      offset.value = '0';
      announce(c.imported);
    }
    importUriPending = false;
    if (
      !/^\d+$/.test(period.value) ||
      Number(period.value) < 1 ||
      Number(period.value) > 300
    ) {
      fail(new TotpError('period'), 'period');
      return;
    }
    if (
      !/^-?\d+(?:[.,]\d+)?$/.test(offset.value) ||
      Math.abs(Number(offset.value.replace(',', '.'))) > 300
    ) {
      fail(new TotpError('offset'), 'offset');
      return;
    }
    options = readOptions();
    adjustment = Number(offset.value.replace(',', '.'));
    label = parsed.label;
    const imported = await importSecret(parsed.bytes, options.algorithm);
    if (localRevision !== revision || document.hidden) return;
    key = imported;
    announce(c.loading);
    await tick();
    if (localRevision === revision)
      timer = setInterval(() => {
        void tick();
      }, 200);
  } catch (error) {
    if (localRevision === revision) fail(error, 'secret');
  } finally {
    parsed.bytes.fill(0);
  }
}

function schedule(readUri: boolean) {
  if (readUri) importUriPending = true;
  invalidate();
  currentError = null;
  showErrors();
  announce(secret.value.trim() ? c.loading : c.empty);
  if (!composing)
    pause = setTimeout(() => {
      void update();
    }, 200);
}
secret.addEventListener('compositionstart', () => {
  composing = true;
  invalidate();
});
secret.addEventListener('compositionend', () => {
  composing = false;
  schedule(true);
});
form.addEventListener('input', (event) => {
  if (event.target instanceof HTMLInputElement)
    schedule(event.target === secret);
});
for (const field of [secret, period, offset])
  field.addEventListener('blur', () => {
    touched.add(field.id);
    // Wait until a pointer action finishes so error reflow cannot swallow Clear.
    setTimeout(() => {
      if (!pointerValidationPending) showErrors();
    }, 0);
  });
form.addEventListener('pointerdown', (event) => {
  if (event.button === 0 && event.isPrimary) pointerValidationPending = true;
});
function finishPointerValidation() {
  pointerValidationPending = false;
  showErrors();
}
document.addEventListener('click', finishPointerValidation);
document.addEventListener('pointercancel', finishPointerValidation);
document.addEventListener('pointerup', (event) => {
  if (!(event.target instanceof Node) || !form.contains(event.target))
    finishPointerValidation();
});
form.addEventListener('submit', (event) => {
  event.preventDefault();
  touched.add('secret');
  touched.add('period');
  touched.add('offset');
  void update().then(() => {
    showErrors(true);
  });
});
reveal.addEventListener('click', () => {
  const showing = secret.type === 'password';
  secret.type = showing ? 'text' : 'password';
  reveal.setAttribute('aria-label', showing ? c.hide : c.show);
  reveal.title = showing ? c.hide : c.show;
  reveal.setAttribute('aria-pressed', String(showing));
});
function reset() {
  pointerValidationPending = false;
  importUriPending = false;
  composing = false;
  invalidate();
  form.reset();
  secret.value = '';
  secret.type = 'password';
  reveal.setAttribute('aria-label', c.show);
  reveal.title = c.show;
  reveal.setAttribute('aria-pressed', 'false');
  options = { ...defaults };
  adjustment = 0;
  label = '';
  element('account', HTMLElement).textContent = '';
  technical.open = false;
  advanced.open = false;
  currentError = null;
  touched.clear();
  showErrors();
  announce(c.empty);
}
clear.addEventListener('click', () => {
  reset();
  secret.focus();
});
copyButton.addEventListener('click', () => {
  const localRevision = revision;
  const localKey = key;
  if (!localKey || document.hidden) return;
  copyButton.disabled = true;
  void (async () => {
    try {
      // Recompute at click time, including when the tab or timer was throttled.
      for (let attempt = 0; attempt < 3; attempt++) {
        const counter = timeWindow(
          Date.now(),
          options.period,
          adjustment,
        ).counter;
        const value = await hotp(localKey, counter, options.digits);
        if (revision !== localRevision || document.hidden) return;
        if (
          counter !== timeWindow(Date.now(), options.period, adjustment).counter
        )
          continue;
        await navigator.clipboard.writeText(value);
        if (revision === localRevision) copyStatus.textContent = c.copied;
        return;
      }
      throw new TotpError('crypto');
    } catch {
      if (revision === localRevision) copyStatus.textContent = c.copyFailed;
    } finally {
      if (revision === localRevision && renderedCounter !== null)
        copyButton.disabled = false;
    }
  })();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) invalidate();
  else void update();
});
window.addEventListener('pagehide', reset);
window.addEventListener('pageshow', (event) => {
  if (event.persisted) reset();
});
if (supportsCrypto()) {
  for (const control of form.querySelectorAll<
    HTMLInputElement | HTMLButtonElement
  >('input, button'))
    control.disabled = false;
  // Defeat browser form restoration and BFCache carrying a sensitive value.
  reset();
} else announce(c.unavailable, true);
