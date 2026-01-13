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

### 2. React Context for Session Recording

**Location:** `src/services/sessionRecording/context.tsx`

**What is React Context?**
React Context is a way to share data (state, functions, values) across multiple components without passing props through every level. It solves the "prop drilling" problem.

**Why Use Context for Session Recording?**
- **Cross-page state:** Recording starts on PAN page and continues through OTP, Selfie, and stops on Thank You page
- **Single source of truth:** All recording state lives in one place (isSessionRecording, MediaRecorder, video chunks, blob)
- **Easy access:** Any component can use `useSessionRecording()` without prop drilling
- **Lifecycle management:** Recording persists across page navigations automatically

**How It Works:**

1. **Create Context** (line 14):
```typescript
const SessionRecordingContext = createContext<SessionRecordingContextType | null>(null);
```
- Creates the context "container"
- Default value is `null` - this means "no value yet" or "outside Provider"

2. **Custom Hook** (lines 16-22):
```typescript
export const useSessionRecording = () => {
  const context = useContext(SessionRecordingContext);
  if (!context) {
    throw new Error('useSessionRecording must be used within SessionRecordingProvider');
  }
  return context;
};
```
- Helper hook to access the context
- Checks if context exists (throws error if used outside Provider)
- Provides TypeScript safety

3. **Provider Component** (lines 24-254):
- Wraps entire app in `main.jsx`
- Stores all recording state and functions
- Provides values to all child components

4. **Usage in Components:**
```typescript
// In PanPage - starts recording
const { startRecording } = useSessionRecording();

// In ThankYouPage - stops recording
const { stopRecording, downloadRecording } = useSessionRecording();
```

**Why `null` as Default Value?**
- Detects when context is used outside Provider (returns `null`)
- Enables error checking in the custom hook
- Clear "not initialized yet" signal
- Common React pattern for safety

**Flow:**
1. App wraps everything in `<SessionRecordingProvider>`
2. Provider stores recording state and functions
3. Any component can call `useSessionRecording()` to access them
4. No need to pass props through intermediate components

**Without Context (Prop Drilling):**
```
App → Router → PanPage (needs startRecording)
           → ThankYouPage (needs stopRecording)
```
Would require passing props through Router even though Router doesn't use them!

**With Context:**
```
<SessionRecordingProvider>
  <App />  // Any component inside can use useSessionRecording()
</SessionRecordingProvider>
```
Clean and simple!

---

### 3. React Component Syntax: Function Definition to JSX Usage

**Location:** `src/services/sessionRecording/context.tsx` (lines 24-254) and `src/main.jsx` (lines 9-11)

**The Question:**
How does defining a function like `export const SessionRecordingProvider = ({ children }) => { ... }` allow you to use it as JSX like `<SessionRecordingProvider><App /></SessionRecordingProvider>`?

**The Answer:**

**Step 1: You define a React component as a function**
```typescript
// context.tsx - DEFINING the component
export const SessionRecordingProvider = ({ children }) => {
  // ... state and logic ...
  return (
    <SessionRecordingContext.Provider value={...}>
      {children}
    </SessionRecordingContext.Provider>
  );
};
```

**Step 2: JSX is just function calls in disguise**
When you write JSX, React transforms it into a function call:
```jsx
// main.jsx - USING the component
<SessionRecordingProvider>
  <App />
</SessionRecordingProvider>

// React transforms this to:
SessionRecordingProvider({ children: <App /> })
```

**Step 3: How they connect**
1. You export a function called `SessionRecordingProvider`
2. When React sees `<SessionRecordingProvider>`, it calls that function
3. Whatever you put between the JSX tags becomes the `children` prop
4. Your function receives `children` and returns JSX that wraps it

**Visual Flow:**
```
1. main.jsx writes:
   <SessionRecordingProvider>
     <App />
   </SessionRecordingProvider>

2. React sees: "I need to render SessionRecordingProvider"

3. React calls: SessionRecordingProvider({ children: <App /> })

4. Your function runs (context.tsx):
   - Sets up state (isSessionRecording, refs, etc.)
   - Creates functions (startRecording, stopRecording, etc.)
   - Returns JSX:
     <SessionRecordingContext.Provider value={...}>
       {children}  {/* children = <App /> */}
     </SessionRecordingContext.Provider>

5. React renders the returned JSX:
   <SessionRecordingContext.Provider value={...}>
     <App />  {/* Gets rendered inside */}
   </SessionRecordingContext.Provider>
```

**Key Concepts:**
- A React component is just a function that returns JSX
- JSX syntax `<ComponentName>` is React's way of calling the function
- The `children` prop is whatever you put between opening and closing tags
- The function must return JSX (or null) for React to render it

**Simple Example:**
```typescript
// Define a component
const MyComponent = ({ children }) => {
  return <div>{children}</div>;
};

// Use it as JSX
<MyComponent>
  <p>Hello</p>
</MyComponent>

// This calls: MyComponent({ children: <p>Hello</p> })
// Which returns: <div><p>Hello</p></div>
```

**Why `.Provider` is needed:**
- `SessionRecordingContext` is just an object (created by `createContext()`)
- `SessionRecordingContext.Provider` is the actual React component
- You can't wrap with the context object itself - you need the `.Provider` component

---

### 4. useState vs useRef for Recording Stream

**Location:** `src/services/sessionRecording/context.tsx`

**The Question:**
Why do we use `useState` for `recordingStream` instead of `useRef`? Can't we just use `streamRef.current` directly?

**The Answer:**

**useState triggers re-renders, useRef doesn't:**
- `useState`: When value changes → React detects it → Component re-renders → UI updates
- `useRef`: When value changes → React doesn't detect it → No re-render → UI doesn't update

**Why this matters for recordingStream:**

1. **Components need to react to stream changes:**
   - When stream goes from `null` → `MediaStream`, the `RecordingIndicator` component needs to show the video
   - When stream goes from `MediaStream` → `null`, the component needs to hide the video
   - This requires re-renders, which only `useState` provides

2. **useEffect needs to run when stream changes:**
   ```typescript
   useEffect(() => {
     if (videoRef.current && recordingStream) {
       videoRef.current.srcObject = recordingStream; // Assign stream to video element
     }
   }, [recordingStream]); // ← This effect runs when recordingStream changes
   ```
   - The `useEffect` depends on `recordingStream`
   - If we used `useRef`, React wouldn't know when it changes
   - The effect wouldn't run, and the video element would never get the stream

3. **Conditional rendering needs reactivity:**
   ```typescript
   if (!isSessionRecording && !recordingStream) return null; // Hide component
   {recordingStream && (/* Show video preview */)} // Show video
   ```
   - These conditions check `recordingStream` to decide what to render
   - Without re-renders, the UI wouldn't update when the stream changes

**What if we used useRef?**
- Stream would be stored in `streamRef.current`
- But React wouldn't know when it changes
- Components wouldn't re-render
- Video element wouldn't get updated
- UI wouldn't show/hide based on stream state
- Result: Nothing would work!

