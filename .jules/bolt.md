## 2026-06-22 - Optimizing Three.js World Generation
**Learning:** Found significant overhead in `createImageWorld.ts` due to manual pixel looping for color averaging and inefficient Three.js attribute access within a high-iteration vertex loop (66k+ iterations).
**Action:** Replace 48x48 manual color sampling with 1x1 hardware-accelerated canvas interpolation. Inline vertex calculations and use direct TypedArray access to bypass Three.js getter/setter overhead in the depth mesh hot loop.
