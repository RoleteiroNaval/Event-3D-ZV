## 2026-06-19 - Depth Mesh Generation Loop Optimization
**Learning:** Accessing Three.js `BufferAttribute` via `getX`/`getY`/`setZ` in a tight loop (e.g., 256x256 segments) introduces significant function call overhead. Direct `Float32Array` access is much faster. Inlining small sampling logic like `depthAt` further eliminates overhead.
**Action:** Use direct TypedArray access (`attribute.array`) and inline hot utility functions in geometry processing loops to maximize performance.