**Summary:**
- `useState` = "I want React to know when this changes and update the UI"
- `useRef` = "I want to store a value but React doesn't need to track it"
- For `recordingStream`, we need React to track it, so we use `useState`

---

### 5. How the Stream Flows from Context to Component

**Location:** `src/services/sessionRecording/context.tsx` and `src/components/RecordingIndicator.tsx`

**The Flow:**

1. **Stream is created and stored in context:**
   ```typescript
   // In context.tsx - startRecording function
   setRecordingStream(stream); // ← Stream stored in state
   ```

2. **React detects state change:**
   - `recordingStream` changes from `null` → `MediaStream`
   - React sees the state change
   - React triggers a re-render of all components using this context

3. **RecordingIndicator receives new value:**
   ```typescript
   // In RecordingIndicator.tsx
   const { recordingStream } = useSessionRecording(); // ← Gets new stream value
   ```

4. **useEffect runs because dependency changed:**
   ```typescript
   useEffect(() => {
     if (videoRef.current && recordingStream) {
       videoRef.current.srcObject = recordingStream; // ← Assign to video element
     }
   }, [recordingStream]); // ← Runs because recordingStream changed
   ```

5. **Video element displays the stream:**
   - Once `srcObject` is assigned, the video element automatically shows the live feed
   - MediaStream provides continuous frames, not just one picture

**Visual Flow:**
```
1. startRecording(stream) called
   ↓
2. setRecordingStream(stream) in context
   ↓
3. React detects state change → re-renders
   ↓
4. RecordingIndicator gets new recordingStream value
   ↓
5. useEffect runs (because recordingStream in dependency array)
   ↓
6. videoRef.current.srcObject = recordingStream
   ↓
7. Video element shows live feed
```

**Key Point:**
The stream doesn't "flow" like water - it's more like:
- Context stores the stream reference in state
- React re-renders when state changes
- Component receives new value through context
- useEffect reacts to the change and updates the video element

---

### 6. UI Persistence Across Pages

**Location:** `src/App.jsx` and `src/main.jsx`

**The Question:**
How does the RecordingIndicator stay visible when navigating between pages (Pan → OTP → Selfie → Thank You)?

**The Answer:**

**Component hierarchy:**
```typescript
// main.jsx
<SessionRecordingProvider>  // ← Wraps entire app
  <App />
</SessionRecordingProvider>

// App.jsx
<BrowserRouter>
  <RecordingIndicator />  // ← OUTSIDE Routes, always mounted
  <Routes>
    <Route path="/pan" element={<PanPage />} />      // ← Mounts/unmounts
    <Route path="/otp" element={<OtpPage />} />      // ← Mounts/unmounts
    <Route path="/selfie" element={<SelfiePage />} /> // ← Mounts/unmounts
    <Route path="/thank-you" element={<ThankYouPage />} /> // ← Mounts/unmounts
  </Routes>
</BrowserRouter>
```

**Why it persists:**

1. **RecordingIndicator is outside Routes:**
   - Only components inside `<Routes>` unmount when navigating
   - `RecordingIndicator` is a sibling to `<Routes>`, not a child
   - It stays mounted throughout the entire app lifecycle

2. **Context Provider wraps everything:**
   - `SessionRecordingProvider` is at the root level
   - It never unmounts (unless the entire app closes)
   - State (`recordingStream`, `isSessionRecording`) persists across navigation

3. **BrowserRouter keeps it mounted:**
   - `BrowserRouter` manages route changes
   - It only unmounts/remounts components inside `<Routes>`
   - Components outside `<Routes>` remain mounted

**Visual Representation:**
```
SessionRecordingProvider (never unmounts)
  └── BrowserRouter (never unmounts)
      ├── RecordingIndicator (always visible) ← PERSISTS HERE
      └── Routes
          ├── PanPage (mounts/unmounts on navigation)
          ├── OtpPage (mounts/unmounts on navigation)
          ├── SelfiePage (mounts/unmounts on navigation)
          └── ThankYouPage (mounts/unmounts on navigation)
```

**Result:**
- RecordingIndicator stays visible across all pages
- Video preview continues showing
- Recording state persists
- No need to restart recording on each page

**If RecordingIndicator was inside Routes:**
- It would unmount when navigating away
- Video would disappear
- Would need to remount and reconnect stream
- Bad user experience!

---

### 7. MediaStream Behavior: Continuous Feed, Not Single Picture

**Location:** `src/components/RecordingIndicator.tsx`

**The Misconception:**
Some people think MediaStream shows just one picture that freezes on screen.

**The Reality:**
MediaStream provides a **continuous live feed** of video frames, not a single static image.

**How it works:**

1. **Once assigned to video element:**
   ```typescript
   videoRef.current.srcObject = recordingStream;
   ```
   - The video element connects to the stream
   - Stream continuously sends new video frames
   - Video element automatically displays each new frame
   - Result: Live, moving video, not a frozen picture

2. **The stream keeps sending frames:**
   - Camera captures frames continuously (usually 30 per second)
   - Each frame is sent through the MediaStream
   - Video element displays them in sequence
   - Creates the illusion of motion (like a flipbook)

3. **Why useState is still needed:**
   - Even though the stream provides continuous frames
   - We still need React to know when the stream is assigned/removed
   - To show/hide the video element
   - To update the UI when recording starts/stops

**Analogy:**
- **Wrong thinking:** MediaStream = one photo that stays on screen
- **Correct thinking:** MediaStream = a live TV channel that keeps broadcasting

**Key Point:**
The video element automatically handles the continuous feed. We just need to:
1. Assign the stream once (`srcObject = stream`)
2. Let the browser handle displaying frames
3. Use React state to control when to show/hide the video element

---

### 8. Cleanup: Where and How Streams Are Stopped

**Location:** `src/services/sessionRecording/context.tsx` and `src/components/RecordingIndicator.tsx`

**The Question:**
Where does cleanup happen? In the component's useEffect cleanup, or somewhere else?

**The Answer:**

**Cleanup happens in the context, not in the component:**

1. **Component cleanup is intentionally empty:**
   ```typescript
   // In RecordingIndicator.tsx
   useEffect(() => {
     // ... setup code ...
     return () => {
       // Empty - intentionally does nothing
     };
   }, [recordingStream]);
   ```
   - The cleanup function is empty
   - Comment says: "we want to keep the stream active"
   - Even if component unmounts, stream should stay active

2. **Actual cleanup in context's stopRecording:**
   ```typescript
   // In context.tsx - stopRecording function
   if (currentStream) {
     currentStream.getTracks().forEach(track => track.stop()); // ← Stop camera/mic
   }
   setRecordingStream(null); // ← Clear state
   ```

