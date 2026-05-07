import React, { useState, useEffect } from 'react';
import API_BASE_URL from './config';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Subscriptions from './pages/Subscriptions';
import AdminOverview from './pages/admin/AdminOverview';
import AdminUsers from './pages/admin/AdminUsers';
import AdminPayments from './pages/admin/AdminPayments';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import LoadingScreen from './components/LoadingScreen';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Validate token and fetch user profile
      fetchUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async (token) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        localStorage.removeItem('token');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <Router>
      <div className="app-container">
        {user && <Sidebar user={user} setUser={setUser} />}
        <div className="main-content">
          {user && <Navbar user={user} />}
          <div className="page-wrapper">
            <Routes>
              <Route path="/login" element={!user ? <Login setUser={setUser} /> : <Navigate to="/" />} />
              <Route path="/register" element={!user ? <Register setUser={setUser} /> : <Navigate to="/" />} />
              <Route path="/" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
              <Route path="/subscriptions" element={user ? <Subscriptions user={user} /> : <Navigate to="/login" />} />
              
              {/* Admin Routes */}
              {user?.role === 'admin' && (
                <>
                  <Route path="/admin" element={<AdminOverview />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route path="/admin/payments" element={<AdminPayments />} />
                </>
              )}
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
