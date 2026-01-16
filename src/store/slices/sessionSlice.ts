import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SessionData {
  sessionUid?: string;
  panData?: {
    name?: string;
    panNumber?: string;
    dob?: string;
  };
  otpVerified?: boolean;
  selfieUploaded?: boolean;
  [key: string]: any;
}

interface SessionState {
  currentSession: SessionData | null;
  sessions: SessionData[];
  isLoading: boolean;
  error: string | null;
}

const initialState: SessionState = {
  currentSession: null,
  sessions: [],
  isLoading: false,
  error: null,
};

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setCurrentSession: (state, action: PayloadAction<SessionData | null>) => {
      state.currentSession = action.payload;
    },
    updateSessionData: (state, action: PayloadAction<Partial<SessionData>>) => {
      if (state.currentSession) {
        state.currentSession = { ...state.currentSession, ...action.payload };
      } else {
        state.currentSession = action.payload as SessionData;
      }
    },
    setSessions: (state, action: PayloadAction<SessionData[]>) => {
      state.sessions = action.payload;
    },
    addSession: (state, action: PayloadAction<SessionData>) => {
      state.sessions.push(action.payload);
    },
    updateSession: (state, action: PayloadAction<{ uid: string; data: Partial<SessionData> }>) => {
      const index = state.sessions.findIndex((s) => s.sessionUid === action.payload.uid);
      if (index !== -1) {
        state.sessions[index] = { ...state.sessions[index], ...action.payload.data };
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearSession: (state) => {
      state.currentSession = null;
      state.error = null;
    },
  },
});

export const {
  setCurrentSession,
  updateSessionData,
  setSessions,
  addSession,
  updateSession,
  setLoading,
  setError,
  clearSession,
} = sessionSlice.actions;
export default sessionSlice.reducer;
