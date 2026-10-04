# TOTP Generator verification

Reviewed on 5 October 2026 using Node 24.21.0, npm 12.2.0 and the production build with its actual CSP. All secrets in tests and screenshots are public RFC or synthetic fixtures.

## Completed local checks

| Check                                        | Result                                                                                                | Evidence                               |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------- |
| Strict Astro/TypeScript diagnostics          | PASS, no errors, warnings or hints                                                                    | npm run check                          |
| Typed ESLint, Stylelint and Prettier         | PASS                                                                                                  | npm run check                          |
| Pinned standards integrity                   | PASS, all 47 managed files; AGENTS.md 3131 bytes                                                      | output/checks/standards.json           |
| Source and built license scopes              | PASS                                                                                                  | npm run check:licenses and build       |
| Unit tests                                   | PASS, 23 tests including all 18 RFC 6238 vectors                                                      | npm test                               |
| Chromium, Firefox and WebKit                 | PASS, 141 tests across the three engines                                                              | output/playwright/full-report.json     |
| Responsive/interface checks                  | PASS, both locales and themes at ten widths, including breakpoint neighbors and 320 px with 200% text | output/responsive/                     |
| Generated HTML, metadata and security policy | PASS for both pages                                                                                   | output/checks/built.json               |
| Brand and font byte preservation             | PASS, nine manifest entries and upstream Lucide notice                                                | build checker                          |
| Runtime dependency audit                     | PASS, zero known vulnerabilities                                                                      | output/research/npm-runtime-audit.json |

The responsive tests populate an eight-digit result and require a single line. Earlier checks caught wrapping at the desktop breakpoint. The code now scales with its actual result container and passed the same assertions without changing the threshold. Narrow technical details stack labels above values. Additional assertions reject overlapping text and wrapped clock values at 200% text. Theme controls render the appropriate Lucide sun/moon icon rather than a solid square. Automated axe checks cover mobile and desktop in both languages and themes. Keyboard radios, forced colors, reduced motion, failed JavaScript, expiration, delayed signatures, reset, privacy and loaded-page offline operation have browser coverage.

Representative desktop, tablet, mobile and 320 px/200% text screenshots were opened for visual review. The screenshot records remain in ignored output/visual/. Public HTTPS testing verified a current RFC fixture against an independent HMAC calculation and successful native clipboard status in the Codex browser. This does not establish clipboard permissions on every operating system.

Public pointer testing found that a field's delayed blur validation could move Clear before pointer release, causing the first click to be lost. Blur validation now defers error layout until a form pointer activation finishes, preserving native focus and click behavior. Browser flow regressions hold the pointer down while advancing time, then require the first release to clear the secret and validation. Dedicated emulated-touch checks and native keyboard activation cover the same action. Physical touch devices remain NOT_RUN.

## Performance and limitations

The laboratory gate runs three mobile and three desktop cold navigations per locale, using simulated network and CPU settings. It requires median LCP <= 2500 ms, CLS <= 0.1 and TBT <= 200 ms. The generated summaries live under output/lighthouse/after/vi/ and en/.

Lighthouse's robots fetch is blocked by the intentional connect-src 'none' policy, resulting in its laboratory SEO score of 92. The robots and sitemap files themselves are validated separately. The connection policy is preserved; the lab fetch warning is not proof of crawler blocking. Actual public HTTP responses must be checked after deployment.

Seven high-severity build-tool audit entries derive from the unpatched braces recursion advisory in the Stylelint glob chain. These remain documented in docs/SECURITY.md. They are absent from the browser bundle and not part of the zero-finding runtime audit. No dependency downgrade or audit suppression was used.

Physical devices, manual screen-reader review, field Core Web Vitals/INP, Search Console submission, an independent SI-agent trial and a formal penetration test are NOT_RUN. Laboratory browser results do not imply those checks occurred. This is a new product, so a historical before/after performance comparison is NOT_APPLICABLE.

## Publication gate

The workflow verifies the exact pushed commit on Ubuntu and Windows, including all three browser engines, runtime audit and Linux performance, before deployment. GitHub Pages uses the DNS-only Cloudflare CNAME totp -> vinasig.github.io. The custom-domain certificate is approved and HTTPS enforcement is enabled. Final publication verification must check both language routes, public assets, robots/sitemap, canonical metadata and the source-revision against the deployed Git commit.
