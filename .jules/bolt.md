# Bolt's Optimization Journal

## 2026-08-05 - [Inlining Depth Sampling & Direct TypedArray Access in Mesh Loops]
**Learning:** In Three.js hot loops operating on large geometry sets (e.g. 65k vertices in PlaneGeometry), calling `BufferAttribute.getX/getY/setZ` or calling external helper functions like `depthAt` inside the loop incurs huge call stack overhead.
**Action:** Access the underlying Float32Array directly using `positions.array` with strided indexing (`i * 3`), and inline pixel sampling arithmetic directly into the loop to achieve ~26% speedup.
