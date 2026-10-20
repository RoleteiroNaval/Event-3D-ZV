## 2026-10-20 - Hot Loop Allocation Elimination in 3D Walkthrough & Mesh Processing

**Learning:** Re-instantiating `THREE.Box3`, `THREE.Vector3`, and closure callbacks (`Array.prototype.some`) in 60fps render animation loops creates heavy GC pressure and stalls frame rates. Additionally, methods on `BufferAttribute` (`getX`/`setZ`) in large mesh vertex loops (~66k vertices) introduce noticeable function overhead compared to direct `Float32Array` TypedArray access.

**Action:** Pre-allocate reusable Three.js math primitives (`Box3`, `Vector3`) outside animation loops and update properties directly via `.set()`. Use direct TypedArray indexing (`array[i * 3 + z]`) in hot vertex processing loops.
