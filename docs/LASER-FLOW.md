# LaserFlow and Limit Break readiness

Cosmos uses the unmodified React Bits JS-CSS registry files in
`src/components/react-bits/LaserFlow.jsx` and `LaserFlow.css`.
Source: https://reactbits.dev/r/LaserFlow-JS-CSS.json.
The registry declares no additional dependencies; the existing React and
React DOM packages mount the effect. `provenance.json` records file hashes.

The existing Laser Flow preference lazy-loads the local `laser` effect bundle.
It uses beamPosition 0.6, color #3847ff, intensity 1.8, flare 1.5, spread 1.5,
spill 1, fog 0.2, dust 1.6, revealRadius 220 and revealOpacity 0.6.
The reveal image is the existing Cosmos universe artwork instead of the sample
`/your-ui.png`. The surface reference uses the supplied percentage geometry
with a transparent surface to preserve the existing page background. The stage
fills the viewport, matching Cosmos's previous global Laser Flow setting.
Disabling the preference, enabling reduced motion, or leaving the page unmounts
the effect. The overlay does not capture pointer input.

The Limit Break panel reuses the Notes ElectricBorder component, with its own
14px corner radius. Its readiness comes directly from `limitBreakState.allowed`:
HP at or below the existing half-HP threshold and at least one shared use left.
Sheet redraws dispose and remount decorations after health/use updates. The
Notes preference continues to control Notes only.

Validation:

- `npm test`
- `node scripts/build-live.mjs public-auth.json`
- `node scripts/check-laser-limit-browser.mjs` (requires Playwright Chromium;
  optionally set `COSMOS_BROWSER_EXECUTABLE` to a compatible Chromium binary).

The browser fixture covers desktop/mobile sizing, WebGL and no-WebGL rendering,
local reveal image loading, click-through, toggles, reduced motion, cleanup,
Limit Break readiness transitions, and editable Notes. It uses no live account.
