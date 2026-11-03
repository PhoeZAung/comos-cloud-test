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

Sheet gear > Main contains Customize dice, dice visibility, critical animation /
sound controls, volume, and Nat 20 / Nat 1 effect previews. The previews are visual
only: they never call the roll API, consume resources, or send Discord messages.
Site contains the account profile, site themes, and site effects. Dice controls
have moved out of Account. Presets remain available below the custom editor.

Custom dice reuse the existing numbered standard/gemstone meshes. Polished,
translucent glass, procedural galaxy, and shiny metal finishes use a selected
body color. Shape never changes the requested die count/sides or recorded faces.
Real critical effects inspect the main d20 breakdown, not the modified total,
damage dice, or confirmation die. Website dice trigger the effect when settled;
Owlbear continues to use its existing Dice+ integration without extra animations.

Imported end-product assets are kept outside Git at
%USERPROFILE%\.cosmos-dev\roll-fx and copied only into the ignored local live
build: vortex GIFs, three selected spell sound cues, the animated Ashwing Drake
GLB, and a dwarven UI image. Original archives stay in Downloads. Source licenses
are retained alongside the private assets. Do not upload these files as an asset
pack; the SFX and drake licenses permit end-product use and restrict standalone
redistribution. Nat 1 currently uses an arcane fizzle treatment.

Sound defaults off; reduced motion shows a still result banner. The drake renderer
is loaded only when requested and its WebGL canvas is released after the effect.
The first drake preview may take longer to load. Settings persist through the
new additive local database migration 023 (dice_options JSON text). A local SQLite
backup was created before applying it. The NAS has not received this migration;
the existing code-only NAS helper will refuse this schema change. Plan the later
NAS data migration separately when deployment resumes.

Validation here is limited to builds, syntax checks, and local startup/health.
Automated tests and interactive dice/effect previews have not been run.
