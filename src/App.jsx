import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage/main';
import PanPage from './pages/PanPage/main';
import OtpPage from './pages/OtpPage/main';
import SelfiePage from './pages/SelfiePage/main';
import ThankYouPage from './pages/ThankYouPage/main';
import LoginPage from './pages/Login/main';
import NotAuthorizedPage from './pages/NotAuthorized/main';
import SessionsListPage from './pages/AuditSessions/main';
import SessionDetailPage from './pages/AuditSessionDetail/main';
import RecordingIndicator from './components/RecordingIndicator';
import { withProtectedRoute } from './components/withProtectedRoute';
import { withProtectedAuditRoute } from './components/withProtectedAuditRoute';
import TestingLandingPage from './TestingPage/LandingPage/main';

// Wrap verification flow components with regular protection HOC
const ProtectedPanPage = withProtectedRoute(PanPage);
const ProtectedOtpPage = withProtectedRoute(OtpPage);
const ProtectedSelfiePage = withProtectedRoute(SelfiePage);
const ProtectedThankYouPage = withProtectedRoute(ThankYouPage);

// Wrap audit routes with audit-specific protection HOC
const ProtectedSessionsListPage = withProtectedAuditRoute(SessionsListPage);
const ProtectedSessionDetailPage = withProtectedAuditRoute(SessionDetailPage);

function App() {
  return (
    <BrowserRouter>
      <RecordingIndicator />
      <Routes>
        {/* Root redirect to audit login */}
        <Route path="/" element={<Navigate to="/audit/login" replace />} />
        
        {/* Public routes */}
        <Route path="/audit/login" element={<LoginPage />} />
        <Route path="/not-authorized" element={<NotAuthorizedPage />} />
        
        {/* User Verification Flow - Protected routes using HOC */}
        <Route path="/verify/pan" element={<ProtectedPanPage />} />
        <Route path="/verify/otp" element={<ProtectedOtpPage />} />
        <Route path="/verify/selfie" element={<ProtectedSelfiePage />} />
        <Route path="/verify/complete" element={<ProtectedThankYouPage />} />
        <Route path="/verify/:temp_token" element={<LandingPage />} />
        
        {/* Admin Audit Flow - Protected routes using HOC */}
        <Route path="/audit/sessions" element={<ProtectedSessionsListPage />} />
        <Route path="/audit/sessions/:sessionUid" element={<ProtectedSessionDetailPage />} />

        {/* Testing */}
        <Route path="/testing/:temp_token" element={<TestingLandingPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
