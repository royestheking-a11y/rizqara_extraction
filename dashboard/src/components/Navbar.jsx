import React from 'react';
import { User, Bell, Search } from 'lucide-react';

const Navbar = ({ user }) => {
  return (
    <div className="navbar glass">
      <div className="nav-left">
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input type="text" placeholder="Search leads or analytics..." />
        </div>
      </div>
      <div className="nav-right">
        <div className="icon-btn">
          <Bell size={20} />
          <span className="dot"></span>
        </div>
        <div className="user-profile-wrap">
          <div className="user-details">
            <span className="name">{user.name}</span>
            <span className={`plan-tag ${user.plan}`}>{user.plan.toUpperCase()}</span>
          </div>
          <div className="avatar">
            <User size={22} />
          </div>
        </div>
      </div>

      <style jsx="true">{`
        .navbar {
          padding: 20px 48px; /* Increased padding */
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border);
          position: sticky;
          top: 0;
          z-index: 90;
        }

        .search-bar {
          background: var(--bg-input);
          border: 1px solid var(--border);
          border-radius: 12px;
          display: flex;
          align-items: center;
          padding: 10px 18px;
          width: 320px;
          transition: var(--transition);
        }

        .search-bar:focus-within {
          border-color: var(--primary);
          background: #fff;
          box-shadow: 0 0 0 4px rgba(128, 0, 0, 0.05);
          width: 380px;
        }

        .search-icon {
          color: var(--text-muted);
          margin-right: 12px;
        }

        .search-bar input {
          background: none;
          border: none;
          color: var(--text);
          font-size: 14px;
          width: 100%;
          outline: none;
          font-weight: 500;
        }

        .nav-right {
          display: flex;
          align-items: center;
          gap: 32px;
        }

        .icon-btn {
          width: 44px;
          height: 44px;
          display: flex;
          justify-content: center;
          align-items: center;
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 12px;
          color: var(--text-muted);
          cursor: pointer;
          position: relative;
          transition: var(--transition);
        }

        .icon-btn:hover {
          background: var(--bg-input);
          color: var(--primary);
          border-color: var(--primary);
        }

        .dot {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 8px;
          height: 8px;
          background: var(--primary);
          border-radius: 50%;
          border: 2px solid #fff;
        }

        .user-profile-wrap {
          display: flex;
          align-items: center;
          gap: 16px;
          cursor: pointer;
          padding: 8px 12px;
          border-radius: 14px;
          transition: var(--transition);
        }

        .user-profile-wrap:hover {
          background: var(--bg-input);
        }

        .user-details {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .name {
          font-weight: 800;
          font-size: 14px;
          color: var(--text);
        }

        .plan-tag {
          font-size: 10px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 6px;
          margin-top: 2px;
          letter-spacing: 0.5px;
        }

        .plan-tag.free {
          background: #f3f4f6;
          color: var(--text-muted);
        }

        .plan-tag.standard {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }

        .plan-tag.premium {
          background: rgba(128, 0, 0, 0.1);
          color: var(--primary);
        }

        .avatar {
          width: 44px;
          height: 44px;
          background: var(--gradient);
          color: white;
          border-radius: 12px;
          display: flex;
          justify-content: center;
          align-items: center;
          box-shadow: 0 4px 10px rgba(128, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
};

export default Navbar;
