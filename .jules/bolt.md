## 2026-06-17 - Mesh Generation Optimization
**Learning:** High-quality Three.js meshes (256x256 segments) have ~66,000 vertices. Using Three.js BufferAttribute accessor methods (.getX, .getY, .setZ) and separate function calls for every vertex in a hot loop introduces significant overhead.
**Action:** Use direct Float32Array access and inline pixel sampling logic in mesh generation loops to minimize function call overhead and improve cache locality.
