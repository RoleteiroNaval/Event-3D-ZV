# Bolt's Journal - Critical Learnings

## 2026-07-26 - Hardware-Accelerated Regional Color Averaging via 1x1 Canvas
**Learning:** Manual pixel-by-pixel looping on a 48x48 canvas to find regional average color incurs heavy CPU overhead and GC pressure. Re-creating the canvas and context on every invocation compounds this. Setting up a lazy-initialized singleton 1x1 canvas with the `copy` composite operation allows us to leverage the browser's hardware-accelerated image scaling and interpolation to instantly calculate the average color in a single `drawImage` operation.
**Action:** Use a lazy-initialized 1x1 singleton canvas, set `globalCompositeOperation = 'copy'`, and perform a single-pixel `getImageData(0, 0, 1, 1)` read to get the averaged color with zero manual loop overhead and zero repeated canvas allocations.
