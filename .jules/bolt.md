## 2026-07-01 - [Mesh & Color Optimization]
**Learning:** In Three.js hot loops, `BufferAttribute.getX/Y/Z` methods add significant overhead compared to direct `TypedArray` access. For regional color averaging, a 1x1 canvas with `drawImage` is ~5-10x faster than manual pixel looping as it leverages hardware-accelerated interpolation.
**Action:** Always prefer direct array access for large vertex buffers and use the 1x1 canvas trick for regional averaging.
