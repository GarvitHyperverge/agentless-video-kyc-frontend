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
- **Single source of truth:** All recording state lives in one place (isRecording, MediaRecorder, video chunks, blob)
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
   - Sets up state (isRecording, refs, etc.)
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
   if (!isRecording && !recordingStream) return null; // Hide component
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
   - State (`recordingStream`, `isRecording`) persists across navigation

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

**Examples:** `useSessionValidation.ts`, `useCamera.ts`

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

**Example from `useCamera.ts`:**
```typescript
export const useCamera = () => {
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
| Examples | `validateSession()`, `capturePhotoFromVideo()` | `useCamera()`, `useSessionValidation()` |

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
- `useCamera()` - Manages camera state, stream, and video ref
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
    └── useCamera.ts             ← Uses React (useState, useRef, useEffect)
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