3. **What happens when stream is stopped:**
   - All media tracks are stopped (camera and microphone turn off)
   - `recordingStream` is set to `null` in state
   - React detects state change → re-renders
   - `RecordingIndicator` receives `null` for `recordingStream`
   - `useEffect` runs again, but condition `if (recordingStream)` is false
   - Video element's `srcObject` still has old stream reference, but tracks are stopped
   - Video shows nothing (black screen or last frame)

**Why cleanup is in context, not component:**
- **Centralized control:** One place manages when recording stops
- **Lifecycle:** Recording can stop even if component is unmounted
- **Consistency:** All cleanup logic in one place
- **State management:** Context owns the stream, so it should clean it up

**Flow:**
```
1. User navigates to ThankYouPage
   ↓
2. ThankYouPage calls stopRecording()
   ↓
3. Context stops all tracks: stream.getTracks().forEach(track => track.stop())
   ↓
4. Context sets recordingStream to null: setRecordingStream(null)
   ↓
5. React re-renders (state changed)
   ↓
6. RecordingIndicator receives null
   ↓
7. Component hides (conditional rendering: if (!recordingStream) return null)
```

**Key Point:**
The component doesn't clean up the stream - it just reacts to the stream being cleaned up by the context. This is good separation of concerns:
- Context = owns and manages the stream
- Component = displays the stream

---

### 9. Module-Level Variables vs useRef for Preventing Duplicate Operations

**Location:** `src/pages/ThankYouPage/main.tsx` (line 6)

**The Problem:**
In React StrictMode, components mount twice in development. Without a guard, this would cause duplicate API calls (upload recording + complete session called twice).

**The Solution:**
Using a module-level variable to persist across component remounts.

**Code:**
```typescript
// Module-level (outside component) - persists across remounts
let hasStartedVerification = false;

const ThankYouPage: React.FC = () => {
  useEffect(() => {
    if (hasStartedVerification) return;  // Guard check
    hasStartedVerification = true;        // Set flag
    setTimeout(handleCompleteVerification, 1000);
  }, []);
}
```

**Why Module-Level Works:**
- **Persists across remounts:** Variable lives outside component lifecycle
- **First mount:** Flag is `false` → sets to `true` → API calls execute
- **Second mount (StrictMode):** Flag is still `true` → early return → API calls skipped

**Why useRef Doesn't Work:**
```typescript
// ❌ INSIDE COMPONENT - doesn't persist across remounts
const ThankYouPage: React.FC = () => {
  const hasStartedRef = useRef(false);
  
  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    setTimeout(handleCompleteVerification, 1000);
  }, []);
}
```

**What happens:**
- **First mount:** `useRef(false)` creates ref → sets to `true` → API calls execute
- **Component unmounts:** Ref is destroyed
- **Second mount:** `useRef(false)` creates NEW ref → value is `false` again → API calls execute AGAIN ❌

**Key Differences:**

| Location | Persists Across Re-renders? | Persists Across Remounts? | Works for Guard? |
|----------|----------------------------|---------------------------|------------------|
| Module-level variable | ✅ Yes | ✅ Yes | ✅ Yes |
| `useRef` inside component | ✅ Yes | ❌ No | ❌ No |
| `useState` inside component | ✅ Yes | ❌ No | ❌ No |

**When to Use Each:**
- **Module-level:** Prevent duplicate operations across remounts (like API calls)
- **useRef:** Store mutable values that persist across re-renders (same mount)
- **useState:** Store values that trigger re-renders when changed

**Summary:**
- `useRef` persists across re-renders, NOT across remounts
- In StrictMode, component unmounts and remounts → ref is recreated
- Module-level variable persists across remounts → guard works correctly

---

### 10. Hooks vs Simple Utilities: When to Use Which

**Location:** `src/utils/hooks/` vs `src/utils/`

**The Question:**
What's the difference between React hooks in `utils/hooks/` and simple utility functions in `utils/`? When should I use each?

**The Answer:**

#### Simple Utility Files (`utils/`)

**Examples:** `session.ts`, `camera.ts`

**Characteristics:**
- ✅ **Plain functions** - No React dependencies
- ✅ **Can be called anywhere** - In components, callbacks, utilities, even outside React
- ❌ **No state management** - Pure functions or simple operations
- ❌ **No React lifecycle** - No automatic re-runs or side effects

**Example from `session.ts`:**
```typescript
export const validateSession = (): string => {
  const sessionId = localStorage.getItem('session_id');
  if (!sessionId) {
    throw new Error('Session not found. Please start the verification process again.');
  }
  return sessionId;
};
```

**Usage:**
- Can be called directly: `validateSession()`
- Can be used in any function, callback, or utility
- No React context needed

---

#### React Hooks (`utils/hooks/`)

**Examples:** `useSessionValidation.ts`, `useCameraCapture.ts`

**Characteristics:**
- ✅ **Uses React hooks** - `useState`, `useEffect`, `useRef`, `useNavigate`, etc.
- ❌ **Only in React components or hooks** - Must follow Rules of Hooks
- ✅ **Manages state** - Tracks values that trigger re-renders
- ✅ **React lifecycle** - Can run effects on mount, updates, cleanup, etc.

**Example from `useSessionValidation.ts`:**
```typescript
export const useSessionValidation = () => {
  const navigate = useNavigate(); // React hook
  
  useEffect(() => { // React lifecycle
    const sessionId = getSessionId();
    if (!sessionId) {
      navigate('/'); // React routing
    }
  }, [navigate]);
  
  return { getSessionId, validateSession };
};
```

**Usage:**
- Must be called at top level of component: `useSessionValidation()`
- Runs on mount and can trigger re-renders/navigation
- Provides reactive behavior tied to component lifecycle

**Example from `useCameraCapture.ts`:**
```typescript
export const useCameraCapture = () => {
  const [isCameraReady, setIsCameraReady] = useState(false); // State
  const videoRef = useRef<HTMLVideoElement>(null); // Ref
  
  useEffect(() => { // Side effects
    // Attach stream to video...
  });
  
  return { videoRef, isCameraReady, startCamera, stopCamera };
};
```

- ✅ Manages React state and refs
- ✅ Provides reactive values that update components

---

#### Comparison Table

| Feature | Simple Utilities (`utils/`) | React Hooks (`utils/hooks/`) |
|---------|----------------------------|------------------------------|
| React dependency | ❌ None | ✅ Uses React hooks |
| Where to use | ✅ Anywhere | ❌ Only in components/hooks |
| State management | ❌ No | ✅ Yes (useState, useRef) |
| Lifecycle | ❌ No | ✅ Yes (useEffect) |
| Re-renders | ❌ No | ✅ Can trigger re-renders |
| Examples | `validateSession()`, `capturePhotoFromVideo()` | `useCameraCapture()`, `useSessionValidation()` |

---

#### When to Use Which?

**Use Simple Utilities (`utils/`) when:**
- ✅ Logic doesn't need React state/lifecycle
- ✅ You want to use it outside React (callbacks, utilities)
- ✅ It's a pure function or simple operation
- ✅ No side effects or state needed

