# Privacy and security boundaries

Secrets never enter request URLs, forms, analytics, logs or persistent storage. Only finite theme/language preferences use shared Secure cookies or local fallback under WEB-011. Tests use public RFC and synthetic secrets. Rendering uses textContent/value, so imported labels cannot become markup. No remote provisioning URI or image is followed.

The production build installs CSP using exact inline-script hashes. Connections and form submissions are disallowed. Scripts, styles, fonts and ordinary images are self-hosted. Controlled data SVG masks in the shared control stylesheet are permitted by img-src. A no-referrer meta field suppresses referrers on navigation. There are no external runtime packages beyond the bundled Astro bootstrap and interface code. HMAC uses Web Crypto.

Revision guards stop stale asynchronous calculations and clipboard status from reappearing after edits or reset. An expired code is cleared before another HMAC result arrives. Copy recalculates at the current time. Input bytes are zeroed after key import. Nonextractable CryptoKey references and displayed output are dropped on tab hide and page exit. JavaScript strings, browser input state, operating-system clipboard history and browser extensions cannot be securely wiped or excluded by this application. Use a trusted device.

The verifier still controls throttling, token enrollment, recovery, acceptance windows and replay prevention. This generator has no server verification endpoint. It cannot know whether a code has been used or whether a device clock matches the server. HTTPS and a Web Crypto-capable browser are required. Script failure leaves controls disabled with readable guidance.

## Dependency review

On 5 October 2026, npm audit reported seven high-severity entries all derived from the build-only Stylelint glob chain and [the braces recursion advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). The registry and advisory list no patched braces release. This chain is absent from the browser bundle and is not fed user secrets or remote file patterns. Stylelint uses fixed authored patterns over local project CSS. Untrusted PR code is not run with repository secrets, and the deploy job requires verified main.

The warning remains recorded rather than hidden or downgraded to an obsolete linter. Runtime-only npm audit must pass with no known vulnerabilities. Review this build-tool finding when a patched compatible dependency is published. This is a scoped dependency assessment, not a penetration test or proof that browser extensions and host devices are safe.
