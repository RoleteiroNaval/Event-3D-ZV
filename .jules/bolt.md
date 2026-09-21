## 2026-09-21 - Eliminate Per-Frame Allocations in 3D Render Loops
**Learning:** Instantiating temporary objects (like `THREE.Vector3`, `THREE.Box3`, or array callbacks) inside 60 FPS animation loops causes frequent Garbage Collection (GC) pauses and frame drops. Reusing static/pre-allocated objects with `.copy()` or `.min.set()` reduces execution overhead and maintains smooth 60 FPS performance.
**Action:** Always pre-allocate math utility objects (`Vector3`, `Box3`, etc.) outside requestAnimationFrame or in hook scope and reuse them with direct setter methods.
