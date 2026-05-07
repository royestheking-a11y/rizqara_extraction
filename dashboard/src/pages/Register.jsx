import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Eye, EyeOff, Zap } from 'lucide-react';
import axios from 'axios';
import API_BASE_URL from '../config';

const Register = ({ setUser }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/register`, { name, email, password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card animate-fade">
        <div className="auth-header">
          <div className="logo-large">
            <div className="logo-icon-lg">
              <Zap size={32} fill="currentColor" />
            </div>
            <div className="logo-text-lg">
              <span className="logo-name-lg">Rizqara</span>
              <span className="logo-sub-lg">EXTRACTION</span>
            </div>
          </div>
          <h1>Create Account</h1>
          <p>Start your lead generation journey today</p>
        </div>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Full Name</label>
            <input 
              type="text" 
              placeholder="John Doe" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required 
            />
          </div>
          <div className="input-group">
            <label>Email Address</label>
            <input 
              type="email" 
              placeholder="name@company.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <div className="password-input-wrap">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
              <button 
                type="button" 
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button className="btn-primary auth-btn" disabled={loading}>
            {loading ? 'Setting up account...' : 'Register Now'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>

      <style jsx="true">{`
        .auth-page {
          height: 100vh;
          width: 100vw;
          position: fixed;
          top: 0;
          left: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          background: var(--bg-deep); /* Offwhite */
          z-index: 1000;
        }

        .auth-card {
          width: 100%;
          max-width: 440px;
          padding: 40px;
          border: 1px solid var(--border);
          background: #fff;
          box-shadow: 0 10px 40px rgba(0,0,0,0.05);
        }

        .auth-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .logo-large {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 24px;
        }

        .logo-icon-lg {
          width: 48px;
          height: 48px;
          background: var(--gradient);
          color: white;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
          box-shadow: 0 4px 12px rgba(128, 0, 0, 0.2);
        }

        .logo-text-lg {
          display: flex;
          flex-direction: column;
          line-height: 1;
        }

        .logo-name-lg {
          font-size: 22px;
          font-weight: 900;
          color: var(--text);
        }

        .logo-sub-lg {
          font-size: 10px;
          font-weight: 700;
          color: var(--primary);
          letter-spacing: 4px;
          margin-top: 6px;
        }

        .auth-header h1 {
          font-size: 22px;
          font-weight: 900;
          margin-bottom: 6px;
          color: var(--text);
        }

        .auth-header p {
          color: var(--text-muted);
          font-size: 15px;
          font-weight: 500;
        }

        .password-input-wrap {
          position: relative;
        }

        .password-toggle {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 4px;
        }

        .password-toggle:hover {
          color: var(--primary);
        }

        .auth-btn {
          width: 100%;
          justify-content: center;
          margin-top: 16px;
          padding: 16px;
          font-size: 16px;
        }

        .auth-footer {
          text-align: center;
          margin-top: 32px;
          font-size: 14px;
          color: var(--text-muted);
          font-weight: 500;
        }

        .auth-footer a {
          color: var(--primary);
          font-weight: 800;
          text-decoration: none;
        }

        .error-msg {
          background: rgba(239, 68, 68, 0.08);
          color: var(--error);
          padding: 14px;
          border-radius: var(--radius);
          margin-bottom: 24px;
          font-size: 13px;
          text-align: center;
          border: 1px solid rgba(239, 68, 68, 0.15);
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

export default Register;
