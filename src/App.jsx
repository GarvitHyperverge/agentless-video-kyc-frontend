import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage/main';
import PanPage from './pages/PanPage/main';
import OtpPage from './pages/OtpPage/main';
import SelfiePage from './pages/SelfiePage/main';
import ThankYouPage from './pages/ThankYouPage/main';
import LoginPage from './pages/Login/main';
import SessionsListPage from './pages/AuditSessions/main';
import SessionDetailPage from './pages/AuditSessionDetail/main';
import RecordingIndicator from './components/RecordingIndicator';

function App() {
  return (
    <BrowserRouter>
      <RecordingIndicator />
      <Routes>
        {/* Root redirect to audit login */}
        <Route path="/" element={<Navigate to="/audit/login" replace />} />
        
        {/* Audit Login */}
        <Route path="/audit/login" element={<LoginPage />} />
        
        {/* User Verification Flow - Backend validates session via cookie */}
        <Route path="/verify" element={<LandingPage />} />
        <Route path="/verify/pan" element={<PanPage />} />
        <Route path="/verify/otp" element={<OtpPage />} />
        <Route path="/verify/selfie" element={<SelfiePage />} />
        <Route path="/verify/complete" element={<ThankYouPage />} />
        
        {/* Admin Audit Flow - Backend validates authentication via HTTP-only cookie */}
        <Route path="/audit/sessions" element={<SessionsListPage />} />
        <Route path="/audit/sessions/:sessionUid" element={<SessionDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
