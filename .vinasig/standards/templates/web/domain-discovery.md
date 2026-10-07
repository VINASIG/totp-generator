# Finish a public VINASIG website with a domain and discovery handoff

Apply SEARCH-003 to a new public website, first launch, a canonical-host/hosting change or a DNS/sitemap/indexing repair. Use the project's adopted web profile. For a routine implementation update on an unchanged working domain, retain the existing setup and report a newly observed failure if relevant. Source-only libraries, CLI projects, private previews and deliberately non-indexable sites do not need public DNS or Google submission; record NOT_APPLICABLE and the reason.

This checklist routes a review and recommendation. It does not create an automation, buy a domain, add analytics or grant permission to change an account. Existing authorization for the same DNS, hosting or Search Console action persists. Complete the concrete configuration proposal before asking for any missing decision. Do not make finished source work appear unfinished solely because an external setup is pending; report implementation, deployment and discovery independently.

## VINASIG setup destinations

- [Cloudflare DNS records for vinasig.io.vn](https://dash.cloudflare.com/ff374997a8dad2386d1eb0fe8a06504b/vinasig.io.vn/dns/records).
- [Google Search Console sitemaps for sc-domain:vinasig.io.vn](https://search.google.com/search-console/sitemaps?resource_id=sc-domain%3Avinasig.io.vn).

These owner-provided links are navigation aids, not credentials or evidence of a logged-in session. Confirm the actual account, zone and property before an authorized change. If the project uses another domain, use its verified destination. Do not put tokens, passwords, cookies or private dashboard captures in Git. If access is unavailable, state which account check is NOT_RUN, preserve the exact proposed fields and continue independent work.

## Establish the canonical destination

Read the current project configuration, deployment source and owner-approved domain. Reuse an existing host. If a new subdomain has not been chosen, propose a short available name under `vinasig.io.vn` and leave it as a proposal until the choice is authorized. Record the exact HTTPS origin and locale routes; do not assume all VINASIG tools have the same default language.

For GitHub Pages, inspect repository Pages settings and the actual deployment method. Configure the custom host in Pages before pointing a new DNS record at it. A subdomain CNAME targets the account's Pages hostname, such as `VINASIG.github.io`, without a repository path or URL scheme. Verify the current provider instructions rather than copying an apex IP or another project's configuration. A source `CNAME` file is relevant for a branch-based deployment; an Actions-based Pages deployment relies on Pages settings and does not require that file. Preserve a project's compatible file if it serves another documented purpose. Other hosting providers need their own verified target and custom-domain procedure.

## Prepare or review DNS

Read existing records for the exact hostname before proposing a mutation. A proxied Cloudflare hostname can resolve to edge addresses, so public DNS alone does not prove the configured origin or proxy mode. State that limitation if the dashboard cannot be read.

For a necessary change, provide:

| Field              | Required proposal                                                                                                                      |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Action             | Create, update or retain, with the observed reason.                                                                                    |
| Zone and name      | Exact zone and hostname or Cloudflare record name.                                                                                     |
| Type and value     | Provider-supported type and verified destination; no guessed origin.                                                                   |
| TTL and proxy      | Exact intended settings and why they fit the chosen hosting/TLS setup. Preserve working settings unless the change requires otherwise. |
| Existing record    | Current relevant value, conflict and rollback value when observable.                                                                   |
| Hosting dependency | Custom-domain configuration/verification needed before the DNS change.                                                                 |

Use the exact host rather than a blanket wildcard. Preserve unrelated records, including mail and ownership verification records. Execute only the scoped authorized change. Afterwards observe DNS resolution, the intended site's actual HTTPS response, redirect destination and certificate availability. Record the observation time and unresolved propagation or certificate state; do not treat clicking Save or a generic HTTP 200 as proof of the intended site. For a host migration, keep a reviewed redirect and internal-link plan.

## Prepare the site for discovery

Before offering a sitemap submission, inspect the public deployment at the chosen origin:

- The intended public page is served over HTTPS and has truthful title/description, canonical and relevant metadata. Verify reciprocal language URLs when present.
- The owner-approved robots/noindex policy permits the intended public pages. Do not remove deliberate privacy restrictions to satisfy this checklist.
- The exact sitemap URL returns a successful response containing a valid supported sitemap, rather than an HTML fallback, login page or challenge. If it is a sitemap index, inspect its child sitemap URLs as well.
- Sitemap entries use absolute canonical HTTPS URLs for the correct host and working public routes. Exclude private/output/session URLs and duplicate search or pagination parameters. Use truthful modification dates if included.
- `robots.txt` references the intended sitemap. Internal links reach the tool's public pages. Public sitemap access needs no browser session or account.

Observe source, deployed HTTP responses and dashboard reports separately. A local fetch does not prove Googlebot can fetch through a production security rule. Diagnose the actual response or Search Console error before proposing a narrowly scoped fix; preserve the site's protection policy.

## Recommend or perform Search Console setup

Use the existing verified `sc-domain:vinasig.io.vn` property for a host under that domain when available; inspect ownership/access instead of creating a duplicate property by default. Propose the full final sitemap URL, for example `https://<chosen-host>/sitemap.xml`, or the actual sitemap index generated by the project. Do not submit a guessed path, redirecting URL or an old GitHub Pages host.

Read the existing submission row when access is available. If the same sitemap is already processed successfully and there is no material change, retain it. Offer submission for a new sitemap or significant sitemap change, or resubmission after repairing a failed fetch. Do not remove/re-add a healthy sitemap or request indexing for every page after each commit.

Under task authorization, submit the exact deployed URL and inspect the resulting report. For a newly launched important page, URL Inspection and a targeted indexing request can be proposed when appropriate. An accepted request is not a promise of crawling, indexing or ranking. A new scheduled follow-up requires a separate user request; this checklist does not automatically create one.

Report these states separately with the exact URL and time:

| Observation                 | Evidence required                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------ |
| Deployed sitemap available  | Actual HTTP status and parsed sitemap on the public host.                                  |
| Sitemap submitted           | Observed submission confirmation or an existing submission row.                            |
| Google fetched/processed it | Search Console's observed status, last-read time and any error detail.                     |
| Page indexed                | The page's observed URL Inspection/indexing report, distinct from live-fetch availability. |

If Search Console reports Couldn't fetch, inspect the exact submitted URL and error detail, then DNS/HTTPS, sitemap path/body, access restrictions and sitemap parsing. Report the known cause or unresolved evidence. Do not assume cache delay or claim success from a browser-only fetch. If access is unavailable, dashboard and indexing observations remain NOT_RUN.

## Completion message

Include a short domain/discovery section when this checklist applies:

- Canonical website and implementation/deployment state.
- DNS: observed configuration or concrete proposed record fields and the Cloudflare link.
- Sitemap: exact deployed URL and technical findings.
- Search Console: existing/submitted/fetched/indexed observations, or the specific pending setup and link.
- Any missing access/authorization or remaining provider processing, without implying that a recommendation was executed.

Use PASS, FAIL, NOT_RUN or NOT_APPLICABLE with reasons and evidence. If setup is already correct, say so without offering the same setup again. Keep the recommendation actionable and proportional to the project.

## Provider references

Recheck provider guidance when adopting the configuration:

- [Cloudflare DNS record management](https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/).
- [GitHub Pages custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).
- [Google sitemap creation and submission](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).
- [Search Console sitemap reports and fetch errors](https://support.google.com/webmasters/answer/7451001?hl=en).
