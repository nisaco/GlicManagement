import { useEffect, useState } from 'react';
import axios from 'axios';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const emptyForm = { member:'', title:'', amount:'', dueDate:'', notes:'' };

export default function Pledges() {
  const [pledges,   setPledges]   = useState([]);
  const [members,   setMembers]   = useState([]);
  const [showForm,  setShowForm]  = useState(false);
  const [showPay,   setShowPay]   = useState(null); // pledge being paid
  const [payAmount, setPayAmount] = useState('');
  const [form,      setForm]      = useState(emptyForm);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState('active');

  const fetchAll = async () => {
    setLoading(true);
    const [p, m] = await Promise.all([
      axios.get('/api/pledges'),
      axios.get('/api/members', { params: { status:'active' } }),
    ]);
    setPledges(p.data); setMembers(m.data); setLoading(false);
  };
  useEffect(() => { fetchAll(); }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    await axios.post('/api/pledges', form);
    setShowForm(false); setForm(emptyForm); fetchAll();
  };

  const handlePay = async () => {
    if (!payAmount || !showPay) return;
    const newFulfilled = showPay.fulfilled + Number(payAmount);
    await axios.put(`/api/pledges/${showPay._id}`, { fulfilled: newFulfilled });
    setShowPay(null); setPayAmount(''); fetchAll();
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this pledge?')) return;
    await axios.delete(`/api/pledges/${id}`); fetchAll();
  };

  const filtered = pledges.filter(p => filter === 'all' || p.status === filter);
  const totalPledged   = pledges.reduce((s,p) => s + p.amount, 0);
  const totalFulfilled = pledges.reduce((s,p) => s + p.fulfilled, 0);
  const totalPending   = totalPledged - totalFulfilled;

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <div className="pg-breadcrumb">Gospel Light International Church</div>
          <h1 className="pg-title">Pledges <span style={{ color:'var(--gold2)', fontStyle:'italic' }}>Tracking</span></h1>
          <p className="pg-sub">Track member pledges and fulfilment</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-gold">+ New Pledge</button>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:24 }} className="stagger stats-4">
        {[
          { label:'Total Pledged',    value:`GH₵ ${totalPledged.toLocaleString()}`,   color:'var(--gold2)' },
          { label:'Total Fulfilled',  value:`GH₵ ${totalFulfilled.toLocaleString()}`, color:'var(--green)' },
          { label:'Outstanding',      value:`GH₵ ${totalPending.toLocaleString()}`,   color:'var(--red)'   },
        ].map(s => (
          <div key={s.label} className="glass-card animate-up" style={{ padding:'20px 22px' }}>
            <div style={{ fontSize:10.5, fontWeight:600, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12 }}>{s.label}</div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:700, color:s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display:'flex', gap:8, marginBottom:18, flexWrap:'wrap' }}>
        {['all','active','fulfilled','cancelled'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding:'7px 16px', borderRadius:20, fontSize:12.5, cursor:'pointer',
            fontFamily:'var(--font-body)', transition:'all 0.18s', border:'none',
            background: filter===f ? 'linear-gradient(135deg,var(--gold),#8B6420)' : 'rgba(255,255,255,0.06)',
            color:      filter===f ? 'var(--navy)' : 'rgba(255,255,255,0.5)',
            fontWeight: filter===f ? 600 : 400,
          }}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>
        ))}
      </div>

      {/* Pledges list */}
      <div className="glass-card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>{['Member','Pledge','Pledged','Fulfilled','Remaining','Progress','Due Date','Status',''].map(h=><th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={9} style={{ padding:28, textAlign:'center' }}><div className="spinner"/></td></tr>}
              {!loading && filtered.map(p => {
                const pct = Math.min(100, Math.round((p.fulfilled / p.amount) * 100));
                const remaining = p.amount - p.fulfilled;
                return (
                  <tr key={p._id}>
                    <td style={{ fontWeight:500 }}>{p.member?.firstName} {p.member?.lastName}</td>
                    <td style={{ color:'rgba(255,255,255,0.8)' }}>{p.title}</td>
                    <td style={{ color:'var(--gold2)', fontWeight:500 }}>GH₵ {p.amount.toLocaleString()}</td>
                    <td style={{ color:'var(--green)', fontWeight:500 }}>GH₵ {p.fulfilled.toLocaleString()}</td>
                    <td style={{ color: remaining > 0 ? 'var(--red)' : 'var(--green)', fontWeight:500 }}>
                      {remaining > 0 ? `GH₵ ${remaining.toLocaleString()}` : '—'}
                    </td>
                    <td style={{ minWidth:100 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ flex:1, height:5, background:'rgba(255,255,255,0.07)', borderRadius:3, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${pct}%`, background: pct===100 ? 'var(--green)' : 'linear-gradient(90deg,var(--gold),var(--gold2))', borderRadius:3 }}/>
                        </div>
                        <span style={{ fontSize:11, color:'var(--muted)', minWidth:28 }}>{pct}%</span>
                      </div>
                    </td>
                    <td style={{ color:'var(--muted)', fontSize:12 }}>
                      {p.dueDate ? new Date(p.dueDate).toLocaleDateString('en-GH') : '—'}
                    </td>
                    <td>
                      <span style={{
                        fontSize:11, fontWeight:600, padding:'3px 9px', borderRadius:20,
                        background: p.status==='fulfilled' ? 'rgba(46,204,113,0.1)' : p.status==='cancelled' ? 'rgba(255,255,255,0.06)' : 'rgba(201,148,58,0.1)',
                        color:      p.status==='fulfilled' ? 'var(--green)'          : p.status==='cancelled' ? 'var(--muted)'           : 'var(--gold2)',
                        border:     p.status==='fulfilled' ? '1px solid rgba(46,204,113,0.2)' : p.status==='cancelled' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(201,148,58,0.2)',
                      }}>{p.status}</span>
                    </td>
                    <td>
                      <div style={{ display:'flex', gap:6 }}>
                        {p.status === 'active' && (
                          <button onClick={() => { setShowPay(p); setPayAmount(''); }} className="btn btn-success btn-sm">+ Pay</button>
                        )}
                        <button onClick={() => handleDelete(p._id)} className="btn btn-danger btn-sm">✕</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && !filtered.length && (
                <tr><td colSpan={9} style={{ padding:36, textAlign:'center', color:'var(--muted)' }}>No pledges found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Pledge Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-head">
              <span className="modal-title">New Pledge</span>
              <button onClick={() => setShowForm(false)} style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.6)', width:32, height:32, borderRadius:8, cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  <div style={{ gridColumn:'1/-1' }}>
                    <label className="field-label">Member *</label>
                    <select value={form.member} onChange={e => setForm(f => ({...f, member:e.target.value}))} required className="field-input">
                      <option value="">— Select member —</option>
                      {members.map(m => <option key={m._id} value={m._id}>{m.firstName} {m.lastName}</option>)}
                    </select>
                  </div>
                  <div style={{ gridColumn:'1/-1' }}>
                    <label className="field-label">Pledge Title *</label>
                    <input type="text" value={form.title} onChange={e => setForm(f => ({...f, title:e.target.value}))} required className="field-input" placeholder="e.g. Building Fund Pledge, Annual Pledge"/>
                  </div>
                  <div>
                    <label className="field-label">Pledge Amount (GH₵) *</label>
                    <input type="number" value={form.amount} onChange={e => setForm(f => ({...f, amount:e.target.value}))} required min="1" className="field-input" placeholder="e.g. 1000"/>
                  </div>
                  <div>
                    <label className="field-label">Due Date</label>
                    <input type="date" value={form.dueDate} onChange={e => setForm(f => ({...f, dueDate:e.target.value}))} className="field-input"/>
                  </div>
                  <div style={{ gridColumn:'1/-1' }}>
                    <label className="field-label">Notes</label>
                    <textarea value={form.notes} onChange={e => setForm(f => ({...f, notes:e.target.value}))} className="field-input" style={{ resize:'vertical', minHeight:60 }} placeholder="Optional"/>
                  </div>
                </div>
                <div style={{ display:'flex', gap:10, marginTop:20, justifyContent:'flex-end' }}>
                  <button type="button" onClick={() => setShowForm(false)} className="btn btn-ghost">Cancel</button>
                  <button type="submit" className="btn btn-gold">Save Pledge</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPay && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth:400 }}>
            <div className="modal-head">
              <span className="modal-title">Record Pledge Payment</span>
              <button onClick={() => setShowPay(null)} style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.6)', width:32, height:32, borderRadius:8, cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:10, padding:'14px 16px', marginBottom:18 }}>
                <div style={{ fontSize:13, color:'var(--muted)', marginBottom:4 }}>{showPay.member?.firstName} {showPay.member?.lastName}</div>
                <div style={{ fontSize:15, fontWeight:500, color:'var(--white)', marginBottom:8 }}>{showPay.title}</div>
                <div style={{ display:'flex', gap:16, fontSize:12 }}>
                  <span style={{ color:'var(--muted)' }}>Pledged: <strong style={{ color:'var(--gold2)' }}>GH₵ {showPay.amount.toLocaleString()}</strong></span>
                  <span style={{ color:'var(--muted)' }}>Paid so far: <strong style={{ color:'var(--green)' }}>GH₵ {showPay.fulfilled.toLocaleString()}</strong></span>
                  <span style={{ color:'var(--muted)' }}>Remaining: <strong style={{ color:'var(--red)' }}>GH₵ {(showPay.amount-showPay.fulfilled).toLocaleString()}</strong></span>
                </div>
              </div>
              <label className="field-label">Amount Being Paid Now (GH₵) *</label>
              <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} min="1" max={showPay.amount - showPay.fulfilled} className="field-input" placeholder={`Max GH₵ ${(showPay.amount-showPay.fulfilled).toLocaleString()}`} autoFocus/>
              <div style={{ display:'flex', gap:10, marginTop:20, justifyContent:'flex-end' }}>
                <button onClick={() => setShowPay(null)} className="btn btn-ghost">Cancel</button>
                <button onClick={handlePay} disabled={!payAmount} className="btn btn-gold">Record Payment</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
