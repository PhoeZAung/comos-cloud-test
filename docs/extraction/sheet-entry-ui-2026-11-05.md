# Sheet entries and account removal

Implemented locally in the existing checkout; no NAS publication or real account
deletion was performed.

- Weapons have a collection collapse/expand control retained across sheet tabs.
  Weapon and ability names open centered, responsive detail dialogs with the
  native Star Border adaptation. Separate pencils still open the matching editor.
- Weapon Attack, Damage and Usage groups keep Ability Mod directly below Attack
  Type, and Max Usage below Uses. Damage Type supports multiple removable tags,
  ordered physical, energy, alignment, poison, mental, precision. Misfire and
  damage tags are saved metadata; they do not invent automatic game rules.
- Abilities have six action choices and compact colored icons; Swift/Immediate
  share their icon. Legacy Ex/Su/etc. classification remains in stored data.
  Description, Effect and At higher levels are separate resizable text fields
  and centered prose in details. Discord description sends include Effect.
- Character deletion requires a full hold, then another hold on the button-only
  confirmation. Cancellation does not send a request. Successful server archival
  precedes the paper-fold effect and return to Characters; failed requests leave
  the sheet usable. Reduced motion uses a fade.
- Admin Players offers Cosmos-only user removal with self/admin protections,
  revision/name confirmation, transactional character archival and retained
  attribution. Schema 025 adds a removal tombstone. Existing sessions fail;
  a new Firebase login or legacy import cannot restore the removed identity.
  Removed users disappear from player/group pickers. The shared Firebase account
  is deliberately retained; see [scope details](../THIRD-PARTY-UI.md).
- The main Characters navigation remembers the administrator's last Players or
  Parties view when visiting Lore. Personal Characters remains directly reachable.

Validation:

- Full Node suite: 657 tests, 655 passed, 2 Windows symlink permission skips,
  zero failures. Log: `%TEMP%/cosmos-entry-ui-tests.log`.
- Targeted user-removal/group tests additionally verify rollback on a forced
  database failure, session/login denial, picker filtering and legacy reimport.
- `scripts/check-sheet-entry-browser.mjs`: 11 real-browser flow checks using
  isolated SQLite, real sheet routes and synthetic sessions. Screenshots inspect
  weapon groups, desktop/mobile detail dialogs and the deletion effect. Tests
  cover 320/390/768px sizing, reduced motion, canceled and failed deletion,
  name/action/tag persistence and Admin → Lore → Characters.
- Existing Owlbear Discord and interaction scripts: 14 browser checks passed;
  no real Discord message sent. Default delivery, original faces, pencils,
  owner-only HP/MP updates and extension resizing remain intact.
- Build output includes every new static import; standalone sheet CSS remains
  below its 72 KiB budget. Diff whitespace checks pass.
- Local startup and HTTPS health confirmed schema 25 and configured auth. A
  consistent local SQLite backup was saved before starting the new backend.

Remaining manual checks: the user's real signed-in character visuals and the
feel of the effects on their devices. No production/Firebase deletion should be
inferred from the isolated automated checks.
