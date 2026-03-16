import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';
import { CHURCH } from '../config';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const greet  = () => { const h=new Date().getHours(); return h<12?'Good morning':h<17?'Good afternoon':'Good evening'; };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active||!payload?.length) return null;
  return (
    <div style={{ background:'rgba(8,14,30,0.95)', border:'1px solid rgba(201,148,58,0.25)', borderRadius:10, padding:'10px 14px', fontFamily:'var(--font-body)' }}>
      <div style={{ fontSize:11, color:'var(--muted)', marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:15, fontWeight:600, color:'var(--gold2)' }}>GH₵ {payload[0].value?.toLocaleString()}</div>
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

  const chartData = MONTHS.map((name,i) => {
    const found = stats?.monthlyBreakdown?.find(m => m._id===i+1);
    return { name, amount: found?.total||0 };
  });

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', flexDirection:'column', gap:16 }}>
      <div style={{ width:40, height:40, border:'2px solid rgba(201,148,58,0.2)', borderTop:'2px solid var(--gold)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
      <div style={{ fontSize:13, color:'var(--muted)' }}>Loading dashboard...</div>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:34 }} className="animate-up">
        <div>
          <div className="pg-breadcrumb">{CHURCH.name}</div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:38, fontWeight:700, color:'var(--white)', lineHeight:1 }}>
            {greet()}, <span style={{ color:'var(--gold2)', fontStyle:'italic' }}>Pastor</span> 👋
          </h1>
          <p className="pg-sub">
            {new Date().toLocaleDateString('en-GH',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
            &nbsp;·&nbsp; Here's your church overview
          </p>
        </div>
        <div style={{ display:'flex', gap:10, paddingBottom:4 }}>
          <a href="/payments" className="btn btn-ghost" style={{ textDecoration:'none' }}>+ Record Payment</a>
          <a href="/members"  className="btn btn-gold"  style={{ textDecoration:'none' }}>+ Add Member</a>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', className:"stats-4", gap:16, marginBottom:28 }} className="stagger">
        {[
          { label:'Total Members',   value: stats?.totalMembers??'—',                           sub:`+${stats?.newThisYear??0} joined this year`,  accent:'var(--gold)',  glow:'rgba(201,148,58,0.15)',  icon:'👥' },
          { label:'Dues Collected',  value:`GH₵ ${(stats?.totalCollected??0).toLocaleString()}`,sub:'Collected this year',                          accent:'var(--green)', glow:'rgba(46,204,113,0.12)', icon:'💰' },
          { label:'Pending Members', value: stats?.pendingCount??'—',                           sub:"Haven't paid this month",                      accent:'var(--red)',   glow:'rgba(224,85,85,0.12)',  icon:'⏰' },
          { label:'This Month',      value:`GH₵ ${(stats?.thisMonth??0).toLocaleString()}`,     sub:'Collected so far',                             accent:'var(--blue)',  glow:'rgba(91,141,239,0.12)', icon:'📈' },
        ].map((s,i) => (
          <div key={s.label} className="animate-up" style={{ background:'rgba(255,255,255,0.03)', borderRadius:16, padding:'22px 24px', border:'1px solid rgba(255,255,255,0.07)', position:'relative', overflow:'hidden', transition:'all 0.3s', cursor:'default', animationDelay:`${i*0.07}s` }}
            onMouseOver={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.borderColor='rgba(201,148,58,0.2)'}}
            onMouseOut={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'}}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${s.accent},transparent)` }}/>
            <div style={{ position:'absolute', right:-20, top:-20, width:120, height:120, borderRadius:'50%', background:s.glow, filter:'blur(30px)', pointerEvents:'none' }}/>
            <div style={{ fontSize:10.5, fontWeight:600, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:14 }}>{s.label}</div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:32, fontWeight:700, color:'var(--white)', lineHeight:1, marginBottom:10 }}>{s.value}</div>
            <div style={{ fontSize:12, color:'var(--muted)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="gold-line"/>

      {/* Content */}
      <div style={{ display:'grid', gap:22 }} className="content-2col">
        <div style={{ display:'flex', flexDirection:'column', gap:22 }}>

          {/* Chart */}
          <div className="glass-card animate-up" style={{ animationDelay:'0.15s' }}>
            <div style={{ padding:'20px 24px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(255,255,255,0.02)' }}>
              <span style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:600, color:'var(--white)' }}>Monthly Collections</span>
              <span style={{ fontSize:11.5, color:'var(--muted)' }}>{new Date().getFullYear()}</span>
            </div>
            <div style={{ padding:'22px 20px 12px' }}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                  <XAxis dataKey="name" tick={{ fontSize:11.5, fill:'var(--muted)', fontFamily:'var(--font-body)' }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fontSize:11.5, fill:'var(--muted)', fontFamily:'var(--font-body)' }} axisLine={false} tickLine={false} tickFormatter={v=>`₵${(v/1000).toFixed(0)}k`}/>
                  <Tooltip content={<CustomTooltip/>} cursor={{ fill:'rgba(201,148,58,0.06)' }}/>
                  <Bar dataKey="amount" fill="rgba(201,148,58,0.25)" radius={[5,5,0,0]}>
                    {chartData.map((entry,i) => (
                      <rect key={i} fill={i===new Date().getMonth() ? 'url(#goldGrad)' : 'rgba(255,255,255,0.08)'}/>
                    ))}
                  </Bar>
                  <defs>
                    <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--gold2)"/>
                      <stop offset="100%" stopColor="var(--gold)"/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent payments */}
          <div className="glass-card animate-up" style={{ animationDelay:'0.2s' }}>
            <div style={{ padding:'18px 24px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(255,255,255,0.02)' }}>
              <span style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:600, color:'var(--white)' }}>Recent Payments</span>
              <a href="/payments" style={{ fontSize:11.5, color:'var(--gold)', textDecoration:'none', fontWeight:500, opacity:0.8 }}>View all →</a>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 24px', padding:'0 24px' }}>
              {(stats?.recentPayments||[]).map(p => (
                <div key={p._id} style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ width:34, height:34, borderRadius:9, background:'rgba(46,204,113,0.1)', border:'1px solid rgba(46,204,113,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0 }}>💰</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:500, color:'rgba(255,255,255,0.9)' }}>{p.member?.firstName} {p.member?.lastName}</div>
                    <div style={{ fontSize:11.5, color:'var(--muted)', textTransform:'capitalize', marginTop:1 }}>{p.type?.replace('_',' ')}</div>
                  </div>
                  <div style={{ fontSize:13.5, fontWeight:600, color:'var(--green)' }}>+GH₵ {p.amount?.toLocaleString()}</div>
                </div>
              ))}
              {!stats?.recentPayments?.length && (
                <div style={{ padding:'24px 0', color:'var(--muted)', fontSize:13, gridColumn:'1/-1' }}>No payments recorded yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right */}
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

          {/* Quick actions */}
          <div className="glass-card animate-up" style={{ animationDelay:'0.1s' }}>
            <div style={{ padding:'18px 22px', borderBottom:'1px solid var(--border)', background:'rgba(255,255,255,0.02)' }}>
              <span style={{ fontFamily:'var(--font-display)', fontSize:19, fontWeight:600, color:'var(--white)' }}>Quick Actions</span>
            </div>
            <div style={{ padding:'16px 18px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[
                { icon:'👤', label:'Add Member',    href:'/members'   },
                { icon:'💳', label:'Record Dues',   href:'/payments'  },
                { icon:'📱', label:'Send Reminder', href:'/reminders' },
                { icon:'📊', label:'Reports',       href:'/reports'   },
              ].map(a => (
                <a key={a.label} href={a.href} style={{ padding:'14px 12px', borderRadius:12, border:'1px solid rgba(255,255,255,0.07)', background:'rgba(255,255,255,0.03)', fontSize:12.5, fontWeight:500, textDecoration:'none', color:'rgba(255,255,255,0.7)', textAlign:'center', display:'block', transition:'all 0.22s' }}
                  onMouseOver={e=>{e.currentTarget.style.background='rgba(201,148,58,0.08)';e.currentTarget.style.borderColor='rgba(201,148,58,0.25)';e.currentTarget.style.color='#fff';e.currentTarget.style.transform='translateY(-1px)'}}
                  onMouseOut={e=>{e.currentTarget.style.background='rgba(255,255,255,0.03)';e.currentTarget.style.borderColor='rgba(255,255,255,0.07)';e.currentTarget.style.color='rgba(255,255,255,0.7)';e.currentTarget.style.transform='translateY(0)'}}>
                  <span style={{ display:'block', fontSize:22, marginBottom:6 }}>{a.icon}</span>
                  {a.label}
                </a>
              ))}
            </div>
          </div>

          {/* Fund progress */}
          <div className="glass-card animate-up" style={{ animationDelay:'0.18s' }}>
            <div style={{ padding:'18px 22px', borderBottom:'1px solid var(--border)', background:'rgba(255,255,255,0.02)' }}>
              <span style={{ fontFamily:'var(--font-display)', fontSize:19, fontWeight:600, color:'var(--white)' }}>Fund Progress</span>
            </div>
            <div style={{ padding:'18px 22px', display:'flex', flexDirection:'column', gap:18 }}>
              {[
                { label:'General Tithes', pct:72, color:'linear-gradient(90deg,var(--gold),var(--gold2))' },
                { label:'Building Fund',  pct:55, color:'linear-gradient(90deg,var(--blue),#93BBFF)'      },
                { label:'Welfare Fund',   pct:88, color:'linear-gradient(90deg,var(--green),#7EEAA3)'     },
                { label:'Youth Ministry', pct:41, color:'linear-gradient(90deg,var(--red),#FF8A8A)'       },
              ].map(f => (
                <div key={f.label}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}>
                    <span style={{ fontSize:12, color:'rgba(255,255,255,0.55)' }}>{f.label}</span>
                    <span style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.9)' }}>{f.pct}%</span>
                  </div>
                  <div style={{ height:4, background:'rgba(255,255,255,0.07)', borderRadius:4, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${f.pct}%`, background:f.color, borderRadius:4, transition:'width 1s cubic-bezier(.4,0,.2,1)' }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity feed */}
          <div className="glass-card animate-up" style={{ animationDelay:'0.25s' }}>
            <div style={{ padding:'18px 22px', borderBottom:'1px solid var(--border)', background:'rgba(255,255,255,0.02)' }}>
              <span style={{ fontFamily:'var(--font-display)', fontSize:19, fontWeight:600, color:'var(--white)' }}>Live Activity</span>
            </div>
            <div style={{ padding:'8px 0' }}>
              {(stats?.recentPayments||[]).slice(0,3).map((p,i) => (
                <div key={p._id} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 22px', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ width:7, height:7, borderRadius:'50%', background:['var(--gold)','var(--green)','var(--blue)'][i], flexShrink:0, boxShadow:`0 0 8px ${['rgba(201,148,58,0.7)','rgba(46,204,113,0.7)','rgba(91,141,239,0.7)'][i]}` }}/>
                  <div style={{ fontSize:12.5, color:'rgba(255,255,255,0.55)', flex:1 }}>
                    <strong style={{ color:'rgba(255,255,255,0.8)', fontWeight:500 }}>{p.member?.firstName}</strong> paid GH₵{p.amount?.toLocaleString()}
                  </div>
                </div>
              ))}
              {!stats?.recentPayments?.length && (
                <div style={{ padding:'18px 22px', color:'var(--muted)', fontSize:12.5 }}>No activity yet</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
