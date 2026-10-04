# License scopes

The repository owner authorized these grants on 5 October 2026. Copyright remains with the respective authors and rights holders. VINASIG is the project identity. This notice does not assign third-party copyright or invent a legal entity.

## Software grant

Except for the separately scoped materials below, VINASIG-authored software in this repository is free software. You may redistribute it and modify it under the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or, at your option, any later version. SPDX identifies this grant as `AGPL-3.0-or-later`.

It is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY, including the implied warranties of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. The full standard text is in [LICENSE](LICENSE). Commercial use is allowed under those terms.

## Material map

| Material                  | Paths and scope                                                                                                                                                                                                        | License or policy                                                    |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Software                  | Authored application/tooling, scripts, tests, configuration, schemas and executable code examples, except the exclusions below.                                                                                        | AGPL-3.0-or-later                                                    |
| Documentation             | Authored Markdown, policy/skill prose, narrative guidance and website documentation. Executable examples additionally use the software grant above. Third-party quotations and legal texts keep their original rights. | CC-BY-SA-4.0                                                         |
| Font software             | public/fonts/ contains original Space Grotesk fonts and notices. Do not replace the original notice or reserved-name conditions.                                                                                       | OFL-1.1 under the accompanying OFL.txt                               |
| Official identity         | public/brand/ and public/favicon.svg, plus any embedded or copied official logos, editable artwork and identity exports. The software/documentation grant does not cover them.                                         | [VINASIG Brand Usage Policy](BRAND_POLICY.md)                        |
| Dependencies and notices  | Vendored libraries, upstream fonts/icons, installed packages and literal license texts retain their original notices. Existing permissive grants are not replaced.                                                     | Their respective original licenses                                   |
| Shared standards snapshot | Managed .vinasig/standards/ and .agents/skills/ files retain the agent-standards grants rather than inheriting this repository's primary grant.                                                                        | See [.vinasig/standards/LICENSES.md](.vinasig/standards/LICENSES.md) |

## Documentation reuse

VINASIG-authored documentation is licensed under [Creative Commons Attribution-ShareAlike 4.0 International](LICENSES/CC-BY-SA-4.0.txt). Credit VINASIG and the respective credited authors, link the source and license, indicate changes, and share adaptations under the applicable share-alike terms. Do not imply endorsement. Embedded artwork and external source material are separately scoped.

## Source and distribution

The preferred source, build scripts, lockfile and development instructions are available without an account at [VINASIG/totp-generator](https://github.com/VINASIG/totp-generator). Git history and GitHub Actions identify the revision used for a deployment. Obtain source for that actual revision rather than substituting an unrelated release.

Keep copyright, license and third-party notices with redistributed source and browser bundles. Modified AGPL software that supports remote interaction must prominently offer its Corresponding Source to those users at no charge under section 13. A fork operator must provide its own modified source. This is not a requirement to publish unrelated programs or private user inputs.

The built site includes the full software license and a NOTICE.txt with source directions under licenses/. Repository private: true prevents npm publication and does not revoke this open license.

## Independent inputs and output

Using this software does not by itself relicense user secret keys, setup links, account labels or generated codes. Output is covered by the software license only when its content constitutes a covered work. Copied templates, underlying source content and retained third-party material keep their applicable rights.

## Contributions

New contributions should use the relevant license scope above unless a different compatible grant is explicitly identified and accepted. Retain authorship and upstream notices. Contributors must have permission to submit their material. No blanket copyright assignment is required. The current owner authorization does not fabricate consent from an external rights holder.

## Decision record

The TOTP generator is browser-delivered application software. AGPL fits the implementation, with CC BY-SA for authored documentation. Secret keys and verification codes remain independent user data.

See [the dated review](docs/audits/licensing-2026-10-05.md) for inspected ownership/dependencies, changes and any remaining human review. Earlier publication audits describe their historical state and are not the current license grant.
