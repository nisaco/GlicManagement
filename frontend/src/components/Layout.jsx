import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CHURCH } from '../config';

const NAV = [
  { section:'Overview' },
  { to:'/',            label:'Dashboard',          icon:'⬛' },
  { section:'Members' },
  { to:'/members',     label:'Members',             icon:'👥' },
  { to:'/import',      label:'Import Members',      icon:'📥' },
  { to:'/birthdays',   label:'Birthdays',           icon:'🎂' },
  { to:'/cards',       label:'Membership Cards',    icon:'🪪' },
  { section:'Finance' },
  { to:'/payments',    label:'Dues & Payments',     icon:'💳' },
  { to:'/pledges',     label:'Pledges',             icon:'🤝' },
  { to:'/reports',     label:'Reports & Analytics', icon:'📊' },
  { section:'Tools' },
  { to:'/attendance',  label:'Attendance',          icon:'📋' },
  { to:'/lookup',      label:'Member Lookup',       icon:'🔍', badge:'PRO' },
  { to:'/reminders',   label:'WhatsApp Reminders',  icon:'📱', pulse:true },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || 'GL';

  return (
    <div style={{ display:'flex', minHeight:'100vh', position:'relative' }}>

      {/* BG orbs */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-100, right:-100, width:500, height:500, background:'radial-gradient(circle,rgba(201,148,58,0.07) 0%,transparent 70%)', animation:'drift 12s ease-in-out infinite', borderRadius:'50%' }}/>
        <div style={{ position:'absolute', bottom:-80, left:-80, width:400, height:400, background:'radial-gradient(circle,rgba(21,34,68,0.8) 0%,transparent 70%)', animation:'drift 14s ease-in-out infinite reverse', borderRadius:'50%', animationDelay:'-4s' }}/>
        <div style={{ position:'absolute', top:'40%', left:'25%', width:300, height:300, background:'radial-gradient(circle,rgba(201,148,58,0.04) 0%,transparent 70%)', animation:'drift 10s ease-in-out infinite', borderRadius:'50%', animationDelay:'-8s' }}/>
      </div>

      {/* Grid lines */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:1, backgroundImage:'linear-gradient(rgba(201,148,58,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(201,148,58,0.025) 1px,transparent 1px)', backgroundSize:'60px 60px' }}/>

      {/* Mobile top bar */}
      <div className="mobile-topbar">
        <button className="hamburger-btn" onClick={() => setOpen(o => !o)} aria-label="Open menu">
          <span style={{ transform: open ? 'rotate(45deg) translate(5px,5px)' : 'none' }}/>
          <span style={{ opacity: open ? 0 : 1 }}/>
          <span style={{ transform: open ? 'rotate(-45deg) translate(5px,-5px)' : 'none' }}/>
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:9 }}>
          <div style={{ width:30, height:30, borderRadius:8, background:'linear-gradient(135deg,var(--gold),#8B6420)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'var(--navy)' }}>
            {CHURCH.logo ? <img src={CHURCH.logo} alt="logo" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:8 }}/> : CHURCH.initials}
          </div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:700, color:'#fff' }}>{CHURCH.shortName}</div>
        </div>
        <div style={{ width:42 }}/>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div onClick={() => setOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', zIndex:190, backdropFilter:'blur(4px)', animation:'fadeIn 0.2s ease' }}/>
      )}

      {/* Sidebar */}
      <aside className={`sidebar-drawer${open ? ' open' : ''}`} style={{
        width:258, background:'rgba(8,14,30,0.98)', backdropFilter:'blur(20px)',
        borderRight:'1px solid rgba(201,148,58,0.15)', display:'flex', flexDirection:'column',
        flexShrink:0, position:'relative', zIndex:10,
      }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,var(--gold),transparent)' }}/>

        {/* Brand */}
        <div style={{ padding:'24px 20px 18px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:11 }}>
            <div style={{ width:44, height:44, borderRadius:12, flexShrink:0, overflow:'hidden', background:'linear-gradient(135deg,var(--gold),#8B6420)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontSize:17, fontWeight:700, color:'var(--navy)', boxShadow:'0 0 24px rgba(201,148,58,0.3)' }}>
              {CHURCH.logo ? <img src={CHURCH.logo} alt="logo" style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : CHURCH.initials}
            </div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:700, color:'#fff', lineHeight:1.3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{CHURCH.name}</div>
              <div style={{ fontSize:9, color:'rgba(201,148,58,0.55)', textTransform:'uppercase', letterSpacing:'0.14em', marginTop:3 }}>{CHURCH.subtitle}</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding:'12px 10px', flex:1, overflowY:'auto' }}>
          {NAV.map((item, i) => {
            if (item.section) return (
              <div key={i} style={{ fontSize:9, fontWeight:600, color:'rgba(255,255,255,0.18)', textTransform:'uppercase', letterSpacing:'0.16em', padding:'14px 10px 5px' }}>
                {item.section}
              </div>
            );
            return (
              <NavLink key={item.to} to={item.to} end={item.to === '/'}
                style={({ isActive }) => ({
                  display:'flex', alignItems:'center', gap:9, padding:'10px 11px',
                  borderRadius:10, fontSize:13, textDecoration:'none', marginBottom:2,
                  transition:'all 0.2s', position:'relative',
                  background:    isActive ? 'linear-gradient(135deg,rgba(201,148,58,0.12),rgba(201,148,58,0.05))' : 'transparent',
                  border:        isActive ? '1px solid rgba(201,148,58,0.2)' : '1px solid transparent',
                  color:         isActive ? '#fff' : 'rgba(255,255,255,0.45)',
                  fontWeight:    isActive ? 500 : 400,
                })}>
                {({ isActive }) => (<>
                  {isActive && <div style={{ position:'absolute', left:0, top:'50%', transform:'translateY(-50%)', width:3, height:'55%', background:'linear-gradient(180deg,var(--gold),var(--gold2))', borderRadius:'0 3px 3px 0' }}/>}
                  <span style={{ width:5, height:5, borderRadius:'50%', flexShrink:0, background:isActive?'var(--gold)':'transparent', boxShadow:isActive?'0 0 8px rgba(201,148,58,0.7)':'none', transition:'all 0.2s' }}/>
                  <div style={{ width:28, height:28, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, background:isActive?'rgba(201,148,58,0.12)':'rgba(255,255,255,0.04)', flexShrink:0, transition:'all 0.2s' }}>{item.icon}</div>
                  <span style={{ flex:1 }}>{item.label}</span>
                  {item.badge && <span style={{ fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:20, background:'rgba(201,148,58,0.2)', color:'var(--gold2)', letterSpacing:'0.05em' }}>{item.badge}</span>}
                  {item.pulse && <span className="pulse" style={{ width:6, height:6, borderRadius:'50%', background:'var(--red)', flexShrink:0, boxShadow:'0 0 8px rgba(224,85,85,0.6)' }}/>}
                </>)}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding:'12px 12px 16px', borderTop:'1px solid var(--border)', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:9, padding:'10px 12px', borderRadius:11, background:'rgba(255,255,255,0.04)', border:'1px solid var(--border)', marginBottom:8 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:'linear-gradient(135deg,var(--gold),#8B6420)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'var(--navy)', flexShrink:0 }}>{initials}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12.5, fontWeight:500, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', textTransform:'capitalize' }}>{user?.role}</div>
            </div>
          </div>
          <button onClick={handleLogout}
            style={{ width:'100%', padding:8, borderRadius:8, border:'1px solid rgba(255,255,255,0.08)', background:'transparent', fontSize:12, color:'rgba(255,255,255,0.35)', cursor:'pointer', fontFamily:'var(--font-body)', transition:'all 0.2s' }}
            onMouseOver={e => { e.target.style.color='rgba(255,255,255,0.7)'; e.target.style.borderColor='rgba(255,255,255,0.2)'; }}
            onMouseOut={e  => { e.target.style.color='rgba(255,255,255,0.35)'; e.target.style.borderColor='rgba(255,255,255,0.08)'; }}>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content" style={{ flex:1, minHeight:'100vh', overflowY:'auto', position:'relative', zIndex:5, padding:'34px 36px', background:'linear-gradient(160deg,rgba(13,23,48,0.98),rgba(8,14,30,0.99))' }}>
        <div className="animate-up">{children}</div>
      </main>
    </div>
  );
}
