# Gunbreaker and Doom Slayer ammunition tracker — October 31, 2026

Continues the requested class mechanics from e1ced35. The user's standing
instruction is to name the affected class and keep work local until an explicit
"publish" request. GitHub authentication is available; no push or deployment was
performed for this batch.

## Source-backed scope

The unchanged sibling archive was reread:

- `classes/hybrid-classes/gunbreaker/index.md`, Magicked Ammo, Blast Shield and
  Brutal Shell: infused-first expenditure, reload/infusion allowances, capacity
  at levels 19–20, two-round Blast Shield cost, and Brutal Shell tiers 1/6/11/16.
- `equipment/weapons/gun-arms/index.md`, Table: Gun Arm Weapons (Trigger Attacks):
  all thirteen unmodified gun-arm capacities. Profiles retain source locators.
- `classes/hybrid-classes/gunbreaker/archetypes/doom-slayer/index.md`, Doom Gun
  Arm: Pistol/Shotgun/Chaingun capacities 6/6/30, Plasma Rifle capacity 10 at level
  5, Rocket Launcher capacity 1 at level 10. BFG has no fixed magazine profile and
  remains manual.

## Behavior

Players explicitly choose one tracked gun or Doom Gun Arm mode. No starting
weapon is inferred. Configuration starts empty. Reloading records supplied
ammunition and infuses the appropriate number of loaded rounds. Shot recording
spends infused rounds first. Infusion only affects available loaded rounds and
cannot exceed either the magazine or class limit. At levels 19–20 the limit is
actual selected capacity, not an old numeric allowance.

The sheet exposes the tracker on Abilities and Combat → Offense. Generic
Magicked Ammo, Blast Shield and base Brutal Shell ability uses share its magazine
when configured. Blast Shield spends two infused rounds; base Brutal Shell
spends one. The tracker also supports the higher legal Brutal Shell quantities.
Use receipts record infused rounds remaining and retries do not spend twice.
Description sends do not spend ammunition.

Leveling, score edits, rest, and compile/reopen preserve loaded/infused quantities.
The managed Magicked Ammo card mirrors the tracker; direct edits to its maximum,
remaining uses, formula and rest preference are rejected while configured.
Its custom name/description remain intact. Switching profile requires explicitly
clearing/reconciling the old recorded magazine first. Existing unconfigured
manual counters are preserved.

Server-side actions validate source profile IDs, class/level eligibility,
integers, capacities, infusion limits and ability costs. The existing owner,
origin, revision and idempotency protections remain in place. No database schema
migration, new service or authentication change is required.

## Verification and bounds

All **417 tests pass** and `npm run build:cloud` passes. Seven new regressions
cover literal source capacities, late progression, costs, malformed/forged
requests, preserved manual entries/resources, route saves, stale revisions,
database close/reopen and idempotent ability receipts. Network delivery is
stubbed/disabled in tests; no message was sent to another person or service.

A clearly labeled static fixture was visually checked in the local browser.
The narrow layout had document width equal to viewport width (375 CSS pixels),
with wrapped buttons and no horizontal overflow. This was layout verification,
not a Firebase login or a real character save. The temporary fixture was moved
out of the served preview afterward.

This tracks one unmodified gun/mode at a time. Physical ammunition supply,
inventory transfers, reloading/mode-switch action economy, weapon-roll shot
recording, target effects, cooldowns, BFG, multiple concurrent magazines and
Gunsmith capacity modifications remain manual. Selecting a source profile does
not grant ownership of the weapon or activate a gated mode/cooldown. Inventory,
gil, HP, MP and conditional combat bonuses are not changed by tracker actions.
Existing general CMD/CMB review limits are unchanged.
