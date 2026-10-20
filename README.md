# ICE TRAY DIAMONDS — Interactive Scroll Flipbook

A single-page luxury product website where scrolling plays through 384 high-resolution frames (two 8-second jewelry deconstruction videos) like an optical flipbook.

- **Live Demo:** [https://alloyce-amos.duckdns.org/ice-tray-diamonds/](https://alloyce-amos.duckdns.org/ice-tray-diamonds/)
- **Portfolio:** [https://alloyce-amos.duckdns.org](https://alloyce-amos.duckdns.org)

## Highlights

- **Zero Frameworks, Zero Build Step:** Contained in a single [`index.html`](index.html) with embedded CSS and vanilla JavaScript.
- **Pinned Full-Screen Retina Canvas (`400vh`):** Stays pinned while scrolling through the 400vh track, mapping scroll progress (`0%` to `100%`) directly from Frame `001` at the top to Frame `384` at the bottom.
- **Full Frame Preloader:** Preloads all 384 frames before unlocking scroll, displaying a thin progress bar and frame counter while loading.
- **Smooth `requestAnimationFrame` Rendering:** Redraws the canvas only when the active frame index changes or the viewport resizes, cover-fitting 1920×1080 frames across arbitrary aspect ratios and `devicePixelRatio` screens.
- **Editorial Story & Pitch-Black Transition:** Starts on the frames' warm studio grey (`#2d3133`) so canvas edges disappear, reveals three short story callouts at **20%**, **50%**, and **80%** of the scroll, and darkens smoothly to pitch black (`#000000`) into the anatomical specifications and acquisition section.

## Run Locally

```bash
python3 -m http.server 8095
# Open http://localhost:8095
```
