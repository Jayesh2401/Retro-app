import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import './App.css';

// Components
import Login from './components/Login';
import Home from './components/Home';
import RetroBoard from './components/RetroBoard';
import NotFound from './components/NotFound';

// Theme Context
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <ThemeProvider>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/" element={user ? <Home user={user} /> : <Login />} />
            <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
            <Route path="/board/:boardId" element={user ? <RetroBoard user={user} /> : <Navigate to="/login" />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
