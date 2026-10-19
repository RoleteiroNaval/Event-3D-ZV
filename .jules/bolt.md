## 2026-10-19 - Per-frame allocations in Three.js collision & raycasting loops

**Learning:** Creating intermediate `THREE.Box3` and `THREE.Vector3` objects inside 60FPS animation loops (`requestAnimationFrame`) generates significant GC pressure and slows execution. Reusing pre-allocated module/closure vectors and replacing higher-order methods like `Array.prototype.some` with indexed `for` loops cuts collision resolution time by ~50% (from ~262ms to ~131ms for 500k iterations).

**Action:** Always pre-allocate static/reusable `THREE.Vector3`, `THREE.Box3`, and direction vectors outside or at initialization of animation loops, and prefer direct `for` loops over callback-based array methods in hot paths.
