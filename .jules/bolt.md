# Bolt's Journal - Critical Learnings

## 2026-08-21 - Object Pooling for Collision Detection Box3
**Learning:** Instantiating `THREE.Box3` and child `THREE.Vector3` objects inside per-frame animation loops (such as `resolveCameraCollision`) creates unnecessary object allocation churn and garbage collection pressure during walkthrough navigation.
**Action:** Use a pre-allocated module-level `THREE.Box3` instance and mutate its `.min` and `.max` vectors directly via `.set()` instead of instantiating new `Box3` and `Vector3` objects per frame.
