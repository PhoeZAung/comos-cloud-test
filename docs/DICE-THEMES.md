# Dice appearance

Account → Dice → Dice theme opens the theme gallery. The same gallery is in
the character sheet's Main settings menu. The preference is saved per account
in SQLite, and is shared by both controls.

Cosmos Classic retains the original result popup and is the default. The complete numbered
3D choices are Classic 3D, Blue Green Metal, Dice of Rolling, Gemstone, Rainbow
Marble, Rock, Rust, Smooth, and Wooden. The gallery includes a preview die selector
and Roll on page button. Preview rolls do not change a character or send Discord
messages. The gallery also includes Classic Extras, Dice of Rolling Fate, Smooth Pips,
and Genesys from the same repository. Smooth Pips uses pip-marked six-sided
models. Genesys previews its actual symbol dice; numbered character rolls
fall back to Classic 3D because symbol dice do not represent d20 outcomes.

The Dice result popup preference still controls sheet roll displays. Reduced
motion uses the original popup. If WebGL or assets cannot load, recorded totals
are still displayed with a message explaining that 3D is unavailable.

## Source and build

- `@3d-dice/dice-box` 1.1.4, MIT: https://github.com/3d-dice/dice-box
- Dice Themes, MIT: https://github.com/3d-dice/dice-themes
- Theme source revision: `0e166e5cd927a1f0a0581f2460a865b134ef1d9e`.
- License notices are in `licenses/dice-box-MIT.txt` and
  `licenses/dice-themes-MIT.txt`.

Models/textures/physics assets are self-hosted under `public/assets/dice-box`.
`scripts/build-dice.mjs` copies the pinned library's browser modules and the
static assets into the generated build. Keep package-lock.json and assets with
the source. No third-party CDN is used at runtime.

## Server roll authority

Character rolls continue to be generated and recorded by the server. The 3D
layer receives the recorded die faces and shows the same totals and modifiers.
The build adapter orients each settled die to its supplied server value, using
the model's collider face map. Percentile rolls split the recorded value between
their two dice. It checks the engine's resulting values before reporting a
successful visual match; failures retain the server total and show a fallback
message. Preview rolls use the engine's normal simulation results.

The adapter targets Dice Box 1.1.4 and must be reviewed when upgrading that
library. Its build anchor deliberately fails if the expected implementation
changes. It does not change the backend roll generator or Discord receipts.

Rolls cover the complete viewport on a transparent, non-blocking overlay.
Dice use a larger desktop/mobile scale. Each die in the expression is rendered
individually: 2d6 creates two six-sided dice. Settled dice remain visible for
2.2 seconds, fade for 0.4 seconds, and clear automatically. Escape or the result
close button dismisses the roll early.

Migration 021 adds the account dice-theme preference; migration 022 preserves
existing preferences while allowing the complete repository theme collection. Older preference-update
payloads preserve the saved dice theme. No production deployment is performed
by the local launcher.
