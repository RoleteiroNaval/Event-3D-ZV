## 2026-09-28 - Zero-Allocation 3D Animation Loops & Hardware Canvas Downsampling

**Learning:** Allocating Three.js objects (`Vector3`, `Box3`) and function closures inside `requestAnimationFrame` loops creates garbage collection spikes during 3D walkthroughs. Pre-allocating vector instances and updating `Box3.min/max` directly eliminates frame drops. Additionally, using a 1x1 singleton canvas with `drawImage` leverages GPU/browser-native bilinear scaling for regional color sampling, avoiding repeated canvas DOM creation and thousands of manual pixel JS loops.

**Action:** Always pre-allocate math utility objects outside animation frame loops, and leverage 1x1 hardware downsampling when calculating regional average colors.
