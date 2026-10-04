# Toolchain selection

Verified against official npm registry metadata on 5 October 2026. Node 24.21.0 and npm 12.2.0 follow adjacent products. A read-only portable Node runtime from the existing Unphar tooling was used locally, with npm 12.2.0 invoked through npx. No global tool was installed or upgraded.

All direct dependency versions are exact and the resolved graph is locked. Astro 7.3.5 and @lucide/astro 1.52.0 are the selected current runtime/build packages. Web Crypto supplies HMAC without an extra OTP library. html-validate 11.16.2 is the current selected patch. The other current compatible tools remain the approved VINASIG versions shown in package.json and the registry capture under output/research/dependencies.json.

TypeScript 7.0.2 is latest but exceeds the typed ESLint peer range, so 6.0.3 is selected. Node types 24.19.1 follow the supported runtime major rather than latest major 26. Strictest Astro checking, typed strict ESLint, Stylelint, generated HTML validation and Prettier are required. skipLibCheck remains false. The Lighthouse trace declarations use the existing explicitly validated runtime import boundary.

CI actions use the adjacent reviewed exact release commit IDs. The release gate is Ubuntu and Windows, with Chromium, Firefox and WebKit. Linux also checks three mobile and three desktop Lighthouse runs per locale. The budgets are median LCP at most 2500 ms, CLS at most 0.1 and TBT at most 200 ms. These are laboratory results, not field INP.

Read docs/SECURITY.md for the outstanding build-only braces advisory. Runtime-only npm audit is checked separately. No forced peer resolution, automatic audit downgrade or global installation is permitted.
