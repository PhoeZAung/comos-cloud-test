# Random fullscreen critical effects

The optimized effect pages ship with source builds; publishing remains a separate manual step.

Nat 1 randomly chooses Void Rift, Crystal Shatter Blast, or Planet Shatter.
Nat 20 randomly chooses Thunder God Strike, Starfall Barrage, or Thousand Cuts.
The dragon, roar, vortex renderer, and animation picker have been removed.
Settings → Theme has separate Nat 20 / Nat 1 animation switches, plus the
existing optional sound and volume. Roll Nat 20 / Roll Nat 1 are visual previews
and intentionally work even when automatic effects are disabled.

Only the unmodified primary d20 triggers these effects. The existing presentation
queue finishes its dice toss and shows its authoritative receipt first. One
visual-only random choice is made per queued roll and preloaded during the dice
toss; the same choice is used when the animation starts. Game rolls, resources,
character data, and Discord delivery are unchanged. Input remains available.

## Timing and presentation

The supplied GIFs are converted without changing their original 30/40 ms frame
delays into small WebP sprite pages. A canvas plays the frames exactly once,
starting from frame zero each time. If an atlas is not decoded yet, playback
waits at the last frame; the impact marker cannot run ahead. Low frame rates
slow the animation instead of skipping its impact frame.

The number and screen shake are driven by the frame that is actually drawn:

| Effect | Number / main impact frame | Approximate source time |
| --- | ---: | ---: |
| Void Rift | 28 | 0.93 s |
| Crystal Shatter Blast | 4 | 0.13 s |
| Planet Shatter | 41 | 1.37 s |
| Thunder God Strike | 42 | 1.40 s |
| Starfall Barrage | 40 | 1.33 s |
| Thousand Cuts | 52 | 1.73 s |

Void has a second collapse shake. Starfall has several impact shakes. Thousand
Cuts shakes during the cuts and on the final burst, where NAT 20 appears.
Planet playback stops after frame 82 so the planet does not re-form at the end
of the supplied clip. Effects play their own native duration, followed by a
short receipt hold/fade. The fullscreen canvas fills the viewport; the planet
uses aspect-preserving cover so it stays round. Nat 1 desaturates/dims the
underlying page; Nat 20 lights it up. Both the page and effect stage shake, and
every enabled animated effect has an impact shake.

Reduced-motion users receive a still result with no shake or impact sound.
Escape, navigation, live disable, and cancellation release timers, animation
frames, decoded pages, audio nodes, and shake animations. Failed asset loading
falls back to a short static critical receipt. The optional cached spell cue
starts at the main impact only if already decoded, never late.

## Assets and compatibility

Original GIFs remain untouched in Downloads. Private working copies live in
%USERPROFILE%/.cosmos-dev/critical-fx/sources, with compiled atlases in compiled.
The optimized end-product WebP pages, short sound cues, and timing manifest are
versioned under src/assets/critical-fx. Raw GIFs and source asset packs stay private.
scripts/build-critical-effects.mjs copies the bundled pages into the ignored
dist/assets/critical-fx directory, which both local and QNAP builds include.
If no bundle is present, the script can compile the private working copies.
Source hashes in the manifest identify the supplied clips.

Decoded frames are bounded to current/next atlas pages; consumed ImageBitmaps
are closed. Compressed pages use a bounded cache. Canvas DPR is capped at 1.5.
The static server allows JSON manifests, WebP pages, and OGG cues only within
the critical asset directory.

The new nat20Effects/nat1Effects JSON flags inherit an older critEffects switch.
Old style values are accepted but ignored; no animation style is selectable.
Legacy preference saves preserve independent flags unless the old global
switch is explicitly changed. There is no schema migration or bulk data rewrite.

## Verification

- npm run test:critical: 21 focused checks cover raw natural faces, random pools,
  per-effect cues, frame delay/stall behavior, independent flag persistence,
  picker removal, native asset MIME types, existing receipts and Discord rules.
- npm run test:critical:browser builds portable output and tests all six real
  effects at the frame before/at their impact, painted pixels, fullscreen sizing,
  automatic shake/cleanup, click-through, phone/small-phone/landscape layouts,
  dice → receipt → effect order, normal rolls, toggles, sound and reduced motion.
  The synthetic preview substitutes a controlled dice-settled promise and does
  not log in, send a game roll, or change live user data. It uses the bundled
  frame pages; screenshots/results are written to a temporary directory.

Remaining manual checks: physical-device smoothness and preferred sound level.
