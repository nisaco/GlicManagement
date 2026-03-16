import { useEffect, useState } from 'react';
import axios from 'axios';
import { CHURCH } from '../config';

export default function MembershipCards() {
  const [members,  setMembers]  = useState([]);
  const [search,   setSearch]   = useState('');
  const [selected, setSelected] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [results,  setResults]  = useState([]);
  const [showDrop, setShowDrop] = useState(false);

  useEffect(() => {
    axios.get('/api/members', { params:{ status:'active' } })
      .then(r => setMembers(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (search.length < 2) { setResults([]); setShowDrop(false); return; }
    const q = search.toLowerCase();
    setResults(members.filter(m =>
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(q)
    ).slice(0, 6));
    setShowDrop(true);
  }, [search, members]);

  const selectMember = m => {
    setSelected(m); setSearch(`${m.firstName} ${m.lastName}`); setShowDrop(false);
  };

  const printCard = () => {
    if (!selected) return;
    const mid = selected._id?.slice(-6).toUpperCase();
    const joinDate = selected.membershipDate
      ? new Date(selected.membershipDate).toLocaleDateString('en-GH', { month:'long', year:'numeric' })
      : '—';
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Membership Card</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Outfit:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Outfit',sans-serif;background:#f0f0f0;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}
        .card{
          width:85.6mm;height:54mm;border-radius:8px;overflow:hidden;position:relative;
          background:linear-gradient(135deg,#080E1E,#152244);
          color:#fff;box-shadow:0 8px 32px rgba(0,0,0,0.3);
          font-family:'Outfit',sans-serif;
        }
        .card::before{
          content:'';position:absolute;top:-30px;right:-30px;width:120px;height:120px;
          border-radius:50%;background:radial-gradient(circle,rgba(201,148,58,0.25),transparent 70%);
        }
        .card::after{
          content:'';position:absolute;
          top:0;left:0;right:0;height:2px;
          background:linear-gradient(90deg,transparent,#C9943A,transparent);
        }
        .top{padding:10px 14px 8px;display:flex;align-items:center;justify-content:space-between}
        .logo{width:28px;height:28px;border-radius:6px;background:linear-gradient(135deg,#C9943A,#8B6420);display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:13px;font-weight:700;color:#080E1E}
        .church-name{font-family:'Cormorant Garamond',serif;font-size:10px;font-weight:700;color:#fff;text-align:right;line-height:1.3}
        .divider{height:1px;background:rgba(201,148,58,0.25);margin:0 14px}
        .body{padding:8px 14px}
        .avatar{width:38px;height:38px;border-radius:8px;background:linear-gradient(135deg,#C9943A,#8B6420);display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:14px;font-weight:700;color:#080E1E;float:left;margin-right:10px;margin-top:2px}
        .name{font-family:'Cormorant Garamond',serif;font-size:15px;font-weight:700;color:#fff;line-height:1.2}
        .role{font-size:8px;color:rgba(201,148,58,0.7);text-transform:uppercase;letter-spacing:0.12em;margin-top:2px}
        .info-row{display:flex;gap:14px;margin-top:8px;clear:both}
        .info-item .ilabel{font-size:7px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:0.1em}
        .info-item .ival{font-size:9px;color:rgba(255,255,255,0.8);font-weight:500;margin-top:1px}
        .bottom{position:absolute;bottom:0;left:0;right:0;padding:5px 14px;background:rgba(201,148,58,0.1);border-top:1px solid rgba(201,148,58,0.2);display:flex;align-items:center;justify-content:space-between}
        .member-id{font-size:8px;color:rgba(255,255,255,0.4);letter-spacing:0.12em}
        .barcode{font-size:14px;letter-spacing:3px;color:rgba(255,255,255,0.25)}
        @media print{body{background:transparent;padding:0}@page{size:85.6mm 54mm;margin:0}}
      </style></head><body>
      <div class="card">
        <div class="top">
          <div class="logo">GL</div>
          <div class="church-name">${CHURCH.name}</div>
        </div>
        <div class="divider"></div>
        <div class="body">
          <div class="avatar">${selected.firstName[0]}${selected.lastName[0]}</div>
          <div class="name">${selected.firstName} ${selected.lastName}</div>
          <div class="role">${selected.role}${selected.departments?.length ? ' · ' + selected.departments[0] : ''}</div>
          <div class="info-row">
            <div class="info-item"><div class="ilabel">Member Since</div><div class="ival">${joinDate}</div></div>
            <div class="info-item"><div class="ilabel">Location</div><div class="ival">${selected.location||'—'}</div></div>
            <div class="info-item"><div class="ilabel">Contact</div><div class="ival">${selected.phone||selected.whatsapp||'—'}</div></div>
          </div>
        </div>
        <div class="bottom">
          <div class="member-id">ID: GLIC-${mid}</div>
          <div class="barcode">||| |||| |||</div>
        </div>
      </div>
      <script>window.onload=()=>{window.print();window.close()}<\/script>
      </body></html>`);
    win.document.close();
  };

  const printAll = () => {
    const cards = members.slice(0, 50).map(m => {
      const mid = m._id?.slice(-6).toUpperCase();
      const joinDate = m.membershipDate ? new Date(m.membershipDate).toLocaleDateString('en-GH',{month:'short',year:'numeric'}) : '—';
      return `
        <div class="card">
          <div class="top">
            <div class="logo">GL</div>
            <div class="church-name">${CHURCH.name}</div>
          </div>
          <div class="divider"></div>
          <div class="body">
            <div class="avatar">${m.firstName[0]}${m.lastName[0]}</div>
            <div class="name">${m.firstName} ${m.lastName}</div>
            <div class="role">${m.role}${m.departments?.length ? ' · '+m.departments[0] : ''}</div>
            <div class="info-row">
              <div class="info-item"><div class="ilabel">Since</div><div class="ival">${joinDate}</div></div>
              <div class="info-item"><div class="ilabel">Location</div><div class="ival">${m.location||'—'}</div></div>
            </div>
          </div>
          <div class="bottom">
            <div class="member-id">ID: GLIC-${mid}</div>
            <div class="barcode">||| |||| |||</div>
          </div>
        </div>`;
    }).join('');

    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>All Membership Cards</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Outfit:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Outfit',sans-serif;background:#f0f0f0;padding:20px}
        .grid{display:flex;flex-wrap:wrap;gap:8mm}
        .card{width:85.6mm;height:54mm;border-radius:8px;overflow:hidden;position:relative;background:linear-gradient(135deg,#080E1E,#152244);color:#fff;font-family:'Outfit',sans-serif;flex-shrink:0}
        .card::before{content:'';position:absolute;top:-30px;right:-30px;width:120px;height:120px;border-radius:50%;background:radial-gradient(circle,rgba(201,148,58,0.25),transparent 70%)}
        .card::after{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#C9943A,transparent)}
        .top{padding:10px 14px 8px;display:flex;align-items:center;justify-content:space-between}
        .logo{width:28px;height:28px;border-radius:6px;background:linear-gradient(135deg,#C9943A,#8B6420);display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:13px;font-weight:700;color:#080E1E}
        .church-name{font-family:'Cormorant Garamond',serif;font-size:10px;font-weight:700;color:#fff;text-align:right;line-height:1.3}
        .divider{height:1px;background:rgba(201,148,58,0.25);margin:0 14px}
        .body{padding:8px 14px}
        .avatar{width:38px;height:38px;border-radius:8px;background:linear-gradient(135deg,#C9943A,#8B6420);display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:14px;font-weight:700;color:#080E1E;float:left;margin-right:10px;margin-top:2px}
        .name{font-family:'Cormorant Garamond',serif;font-size:15px;font-weight:700;color:#fff;line-height:1.2}
        .role{font-size:8px;color:rgba(201,148,58,0.7);text-transform:uppercase;letter-spacing:0.12em;margin-top:2px}
        .info-row{display:flex;gap:14px;margin-top:8px;clear:both}
        .info-item .ilabel{font-size:7px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:0.1em}
        .info-item .ival{font-size:9px;color:rgba(255,255,255,0.8);font-weight:500;margin-top:1px}
        .bottom{position:absolute;bottom:0;left:0;right:0;padding:5px 14px;background:rgba(201,148,58,0.1);border-top:1px solid rgba(201,148,58,0.2);display:flex;align-items:center;justify-content:space-between}
        .member-id{font-size:8px;color:rgba(255,255,255,0.4);letter-spacing:0.12em}
        .barcode{font-size:14px;letter-spacing:3px;color:rgba(255,255,255,0.25)}
        @media print{body{background:transparent;padding:0}@page{margin:5mm}}
      </style></head><body>
      <div class="grid">${cards}</div>
      <script>window.onload=()=>{window.print();window.close()}<\/script>
      </body></html>`);
    win.document.close();
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <div className="pg-breadcrumb">Gospel Light International Church</div>
          <h1 className="pg-title">Membership <span style={{ color:'var(--gold2)', fontStyle:'italic' }}>Cards</span></h1>
          <p className="pg-sub">Print professional ID cards for your members</p>
        </div>
        <button onClick={printAll} className="btn btn-ghost">🖨 Print All Cards ({members.length})</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }} className="content-2col">

        {/* Search & select */}
        <div>
          <div className="glass-card" style={{ padding:'20px 22px', marginBottom:16 }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:600, color:'var(--white)', marginBottom:14 }}>Search Member</div>
            <div style={{ position:'relative' }}>
              <input
                placeholder="Type a member's name..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="field-input"
                style={{ paddingLeft:36 }}
              />
              <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:15, opacity:0.4 }}>🔍</span>
              {showDrop && results.length > 0 && (
                <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, right:0, background:'var(--navy3)', border:'1px solid var(--border-gold)', borderRadius:12, overflow:'hidden', zIndex:50, boxShadow:'0 16px 40px rgba(0,0,0,0.5)' }}>
                  {results.map(m => (
                    <div key={m._id} onClick={() => selectMember(m)} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 16px', cursor:'pointer', borderBottom:'1px solid rgba(255,255,255,0.04)', transition:'background 0.15s' }}
                      onMouseOver={e => e.currentTarget.style.background='rgba(201,148,58,0.08)'}
                      onMouseOut={e  => e.currentTarget.style.background='transparent'}>
                      <div style={{ width:32, height:32, borderRadius:8, background:'rgba(201,148,58,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'var(--gold2)', flexShrink:0 }}>
                        {m.firstName[0]}{m.lastName[0]}
                      </div>
                      <div>
                        <div style={{ fontSize:13.5, fontWeight:500, color:'#fff' }}>{m.firstName} {m.lastName}</div>
                        <div style={{ fontSize:11.5, color:'var(--muted)', textTransform:'capitalize' }}>{m.role} · {m.location||'—'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selected && (
              <div style={{ marginTop:16 }}>
                <button onClick={printCard} className="btn btn-gold" style={{ width:'100%', padding:12 }}>
                  🖨 Print Card for {selected.firstName} {selected.lastName}
                </button>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="glass-card" style={{ padding:'18px 22px' }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:600, color:'var(--white)', marginBottom:12 }}>Printing Tips</div>
            {[
              'Cards are standard credit card size (85.6mm × 54mm)',
              'Use cardstock paper for professional results',
              'Print All Cards prints up to 50 at a time',
              'Cards include member ID, role, department and location',
            ].map((tip, i) => (
              <div key={i} style={{ display:'flex', gap:8, marginBottom:8, fontSize:12.5, color:'var(--muted)', lineHeight:1.5 }}>
                <span style={{ color:'var(--gold)', marginTop:1, flexShrink:0 }}>•</span>
                {tip}
              </div>
            ))}
          </div>
        </div>

        {/* Card preview */}
        <div>
          <div style={{ fontSize:11, fontWeight:600, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12 }}>Card Preview</div>
          {/* Visual card preview */}
          <div style={{
            width:'100%', maxWidth:342, aspectRatio:'85.6/54',
            borderRadius:12, background:'linear-gradient(135deg,#080E1E,#152244)',
            border:'1px solid rgba(201,148,58,0.3)',
            padding:'14px 18px', position:'relative', overflow:'hidden',
            boxShadow:'0 12px 40px rgba(0,0,0,0.4)',
          }}>
            {/* Orb */}
            <div style={{ position:'absolute', top:-20, right:-20, width:100, height:100, borderRadius:'50%', background:'radial-gradient(circle,rgba(201,148,58,0.2),transparent 70%)', pointerEvents:'none' }}/>
            {/* Top line */}
            <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg,transparent,var(--gold),transparent)' }}/>

            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <div style={{ width:28, height:28, borderRadius:6, background:'linear-gradient(135deg,var(--gold),#8B6420)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontSize:12, fontWeight:700, color:'var(--navy)' }}>GL</div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:9, fontWeight:700, color:'#fff', textAlign:'right', lineHeight:1.3 }}>{CHURCH.name}</div>
            </div>
            <div style={{ height:1, background:'rgba(201,148,58,0.25)', marginBottom:8 }}/>

            <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
              <div style={{ width:36, height:36, borderRadius:8, background:'linear-gradient(135deg,var(--gold),#8B6420)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontSize:13, fontWeight:700, color:'var(--navy)', flexShrink:0 }}>
                {selected ? `${selected.firstName[0]}${selected.lastName[0]}` : 'GL'}
              </div>
              <div>
                <div style={{ fontFamily:'var(--font-display)', fontSize:14, fontWeight:700, color:'#fff', lineHeight:1.2 }}>
                  {selected ? `${selected.firstName} ${selected.lastName}` : 'Member Name'}
                </div>
                <div style={{ fontSize:8, color:'rgba(201,148,58,0.7)', textTransform:'uppercase', letterSpacing:'0.1em', marginTop:2 }}>
                  {selected ? `${selected.role}${selected.departments?.length ? ' · '+selected.departments[0] : ''}` : 'Role · Department'}
                </div>
                <div style={{ display:'flex', gap:10, marginTop:6 }}>
                  {[
                    { l:'Since', v: selected?.membershipDate ? new Date(selected.membershipDate).toLocaleDateString('en-GH',{month:'short',year:'numeric'}) : '—' },
                    { l:'Location', v: selected?.location || '—' },
                  ].map(info => (
                    <div key={info.l}>
                      <div style={{ fontSize:6.5, color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.1em' }}>{info.l}</div>
                      <div style={{ fontSize:8.5, color:'rgba(255,255,255,0.8)', fontWeight:500, marginTop:1 }}>{info.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'5px 14px', background:'rgba(201,148,58,0.1)', borderTop:'1px solid rgba(201,148,58,0.2)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ fontSize:7.5, color:'rgba(255,255,255,0.4)', letterSpacing:'0.12em' }}>
                ID: GLIC-{selected?._id?.slice(-6).toUpperCase() || 'XXXXXX'}
              </div>
              <div style={{ fontSize:13, letterSpacing:3, color:'rgba(255,255,255,0.2)' }}>||| ||||</div>
            </div>
          </div>

          <div style={{ marginTop:10, fontSize:12, color:'var(--muted)' }}>
            {selected ? `Showing card for ${selected.firstName} ${selected.lastName}` : 'Search for a member to preview their card'}
          </div>
        </div>
      </div>
    </div>
  );
}
