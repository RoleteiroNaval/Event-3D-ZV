## 2025-05-15 - Optimize Mesh Generation Hot Loop
**Learning:** In Three.js hot loops (e.g., vertex processing), accessing `BufferAttribute.array` directly as a TypedArray instead of using `.getX()`, `.getY()`, or `.setZ()` significantly reduces execution time by eliminating function call overhead. For a high-quality mesh (66,049 vertices), this, combined with inlining sampling logic, improved performance by ~47%.
**Action:** Always prefer direct TypedArray access for high-frequency geometry manipulations. Inline small utility functions within these loops to further reduce overhead.
