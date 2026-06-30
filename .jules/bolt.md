## 2026-06-30 - [Initial Exploration]
**Learning:** The `createDepthMesh` function in `image-3d-navigator/src/three/createImageWorld.ts` is a hot path, especially with high-quality settings (256x256 segments = 65,536 vertices). It currently uses `positions.getX(i)`, `positions.getY(i)`, and calls a separate `depthAt` helper function for each vertex, incurring significant function call overhead.
**Action:** Use direct TypedArray access on `positions.array` and inline the `depthAt` logic to maximize performance in the vertex processing loop.
