## 2026-07-14 - [Singleton 1x1 Canvas for Color Averaging]
**Learning:** Repeatedly creating canvas elements and manual pixel-by-pixel color averaging in JS is significantly slower than using a 1x1 singleton canvas. Drawing a large image region into a 1x1 canvas leverages the browser's hardware-accelerated interpolation to calculate the average color efficiently.
**Action:** Use a 1x1 singleton canvas with `globalCompositeOperation = 'copy'` for all regional color sampling tasks to improve performance and reduce GC pressure.
