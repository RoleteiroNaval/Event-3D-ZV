# Bolt's Performance Journal

## 2026-07-19 - Initial Assessment of Three.js and Canvas Bottlenecks
**Learning:** In Three.js and Canvas interactions, there are major allocation overheads in hotspots (e.g. creating THREE.Vector3, THREE.Box3, and HTML5 Canvas objects on the fly). Reusing vectors, boxes, and canvases as singletons or cached pool objects prevents Garbage Collection (GC) pressure and maintains a stable frame rate.
**Action:** Always pre-allocate math objects like `THREE.Vector3` or `THREE.Box3` outside of critical loops and reuse canvas elements with appropriate configuration like `willReadFrequently`.
