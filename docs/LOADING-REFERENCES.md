# Character sheet loading design

The original SVG/CSS in `src/ui/sheet-loading.mjs` and
`src/styles/sheet-loading.css` combines rotating geometric magic-circle rings
with an indeterminate glowing bar and floating particles, inspired by:

- reverland, SVG Magic Circle: https://codepen.io/reverland/pen/jBBzbO
- rust_1966, glowing particle progress bar: https://uiverse.io/rust_1966/tall-fly-13

No third-party runtime or remote asset is loaded. Colours use the active theme.
The bar is indeterminate: it does not invent a completion percentage. The screen
is rendered in the initial HTML, remains during the actual character request,
and is replaced on success or failure. Reduced motion disables all animation.
