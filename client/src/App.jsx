import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import BookingPage from './pages/BookingPage';
import InterviewPage from './pages/InterviewPage';
import HRDashboard from './pages/HRDashboard';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/book/:token" element={<BookingPage />} />
        <Route path="/interview/:token" element={<InterviewPage />} />
        <Route path="/hr" element={<HRDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
