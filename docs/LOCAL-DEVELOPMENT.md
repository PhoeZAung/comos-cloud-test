# Local Cosmos with your existing Firebase account

Run `START-LOCAL.cmd`, then open https://localhost:4175/signin.html.
Use your existing Google or email/password login. This runs the real backend;
VS Code Live Server and `npm start` only serve static previews.
Stop the launcher with Ctrl+C. Restart it after source edits to rebuild the pages.

Local SQLite and uploads live in `%USERPROFILE%\.cosmos-dev\data`.
They start empty and are independent of the QNAP database. Your local profile
may need a display name on first sign-in. The shared Firebase account identifies
you, but does not automatically supply characters or profile data from QNAP.

The private service-account key and local HTTPS certificate are stored outside
the website in `%USERPROFILE%\.cosmos-dev`, restricted to your Windows account
and SYSTEM. Never publish that folder. The localhost certificate is trusted in
your current Windows user's certificate store. Node 24 is installed privately
under that folder; the system's Node installation is unchanged.

Local logout revokes only the local cookie, recorded persistently in the local
database. It does not revoke Firebase sessions on other sites. Production entry
points retain their existing all-device logout behavior. Signup and password
reset still operate on the shared Firebase project; they are real account actions.

Firebase Authentication must allow `localhost` in Settings > Authorized domains
for Google sign-in. The production `public-auth.json` is not edited. A local copy
is generated outside the repository and used only to build `dist-live`.

No QNAP files, databases, containers, or deployment workflows are changed by this
launcher. Authentication readiness/health checks are not proof of successful
browser login; complete an interactive sign-in to verify that final step.

## Custom dice and roll effects (local)

Sheet settings now have three tabs:
- Main: Discord rolls, portrait background, edit character, level up.
- Theme: custom dice (no presets), 3D animation, critical effects and sound,
  full-width volume control, forced Nat 20 / Nat 1 visual rolls, and round
  color swatches for the four site themes.
- Site: display name, site effects switches, and archive character. Profile
  photos remain on the normal Account page and are absent from sheet settings.

All website roll presentations share one queue. Each job captures its own
options, runs the recorded dice through the existing authoritative face adapter,
waits for the toss to finish and clear, updates the sheet result, and then shows
Cosmos Classic. Natural 1/20 instead show a number in the vortex circle with a
muted gray / brighter backdrop. Critical effects disabled falls back to Classic.
The job waits for its result popup to close before the next toss can start.
Navigation aborts the current job and invalidates pending jobs. Network saves
are not blocked while the visual queue drains. Owlbear keeps Dice+ behavior.

Preview buttons enqueue a d20 fixed to 20 or 1 through the exact same visual
sequence. They never call the roll API, spend resources, or send Discord rolls.
Real effects inspect the main d20, not modified totals, damage, or confirmation.
Custom standard/gemstone dice support polished, translucent glass, procedural
starry galaxy, and metallic finishes with a body color. Preset selection is gone;
legacy preset IDs remain readable for existing saved accounts.

Imported vortex GIFs and spell cues are kept outside Git in
%USERPROFILE%\.cosmos-dev\roll-fx and copied only into the ignored local build.
Original archives and the unused drake model remain private; no drake renderer,
model, or Three.js dependency is included in the build. Original licenses stay
alongside the private source assets. Source sounds/art are not an asset-pack
redistribution. The sound setting uses a gain stage and compressor with the
volume slider; reduced motion skips animated tosses and uses a still banner.

Preference migration 023 adds dice_options JSON text. A local SQLite backup was
created before it was applied. No NAS migration or deployment has occurred; the
code-only NAS helper refuses that schema change. Plan NAS migration separately.
Validation is limited to build, syntax, and local startup/health checks. No
automated tests or interactive multi-roll/effect previews were run.

Dice presentation fixes: throws use lower spin/throw forces, higher damping, and
a screen-fit scale. Each toss keeps a logical canvas size and is fitted into the
new screen size during resize; the next toss adopts the new dimensions. The
pinned Dice Box resize adapter registers once, updates immediately on show, and
ignores zero-size hidden canvases. Settled mesh/hitbox transforms are unfrozen,
the recorded face is oriented toward the camera and ray-checked against that
specific hitbox, then rendered. Sleeping dice ignore later physics transforms.
An alignment failure hides the 3D dice and preserves the recorded receipt.

The toss records a bounded physics trace at a fixed 60 Hz before showing the
die, prepares the recorded face while hidden, and replays the actual positions
and rotations with one constant orientation offset. There is no added lift,
timed spin, or easing toward a different face at landing. Each die stays at its
own final position when its trace ends. Result callbacks wait for playback;
final face checking only reads the landed die. Clearing a roll invalidates any
pending preparation. This replaces both the last-frame face snap and the
artificial airborne phase visible in the supplied recordings. Validation is
limited to builds and syntax checks; the new motion has not been previewed in
an interactive roll.

Standalone sheets now initialize shared galaxy/splash effects lazily, respecting
Pause stars, Splash cursor, site colors, and reduced motion. Sheet effects use
lighter rendering settings and release their contexts/listeners on navigation.
