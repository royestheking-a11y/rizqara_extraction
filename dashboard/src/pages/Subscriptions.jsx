import React, { useState } from 'react';
import { Check, Send, X, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import API_BASE_URL from '../config';

const Subscriptions = ({ user }) => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const plans = [
    {
      id: 'free',
      name: 'Free Trial',
      price: '0',
      leads: '20 leads lifetime',
      features: ['20 leads total extraction', 'Google Maps extraction', 'Basic scoring', 'Excel export']
    },
    {
      id: 'pro',
      name: 'Standard Pro',
      price: '200',
      leads: '100 leads / day',
      features: ['100 leads per day', 'All Free features', 'Priority support', 'Tech stack detection']
    },
    {
      id: 'business',
      name: 'Premium Elite',
      price: '400',
      leads: '300 leads / day',
      features: ['300 leads per day', 'All Standard features', 'AI Insights included', 'Lifetime updates']
    }
  ];

  const handleUpgrade = (plan) => {
    if (plan.id === 'free') return;
    setSelectedPlan(plan);
    setMessage(null);
  };

  const handleSubmitTransaction = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/api/payment/submit`, {
        transactionId,
        amount: selectedPlan.price,
        method: 'bKash',
        planRequested: selectedPlan.id
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: 'Payment submitted! Admin will verify within 24h.' });
      setTransactionId('');
      setTimeout(() => setSelectedPlan(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Submission failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="subscriptions-page animate-fade">
      <div className="page-header">
        <h1>Pricing Plans</h1>
        <p>Scale your outreach with our professional lead generation tools.</p>
      </div>

      <div className="plans-grid">
        {plans.map((plan) => (
          <div key={plan.id} className={`plan-card card ${user.plan === plan.id ? 'active' : ''} ${plan.id === 'business' ? 'featured' : ''}`}>
            {user.plan === plan.id && <div className="current-badge">YOUR CURRENT PLAN</div>}
            {plan.id === 'business' && <div className="featured-badge">BEST VALUE</div>}
            
            <div className="plan-header">
              <h3>{plan.name}</h3>
              <div className="price-wrap">
                <span className="currency">BDT</span>
                <span className="amount">{plan.price}</span>
                <span className="period">/mo</span>
              </div>
            </div>

            <div className="plan-meta">
              <span className="limit-tag">{plan.leads}</span>
            </div>

            <ul className="feature-list">
              {plan.features.map((f, i) => (
                <li key={i}><Check size={18} className="check-icon" /> {f}</li>
              ))}
            </ul>

            <button 
              className={`upgrade-btn ${user.plan === plan.id || plan.id === 'free' ? 'disabled' : ''}`}
              disabled={user.plan === plan.id || plan.id === 'free'}
              onClick={() => handleUpgrade(plan)}
            >
              {user.plan === plan.id ? 'Active Now' : plan.id === 'free' ? 'Default Plan' : 'Upgrade to ' + plan.name}
            </button>
          </div>
        ))}
      </div>

      {selectedPlan && (
        <div className="payment-modal-overlay">
          <div className="payment-modal card animate-fade">
            <button className="close-modal" onClick={() => setSelectedPlan(null)}><X size={24} /></button>
            <div className="modal-icon"><ShieldCheck size={48} /></div>
            <h2>Complete Your Upgrade</h2>
            <p className="instr">Send <strong>{selectedPlan.price} BDT</strong> via bKash or Nagad (Personal)</p>
            
            <div className="payment-box">
              <span className="label">OFFICIAL RECEIVER NUMBER</span>
              <div className="number-val">+8801577180519</div>
              <span className="methods">Supports bKash, Nagad, Rocket</span>
            </div>
            
            <form onSubmit={handleSubmitTransaction}>
              <div className="input-group">
                <label>Transaction ID (TrxID)</label>
                <input 
                  type="text" 
                  placeholder="Enter the 8-10 digit TrxID" 
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  required 
                  autoFocus
                />
              </div>
              {message && <div className={`alert-toast ${message.type}`}>{message.text}</div>}
              <button type="submit" className="submit-payment-btn" disabled={loading}>
                {loading ? 'Processing Verification...' : 'Verify Transaction'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style jsx="true">{`
        .subscriptions-page {
          padding-bottom: 80px;
        }

        .page-header {
          text-align: center;
          margin-bottom: 72px;
        }

        .page-header h1 {
          font-size: 36px;
          margin-bottom: 12px;
          font-weight: 900;
        }

        .page-header p {
          color: var(--text-muted);
          font-size: 15px;
          font-weight: 500;
        }

        .plans-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
          gap: 40px; /* Increased gap */
          max-width: 1200px;
          margin: 0 auto;
        }

        .plan-card {
          padding: 48px 32px;
          display: flex;
          flex-direction: column;
          position: relative;
          transition: var(--transition);
        }

        .plan-card:hover {
          transform: translateY(-12px);
          border-color: var(--primary);
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }

        .plan-card.active {
          border: 2px solid var(--primary);
          background: #fff;
        }

        .plan-card.featured {
          background: #fff;
          border-color: rgba(128, 0, 0, 0.2);
          box-shadow: 0 10px 30px rgba(128, 0, 0, 0.05);
        }

        .current-badge, .featured-badge {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translate(-50%, -50%);
          padding: 8px 24px;
          border-radius: 40px;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 1.5px;
        }

        .current-badge { background: var(--gradient); color: white; }
        .featured-badge { background: #8b5cf6; color: white; }

        .plan-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .plan-header h3 {
          font-size: 24px;
          margin-bottom: 20px;
          color: #4b5563;
        }

        .price-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .currency { font-size: 16px; font-weight: 800; color: var(--text-muted); align-self: flex-start; margin-top: 10px; }
        .amount { font-size: 48px; font-weight: 950; color: var(--text); }
        .period { font-size: 15px; color: var(--text-muted); align-self: flex-end; margin-bottom: 12px; font-weight: 600; }

        .plan-meta {
          text-align: center;
          margin-bottom: 40px;
        }

        .limit-tag {
          background: var(--bg-input);
          padding: 8px 20px;
          border-radius: 40px;
          font-size: 14px;
          font-weight: 800;
          color: var(--primary);
          border: 1px solid var(--border);
        }

        .feature-list {
          list-style: none;
          margin-bottom: 56px;
          flex: 1;
        }

        .feature-list li {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 16px;
          font-size: 14px;
          color: #374151;
          font-weight: 500;
        }

        .check-icon { color: #059669; flex-shrink: 0; }

        .upgrade-btn {
          width: 100%;
          padding: 18px;
          border-radius: 14px;
          border: 2px solid var(--primary);
          background: none;
          color: var(--primary);
          font-weight: 900;
          font-size: 15px;
          cursor: pointer;
          transition: var(--transition);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .upgrade-btn:hover:not(.disabled) {
          background: var(--primary);
          color: white;
          box-shadow: 0 8px 20px rgba(128, 0, 0, 0.25);
        }

        .upgrade-btn.disabled {
          border-color: var(--border);
          color: var(--text-muted);
          cursor: not-allowed;
        }

        .plan-card.featured .upgrade-btn:not(.disabled) {
          background: var(--gradient);
          color: white;
          border: none;
        }

        /* Payment Modal (Light) */
        .payment-modal-overlay {
          position: fixed;
          top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(17, 24, 39, 0.6);
          backdrop-filter: blur(12px);
          display: flex; justify-content: center; align-items: center;
          z-index: 2000; padding: 24px;
        }

        .payment-modal {
          max-width: 520px;
          width: 100%;
          padding: 56px;
          position: relative;
          text-align: center;
          background: #fff;
        }

        .close-modal {
          position: absolute;
          top: 24px; right: 24px;
          background: none; border: none;
          color: var(--text-muted); cursor: pointer;
        }

        .modal-icon { color: var(--primary); margin-bottom: 32px; display: inline-block; }

        .payment-modal h2 { margin-bottom: 16px; font-weight: 900; }
        .instr { color: var(--text-muted); margin-bottom: 40px; font-weight: 500; }

        .payment-box {
          background: var(--bg-input);
          padding: 32px;
          border-radius: 20px;
          border: 1px solid var(--border);
          margin-bottom: 40px;
        }

        .payment-box .label { font-size: 11px; font-weight: 900; color: var(--text-muted); letter-spacing: 1.5px; }
        .number-val { font-size: 32px; font-weight: 950; color: var(--primary); margin: 12px 0; }
        .methods { font-size: 13px; font-weight: 700; color: var(--text-muted); }

        .submit-payment-btn {
          width: 100%;
          background: var(--gradient);
          color: white;
          border: none;
          padding: 18px;
          border-radius: 14px;
          font-weight: 900;
          cursor: pointer;
          transition: var(--transition);
          font-size: 16px;
          box-shadow: 0 4px 15px rgba(128, 0, 0, 0.2);
        }

        .alert-toast {
          padding: 14px;
          border-radius: 12px;
          margin-bottom: 24px;
          font-size: 14px;
          font-weight: 700;
        }
        .alert-toast.success { background: rgba(16, 185, 129, 0.1); color: #059669; }
        .alert-toast.error { background: rgba(239, 68, 68, 0.1); color: #dc2626; }
      `}</style>
    </div>
  );
};

export default Subscriptions;
