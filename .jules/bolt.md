## 2026-08-07 - Camera Walkthrough Hot Loop Allocations Optimized
**Learning:** Instantiating THREE.Box3 and THREE.Vector3 inside hot loops (e.g., inside resolveCameraCollision or the animate loop in ThreeViewer) causes significant GC pressure and performance dips, which can be avoided by pre-allocating the object footprint once and updating its bounds directly via .min.set() and .max.set().
**Action:** Use pre-allocated static/module-level Three.js math objects (Vector3, Box3) to prevent garbage collection pauses during critical rendering and animation frames.
