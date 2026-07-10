## 2026-07-10 - Direct TypedArray Access in Vertex Loops

**Learning:** Accessing `BufferAttribute.getX/Y/Z` and calling small helper functions like `depthAt` inside large loops (66k+ vertices) creates significant overhead in Three.js vertex processing.

**Action:** Use direct TypedArray access via `attribute.array` and inline small utility functions into the hot loop to achieve up to ~50% speedup in mesh generation.
