import { useEffect, useState } from 'react';
import axios from 'axios';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const SHORT   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function Birthdays() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('upcoming'); // upcoming | thisMonth | all

  useEffect(() => {
    axios.get('/api/members', { params: { status:'active' } })
      .then(r => setMembers(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const today    = new Date();
  const todayMD  = { month: today.getMonth()+1, day: today.getDate() };

  const withBirthday = members
    .filter(m => m.dob)
    .map(m => {
      const dob   = new Date(m.dob);
      const month = dob.getMonth() + 1;
      const day   = dob.getDate();
      const year  = dob.getFullYear();
      const age   = today.getFullYear() - year - (
        (today.getMonth()+1 < month || (today.getMonth()+1 === month && today.getDate() < day)) ? 1 : 0
      );
      // Days until next birthday
      let nextBday = new Date(today.getFullYear(), month-1, day);
      if (nextBday < today) nextBday.setFullYear(today.getFullYear()+1);
      const daysUntil = Math.ceil((nextBday - today) / (1000*60*60*24));
      const isToday   = daysUntil === 0 || (month === todayMD.month && day === todayMD.day);
      const isThisWeek = daysUntil <= 7;
      const isThisMonth = month === todayMD.month;
      return { ...m, month, day, year, age, daysUntil: isToday ? 0 : daysUntil, isToday, isThisWeek, isThisMonth };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const filtered = withBirthday.filter(m => {
    if (filter === 'upcoming')  return m.daysUntil <= 30;
    if (filter === 'thisMonth') return m.isThisMonth;
    return true;
  });

  const todayBirthdays   = withBirthday.filter(m => m.isToday);
  const thisWeekBdays    = withBirthday.filter(m => m.isThisWeek && !m.isToday);
  const noBirthday       = members.filter(m => !m.dob).length;

  const waLink = (m) => {
    const num = m.whatsapp?.replace(/\D/g,'');
    const msg = `Hello ${m.firstName} 🎂🎉\n\nWishing you a wonderful birthday from all of us at Gospel Light International Church!\n\nMay God bless you abundantly on your special day. 🙏\n\n– Gospel Light International Church`;
    return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <div className="pg-breadcrumb">Gospel Light International Church</div>
          <h1 className="pg-title">🎂 Birthday <span style={{ color:'var(--gold2)', fontStyle:'italic' }}>Tracker</span></h1>
          <p className="pg-sub">Never miss a member's birthday — send greetings via WhatsApp</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }} className="stagger stats-4">
        {[
          { label:"Today's Birthdays",  value: todayBirthdays.length,  color:'var(--gold2)', icon:'🎂' },
          { label:'This Week',          value: thisWeekBdays.length,   color:'var(--green)', icon:'📅' },
          { label:'This Month',         value: withBirthday.filter(m=>m.isThisMonth).length, color:'var(--blue)', icon:'🗓' },
          { label:'No DOB recorded',    value: noBirthday,                color:'var(--muted)', icon:'❓' },
        ].map(s => (
          <div key={s.label} className="glass-card animate-up" style={{ padding:'18px 20px' }}>
            <div style={{ fontSize:10.5, fontWeight:600, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10 }}>{s.label}</div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:22 }}>{s.icon}</span>
              <span style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:700, color:s.color }}>{s.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Today's birthdays highlight */}
      {todayBirthdays.length > 0 && (
        <div style={{ background:'linear-gradient(135deg,rgba(201,148,58,0.12),rgba(201,148,58,0.05))', border:'1px solid rgba(201,148,58,0.3)', borderRadius:14, padding:'18px 22px', marginBottom:20 }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:600, color:'var(--gold2)', marginBottom:12 }}>🎉 Today's Birthdays!</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
            {todayBirthdays.map(m => (
              <div key={m._id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:10, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(201,148,58,0.2)' }}>
                <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,var(--gold),#8B6420)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'var(--navy)', flexShrink:0 }}>
                  {m.firstName[0]}{m.lastName[0]}
                </div>
                <div>
                  <div style={{ fontSize:13.5, fontWeight:500, color:'var(--white)' }}>{m.firstName} {m.lastName}</div>
                  <div style={{ fontSize:12, color:'var(--muted)' }}>Turns {m.age} today 🎂</div>
                </div>
                {m.whatsapp && (
                  <a href={waLink(m)} target="_blank" rel="noreferrer"
                    style={{ padding:'6px 12px', borderRadius:8, background:'#25D366', color:'#fff', textDecoration:'none', fontSize:12, fontWeight:600, flexShrink:0 }}>
                    📱 Wish
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div style={{ display:'flex', gap:8, marginBottom:18, flexWrap:'wrap' }}>
        {[
          { k:'upcoming',  label:'Next 30 Days' },
          { k:'thisMonth', label:'This Month'   },
          { k:'all',       label:'All Members'  },
        ].map(f => (
          <button key={f.k} onClick={() => setFilter(f.k)} style={{
            padding:'7px 16px', borderRadius:20, fontSize:12.5, cursor:'pointer',
            fontFamily:'var(--font-body)', transition:'all 0.18s', border:'none',
            background: filter===f.k ? 'linear-gradient(135deg,var(--gold),#8B6420)' : 'rgba(255,255,255,0.06)',
            color:      filter===f.k ? 'var(--navy)' : 'rgba(255,255,255,0.5)',
            fontWeight: filter===f.k ? 600 : 400,
          }}>{f.label}</button>
        ))}
      </div>

      {/* Birthday list */}
      <div className="glass-card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>{['Member','Birthday','Age','Days Until','Department','WhatsApp Greeting',''].map(h=><th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} style={{ padding:28, textAlign:'center' }}><div className="spinner"/></td></tr>}
              {!loading && filtered.map(m => (
                <tr key={m._id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:34, height:34, borderRadius:9, background:'rgba(201,148,58,0.12)', border:'1px solid rgba(201,148,58,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'var(--gold2)', flexShrink:0 }}>
                        {m.firstName[0]}{m.lastName[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight:500, color:'var(--white)' }}>{m.firstName} {m.lastName}</div>
                        <div style={{ fontSize:11.5, color:'var(--muted)', textTransform:'capitalize' }}>{m.role}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontWeight:500, color:'var(--white)' }}>
                    {SHORT[m.month-1]} {m.day}
                    {m.isToday && <span style={{ marginLeft:8, fontSize:10, padding:'2px 7px', borderRadius:20, background:'rgba(201,148,58,0.2)', color:'var(--gold2)', fontWeight:600 }}>TODAY</span>}
                  </td>
                  <td style={{ color:'var(--muted)' }}>Turning {m.age + (m.isToday ? 0 : 1)}</td>
                  <td>
                    {m.isToday ? (
                      <span style={{ color:'var(--gold2)', fontWeight:600, fontSize:13 }}>🎂 Today!</span>
                    ) : (
                      <span style={{ color: m.daysUntil <= 7 ? 'var(--green)' : 'var(--muted)', fontWeight: m.daysUntil <= 7 ? 500 : 400 }}>
                        {m.daysUntil} day{m.daysUntil !== 1 ? 's' : ''}
                      </span>
                    )}
                  </td>
                  <td style={{ color:'var(--muted)', fontSize:12 }}>
                    {m.departments?.length ? m.departments.join(', ') : '—'}
                  </td>
                  <td>
                    {m.whatsapp ? (
                      <a href={waLink(m)} target="_blank" rel="noreferrer"
                        style={{ padding:'5px 12px', borderRadius:8, background:'#25D366', color:'#fff', textDecoration:'none', fontSize:12, fontWeight:600 }}>
                        📱 Send Wish
                      </a>
                    ) : (
                      <span style={{ fontSize:12, color:'var(--muted)' }}>No WhatsApp</span>
                    )}
                  </td>
                  <td style={{ color:'var(--muted)', fontSize:12 }}>{m.location||'—'}</td>
                </tr>
              ))}
              {!loading && !filtered.length && (
                <tr><td colSpan={7} style={{ padding:36, textAlign:'center', color:'var(--muted)' }}>
                  No birthdays found for this filter.<br/>
                  <span style={{ fontSize:12, marginTop:6, display:'block' }}>Make sure members have their Date of Birth recorded.</span>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
