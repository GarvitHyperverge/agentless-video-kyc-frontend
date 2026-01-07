import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage/main';
import PanPage from './pages/PanPage/main';
import OtpPage from './pages/OtpPage/main';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/:sessionId" element={<LandingPage />} />
        <Route path="/pan" element={<PanPage />} />
        <Route path="/otp" element={<OtpPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
