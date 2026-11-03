# Cosmos extension: Character / Admin / Roll

Roll shows up to 100 of the connected account's latest saved Cosmos receipts,
newest first. It includes website rolls and Dice+ extension rolls. Attack,
damage, confirmation and critical damage totals/faces come directly from the
existing server receipts. Description-only actions are omitted. History never
rolls dice, spends resources, or sends a second Discord message.

History loads when Roll opens, refreshes every five seconds while selected,
and refreshes after an extension roll or the refresh button. It survives closing
the extension because it uses the existing sheet_rolls database table. Each
request revalidates the account's original login. It cannot request another
account's history, including another player's private Dice+ results. No database
migration was added for history.

Admin is hidden initially. Both Cosmos administrator capability and Owlbear GM
role must be verified before the Admin tab, display controls and battle token
menu appear. Revoking access hides the tab, returns to Character, and removes
the context menu. Commands retain their existing authorization checks. Dice+
integration and roll visibility settings remain available to ordinary players.

Checks: tests/owlbear-history.test.mjs covers receipt correctness, ownership,
expired sessions, permission denial and battle menu lifecycle.
scripts/check-owlbear-panel-browser.mjs exercises the real action controller and
generated markup with a synthetic room/account: players, admins, revocation,
history rendering, escaping, refresh and phone/keyboard layout. It makes no
real game rolls or account changes. A real multiplayer Owlbear reconnect remains
a manual check after deployment.

# Manual QNAP refresh

The manual helper is scripts/publish-cosmos-qnap.sh. Download it from the exact
approved GitHub commit and run it over the existing password SSH connection.
It builds a candidate while the current app remains online, checks migration
history and integrity on a private database copy, verifies the regular backup,
then briefly stops only cosmos-app for a final consistent database snapshot.
It recreates only the Compose app service. Tailscale identity, secrets, media,
other NAS containers and the existing live data volume are retained.

Failed startup restores the previous image and pre-switch database. Failed
database/WAL files are retained separately for recovery. An interrupted final
snapshot phase restarts the original container. Backups and release directories
are retained. The current app must first be healthy; a NAS/network outage is
not repaired by this helper. Its shell syntax is checked locally; actual QNAP
execution and external login/character/media verification remain manual.

After success, hard-refresh Cosmos, reopen the Owlbear room, and reconnect the
Cosmos account. Existing grants intentionally expire when the backend restarts.
The extension install URL remains /owlbear/manifest.json; version is 1.1.0.
