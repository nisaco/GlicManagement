import { useEffect, useState } from 'react';
import axios from 'axios';
import Receipt from '../components/Receipt';

const PAYMENT_TYPES   = ['dues','tithe','building_fund','welfare','youth_levy','offering','other'];
const PAYMENT_METHODS = ['cash','momo','bank_transfer','cheque'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const emptyForm = { member:'', amount:'', type:'dues', method:'cash', month:new Date().getMonth()+1, year:new Date().getFullYear(), reference:'', notes:'' };

const typeColor = t => ({
  tithe:         { bg:'rgba(46,204,113,0.1)',   color:'#2ECC71' },
  dues:          { bg:'rgba(201,148,58,0.1)',   color:'#E8B96A' },
  building_fund: { bg:'rgba(91,141,239,0.1)',   color:'#5B8DEF' },
  welfare:       { bg:'rgba(167,139,250,0.1)',  color:'#A78BFA' },
  youth_levy:    { bg:'rgba(251,146,60,0.1)',   color:'#FB923C' },
  offering:      { bg:'rgba(255,255,255,0.07)', color:'#8B96A8' },
  other:         { bg:'rgba(255,255,255,0.07)', color:'#8B96A8' },
}[t] || { bg:'rgba(255,255,255,0.07)', color:'#8B96A8' });

export default function Payments() {
  const [payments,   setPayments]   = useState([]);
  const [members,    setMembers]    = useState([]);
  const [showForm,   setShowForm]   = useState(false);
  const [form,       setForm]       = useState(emptyForm);
  const [loading,    setLoading]    = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [search,     setSearch]     = useState('');
  const [receiptId,  setReceiptId]  = useState(null);

  const fetchPayments = async () => {
    setLoading(true);
    const params = {};
    if (filterType !== 'all') params.type = filterType;
    const { data } = await axios.get('/api/payments', { params });
    setPayments(data); setLoading(false);
  };

  useEffect(() => {
    fetchPayments();
    axios.get('/api/members', { params:{ status:'active' } }).then(r => setMembers(r.data));
  }, [filterType]);

  const handleSubmit = async e => {
    e.preventDefault();
    await axios.post('/api/payments', form);
    setShowForm(false); setForm(emptyForm); fetchPayments();
  };
  const handleDelete = async id => {
    if (!window.confirm('Delete this payment?')) return;
    await axios.delete(`/api/payments/${id}`); fetchPayments();
  };

  const exportToCSV = () => {
    const headers = ['Member','Type','Amount (GH₵)','Month','Year','Method','Reference','Date'];
    const rows = filtered.map(p => [`${p.member?.firstName} ${p.member?.lastName}`,p.type?.replace('_',' '),p.amount,p.month?MONTHS[p.month-1]:'',p.year||'',p.method?.replace('_',' '),p.reference||'',new Date(p.createdAt).toLocaleDateString('en-GH')]);
    const csv = [headers,...rows].map(r=>r.map(v=>`"${v}"`).join(',')).join('\n');
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv],{type:'text/csv'})), download:`payments-${new Date().toISOString().slice(0,10)}.csv` });
    a.click();
  };

  const printPayments = () => {
    const rows = filtered.map(p=>`<tr><td>${p.member?.firstName} ${p.member?.lastName}</td><td>${p.type?.replace('_',' ')}</td><td>GH₵ ${p.amount?.toLocaleString()}</td><td>${p.month?MONTHS[p.month-1]:'—'} ${p.year||''}</td><td>${p.method?.replace('_',' ')}</td><td>${new Date(p.createdAt).toLocaleDateString('en-GH')}</td></tr>`).join('');
    const w = window.open('','_blank');
    w.document.write(`<html><head><title>Payments</title><style>body{font-family:Arial;padding:24px}h2{margin-bottom:16px}table{width:100%;border-collapse:collapse;font-size:13px}th,td{padding:8px 12px;border:1px solid #ddd;text-align:left}th{background:#f5f5f5}tfoot td{font-weight:bold}</style></head><body><h2>Gospel Light International Church — Payments</h2><p style="color:#888;margin-bottom:16px">${filtered.length} records · GH₵ ${totalShown.toLocaleString()}</p><table><thead><tr><th>Member</th><th>Type</th><th>Amount</th><th>Period</th><th>Method</th><th>Date</th></tr></thead><tbody>${rows}</tbody><tfoot><tr><td colspan="2">Total</td><td>GH₵ ${totalShown.toLocaleString()}</td><td colspan="3"></td></tr></tfoot></table></body></html>`);
    w.document.close(); setTimeout(()=>{w.print();w.close();},400);
  };

  const filtered   = payments.filter(p => !search || `${p.member?.firstName} ${p.member?.lastName}`.toLowerCase().includes(search.toLowerCase()));
  const totalShown = filtered.reduce((s,p)=>s+p.amount,0);

  return (
    <div>
      {receiptId && <Receipt paymentId={receiptId} onClose={()=>setReceiptId(null)}/>}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <div className="pg-breadcrumb">Gospel Light International Church</div>
          <h1 className="pg-title">Dues & Payments</h1>
          <p className="pg-sub">{filtered.length} records · Total: <strong style={{ color:'var(--green)' }}>GH₵ {totalShown.toLocaleString()}</strong></p>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button onClick={printPayments} className="btn btn-ghost btn-sm">🖨 Print</button>
          <button onClick={exportToCSV}   className="btn btn-ghost btn-sm">📥 CSV</button>
          <button onClick={()=>setShowForm(true)} className="btn btn-gold">+ Record Payment</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:8, marginBottom:18, flexWrap:'wrap', alignItems:'center' }}>
        <input placeholder="Search member..." value={search} onChange={e=>setSearch(e.target.value)} className="field-input" style={{ maxWidth:220, padding:'9px 14px' }}/>
        {['all',...PAYMENT_TYPES].map(t => (
          <button key={t} onClick={()=>setFilterType(t)} style={{ padding:'6px 13px', borderRadius:20, fontSize:12, cursor:'pointer', fontFamily:'var(--font-body)', transition:'all 0.18s', border:'none',
            background: filterType===t ? 'linear-gradient(135deg,var(--gold),#8B6420)' : 'rgba(255,255,255,0.06)',
            color:      filterType===t ? 'var(--navy)' : 'rgba(255,255,255,0.45)',
            fontWeight: filterType===t ? 600 : 400,
          }}>{t==='all'?'All':t.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}</button>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>{['Member','Type','Amount','Period','Method','Ref','Date',''].map(h=><th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} style={{ padding:28, textAlign:'center' }}><div className="spinner"/></td></tr>}
              {!loading && filtered.map(p => {
                const tc = typeColor(p.type);
                return (
                  <tr key={p._id}>
                    <td style={{ fontWeight:500 }}>{p.member?.firstName} {p.member?.lastName}</td>
                    <td><span style={{ fontSize:11.5, fontWeight:600, padding:'3px 9px', borderRadius:20, background:tc.bg, color:tc.color }}>{p.type?.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}</span></td>
                    <td style={{ color:'var(--green)', fontWeight:600 }}>GH₵ {p.amount?.toLocaleString()}</td>
                    <td style={{ color:'var(--muted)' }}>{p.month?MONTHS[p.month-1]:'—'} {p.year||''}</td>
                    <td style={{ color:'var(--muted)', textTransform:'capitalize' }}>{p.method?.replace('_',' ')}</td>
                    <td style={{ color:'var(--muted)', fontSize:12 }}>{p.reference||'—'}</td>
                    <td style={{ color:'var(--muted)', fontSize:12 }}>{new Date(p.createdAt).toLocaleDateString('en-GH')}</td>
                    <td>
                      <div style={{ display:'flex', gap:6 }}>
                        <button onClick={()=>setReceiptId(p._id)} className="btn btn-ghost btn-sm">🧾</button>
                        <button onClick={()=>handleDelete(p._id)} className="btn btn-danger btn-sm">✕</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && !filtered.length && <tr><td colSpan={8} style={{ padding:36, textAlign:'center', color:'var(--muted)' }}>No payments found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-head">
              <span className="modal-title">Record Payment</span>
              <button onClick={()=>setShowForm(false)} style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.6)', width:32, height:32, borderRadius:8, cursor:'pointer', fontSize:16 }}>✕</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  <div style={{ gridColumn:'1/-1' }}>
                    <label className="field-label">Member *</label>
                    <select value={form.member} onChange={e=>setForm(f=>({...f,member:e.target.value}))} required className="field-input">
                      <option value="">— Select member —</option>
                      {members.map(m=><option key={m._id} value={m._id}>{m.firstName} {m.lastName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="field-label">Payment Type *</label>
                    <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} className="field-input">
                      {PAYMENT_TYPES.map(t=><option key={t} value={t}>{t.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="field-label">Amount (GH₵) *</label>
                    <input type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} required min="1" className="field-input" placeholder="e.g. 200"/>
                  </div>
                  <div>
                    <label className="field-label">Month</label>
                    <select value={form.month} onChange={e=>setForm(f=>({...f,month:Number(e.target.value)}))} className="field-input">
                      {MONTHS.map((m,i)=><option key={m} value={i+1}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="field-label">Year</label>
                    <input type="number" value={form.year} onChange={e=>setForm(f=>({...f,year:Number(e.target.value)}))} className="field-input"/>
                  </div>
                  <div>
                    <label className="field-label">Payment Method</label>
                    <select value={form.method} onChange={e=>setForm(f=>({...f,method:e.target.value}))} className="field-input">
                      {PAYMENT_METHODS.map(m=><option key={m} value={m}>{m.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="field-label">Reference / Receipt No.</label>
                    <input type="text" value={form.reference} onChange={e=>setForm(f=>({...f,reference:e.target.value}))} className="field-input" placeholder="Optional"/>
                  </div>
                  <div style={{ gridColumn:'1/-1' }}>
                    <label className="field-label">Notes</label>
                    <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} className="field-input" style={{ resize:'vertical', minHeight:60 }} placeholder="Optional"/>
                  </div>
                </div>
                <div style={{ display:'flex', gap:10, marginTop:20, justifyContent:'flex-end' }}>
                  <button type="button" onClick={()=>setShowForm(false)} className="btn btn-ghost">Cancel</button>
                  <button type="submit" className="btn btn-gold">Save Payment</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
