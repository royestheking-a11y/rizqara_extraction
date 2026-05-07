import React, { useState, useEffect } from 'react';
import { Users, CreditCard, Layers, BarChart3, ArrowUpRight } from 'lucide-react';
import axios from 'axios';
import API_BASE_URL from '../../config';

const AdminOverview = () => {
  const [stats, setStats] = useState({ users: 0, leads: 0, pending: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/api/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
  return (
    <div className="admin-overview-premium animate-fade">
      {/* Hero Welcome Section */}
      <div className="admin-hero">
        <div className="hero-content">
          <div className="badge">ADMINISTRATOR PRIVILEGES ACTIVE</div>
          <h1>Command Center</h1>
          <p>Global oversight of system growth, user engagement, and operational health.</p>
        </div>
        <div className="hero-decoration"></div>
      </div>

      <div className="stats-master-grid">
        <div className="premium-stat-card">
          <div className="icon-box user-icon">
            <Users size={24} />
          </div>
          <div className="stat-data">
            <span className="label">GLOBAL PARTNERS</span>
            <span className="value">{stats.users.toLocaleString()}</span>
            <div className="growth">Total registered accounts</div>
          </div>
          <div className="card-glow"></div>
        </div>

        <div className="premium-stat-card">
          <div className="icon-box leads-icon">
            <Layers size={24} />
          </div>
          <div className="stat-data">
            <span className="label">DATA EXTRACTIONS</span>
            <span className="value">{stats.leads.toLocaleString()}</span>
            <div className="growth">Leads processed via AI</div>
          </div>
          <div className="card-glow"></div>
        </div>

        <div className="premium-stat-card">
          <div className="icon-box pending-icon">
            <CreditCard size={24} />
          </div>
          <div className="stat-data">
            <span className="label">ACTIVE QUEUE</span>
            <span className="value">{stats.pending}</span>
            <div className="growth">Payments awaiting audit</div>
          </div>
          <div className="card-glow"></div>
        </div>

        <div className="premium-stat-card revenue-highlight">
          <div className="icon-box revenue-icon">
            <BarChart3 size={24} />
          </div>
          <div className="stat-data">
            <span className="label">PLATFORM REVENUE</span>
            <span className="value">৳{stats.revenue.toLocaleString()}</span>
            <div className="growth">Total BDT processing volume</div>
          </div>
          <div className="card-glow"></div>
        </div>
      </div>

      <div className="admin-secondary-row">
        <div className="system-health-card">
          <div className="card-header">
            <h2><BarChart3 size={20} /> System Vitality</h2>
            <div className="status-live">
              <div className="pulse"></div> LIVE
            </div>
          </div>
          
          <div className="health-grid-premium">
            <div className="health-card">
              <div className="info">
                <span className="title">API SERVER</span>
                <span className="desc">Global Endpoint Stability</span>
              </div>
              <span className="health-status online">OPERATIONAL</span>
            </div>
            
            <div className="health-card">
              <div className="info">
                <span className="title">ENRICHMENT ENGINE</span>
                <span className="desc">AI Website Scraping Unit</span>
              </div>
              <span className="health-status online">ACTIVE</span>
            </div>
            
            <div className="health-card">
              <div className="info">
                <span className="title">DATABASE INFRA</span>
                <span className="desc">MongoDB Cluster Sync</span>
              </div>
              <span className="health-status online">HEALTHY</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx="true">{`
        .admin-overview-premium {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
        }

        /* Hero Section */
        .admin-hero {
          background: var(--primary);
          padding: 60px 40px;
          border-radius: 32px;
          position: relative;
          overflow: hidden;
          margin-bottom: 40px;
          color: #fff;
          box-shadow: 0 20px 40px rgba(139, 0, 0, 0.2);
        }

        .hero-content { position: relative; z-index: 2; }
        .hero-content .badge {
          display: inline-block;
          background: rgba(255, 255, 255, 0.1);
          padding: 6px 12px;
          border-radius: 30px;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1px;
          margin-bottom: 16px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .hero-content h1 { font-size: 48px; font-weight: 900; margin: 0; letter-spacing: -1.5px; }
        .hero-content p { font-size: 18px; opacity: 0.8; margin-top: 12px; max-width: 600px; line-height: 1.6; }

        .hero-decoration {
          position: absolute;
          top: -10%; right: -5%;
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          border-radius: 50%;
        }

        /* Stats Cards */
        .stats-master-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          margin-bottom: 40px;
        }

        .premium-stat-card {
          background: #fff;
          padding: 32px;
          border-radius: 28px;
          border: 1px solid rgba(139, 0, 0, 0.08);
          position: relative;
          overflow: hidden;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          display: flex;
          align-items: center;
          gap: 24px;
          box-shadow: 0 10px 30px rgba(139, 0, 0, 0.04);
        }

        .premium-stat-card:hover { transform: translateY(-8px); }

        .icon-box {
          width: 64px; height: 64px;
          border-radius: 20px;
          display: flex; align-items: center; justify-content: center;
          color: #fff;
          flex-shrink: 0;
          box-shadow: 0 8px 20px rgba(0,0,0,0.1);
        }

        .user-icon { background: linear-gradient(135deg, #6366f1, #4f46e5); }
        .leads-icon { background: linear-gradient(135deg, #10b981, #059669); }
        .pending-icon { background: linear-gradient(135deg, #f59e0b, #d97706); }
        .revenue-icon { background: linear-gradient(135deg, #8b0000, #a52a2a); }

        .stat-data { position: relative; z-index: 2; }
        .stat-data .label { font-size: 11px; font-weight: 900; color: var(--text-muted); letter-spacing: 1px; }
        .stat-data .value { font-size: 32px; font-weight: 900; color: var(--text); display: block; margin: 4px 0; }
        .stat-data .growth { font-size: 13px; color: var(--text-muted); font-weight: 500; }

        .revenue-highlight { border-color: rgba(139, 0, 0, 0.2); }

        .card-glow {
          position: absolute;
          bottom: -20px; right: -20px;
          width: 100px; height: 100px;
          background: rgba(139, 0, 0, 0.03);
          border-radius: 50%;
          filter: blur(20px);
        }

        /* System Health */
        .system-health-card {
          background: #fff;
          padding: 40px;
          border-radius: 32px;
          border: 1px solid rgba(139, 0, 0, 0.08);
          box-shadow: 0 10px 40px rgba(0,0,0,0.03);
        }

        .system-health-card .card-header {
          display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px;
        }

        .system-health-card h2 { font-size: 24px; font-weight: 900; color: var(--text); display: flex; align-items: center; gap: 12px; margin: 0; }
        
        .status-live { display: flex; align-items: center; gap: 10px; font-weight: 900; font-size: 12px; color: #059669; }
        .pulse { width: 8px; height: 8px; background: #059669; border-radius: 50%; animation: pulse-anim 1.5s infinite; }

        @keyframes pulse-anim {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(2.5); opacity: 0; }
        }

        .health-grid-premium {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;
        }

        .health-card {
          background: #f8f9fa;
          padding: 24px;
          border-radius: 20px;
          display: flex; justify-content: space-between; align-items: center;
          border: 1px solid transparent;
          transition: 0.2s;
        }

        .health-card:hover { border-color: rgba(139, 0, 0, 0.1); background: #fff; }

        .health-card .title { font-weight: 900; font-size: 13px; color: var(--text); display: block; }
        .health-card .desc { font-size: 11px; color: var(--text-muted); font-weight: 500; }

        .health-status { font-size: 10px; font-weight: 900; padding: 6px 12px; border-radius: 30px; }
        .health-status.online { background: #ecfdf5; color: #059669; }

        @media (max-width: 768px) {
          .admin-hero { padding: 40px 24px; }
          .hero-content h1 { font-size: 36px; }
          .stats-master-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default AdminOverview;
