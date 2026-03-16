import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Receipt from '../components/Receipt';

const MONTHS  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const TYPES   = ['tithe','dues','building_fund','welfare','youth_levy','offering','other'];
const METHODS = ['cash','momo','bank_transfer','cheque'];

const emptyForm = {
  member:'', amount:'', type:'dues', method:'cash',
  monthsData:[], year: new Date().getFullYear(), reference:'', notes:'',
};

export default function Payments() {
  const [payments,    setPayments]    = useState([]);
  const [members,     setMembers]     = useState([]);
  const [showForm,    setShowForm]    = useState(false);
  const [form,        setForm]        = useState(emptyForm);
  const [receiptId,   setReceiptId]   = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [filterType,  setFilterType]  = useState('all');
  const [search,      setSearch]      = useState('');
  const [error,       setError]       = useState('');
  const [paidMonths,  setPaidMonths]  = useState([]); // months already paid this year
  const [autoCalc,    setAutoCalc]    = useState(null); // auto calculation result
  const [memberDues,  setMemberDues]  = useState(200); // selected member dues amount

  const fetchAll = async () => {
    setLoading(true);
    const [p, m] = await Promise.all([
      axios.get('/api/payments'),
      axios.get('/api/members', { params:{ status:'active' } }),
    ]);
    setPayments(p.data); setMembers(m.data); setLoading(false);
  };
  useEffect(() => { fetchAll(); }, []);

  // When member or year changes, fetch their paid months
  const fetchPaidMonths = useCallback(async (memberId, year) => {
    if (!memberId) { setPaidMonths([]); return; }
    try {
      const { data } = await axios.get('/api/payments/paid-months', {
        params: { member: memberId, year },
      });
      setPaidMonths(data.months || []);
    } catch { setPaidMonths([]); }
  }, []);

  useEffect(() => {
    if (form.member) {
      const m = members.find(m => m._id === form.member);
      if (m) setMemberDues(m.duesAmount || 200);
      fetchPaidMonths(form.member, form.year);
    }
  }, [form.member, form.year, members]);

  // Auto-calculate months when amount changes
  useEffect(() => {
    if (!form.amount || !form.member || form.type !== 'dues') {
      setAutoCalc(null);
      setForm(f => ({ ...f, monthsData: [] }));
      return;
    }

    const amount      = Number(form.amount);
    const duesPerMonth = memberDues;
    if (!duesPerMonth || amount <= 0) return;

    const numMonths = Math.floor(amount / duesPerMonth);
    if (numMonths <= 0) {
      setAutoCalc({ numMonths:0, monthsData:[], message:`Amount is less than one month's dues (GH₵ ${duesPerMonth})` });
      setForm(f => ({ ...f, monthsData: [] }));
      return;
    }

    // Find next unpaid months starting from current month going forward
    const allMonths = [];
    let year  = form.year;
    let month = 1; // start from Jan

    // Find the last paid month this year
    if (paidMonths.length > 0) {
      const lastPaid = Math.max(...paidMonths);
      month = lastPaid + 1;
      if (month > 12) { month = 1; year++; }
    } else {
      // No payments yet — start from January of selected year
      month = 1;
    }

    // Collect next N unpaid months
    let count = 0;
    let safetyCheck = 0;
    while (count < numMonths && safetyCheck < 30) {
      safetyCheck++;
      // Skip already paid months in the starting year
      if (year === form.year && paidMonths.includes(month)) {
        month++;
        if (month > 12) { month = 1; year++; }
        continue;
      }
      allMonths.push({ month, year });
      count++;
      month++;
      if (month > 12) { month = 1; year++; }
    }

    const remainder = amount - (numMonths * duesPerMonth);

    setAutoCalc({
      numMonths,
      monthsData: allMonths,
      remainder,
      message: `GH₵ ${amount} ÷ GH₵ ${duesPerMonth} = ${numMonths} month${numMonths>1?'s':''}${remainder > 0 ? ` + GH₵ ${remainder} change` : ''}`,
    });
    setForm(f => ({ ...f, monthsData: allMonths }));
  }, [form.amount, form.member, form.year, paidMonths, memberDues, form.type]);

  // Manual month toggle (for non-dues types or manual override)
  const toggleMonth = (m, y) => {
    setForm(f => {
      const exists = f.monthsData.some(x => x.month === m && x.year === y);
      const updated = exists
        ? f.monthsData.filter(x => !(x.month === m && x.year === y))
        : [...f.monthsData, { month: m, year: y }].sort((a,b) => a.year !== b.year ? a.year-b.year : a.month-b.month);
      return { ...f, monthsData: updated };
    });
  };

  const isSelected = (m, y) => form.monthsData.some(x => x.month === m && x.year === y);

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      if (form.monthsData.length === 0) {
        setError('No months selected. Enter an amount or select months manually.');
        setSaving(false); return;
      }
      await axios.post('/api/payments', {
        member:    form.member,
        amount:    Number(form.amount) / form.monthsData.length,
        type:      form.type,
        method:    form.method,
        reference: form.reference,
        notes:     form.notes,
        monthsData: form.monthsData,
      });
      setShowForm(false); setForm(emptyForm); setAutoCalc(null); setPaidMonths([]);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save payment.');
    } finally { setSaving(false); }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this payment record?')) return;
    await axios.delete(`/api/payments/${id}`); fetchAll();
  };

  const exportCSV = () => {
    const headers = ['Member','Type','Amount','Month','Year','Method','Reference','Date'];
    const rows    = filtered.map(p => [
      `${p.member?.firstName||''} ${p.member?.lastName||''}`.trim(),
      p.type?.replace('_',' ') || '',
      p.amount,
      p.month ? MONTHS[p.month-1] : '',
      p.year||'',
      p.method?.replace('_',' ') || '',
      p.reference||'',
      new Date(p.createdAt).toLocaleDateString('en-GH'),
    ]);
    const csv = [headers,...rows].map(r => r.map(v=>`"${v}"`).join(',')).join('\n');
    const a   = Object.assign(document.createElement('a'), {
      href:     URL.createObjectURL(new Blob([csv],{type:'text/csv'})),
      download: `payments-${new Date().toISOString().slice(0,10)}.csv`,
    });
    a.click();
  };

  const filtered = payments.filter(p => {
    const matchType   = filterType === 'all' || p.type === filterType;
    const name        = `${p.member?.firstName||''} ${p.member?.lastName||''}`.toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const total = filtered.reduce((s, p) => s + p.amount, 0);

  // Group monthsData by year for display
  const groupedByYear = form.monthsData.reduce((acc, { month, year }) => {
    if (!acc[year]) acc[year] = [];
    acc[year].push(month);
    return acc;
  }, {});

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <div className="pg-breadcrumb">Gospel Light International Church</div>
          <h1 className="pg-title">Dues & <span style={{ color:'var(--gold2)', fontStyle:'italic' }}>Payments</span></h1>
          <p className="pg-sub">{filtered.length} records · GH₵ {total.toLocaleString()} total</p>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button onClick={exportCSV}               className="btn btn-ghost">📥 Export CSV</button>
          <button onClick={() => setShowForm(true)}  className="btn btn-gold">+ Record Payment</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:8, marginBottom:18, flexWrap:'wrap', alignItems:'center' }}>
        <input
          placeholder="Search member name..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="field-input" style={{ maxWidth:220, padding:'9px 14px' }}
        />
        {['all',...TYPES].map(t => (
          <button key={t} onClick={() => setFilterType(t)} style={{
            padding:'7px 14px', borderRadius:20, fontSize:12, cursor:'pointer',
            fontFamily:'var(--font-body)', transition:'all 0.18s', border:'none',
            background: filterType===t ? 'linear-gradient(135deg,var(--gold),#8B6420)' : 'rgba(255,255,255,0.06)',
            color:      filterType===t ? 'var(--navy)' : 'rgba(255,255,255,0.5)',
            fontWeight: filterType===t ? 600 : 400,
            textTransform:'capitalize',
          }}>{t==='all'?'All':t.replace('_',' ')}</button>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>{['Member','Type','Amount','Period','Method','Reference','Date',''].map(h=><th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} style={{ padding:28, textAlign:'center' }}><div className="spinner"/></td></tr>}
              {!loading && filtered.map(p => (
                <tr key={p._id}>
                  <td style={{ fontWeight:500 }}>{p.member?.firstName} {p.member?.lastName}</td>
                  <td>
                    <span style={{ fontSize:11.5, fontWeight:600, padding:'3px 9px', borderRadius:20, background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.7)', textTransform:'capitalize' }}>
                      {p.type?.replace('_',' ')}
                    </span>
                  </td>
                  <td style={{ color:'var(--green)', fontWeight:600 }}>GH₵ {p.amount?.toLocaleString()}</td>
                  <td style={{ color:'var(--muted)' }}>{p.month ? MONTHS[p.month-1] : '—'} {p.year||''}</td>
                  <td style={{ color:'var(--muted)', textTransform:'capitalize' }}>{p.method?.replace('_',' ')}</td>
                  <td style={{ color:'var(--muted)', fontSize:12 }}>{p.reference||'—'}</td>
                  <td style={{ color:'var(--muted)', fontSize:12 }}>{new Date(p.createdAt).toLocaleDateString('en-GH')}</td>
                  <td>
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={() => setReceiptId(p._id)} className="btn btn-ghost btn-sm">🧾</button>
                      <button onClick={() => handleDelete(p._id)} className="btn btn-danger btn-sm">✕</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && !filtered.length && (
                <tr><td colSpan={8} style={{ padding:36, textAlign:'center', color:'var(--muted)' }}>No payments found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-box modal-box-lg">
            <div className="modal-head">
              <span className="modal-title">Record Payment</span>
              <button onClick={() => { setShowForm(false); setError(''); setForm(emptyForm); setAutoCalc(null); setPaidMonths([]); }}
                style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.6)', width:32, height:32, borderRadius:8, cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>✕
              </button>
            </div>
            <div className="modal-body">
              {error && (
                <div style={{ background:'rgba(224,85,85,0.12)', border:'1px solid rgba(224,85,85,0.25)', color:'#FCA5A5', fontSize:13, padding:'10px 14px', borderRadius:10, marginBottom:16 }}>
                  ⚠ {error}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:14 }}>

                  {/* Member */}
                  <div style={{ gridColumn:'1/-1' }}>
                    <label className="field-label">Member *</label>
                    <select value={form.member} onChange={e => setForm(f => ({...f,member:e.target.value,monthsData:[]}))} required className="field-input">
                      <option value="">— Select member —</option>
                      {members.map(m => <option key={m._id} value={m._id}>{m.firstName} {m.lastName}</option>)}
                    </select>
                  </div>

                  {/* Type */}
                  <div>
                    <label className="field-label">Payment Type *</label>
                    <select value={form.type} onChange={e => setForm(f => ({...f,type:e.target.value,monthsData:[]}))} required className="field-input">
                      {TYPES.map(t => <option key={t} value={t}>{t.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>)}
                    </select>
                  </div>

                  {/* Year */}
                  <div>
                    <label className="field-label">Year *</label>
                    <select value={form.year} onChange={e => setForm(f => ({...f,year:Number(e.target.value),monthsData:[]}))} required className="field-input">
                      {[2022,2023,2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="field-label">
                      Amount (GH₵) *
                      {form.member && form.type==='dues' && (
                        <span style={{ marginLeft:6, fontSize:10.5, color:'var(--muted)' }}>
                          dues = GH₵ {memberDues}/month
                        </span>
                      )}
                    </label>
                    <input
                      type="number" value={form.amount}
                      onChange={e => setForm(f => ({...f,amount:e.target.value}))}
                      required min="1" className="field-input"
                      placeholder={form.type==='dues' ? `e.g. ${memberDues*3} for 3 months` : 'Enter amount'}
                    />
                  </div>

                  {/* Method */}
                  <div>
                    <label className="field-label">Payment Method *</label>
                    <select value={form.method} onChange={e => setForm(f => ({...f,method:e.target.value}))} required className="field-input">
                      {METHODS.map(m => <option key={m} value={m}>{m.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>)}
                    </select>
                  </div>

                  {/* Reference */}
                  <div>
                    <label className="field-label">Reference / Receipt No.</label>
                    <input type="text" value={form.reference} onChange={e => setForm(f => ({...f,reference:e.target.value}))} className="field-input" placeholder="Optional"/>
                  </div>

                </div>

                {/* Auto-calculation result for dues */}
                {form.type === 'dues' && form.member && form.amount && autoCalc && (
                  <div style={{ marginTop:16, padding:'14px 16px', borderRadius:12,
                    background: autoCalc.numMonths > 0 ? 'rgba(46,204,113,0.08)' : 'rgba(224,85,85,0.08)',
                    border: `1px solid ${autoCalc.numMonths > 0 ? 'rgba(46,204,113,0.25)' : 'rgba(224,85,85,0.25)'}`,
                  }}>
                    <div style={{ fontSize:13, fontWeight:600, color: autoCalc.numMonths > 0 ? 'var(--green)' : 'var(--red)', marginBottom: autoCalc.numMonths > 0 ? 10 : 0 }}>
                      🧮 {autoCalc.message}
                    </div>
                    {autoCalc.numMonths > 0 && (
                      <>
                        <div style={{ fontSize:12, color:'var(--muted)', marginBottom:10 }}>
                          Automatically selected the next unpaid months:
                        </div>
                        {Object.entries(groupedByYear).map(([year, months]) => (
                          <div key={year} style={{ marginBottom:8 }}>
                            <div style={{ fontSize:11, color:'var(--muted)', marginBottom:6, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>{year}</div>
                            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                              {months.map(m => (
                                <span key={m} style={{ padding:'4px 12px', borderRadius:20, background:'rgba(46,204,113,0.15)', color:'var(--green)', border:'1px solid rgba(46,204,113,0.3)', fontSize:12.5, fontWeight:600 }}>
                                  ✓ {MONTHS[m-1]}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                        {autoCalc.remainder > 0 && (
                          <div style={{ marginTop:8, fontSize:12, color:'var(--amber)', padding:'6px 10px', borderRadius:8, background:'rgba(232,185,106,0.08)', border:'1px solid rgba(232,185,106,0.2)' }}>
                            ⚠ GH₵ {autoCalc.remainder} remainder — not enough for another full month
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Manual month grid for non-dues OR manual override */}
                {(form.type !== 'dues' || !autoCalc || autoCalc.numMonths === 0) && form.member && (
                  <div style={{ marginTop:16 }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                      <label className="field-label" style={{ margin:0 }}>
                        Select Months Manually
                        {form.monthsData.length > 0 && (
                          <span style={{ marginLeft:8, fontSize:11, padding:'2px 8px', borderRadius:20, background:'rgba(201,148,58,0.15)', color:'var(--gold2)' }}>
                            {form.monthsData.length} selected
                          </span>
                        )}
                      </label>
                    </div>
                    {/* Show months for current year + next year */}
                    {[form.year, form.year+1].map(y => (
                      <div key={y} style={{ marginBottom:12 }}>
                        <div style={{ fontSize:11, color:'var(--muted)', marginBottom:6, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>{y}</div>
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:6 }}>
                          {MONTHS.map((name, i) => {
                            const m          = i + 1;
                            const selected   = isSelected(m, y);
                            const alreadyPaid = y === form.year && paidMonths.includes(m);
                            return (
                              <button type="button" key={m}
                                onClick={() => !alreadyPaid && toggleMonth(m, y)}
                                disabled={alreadyPaid}
                                style={{
                                  padding:'9px 4px', borderRadius:9, fontSize:12, fontWeight:500,
                                  cursor: alreadyPaid ? 'not-allowed' : 'pointer',
                                  fontFamily:'var(--font-body)', transition:'all 0.15s', textAlign:'center',
                                  background: alreadyPaid  ? 'rgba(46,204,113,0.08)'
                                            : selected     ? 'linear-gradient(135deg,var(--gold),#8B6420)'
                                            : 'rgba(255,255,255,0.05)',
                                  color:      alreadyPaid  ? 'var(--green)'
                                            : selected     ? 'var(--navy)'
                                            : 'rgba(255,255,255,0.45)',
                                  border:     alreadyPaid  ? '1px solid rgba(46,204,113,0.2)'
                                            : selected     ? 'none'
                                            : '1px solid rgba(255,255,255,0.08)',
                                  opacity:    alreadyPaid  ? 0.6 : 1,
                                }}>
                                {alreadyPaid ? '✓' : name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    <div style={{ fontSize:12, color:'var(--muted)', marginTop:4 }}>
                      ✓ Green = already paid · Gold = selected to pay now
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div style={{ marginTop:14 }}>
                  <label className="field-label">Notes</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({...f,notes:e.target.value}))}
                    className="field-input" style={{ resize:'vertical', minHeight:56 }} placeholder="Optional"/>
                </div>

                {/* Summary */}
                {form.monthsData.length > 0 && (
                  <div style={{ marginTop:14, padding:'12px 16px', borderRadius:10, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', fontSize:13, color:'rgba(255,255,255,0.7)' }}>
                    <strong style={{ color:'var(--white)' }}>Summary:</strong> {form.monthsData.length} record{form.monthsData.length>1?'s':''} will be created
                    {form.amount && <> · GH₵ {(Number(form.amount)/form.monthsData.length).toLocaleString()} per month · Total GH₵ {Number(form.amount).toLocaleString()}</>}
                  </div>
                )}

                <div style={{ display:'flex', gap:10, marginTop:20, justifyContent:'flex-end', flexWrap:'wrap' }}>
                  <button type="button" onClick={() => { setShowForm(false); setError(''); setForm(emptyForm); setAutoCalc(null); setPaidMonths([]); }} className="btn btn-ghost">Cancel</button>
                  <button type="submit" disabled={saving} className="btn btn-gold">
                    {saving ? 'Saving...' : form.monthsData.length > 1 ? `Save ${form.monthsData.length} Records` : 'Save Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {receiptId && <Receipt paymentId={receiptId} onClose={() => setReceiptId(null)}/>}
    </div>
  );
}