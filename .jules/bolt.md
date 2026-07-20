## 2026-07-20 - Hot-loop Allocation Avoidance in Three.js Controls and Collision Systems
**Learning:** Instantiating utility objects (such as `THREE.Vector3` or `THREE.Box3`) inside a 60+ FPS animation frame loop creates significant Garbage Collection (GC) pressure, causing micro-stutters. Pre-allocating these objects in the parent scope (e.g., `useEffect` scope or module level for synchronous pure functions) completely eliminates frame-by-frame GC sweeps.
**Action:** Always reuse pre-allocated vectors and boxes using `.copy()` or `.set()` methods inside hot render loops.
