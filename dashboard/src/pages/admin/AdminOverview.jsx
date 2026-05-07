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
    <div className="admin-overview animate-fade">
      <div className="admin-header">
        <h1>Admin Command Center</h1>
        <p>Monitor system growth and manage operations</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card card">
          <div className="stat-header">
            <div className="stat-icon p-bg"><Users size={22} /></div>
            <div className="stat-label">TOTAL USERS</div>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.users}</div>
            <p className="stat-desc">Registered extractions accounts</p>
          </div>
        </div>

        <div className="stat-card card">
          <div className="stat-header">
            <div className="stat-icon s-bg"><Layers size={22} /></div>
            <div className="stat-label">TOTAL LEADS</div>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.leads.toLocaleString()}</div>
            <p className="stat-desc">Leads extracted via system</p>
          </div>
        </div>

        <div className="stat-card card">
          <div className="stat-header">
            <div className="stat-icon a-bg"><CreditCard size={22} /></div>
            <div className="stat-label">PENDING PAYMENTS</div>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.pending}</div>
            <p className="stat-desc">Transactions awaiting approval</p>
          </div>
        </div>

        <div className="stat-card card">
          <div className="stat-header">
            <div className="stat-icon g-bg"><BarChart3 size={22} /></div>
            <div className="stat-label">TOTAL REVENUE</div>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.revenue} <span className="stat-total">BDT</span></div>
            <p className="stat-desc">Lifetime earnings from plans</p>
          </div>
        </div>
      </div>

      <div className="admin-row">
        <div className="recent-activity card">
          <div className="section-header">
            <h2>System Health</h2>
          </div>
          <div className="health-grid">
             <div className="health-item">
                <span className="dot online"></span>
                <span className="label">API SERVER</span>
                <span className="status">ONLINE</span>
             </div>
             <div className="health-item">
                <span className="dot online"></span>
                <span className="label">ENRICHMENT ENGINE</span>
                <span className="status">ONLINE</span>
             </div>
             <div className="health-item">
                <span className="dot online"></span>
                <span className="label">DATABASE (MONGODB)</span>
                <span className="status">CONNECTED</span>
             </div>
          </div>
        </div>
      </div>

      <style jsx="true">{`
        .admin-header { margin-bottom: 40px; }
        .admin-header h1 { font-size: 32px; margin-bottom: 8px; font-weight: 900; }
        .admin-header p { color: var(--text-muted); font-size: 15px; }

        .admin-row { margin-top: 32px; }
        .health-grid { display: flex; flex-direction: column; gap: 20px; margin-top: 24px; }
        .health-item { 
          display: flex; 
          align-items: center; 
          gap: 16px; 
          padding: 16px; 
          background: var(--bg-input); 
          border-radius: 12px;
          border: 1px solid var(--border);
        }
        .dot { width: 10px; height: 10px; border-radius: 50%; }
        .dot.online { background: #10b981; box-shadow: 0 0 10px rgba(16, 185, 129, 0.4); }
        .health-item .label { font-size: 12px; font-weight: 800; color: var(--text-muted); flex: 1; }
        .health-item .status { font-size: 11px; font-weight: 900; color: var(--primary); }
      `}</style>
    </div>
  );
};

export default AdminOverview;