**Examples:**
- `validateSession()` - Just checks localStorage
- `getSessionId()` - Just returns a value
- `capturePhotoFromVideo()` - Pure function, no state needed

**Use React Hooks (`utils/hooks/`) when:**
- ✅ You need React state (`useState`)
- ✅ You need side effects (`useEffect`)
- ✅ You need refs (`useRef`)
- ✅ You need navigation (`useNavigate`)
- ✅ Logic is tied to component lifecycle
- ✅ You need to trigger re-renders

**Examples:**
- `useCameraCapture()` - Manages camera state, stream, video ref, and photo capture
- `useSessionValidation()` - Auto-validates on mount and redirects if missing

---

#### Project Structure

```
src/utils/
├── session.ts              ← Simple utility (no React)
│   ├── getSessionId()
│   └── validateSession()
│
├── camera.ts               ← Simple utility (no React)
│   └── capturePhotoFromVideo()
│
└── hooks/                  ← React hooks
    ├── useSessionValidation.ts  ← Uses React (useEffect, useNavigate)
    └── useCameraCapture.ts      ← Uses React (useState, useRef, useEffect)
```

---

#### Key Takeaway

**Simple utilities = "Just functions, no React magic"**
- Call them anywhere
- No React needed
- Simple and straightforward

**React hooks = "React-aware logic"**
- Only in components/hooks
- Manages state and lifecycle
- Reactive and integrated with React

**Best Practice:**
- Keep utilities simple and React-free when possible
- Use hooks only when you need React features (state, lifecycle, refs)
- This makes code more flexible and testable

---

### 11. PAN Stream Recording Flow: How Session Recording Works

**Location:** `src/pages/PanPage/hook.ts` and `src/services/sessionRecording/context.tsx` and `src/components/RecordingIndicator.tsx`

**The Complete Flow:**

#### Overview
When the PAN page loads, it automatically starts a session recording stream (front camera + microphone) for audit purposes. This is separate from the PAN card image capture which uses the back camera.

#### Step-by-Step Flow:

**1. Pan Page Creates Stream and Passes to Context**
```typescript
// In PanPage/hook.ts (lines 52-56)
const recordingStream = await navigator.mediaDevices.getUserMedia({
  video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
  audio: true,
});
startRecording(recordingStream);  // Pass stream to context
```
- PanPage creates a MediaStream using `getUserMedia()`
- Stream contains: front camera video track + audio track
- Stream is passed to context's `startRecording()` function

**2. Context Updates Stream useState**
```typescript
// In context.tsx (line 46)
setRecordingStream(stream);  // State update triggers re-render
```
- Context receives the stream from PanPage
- Calls `setRecordingStream(stream)` to store it in state
- State changes from `null` → `MediaStream` object
- React detects the state change and prepares to re-render

**3. useState Causes Preview to Refresh and Show Stream**

This is the React reactive flow:

**3a. Context Re-renders and Provides New Value:**
```typescript
// In context.tsx (line 198)
value={{
  isSessionRecording,
  recordingStream,  // ← New value provided
  ...
}}
```

**3b. RecordingIndicator Subscribes via Hook:**
```typescript
// In RecordingIndicator.tsx (line 5)
const { isSessionRecording, recordingStream } = useSessionRecording();
```
- RecordingIndicator calls `useSessionRecording()` hook
- Receives the updated `recordingStream` value from context

**3c. Component Re-renders:**
- Because `recordingStream` changed, React re-renders RecordingIndicator component
- This is React's reactive system: state change → re-render

**3d. useEffect Runs (Dependency Changed):**
```typescript
// In RecordingIndicator.tsx (lines 8-25)
useEffect(() => {
  if (videoRef.current && recordingStream) {
    if (videoRef.current.srcObject !== recordingStream) {
      videoRef.current.srcObject = recordingStream;  // Attach stream to video
    }
    
    // Ensure video plays automatically
    if (videoRef.current.paused) {
      videoRef.current.play().catch((err) => {
        console.error('Error playing recording preview:', err);
      });
    }
  } else if (videoRef.current && !recordingStream) {
    // Clear video element when stream is removed
    videoRef.current.srcObject = null;
    videoRef.current.pause();
  }
}, [recordingStream]);  // ← Runs because recordingStream changed
```
- `useEffect` has `recordingStream` in its dependency array
- Since `recordingStream` changed, the effect runs
- Sets `videoRef.current.srcObject = recordingStream`
- Video element now displays the live preview

**3e. Preview Shows Live Video:**
- Video element automatically plays the stream
- User sees live video preview in RecordingIndicator component

**4. mediaRecorderRef Records in Background and Chunks are Collected**

While the preview shows, recording happens silently in the background:

```typescript
// In context.tsx (lines 49-58)
const mediaRecorder = new MediaRecorder(stream);
mediaRecorder.ondataavailable = (event) => {
  if (event.data && event.data.size > 0) {
    chunksRef.current.push(event.data);  // Collect chunks silently
  }
};
mediaRecorderRef.current = mediaRecorder;
mediaRecorder.start(1000);  // Collect data every 1 second
```

**What happens:**
- `MediaRecorder` is created with the stream (line 49)
- Stored in `mediaRecorderRef.current` (line 57) - **ref doesn't trigger re-renders**
- Recording starts with `mediaRecorder.start(1000)` (line 58)
- Every 1 second, `ondataavailable` event fires
- Each chunk (1 second of video+audio) is pushed to `chunksRef.current` array
- This happens silently - **no UI updates** because refs don't trigger re-renders

**Background Process:**
```
Every 1 second:
  → MediaRecorder captures 1 second of video+audio
  → ondataavailable event fires
  → chunksRef.current.push(chunk)
  → Array grows: [chunk1, chunk2, chunk3, ...]
  → Continues until stopped...
```

**Later When Stopped:**
```typescript
// In context.tsx (lines 90-92)
const finalChunks = [...chunksRef.current];  // All chunks
const blob = new Blob(finalChunks, { type: 'video/webm' });
// Now you have the complete video file!
```
- All chunks are combined into a single Blob
- Blob is a complete WebM video file
- Ready to upload to backend

---

#### Visual Flow Diagram:

```
┌─────────────────────────────────────────────────────────┐
│ 1. PanPage: getUserMedia() → stream                    │
│    - Front camera + microphone                          │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 2. PanPage: startRecording(stream)                      │
│    - Passes stream to context                           │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Context: setRecordingStream(stream)                  │
│    - State changes: null → MediaStream                  │
│    - React detects change → re-render                   │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Context: Provides new value to subscribers           │
│    - { recordingStream: MediaStream, ... }              │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 5. RecordingIndicator: Receives updated stream          │
│    - useSessionRecording() returns new stream           │
│    - Component re-renders                               │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 6. RecordingIndicator: useEffect runs                   │
│    - [recordingStream] dependency changed               │
│    - Sets video.srcObject = recordingStream             │
│    - Video element shows live preview ✅                │
└─────────────────────────────────────────────────────────┘

[Parallel - Background Process]

┌─────────────────────────────────────────────────────────┐
│ 7. Context: MediaRecorder starts in background          │
│    - mediaRecorderRef.current = new MediaRecorder()    │
│    - mediaRecorder.start(1000)                          │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 8. Every 1 second (background loop):                    │
│    - ondataavailable fires                              │
│    - chunksRef.current.push(chunk)                      │
│    - [chunk1, chunk2, chunk3, ...] (silent collection) │
│    - Continues until stopped...                         │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 9. Later: stopRecording() called                        │
│    - Stop MediaRecorder                                 │
│    - Stop stream tracks (camera/mic)                    │
│    - Combine all chunks → Blob                          │
│    - Ready to upload ✅                                 │
└─────────────────────────────────────────────────────────┘
```

