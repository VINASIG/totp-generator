# Direct TOTP sharing decision

The owner explicitly selected a link that starts producing codes immediately and accepted that possession of the link grants possession of the TOTP secret. A separately encrypted capsule with a separately delivered random unlock key was considered and declined. Putting ciphertext and its decryption key in the same link would not protect against a person who obtains that link.

The feature uses a versioned URL fragment, not a query string. Fragments are client-side URI components and are not part of the HTTP resource request. A fragment is not confidential storage. Browser history or sync, extensions, a shared device, clipboard history and the delivery channel can expose the credential. Removal from the current address does not revoke a copied link or guarantee erasure of browser history/sync. The service must replace the TOTP enrollment to revoke recipients' ability to generate codes.

The browser removes a recognized incoming fragment with history.replaceState before importing it into the form. Initial locale selection finishes first so a deliberate or system-language redirect cannot discard the incoming credential. No runtime fetch, secret cookie, storage, server or remote provisioning service is added. Script-unavailable pages cannot import or scrub a fragment. The no-referrer policy applies on both routes. This design depends on the currently loaded JavaScript, TLS and the device remaining trustworthy.

The v1 capsule contains a canonical Base32 secret, algorithm, digit count and period. It omits account/issuer labels and the sender's device-specific clock adjustment. There is no expiry, one-use claim, remote revocation, recipient authentication or encryption claim. Import validates bounds, exact recognized fields, duplicate fields, version, canonical Base32, algorithms, digits and period. Unsupported versions and corrupted links do not start calculation or leave a stale code.

Share is enabled only for a validated active calculation. Opening the share panel is explicit. Copying the link is a second deliberate action next to a credential warning. No native share sheet or external service receives it automatically. Any input edit, reset, tab hide or page exit clears the exported link and invalidates asynchronous share work. Ordinary manual entry remains session-only. Clipboard contents cannot be securely erased by this static application.

## Reported symptoms and evidence contract

| Report                                             | Baseline                                              | Required outcome                                                                                                                                                            |
| -------------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Share a valid key with settings                    | No share control                                      | Disabled on empty/invalid input, explicit export on valid input, fresh link imports the same key/settings and yields RFC/reference code                                     |
| Google offers password generation in the key field | Input is type=password with autocomplete=new-password | Type=text with autocomplete=off and visual masking in supported engines. Reveal retains native editing, paste and keyboard behavior. No password-generation field semantics |

The baseline is retained in ignored output/share-2026-10-07/baseline.json and before-desktop.png. The baseline image was opened. It does not show browser credential UI. The user's screenshot supplies that observation. Synthetic/public RFC keys are used for all further evidence.

The state matrix includes both locales/themes, empty/invalid/valid keys, raw and otpauth entry, all three algorithms, both digit counts, period bounds, minimum/maximum share sizes, collapsed/open share panel, copied/failing clipboard, stale async work, hidden/return/page exit, import with locale redirect, explicit language change after import, keyboard, forced colors, script unavailable, offline operation, 320 px/enlarged text, the existing breakpoint neighbors and desktop. Timer rollover and official TOTP/HOTP vectors remain mandatory.

Primary sources and security boundaries are documented in docs/RESEARCH.md and docs/SECURITY.md. Automated tests, visual observations, browser password-manager observations and deployment verification are separate evidence classes.
