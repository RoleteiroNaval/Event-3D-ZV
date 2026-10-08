## 2026-10-08 - Object Pooling in Animation Loops

**Learning:** Instantiating `THREE.Box3`, `THREE.Vector3`, and closure callbacks (`Array.prototype.some`) inside frame-by-frame animation loops (e.g. `resolveCameraCollision`) causes severe garbage collection pressure and CPU overhead (~88% slower execution).
**Action:** Reuse pre-allocated module-level `THREE.Box3` and `THREE.Vector3` instances, and use direct `for` loops instead of array iteration methods with closure callbacks during per-frame collision detection.
