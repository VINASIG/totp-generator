# Start a VINASIG website with shared chrome

Apply WEB-009 before writing a new layout, including a small utility or documentation site. Apply WEB-010 and `ui-contract.md` to the full interface acceptance review.

For appearance and language apply WEB-011 and `shared-preferences.md`. A shared localStorage key cannot synchronize different subdomains. Keep the reviewed preference implementation and actual cross-site tests together with the unchanged header/footer presentation.

The appearance control retains the shared target-state behavior. In light appearance use the reviewed Moon SVG and switch-to-dark name. In dark appearance use the reviewed Sun SVG and switch-to-light name. Do not substitute a combined icon or invert its action. Check persistence, system preference, blocked JavaScript and exact shared CSS/artwork bytes as well as geometry. A similar-looking icon is not the approved source.

1. Read the current project instructions and the reviewed [VINASIG header/footer contract](https://github.com/VINASIG/web-design-system/blob/main/docs/components/site-chrome.md). Review its source revision and the existing websites. Record the adopted revision in the project's source/brand record. The approved chrome does not imply adoption of unrelated draft design guidance.
2. Reuse `src/styles/site-chrome.css` and the Astro `SiteFooter.astro` source with existing build tools. A non-Astro website uses equivalent semantic HTML with the same CSS. Keep copied source outside installer-owned snapshots and pin its reviewed digest in a regression. A standards import alone does not install a product header or footer.
3. Use exactly one `header[data-site-header]` identity row and `footer[data-site-footer]` per route. Keep original theme-aware transparent artwork and a native named homepage link. Put appearance and language controls together at the right. Product navigation uses another row or sidebar. Preserve narrow tool content widths.
4. Keep the footer's homepage, source, issue and license destinations in the reviewed order. Localize accessible names and labels. Preserve source-revision links and required notices. Test license routes on the real deployment base path. Do not copy another project's repository URL.
5. Add `inspectSiteChrome` to existing browser tests, with an expected one-header/one-footer count. Check every layout route, both locales and supported themes, 320 px and the five required viewports, actual breakpoint neighbors, 200% text, keyboard interaction and no-JavaScript fallbacks. Assert the original artwork digest separately with `inspectHeaderBrand`.
6. Scroll the whole page and capture AND open header/footer screenshots before and after. Verify appearance, gaps, wrapping, accessible names, contrast, real links and focus. Compare with the reviewed common source rather than accepting each project's current baseline independently.
7. Run source/build/browser checks. Before an authorized publication review the diff. After deployment verify the exact revision and repeat the visible header/footer checks. Report browser/device/assistive checks that did not run.

Update the design-system source and contract first when changing approved shared chrome, then synchronize consumers in a scoped task. Never edit managed snapshot bytes by hand. Use the installer for a reviewed standards rollout. Preserve previous bundles and rollback evidence.
