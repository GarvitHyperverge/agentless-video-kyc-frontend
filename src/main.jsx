import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import './index.css'
import App from './App.jsx'
import { SessionRecordingProvider } from './services/sessionRecording/context'
import { store } from './store'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <SessionRecordingProvider>
        <App />
      </SessionRecordingProvider>
    </Provider>
  </StrictMode>,
)
