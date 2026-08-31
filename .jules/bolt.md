# Bolt's Performance Journal - Critical Learnings

## 2026-08-31 - Camera Collision Allocation Elimination in 60fps Animation Loop
**Learning:** Instantiating `THREE.Box3` and `THREE.Vector3` inside animation frame loops like `resolveCameraCollision` causes continuous garbage collection overhead (~300ms vs ~166ms per 1M checks). Pre-allocating a single module-level `THREE.Box3` and updating bounds via `.min.set()` / `.max.set()` completely eliminates allocations while maintaining identical behavior.
**Action:** Always pre-allocate reusable Three.js bounding objects and vectors outside animation frame loops and hot collision paths.