---

#### Key Concepts Explained:

**State vs Refs - What Triggers UI Updates:**

| Storage | React Tracks? | Triggers Re-render? | Use Case |
|---------|--------------|---------------------|----------|
| `useState` | ✅ Yes | ✅ Yes | `recordingStream` - needs to update UI |
| `useRef` | ❌ No | ❌ No | `mediaRecorderRef`, `chunksRef` - background process |

**Why This Design:**

1. **State (`recordingStream`):** 
   - User needs to **see** the preview → requires UI updates
   - Components need to **react** to stream changes → requires re-renders
   - React tracks state changes → triggers re-renders automatically

2. **Refs (`mediaRecorderRef`, `chunksRef`):**
   - Recording happens in **background** → no UI updates needed
   - Chunks collected **silently** → don't need to re-render on each chunk
   - React doesn't track refs → no re-renders (better performance)

**The React Reactive Chain:**

```
State Change → Context Re-renders → Components Re-render → useEffect Runs → DOM Updates → User Sees Preview
```

**Why useEffect Runs:**
- `recordingStream` is in the dependency array: `[recordingStream]`
- When `recordingStream` changes, React knows to run the effect again
- This is how React synchronizes side effects (DOM updates) with state changes

---

#### Summary:

**Your Understanding is Correct:**
1. ✅ PanPage creates stream → passes to context
2. ✅ Context stores stream in state → React detects change
3. ✅ State change → RecordingIndicator re-renders → useEffect runs → preview shows
4. ✅ MediaRecorder runs in background → chunks collected silently every second

**Key Takeaways:**
- **State** = What React tracks → triggers UI updates (for preview)
- **Refs** = What React doesn't track → no UI updates (for background recording)
- **useEffect dependencies** = When to run side effects (when stream changes)
- **Context propagation** = State change flows through Provider to all consumers

This is a perfect example of React's reactive system in action!

---

### 12. PAN Card Upload Options Modal Flow

**Location:** `src/pages/PanPage/hook.ts` (lines 132-160) and `src/pages/PanPage/main.tsx` (lines 327-392)

**Overview:**
When users want to add a PAN card image (front or back), they can choose between two methods: taking a photo with the camera or uploading a file from their device. This flow manages the modal that presents these options and handles the user's choice.

#### The Three Functions

**1. `openUploadOptions(side: 'front' | 'back')`** (lines 135-139)

**Purpose:** Opens the upload options modal for a specific side (front or back).

**What it does:**
```typescript
const openUploadOptions = (side: 'front' | 'back') => {
  setActiveSide(side);        // Sets which side is being edited ('front' or 'back')
  setUploadError(null);       // Clears any previous upload errors
  setCameraError(null);       // Clears any camera errors
};
```

**When it's called:**
- User clicks on empty front/back card area (line 104, 185 in main.tsx)
- User clicks "Change" button on existing image (line 118, 199 in main.tsx)

**Result:** Modal appears showing two options: "Take Photo" or "Upload File"

**Key Point:** The modal is controlled by `activeSide` state. When `activeSide !== null`, the modal is visible:
```typescript
// In main.tsx (line 328)
{activeSide && !isCameraOpen && (
  // Modal JSX here
)}
```

---

**2. `selectUploadMode(mode: 'camera' | 'file')`** (lines 144-150)

**Purpose:** Handles the user's choice between camera capture or file upload.

**What it does:**
```typescript
const selectUploadMode = (mode: 'camera' | 'file') => {
  if (mode === 'camera') {
    startCameraForCapture();  // Opens back camera for document capture
  } else if (mode === 'file') {
    fileInputRef.current?.click();  // Triggers hidden file input
  }
};
```

**When it's called:**
- User clicks "Take Photo" button in modal (line 339 in main.tsx)
- User clicks "Upload File" button in modal (line 365 in main.tsx)

**What happens:**
- If `mode === 'camera'`: Opens the camera modal with back camera (`facingMode: 'environment'`)
- If `mode === 'file'`: Programmatically clicks the hidden file input, opening browser file picker

**Result:**
- Camera path: Camera modal opens, user can capture photo
- File path: Browser file picker opens, user can select image from device

---

**3. `closeUploadOptions()`** (lines 155-160)

**Purpose:** Closes the upload options modal and resets all related state.

**What it does:**
```typescript
const closeUploadOptions = () => {
  stopCamera();           // Stops any active camera stream
  setActiveSide(null);    // Closes modal (modal only shows when activeSide !== null)
  setUploadError(null);   // Clears upload errors
  setCameraError(null);   // Clears camera errors
};
```

**When it's called:**
- User clicks outside modal (backdrop click) (line 330 in main.tsx)
- User clicks "Cancel" button (line 386 in main.tsx)
- User clicks close button on camera modal (line 432 in main.tsx)

**Result:** Modal closes, state is reset, camera is stopped (if running)

**Key Point:** Setting `activeSide` to `null` causes the modal to disappear because of conditional rendering.

---

#### Complete User Flow

**Step 1: User Initiates Upload**

```
User clicks on empty PAN card area (front or back)
  ↓
openUploadOptions('front') or openUploadOptions('back')
  ↓
State changes:
  - activeSide = 'front' or 'back'
  - uploadError = null
  - cameraError = null
  ↓
Modal appears (because activeSide !== null)
```

**Step 2: User Chooses Upload Method**

```
Modal shows two options:
  1. "Take Photo" button
  2. "Upload File" button
  ↓
User clicks one:
  ↓
  Option A: Click "Take Photo"
    → selectUploadMode('camera')
    → startCameraForCapture()
    → Opens camera modal with back camera
    → User can capture photo
  
  Option B: Click "Upload File"
    → selectUploadMode('file')
    → fileInputRef.current?.click()
    → Browser file picker opens
    → User selects image from device
```

**Step 3: User Completes or Cancels**

```
Option A: User completes capture/upload
  ↓
  - Image captured/uploaded
  - Image stored in panImages state
  - activeSide set to null (automatically closes modal)
  - Preview shows uploaded image

Option B: User cancels
  ↓
  - User clicks outside modal OR clicks Cancel
  → closeUploadOptions()
  → stopCamera() (if running)
  → setActiveSide(null) (modal closes)
  → setUploadError(null)
  → setCameraError(null)
  → State reset, modal closed
```

