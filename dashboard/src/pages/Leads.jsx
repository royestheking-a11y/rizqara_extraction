import React, { useState, useEffect } from 'react';
import { Search, Download, Trash2, ExternalLink, Filter, MapPin, Phone, Globe, Mail } from 'lucide-react';
import axios from 'axios';
import API_BASE_URL from '../config';

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/api/leads`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setLeads(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = leads.filter(l => 
    (l.name?.toLowerCase().includes(search.toLowerCase()) || 
     l.category?.toLowerCase().includes(search.toLowerCase())) &&
    (filter === 'all' || (filter === 'scored' && l.score > 0) || (filter === 'web' && l.website))
  );

  const exportLeads = () => {
    if (!filteredLeads.length) return;
    const headers = ['Name', 'Category', 'Phone', 'Website', 'Email', 'Address', 'Score'];
    const rows = filteredLeads.map(l => [
      `"${l.name}"`, `"${l.category}"`, `"${l.phone}"`, `"${l.website}"`, `"${l.email}"`, `"${l.address}"`, `"${l.score}%"`
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(["\ufeff" + csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my_leads_${new Date().getTime()}.csv`;
    a.click();
  };

  return (
    <div className="leads-page animate-fade">
      <div className="section-header-top">
        <div className="title-group">
          <h1>Lead Intelligence</h1>
          <p>Access your securely stored business leads and insights</p>
        </div>
        <div className="action-group">
          <button className="btn-premium" onClick={exportLeads}>
            <Download size={18} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="filters-container">
        <div className="search-wrap">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search leads by name or industry..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="pill-filters">
          <button className={`pill ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All Leads</button>
          <button className={`pill ${filter === 'scored' ? 'active' : ''}`} onClick={() => setFilter('scored')}>High Score</button>
          <button className={`pill ${filter === 'web' ? 'active' : ''}`} onClick={() => setFilter('web')}>With Website</button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
           <div className="spinner"></div>
           <p>Syncing your leads...</p>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
             <Filter size={48} />
          </div>
          <h2>No Leads Found</h2>
          <p>Start extracting from Google Maps to build your database.</p>
        </div>
      ) : (
        <div className="leads-grid">
          {filteredLeads.map(lead => (
            <div key={lead._id} className="lead-card card">
              <div className="card-header">
                <div className="lead-meta">
                  <span className="cat-tag">{lead.category || 'Business'}</span>
                  <div className="score-badge" style={{ background: lead.score > 70 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(128, 0, 0, 0.05)', color: lead.score > 70 ? '#10b981' : 'var(--primary)' }}>
                    {lead.score || 0}% Match
                  </div>
                </div>
                <h3>{lead.name}</h3>
              </div>
              
              <div className="card-body">
                <div className="info-row">
                  <MapPin size={16} />
                  <span>{lead.address || 'Address not available'}</span>
                </div>
                {lead.phone && (
                  <div className="info-row">
                    <Phone size={16} />
                    <span>{lead.phone}</span>
                  </div>
                )}
                {lead.email && (
                  <div className="info-row highlight">
                    <Mail size={16} />
                    <span>{lead.email}</span>
                  </div>
                )}
              </div>

              <div className="card-footer">
                {lead.website ? (
                  <a href={lead.website} target="_blank" rel="noreferrer" className="btn-visit">
                    <Globe size={14} />
                    <span>Visit Site</span>
                    <ExternalLink size={12} />
                  </a>
                ) : (
                  <span className="no-web">No Website</span>
                )}
                <button className="btn-delete-mini">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx="true">{`
        .leads-page { padding-bottom: 40px; }
        .section-header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
        .title-group h1 { font-size: 28px; font-weight: 900; color: var(--text); margin-bottom: 4px; }
        .title-group p { color: var(--text-muted); font-size: 14px; }

        .btn-premium {
          display: flex; align-items: center; gap: 10px; background: var(--gradient);
          color: white; border: none; padding: 12px 24px; border-radius: 12px;
          font-weight: 800; cursor: pointer; transition: var(--transition);
          box-shadow: 0 4px 15px rgba(128, 0, 0, 0.2);
        }
        .btn-premium:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(128, 0, 0, 0.3); }

        .filters-container { display: flex; gap: 20px; align-items: center; margin-bottom: 32px; }
        .search-wrap { 
          flex: 1; display: flex; align-items: center; gap: 12px; background: white;
          border: 1px solid var(--border); padding: 12px 20px; border-radius: 14px;
        }
        .search-wrap input { border: none; outline: none; width: 100%; font-size: 14px; font-weight: 500; }
        .pill-filters { display: flex; gap: 10px; }
        .pill { 
          background: white; border: 1px solid var(--border); padding: 10px 18px; 
          border-radius: 30px; font-size: 13px; font-weight: 700; color: var(--text-muted);
          cursor: pointer; transition: var(--transition);
        }
        .pill.active { background: var(--primary); color: white; border-color: var(--primary); }

        .leads-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }
        .lead-card { 
          display: flex; flex-direction: column; padding: 24px; border-radius: 18px;
          background: white; border: 1px solid var(--border); transition: var(--transition);
        }
        .lead-card:hover { transform: translateY(-5px); border-color: var(--primary); box-shadow: 0 12px 30px rgba(0,0,0,0.08); }

        .card-header h3 { font-size: 18px; font-weight: 800; margin-bottom: 16px; color: var(--text); }
        .lead-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .cat-tag { font-size: 10px; font-weight: 900; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }
        .score-badge { font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 8px; }

        .card-body { flex: 1; display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px; }
        .info-row { display: flex; gap: 10px; align-items: flex-start; font-size: 13px; color: var(--text-muted); line-height: 1.4; }
        .info-row.highlight { color: var(--primary); font-weight: 700; }

        .card-footer { display: flex; justify-content: space-between; align-items: center; pt: 20px; border-top: 1px solid var(--border); padding-top: 20px; }
        .btn-visit { 
          display: flex; align-items: center; gap: 8px; color: var(--primary); 
          text-decoration: none; font-weight: 800; font-size: 13px;
        }
        .no-web { font-size: 12px; font-weight: 700; color: var(--text-muted); opacity: 0.5; }
        .btn-delete-mini { 
          background: none; border: none; color: var(--text-muted); 
          cursor: pointer; padding: 5px; transition: var(--transition);
        }
        .btn-delete-mini:hover { color: var(--error); }

        .loading-state, .empty-state { text-align: center; padding: 100px 20px; }
        .empty-icon { color: var(--text-muted); opacity: 0.2; margin-bottom: 20px; }
        .empty-state h2 { font-size: 22px; font-weight: 900; margin-bottom: 8px; }
        .empty-state p { color: var(--text-muted); }
      `}</style>
    </div>
  );
};

export default Leads;
