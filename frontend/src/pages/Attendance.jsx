import { useEffect, useState } from 'react';
import axios from 'axios';

const SERVICE_LABELS = { sunday_main:'🙏 Sunday Main', sunday_second:'🙏 Sunday Second', midweek:'📖 Midweek', friday:'🔥 Friday Prayer', special:'⭐ Special Service' };

export default function Attendance() {
  const [records,  setRecords]  = useState([]);
  const [members,  setMembers]  = useState([]);
  const [stats,    setStats]    = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [present,  setPresent]  = useState(new Set());
  const [manualCount, setManualCount] = useState('');
  const [form, setForm] = useState({ date:new Date().toISOString().slice(0,10), service:'sunday_main', notes:'', useManual:false });

  const fetchAll = async () => {
    setLoading(true);
    const [r,m,s] = await Promise.all([axios.get('/api/attendance'),axios.get('/api/members',{params:{status:'active'}}),axios.get('/api/attendance/stats')]);
    setRecords(r.data); setMembers(m.data); setStats(s.data); setLoading(false);
  };
  useEffect(() => { fetchAll(); }, []);

  const toggle   = id  => setPresent(p => { const n=new Set(p); n.has(id)?n.delete(id):n.add(id); return n; });
  const markAll  = ()  => setPresent(new Set(members.map(m=>m._id)));
  const clearAll = ()  => setPresent(new Set());

  const handleSubmit = async e => {
    e.preventDefault();
    const totalCount = form.useManual ? Number(manualCount) : present.size;
    await axios.post('/api/attendance', { date:form.date, service:form.service, members:form.useManual?[]:[...present], totalCount, notes:form.notes });
    setShowForm(false); setPresent(new Set()); setManualCount(''); fetchAll();
  };
  const handleDelete = async id => {
    if (!window.confirm('Delete this record?')) return;
    await axios.delete(`/api/attendance/${id}`); fetchAll();
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <div className="pg-breadcrumb">Gospel Light International Church</div>
          <h1 className="pg-title">Attendance</h1>
          <p className="pg-sub">Track service attendance records</p>
        </div>
        <button onClick={()=>setShowForm(true)} className="btn btn-gold">+ Mark Attendance</button>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:24 }} className="stagger">
        {[
          { label:'Services This Month', value:stats?.thisMonthServices??'—' },
          { label:'Avg Attendance',      value:stats?.avgAttendance??'—' },
          { label:'Last Service',        value:stats?.lastServiceCount??'—', sub:stats?.lastServiceDate?new Date(stats.lastServiceDate).toLocaleDateString('en-GH'):'' },
        ].map(s => (
          <div key={s.label} className="glass-card animate-up" style={{ padding:'20px 22px' }}>
            <div style={{ fontSize:10.5, fontWeight:600, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12 }}>{s.label}</div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:32, fontWeight:700, color:'var(--white)' }}>{s.value}</div>
            {s.sub && <div style={{ fontSize:12, color:'var(--muted)', marginTop:6 }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>{['Date','Service','Count','Notes',''].map(h=><th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={5} style={{ padding:28, textAlign:'center' }}><div className="spinner"/></td></tr>}
              {!loading && records.map(r => (
                <tr key={r._id}>
                  <td style={{ fontWeight:500 }}>{new Date(r.date).toLocaleDateString('en-GH',{weekday:'short',day:'numeric',month:'short',year:'numeric'})}</td>
                  <td style={{ color:'rgba(255,255,255,0.7)' }}>{SERVICE_LABELS[r.service]||r.service}</td>
                  <td><span style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:700, color:'var(--gold2)' }}>{r.totalCount}</span><span style={{ fontSize:12, color:'var(--muted)', marginLeft:4 }}>people</span></td>
                  <td style={{ color:'var(--muted)', fontSize:13 }}>{r.notes||'—'}</td>
                  <td><button onClick={()=>handleDelete(r._id)} className="btn btn-danger btn-sm">Delete</button></td>
                </tr>
              ))}
              {!loading && !records.length && <tr><td colSpan={5} style={{ padding:36, textAlign:'center', color:'var(--muted)' }}>No records yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-box modal-box-lg">
            <div className="modal-head">
              <span className="modal-title">Mark Attendance</span>
              <button onClick={()=>setShowForm(false)} style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.6)', width:32, height:32, borderRadius:8, cursor:'pointer', fontSize:16 }}>✕</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16 }}>
                  <div>
                    <label className="field-label">Date *</label>
                    <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} required className="field-input"/>
                  </div>
                  <div>
                    <label className="field-label">Service *</label>
                    <select value={form.service} onChange={e=>setForm(f=>({...f,service:e.target.value}))} className="field-input">
                      {Object.entries(SERVICE_LABELS).map(([v,l])=><option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                </div>

                {/* Mode toggle */}
                <div style={{ display:'flex', gap:10, marginBottom:16 }}>
                  {[{k:false,label:'✅ Tick Members'},{k:true,label:'🔢 Enter Count Only'}].map(o => (
                    <button type="button" key={String(o.k)} onClick={()=>setForm(f=>({...f,useManual:o.k}))} style={{ flex:1, padding:10, borderRadius:10, fontSize:13, cursor:'pointer', fontFamily:'var(--font-body)', transition:'all 0.18s',
                      background: form.useManual===o.k ? 'rgba(201,148,58,0.12)' : 'rgba(255,255,255,0.04)',
                      border:     form.useManual===o.k ? '1px solid rgba(201,148,58,0.3)' : '1px solid rgba(255,255,255,0.08)',
                      color:      form.useManual===o.k ? 'var(--gold2)' : 'rgba(255,255,255,0.5)',
                      fontWeight: form.useManual===o.k ? 500 : 400,
                    }}>{o.label}</button>
                  ))}
                </div>

                {form.useManual ? (
                  <div style={{ marginBottom:16 }}>
                    <label className="field-label">Total Count *</label>
                    <input type="number" value={manualCount} onChange={e=>setManualCount(e.target.value)} required min="1" placeholder="e.g. 120" className="field-input"/>
                  </div>
                ) : (
                  <div style={{ marginBottom:16 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                      <label className="field-label" style={{ marginBottom:0 }}>Members Present ({present.size} selected)</label>
                      <div style={{ display:'flex', gap:6 }}>
                        <button type="button" onClick={markAll} className="btn btn-ghost btn-sm">Mark All</button>
                        <button type="button" onClick={clearAll} className="btn btn-ghost btn-sm">Clear</button>
                      </div>
                    </div>
                    <div style={{ border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, maxHeight:260, overflowY:'auto', background:'rgba(255,255,255,0.02)' }}>
                      {members.map(m => (
                        <div key={m._id} onClick={()=>toggle(m._id)} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderBottom:'1px solid rgba(255,255,255,0.04)', cursor:'pointer', transition:'background 0.15s',
                          background: present.has(m._id) ? 'rgba(201,148,58,0.07)' : 'transparent' }}>
                          <div style={{ width:17,height:17,borderRadius:5,flexShrink:0, border:`1.5px solid ${present.has(m._id)?'var(--gold)':'rgba(255,255,255,0.2)'}`, background:present.has(m._id)?'var(--gold)':'transparent', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}>
                            {present.has(m._id) && <span style={{ color:'var(--navy)', fontSize:11, fontWeight:700 }}>✓</span>}
                          </div>
                          <div style={{ width:30,height:30,borderRadius:8,background:'rgba(201,148,58,0.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:600,color:'var(--gold2)',flexShrink:0 }}>
                            {m.firstName[0]}{m.lastName[0]}
                          </div>
                          <span style={{ fontSize:13, color:present.has(m._id)?'var(--white)':'rgba(255,255,255,0.6)' }}>{m.firstName} {m.lastName}</span>
                          <span style={{ fontSize:11, color:'var(--muted)', marginLeft:'auto', textTransform:'capitalize' }}>{m.role}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ marginBottom:16 }}>
                  <label className="field-label">Notes</label>
                  <input type="text" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="e.g. Harvest Sunday, Guest preacher..." className="field-input"/>
                </div>

                <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                  <button type="button" onClick={()=>setShowForm(false)} className="btn btn-ghost">Cancel</button>
                  <button type="submit" className="btn btn-gold">Save Attendance</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
