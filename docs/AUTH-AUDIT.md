# Step 2.1 — legacy authentication and migration plan

Reviewed 23 October 2026. Source: read-only inspection of `PhoeZAung/Mount-Aetheria` through the connected GitHub tool. Scope: sign-in, sign-up, account/profile behavior, and character-owner storage paths. No live Firebase account, database, media, password reset, or sign-in operation was accessed or executed. No old repository files were changed.

## Confirmed source behavior

| Area | Existing implementation | Comos plan |
| --- | --- | --- |
| Sign in | Email/password through Firebase Authentication; Google through a popup | Preserve both familiar methods when real authentication is introduced |
| Returning session | `onAuthStateChanged` redirects authenticated visitors from sign-in to `index.html` | Restore identity before deciding between onboarding and Home; avoid redirect loops |
| Password reset | Email reset form within sign-in | Preserve the flow with accessible status/error text; no reset emails during preview |
| Sign up | Email/password confirmation or Google, followed by profile setup when `users/{uid}` does not exist | Keep the two-stage flow and make incomplete onboarding explicitly resumable |
| Profile setup | Requires display name; optional uploaded image, provider image, or default silhouette | Use explicit completion status and later validated media handling |
| Profile data | Auth displayName/photoURL plus Firestore users document; Account prefers nonempty document displayName/pfp | Define a canonical application profile while preserving legacy values and recording conflicts |
| Sign out | Firebase signOut followed by sign-in page | End the future application session as well as the provider session |
| Ownership | Firebase `user.uid` is used in account, persona, and character document paths | Preserve a durable mapping from provider identity to application user ID |
| Admin display | Account checks a hard-coded email to show Admin; persona workshop uses an email allowlist or feature flag | Configure real roles on the API; move Admin entry to Characters as planned |

The read pages import Firebase browser SDK version 11.6.1. This records the legacy code, not a recommendation of a current SDK version. Authentication provider enablement, authorized domains, and deployed Firestore/Storage rules were not inspected.

## Identity and storage mapping

| Legacy location or field | Meaning | Migration treatment |
| --- | --- | --- |
| Auth UID | Provider-owned user identifier | Map `(provider, issuer/project, subject UID)` uniquely to an internal Comos user ID |
| `users/{uid}` | Profile; email, displayName, pfp, createdAt, uid; later updates and charactersMigrated | Retain source UID/path, preserve timestamps, import profile fields, track completion explicitly |
| `users/{uid}/characters/{characterId}` | Current per-character sheets | Preserve source path and character ID in a unique migration mapping; owner comes from parent UID |
| `users/{uid}/sheet/character` | Earlier single sheet, potentially with a summons array | Retain raw source for reconciliation; import only after comparing with newer records |
| `users/{uid}/personas/{personaId}` | Display personas used by the old account workshop | Preserve as a separate legacy entity; do not assume a persona ID is a character-sheet ID |
| `users/{uid}/profile_<timestamp>` | Storage object pattern used for uploaded profile images | Inventory media; later copy verified bytes to configured storage and map to media IDs/relative keys |
| `pfp` / provider photoURL | Image reference; can be uploaded, external, or inline default SVG | Record source type; do not assume every reference is an owned storage object |

Email and display name are profile attributes, not stable ownership keys. Changing either must not create a new user or transfer character ownership. Matching email strings alone must not merge users or grant access. Account linking requires a verified, explicit flow if needed.

## Cases that need care

1. **Incomplete onboarding:** the provider account is created before profile setup finishes. The sign-up page checks only whether a user document exists; sign-in redirects authenticated users immediately. A later account update or migration flag could also create a user document. Comos should use an explicit profile-completion state, not document existence alone.
2. **Partial profile writes:** provider profile updates, image uploads, and Firestore writes are separate operations. An interruption can leave them inconsistent. Preserve both source values for review; make completion retryable without creating another account.
3. **Partial character migration:** the old code stops importing the older sheet whenever any newer character exists, and marks migration complete. Multiple new documents are created separately. An interrupted earlier migration may therefore leave missing legacy summons. Reconcile both formats; do not trust `charactersMigrated` or a nonempty collection as proof that every record was copied.
4. **Persona versus character identity:** account personas and game sheets are separate collections. Future composer ownership checks must resolve the correct entity rather than treating similarly named entries as identical.
5. **Authorization evidence is incomplete:** email-based UI visibility proves how controls are displayed, not whether database rules protect the data. The source audit cannot establish whether the deployed database is secure.
6. **Accessibility to retain in Comos:** the legacy sign-in/sign-up pages include a zoom-limiting viewport declaration and placeholder-only inputs. Keep Comos zoomable; use explicit labels and keyboard-friendly forms when Step 2.3 is built.
7. **Session and account linking:** no explicit persistence selection or account-linking handler was found in the inspected pages. Repository searches for `setPersistence`, `linkWithCredential`, and `rules_version` returned no matches; this does not prove no related configuration exists elsewhere.

## Default migration direction

Plan to retain the existing Firebase identity provider initially, while moving application records and media behind the new API and repositories. This avoids requiring a password migration merely to change where game data is stored. This is a proposed implementation direction; no provider or live account configuration has changed. Confirm runtime compatibility and provider configuration before implementation.

The native API must verify provider proof using supported server-side verification and map the verified issuer/subject to the internal user. Never trust a client-supplied UID, email, role, ghost flag, or Owlbear ID. The fixture bundle remains separate and has no real identity. The final session mechanism and provider integration are implementation work in Step 2.3, with current official documentation to be checked then.

Proposed database constraints for Step 2.2:
- `users`: stable internal ID, profile state, schema version, timestamps, revision.
- `external_identities`: unique provider + issuer/project + subject; foreign key to user.
- `legacy_record_map`: unique source system + source path; target type and target ID; source hash and import version for retry/reconciliation.
- Domain records reference internal user IDs. Role and membership tables are server-owned and separate from display profiles.

## Migration sequence before real rollout

1. Obtain authorized, read-only identity metadata, database, and media inventories. Record counts and export hashes; keep original exports as rollback copies. Do not request plaintext passwords.
2. Dry-run identity mapping. Report duplicate/conflicting records and unmatched parent UIDs without guessing owners or merging by email.
3. Import profiles into staging with explicit incomplete-profile status. Preserve source references and reconcile provider/document differences.
4. Reconcile current character documents with older sheets and summons. Keep an idempotent mapping and a review queue for ambiguous legacy matches. Do not execute the old browser migration script.
5. Inventory personas and media separately; retain links to their owners and defer sheet conversion to the planned character work.
6. Verify representative returning users, interrupted onboarding, both sign-in methods, reset and sign-out, and cross-user denial. Decide conflict and role mappings from trusted records.
7. Rehearse cutover with a source freeze or captured deltas, count/hash reconciliation, backups, and a tested rollback. Enable real writes only after those checks pass.

## Remaining evidence needed before real accounts are enabled

- Actual identity and data inventory, including orphaned profiles and character owners.
- Deployed authentication settings, provider domain configuration, Firestore and Storage rules.
- Trusted administrator assignments and the four-world membership mapping.
- Native runtime compatibility for the chosen authentication integration and eventual QNAP host.
- Actual Android sign-in behavior, including blocked popups, redirect handling, and session restoration.

Step 2.1's bounded source audit and migration plan are complete. This is not a completed data migration, security audit, or working login feature. Step 1.1 visual acceptance is still pending and remains tracked separately.
