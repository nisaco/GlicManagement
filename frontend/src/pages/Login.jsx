import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CHURCH } from '../config';

export default function Login() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await login(email, password); navigate('/'); }
    catch (err) { setError(err.response?.data?.message || 'Invalid email or password.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', background:'var(--navy)', display:'flex', alignItems:'center', justifyContent:'center', padding:24, position:'relative', overflow:'hidden' }}>
      {/* Orbs */}
      <div style={{ position:'absolute', top:-120, right:-120, width:500, height:500, background:'radial-gradient(circle,rgba(201,148,58,0.1) 0%,transparent 65%)', borderRadius:'50%', animation:'drift 12s ease-in-out infinite', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', bottom:-80, left:-80, width:380, height:380, background:'radial-gradient(circle,rgba(21,34,68,0.9) 0%,transparent 65%)', borderRadius:'50%', animation:'drift 14s ease-in-out infinite reverse', pointerEvents:'none' }}/>
      {/* Grid */}
      <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(201,148,58,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(201,148,58,0.03) 1px,transparent 1px)', backgroundSize:'60px 60px', pointerEvents:'none' }}/>
      {/* Top gold line */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,var(--gold),transparent)' }}/>

      <div style={{ width:'100%', maxWidth:420, position:'relative', zIndex:2 }} className="animate-up">
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{ width:68, height:68, borderRadius:20, background:'linear-gradient(135deg,var(--gold),#8B6420)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px', boxShadow:'0 0 40px rgba(201,148,58,0.35), 0 8px 24px rgba(0,0,0,0.5)', fontFamily:'var(--font-display)', fontSize:24, fontWeight:700, color:'var(--navy)' }}>
            {CHURCH.logo ? <img src={CHURCH.logo} alt="logo" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:20 }}/> : CHURCH.initials}
          </div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:700, color:'#fff', lineHeight:1.2 }}>{CHURCH.name}</h1>
          <p style={{ fontSize:12.5, color:'rgba(255,255,255,0.35)', marginTop:7, textTransform:'uppercase', letterSpacing:'0.1em' }}>{CHURCH.subtitle}</p>
        </div>

        <div style={{ background:'rgba(255,255,255,0.03)', backdropFilter:'blur(20px)', borderRadius:22, border:'1px solid rgba(201,148,58,0.2)', padding:36, boxShadow:'0 24px 60px rgba(0,0,0,0.5)' }}>
          {/* Inner top line */}
          <div style={{ position:'absolute', top:0, left:'10%', right:'10%', height:1, background:'linear-gradient(90deg,transparent,rgba(201,148,58,0.4),transparent)', borderRadius:1 }}/>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:700, color:'#fff', marginBottom:6 }}>Welcome back</h2>
          <p style={{ fontSize:13, color:'rgba(255,255,255,0.35)', marginBottom:26 }}>Sign in to manage your church</p>

          {error && (
            <div style={{ background:'rgba(224,85,85,0.12)', border:'1px solid rgba(224,85,85,0.25)', color:'#FCA5A5', fontSize:13, padding:'11px 14px', borderRadius:10, marginBottom:18 }}>⚠ {error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:16 }}>
              <div className="field-label">Email address</div>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@glicgh.org" required className="field-input"/>
            </div>
            <div style={{ marginBottom:26 }}>
              <div className="field-label">Password</div>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required className="field-input"/>
            </div>
            <button type="submit" disabled={loading} className="btn btn-gold" style={{ width:'100%', padding:13, fontSize:14, borderRadius:12 }}>
              {loading ? 'Signing in...' : 'Sign in →'}
            </button>
          </form>
          <p style={{ fontSize:12, color:'rgba(255,255,255,0.2)', marginTop:20, textAlign:'center' }}>
            First time? <a href="/setup" style={{ color:'var(--gold2)', textDecoration:'none', opacity:0.8 }}>Create admin account</a>
          </p>
        </div>
      </div>
    </div>
  );
}