---

#### Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│ Step 1: User Clicks Empty Card Area                    │
│   onClick={() => openUploadOptions('front')}           │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ openUploadOptions('front')                              │
│   - setActiveSide('front')                              │
│   - setUploadError(null)                                │
│   - setCameraError(null)                                │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ Modal Appears (activeSide !== null)                    │
│   Shows:                                                │
│   - "Take Photo" button                                 │
│   - "Upload File" button                                │
│   - "Cancel" button                                     │
└─────────────────────────────────────────────────────────┘
                    ↓
        ┌───────────┴───────────┐
        │                       │
        ↓                       ↓
┌───────────────┐     ┌─────────────────────┐
│ Option A:     │     │ Option B:           │
│ Take Photo    │     │ Upload File         │
└───────────────┘     └─────────────────────┘
        │                       │
        ↓                       ↓
┌───────────────┐     ┌─────────────────────┐
│ selectUpload  │     │ selectUpload        │
│ Mode('camera')│     │ Mode('file')        │
└───────────────┘     └─────────────────────┘
        │                       │
        ↓                       ↓
┌───────────────┐     ┌─────────────────────┐
│ startCamera   │     │ fileInputRef        │
│ ForCapture()  │     │ .current?.click()   │
└───────────────┘     └─────────────────────┘
        │                       │
        ↓                       ↓
┌───────────────┐     ┌─────────────────────┐
│ Camera Modal  │     │ Browser File        │
│ Opens         │     │ Picker Opens        │
└───────────────┘     └─────────────────────┘
        │                       │
        ↓                       ↓
┌─────────────────────────────────────────────────────────┐
│ User Captures/Selects Image                             │
│   - Image stored in panImages state                     │
│   - activeSide set to null (modal closes)               │
│   - Preview shows uploaded image                        │
└─────────────────────────────────────────────────────────┘

[If User Cancels Instead]

┌─────────────────────────────────────────────────────────┐
│ User Clicks Cancel or Outside Modal                    │
│   closeUploadOptions()                                  │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ State Reset:                                            │
│   - stopCamera()                                        │
│   - setActiveSide(null) → Modal closes                 │
│   - setUploadError(null)                                │
│   - setCameraError(null)                                │
└─────────────────────────────────────────────────────────┘
```

---

#### Key Concepts

**1. Modal State Management**

The modal visibility is controlled by `activeSide` state:
```typescript
// Modal only shows when activeSide is not null
{activeSide && !isCameraOpen && (
  <div>Modal Content</div>
)}
```

**Why this works:**
- When `activeSide = null` → Modal doesn't render (hidden)
- When `activeSide = 'front'` or `'back'` → Modal renders (visible)
- This is React's conditional rendering pattern

**2. Side Tracking**

`activeSide` serves dual purpose:
- Controls modal visibility
- Tracks which side (front/back) is being edited
- Used when storing image: `setPanImages((prev) => ({ ...prev, [activeSide]: imageData }))`

**3. Error Cleanup**

All three functions clear errors:
- `openUploadOptions`: Clears errors when opening modal (fresh start)
- `closeUploadOptions`: Clears errors when closing modal (clean state)

This ensures users don't see stale error messages from previous attempts.

**4. Camera Lifecycle**

- `selectUploadMode('camera')`: Starts camera
- `closeUploadOptions()`: Stops camera if running
- Prevents camera from staying on after modal is closed

**5. File Input Trigger**

Instead of using a visible file input, the code uses a hidden one:
```typescript
<input
  type="file"
  ref={fileInputRef}
  className="hidden"  // Hidden from view
  onChange={handlePanImageFileUpload}
/>
```

And programmatically triggers it:
```typescript
fileInputRef.current?.click();  // Opens file picker
```

This provides better UX control - you can customize the button appearance while still using native file picker.

---

#### Complete Code Flow Example

**Scenario: User uploads front side image via file upload**

```typescript
// 1. User clicks empty front card area
onClick={() => openUploadOptions('front')}

// 2. openUploadOptions runs
setActiveSide('front')     // State: activeSide = 'front'
setUploadError(null)
setCameraError(null)

// 3. React re-renders, modal appears (activeSide !== null)
{activeSide && !isCameraOpen && <Modal />}

// 4. User clicks "Upload File" button
onClick={() => selectUploadMode('file')}

// 5. selectUploadMode runs
fileInputRef.current?.click()  // Browser file picker opens

// 6. User selects file, onChange fires
onChange={handlePanImageFileUpload}

// 7. handlePanImageFileUpload runs
// - Converts file to base64
// - Stores in state:
setPanImages((prev) => ({ ...prev, front: imageData }))
setActiveSide(null)  // Modal closes (activeSide is null now)

// 8. React re-renders, modal disappears, image preview shows
```

---

#### Summary

**The Three Functions Work Together:**

1. **`openUploadOptions`** → Opens modal, sets which side is being edited
2. **`selectUploadMode`** → Routes user to camera or file upload path
3. **`closeUploadOptions`** → Closes modal, cleans up state, stops camera

**Key Patterns:**

- **Conditional rendering** for modal visibility (`activeSide !== null`)
- **State-driven UI** (modal appearance controlled by state)
- **Programmatic file input** (hidden input, triggered via ref)
- **Error cleanup** at every step for better UX
- **Camera lifecycle management** (start/stop properly)

**User Experience Flow:**

1. Click card area → Modal appears
2. Choose method → Camera opens OR file picker opens
3. Complete or cancel → Image stored OR modal closed
4. State reset → Ready for next action

This provides a smooth, intuitive workflow for adding PAN card images!

---

### 13. isCameraOpen vs isCameraReady: Two Different States for Camera UI

**Location:** `src/pages/PanPage/hook.ts` (lines 23-24) and `src/pages/SelfiePage/hook.ts` (lines 17-18)

**The Question:**
Why do we need both `isCameraOpen` and `isCameraReady`? Can't we just use one?

**The Answer:**

Both are needed because they serve **different purposes** and are set at **different times** during the camera initialization process.

---

#### What Each State Controls

| Variable | Purpose | When It's `true` | Controls |
|----------|---------|------------------|----------|
| `isCameraOpen` | **UI State** - Modal visibility | User opens camera modal | Whether camera modal is visible on screen |
| `isCameraReady` | **Technical State** - Stream readiness | Stream metadata loaded | Whether camera stream is actually working |

---

#### Timeline of Events

```
User clicks "Capture Photo"
         ↓
setIsCameraOpen(true)  ← Modal appears IMMEDIATELY
         ↓
[Modal is visible, but camera is loading...]
         ↓
Stream attaches to video element
         ↓
Stream loads metadata...
         ↓
onloadedmetadata event fires
         ↓
