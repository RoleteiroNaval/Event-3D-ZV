## 2026-07-15 - Camera Collision and Animation Loop Memory Overhead
**Learning:** Per-frame object allocations in the Three.js animation loop (specifically for collision detection and position tracking) create unnecessary GC pressure. Reusing math objects (Vector3, Box3) via closures or module-level singletons is a standard but critical optimization for maintaining 60FPS.
**Action:** Implement object pooling for THREE.Box3 and THREE.Vector3 in `collisionSystem.ts` and `ThreeViewer.tsx`.
