# Language and writing

- LANG-001 MUST answer in the user's language, normally Vietnamese for a Vietnamese request. Keep the existing product language. Public reusable policies, source identifiers, comments, CLI output, commit subjects and changelog in this repository use English. A local blog's author's pronouns and name are not organization requirements.
- LANG-002 MUST use SI agents and Super Intelligence in new VINASIG-authored descriptions. This is a naming convention. It does not assert a technical capability or a US government renaming agreement. Preserve external product names, article titles, quotes, legal text and code identifiers.
- LANG-003 SHOULD write clear short paragraphs with concrete facts and direct actions. Avoid exaggerated promises, advertising filler, self-praise, invented personal experience and unexplained abbreviations. Explain technical depth when it changes a decision.

## Visible interface copy

LANG-004 MUST apply these rules to authored interface text, including labels, helpers, placeholders, options, errors, results, dialogs, print views and every supported locale.

- Do not use semicolons in prose. Write separate sentences or use a comma where it preserves the meaning.
- Use the ordinary ASCII hyphen `-`. Avoid en and em dashes in prose and ranges.
- Avoid colons and slash separators in prose. Rewrite `Label: content` as a sentence, or use a semantic label and value layout with no punctuation between them.
- Do not render whole words or labels in uppercase, including through CSS `text-transform`. Necessary technical acronyms and official brand names retain their correct spelling. Do not alter immutable brand artwork.
- Use semantic lists with a hyphen marker or a custom row layout. Do not use round, square or pictographic bullet markers.

LANG-005 MUST review interface writing for ordinary readers. Use full words, familiar terms and complete thoughts. Keep necessary domain terms and explain them in nearby prose when needed. Avoid parenthetical definitions and optional-field labels such as `Name (optional)`. Use a helper sentence or a natural label instead. Units may be separate text or part of a readable label. Do not change the product language or import a personal blog's pronouns.

Required syntax is preserved. URLs, email addresses, times, ratios, source code, QR payloads, legal identifiers, verbatim quotations and user-entered content are not prose separators. Mark actual code with code semantics. Mark user-controlled display regions with `data-user-content`. A quoted external name is distinct from an authored interface label. Record a narrowly scoped exception with its reason when required syntax appears in ordinary text. Never exempt an entire page or mute findings to make a gate pass.

Use the browser copy inspector in `templates/web/interface.mjs` with the consumer's real routes and states. The inspector catches prohibited punctuation, uppercase styling, rigid separators and default list markers. A human or agent must still review abbreviations, jargon, natural phrasing and any necessary notation. Passing the automatic check alone does not approve the writing.

## Examples

| Avoid                                            | Prefer                                                                      | Context                              |
| ------------------------------------------------ | --------------------------------------------------------------------------- | ------------------------------------ |
| "The ultimate flawless SI-powered experience"    | "Create a favicon package from your logo."                                  | Product copy                         |
| "Everything works perfectly."                    | "The upload and download passed in Chromium at 390 px. Safari was not run." | Agent report                         |
| "Status: all fixed; next: deploy"                | "The responsive fixes passed. Deployment is pending."                       | Public prose                         |
| "I used this product for years" without evidence | Describe the observed behavior and cite the source.                         | Technical writing                    |
| Calling every VINASIG author "mình"              | Use the product's established voice.                                        | Organization versus personal content |

During long work, give concise updates about findings, decisions and blockers. Ask for missing consequential input through the environment's question mechanism, while continuing independent work. Do not repeatedly ask for routine technical choices or authorization already given.