setIsCameraReady(true)  ← Camera is ready NOW
```

**The Critical Gap:**
There's a time gap where:
- `isCameraOpen = true` (modal is visible)
- `isCameraReady = false` (stream is still loading)

This gap is essential for good UX!

---

#### What Each State Is Used For

**`isCameraOpen` controls:**

1. **Modal visibility:**
   ```typescript
   {isCameraOpen && (
     <div className="fixed inset-0 z-50 bg-black">
       <video ref={videoRef} />
       {/* Camera UI */}
     </div>
   )}
   ```
   - `true` = Modal is visible
   - `false` = Modal is hidden

2. **Showing other modals conditionally:**
   ```typescript
   {activeSide && !isCameraOpen && (
     <div>Upload Options Modal</div>  // Only show when camera is NOT open
   )}
   ```

**`isCameraReady` controls:**

1. **Loading spinner:**
   ```typescript
   {!isCameraReady && (
     <div>Loading spinner...</div>  // Show while loading
   )}
   ```

2. **Camera guides/overlays:**
   ```typescript
   {isCameraReady && (
     <div>Position your PAN card here</div>  // Only show when camera works
   )}
   ```

3. **Capture button state:**
   ```typescript
   <button
     onClick={capturePhoto}
     disabled={!isCameraReady}  // Can't capture until ready
   >
   ```

---

#### Why Both Are Needed

**If you remove `isCameraOpen`:**
- ❌ **Problem:** No way to show the modal before the stream is ready
- ❌ **Result:** Modal would only appear after stream loads (delayed UX)
- ❌ **User experience:** User clicks button → nothing happens → then modal appears (confusing)

**If you remove `isCameraReady`:**
- ❌ **Problem:** Can't distinguish "modal open but loading" vs "modal open and ready"
- ❌ **Result:** Can't show loading state or disable buttons properly
- ❌ **User experience:** User might try to capture before camera is ready → errors or blank images

---

#### Real-World Analogy

Think of it like opening a camera app on your phone:

- **`isCameraOpen = false`:** Camera app is closed
- **`isCameraOpen = true`:** Camera app is open (but camera might still be starting up)
- **`isCameraReady = true`:** Camera is actually on and showing video

You need to know both:
- Is the app open? (`isCameraOpen`)
- Is the camera actually working? (`isCameraReady`)

---

#### Code Example

```typescript
// In hook.ts
const [isCameraOpen, setIsCameraOpen] = useState(false);
const [isCameraReady, setIsCameraReady] = useState(false);

const startCameraForCapture = async () => {
  // ... create stream ...
  
  setIsCameraOpen(true);  // Show modal immediately
  
  if (videoRef.current) {
    videoRef.current.srcObject = stream;
    videoRef.current.onloadedmetadata = () => {
      setIsCameraReady(true);  // Stream is ready now
    };
  }
};

// In main.tsx
{isCameraOpen && (
  <div className="camera-modal">
    {/* Show loading while camera initializes */}
    {!isCameraReady && <LoadingSpinner />}
    
    {/* Show camera feed when ready */}
    {isCameraReady && <CameraGuide />}
    
    {/* Disable button until ready */}
    <button disabled={!isCameraReady} onClick={capturePhoto}>
      Capture
    </button>
  </div>
)}
```

---

#### Could You Combine Them?

**Theoretical alternative:**
You could use a single state with 3 values:
```typescript
const [cameraState, setCameraState] = useState<'closed' | 'loading' | 'ready'>('closed');
```

**Why this is worse:**
- ❌ Less clear and harder to read
- ❌ More complex conditional logic
- ❌ Two boolean states are more intuitive
- ❌ Each state has a clear, single purpose

**Best practice:**
- Keep them separate for clarity
- Each state has a distinct purpose
- Easier to understand and maintain

---

#### Summary

**Both states are essential:**

- **`isCameraOpen`** = UI state (modal visibility)
  - Set to `true` when user opens camera
  - Set to `false` when camera closes
  - Controls whether modal is visible

- **`isCameraReady`** = Technical state (stream readiness)
  - Set to `true` when `onloadedmetadata` fires
  - Set to `false` when camera closes
  - Controls loading states, button enabling, and guides

**They work together to provide:**
- ✅ Immediate modal appearance (good UX)
- ✅ Proper loading states (user knows what's happening)
- ✅ Disabled buttons until ready (prevents errors)
- ✅ Smooth camera initialization experience

**Key Takeaway:**
Don't try to combine them - they serve different purposes and are set at different times. Having both provides better control and user experience!

---

### 14. Video Watermarking Process: Parallel Processing Flow

**Location:** `src/utils/watermark.ts` (lines 119-280)

**Overview:**
The `watermarkVideo` function takes an original video blob, adds a timestamp and location watermark to each frame, preserves the original audio, and returns a new watermarked video blob. The process uses parallel processing to handle video frames and audio simultaneously.

**Parallel Processing Diagram:**

```
┌─────────────────────────────────────────────────────────────┐
│                    ORIGINAL VIDEO BLOB                      │
│                         (Input)                             │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Video Element  │
                    │  (Plays video)  │
                    └────────┬────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
    ┌───────────────────┐    ┌──────────────────────┐
    │  VIDEO FRAMES     │    │  AUDIO TRACK        │
    │  (Visual data)    │    │  (Sound data)       │
    └──────────┬────────┘    └──────────┬───────────┘
               │                        │
               ▼                        ▼
    ┌───────────────────┐    ┌──────────────────────┐
    │  Canvas           │    │  AudioContext        │
    │  • Draw frame     │    │  • Capture audio     │
    │  • Add watermark  │    │  • Create stream     │
    └──────────┬────────┘    └──────────┬───────────┘
               │                        │
               ▼                        ▼
    ┌───────────────────┐    ┌──────────────────────┐
    │  Canvas Stream   │    │  Audio Stream        │
    │  (Watermarked)    │    │  (Original audio)    │
    └──────────┬────────┘    └──────────┬───────────┘
               │                        │
               └────────────┬───────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │  COMBINED STREAM       │
                │  (Video + Audio)      │
                └───────────┬────────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │  MediaRecorder         │
                │  (Records stream)      │
                └───────────┬────────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │  Collect Chunks       │
                │  (Every 200ms)        │
                └───────────┬────────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │  Combine Chunks       │
                │  → Final Blob         │
                └───────────┬────────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │  WATERMARKED BLOB     │
                │  (Video + Audio)      │
                └───────────────────────┘
