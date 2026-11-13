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
`/your-ui.png`. On character sheets, the surface reference follows the actual Favorites/Character/
Combat navigation bar. The beam hits that bar at 60% of its width and spills down
both sides of the sheet content. The sheet uses spread 2.5 so the light reaches
both edges. Resize, nested scrolling and tab redraws update the geometry; after
the bar scrolls above the viewport the side barrier continues from the top edge.
Pages without visible sheet tabs retain the supplied percentage geometry and
spread 1.5. The reference surface stays transparent and the stage fills the viewport.

**Full-height waterfall continuation:** The React Bits shader deliberately
fades its original bright impact spill near the tab bar. Cosmos extends that
edge light with two subtle downward-animated streams attached to the measured
sheet surface (not an arbitrary 600px wrapper). On every sheet tab, the
surface runs to the bottom of its live content **or 96px beyond the visible
viewport**, whichever is farther. This keeps short tabs flowing off-screen
and lets long Skills, Inventory, Notes and other tall tabs continue while the
user scrolls. Streams paint only to a viewport-sized overscan to avoid a very
tall CSS animation layer; the fixed overlay scroll-following geometry moves
them with the active tab. If tabs scroll above the viewport, their streams
still reach from its top to below its bottom. The original React Bits shader
and its registry checksum remain unchanged. No new hitboxes, scrollbars or
click-intercepting elements are introduced. Reduced-motion and the user
preference both suppress the continuation along with LaserFlow.
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

The browser fixture covers full-height flowing side streams, short and long tabs, scroll alignment, desktop/mobile sizing, WebGL and no-WebGL rendering,
local reveal image loading, click-through, toggles, reduced motion, cleanup,
Limit Break readiness transitions, and editable Notes. It uses no live account.
