import { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const COLORS  = ['#C9943A','#5B8DEF','#2ECC71','#E8B96A','#A78BFA','#E05555','#8B96A8'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active||!payload?.length) return null;
  return (
    <div style={{ background:'rgba(8,14,30,0.95)', border:'1px solid rgba(201,148,58,0.25)', borderRadius:10, padding:'10px 14px', fontFamily:'var(--font-body)' }}>
      <div style={{ fontSize:11, color:'var(--muted)', marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:15, fontWeight:600, color:'var(--gold2)' }}>GH₵ {payload[0].value?.toLocaleString()}</div>
    </div>
  );
};

export default function Reports() {
  const [stats,    setStats]    = useState(null);
  const [payments, setPayments] = useState([]);
  const [year,     setYear]     = useState(new Date().getFullYear());
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([axios.get('/api/dashboard/stats'), axios.get('/api/payments')])
      .then(([s,p]) => { setStats(s.data); setPayments(p.data); })
      .catch(console.error).finally(()=>setLoading(false));
  }, [year]);

  if (loading) return <div className="page-loading"><div className="spinner"/><span>Loading reports...</span></div>;

  const monthlyData = MONTHS.map((name,i) => {
    const found = stats?.monthlyBreakdown?.find(m=>m._id===i+1);
    return { name, amount:found?.total||0 };
  });

  const typeMap = {};
  payments.forEach(p => { const k=p.type?.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase()); typeMap[k]=(typeMap[k]||0)+p.amount; });
  const pieData = Object.entries(typeMap).map(([name,value])=>({name,value}));

  const methodMap = {};
  payments.forEach(p => { const k=p.method?.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())||'Unknown'; methodMap[k]=(methodMap[k]||0)+p.amount; });
  const methodData = Object.entries(methodMap).map(([name,value])=>({name,value}));
  const totalCollected = payments.reduce((s,p)=>s+p.amount,0);

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <div className="pg-breadcrumb">Gospel Light International Church</div>
          <h1 className="pg-title">Reports & <span style={{ color:'var(--gold2)', fontStyle:'italic' }}>Analytics</span></h1>
          <p className="pg-sub">Financial summary and insights</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <select value={year} onChange={e=>setYear(Number(e.target.value))} className="field-input" style={{ width:'auto', padding:'9px 14px' }}>
            {[2023,2024,2025,2026].map(y=><option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={()=>window.print()} className="btn btn-ghost">🖨 Print</button>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }} className="stagger stats-4">
        {[
          { label:'Total Collected',  value:`GH₵ ${totalCollected.toLocaleString()}`, color:'var(--green)' },
          { label:'Total Members',    value:stats?.totalMembers??'—',                 color:'var(--gold2)' },
          { label:'Pending Members',  value:stats?.pendingCount??'—',                 color:'var(--red)'   },
          { label:'This Month',       value:`GH₵ ${(stats?.thisMonth??0).toLocaleString()}`, color:'var(--blue)' },
        ].map((s,i) => (
          <div key={s.label} className="glass-card animate-up" style={{ padding:'20px 22px', animationDelay:`${i*0.07}s` }}>
            <div style={{ fontSize:10.5, fontWeight:600, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12 }}>{s.label}</div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:700, color:s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Monthly chart */}
      <div className="glass-card" style={{ marginBottom:20 }}>
        <div style={{ padding:'18px 22px', borderBottom:'1px solid var(--border)', background:'rgba(255,255,255,0.02)' }}>
          <span style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:600, color:'var(--white)' }}>Monthly Collections — {year}</span>
        </div>
        <div style={{ padding:'20px 16px 12px' }}>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={monthlyData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
              <XAxis dataKey="name" tick={{ fontSize:11.5, fill:'var(--muted)', fontFamily:'var(--font-body)' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:11.5, fill:'var(--muted)', fontFamily:'var(--font-body)' }} axisLine={false} tickLine={false} tickFormatter={v=>`₵${(v/1000).toFixed(0)}k`}/>
              <Tooltip content={<CustomTooltip/>} cursor={{ fill:'rgba(201,148,58,0.06)' }}/>
              <Bar dataKey="amount" fill="rgba(201,148,58,0.3)" radius={[5,5,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie charts */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:20 }} className="content-2col">
        {[{ title:'By Type', data:pieData },{ title:'By Method', data:methodData }].map(({ title, data }) => (
          <div key={title} className="glass-card">
            <div style={{ padding:'16px 22px', borderBottom:'1px solid var(--border)', background:'rgba(255,255,255,0.02)' }}>
              <span style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:600, color:'var(--white)' }}>Collections {title}</span>
            </div>
            <div style={{ padding:'16px' }}>
              {data.length ? (
                <ResponsiveContainer width="100%" height={210}>
                  <PieChart>
                    <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                      label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                      labelLine={{ stroke:'rgba(255,255,255,0.2)' }}>
                      {data.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                    </Pie>
                    <Tooltip contentStyle={{ background:'rgba(8,14,30,0.95)', border:'1px solid rgba(201,148,58,0.25)', borderRadius:10, color:'#fff', fontFamily:'var(--font-body)' }} formatter={v=>`GH₵ ${v.toLocaleString()}`}/>
                  </PieChart>
                </ResponsiveContainer>
              ) : <div style={{ padding:40, textAlign:'center', color:'var(--muted)', fontSize:13 }}>No data yet</div>}
            </div>
          </div>
        ))}
      </div>

      {/* All payments table */}
      <div className="glass-card">
        <div style={{ padding:'18px 22px', borderBottom:'1px solid var(--border)', background:'rgba(255,255,255,0.02)' }}>
          <span style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:600, color:'var(--white)' }}>All Payment Records</span>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>{['Member','Type','Amount','Period','Method','Date'].map(h=><th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p._id}>
                  <td style={{ fontWeight:500 }}>{p.member?.firstName} {p.member?.lastName}</td>
                  <td style={{ textTransform:'capitalize', color:'var(--muted)' }}>{p.type?.replace('_',' ')}</td>
                  <td style={{ color:'var(--green)', fontWeight:600 }}>GH₵ {p.amount?.toLocaleString()}</td>
                  <td style={{ color:'var(--muted)' }}>{p.month?MONTHS[p.month-1]:'—'} {p.year}</td>
                  <td style={{ color:'var(--muted)', textTransform:'capitalize' }}>{p.method?.replace('_',' ')}</td>
                  <td style={{ color:'var(--muted)', fontSize:12 }}>{new Date(p.createdAt).toLocaleDateString('en-GH')}</td>
                </tr>
              ))}
              {!payments.length && <tr><td colSpan={6} style={{ padding:36, textAlign:'center', color:'var(--muted)' }}>No payments yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
