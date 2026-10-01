## 2026-10-01 - Object Pooling in Three.js Collision & Raycasting Loops
**Learning:** Instantiating `THREE.Box3` and `THREE.Vector3` on every frame inside requestAnimationFrame loops causes garbage collection overhead and frame drops (jank). Using module-scoped pre-allocated instances (`cameraFootprint`, `downVector`, `cachedPreviousPosition`) with direct `.set()` / `.copy()` calls eliminates per-frame allocations without risking state contamination in single-threaded JS.
**Action:** Always object-pool temporary Three.js math objects used inside animation and collision loops.
