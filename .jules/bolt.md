## 2026-06-15 - Reuse Canvas for Color Sampling
**Learning:** Creating DOM elements like `canvas` and their 2D contexts inside frequently called functions (even if not in a hot loop) adds unnecessary memory pressure and initialization overhead.
**Action:** Use a module-level singleton canvas for utility operations like `sampleAverageColor` to improve performance and reduce GC pressure.
