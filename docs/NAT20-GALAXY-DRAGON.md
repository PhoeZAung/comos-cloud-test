# Natural 20: galaxy dragon

Local implementation only. No push, merge, or remote deployment.

The new default natural-20 presentation is a 1.25-second, diagonal galaxy-dragon
flyby. It uses original vector silhouette artwork (animated wings, horns, claws,
and a long tail), a moving purple/blue nebula texture, soft edge glow, and a short
timed stardust trail. The overlay and all descendants ignore pointer input. The
interface remains visible; there is no full-screen flash or dimming backdrop.

The existing presentation queue determines the result, finishes its recorded
dice toss, and updates the sheet receipt before invoking the effect. Only the
main unmodified d20 can trigger a natural 20; total 20, damage dice, and critical
confirmation rolls do not. Rules, dice physics, server receipts, character data,
and Discord dispatch are unchanged. The animation does not lock sheet controls
or await a network request. The existing visual queue waits for its brief effect
to finish, and only one dragon can be active. Navigation, cancellation, Escape,
and switching to reduced motion clean up the overlay and audio graph.

The galaxy texture is generated deterministically by build-galaxy-dragon.mjs and
ships in both portable and live builds. It is about 21 KB WebP, guarded by a
48 KB asset-budget test, and is preloaded while a natural-20 dice toss plays.
There is no runtime dragon model, 3D renderer, video, or asset-pack dependency.
The original Cosmos silhouette/texture remain. Its wingbeat is now retargeted
from the supplied Ashwing Drake Lite fly_loop, sampled at 30 fps over 0.8 seconds.
The source model, textures, and full skeletal clip stay private. Only small
compiled extension/sweep/wrist-lift curves ship as part of the Cosmos effect.
Matrix attributes are updated on animation frames, replacing unreliable CSS
animation inside the SVG mask. The animation frame is cancelled on all exits.

Credit: **Ashwing Drake by Literock Studios**. The [supplied license](licenses/ASHWING-DRAKE-LITE.txt)
permits modification and packaging inside an end product. It also accompanies
the compiled motion module. This is not a standalone asset-pack redistribution.
The offline extractor, `scripts/extract-drake-wing-motion.mjs`, accepts a private
GLB path and records its SHA-256; normal site builds need no source model.

The original short roar replaces the whoosh. It synthesizes rough vocal pulses,
subharmonics, breath, and chest/throat resonances into a cached, peak-limited
0.98-second audio buffer. No recorded sample is required. The ZIP's roar clip
contains skeletal animation, not an audio recording. It reuses the existing Sound
switch and volume, respects zero volume, stops immediately when muted, and
plays only in an already running AudioContext unlocked by the roll gesture.
Blocked/suspended browser audio stays silent without delaying the result.
Reduced motion uses a still NAT 20 receipt for 0.9 seconds, with no flyby, trail,
or roar.

Settings → Theme → Critical rolls → Nat 20 animation defaults to Galaxy dragon.
Fire and Arcane vortex remain explicit alternatives. The new optional JSON
preference nat20Style defaults to dragon for existing and new accounts. The
older critStyle field stays compatible; old pages can save preferences without
overwriting an explicit new selection. Sound/effect/volume choices are retained.
No schema migration or bulk preference rewrite is needed. Natural 1 retains its
existing presentation.

## Verification

- `npm run test:galaxy`: 19 focused tests cover natural-roll detection, defaults,
  preference compatibility/persistence, audio policy and disposal, static asset
  MIME/size, periodic/visible retargeted wing motion, roar waveform quality bounds,
  existing dice faces, combat receipts, and Discord idempotency.
- `npm run test:galaxy:browser`: rebuilds only portable dist, then runs an
  isolated Playwright preview. On Windows it uses installed Edge; elsewhere
  install Playwright Chromium, or set COSMOS_BROWSER_EXECUTABLE. It never opens
  an account, sends a real roll, or changes the active local site's auth config.
  Screenshots/results are saved in a new temporary directory.
- Browser checks cover 1440×900, 390×844, 320×568, and 844×390; transparent,
  clickable underlying UI; single-instance behavior; 1.25-second cleanup;
  modified totals and ordinary Classic rolls; the effects switch; natural 1;
  cancellation; sound on/off/zero volume; and reduced motion. The queue check
  substitutes a controlled dice-settled promise for 3D rendering and confirms
  dice → unchanged receipt → dragon ordering. It does not claim a live game roll
  was visually exercised.
- A controlled wing-frame comparison pauses the flight/texture, advances the
  actual renderer callbacks, and verifies over 15,000 painted pixels change as
  the wings fold/extend. Merely changing a CSS transform property is insufficient.

Remaining manual checks: physical Android/iOS smoothness, preferred sound balance
on actual speakers/headphones, and the full animation beside real gameplay.
