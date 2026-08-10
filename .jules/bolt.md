# Bolt's Performance Journal

This is a record of critical learnings and performance optimizations.

## 2026-08-10 - Hardware-Accelerated Average Color Downscaling with 1x1 Singleton Canvas
**Learning:** Initializing/creating a temporary `48x48` canvas and running a CPU pixel loop of 2,304 iterations on every regional color sample adds significant garbage collection overhead and CPU overhead. By utilizing a 1x1 singleton canvas, we completely avoid memory allocation and garbage collection. Furthermore, letting the GPU downscale the regional texture automatically via browser-native hardware interpolation (using `drawImage` to a 1x1 area) eliminates manual loops completely, and setting `globalCompositeOperation = 'copy'` bypasses any blending or clearing overhead.
**Action:** When calculating regional or background color averages from source images in Canvas/WebGL apps, always prefer a 1x1 singleton canvas with `drawImage` and `globalCompositeOperation = 'copy'` over manual loops and multi-pixel canvases.
