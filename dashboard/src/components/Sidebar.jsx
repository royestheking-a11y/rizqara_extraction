import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CreditCard, LogOut, Zap, Users, ShieldCheck, PieChart } from 'lucide-react';

const Sidebar = ({ user, setUser }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo-icon-wrap">
          <img src="/favicon/favicon.svg" alt="Rizqara Logo" style={{ width: '28px', height: '28px' }} />
        </div>
        <div className="logo-text">
          <span className="logo-name">Rizqara</span>
          <span className="logo-sub">EXTRACTION</span>
        </div>
      </div>
      
      <nav className="side-nav">
        <NavLink to="/" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/subscriptions" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <CreditCard size={20} />
          <span>Subscriptions</span>
        </NavLink>

        {user?.role === 'admin' && (
          <>
            <div className="nav-divider">ADMIN PANEL</div>
            <NavLink to="/admin" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} end>
              <PieChart size={20} />
              <span>Admin Stats</span>
            </NavLink>
            <NavLink to="/admin/users" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <Users size={20} />
              <span>Users Control</span>
            </NavLink>
            <NavLink to="/admin/payments" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <ShieldCheck size={20} />
              <span>Payments</span>
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        {user.plan === 'free' && (
          <button className="get-pro-btn" onClick={() => navigate('/subscriptions')}>
            <Zap size={16} fill="currentColor" />
            <span>GET PRO</span>
          </button>
        )}
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>

      <style jsx="true">{`
        .sidebar {
          width: 280px;
          height: 100vh;
          position: sticky;
          top: 0;
          display: flex;
          flex-direction: column;
          background: #ffffff;
          border-right: 1px solid var(--border);
          padding: 40px 24px; /* Increased padding */
          z-index: 100;
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 56px;
          padding: 0 8px;
        }

        .logo-icon-wrap {
          width: 44px;
          height: 44px;
          background: var(--gradient);
          color: white;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(128, 0, 0, 0.2);
        }

        .logo-text {
          display: flex;
          flex-direction: column;
          line-height: 1;
        }

        .logo-name {
          font-size: 20px;
          font-weight: 800;
          color: var(--text);
        }

        .logo-sub {
          font-size: 9px;
          font-weight: 700;
          color: var(--primary);
          letter-spacing: 2px;
          margin-top: 4px;
        }

        .side-nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 20px;
          text-decoration: none;
          color: var(--text-muted);
          border-radius: var(--radius);
          font-weight: 700;
          font-size: 14px;
          transition: var(--transition);
        }

        .nav-item:hover {
          background: var(--bg-input);
          color: var(--text);
        }

        .nav-item.active {
          background: var(--gradient);
          color: white;
          box-shadow: 0 4px 12px rgba(128, 0, 0, 0.2);
        }

        .nav-divider {
          font-size: 10px;
          font-weight: 900;
          color: var(--text-muted);
          letter-spacing: 1.5px;
          margin: 24px 0 8px 20px;
        }

        .sidebar-footer {
          display: flex;
          flex-direction: column;
          gap: 16px;
          border-top: 1px solid var(--border);
          padding-top: 32px;
        }

        .get-pro-btn {
          width: 100%;
          background: var(--gradient);
          color: white;
          border: none;
          padding: 16px;
          border-radius: var(--radius);
          font-weight: 800;
          font-size: 13px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 4px 15px rgba(128, 0, 0, 0.25);
          transition: var(--transition);
        }

        .get-pro-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(128, 0, 0, 0.35);
        }

        .logout-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 20px;
          background: none;
          border: none;
          color: var(--error);
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          border-radius: var(--radius);
          transition: var(--transition);
        }

        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.08);
        }
      `}</style>
    </div>
  );
};

export default Sidebar;
