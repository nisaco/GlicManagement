import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CHURCH } from '../config';

export default function Setup() {
  const [form, setForm] = useState({ name:'', email:'', password:'', confirm:'' });
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await axios.post('/api/auth/register', { name:form.name, email:form.email, password:form.password, role:'admin' });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2200);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Is the backend running on port 5000?');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', background:'var(--navy)', display:'flex', alignItems:'center', justifyContent:'center', padding:24, position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:-100, right:-100, width:480, height:480, background:'radial-gradient(circle,rgba(201,148,58,0.09) 0%,transparent 65%)', borderRadius:'50%', animation:'drift 12s ease-in-out infinite', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', bottom:-80, left:-80, width:360, height:360, background:'radial-gradient(circle,rgba(21,34,68,0.9) 0%,transparent 65%)', borderRadius:'50%', animation:'drift 14s ease-in-out infinite reverse', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(201,148,58,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(201,148,58,0.03) 1px,transparent 1px)', backgroundSize:'60px 60px', pointerEvents:'none' }}/>

      <div style={{ width:'100%', maxWidth:440, position:'relative', zIndex:2 }} className="animate-up">
        <div style={{ textAlign:'center', marginBottom:30 }}>
          <div style={{ width:62, height:62, borderRadius:18, background:'linear-gradient(135deg,var(--gold),#8B6420)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', boxShadow:'0 0 36px rgba(201,148,58,0.3), 0 8px 24px rgba(0,0,0,0.5)', fontFamily:'var(--font-display)', fontSize:22, fontWeight:700, color:'var(--navy)' }}>
            {CHURCH.initials}
          </div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:700, color:'#fff' }}>{CHURCH.name}</h1>
          <p style={{ fontSize:12, color:'rgba(255,255,255,0.3)', marginTop:5, textTransform:'uppercase', letterSpacing:'0.1em' }}>First Time Setup</p>
        </div>

        <div style={{ background:'rgba(255,255,255,0.03)', backdropFilter:'blur(20px)', borderRadius:22, border:'1px solid rgba(201,148,58,0.2)', padding:34, boxShadow:'0 24px 60px rgba(0,0,0,0.5)' }}>
          {success ? (
            <div style={{ textAlign:'center', padding:'20px 0' }}>
              <div style={{ fontSize:48, marginBottom:14 }}>🎉</div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:600, color:'#fff', marginBottom:8 }}>Account Created!</div>
              <div style={{ fontSize:13, color:'var(--muted)' }}>Redirecting you to login...</div>
            </div>
          ) : (
            <>
              <h2 style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:700, color:'#fff', marginBottom:5 }}>Create Admin Account</h2>
              <p style={{ fontSize:12.5, color:'rgba(255,255,255,0.35)', marginBottom:24 }}>Set up your administrator credentials to get started.</p>
              {error && <div style={{ background:'rgba(224,85,85,0.12)', border:'1px solid rgba(224,85,85,0.25)', color:'#FCA5A5', fontSize:13, padding:'11px 14px', borderRadius:10, marginBottom:18 }}>⚠ {error}</div>}
              <form onSubmit={handleSubmit}>
                <div style={{ display:'grid', gap:14 }}>
                  {[
                    { label:'Your Name',        key:'name',     type:'text',     ph:'e.g. Pastor John Mensah' },
                    { label:'Email Address',    key:'email',    type:'email',    ph:'admin@glicgh.org' },
                    { label:'Password',         key:'password', type:'password', ph:'Choose a strong password' },
                    { label:'Confirm Password', key:'confirm',  type:'password', ph:'Repeat your password' },
                  ].map(f => (
                    <div key={f.key}>
                      <div className="field-label">{f.label}</div>
                      <input type={f.type} placeholder={f.ph} value={form[f.key]}
                        onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} required className="field-input"/>
                    </div>
                  ))}
                </div>
                <button type="submit" disabled={loading} className="btn btn-gold" style={{ width:'100%', padding:13, fontSize:14, borderRadius:12, marginTop:22 }}>
                  {loading ? 'Creating account...' : 'Create Account & Continue →'}
                </button>
              </form>
              <p style={{ fontSize:12, color:'rgba(255,255,255,0.2)', marginTop:18, textAlign:'center' }}>
                Already have an account? <a href="/login" style={{ color:'var(--gold2)', textDecoration:'none' }}>Sign in</a>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
