# Bolt's Journal - Critical Learnings Only

## 2026-07-23 - Camera Collision Object Pooling Optimization
**Learning:** Instantiating `THREE.Box3` and `THREE.Vector3` inside the main animation loop/collision response function (`resolveCameraCollision`) triggers continuous memory allocations, leading to Garbage Collection (GC) pressure and potential micro-stutters during walkthrough navigation.
**Action:** Pre-allocate a single module-level `THREE.Box3` instance (`cachedCameraFootprint`) and update its `min` and `max` vector properties directly using `min.set()` and `max.set()`. This completely eliminates per-frame object allocations inside the hot path.
