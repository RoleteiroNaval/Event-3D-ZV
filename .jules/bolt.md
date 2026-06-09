## 2025-05-15 - Optimized regional color sampling with 1x1 canvas
**Learning:** Using a 1x1 canvas and 'drawImage' to leverage hardware-accelerated interpolation for averaging color regions is significantly faster than manual pixel-by-pixel looping in JavaScript. It also reduces GC pressure by using a singleton canvas and minimizes GPU-to-CPU readback overhead.
**Action:** Always prefer 1x1 canvas downscaling for regional averaging instead of manual looping over 'getImageData' results.
