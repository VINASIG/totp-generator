# Shared header and footer audit - 5 October 2026

## Request and causes

The owner requested consistent headers and footers across all nine published VINASIG websites, plus agent-standards guidance for new projects. The footer repeated a product tagline and lacked common homepage/issue navigation. Older compact product CSS could also override the shared 16 px safe spacing. Before screenshots captured the published site in both locales and themes at 390x844 and 1440x900.

## Adopted source

The owner-approved contract and small shared CSS/footer source come from VINASIG/web-design-system revision 96ad6bddd983468f245e22e45daf04c09031f485. The reviewed CSS SHA-256 is 0443593d2b4e9dbd5e9341e444a52d823900fd534e9b80edcbcddb6b54d0f2a3. Consumer copies are project-owned, outside immutable standards snapshots. Original SVG artwork and font bytes are unchanged. No runtime UI dependency was introduced.

The transparent logo is 132 px wide and links to the VINASIG homepage. Appearance and reciprocal language controls have 44 px targets and stay aligned in the common row. Product navigation remains separate. The footer contains homepage, source, issue and local licensing destinations in a consistent order. Required notices and existing deployed-source links are retained. Local AGENTS guidance points to docs/SITE_CHROME.md and npm run test:chrome. Central WEB-009 and new-project routing are in VINASIG/agent-standards revision 9285e34f883cd414a16e50a79994da2a888efa3a.

## Actual verification

- Source, TypeScript, lint, format, standards and licensing gates passed using pinned Node 24.21.0 and npm 12.2.0. Build passed.
- 23 existing unit tests passed. 147 existing Playwright tests passed on Chromium, Firefox and WebKit.
- The new shared-chrome regression passed 156 route/theme/width cases across all three engines. Routes were /, /en/. Widths were 320, 360, 390, 600, 759, 760, 761, 768, 776, 777, 778, 1024 and 1440. Geometry checks use the actual content viewport and CSS media-query state, including WebKit classic scrollbars.
- Real header/footer captures were saved and opened for both locales and themes at 320x800, 360x800, 390x844, 768x1024, 1024x768 and 1440x900. The whole page was scrolled to inspect the actual footer. Supplementary 200% text captures ran on all three engines. WebKit 771/772/773 were checked around its actual content viewport transition.
- Keyboard appearance toggling, native language navigation, licensing HTTP responses, original theme artwork without JavaScript, link targets, spacing and one identity header/footer per route were checked.
- The existing Lighthouse performance-budget script passed for both locales, with three mobile and three desktop runs per locale. These are lab measurements, not field metrics.

## Evidence and limits

Project logs are output/site-chrome/. The permanent regression is tests/site-chrome.ts with tests/site-chrome.sha256. Its captures are output/responsive/site-chrome/. The aggregate workspace evidence is ../output/site-chrome-2026-10-05/, including immutable before-valid/, after-final/ and supplement/ records. Before images were not overwritten. CI retains project verification artifacts.

CI and public-site verification are tied to the exact pushed revision in the aggregate publication evidence. Local build success alone does not prove public deployment. Physical phones, real camera hardware, screen-reader sessions and field performance are NOT_RUN.
