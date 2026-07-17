# Bolt's Performance Journal

## 2026-07-17 - Performance Optimizations in Collision Detection and Image Processing
**Learning:** Optimizing key calculations inside the Three.js hot-loops (e.g. resolveCameraCollision and createImageWorld color sampling/mesh generation) has major performance impact.
**Action:** Always measure frame loop and processing latency, keeping object allocations inside animate loops to zero.
