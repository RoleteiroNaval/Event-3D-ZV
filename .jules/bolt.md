## 2026-07-25 - Object Pooling in Three.js Hot Loops
**Learning:** In Three.js-based rendering engines, allocating object instances (like Vector3 or Box3) inside the animation or physics update loop triggers frequent Garbage Collection (GC) pauses. Minimizing GC thrashing is key to achieving a stable 60+ FPS, far outweighing simple CPU micro-optimizations.
**Action:** Always pre-allocate math primitives (Vector3, Box3) at a higher scope (module or hook scope) and mutate them in-place using methods like `.copy()` or directly modifying `.min`/`.max` values in hot animation loops.
