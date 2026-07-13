## 2026-07-13 - [Direct TypedArray Access and Inlining in createDepthMesh]
**Learning:** Accessing Three.js 'BufferAttribute' via '.getX()', '.getY()', and '.setZ()' in hot loops (e.g., vertex processing for a 256x256 grid) introduces significant function call overhead. Direct access to the underlying 'Float32Array' is much more efficient. Furthermore, inlining small sampling logic (like 'depthAt') eliminates thousands of unnecessary calls.
**Action:** Always prioritize direct TypedArray access ('attribute.array') and inline hot-path utility functions in vertex-processing loops for Three.js.
