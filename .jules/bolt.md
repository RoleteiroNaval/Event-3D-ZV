# Bolt's Performance Journal

## 2026-07-04 - [Direct TypedArray Access in Vertex Loops]
**Learning:** In Three.js, using 'BufferAttribute.getX/Y/Z' or 'setX/Y/Z' inside high-frequency loops (e.g., 66k iterations) introduces significant function call overhead. Direct access to the underlying 'TypedArray' via '.array' is substantially faster.
**Action:** Always prefer direct TypedArray access for hot loops involving geometry modifications.
