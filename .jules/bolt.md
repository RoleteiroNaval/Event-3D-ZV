## 2026-07-05 - [Object Pooling for Collision Detection]
**Learning:** Instantiating `THREE.Box3` and `THREE.Vector3` every frame inside the render loop (specifically in `resolveCameraCollision`) creates unnecessary garbage collection pressure. This can lead to frame rate stutters, especially in complex scenes with many collision checks.
**Action:** Use module-level reusable objects (object pooling) for temporary calculations in hot loops like collision detection and physics resolution.
