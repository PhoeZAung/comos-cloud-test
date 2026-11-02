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
