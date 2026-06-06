## 2025-05-15 - Optimizing 3D World Generation and Color Sampling
**Learning:** Manual pixel-by-pixel looping on canvases for averaging is slow and can be offloaded to the GPU via `drawImage` onto a 1x1 canvas. Additionally, using Three.js `BufferAttribute` getter/setter methods (`getX`, `setZ`) in hot vertex loops adds significant function call overhead compared to direct TypedArray access.
**Action:** Replace 48x48 manual sampling with 1x1 hardware-accelerated sampling. Switch to direct `positions.array` access in `createDepthMesh`.
