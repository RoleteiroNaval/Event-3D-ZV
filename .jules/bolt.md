## 2026-10-17 - Object Pooling in Three.js Animation Loops

**Learning:** Allocating `THREE.Vector3` or `THREE.Box3` objects inside 60 FPS animation loops (`requestAnimationFrame`) or collision callbacks creates frequent Garbage Collection (GC) pressure and micro-stutters.
**Action:** Always pre-allocate static or module-level Three.js math primitives (`Box3`, `Vector3`) and update their values using `.copy()`, `.set()`, or `min.set()`/`max.set()` rather than instantiating or cloning new objects per frame.
