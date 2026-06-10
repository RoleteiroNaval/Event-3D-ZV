## 2026-06-10 - Vertex Processing Loop Optimization
**Learning:** In Three.js, using `geometry.attributes.position.getX/Y/Z` in hot loops (e.g., during depth mesh generation) introduces significant function call overhead. Direct access to the `Float32Array` via `positions.array` is significantly faster.
**Action:** Always prefer direct TypedArray access and inline simple sampling logic (like UV-to-pixel mapping) when processing thousands of vertices per frame or during expensive initialization steps.
