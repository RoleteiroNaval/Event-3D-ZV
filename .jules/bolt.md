## 2026-07-07 - Vertex Processing Optimization in Three.js
**Learning:** Accessing `BufferAttribute.array` directly and inlining sampling logic in hot loops (e.g., mesh deformation) significantly reduces overhead from function calls (`.getX()`, `.setZ()`) and scope switching. In a high-quality mesh (66k vertices), this can yield a ~21% speedup in the vertex processing loop.
**Action:** Always prefer direct TypedArray access for performance-critical geometry updates in Three.js.
