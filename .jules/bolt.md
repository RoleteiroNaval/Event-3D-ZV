## 2026-06-04 - Vertex processing optimization with direct TypedArray access
**Learning:** Three.js BufferAttribute accessor methods (getX, getY, setZ) and small utility functions (depthAt) introduce significant overhead when called tens of thousands of times in a single frame or world generation.
**Action:** Always prefer direct TypedArray access (positions.array as Float32Array) and inline per-pixel/per-vertex logic in hot loops to eliminate function call overhead and maximize JIT performance.
