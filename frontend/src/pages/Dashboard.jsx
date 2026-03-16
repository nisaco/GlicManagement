import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { CHURCH } from '../config';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const greet = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'rgba(8,14,30,0.96)', border:'1px solid rgba(201,148,58,0.3)', borderRadius:10, padding:'10px 14px', fontFamily:'var(--font-body)' }}>
      <div style={{ fontSize:11, color:'#8B96A8', marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:15, fontWeight:600, color:'#E8B96A' }}>GH₵ {payload[0].value?.toLocaleString()}</div>
    </div>
  );
};

export default function Dashboard() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/dashboard/stats')
      .then(r => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const chartData = MONTHS.map((name, i) => {
    const found = stats?.monthlyBreakdown?.find(m => m._id === i + 1);
    return { name, amount: found?.total || 0 };
  });

  if (loading) return (
    <div className="page-loading">
      <div className="spinner"/>
      <span>Loading dashboard...</span>
    </div>
  );

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28, flexWrap:'wrap', gap:14 }}>
        <div>
          <div className="pg-breadcrumb">{CHURCH.name}</div>
          <h1 className="pg-title">
            {greet()}, <span style={{ color:'var(--gold2)', fontStyle:'italic' }}>Admin</span>
          </h1>
          <p className="pg-sub">
            {new Date().toLocaleDateString('en-GH',{ weekday:'long', year:'numeric', month:'long', day:'numeric' })}
          </p>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <a href="/payments" className="btn btn-ghost" style={{ textDecoration:'none' }}>+ Record Payment</a>
          <a href="/members"  className="btn btn-gold"  style={{ textDecoration:'none' }}>+ Add Member</a>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }} className="stagger stats-4">
        {[
          { label:'Total Members',   value: stats?.totalMembers ?? '—',                            sub:`+${stats?.newThisYear ?? 0} this year`,  accent:'var(--gold)',  glow:'rgba(201,148,58,0.15)',  icon:'👥' },
          { label:'Dues Collected',  value:`GH₵ ${(stats?.totalCollected ?? 0).toLocaleString()}`, sub:'Collected this year',                     accent:'var(--green)', glow:'rgba(46,204,113,0.12)', icon:'💰' },
          { label:'Pending Members', value: stats?.pendingCount ?? '—',                            sub:"Haven't paid this month",                 accent:'var(--red)',   glow:'rgba(224,85,85,0.12)',  icon:'⏰' },
          { label:'This Month',      value:`GH₵ ${(stats?.thisMonth ?? 0).toLocaleString()}`,      sub:'Collected so far',                        accent:'var(--blue)',  glow:'rgba(91,141,239,0.12)', icon:'📈' },
        ].map((s, i) => (
          <div key={s.label} className="glass-card animate-up" style={{ padding:'18px 20px', position:'relative', overflow:'hidden', cursor:'default', animationDelay:`${i * 0.07}s` }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${s.accent},transparent)` }}/>
            <div style={{ position:'absolute', right:-16, top:-16, width:100, height:100, borderRadius:'50%', background:s.glow, filter:'blur(28px)', pointerEvents:'none' }}/>
            <div style={{ fontSize:10, fontWeight:600, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10 }}>{s.label}</div>
            <div className="stat-value-lg" style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:700, color:'var(--white)', lineHeight:1, marginBottom:8 }}>{s.value}</div>
            <div style={{ fontSize:11.5, color:'var(--muted)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="gold-line"/>

      {/* ── Two column layout ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:20 }} className="content-2col">

        {/* Left column */}
        <div style={{ display:'flex', flexDirection:'column', gap:20, minWidth:0 }}>

          {/* Monthly chart */}
          <div className="glass-card animate-up" style={{ animationDelay:'0.1s' }}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(255,255,255,0.02)', flexWrap:'wrap', gap:8 }}>
              <span style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:600, color:'var(--white)' }}>Monthly Collections</span>
              <span style={{ fontSize:11.5, color:'var(--muted)' }}>{new Date().getFullYear()}</span>
            </div>
            <div style={{ padding:'16px 12px 8px' }}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} barSize={22}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                  <XAxis dataKey="name" tick={{ fontSize:11, fill:'#8B96A8', fontFamily:'Outfit' }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fontSize:11, fill:'#8B96A8', fontFamily:'Outfit' }} axisLine={false} tickLine={false} tickFormatter={v => `₵${(v/1000).toFixed(0)}k`}/>
                  <Tooltip content={<CustomTooltip/>} cursor={{ fill:'rgba(201,148,58,0.06)' }}/>
                  <Bar dataKey="amount" fill="rgba(201,148,58,0.35)" radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent payments */}
          <div className="glass-card animate-up" style={{ animationDelay:'0.15s' }}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(255,255,255,0.02)' }}>
              <span style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:600, color:'var(--white)' }}>Recent Payments</span>
              <a href="/payments" style={{ fontSize:11.5, color:'var(--gold)', textDecoration:'none', fontWeight:500 }}>View all →</a>
            </div>
            <div>
              {(stats?.recentPayments || []).map(p => (
                <div key={p._id} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 20px', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ width:32, height:32, borderRadius:8, background:'rgba(46,204,113,0.1)', border:'1px solid rgba(46,204,113,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>💰</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:500, color:'rgba(255,255,255,0.9)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {p.member?.firstName} {p.member?.lastName}
                    </div>
                    <div style={{ fontSize:11.5, color:'var(--muted)', textTransform:'capitalize', marginTop:1 }}>
                      {p.type?.replace('_',' ')}
                    </div>
                  </div>
                  <div style={{ fontSize:13.5, fontWeight:600, color:'var(--green)', flexShrink:0 }}>
                    +GH₵ {p.amount?.toLocaleString()}
                  </div>
                </div>
              ))}
              {!stats?.recentPayments?.length && (
                <div style={{ padding:'24px 20px', color:'var(--muted)', fontSize:13 }}>
                  No payments recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display:'flex', flexDirection:'column', gap:18 }}>

          {/* Quick actions */}
          <div className="glass-card animate-up" style={{ animationDelay:'0.08s' }}>
            <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)', background:'rgba(255,255,255,0.02)' }}>
              <span style={{ fontFamily:'var(--font-display)', fontSize:17, fontWeight:600, color:'var(--white)' }}>Quick Actions</span>
            </div>
            <div style={{ padding:'14px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {[
                { icon:'👤', label:'Add Member',    href:'/members'   },
                { icon:'💳', label:'Record Dues',   href:'/payments'  },
                { icon:'📱', label:'Send Reminder', href:'/reminders' },
                { icon:'📊', label:'Reports',       href:'/reports'   },
              ].map(a => (
                <a key={a.label} href={a.href} style={{ padding:'12px 8px', borderRadius:10, border:'1px solid rgba(255,255,255,0.07)', background:'rgba(255,255,255,0.03)', fontSize:12, fontWeight:500, textDecoration:'none', color:'rgba(255,255,255,0.7)', textAlign:'center', display:'block', transition:'all 0.2s' }}
                  onMouseOver={e => { e.currentTarget.style.background='rgba(201,148,58,0.09)'; e.currentTarget.style.borderColor='rgba(201,148,58,0.25)'; e.currentTarget.style.color='#fff'; }}
                  onMouseOut={e  => { e.currentTarget.style.background='rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'; e.currentTarget.style.color='rgba(255,255,255,0.7)'; }}>
                  <span style={{ display:'block', fontSize:20, marginBottom:5 }}>{a.icon}</span>
                  {a.label}
                </a>
              ))}
            </div>
          </div>

          {/* Collections by type — real data */}
          <div className="glass-card animate-up" style={{ animationDelay:'0.18s' }}>
            <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)', background:'rgba(255,255,255,0.02)' }}>
              <span style={{ fontFamily:'var(--font-display)', fontSize:17, fontWeight:600, color:'var(--white)' }}>Collections by Type</span>
            </div>
            <div style={{ padding:'16px 18px', display:'flex', flexDirection:'column', gap:14 }}>
              {stats?.recentPayments?.length > 0 ? (() => {
                const typeColors = {
                  tithe:         { color:'linear-gradient(90deg,var(--green),#7EEAA3)',      label:'Tithe'         },
                  dues:          { color:'linear-gradient(90deg,var(--gold),var(--gold2))',  label:'Dues'          },
                  building_fund: { color:'linear-gradient(90deg,var(--blue),#93BBFF)',       label:'Building Fund' },
                  welfare:       { color:'linear-gradient(90deg,#A78BFA,#C4B5FD)',           label:'Welfare'       },
                  youth_levy:    { color:'linear-gradient(90deg,var(--red),#FF8A8A)',        label:'Youth Levy'    },
                  offering:      { color:'linear-gradient(90deg,var(--muted),#aaa)',         label:'Offering'      },
                  other:         { color:'linear-gradient(90deg,var(--muted),#aaa)',         label:'Other'         },
                };
                const byType = {};
                stats.recentPayments.forEach(p => { byType[p.type] = (byType[p.type] || 0) + p.amount; });
                const total = Object.values(byType).reduce((s,v) => s+v, 0) || 1;
                return Object.entries(byType).map(([type, amt]) => {
                  const pct = Math.round((amt / total) * 100);
                  const tc  = typeColors[type] || typeColors.other;
                  return (
                    <div key={type}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                        <span style={{ fontSize:12, color:'rgba(255,255,255,0.6)' }}>{tc.label}</span>
                        <span style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.9)' }}>
                          GH₵ {amt.toLocaleString()} <span style={{ color:'var(--muted)', fontWeight:400 }}>({pct}%)</span>
                        </span>
                      </div>
                      <div style={{ height:4, background:'rgba(255,255,255,0.07)', borderRadius:4, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${pct}%`, background:tc.color, borderRadius:4, transition:'width 1s cubic-bezier(.4,0,.2,1)' }}/>
                      </div>
                    </div>
                  );
                });
              })() : (
                <div style={{ textAlign:'center', padding:'16px 0', color:'var(--muted)', fontSize:13 }}>
                  No payment data yet.
                </div>
              )}
            </div>
          </div>

          {/* Live activity */}
          <div className="glass-card animate-up" style={{ animationDelay:'0.25s' }}>
            <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)', background:'rgba(255,255,255,0.02)' }}>
              <span style={{ fontFamily:'var(--font-display)', fontSize:17, fontWeight:600, color:'var(--white)' }}>Live Activity</span>
            </div>
            <div style={{ padding:'4px 0' }}>
              {(stats?.recentPayments || []).slice(0,3).map((p, i) => (
                <div key={p._id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 18px', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ width:7, height:7, borderRadius:'50%', flexShrink:0, background:['var(--gold)','var(--green)','var(--blue)'][i], boxShadow:`0 0 8px ${['rgba(201,148,58,0.7)','rgba(46,204,113,0.7)','rgba(91,141,239,0.7)'][i]}` }}/>
                  <div style={{ fontSize:12.5, color:'rgba(255,255,255,0.55)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    <strong style={{ color:'rgba(255,255,255,0.8)', fontWeight:500 }}>{p.member?.firstName}</strong> paid GH₵{p.amount?.toLocaleString()}
                  </div>
                </div>
              ))}
              {!stats?.recentPayments?.length && (
                <div style={{ padding:'16px 18px', color:'var(--muted)', fontSize:12.5 }}>No activity yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}