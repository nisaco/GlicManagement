import { useEffect, useState } from 'react';
import axios from 'axios';

const TEMPLATES = {
  gentle: (name,amount,months) => `Hello ${name} 🙏,\n\nThis is a kind reminder from Gospel Light International Church that your dues of GH₵ ${amount} for ${months} month(s) are outstanding.\n\nPlease settle at your earliest convenience. God bless you!\n\n– Gospel Light International Church`,
  firm:   (name,amount,months) => `Dear ${name},\n\nYour dues of GH₵ ${amount} covering ${months} month(s) are now overdue. Please make payment as soon as possible.\n\nContact the church secretary if you have concerns.\n\n– Gospel Light International Church`,
  final:  (name,amount,months) => `Dear ${name},\n\nFINAL NOTICE: Your outstanding dues of GH₵ ${amount} (${months} months) require urgent settlement to maintain your membership standing.\n\nPlease call us immediately.\n\n– Gospel Light International Church`,
};

export default function Reminders() {
  const [overdue,  setOverdue]  = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [template, setTemplate] = useState('gentle');
  const [loading,  setLoading]  = useState(true);
  const [history,  setHistory]  = useState([]);
  const [filter,   setFilter]   = useState('all');

  useEffect(() => {
    axios.get('/api/reminders/overdue').then(r=>setOverdue(r.data)).catch(console.error).finally(()=>setLoading(false));
    axios.get('/api/reminders/history').then(r=>setHistory(r.data)).catch(console.error);
  }, []);

  const toggle   = id => setSelected(p => { const n=new Set(p); n.has(id)?n.delete(id):n.add(id); return n; });
  const selectAll = () => setSelected(new Set(filtered.map(m=>m._id)));
  const clearAll  = () => setSelected(new Set());
  const filtered  = overdue.filter(m => filter==='all' || m.status===filter);

  const waLink = m => {
    const num = m.whatsapp?.replace(/\D/g,'');
    const msg = TEMPLATES[template](m.name.split(' ')[0], m.totalOwed, m.monthsBehind);
    return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
  };

  const sendAll = async () => {
    if (!selected.size) return alert('Select at least one member.');
    const toSend = overdue.filter(m=>selected.has(m._id));
    await axios.post('/api/reminders/log', { memberIds:toSend.map(m=>m._id), template, message:`${template} reminder` }).catch(console.error);
    toSend.forEach((m,i) => setTimeout(()=>window.open(waLink(m),'_blank'), i*800));
    const { data } = await axios.get('/api/reminders/history');
    setHistory(data); clearAll();
  };

  const totalOwed = [...selected].reduce((s,id)=>s+(overdue.find(m=>m._id===id)?.totalOwed||0),0);

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <div className="pg-breadcrumb">Gospel Light International Church</div>
          <h1 className="pg-title">WhatsApp <span style={{ color:'var(--gold2)', fontStyle:'italic' }}>Reminders</span></h1>
          <p className="pg-sub">{overdue.length} members with outstanding dues</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:24 }} className="stagger">
        {[
          { label:'Overdue (2+ months)', value:overdue.filter(m=>m.status==='overdue').length, color:'var(--red)'   },
          { label:'Due This Month',      value:overdue.filter(m=>m.status==='due').length,     color:'var(--amber)' },
          { label:'Total Outstanding',   value:`GH₵ ${overdue.reduce((s,m)=>s+m.totalOwed,0).toLocaleString()}`, color:'var(--gold2)' },
        ].map(s => (
          <div key={s.label} className="glass-card animate-up" style={{ padding:'20px 22px' }}>
            <div style={{ fontSize:10.5, fontWeight:600, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12 }}>{s.label}</div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:32, fontWeight:700, color:s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:20 }} className="content-2col">
        {/* Member list */}
        <div className="glass-card">
          <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)', display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            <span style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:600, color:'var(--white)', flex:1 }}>Overdue Members</span>
            {['all','overdue','due'].map(f => (
              <button key={f} onClick={()=>setFilter(f)} style={{ padding:'5px 12px', borderRadius:20, fontSize:12, cursor:'pointer', fontFamily:'var(--font-body)', border:'none',
                background: filter===f ? 'linear-gradient(135deg,var(--gold),#8B6420)' : 'rgba(255,255,255,0.07)',
                color:      filter===f ? 'var(--navy)' : 'rgba(255,255,255,0.45)',
                fontWeight: filter===f ? 600 : 400,
              }}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>
            ))}
            <button onClick={selectAll} className="btn btn-ghost btn-sm">All</button>
            {selected.size>0 && <button onClick={clearAll} className="btn btn-ghost btn-sm">Clear</button>}
          </div>

          {selected.size>0 && (
            <div style={{ padding:'10px 20px', background:'rgba(201,148,58,0.07)', borderBottom:'1px solid rgba(201,148,58,0.15)', display:'flex', alignItems:'center', gap:12, fontSize:13, flexWrap:'wrap' }}>
              <span style={{ fontWeight:500, color:'var(--gold2)' }}>{selected.size} selected</span>
              <span style={{ color:'var(--muted)' }}>· GH₵ {totalOwed.toLocaleString()} outstanding</span>
              <div style={{ flex:1 }}/>
              <button onClick={sendAll} style={{ padding:'8px 18px', borderRadius:10, background:'#25D366', color:'#fff', border:'none', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)' }}>
                📱 Send WhatsApp to {selected.size}
              </button>
            </div>
          )}

          <div>
            {loading && <div className="page-loading" style={{ minHeight:100 }}><div className="spinner"/></div>}
            {!loading && filtered.map(m => (
              <div key={m._id} onClick={()=>toggle(m._id)} style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 20px', borderBottom:'1px solid rgba(255,255,255,0.04)', cursor:'pointer', transition:'background 0.15s',
                background: selected.has(m._id) ? 'rgba(201,148,58,0.05)' : 'transparent' }}>
                <div style={{ width:17,height:17,borderRadius:5,flexShrink:0, border:`1.5px solid ${selected.has(m._id)?'var(--gold)':'rgba(255,255,255,0.2)'}`, background:selected.has(m._id)?'var(--gold)':'transparent', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}>
                  {selected.has(m._id) && <span style={{ color:'var(--navy)', fontSize:10, fontWeight:700 }}>✓</span>}
                </div>
                <div style={{ width:36,height:36,borderRadius:10,background:m.status==='overdue'?'var(--red-dim)':'var(--amber-dim)',color:m.status==='overdue'?'var(--red)':'var(--amber)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:600,flexShrink:0 }}>
                  {m.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13.5, fontWeight:500, color:'var(--white)' }}>{m.name}</div>
                  <div style={{ fontSize:11.5, color:'var(--muted)', marginTop:1 }}>{m.role} · {m.whatsapp||'No WhatsApp'}</div>
                </div>
                <span className={`chip ${m.status==='overdue'?'chip-late':'chip-due'}`}>{m.status==='overdue'?'Overdue':'Due'}</span>
                <div style={{ textAlign:'right', minWidth:70 }}>
                  <div style={{ fontSize:13.5, fontWeight:600, color:'var(--red)' }}>GH₵ {m.totalOwed}</div>
                  <div style={{ fontSize:11, color:'var(--muted)' }}>{m.monthsBehind} mo.</div>
                </div>
                <a href={waLink(m)} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()}
                  style={{ padding:'6px 10px', borderRadius:8, fontSize:13, background:'#25D366', color:'#fff', textDecoration:'none', flexShrink:0 }}>📱</a>
              </div>
            ))}
            {!loading && !filtered.length && (
              <div style={{ padding:36, textAlign:'center', color:'var(--muted)', fontSize:13 }}>No overdue members 🎉</div>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
          <div className="glass-card">
            <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)' }}>
              <span style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:600, color:'var(--white)' }}>Message Template</span>
            </div>
            <div style={{ padding:'16px 18px', display:'flex', flexDirection:'column', gap:10 }}>
              {['gentle','firm','final'].map(t => (
                <div key={t} onClick={()=>setTemplate(t)} style={{ padding:'12px 14px', borderRadius:10, cursor:'pointer', transition:'all 0.15s',
                  background: template===t ? 'rgba(201,148,58,0.08)' : 'rgba(255,255,255,0.03)',
                  border:     template===t ? '1px solid rgba(201,148,58,0.3)' : '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ fontWeight:500, fontSize:13, color: template===t ? 'var(--gold2)' : 'rgba(255,255,255,0.7)', marginBottom:2 }}>
                    {t==='gentle'?'🙏 Gentle':t==='firm'?'📢 Firm':'🚨 Final Notice'}
                  </div>
                  <div style={{ fontSize:11.5, color:'var(--muted)' }}>
                    {t==='gentle'?'Kind, friendly reminder':t==='firm'?'Direct, professional tone':'Urgent, last warning'}
                  </div>
                </div>
              ))}
              <div style={{ marginTop:6 }}>
                <div style={{ fontSize:11, color:'var(--muted)', marginBottom:6, fontWeight:500, textTransform:'uppercase', letterSpacing:'0.08em' }}>Preview</div>
                <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:12, fontSize:12, lineHeight:1.7, color:'rgba(255,255,255,0.55)', whiteSpace:'pre-wrap' }}>
                  {TEMPLATES[template]('Kwame',400,2)}
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card">
            <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)' }}>
              <span style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:600, color:'var(--white)' }}>Recent Reminders</span>
            </div>
            <div style={{ padding:'0 18px' }}>
              {history.length===0 && <div style={{ padding:'20px 0', color:'var(--muted)', fontSize:13 }}>No reminders sent yet.</div>}
              {history.map(h => (
                <div key={h._id} style={{ display:'flex', gap:10, padding:'11px 0', borderBottom:'1px solid rgba(255,255,255,0.04)', alignItems:'flex-start' }}>
                  <div style={{ width:30,height:30,borderRadius:8,background:'rgba(37,211,102,0.12)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0 }}>📱</div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:500, color:'var(--white)' }}>{h.count} member{h.count!==1?'s':''}</div>
                    <div style={{ fontSize:11.5, color:'var(--muted)' }}>{h.template} · {new Date(h.createdAt).toLocaleDateString('en-GH',{day:'numeric',month:'short',year:'numeric'})}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
