## 2026-06-27 - [Optimization] 1x1 Singleton Canvas for Regional Averaging
**Learning:** Using a 1x1 singleton canvas and 'drawImage' to average an image region is ~23x faster than manual O(N) pixel loops. It leverages hardware-accelerated interpolation and avoids massive JS-side memory allocations and GC pressure.
**Action:** Always prefer 1x1 hardware-accelerated downsampling for regional color extraction. Use 'globalCompositeOperation = copy' on the context to replace pixels without the overhead of 'clearRect'.
