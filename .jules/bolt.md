## 2025-05-15 - [Color sampling optimization]
**Learning:** Manual pixel-by-pixel looping in JavaScript for color averaging is inefficient compared to browser-native `drawImage` to a 1x1 canvas.
**Action:** Use a 1x1 canvas to leverage hardware-accelerated interpolation for regional color averaging.
