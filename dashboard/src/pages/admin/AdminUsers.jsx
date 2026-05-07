import React, { useState, useEffect } from 'react';
import { Search, Edit2, Shield, Trash2, Check, X } from 'lucide-react';
import axios from 'axios';
import API_BASE_URL from '../../config';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ plan: 'free', daily_limit: 20 });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (user) => {
    setEditing(user._id);
    setEditForm({ plan: user.plan, daily_limit: user.daily_limit });
  };

  const handleUpdate = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_BASE_URL}/api/admin/users/${id}`, editForm, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setEditing(null);
      fetchUsers();
    } catch (err) {
      alert('Update failed');
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-users animate-fade">
      <div className="section-header-top">
        <div className="title-group">
          <h1>User Management</h1>
          <p>Configure limits and manage user accounts</p>
        </div>
        <div className="search-bar">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card table-card">
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>USER</th>
                <th>PLAN</th>
                <th>DAILY LIMIT</th>
                <th>USAGE (TOTAL)</th>
                <th>JOINED</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user._id}>
                  <td>
                    <div className="user-info-cell">
                      <div className="avatar">{user.name.charAt(0)}</div>
                      <div className="details">
                        <span className="name">{user.name}</span>
                        <span className="email">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    {editing === user._id ? (
                      <select 
                        className="admin-select"
                        value={editForm.plan}
                        onChange={(e) => setEditForm({...editForm, plan: e.target.value})}
                      >
                        <option value="free">Free</option>
                        <option value="standard">Standard</option>
                        <option value="premium">Premium</option>
                      </select>
                    ) : (
                      <span className={`plan-pill ${user.plan}`}>{user.plan.toUpperCase()}</span>
                    )}
                  </td>
                  <td>
                    {editing === user._id ? (
                      <input 
                        type="number" 
                        className="admin-input-small"
                        value={editForm.daily_limit}
                        onChange={(e) => setEditForm({...editForm, daily_limit: parseInt(e.target.value)})}
                      />
                    ) : (
                      <span className="limit-val">{user.daily_limit} / day</span>
                    )}
                  </td>
                  <td>{user.total_usage}</td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="actions-cell">
                      {editing === user._id ? (
                        <>
                          <button className="btn-icon check" onClick={() => handleUpdate(user._id)}><Check size={18} /></button>
                          <button className="btn-icon x" onClick={() => setEditing(null)}><X size={18} /></button>
                        </>
                      ) : (
                        <>
                          <button className="btn-icon edit" onClick={() => startEdit(user)}><Edit2 size={16} /></button>
                          <button className="btn-icon trash"><Trash2 size={16} /></button>
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
        .section-header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
        .section-header-top h1 { font-size: 28px; font-weight: 900; margin-bottom: 4px; }
        .section-header-top p { color: var(--text-muted); font-size: 14px; }

        .search-bar { 
          display: flex; align-items: center; gap: 12px; 
          background: #fff; border: 1px solid var(--border); 
          padding: 10px 18px; border-radius: 12px; width: 320px;
        }
        .search-bar input { border: none; outline: none; width: 100%; font-size: 14px; }

        .table-card { padding: 0; overflow: hidden; }
        .admin-table { width: 100%; border-collapse: collapse; }
        .admin-table th { text-align: left; padding: 16px 24px; font-size: 11px; font-weight: 900; color: var(--text-muted); border-bottom: 1px solid var(--border); }
        .admin-table td { padding: 16px 24px; border-bottom: 1px solid var(--border); font-size: 14px; }

        .user-info-cell { display: flex; align-items: center; gap: 12px; }
        .avatar { width: 36px; height: 36px; border-radius: 10px; background: var(--bg-input); display: flex; align-items: center; justify-content: center; font-weight: 900; color: var(--primary); }
        .details { display: flex; flex-direction: column; }
        .details .name { font-weight: 700; color: var(--text); }
        .details .email { font-size: 12px; color: var(--text-muted); }

        .plan-pill { font-size: 10px; font-weight: 900; padding: 4px 8px; border-radius: 6px; }
        .plan-pill.free { background: #f3f4f6; color: #6b7280; }
        .plan-pill.standard { background: rgba(128, 0, 0, 0.08); color: var(--primary); }
        .plan-pill.premium { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }

        .actions-cell { display: flex; gap: 8px; }
        .btn-icon { width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border); background: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; color: var(--text-muted); }
        .btn-icon:hover { border-color: var(--primary); color: var(--primary); }
        .btn-icon.check { color: #10b981; }
        .btn-icon.x { color: #ef4444; }

        .admin-select { padding: 6px; border-radius: 6px; border: 1px solid var(--border); outline: none; }
        .admin-input-small { width: 80px; padding: 6px; border-radius: 6px; border: 1px solid var(--border); outline: none; }
      `}</style>
    </div>
  );
};

export default AdminUsers;
