
## 2026-06-14 - Optimized Color Sampling and Mesh Generation
**Learning:**
1. Using a 1x1 canvas with 'drawImage' is a massive win for regional color averaging because it moves the calculation from a JS loop to the GPU/browser internal drawing pipeline.
2. Direct TypedArray access in Three.js hot loops is essential for high-vertex meshes, avoiding the overhead of thousands of getter/setter calls. Inlining small helpers like 'depthAt' further optimizes these loops.

**Action:**
Always look for opportunities to move pixel manipulation to the canvas API and use direct buffer access in geometry processing.
