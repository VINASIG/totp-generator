# Canonical domain

The owner selected the separate `totp.vinasig.io.vn` domain on 5 October 2026. Cloudflare contains an explicit DNS-only CNAME `totp` pointing to `vinasig.github.io` with automatic TTL. It was created through the owner's signed-in Chrome dashboard. The domain belongs to the existing verified VINASIG Pages domain family.

GitHub Pages uses the new `VINASIG/totp-generator` repository and workflow deployment. Its Pages custom-domain setting must match `totp.vinasig.io.vn`. A copied CNAME file alone does not configure Actions deployment. The origin-root Astro base, canonical/hreflang/social URLs, sitemap, robots and repository homepage all use the same domain.

After deployment, verify both `/` and `/en/`, asset status, the page source-revision metadata and the actual UI over valid HTTPS. Enforce HTTPS once GitHub's certificate is approved. Keep GitHub source/issue URLs independent of the public site domain. Do not change sibling repositories or DNS records for this project.

Raw DNS/dashboard evidence stays in ignored output/domain/. Search Console submission and ranking are separate from correct deployment and are NOT_RUN for this new project unless explicitly observed.
