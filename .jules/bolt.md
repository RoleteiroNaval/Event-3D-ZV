# Bolt's Performance Journal

## 2026-08-01 - Object Allocation in Three.js Hot Loops (Pointer Lock Navigation)
**Learning:** Instantiating small utility objects (such as `THREE.Vector3` or `THREE.Box3`) inside rendering loops or recurring input-processing functions (like pointer-lock collision checks) causes significant memory churn. While a single allocation is cheap, creating multiple objects at 60-120fps triggers frequent and unpredictable Garbage Collection (GC) pauses, which degrade framerate stability (micro-stuttering).
**Action:** Pre-allocate vectors and boxes outside the loop scope (or as module-level static singletons) and reuse them by mutating their fields directly (e.g., via `min.set()` and `max.set()`) instead of instantiating new objects.
