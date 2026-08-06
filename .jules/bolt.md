# Bolt's Optimization Journal

## 2026-08-06 - Walkthrough Loop Object Pooling
**Learning:** Instantiating WebGL objects such as `THREE.Box3` and `THREE.Vector3` inside frame-by-frame animation or interaction loops (like the first-person walkthrough or collision resolver) creates massive garbage collection (GC) overhead, causing browser stuttering. Adopting object pooling by pre-allocating static vectors and boxes within the hook and module scope fully eliminates this overhead.
**Action:** Always pre-allocate math and utility objects (Vector3, Box3, etc.) at the module scope or during hook initialization, and directly update their properties (e.g. `box.min.set()`) to avoid per-frame allocations in render/animate loops.
