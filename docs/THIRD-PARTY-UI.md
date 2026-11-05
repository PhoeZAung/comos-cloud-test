# Sheet interaction effects

Cosmos uses lightweight native browser adaptations of the requested React Bits
interactions, integrated with its existing non-React dialogs:

- [Star Border](https://reactbits.dev/animations/star-border): a traveling glow
  around weapon/ability detail dialogs and editors, using a masked gradient.
- [Hold Button](https://reactbits.dev/micro/hold-button): liquid-fill hold to
  confirm, with early release, pointer cancellation and keyboard support.
- [Paper Crumple](https://reactbits.dev/micro/paper-crumple): the visible sheet
  folds into shaded paper panels after confirmed archival. This native DOM
  adaptation avoids a new Three.js dependency and screenshot upload.

Reference project: David Haz's [React Bits](https://github.com/DavidHDev/react-bits).
The current MIT + Commons Clause license is preserved in
[licenses/React-Bits-LICENSE.md](licenses/React-Bits-LICENSE.md).
These interactions are part of Cosmos, not a separately distributed UI kit.
Reduced motion disables the traveling border and replaces crumpling with a
brief fade. Hold confirmation still requires the full hold duration.

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
