import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage/main';
import PanPage from './pages/PanPage/main';
import OtpPage from './pages/OtpPage/main';
import SelfiePage from './pages/SelfiePage/main';
import ThankYouPage from './pages/ThankYouPage/main';
import RecordingIndicator from './components/RecordingIndicator';

function App() {
  return (
    <BrowserRouter>
      <RecordingIndicator />
      <Routes>
        <Route path="/:sessionId" element={<LandingPage />} />
        <Route path="/pan" element={<PanPage />} />
        <Route path="/otp" element={<OtpPage />} />
        <Route path="/selfie" element={<SelfiePage />} />
        <Route path="/thank-you" element={<ThankYouPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
