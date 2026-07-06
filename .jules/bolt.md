## 2026-07-06 - [Three.js Vertex Loop Optimization]
**Learning:** Accessing `BufferAttribute.array` directly as a `TypedArray` in Three.js hot loops provides a ~2x performance gain over using `.getX()`, `.getY()`, and `.setZ()`. Function inlining of sampling logic further eliminates call overhead in high-frequency loops (e.g., 65,536 iterations for a 256x256 grid).
**Action:** Always prefer direct TypedArray access and inline pixel-sampling helpers in performance-critical geometry generation paths.
