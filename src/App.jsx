import { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';

// Custom Auth Context
const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) return <div className="spinner" style={{ margin: '100px auto' }}></div>;

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <div className="bg-mesh"></div>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/" />} />
          <Route path="/" element={user ? <Dashboard /> : <Navigate to="/auth" />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
