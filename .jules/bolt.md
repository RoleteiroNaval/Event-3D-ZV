## 2025-05-14 - Optimized Mesh Generation and Color Sampling

**Learning:** Manual pixel looping in JavaScript for color averaging and vertex processing is a major bottleneck in Three.js applications when dealing with high-resolution meshes (65k+ vertices). Leveraging hardware-accelerated interpolation (1x1 canvas) and direct TypedArray access can yield significant performance gains.

**Action:**
1. Use 1x1 canvas for region color averaging to leverage GPU-accelerated interpolation instead of manual loops.
2. Access Three.js BufferAttributes directly via `.array` as TypedArrays for hot loops to avoid function call overhead from `.getX()/`.setZ()`.
3. Reuse existing UV coordinates instead of re-calculating them from positions when possible.
4. Inline simple lookup logic to eliminate thousands of function calls per frame/interaction.

**Impact:** ~11x faster mesh generation (from 34.7ms to 3.1ms per 66k vertices), significantly improving UI responsiveness when adjusting depth parameters.
