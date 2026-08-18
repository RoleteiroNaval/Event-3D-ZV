## 2026-08-18 - Object Pooling in Animation Loops
**Learning:** Instantiating `THREE.Box3` and `THREE.Vector3` on every frame in the walkthrough animation loop causes continuous garbage collection churn (allocating up to 5 objects per frame at 60 FPS).
**Action:** Pre-allocate static/module-level `THREE.Box3` and `THREE.Vector3` instances and mutate them using `.min.set()`, `.max.set()`, `.copy()`, or `.set()` inside hot animation loops.
