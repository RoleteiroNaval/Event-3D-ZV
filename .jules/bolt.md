## 2026-08-03 - Object Pooling in Three.js Hot Loops

**Learning:** Declaring and instantiating custom Three.js mathematical and bound elements (`THREE.Vector3`, `THREE.Box3`) inside hot animation/render loops triggers significant garbage collection overhead and pauses, causing micro-stuttering (jank). Pre-allocating elements at module/hook scope and updating them via `.set(...)` or `.copy(...)` eliminates allocation overhead and stabilizes frame rates.

**Action:** Always pre-allocate math utility objects (e.g., vectors, boxes, matrices) in a module or hook-level cache for functions called on every frame, and modify their properties directly.
