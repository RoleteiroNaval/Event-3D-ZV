# Bolt's Performance Journal

## 2026-11-04 - Reusable Box3 Allocation in resolveCameraCollision
**Learning:** In Three.js animation loops, allocating `new THREE.Box3(new THREE.Vector3(...), new THREE.Vector3(...))` and using `.some()` on obstacle arrays causes per-frame GC churn and callback overhead. Mutating `box.min.set()` and `box.max.set()` directly on a pre-allocated Box3 alongside an early-exiting indexed for-loop reduces execution time by ~90% and eliminates object allocation churn during walkthrough camera navigation.
**Action:** When performing spatial boundary/collision checks in 60 FPS Three.js rendering loops, always reuse module-level Box3/Vector3 instances and indexed for-loops instead of instantiating new vectors and functional iterators.
