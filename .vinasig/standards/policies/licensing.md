# Licensing policy

Information wants to be free. Open the information. Preserve the freedom to improve it. Protect the identity of the organization.

This policy governs license selection and implementation. It does not itself license a consumer repository. Read that project's LICENSE, LICENSES.md, retained notices and brand policy. A copied standards snapshot keeps its own licenses.

## Select by purpose

| Material                                       | Preferred SPDX identifier                         | Selection reason                                                                                                     |
| ---------------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Application, backend or web service            | `AGPL-3.0-or-later`                               | Preserve software freedoms and the relevant network-source obligation.                                               |
| Software without a need for network copyleft   | `GPL-3.0-or-later`                                | Preserve software freedoms through distribution copyleft. Record why the network condition is unnecessary.           |
| A library intended for broad integration       | `LGPL-3.0-or-later`                               | Permit suitable integration while protecting changes to the library. Review linking and distribution obligations.    |
| Documentation and knowledge                    | `CC-BY-SA-4.0`                                    | Allow sharing, adaptation and commercial use with attribution and share alike.                                       |
| Font software                                  | `OFL-1.1`                                         | Use for fonts VINASIG has authority to license. Preserve upstream terms, copyright and reserved font names.          |
| Database                                       | An appropriate data license, including `ODbL-1.0` | Assess database rights, individual contents, provenance, privacy and intended reuse. ODbL is not a software license. |
| Official logos, trademarks and identity assets | Separate VINASIG Brand Usage Policy               | Permit truthful references and suitable community uses while preventing misleading identity and endorsement.         |

Commercial use is allowed by the preferred open licenses. Do not add a noncommercial clause, field-of-use restriction, mandatory account or custom software license. Keep full standard license texts unchanged. Express the `or-later` choice in the actual grant and SPDX metadata.

An authorized new VINASIG-owned project can use the owner's already approved defaults within that project request. Do not ask again for a decision that the task or adopted owner policy already supplies. Missing third-party authority still requires resolution and cannot be inferred from an organization default.

## Required review

- LIC-001 MUST inventory software, documentation, data, fonts, artwork, third-party material, existing grants, dependencies and distribution paths before choosing a license. Inspect Git authors, contributor records, imported code, notices and available assignment or contribution terms. Repository administration alone does not establish copyright ownership. Preserve existing compatible grants and grants already made to recipients.
- LIC-002 MUST obtain task authorization for a new grant or relicensing. Existing authorization for the current repositories and materials persists. Choose AGPL for software by default and record a purpose-based GPL, LGPL or other standard-license exception. License only material the owner can authorize. Preserve third-party terms. Resolve, validly exclude independent material, or report disputed contributions and incompatible dependencies as pending. Do not silently claim rights to them.
- LIC-003 MUST keep license texts, scope maps, README, package/SPDX metadata, notices, copied snapshots and distributed artifacts consistent. Mixed repositories use LICENSES.md with explicit paths and exclusions. Fonts and marks never inherit the software grant by proximity. Preserve third-party copyright notices and verify the selected option in a dual-license dependency.
- LIC-004 MUST record a per-project decision, rationale, changed files, ownership/dependency findings and remaining human review using the review template. Verify copied texts, unchanged protected assets, package/lockfile agreement and actual publication. Add focused regression coverage when changing license distribution or an installer. Report observed results and limitations.

## Concrete work cycle

1. Read local instructions and Git status. Inventory the current grant, project purpose, asset paths, runtime/build dependencies, external contributions and what ships.
2. Check primary license publishers and SPDX. Verify compatibility against actual linking, copying and delivery. Build-only tools do not automatically relicense output, but their own distribution still has obligations.
3. Select licenses per material and explain exceptions. Separate prose from executable examples. A documentation license should not accidentally govern code snippets intended for software integration.
4. Apply authorized grants. Add full LICENSE and secondary texts, LICENSES.md, README links, package metadata and brand policy. Preserve literal upstream text and existing attribution without inventing a legal entity, registration, assignment or contributor consent.
5. Include required notices with source and built distributions. For AGPL, document section 13 accurately. A modified version that supports remote interaction must offer its Corresponding Source to those users at no charge. Browser-bundle distribution also needs a valid source delivery arrangement. A link to an unrelated or older revision does not satisfy this.
6. Keep build scripts, lockfile, install instructions and relevant dependency source available for the shipped revision. Check source links and retain revision evidence. A minified bundle or unchanged upstream link alone is insufficient for a modified program.
7. Run relevant existing gates, inspect the diff, commit and publish within authorization, then verify the exact remote revision. Report unresolved rights separately from a successful build.

## Brand and independent material

Use the [canonical VINASIG Brand Usage Policy](https://github.com/VINASIG/vinasig-brand-assets/blob/main/BRAND_POLICY.md) for truthful references, articles, presentations, documentation and suitable community/event displays. Do not imply sponsorship, endorsement, partnership or ownership without an actual authorized relationship. Commercial identity use, co-branding and merchandise need written permission.

The brand policy applies to separate marks and identity artwork. It adds no restriction to freedoms granted for licensed software, documentation or data. A fork may replace excluded artwork with its own assets without changing the software license. Keep legal attribution and distinguish the fork from official VINASIG releases.

User inputs, QR payloads, converted archives, measurements and generated images do not become AGPL material simply because a tool processes them. Output is covered only when its content is itself a covered work. Retained third-party material, copied templates and underlying content keep their own rights.

For future contributions, document inbound terms matching the relevant outbound scope. Do not manufacture a historical assignment or require a blanket copyright transfer to participate. Seek additional rights only when an actual change requires them.

## Primary references

- [GNU AGPL version 3](https://www.gnu.org/licenses/agpl-3.0.html) and [SPDX AGPL identifier and text](https://spdx.org/licenses/AGPL-3.0-or-later.html).
- [GNU GPL FAQ](https://www.gnu.org/licenses/gpl-faq.en.html) and [license compatibility list](https://www.gnu.org/licenses/license-list.html).
- [Creative Commons BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) and [software, logos and database guidance](https://creativecommons.org/faq/).
- [SIL Open Font License](https://openfontlicense.org/) and [Open Database License](https://opendatacommons.org/licenses/odbl/1-0/).
- [SPDX license identifiers and expressions](https://spdx.dev/learn/handling-license-info/).
