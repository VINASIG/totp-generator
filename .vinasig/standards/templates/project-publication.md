# Keep VINASIG project information current

Apply CORE-009 for a new or newly published VINASIG project, a renamed or retired project, a canonical domain change, or a change to a feature described in public organization material. Apply only to VINASIG-owned work. An unrelated implementation fix needs a metadata update only if a public statement becomes inaccurate.

## Review the destinations

| Destination                        | Maintained information                                                                                                                                   |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Project repository                 | README, actual public visibility, description, homepage and relevant topics.                                                                             |
| VINASIG website                    | The reviewed project inventory in `VINASIG/vinasig/src/data/projects.ts` and any affected localized content. Use that repository's current instructions. |
| Public GitHub organization profile | `VINASIG/.github/profile/README.md` and the existing `profile/README.vi.md` translation.                                                                 |
| Organization directory             | Public account and contact facts only when those facts change. A utility release does not require inventing a new directory account.                     |

GitHub displays an organization's public README from a public `.github` repository and its `profile/README.md` file. A personal profile instead uses a repository named after the personal account and a README at its root. Keep the organization profile entrypoint separate from the website's root README. The Vietnamese counterpart is a linked translation, not a second automatic GitHub profile entrypoint.

## Publish useful, accurate descriptions

1. Confirm the actual public repository, supported behavior and deployed canonical destination. Distinguish a deployed tool from source-only, preview, private, archived or planned work. Only working public utilities belong in the profile's active tools section. Public standards and assets belong in the shared resources section.
2. Write the main user outcome in familiar language. Add meaningful constraints when they affect use. Local processing, supported inputs and output formats may matter. Do not advertise two languages, a framework or an internal dependency version as the main product feature. Preserve the established language and official product names.
3. Update the affected facts in both profile languages and the website inventory. Keep usage and source links distinct. Use current canonical domains and the correct locale route for each tool. Do not assume every website uses the same default locale.
4. Maintain relevant repository description, homepage and existing topics. Preserve unrelated metadata. A dependency-only update generally belongs in technical project documentation and the toolchain record, not the organization profile. Do not claim a feature, account-free workflow, privacy property, legal outcome or security guarantee without evidence.
5. Use the unchanged transparent VINASIG logo variant appropriate to the actual light or dark surface. Keep the original aspect ratio and a homepage link to `https://vinasig.io.vn/`. Record copied asset provenance and preserve separate brand rights. Use the profile's existing light/dark picture pattern. Profile Markdown uses GitHub's typography and does not require a new application framework.
6. Review the exact diff before an authorized commit. Check relevant destinations, translation agreement and actual rendered organization profile after pushing. Record the remote revision and evidence. A successful source push alone does not establish website deployment or rendered profile behavior.
7. In the handoff, state which destinations changed, which were reviewed and already accurate, and which remain pending with a specific reason. Keep private contacts, unpublished plans, credentials and local machine paths out of public profile copy.

## Authority and scoped updates

Follow CORE-003 and current user authorization for commits, publication, repository visibility and changes in another checkout. Authorization already given for organization publication or related metadata updates persists. Do not ask again for a routine step already authorized. Without the needed access or authorization, prepare a concrete proposed edit and report the uncompleted destination. Do not silently claim that related repositories were updated.

Update installed standards with the reviewed installer and bundle digest. Preserve owner text, existing snapshot files and rollback records. Never edit managed snapshots by hand. This checklist is supplied to core, static web and typed web profiles and needs no new runtime dependency.

## Reference

The source for the organization profile convention is [GitHub's organization profile documentation](https://docs.github.com/en/organizations/collaborating-with-groups-in-organizations/customizing-your-organizations-profile).
