## 2026-09-07 - Object Pooling in Three.js Animation Loop
**Learning:** Instantiating `THREE.Box3` and `THREE.Vector3` inside requestAnimationFrame loops or collision callbacks creates high Garbage Collection (GC) pressure, causing frame drops during camera movement.
**Action:** Always pre-allocate static or scoped `THREE.Vector3` and `THREE.Box3` instances when performing per-frame raycasting or collision detection, using `min.set()` / `max.set()` / `.copy()` to update them in place.
