# Sheet interaction effects

PaperCrumple and ElectricBorder now use the actual React Bits JS-CSS components,
with React mounted only inside the decorative effects. They are bundled locally
with esbuild and loaded on demand; no CDN is contacted by the app.

Sources: https://reactbits.dev/r/PaperCrumple-JS-CSS.json and
https://reactbits.dev/r/ElectricBorder-JS-CSS.json. The registry host was blocked
in the development environment, so these exact registry JSON files were fetched
from the official DavidHDev/react-bits repository's `public/r/` directory.
Original file hashes and dependency metadata are recorded in
`src/components/react-bits/provenance.json`. ElectricBorder is unchanged.
PaperCrumple adds an optional `onReady` controller and a settled `crumpled` state
notification so deletion can await the genuine mesh animation without simulated
user input. All requested visual parameters are set in the integration wrappers.

The wrappers live in `src/effects/react-bits/`. React, React DOM, Three.js and
html-to-image are pinned in the lockfile. A local snapshot of the character sheet
becomes the paper texture; nothing is uploaded. After the deliberate hold and
confirmation, it crumples, exits upward, then the archive request is sent. A failed
request restores the sheet. Cancellation prevents the request. Reduced motion
uses a short fade; unavailable WebGL uses a compact image fold and upward exit.
The notes preference mounts/unmounts ElectricBorder without replacing note inputs.
Upstream observes resize, visibility and reduced motion; cleanup releases graphics
resources and listeners. A static outline remains when WebGL is unavailable.

The existing Star Border and Hold Button remain native Cosmos adaptations.
Reference project: David Haz's [React Bits](https://github.com/DavidHDev/react-bits).
The MIT + Commons Clause license is preserved in
[licenses/React-Bits-LICENSE.md](licenses/React-Bits-LICENSE.md).
These components are used as part of Cosmos, not a separately distributed UI kit.

# Cosmos user removal

The admin Players directory offers **Delete user**. It checks the admin session,
same origin, current user revision and exact name. Self-removal and removal of
configured administrator identities are rejected. The transaction marks the
Cosmos user removed, frees the display name, archives their active characters,
and removes group memberships. Existing attribution and records remain intact.

Identity mappings are retained as tombstones: Firebase sign-in cannot recreate
the removed Cosmos account, existing Cosmos sessions and Owlbear grants stop
working, and legacy imports skip it. Schema migration 025 adds the removal
timestamp and acting administrator. No live account was removed during testing.

Mount Aetheria and Cosmos share Firebase. This button deliberately does not
delete their Firebase Authentication identity, revoke their shared provider
tokens, or erase Firestore data. No Firebase action is needed to remove Cosmos
access. If the owner also wants to remove the shared login from both apps, they
can delete that identity separately in Firebase Authentication; this is a
different, broader operation.
