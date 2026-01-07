# Learning Documentation

## Overview
This document contains learning notes, concepts, and insights from working on the agentless video KYC frontend project.

---

## Concepts to Understand Better

### 1. requestAnimationFrame Pattern for Video Element Initialization

**Location:** `src/pages/PanPage/hook.ts` (lines 56-67)

**Problem:**
When `useEffect` runs after `isCameraOpen` becomes `true`, the `<video>` element might not be mounted in the DOM yet. This causes `videoRef.current` to be `null`, and we can't assign the stream to it.

**Solution:**
Using `requestAnimationFrame` to wait for the next browser frame before checking if the video element exists.

**Code:**
```typescript
const initVideo = () => {
  if (videoRef.current) {
    // Video element exists - assign stream
    videoRef.current.srcObject = streamRef.current;
    videoRef.current.onloadedmetadata = () => {
      setIsCameraReady(true);
    };
    videoRef.current.play().catch(console.error);
  } else {
    // Video element not ready yet - try again next frame
    requestAnimationFrame(initVideo);
  }
};
requestAnimationFrame(initVideo);
```

**Why requestAnimationFrame?**
- React's `useEffect` runs after render, but DOM update might not be complete
- `requestAnimationFrame` runs before browser paints the frame
- This ensures the video element is likely to be in the DOM
- If element still not found, it retries on the next frame

**Flow:**
1. `useEffect` runs when `isCameraOpen = true`
2. `requestAnimationFrame(initVideo)` schedules check for next frame
3. React renders JSX (creates `<video>` element)
4. Browser paints frame (video element now in DOM)
5. `initVideo()` runs - checks if `videoRef.current` exists
6. If exists: assign stream and play video
7. If not: schedule another check for next frame

**Status:** ⚠️ Need to understand better - timing issues with DOM mounting

---
