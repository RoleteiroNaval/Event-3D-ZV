# Bolt's Journal ⚡

## 2025-05-31 - Initial Optimization Patterns
**Learning:** In Three.js and Canvas applications, two common bottlenecks are manual pixel manipulation in JS and method call overhead in large geometry loops.
**Action:** Always prefer 1x1 canvas `drawImage` for region averaging (hardware accelerated) and direct `TypedArray` access for `BufferAttribute` manipulations in hot loops.
