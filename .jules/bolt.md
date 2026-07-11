# Bolt's Performance Journal

## 2026-07-11 - Optimization of createDepthMesh
**Learning:** In Three.js, using `BufferAttribute.getX/Y/Z` and `setX/Y/Z` inside high-frequency loops (e.g., 65k+ iterations for a 256x256 mesh) introduces significant function call overhead. Direct TypedArray access to `attribute.array` is much more efficient. Inlining sampling logic like `depthAt` also eliminates massive call stack overhead.
**Action:** Always prefer direct TypedArray access and inline small utility functions in hot loops like vertex displacement.
