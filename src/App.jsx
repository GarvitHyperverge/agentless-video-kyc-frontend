import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage/main';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/:sessionId" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
