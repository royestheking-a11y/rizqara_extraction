import React, { useState, useEffect } from 'react';
import { Target, Zap, Clock, TrendingUp, RefreshCw } from 'lucide-react';
import axios from 'axios';
import API_BASE_URL from '../config';

const Dashboard = ({ user, setUser }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch both history and fresh profile
      const [historyRes, profileRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/payment/history`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/api/user/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      
      setHistory(historyRes.data);
      
      // Update global user state
      if (typeof setUser === 'function') {
        setUser(profileRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const remaining = user.daily_limit - user.usage_today;
  const usagePct = (user.usage_today / user.daily_limit) * 100;

  return (
    <div className="dashboard-page animate-fade">
      <div className="stats-grid">
        <div className="stat-card card">
          <div className="stat-header">
            <div className="stat-icon p-bg"><Target size={22} /></div>
            <div className="stat-label">{user.plan === 'free' ? 'LIFETIME USAGE' : 'DAILY USAGE'}</div>
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {user.plan === 'free' ? user.total_usage : user.usage_today} 
              <span className="stat-total">/ {user.plan === 'free' ? 20 : user.daily_limit}</span>
            </div>
            <div className="usage-progress-wrap">
              <div className="usage-progress-fill" style={{ width: `${Math.min(100, user.plan === 'free' ? (user.total_usage / 20) * 100 : (user.usage_today / user.daily_limit) * 100)}%` }}></div>
            </div>
            <p className="stat-desc">{user.plan === 'free' ? 'Total leads extracted' : 'Leads extracted today'}</p>
          </div>
        </div>

        <div className="stat-card card">
          <div className="stat-header">
            <div className="stat-icon s-bg"><Zap size={22} /></div>
            <div className="stat-label">REMAINING</div>
          </div>
          <div className="stat-content">
            <div className="stat-value">{user.plan === 'free' ? Math.max(0, 20 - user.total_usage) : remaining}</div>
            <p className="stat-desc">{user.plan === 'free' ? 'Leads left in trial' : 'Leads available until reset'}</p>
          </div>
        </div>

        <div className="stat-card card">
          <div className="stat-header">
            <div className="stat-icon a-bg"><Clock size={22} /></div>
            <div className="stat-label">CURRENT PLAN</div>
          </div>
          <div className="stat-content">
            <div className="stat-value plan-name">{user.plan.toUpperCase()}</div>
            <p className="stat-desc">Active subscription tier</p>
          </div>
        </div>

        <div className="stat-card card">
          <div className="stat-header">
            <div className="stat-icon g-bg"><TrendingUp size={22} /></div>
            <div className="stat-label">LIFETIME LEADS</div>
          </div>
          <div className="stat-content">
            <div className="stat-value">{user.total_usage || 0}</div>
            <p className="stat-desc">Total leads extracted</p>
          </div>
        </div>
      </div>

      <div className="history-section card">
        <div className="section-header">
          <div className="title-wrap">
            <Clock size={24} className="title-icon" />
            <h2>Transaction & Plan History</h2>
          </div>
          <button className="refresh-btn" onClick={fetchData} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'spinning' : ''} />
            <span>Refresh Data</span>
          </button>
        </div>
        
        <div className="table-container">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Fetching history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><TrendingUp size={64} /></div>
              <p>No transaction history found yet.</p>
            </div>
          ) : (
            <table className="history-table">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>TRANSACTION ID</th>
                  <th>PLAN</th>
                  <th>AMOUNT</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {history.map((tx) => (
                  <tr key={tx._id}>
                    <td>{new Date(tx.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td><code className="tx-code">{tx.transactionId}</code></td>
                    <td><span className="plan-tag-inline">{tx.planRequested.toUpperCase()}</span></td>
                    <td><span className="amount-val">{tx.amount} BDT</span></td>
                    <td>
                      <span className={`status-pill ${tx.status}`}>
                        {tx.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <style jsx="true">{`
        .dashboard-page {
          display: flex;
          flex-direction: column;
          gap: 40px; /* Increased gap */
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 32px; /* Increased gap */
        }

        .stat-card {
          padding: 24px;
          transition: var(--transition);
        }

        .stat-card:hover {
          transform: translateY(-5px);
          border-color: var(--primary);
          box-shadow: 0 12px 30px rgba(0,0,0,0.08);
        }

        .stat-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          justify-content: center;
          align-items: center;
          color: white;
        }

        .p-bg { background: var(--gradient); box-shadow: 0 4px 12px rgba(128, 0, 0, 0.2); }
        .s-bg { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2); }
        .a-bg { background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2); }
        .g-bg { background: linear-gradient(135deg, #10b981 0%, #059669 100%); box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2); }

        .stat-label {
          font-size: 11px;
          font-weight: 800;
          color: var(--text-muted);
          letter-spacing: 1.5px;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 900;
          margin-bottom: 8px;
          color: var(--text);
        }

        .stat-total {
          font-size: 18px;
          color: var(--text-muted);
          margin-left: 6px;
          font-weight: 600;
        }

        .plan-name { color: var(--primary); }

        .usage-progress-wrap {
          width: 100%;
          height: 8px;
          background: var(--bg-input);
          border-radius: 10px;
          margin: 16px 0;
          overflow: hidden;
        }

        .usage-progress-fill {
          height: 100%;
          background: var(--primary);
          border-radius: 10px;
        }

        .stat-desc {
          font-size: 14px;
          color: var(--text-muted);
          font-weight: 500;
        }

        .history-section {
          padding: 32px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
        }

        .title-wrap {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .title-icon { color: var(--primary); }

        .section-header h2 {
          font-size: 22px;
          color: var(--text);
          font-weight: 800;
        }

        .refresh-btn {
          background: #fff;
          border: 1px solid var(--border);
          color: var(--text);
          padding: 12px 20px;
          border-radius: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 700;
          font-size: 14px;
          transition: var(--transition);
        }

        .refresh-btn:hover:not(:disabled) {
          border-color: var(--primary);
          color: var(--primary);
          background: rgba(128, 0, 0, 0.02);
        }

        .spinning { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .table-container { min-height: 300px; }

        .history-table { width: 100%; border-collapse: collapse; }

        th {
          text-align: left;
          padding: 20px;
          font-size: 12px;
          font-weight: 800;
          color: var(--text-muted);
          border-bottom: 2px solid var(--border);
          letter-spacing: 1.5px;
        }

        td {
          padding: 18px 20px;
          border-bottom: 1px solid var(--border);
          font-size: 14px;
          font-weight: 500;
          color: #4b5563;
        }

        .tx-code {
          background: var(--bg-input);
          padding: 6px 12px;
          border-radius: 8px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: #1f2937;
          border: 1px solid var(--border);
        }

        .amount-val { font-weight: 800; color: var(--text); }

        .plan-tag-inline {
          font-size: 11px;
          font-weight: 800;
          color: var(--primary);
          background: rgba(128, 0, 0, 0.08);
          padding: 4px 10px;
          border-radius: 6px;
        }

        .status-pill {
          padding: 8px 16px;
          border-radius: 30px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.5px;
        }

        .status-pill.pending { background: rgba(245, 158, 11, 0.1); color: #d97706; }
        .status-pill.approved { background: rgba(16, 185, 129, 0.1); color: #059669; }
        .status-pill.rejected { background: rgba(239, 68, 68, 0.1); color: #dc2626; }

        .loading-state, .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 100px 40px;
          color: var(--text-muted);
          gap: 20px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid var(--bg-input);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
