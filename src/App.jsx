import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage/main';
import PanPage from './pages/PanPage/main';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/:sessionId" element={<LandingPage />} />
        <Route path="/pan" element={<PanPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
