import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const ROLES = ['admin', 'secretary', 'treasurer'];

const ROLE_INFO = {
  admin:     { color:'var(--gold2)', bg:'rgba(201,148,58,0.1)',  border:'rgba(201,148,58,0.2)',  desc:'Full access to everything including user management' },
  secretary: { color:'var(--blue)',  bg:'rgba(91,141,239,0.1)',  border:'rgba(91,141,239,0.2)',  desc:'Members, attendance, reminders, birthdays, cards'    },
  treasurer: { color:'var(--green)', bg:'rgba(46,204,113,0.1)',  border:'rgba(46,204,113,0.2)',  desc:'Payments, pledges, reports — read-only member access' },
};

const emptyForm = { name:'', email:'', password:'', role:'secretary' };

export default function Staff() {
  const { user: me } = useAuth();
  const [users,    setUsers]    = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showPwd,  setShowPwd]  = useState(false);
  const [form,     setForm]     = useState(emptyForm);
  const [pwdForm,  setPwdForm]  = useState({ currentPassword:'', newPassword:'', confirm:'' });
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await axios.get('/api/auth/users');
    setUsers(data); setLoading(false);
  };
  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async e => {
    e.preventDefault(); setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    try {
      await axios.post('/api/auth/users', form);
      setShowForm(false); setForm(emptyForm);
      setSuccess('User account created successfully!');
      fetchUsers();
      setTimeout(() => setSuccess(''), 3500);
    } catch (err) { setError(err.response?.data?.message || 'Failed to create user.'); }
  };

  const handleRoleChange = async (id, role) => {
    try {
      await axios.put(`/api/auth/users/${id}`, { role });
      fetchUsers();
    } catch (err) { alert(err.response?.data?.message || 'Failed to update role.'); }
  };

  const handleDelete = async id => {
    if (!window.confirm('Remove this staff account? They will no longer be able to log in.')) return;
    try {
      await axios.delete(`/api/auth/users/${id}`);
      fetchUsers();
    } catch (err) { alert(err.response?.data?.message || 'Failed to remove user.'); }
  };

  const handlePwdChange = async e => {
    e.preventDefault(); setError('');
    if (pwdForm.newPassword !== pwdForm.confirm) { setError('New passwords do not match.'); return; }
    if (pwdForm.newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    try {
      await axios.put('/api/auth/me/password', {
        currentPassword: pwdForm.currentPassword,
        newPassword:     pwdForm.newPassword,
      });
      setShowPwd(false);
      setPwdForm({ currentPassword:'', newPassword:'', confirm:'' });
      setSuccess('Password updated successfully!');
      setTimeout(() => setSuccess(''), 3500);
    } catch (err) { setError(err.response?.data?.message || 'Failed to update password.'); }
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <div className="pg-breadcrumb">Gospel Light International Church</div>
          <h1 className="pg-title">Staff <span style={{ color:'var(--gold2)', fontStyle:'italic' }}>Management</span></h1>
          <p className="pg-sub">Manage who can log in and what they can access</p>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button onClick={() => { setShowPwd(true); setError(''); }} className="btn btn-ghost">🔑 Change My Password</button>
          <button onClick={() => { setShowForm(true); setError(''); }} className="btn btn-gold">+ Add Staff Account</button>
        </div>
      </div>

      {success && (
        <div style={{ background:'rgba(46,204,113,0.12)', border:'1px solid rgba(46,204,113,0.25)', color:'var(--green)', fontSize:13, padding:'11px 16px', borderRadius:10, marginBottom:18 }}>
          ✓ {success}
        </div>
      )}

      {/* Role guide */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:24 }} className="stagger stats-4">
        {ROLES.map(role => {
          const ri = ROLE_INFO[role];
          return (
            <div key={role} className="glass-card animate-up" style={{ padding:'18px 20px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, background:ri.bg, color:ri.color, border:`1px solid ${ri.border}`, textTransform:'capitalize' }}>{role}</span>
                <span style={{ fontSize:12, color:'var(--muted)' }}>
                  {users.filter(u => u.role === role).length} user{users.filter(u => u.role === role).length !== 1 ? 's' : ''}
                </span>
              </div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.55)', lineHeight:1.6 }}>{ri.desc}</div>
            </div>
          );
        })}
      </div>

      {/* Users table */}
      <div className="glass-card">
        <div style={{ padding:'16px 22px', borderBottom:'1px solid var(--border)', background:'rgba(255,255,255,0.02)' }}>
          <span style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:600, color:'var(--white)' }}>
            Staff Accounts ({users.length})
          </span>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>{['Name','Email','Role','Date Added',''].map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={5} style={{ padding:28, textAlign:'center' }}><div className="spinner"/></td></tr>}
              {!loading && users.map(u => {
                const ri   = ROLE_INFO[u.role] || ROLE_INFO.secretary;
                const isMe = u._id === me?._id;
                return (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:34, height:34, borderRadius:9, background:'linear-gradient(135deg,var(--navy3),var(--navy4))', border:'1px solid var(--border-gold)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'var(--gold2)', flexShrink:0 }}>
                          {u.name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight:500, color:'var(--white)' }}>
                            {u.name}
                            {isMe && <span style={{ marginLeft:7, fontSize:10, padding:'2px 7px', borderRadius:20, background:'rgba(201,148,58,0.15)', color:'var(--gold2)' }}>You</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color:'var(--muted)' }}>{u.email}</td>
                    <td>
                      {isMe ? (
                        <span style={{ fontSize:11.5, fontWeight:600, padding:'4px 10px', borderRadius:20, background:ri.bg, color:ri.color, border:`1px solid ${ri.border}`, textTransform:'capitalize' }}>
                          {u.role}
                        </span>
                      ) : (
                        <select value={u.role} onChange={e => handleRoleChange(u._id, e.target.value)}
                          style={{ padding:'5px 10px', borderRadius:8, border:`1px solid ${ri.border}`, background:ri.bg, color:ri.color, fontSize:12, fontFamily:'var(--font-body)', cursor:'pointer', outline:'none', fontWeight:600 }}>
                          {ROLES.map(r => (
                            <option key={r} value={r} style={{ background:'var(--navy3)', color:'#fff' }}>
                              {r.charAt(0).toUpperCase()+r.slice(1)}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td style={{ color:'var(--muted)', fontSize:12 }}>
                      {new Date(u.createdAt).toLocaleDateString('en-GH',{ day:'numeric', month:'short', year:'numeric' })}
                    </td>
                    <td>
                      {!isMe && (
                        <button onClick={() => handleDelete(u._id)} className="btn btn-danger btn-sm">Remove</button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!loading && !users.length && (
                <tr><td colSpan={5} style={{ padding:32, textAlign:'center', color:'var(--muted)' }}>No staff accounts yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create user modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth:460 }}>
            <div className="modal-head">
              <span className="modal-title">Add Staff Account</span>
              <button onClick={() => { setShowForm(false); setError(''); }} style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.6)', width:32, height:32, borderRadius:8, cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
            </div>
            <div className="modal-body">
              {error && (
                <div style={{ background:'rgba(224,85,85,0.12)', border:'1px solid rgba(224,85,85,0.25)', color:'#FCA5A5', fontSize:13, padding:'10px 14px', borderRadius:10, marginBottom:16 }}>
                  ⚠ {error}
                </div>
              )}
              <form onSubmit={handleCreate}>
                <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  <div>
                    <label className="field-label">Full Name *</label>
                    <input type="text" value={form.name} onChange={e => setForm(f => ({...f, name:e.target.value}))} required className="field-input" placeholder="e.g. Sister Mary Mensah"/>
                  </div>
                  <div>
                    <label className="field-label">Email Address *</label>
                    <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email:e.target.value}))} required className="field-input" placeholder="e.g. mary@glicghana.org"/>
                  </div>
                  <div>
                    <label className="field-label">Temporary Password *</label>
                    <input type="password" value={form.password} onChange={e => setForm(f => ({...f, password:e.target.value}))} required className="field-input" placeholder="At least 6 characters"/>
                  </div>
                  <div>
                    <label className="field-label">Role *</label>
                    <select value={form.role} onChange={e => setForm(f => ({...f, role:e.target.value}))} className="field-input">
                      <option value="secretary">Secretary — Members, Attendance, Reminders</option>
                      <option value="treasurer">Treasurer — Payments, Pledges, Reports</option>
                      <option value="admin">Admin — Full Access</option>
                    </select>
                  </div>
                  <div style={{ padding:'12px 14px', borderRadius:10, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', fontSize:12, color:'var(--muted)', lineHeight:1.6 }}>
                    💡 Share the email and temporary password with the staff member. They can change their password after logging in via Staff Management.
                  </div>
                </div>
                <div style={{ display:'flex', gap:10, marginTop:20, justifyContent:'flex-end' }}>
                  <button type="button" onClick={() => { setShowForm(false); setError(''); }} className="btn btn-ghost">Cancel</button>
                  <button type="submit" className="btn btn-gold">Create Account</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Change password modal */}
      {showPwd && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth:420 }}>
            <div className="modal-head">
              <span className="modal-title">Change My Password</span>
              <button onClick={() => { setShowPwd(false); setError(''); }} style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.6)', width:32, height:32, borderRadius:8, cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
            </div>
            <div className="modal-body">
              {error && (
                <div style={{ background:'rgba(224,85,85,0.12)', border:'1px solid rgba(224,85,85,0.25)', color:'#FCA5A5', fontSize:13, padding:'10px 14px', borderRadius:10, marginBottom:16 }}>
                  ⚠ {error}
                </div>
              )}
              <form onSubmit={handlePwdChange}>
                <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  <div>
                    <label className="field-label">Current Password *</label>
                    <input type="password" value={pwdForm.currentPassword} onChange={e => setPwdForm(f => ({...f, currentPassword:e.target.value}))} required className="field-input" placeholder="Your current password"/>
                  </div>
                  <div>
                    <label className="field-label">New Password *</label>
                    <input type="password" value={pwdForm.newPassword} onChange={e => setPwdForm(f => ({...f, newPassword:e.target.value}))} required className="field-input" placeholder="At least 6 characters"/>
                  </div>
                  <div>
                    <label className="field-label">Confirm New Password *</label>
                    <input type="password" value={pwdForm.confirm} onChange={e => setPwdForm(f => ({...f, confirm:e.target.value}))} required className="field-input" placeholder="Repeat new password"/>
                  </div>
                </div>
                <div style={{ display:'flex', gap:10, marginTop:20, justifyContent:'flex-end' }}>
                  <button type="button" onClick={() => { setShowPwd(false); setError(''); }} className="btn btn-ghost">Cancel</button>
                  <button type="submit" className="btn btn-gold">Update Password</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}