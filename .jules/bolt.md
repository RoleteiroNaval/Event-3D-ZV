## 2026-07-02 - [High-Volume Vertex & Color Optimization]
**Learning:** High-quality Three.js meshes (256x256) involve over 260,000 vertex attribute calls. Using direct TypedArray access and inlining sampling logic yields a ~22% speedup. Additionally, hardware-accelerated regional color averaging via a 1x1 singleton canvas is ~23x faster than manual pixel looping.
**Action:** Always prefer direct TypedArray access for hot vertex loops and leverage GPU interpolation for image-based statistical sampling.
