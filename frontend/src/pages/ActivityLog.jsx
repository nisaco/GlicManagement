import { useEffect, useState } from 'react';
import axios from 'axios';

const CATEGORY_STYLE = {
  payment:    { color:'var(--green)',  bg:'rgba(46,204,113,0.1)',  icon:'💳' },
  member:     { color:'var(--gold2)', bg:'rgba(201,148,58,0.1)',  icon:'👥' },
  attendance: { color:'var(--blue)',  bg:'rgba(91,141,239,0.1)',  icon:'📋' },
  import:     { color:'var(--blue)',  bg:'rgba(91,141,239,0.1)',  icon:'📥' },
  reminder:   { color:'#25D366',      bg:'rgba(37,211,102,0.1)',  icon:'📱' },
  pledge:     { color:'var(--amber)', bg:'rgba(232,185,106,0.1)', icon:'🤝' },
  other:      { color:'var(--muted)', bg:'rgba(255,255,255,0.06)',icon:'📌' },
};

const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff/3600)}h ago`;
  return new Date(date).toLocaleDateString('en-GH', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
};

export default function ActivityLog() {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all');

  useEffect(() => {
    axios.get('/api/activity?limit=100')
      .then(r => setLogs(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? logs : logs.filter(l => l.category === filter);

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <div className="pg-breadcrumb">Gospel Light International Church</div>
          <h1 className="pg-title">Activity <span style={{ color:'var(--gold2)', fontStyle:'italic' }}>Log</span></h1>
          <p className="pg-sub">A full history of everything done in the system</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:20, flexWrap:'wrap' }}>
        {['all','payment','member','attendance','import','reminder','pledge'].map(f => {
          const s = CATEGORY_STYLE[f] || CATEGORY_STYLE.other;
          return (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding:'6px 14px', borderRadius:20, fontSize:12.5, cursor:'pointer',
              fontFamily:'var(--font-body)', transition:'all 0.18s', border:'none',
              background: filter===f ? (f==='all' ? 'linear-gradient(135deg,var(--gold),#8B6420)' : s.bg) : 'rgba(255,255,255,0.05)',
              color:      filter===f ? (f==='all' ? 'var(--navy)' : s.color) : 'rgba(255,255,255,0.4)',
              fontWeight: filter===f ? 600 : 400,
              border:     filter===f && f!=='all' ? `1px solid ${s.color}40` : '1px solid transparent',
            }}>
              {f==='all' ? 'All Activity' : `${s.icon} ${f.charAt(0).toUpperCase()+f.slice(1)}`}
            </button>
          );
        })}
      </div>

      {/* Log list */}
      <div className="glass-card">
        {loading && (
          <div style={{ padding:40, textAlign:'center' }}><div className="spinner"/></div>
        )}
        {!loading && filtered.length === 0 && (
          <div style={{ padding:40, textAlign:'center', color:'var(--muted)', fontSize:13 }}>
            No activity recorded yet. Actions will appear here as you use the system.
          </div>
        )}
        {!loading && filtered.map((log, i) => {
          const s = CATEGORY_STYLE[log.category] || CATEGORY_STYLE.other;
          return (
            <div key={log._id} style={{ display:'flex', alignItems:'flex-start', gap:14, padding:'14px 20px', borderBottom: i < filtered.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none', transition:'background 0.15s' }}
              onMouseOver={e => e.currentTarget.style.background='rgba(255,255,255,0.02)'}
              onMouseOut={e  => e.currentTarget.style.background='transparent'}>

              {/* Icon */}
              <div style={{ width:38, height:38, borderRadius:10, background:s.bg, border:`1px solid ${s.color}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0, marginTop:1 }}>
                {s.icon}
              </div>

              {/* Content */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:3 }}>
                  <span style={{ fontSize:13.5, fontWeight:500, color:'var(--white)' }}>{log.action}</span>
                  <span style={{ fontSize:10.5, fontWeight:600, padding:'2px 8px', borderRadius:20, background:s.bg, color:s.color, textTransform:'capitalize' }}>
                    {log.category}
                  </span>
                </div>
                {log.description && (
                  <div style={{ fontSize:12.5, color:'var(--muted)', lineHeight:1.5 }}>{log.description}</div>
                )}
                <div style={{ display:'flex', gap:12, marginTop:5, alignItems:'center', flexWrap:'wrap' }}>
                  {log.performedBy && (
                    <span style={{ fontSize:11.5, color:'rgba(255,255,255,0.35)' }}>
                      by <strong style={{ color:'rgba(255,255,255,0.55)' }}>{log.performedBy.name}</strong>
                      <span style={{ marginLeft:4, fontSize:10, padding:'1px 6px', borderRadius:20,
                        background: log.performedBy.role==='admin' ? 'rgba(201,148,58,0.12)' : 'rgba(255,255,255,0.06)',
                        color:      log.performedBy.role==='admin' ? 'var(--gold2)' : 'var(--muted)',
                      }}>{log.performedBy.role}</span>
                    </span>
                  )}
                  <span style={{ fontSize:11.5, color:'rgba(255,255,255,0.25)' }}>
                    🕐 {timeAgo(log.createdAt)}
                  </span>
                  <span style={{ fontSize:11, color:'rgba(255,255,255,0.2)' }}>
                    {new Date(log.createdAt).toLocaleDateString('en-GH', { weekday:'short', day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}