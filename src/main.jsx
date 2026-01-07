import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { SessionRecordingProvider } from './services/sessionRecording/context'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SessionRecordingProvider>
      <App />
    </SessionRecordingProvider>
  </StrictMode>,
)
