## 2026-06-03 - [Color Averaging & Vertex Access Optimization]
**Learning:** Manual pixel-by-pixel color averaging in JS is significantly slower than using a 1x1 canvas with `drawImage`, which leverages GPU-accelerated interpolation. Similarly, accessing `BufferAttribute.getX/Y/Z` in hot loops (like vertex displacement) adds unnecessary function call overhead compared to direct TypedArray access.
**Action:** Always prefer 1x1 canvas for region averaging and direct `BufferAttribute.array` access for high-frequency vertex operations.
