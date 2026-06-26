## 2026-06-26 - Optimized Color Sampling with 1x1 Canvas
**Learning:** Using a manual pixel loop on a 48x48 canvas to average colors is redundant when the browser's hardware-accelerated `drawImage` can do it by drawing into a 1x1 canvas. Creating a new canvas on every call also adds significant GC pressure.
**Action:** Use a singleton 1x1 canvas with `drawImage` to leverage hardware interpolation for color averaging.

## 2026-06-26 - Inlined Depth Sampling in Mesh Generation
**Learning:** Calling a small helper function like `depthAt` inside a loop that runs up to 65,536 times (for high quality) introduces significant function call overhead in the JS engine's hot path.
**Action:** Inline frequently called math/sampling utilities directly into performance-critical loops.
