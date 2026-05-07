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

  return (
    <div className="admin-payments animate-fade">
      <div className="section-header-top">
        <div className="title-group">
          <h1>Payment Verification</h1>
          <p>Review and approve subscription transactions</p>
        </div>
        <div className="filter-tabs">
          <button className={`filter-btn ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>Pending</button>
          <button className={`filter-btn ${filter === 'approved' ? 'active' : ''}`} onClick={() => setFilter('approved')}>Approved</button>
          <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
        </div>
      </div>

      <div className="card table-card">
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>USER</th>
                <th>TRX ID</th>
                <th>PLAN</th>
                <th>AMOUNT</th>
                <th>STATUS</th>
                <th>SUBMITTED</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(tx => (
                <tr key={tx._id}>
                  <td>
                    <div className="user-info-cell">
                      <div className="details">
                        <span className="name">{tx.userId?.name}</span>
                        <span className="email">{tx.userId?.email}</span>
                      </div>
                    </div>
                  </td>
                  <td><code className="tx-code">{tx.transactionId}</code></td>
                  <td><span className={`plan-tag ${tx.planRequested}`}>{tx.planRequested.toUpperCase()}</span></td>
                  <td><span className="amount-val">{tx.amount} BDT</span></td>
                  <td>
                    <span className={`status-pill ${tx.status}`}>
                      {tx.status.toUpperCase()}
                    </span>
                  </td>
                  <td>{new Date(tx.submittedAt).toLocaleString()}</td>
                  <td>
                    <div className="actions-cell">
                      {tx.status === 'pending' && (
                        <>
                          <button className="approve-btn" onClick={() => handleStatus(tx._id, 'approved')}>
                            <CheckCircle2 size={16} /> Approve
                          </button>
                          <button className="reject-btn" onClick={() => handleStatus(tx._id, 'rejected')}>
                            <XCircle size={16} /> Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx="true">{`
        .filter-tabs { display: flex; gap: 8px; background: var(--bg-input); padding: 4px; border-radius: 10px; }
        .filter-btn { padding: 8px 16px; border: none; background: none; font-size: 13px; font-weight: 700; color: var(--text-muted); cursor: pointer; border-radius: 8px; }
        .filter-btn.active { background: #fff; color: var(--primary); box-shadow: 0 2px 8px rgba(0,0,0,0.05); }

        .tx-code { background: var(--bg-input); padding: 4px 8px; border-radius: 6px; font-family: monospace; font-size: 12px; }
        .plan-tag { font-size: 10px; font-weight: 900; }
        .amount-val { font-weight: 800; color: var(--text); }

        .approve-btn, .reject-btn { 
          display: flex; align-items: center; gap: 6px; 
          padding: 6px 12px; border-radius: 8px; border: none; 
          font-size: 12px; font-weight: 800; cursor: pointer; transition: 0.2s;
        }
        .approve-btn { background: rgba(16, 185, 129, 0.1); color: #059669; }
        .approve-btn:hover { background: #10b981; color: white; }
        
        .reject-btn { background: rgba(239, 68, 68, 0.1); color: #dc2626; }
        .reject-btn:hover { background: #ef4444; color: white; }
      `}</style>
    </div>
  );
};

export default AdminPayments;
