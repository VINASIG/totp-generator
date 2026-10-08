# VINASIG TOTP Generator

Generate verification codes from a Base32 secret, an `otpauth://totp/` setup link, a QR image or an explicit VINASIG share link. The Vietnamese root and English `/en/` provide automatic updates, a countdown, explicit copy, masked key entry, inline errors, clear, and light/dark themes. Visit [the tool](https://totp.vinasig.io.vn/).

SHA1, SHA256 and SHA512, 6/8 digits, periods of 1-300 seconds and a bounded clock adjustment are supported. Defaults are SHA1, 6 digits and 30 seconds. Use the settings required by your service. HOTP links are rejected.

Normal key entry and codes stay in browser memory. Share key explicitly creates a credential-bearing URL fragment containing the key and current algorithm, digit count and period. Opening it imports the key and settings, removes the fragment from the current address, and starts calculating codes. A share link grants anyone who obtains it the ability to generate codes until the service replaces the key. It is not encrypted, expiring or single use. Keep it private, including in messages, clipboard and browser history/sync. Read [the sharing design](docs/audits/share-decision-2026-10-07.md).

Manual keys, pasted setup URLs, decoded provisioning payloads and codes are not placed in HTTP requests or submitted to an API. Choosing a local QR image reads it on your device without upload. Setup URLs are parsed as data, never opened or fetched. A hash-based Content Security Policy limits connections to same-origin assets and blocks frames and form submissions. All decoder code, WASM, fonts, artwork, scripts and styles are self-hosted. Reloading or leaving the page clears the session. Clipboard content is controlled by the device. Once loaded, calculation works without a network. QR reading needs the decoder assets to be available. There is no offline cache or service worker. Browser extensions, history/sync and compromised device/page code remain outside this protection.

Paste a Base32 key or an `otpauth://totp/...` setup URL into **Secret key or TOTP setup URL**. Alternatively, open **Import from a QR code** and choose a PNG, JPEG, WebP or GIF screenshot. The blue dashed intake area accepts an image or setup URL through Ctrl+V, the phone keyboard's Paste action or drag/drop. Clipboard images require the browser/keyboard to provide image data; file selection remains available. The Paste image button requests clipboard images only after an explicit click. Native keyboard paste uses the data supplied by the paste event without a clipboard-read request. Missing capability or permission denial falls back to keyboard paste or file selection. **Scan with camera** requests video access only after you click it, prefers the rear camera and reads frames locally without recording or upload. Camera tracks stop after an accepted QR, cancellation, error, edit, reset, closing the disclosure, leaving the tab/page or a two-minute scan limit. Camera availability depends on HTTPS, browser support, device and permission. One valid TOTP setup QR imports the key and algorithm/digits/period, then starts code generation. HOTP, ordinary web URLs, multi-account migration exports and ambiguous multiple QR images are rejected. Images are bounded to 20 MiB, 24 million pixels and 12,000 pixels per side. Read [the QR design and evidence](docs/audits/qr-import-2026-10-08.md).

## Run locally

Use Node 24.21.0 and npm 12.2.0. No global upgrade is required.

```sh
npx --yes npm@12.2.0 ci
npx --yes npm@12.2.0 run dev
```

Use the local URL reported by Astro. Web Crypto requires HTTPS or a trusted localhost context. Preview the production security policy with `npm run build` and `npm run preview`.

## Verification

```sh
npm run check
npm test
npm run build
npm run test:browser
npm run test:performance
```

Unit tests include all 18 RFC 6238 vectors, the RFC 4226 counters, strict decoding, URI errors, clock boundaries and an independent Node HMAC reference. Browser tests exercise Chromium, Firefox and WebKit on the production build. CI runs Ubuntu and Windows and deploys only after verification. Evidence lives in ignored `output/`.

Read [product behavior](docs/PRODUCT.md), [primary-source research](docs/RESEARCH.md), [toolchain selection](docs/TOOLCHAIN.md), [brand provenance](docs/BRAND.md), [privacy and security](docs/SECURITY.md), [verification coverage](tests/README.md), [the original verification record](docs/audits/verification-2026-10-05.md) and [sharing verification](docs/audits/share-verification-2026-10-07.md).

## License scopes

Authored software uses **AGPL-3.0-or-later** and authored documentation uses **CC-BY-SA-4.0**. Space Grotesk retains OFL-1.1. VINASIG artwork follows the separate brand policy. Third-party software keeps its original notices. Secret keys and generated codes remain independent user data. See [LICENSES.md](LICENSES.md) and [the decision record](docs/audits/licensing-2026-10-05.md).

The public source link in a GitHub Actions build points to its exact commit. The page includes a source-revision metadata field for deployment verification. A fork must publish its own corresponding modified source and replace excluded identity assets as needed.

System defaults and shared deliberate theme/language choices follow [the ecosystem preference contract](docs/LOCALIZATION.md). Active work is preserved when another tab changes language.
