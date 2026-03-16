import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const TYPES  = ['dues','tithe','building_fund','welfare','youth_levy','offering','other'];

const typeColor = t => ({
  tithe:         { bg:'rgba(46,204,113,0.1)',   color:'#2ECC71' },
  dues:          { bg:'rgba(201,148,58,0.1)',   color:'#E8B96A' },
  building_fund: { bg:'rgba(91,141,239,0.1)',   color:'#5B8DEF' },
  welfare:       { bg:'rgba(167,139,250,0.1)',  color:'#A78BFA' },
  youth_levy:    { bg:'rgba(251,146,60,0.1)',   color:'#FB923C' },
  offering:      { bg:'rgba(255,255,255,0.07)', color:'#8B96A8' },
  other:         { bg:'rgba(255,255,255,0.07)', color:'#8B96A8' },
}[t] || { bg:'rgba(255,255,255,0.07)', color:'#8B96A8' });

export default function MemberLookup() {
  const [query,    setQuery]    = useState('');
  const [results,  setResults]  = useState([]);
  const [selected, setSelected] = useState(null);
  const [payments, setPayments] = useState([]);
  const [summary,  setSummary]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [payLoad,  setPayLoad]  = useState(false);
  const [showDrop, setShowDrop] = useState(false);
  const [yearFilter, setYearFilter]   = useState(new Date().getFullYear());
  const [typeFilter, setTypeFilter]   = useState('all');
  const [viewMode,   setViewMode]     = useState('calendar'); // calendar | table
  const searchRef = useRef();
  const dropRef   = useRef();

  // Search members as user types
  useEffect(() => {
    if (query.length < 2) { setResults([]); setShowDrop(false); return; }
    const t = setTimeout(async () => {
      try {
        const { data } = await axios.get('/api/members', { params: { search: query } });
        setResults(data.slice(0, 8));
        setShowDrop(true);
      } catch { setResults([]); }
    }, 280);
    return () => clearTimeout(t);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const fn = e => { if (dropRef.current && !dropRef.current.contains(e.target)) setShowDrop(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  // Load payments when member or filters change
  useEffect(() => {
    if (!selected) return;
    loadPayments();
  }, [selected, yearFilter, typeFilter]);

  const loadPayments = async () => {
    setPayLoad(true);
    try {
      const params = { memberId: selected._id };
      if (typeFilter !== 'all') params.type = typeFilter;
      const { data } = await axios.get('/api/payments', { params });
      setPayments(data);
      buildSummary(data);
    } catch { setPayments([]); }
    finally { setPayLoad(false); }
  };

  const buildSummary = (data) => {
    const total   = data.reduce((s,p) => s+p.amount, 0);
    const byType  = {};
    const byMonth = {};
    const byYear  = {};
    data.forEach(p => {
      byType[p.type]  = (byType[p.type]  || 0) + p.amount;
      const key = `${p.year}-${p.month}`;
      byMonth[key]    = (byMonth[key] || 0) + p.amount;
      byYear[p.year]  = (byYear[p.year] || 0) + p.amount;
    });
    setSummary({ total, byType, byMonth, byYear, count: data.length });
  };

  const selectMember = m => {
    setSelected(m);
    setQuery(`${m.firstName} ${m.lastName}`);
    setShowDrop(false);
  };

  const clearMember = () => {
    setSelected(null);
    setPayments([]);
    setSummary(null);
    setQuery('');
    searchRef.current?.focus();
  };

  // For a given year, which months have payments (and which type)
  const getMonthStatus = (year, monthIdx) => {
    const monthNum = monthIdx + 1;
    const relevant = payments.filter(p =>
      p.year === year && p.month === monthNum &&
      (typeFilter === 'all' || p.type === typeFilter)
    );
    if (!relevant.length) return null;
    const total = relevant.reduce((s,p)=>s+p.amount,0);
    return { paid: true, total, payments: relevant };
  };

  const years = Array.from(
    new Set(payments.map(p => p.year).filter(Boolean))
  ).sort((a,b) => b-a);

  if (!years.includes(yearFilter) && years.length) setYearFilter(years[0]);

  const filteredPayments = payments.filter(p =>
    (typeFilter==='all' || p.type===typeFilter) &&
    (!yearFilter || p.year===yearFilter)
  );

  const initials = m => `${m.firstName[0]}${m.lastName[0]}`.toUpperCase();

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom:30 }}>
        <div className="pg-breadcrumb">Gospel Light International Church</div>
        <h1 className="pg-title">Member <span style={{ color:'var(--gold2)',fontStyle:'italic' }}>Financial Lookup</span></h1>
        <p className="pg-sub">Search any member · view complete payment history · check dues by year and month</p>
      </div>

      {/* Search box */}
      <div ref={dropRef} style={{ position:'relative', marginBottom:28, maxWidth:600 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'13px 18px', borderRadius:14, border:'1px solid rgba(201,148,58,0.3)', background:'rgba(255,255,255,0.04)', backdropFilter:'blur(10px)', transition:'border-color 0.2s' }}>
          <span style={{ fontSize:18, opacity:0.6 }}>🔍</span>
          <input
            ref={searchRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(null); }}
            placeholder="Search member by name..."
            style={{ flex:1, background:'transparent', border:'none', outline:'none', fontSize:15, color:'#fff', fontFamily:'var(--font-body)' }}
          />
          {selected && (
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:11, color:'var(--green)', fontWeight:600, padding:'3px 10px', borderRadius:20, background:'rgba(46,204,113,0.1)', border:'1px solid rgba(46,204,113,0.2)' }}>✓ Selected</span>
              <button onClick={clearMember} style={{ background:'rgba(255,255,255,0.08)', border:'none', color:' rgba(255,255,255,0.5)', width:26, height:26, borderRadius:7, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
            </div>
          )}
          {loading && <div className="spinner" style={{ width:18, height:18, borderWidth:2 }}/>}
        </div>

        {/* Dropdown */}
        {showDrop && results.length > 0 && (
          <div style={{ position:'absolute', top:'calc(100% + 8px)', left:0, right:0, background:'var(--navy3)', border:'1px solid var(--border-gold)', borderRadius:14, overflow:'hidden', zIndex:50, boxShadow:'0 16px 40px rgba(0,0,0,0.5)', animation:'fadeUp 0.2s ease' }}>
            {results.map(m => (
              <div key={m._id} onClick={() => selectMember(m)}
                style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', cursor:'pointer', transition:'background 0.15s', borderBottom:'1px solid rgba(255,255,255,0.04)' }}
                onMouseOver={e=>e.currentTarget.style.background='rgba(201,148,58,0.08)'}
                onMouseOut={e=>e.currentTarget.style.background='transparent'}>
                <div style={{ width:36, height:36, borderRadius:9, background:'linear-gradient(135deg,var(--navy4),var(--navy3))', border:'1px solid var(--border-gold)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:600, color:'var(--gold2)', flexShrink:0 }}>
                  {initials(m)}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:500, color:'#fff' }}>{m.firstName} {m.lastName}</div>
                  <div style={{ fontSize:11.5, color:'var(--muted)', marginTop:1, textTransform:'capitalize' }}>
                    {m.role} {m.departments?.length ? `· ${m.departments.join(', ')}` : ''}
                  </div>
                </div>
                <span style={{ fontSize:11, color:'var(--muted)' }}>{m.whatsapp||m.phone||''}</span>
              </div>
            ))}
          </div>
        )}
        {showDrop && results.length === 0 && (
          <div style={{ position:'absolute', top:'calc(100% + 8px)', left:0, right:0, background:'var(--navy3)', border:'1px solid var(--border)', borderRadius:14, padding:'20px', textAlign:'center', color:'var(--muted)', fontSize:13, zIndex:50 }}>
            No members found for "{query}"
          </div>
        )}
      </div>

      {/* No member selected yet */}
      {!selected && (
        <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--muted)' }}>
          <div style={{ fontSize:56, marginBottom:16, opacity:0.4 }}>🔍</div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:22, color:'rgba(255,255,255,0.3)', marginBottom:8 }}>Search for a member above</div>
          <div style={{ fontSize:13 }}>Type at least 2 characters to find a member and view their complete financial history</div>
        </div>
      )}

      {/* Member found — show full profile */}
      {selected && (
        <div className="animate-in">
          {/* Member card */}
          <div className="glass-card" style={{ padding:'20px 24px', marginBottom:20, display:'flex', alignItems:'center', gap:18, flexWrap:'wrap' }}>
            <div style={{ width:56, height:56, borderRadius:14, background:'linear-gradient(135deg,var(--navy4),var(--navy3))', border:'1px solid var(--border-gold)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontSize:20, fontWeight:700, color:'var(--gold2)', flexShrink:0 }}>
              {initials(selected)}
            </div>
            <div style={{ flex:1, minWidth:200 }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:700, color:'#fff', marginBottom:4 }}>
                {selected.firstName} {selected.lastName}
              </div>
              <div style={{ fontSize:13, color:'var(--muted)', display:'flex', flexWrap:'wrap', gap:'0 16px' }}>
                <span style={{ textTransform:'capitalize' }}>{selected.role}</span>
                {selected.departments?.length > 0 && <span>{selected.departments.join(', ')}</span>}
                {selected.whatsapp && <span>📱 {selected.whatsapp}</span>}
                {selected.email    && <span>✉️ {selected.email}</span>}
              </div>
            </div>
            {summary && (
              <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
                {[
                  { label:'Total Paid',    value:`GH₵ ${summary.total.toLocaleString()}`, color:'var(--green)'  },
                  { label:'Transactions',  value:summary.count,                           color:'var(--gold2)'  },
                  { label:'Years Active',  value:Object.keys(summary.byYear).length,      color:'var(--blue)'   },
                ].map(s => (
                  <div key={s.label} style={{ textAlign:'center', padding:'10px 18px', borderRadius:12, background:'rgba(255,255,255,0.04)', border:'1px solid var(--border)' }}>
                    <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:700, color:s.color }}>{s.value}</div>
                    <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Filters row */}
          <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
            {/* Year pills */}
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {[new Date().getFullYear(), new Date().getFullYear()-1, new Date().getFullYear()-2, ...(years.filter(y=>y<new Date().getFullYear()-2))].slice(0,6).map(yr => (
                <button key={yr} onClick={()=>setYearFilter(yr)} style={{ padding:'7px 16px', borderRadius:20, fontSize:12.5, fontWeight:500, cursor:'pointer', fontFamily:'var(--font-body)', transition:'all 0.18s',
                  background: yearFilter===yr ? 'linear-gradient(135deg,var(--gold),#8B6420)' : 'rgba(255,255,255,0.05)',
                  color:      yearFilter===yr ? 'var(--navy)' : 'rgba(255,255,255,0.5)',
                  border:     yearFilter===yr ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  boxShadow:  yearFilter===yr ? 'var(--shadow-gold)' : 'none',
                }}>{yr}</button>
              ))}
            </div>

            <div style={{ height:20, width:1, background:'rgba(255,255,255,0.08)' }}/>

            {/* Type filter */}
            <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}
              style={{ padding:'7px 14px', borderRadius:10, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'#fff', fontSize:12.5, fontFamily:'var(--font-body)', cursor:'pointer', outline:'none' }}>
              <option value="all">All Types</option>
              {TYPES.map(t => <option key={t} value={t}>{t.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>)}
            </select>

            {/* View toggle */}
            <div style={{ marginLeft:'auto', display:'flex', gap:4, background:'rgba(255,255,255,0.05)', borderRadius:10, padding:4 }}>
              {['calendar','table'].map(m => (
                <button key={m} onClick={()=>setViewMode(m)} style={{ padding:'6px 14px', borderRadius:8, fontSize:12, fontWeight:500, cursor:'pointer', fontFamily:'var(--font-body)', transition:'all 0.18s', border:'none',
                  background: viewMode===m ? 'rgba(201,148,58,0.2)' : 'transparent',
                  color:      viewMode===m ? 'var(--gold2)' : 'rgba(255,255,255,0.4)',
                }}>
                  {m === 'calendar' ? '📅 Calendar' : '📋 Table'}
                </button>
              ))}
            </div>
          </div>

          {payLoad ? (
            <div className="page-loading"><div className="spinner"/><span>Loading records...</span></div>
          ) : (
            <>
              {/* ── CALENDAR VIEW ── */}
              {viewMode==='calendar' && (
                <div className="glass-card animate-in" style={{ overflow:'visible' }}>
                  <div style={{ padding:'18px 24px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(255,255,255,0.02)' }}>
                    <span style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:600, color:'#fff' }}>
                      Payment Calendar — {yearFilter}
                    </span>
                    <div style={{ display:'flex', gap:12, fontSize:12, color:'var(--muted)' }}>
                      <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:10,height:10,borderRadius:3,background:'rgba(46,204,113,0.3)',border:'1px solid rgba(46,204,113,0.4)',display:'inline-block' }}/>Paid</span>
                      <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:10,height:10,borderRadius:3,background:'rgba(224,85,85,0.2)',border:'1px solid rgba(224,85,85,0.3)',display:'inline-block' }}/>Unpaid</span>
                    </div>
                  </div>
                  <div style={{ padding:'20px 24px' }}>
                    {/* Month grid */}
                    <div className="month-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
                      {MONTHS.map((month, idx) => {
                        const status = getMonthStatus(yearFilter, idx);
                        const isPast = (yearFilter < new Date().getFullYear()) ||
                                       (yearFilter === new Date().getFullYear() && idx < new Date().getMonth());
                        const isCurrent = yearFilter===new Date().getFullYear() && idx===new Date().getMonth();
                        return (
                          <div key={month} style={{
                            padding:'14px 16px', borderRadius:12,
                            border:`1px solid ${status ? 'rgba(46,204,113,0.25)' : isPast ? 'rgba(224,85,85,0.2)' : 'rgba(255,255,255,0.07)'}`,
                            background: status ? 'rgba(46,204,113,0.07)' : isPast ? 'rgba(224,85,85,0.05)' : 'rgba(255,255,255,0.02)',
                            transition:'all 0.2s', position:'relative', overflow:'hidden',
                            outline: isCurrent ? '2px solid rgba(201,148,58,0.4)' : 'none',
                          }}>
                            {isCurrent && <div style={{ position:'absolute', top:6, right:8, fontSize:9, color:'var(--gold2)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>Now</div>}
                            <div style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.5)', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.06em' }}>{month}</div>
                            {status ? (
                              <>
                                <div style={{ fontSize:16, fontWeight:700, color:'var(--green)', marginBottom:4 }}>GH₵ {status.total.toLocaleString()}</div>
                                <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                                  {status.payments.map(p => (
                                    <span key={p._id} style={{ fontSize:10, fontWeight:600, padding:'2px 7px', borderRadius:20, ...typeColor(p.type) }}>
                                      {p.type.replace('_',' ')}
                                    </span>
                                  ))}
                                </div>
                                <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg,var(--green),rgba(46,204,113,0.3))' }}/>
                              </>
                            ) : isPast ? (
                              <>
                                <div style={{ fontSize:13, fontWeight:600, color:'var(--red)', marginBottom:2 }}>Not Paid</div>
                                <div style={{ fontSize:11, color:'rgba(224,85,85,0.6)' }}>No record found</div>
                              </>
                            ) : (
                              <div style={{ fontSize:12, color:'rgba(255,255,255,0.2)' }}>Upcoming</div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Year summary */}
                    {summary?.byYear[yearFilter] !== undefined && (
                      <div style={{ marginTop:20, padding:'16px 20px', borderRadius:12, background:'rgba(201,148,58,0.06)', border:'1px solid rgba(201,148,58,0.15)', display:'flex', flexWrap:'wrap', gap:20, alignItems:'center' }}>
                        <div>
                          <div style={{ fontSize:11, color:'rgba(201,148,58,0.7)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Total paid in {yearFilter}</div>
                          <div style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:700, color:'var(--gold2)' }}>GH₵ {(summary.byYear[yearFilter]||0).toLocaleString()}</div>
                        </div>
                        <div style={{ height:40, width:1, background:'rgba(201,148,58,0.2)' }}/>
                        <div>
                          <div style={{ fontSize:11, color:'rgba(201,148,58,0.7)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Months with payment</div>
                          <div style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:700, color:'var(--white)' }}>
                            {payments.filter(p=>p.year===yearFilter).map(p=>p.month).filter((v,i,a)=>a.indexOf(v)===i).length} / 12
                          </div>
                        </div>
                        <div style={{ height:40, width:1, background:'rgba(201,148,58,0.2)' }}/>
                        <div>
                          <div style={{ fontSize:11, color:'rgba(201,148,58,0.7)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Last payment</div>
                          <div style={{ fontSize:14, fontWeight:500, color:'var(--white)' }}>
                            {(() => { const last = payments.filter(p=>p.year===yearFilter).sort((a,b)=>b.month-a.month)[0]; return last ? `${MONTHS[last.month-1]} ${last.year}` : 'None'; })()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── TABLE VIEW ── */}
              {viewMode==='table' && (
                <div className="glass-card animate-in">
                  <div style={{ padding:'18px 24px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(255,255,255,0.02)', flexWrap:'wrap', gap:10 }}>
                    <span style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:600, color:'#fff' }}>
                      Transaction History — {yearFilter}
                    </span>
                    <span style={{ fontSize:12, color:'var(--muted)' }}>
                      {filteredPayments.length} records · GH₵ {filteredPayments.reduce((s,p)=>s+p.amount,0).toLocaleString()} total
                    </span>
                  </div>
                  <div className="table-wrap">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Month</th>
                          <th>Type</th>
                          <th>Amount</th>
                          <th>Method</th>
                          <th className="hide-mobile">Reference</th>
                          <th className="hide-mobile">Date Recorded</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPayments.length===0 && (
                          <tr><td colSpan={7} style={{ textAlign:'center', padding:'32px', color:'var(--muted)' }}>
                            No payments found for {yearFilter} {typeFilter!=='all'?`(${typeFilter})`:''}
                          </td></tr>
                        )}
                        {filteredPayments.sort((a,b)=>b.month-a.month).map(p => (
                          <tr key={p._id}>
                            <td style={{ fontWeight:500 }}>{p.month ? MONTHS[p.month-1] : '—'} {p.year}</td>
                            <td>
                              <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11.5, fontWeight:600, ...typeColor(p.type) }}>
                                {p.type?.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}
                              </span>
                            </td>
                            <td style={{ color:'var(--green)', fontWeight:600 }}>GH₵ {p.amount?.toLocaleString()}</td>
                            <td style={{ textTransform:'capitalize', color:'var(--muted)' }}>{p.method?.replace('_',' ')}</td>
                            <td className="hide-mobile" style={{ color:'var(--muted)', fontSize:12 }}>{p.reference||'—'}</td>
                            <td className="hide-mobile" style={{ color:'var(--muted)', fontSize:12 }}>{new Date(p.createdAt).toLocaleDateString('en-GH')}</td>
                            <td><span className="chip chip-paid">Paid</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Breakdown by type */}
                  {filteredPayments.length > 0 && summary && (
                    <div style={{ padding:'16px 24px', borderTop:'1px solid var(--border)', display:'flex', flexWrap:'wrap', gap:10 }}>
                      {Object.entries(summary.byType).map(([type, amt]) => (
                        <div key={type} style={{ padding:'8px 14px', borderRadius:10, ...typeColor(type), border:`1px solid ${typeColor(type).color}30` }}>
                          <span style={{ fontSize:11, display:'block', marginBottom:2, opacity:0.7 }}>{type.replace('_',' ')}</span>
                          <span style={{ fontSize:14, fontWeight:600 }}>GH₵ {amt.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* No payments at all */}
              {!payLoad && payments.length===0 && (
                <div style={{ textAlign:'center', padding:'48px 20px', color:'var(--muted)' }}>
                  <div style={{ fontSize:48, marginBottom:14, opacity:0.3 }}>💳</div>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:20, color:'rgba(255,255,255,0.3)', marginBottom:8 }}>No payment records found</div>
                  <div style={{ fontSize:13 }}>This member has no recorded payments yet.</div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
