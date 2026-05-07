import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, Search, ExternalLink } from 'lucide-react';
import axios from 'axios';
import API_BASE_URL from '../../config';

const AdminPayments = () => {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/api/admin/transactions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setTxs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatus = async (id, status) => {
    if (!confirm(`Are you sure you want to ${status} this payment?`)) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/api/admin/transactions/${id}/status`, { status }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchTransactions();
    } catch (err) {
      alert('Action failed');
    }
  };

  const filtered = txs.filter(t => filter === 'all' || t.status === filter);

  // Statistics for the header
  const stats = {
    pending: txs.filter(t => t.status === 'pending').length,
    approved: txs.filter(t => t.status === 'approved').length,
    totalVolume: txs.filter(t => t.status === 'approved').reduce((sum, t) => sum + (t.amount || 0), 0)
  };

  return (
    <div className="admin-payments animate-fade">
      {/* Header with Stats Cards */}
      <div className="admin-premium-header">
        <div className="title-section">
          <h1>Payment Vault</h1>
          <p>Securely verify and authorize incoming subscription payments.</p>
        </div>
        
        <div className="stats-mini-grid">
          <div className="stat-card-mini">
            <span className="label">PENDING</span>
            <span className="value">{stats.pending}</span>
          </div>
          <div className="stat-card-mini">
            <span className="label">APPROVED</span>
            <span className="value">{stats.approved}</span>
          </div>
          <div className="stat-card-mini highlight">
            <span className="label">TOTAL REVENUE</span>
            <span className="value">{stats.totalVolume.toLocaleString()} BDT</span>
          </div>
        </div>
      </div>

      <div className="section-controls">
        <div className="filter-pills">
          <button className={`pill ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>
            <Clock size={14} /> Pending Verification
          </button>
          <button className={`pill ${filter === 'approved' ? 'active' : ''}`} onClick={() => setFilter('approved')}>
            <CheckCircle2 size={14} /> Success Stories
          </button>
          <button className={`pill ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
            <Search size={14} /> Global History
          </button>
        </div>
      </div>

      <div className="premium-table-wrapper">
        <table className="rizqara-table">
          <thead>
            <tr>
              <th>PARTNER DETAILS</th>
              <th>TRANSACTION ID</th>
              <th>PACKAGE</th>
              <th>INVESTMENT</th>
              <th>STATUS</th>
              <th>TIMESTAMP</th>
              <th className="text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-state">
                  <div className="empty-content">
                    <Search size={48} strokeWidth={1} />
                    <p>No transactions found in this segment.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map(tx => (
                <tr key={tx._id} className="row-hover">
                  <td>
                    <div className="partner-cell">
                      <div className="avatar-mini">{tx.userId?.name?.charAt(0) || '?'}</div>
                      <div className="info">
                        <div className="name">{tx.userId?.name || 'Unknown User'}</div>
                        <div className="email">{tx.userId?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="trx-badge">
                      <code>{tx.transactionId}</code>
                    </div>
                  </td>
                  <td>
                    <span className={`plan-glow ${tx.planRequested}`}>
                      {tx.planRequested.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div className="price-val">৳{tx.amount?.toLocaleString()}</div>
                  </td>
                  <td>
                    <div className={`status-badge-premium ${tx.status}`}>
                      <div className="dot"></div>
                      {tx.status.toUpperCase()}
                    </div>
                  </td>
                  <td className="date-cell">
                    {new Date(tx.submittedAt).toLocaleDateString()}
                    <span>{new Date(tx.submittedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </td>
                  <td className="text-right">
                    <div className="action-group">
                      {tx.status === 'pending' && (
                        <>
                          <button className="btn-approve" title="Approve Payment" onClick={() => handleStatus(tx._id, 'approved')}>
                            <CheckCircle2 size={18} />
                          </button>
                          <button className="btn-reject" title="Reject Payment" onClick={() => handleStatus(tx._id, 'rejected')}>
                            <XCircle size={18} />
                          </button>
                        </>
                      )}
                      <button className="btn-details" title="View Details">
                        <ExternalLink size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <style jsx="true">{`
        .admin-payments {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .admin-premium-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 40px;
          gap: 24px;
        }

        .title-section h1 {
          font-size: 32px;
          font-weight: 900;
          color: var(--primary);
          margin: 0;
          letter-spacing: -0.5px;
        }

        .title-section p {
          color: var(--text-muted);
          margin-top: 8px;
          font-size: 15px;
        }

        .stats-mini-grid {
          display: flex;
          gap: 16px;
        }

        .stat-card-mini {
          background: #fff;
          padding: 16px 24px;
          border-radius: 16px;
          border: 1px solid rgba(139, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
          min-width: 140px;
          box-shadow: 0 4px 20px rgba(139, 0, 0, 0.05);
        }

        .stat-card-mini.highlight {
          background: var(--primary);
          border-color: var(--primary);
        }

        .stat-card-mini .label {
          font-size: 10px;
          font-weight: 900;
          color: var(--text-muted);
          letter-spacing: 1px;
          margin-bottom: 4px;
        }

        .stat-card-mini.highlight .label { color: rgba(255,255,255,0.7); }

        .stat-card-mini .value {
          font-size: 20px;
          font-weight: 900;
          color: var(--primary);
        }

        .stat-card-mini.highlight .value { color: #fff; }

        .section-controls {
          margin-bottom: 24px;
        }

        .filter-pills {
          display: flex;
          gap: 12px;
        }

        .pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 30px;
          border: 1px solid rgba(139, 0, 0, 0.1);
          background: #fff;
          color: var(--text-muted);
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: 0.3s;
        }

        .pill:hover { border-color: var(--primary); color: var(--primary); }
        .pill.active { background: var(--primary); color: #fff; border-color: var(--primary); box-shadow: 0 8px 20px rgba(139, 0, 0, 0.2); }

        .premium-table-wrapper {
          background: #fff;
          border-radius: 24px;
          border: 1px solid rgba(139, 0, 0, 0.1);
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(139, 0, 0, 0.05);
        }

        .rizqara-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .rizqara-table th {
          padding: 20px 24px;
          background: rgba(139, 0, 0, 0.02);
          font-size: 11px;
          font-weight: 900;
          color: var(--text-muted);
          letter-spacing: 1px;
          border-bottom: 1px solid rgba(139, 0, 0, 0.05);
        }

        .rizqara-table td {
          padding: 18px 24px;
          border-bottom: 1px solid rgba(139, 0, 0, 0.03);
          vertical-align: middle;
        }

        .row-hover:hover { background: rgba(139, 0, 0, 0.01); }

        .partner-cell { display: flex; align-items: center; gap: 12px; }
        .avatar-mini {
          width: 36px; height: 36px; border-radius: 12px;
          background: var(--primary); color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-weight: 900; font-size: 14px;
        }
        .partner-cell .name { font-weight: 800; color: var(--text); font-size: 14px; }
        .partner-cell .email { font-size: 12px; color: var(--text-muted); }

        .trx-badge code {
          background: #f8f9fa;
          padding: 6px 10px;
          border-radius: 8px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: var(--primary);
          border: 1px solid rgba(0,0,0,0.05);
        }

        .price-val { font-weight: 900; font-size: 15px; color: var(--text); }

        .status-badge-premium {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 30px;
          font-size: 11px;
          font-weight: 900;
          background: #f8f9fa;
        }

        .status-badge-premium .dot { width: 6px; height: 6px; border-radius: 50%; }

        .status-badge-premium.pending { color: #d97706; background: #fffbeb; }
        .status-badge-premium.pending .dot { background: #d97706; box-shadow: 0 0 10px #d97706; }

        .status-badge-premium.approved { color: #059669; background: #ecfdf5; }
        .status-badge-premium.approved .dot { background: #059669; box-shadow: 0 0 10px #059669; }

        .status-badge-premium.rejected { color: #dc2626; background: #fef2f2; }
        .status-badge-premium.rejected .dot { background: #dc2626; }

        .date-cell { font-size: 13px; font-weight: 700; color: var(--text); display: flex; flex-direction: column; }
        .date-cell span { font-size: 11px; color: var(--text-muted); font-weight: 500; }

        .action-group { display: flex; gap: 8px; justify-content: flex-end; }
        .action-group button {
          width: 36px; height: 36px; border-radius: 10px;
          border: 1px solid rgba(0,0,0,0.05);
          background: #fff;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: 0.2s;
          color: var(--text-muted);
        }

        .btn-approve:hover { background: #059669; color: #fff; border-color: #059669; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3); }
        .btn-reject:hover { background: #dc2626; color: #fff; border-color: #dc2626; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3); }
        .btn-details:hover { background: var(--primary); color: #fff; border-color: var(--primary); }

        .text-right { text-align: right; }

        .empty-state { padding: 80px !important; text-align: center; color: var(--text-muted); }
        .empty-content { display: flex; flex-direction: column; align-items: center; gap: 16px; }
        .empty-content p { font-weight: 700; }

        .plan-glow {
          font-size: 10px; font-weight: 900; padding: 4px 10px; border-radius: 6px;
        }
        .plan-glow.business { background: rgba(139, 0, 0, 0.1); color: var(--primary); border: 1px solid var(--primary); }
        .plan-glow.pro { background: #000; color: #fff; }
        .plan-glow.free { background: #f1f3f5; color: #495057; }

        @media (max-width: 1024px) {
          .admin-premium-header { flex-direction: column; align-items: flex-start; }
          .stats-mini-grid { width: 100%; overflow-x: auto; padding-bottom: 8px; }
        }
      `}</style>
    </div>
  );
};

export default AdminPayments;
