# VINASIG TOTP Generator

Generate verification codes from a Base32 secret or an `otpauth://totp/` setup link. The Vietnamese root and English `/en/` share automatic updates, a countdown, explicit copy, masked key entry, inline errors, clear, and light/dark themes. Visit [the tool](https://totp.vinasig.io.vn/).

SHA1, SHA256 and SHA512, 6/8 digits, periods of 1-300 seconds and a bounded clock adjustment are supported. Defaults are SHA1, 6 digits and 30 seconds. Use the settings required by your service. HOTP links are rejected.

Secrets, setup links and codes stay in browser memory. They are never put in URLs, submitted, stored or sent to an API. A hash-based Content Security Policy blocks connections and form submissions. All fonts, artwork, scripts and styles are self-hosted. Reloading or leaving the page clears the session. Clipboard content is controlled by the device and is not automatically erased. Once loaded, calculation works without a network. There is no offline cache or service worker.

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

Read [product behavior](docs/PRODUCT.md), [primary-source research](docs/RESEARCH.md), [toolchain selection](docs/TOOLCHAIN.md), [brand provenance](docs/BRAND.md), [privacy and security](docs/SECURITY.md), [verification coverage](tests/README.md) and [the verification record](docs/audits/verification-2026-10-05.md).

## License scopes

Authored software uses **AGPL-3.0-or-later** and authored documentation uses **CC-BY-SA-4.0**. Space Grotesk retains OFL-1.1. VINASIG artwork follows the separate brand policy. Third-party software keeps its original notices. Secret keys and generated codes remain independent user data. See [LICENSES.md](LICENSES.md) and [the decision record](docs/audits/licensing-2026-10-05.md).

The public source link in a GitHub Actions build points to its exact commit. The page includes a source-revision metadata field for deployment verification. A fork must publish its own corresponding modified source and replace excluded identity assets as needed.

System defaults and shared deliberate theme/language choices follow [the ecosystem preference contract](docs/LOCALIZATION.md). Active work is preserved when another tab changes language.
