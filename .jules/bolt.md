## 2026-07-12 - BufferAttribute Direct Access Optimization
**Learning:** Using `BufferAttribute.getX/setZ` in hot loops (65k+ iterations) incurs significant overhead due to method calls and safety checks. Direct TypedArray access via `.array` is substantially faster.
**Action:** Always prefer direct TypedArray access in vertex processing loops for Three.js geometries.

## 2026-07-12 - Loop Inlining for Performance
**Learning:** Inlining small, frequently called helper functions (like coordinate-to-index mapping) inside hot loops eliminates function call overhead, which becomes measurable at 65k+ iterations.
**Action:** Inline performance-critical logic in geometry processing loops to maximize throughput.
