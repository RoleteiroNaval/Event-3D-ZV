# Bolt's Performance Journal

This journal records critical architectural bottlenecks, surprising optimization failures, or valuable lessons from rejected changes.

## 2026-08-08 - Garbage Collection and Object Allocation in Hot Loops
**Learning:** Instantiating temporary objects (such as `THREE.Box3` and `THREE.Vector3` or cloning camera positions) inside requestAnimationFrame or game loops triggers frequent garbage collection pauses, causing visible frame rate stuttering (jank).
**Action:** Use object pooling and pre-allocated static/module-level variables to reuse existing objects instead of instantiating new ones every frame. Use `.set()` and `.copy()` directly on pre-allocated objects.
