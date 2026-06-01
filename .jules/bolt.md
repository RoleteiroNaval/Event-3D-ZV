## 2025-05-22 - Optimize 3D World Generation

**Learning:** Manual pixel-by-pixel looping for color averaging (via `getImageData`) and vertex manipulation (via `BufferAttribute.getX/setZ`) are significant bottlenecks in 3D scenes with high vertex counts.
**Action:** Use 1x1 canvas `drawImage` for hardware-accelerated color averaging and access `BufferAttribute.array` directly as a TypedArray in hot loops to eliminate function call overhead.