```

**Key Steps Explained:**

1. **Original Video Blob (Input):** The function receives a video blob containing both video and audio data.

2. **Video Element:** The blob is loaded into an off-screen video element using `URL.createObjectURL()`. This element is muted to prevent audio playback through speakers.

3. **Parallel Extraction:**
   - **Video Frames:** Each frame is drawn to a canvas where the watermark is added
   - **Audio Track:** The audio is captured from the video element using Web Audio API (`createMediaElementSource`)

4. **Stream Creation:**
   - **Canvas Stream:** The watermarked canvas frames are captured as a video stream using `canvas.captureStream(15)` (15 FPS)
   - **Audio Stream:** The audio is routed through `AudioContext` to create an audio stream

5. **Combined Stream:** Both streams are merged into a single `MediaStream` containing watermarked video tracks and original audio tracks.

6. **MediaRecorder:** Records the combined stream, collecting chunks every 200ms.

7. **Chunk Collection:** Each chunk (200ms of video+audio) is stored in an array.

8. **Final Blob:** When recording stops, all chunks are combined into a single watermarked video blob with audio intact.

**Why Parallel Processing?**

- **Efficiency:** Video frames and audio are processed simultaneously, not sequentially
- **Audio Preservation:** Audio is captured directly from the original video element, ensuring it remains intact
- **Real-time Processing:** As the video plays, frames are watermarked and recorded in real-time

**Key Technical Details:**

- **Video Element:** Must be played (`video.play()`) to extract frames and audio
- **Canvas:** Used to draw each frame and overlay the watermark text
- **Web Audio API:** Captures audio from the video element without playing it through speakers
- **MediaRecorder:** Records the combined stream at 15 FPS with original audio quality
- **Chunk Size:** 200ms chunks provide a good balance between file size and processing efficiency

**Why Video Playback is Required:**

The video element must play the video to:
- Extract individual frames for watermarking
- Capture the audio track through Web Audio API
- Trigger the `onplay` event to start MediaRecorder
- Provide continuous frame data to the canvas

Without playback, the video element would just be a static blob - we need it to "decode" and "play" the video to access its frames and audio.

---

### 15. Why `isDrawing` Flag is Required in Real-Time Video Watermarking

**Location:** `src/utils/watermark.ts` (lines 170-200, 214-217, 232-235)

**Overview:**
The `isDrawing` flag is a boolean that controls the `requestAnimationFrame` drawing loop in the `watermarkStream` function. It serves two critical purposes: preventing duplicate loops and ensuring clean shutdown.

---

#### Scenario 1: Preventing Multiple Drawing Loops

**The Problem:**
The `video.onloadedmetadata` event can fire multiple times due to:
- Stream changes or reconnections
- Browser quirks or timing issues
- Multiple metadata updates

**What Happens Without `isDrawing`:**
```typescript
// First time: onloadedmetadata fires
drawFrame(); // Starts Loop 1 ✅

// Second time: onloadedmetadata fires again (unexpected!)
drawFrame(); // Starts Loop 2 ❌ (duplicate!)

// Third time: onloadedmetadata fires again
drawFrame(); // Starts Loop 3 ❌ (another duplicate!)

// Result: 3 loops all drawing simultaneously = wasted CPU + flickering
```

**How `isDrawing` Fixes It:**
```typescript
if (!isDrawing) {  // Only start if NOT already drawing
  isDrawing = true;  // Mark as "drawing in progress"
  drawFrame();  // Start the loop
}
```

**Flow:**
```
First call: isDrawing = false → starts loop → sets isDrawing = true ✅
Second call: isDrawing = true → skips starting new loop ✅
Third call: isDrawing = true → skips starting new loop ✅

Result: Only ONE loop running, no duplicates!
```

**Key Point:** The check `if (!isDrawing)` prevents multiple loops from starting, even if `onloadedmetadata` fires multiple times.

---

#### Scenario 2: Stopping the Loop When Stream Ends

**The Problem:**
When the watermarked video track stops (e.g., recording ends, stream closes), the cleanup function sets `video.srcObject = null`. However, the `requestAnimationFrame` loop continues running in the background, wasting CPU cycles.

**What Happens Without Stopping the Loop:**
```typescript
// Stream stops
video.srcObject = null; // Video stops ✅

// BUT: requestAnimationFrame loop is still running! ❌
// Loop keeps calling drawFrame() every ~16ms:
drawFrame() → checks video.readyState → fails → does nothing
drawFrame() → checks video.readyState → fails → does nothing
drawFrame() → checks video.readyState → fails → does nothing
// ... continues forever, wasting CPU!
```

**How `isDrawing` Fixes It:**
```typescript
// In cleanup function
watermarkedVideoTrack.stop = () => {
  isDrawing = false; // Stop the loop ✅
  video.srcObject = null;
  originalStop();
};

// In drawFrame()
if (isDrawing) {  // Only continue if flag is true
  requestAnimationFrame(drawFrame);
}
// When isDrawing = false, loop stops scheduling new frames
```

**Flow:**
```
Stream stops → cleanup function runs
  ↓
isDrawing = false (stops the loop)
  ↓
Next drawFrame() call checks: if (isDrawing) → false
  ↓
Doesn't call requestAnimationFrame()
  ↓
Loop stops ✅ (no more wasted CPU)
```

**Key Point:** Setting `isDrawing = false` in the cleanup function ensures the loop stops when the stream ends, preventing wasted CPU cycles.

---

#### Simple Analogy

Think of `isDrawing` like a light switch:
- **`isDrawing = true`** = Light is ON (loop is running)
- **`isDrawing = false`** = Light is OFF (loop is stopped)

**Without the switch:**
- ❌ You can't turn the light off (loop keeps running forever)
- ❌ Multiple people can turn it on (multiple loops start)

**With the switch:**
- ✅ You can control when it's on/off
- ✅ Only one person can turn it on (prevents duplicates)
- ✅ You can turn it off when done (clean shutdown)

---

#### Code Implementation

**Starting the Loop:**
```typescript
video.onloadedmetadata = async () => {
  // ... setup code ...
  
  if (!isDrawing) {  // Prevent duplicates
    isDrawing = true;  // Mark as active
    drawFrame();  // Start the loop
  }
};
```

**Controlling the Loop:**
```typescript
const drawFrame = () => {
  // ... draw watermark ...
  
  if (isDrawing) {  // Only continue if flag is true
    requestAnimationFrame(drawFrame);  // Schedule next frame
  }
  // If isDrawing = false, loop stops here
};
```

**Stopping the Loop:**
```typescript
watermarkedVideoTrack.stop = () => {
  isDrawing = false;  // Stop the loop
  video.srcObject = null;
  originalStop();
};
```

---

#### Summary

**`isDrawing` is required for:**

1. **Preventing Duplicate Loops:**
   - `onloadedmetadata` can fire multiple times
   - Without `isDrawing`, each call would start a new loop
   - Result: Multiple loops running simultaneously = wasted resources

2. **Clean Shutdown:**
   - When stream stops, cleanup sets `video.srcObject = null`
   - Without stopping `isDrawing`, the loop keeps running
   - Result: Loop continues checking frames forever = wasted CPU

**Without `isDrawing`:**
- ❌ Multiple loops can start
- ❌ Loop never stops (wastes CPU)
- ❌ No control over loop lifecycle

**With `isDrawing`:**
- ✅ Only one loop can run
- ✅ Loop stops cleanly when done
- ✅ Full control over loop lifecycle

This is a critical pattern for managing `requestAnimationFrame` loops in real-time video processing!

---
