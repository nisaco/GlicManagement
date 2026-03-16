import { useEffect, useState, useRef } from 'react';
import axios from 'axios';

const DEPARTMENTS = ['Choir','Ushering',"Women's Ministry","Men's Fellowship",'Youth','Media Team','Welfare'];
const emptyForm = {
  firstName:'', lastName:'', email:'', phone:'', whatsapp:'',
  dob:'', membershipDate:'', baptismDate:'', status:'active',
  role:'member', departments:[], location:'', duesAmount:200, notes:'', photo:''
};

export default function Members() {
  const [members,  setMembers]  = useState([]);
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState('active');
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [form,     setForm]     = useState(emptyForm);
  const [loading,  setLoading]  = useState(true);
  const photoRef = useRef();

  const fetchMembers = async () => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (filter !== 'all') params.status = filter;
    const { data } = await axios.get('/api/members', { params });
    setMembers(data); setLoading(false);
  };

  useEffect(() => { fetchMembers(); }, [search, filter]);

  const openAdd  = () => { setForm(emptyForm); setEditing(null); setShowForm(true); };
  const openEdit = m => {
    setForm({
      ...m,
      dob:            m.dob?.slice(0,10)            || '',
      membershipDate: m.membershipDate?.slice(0,10) || '',
      baptismDate:    m.baptismDate?.slice(0,10)    || '',
      photo:          m.photo || '',
    });
    setEditing(m._id); setShowForm(true);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (editing) await axios.put(`/api/members/${editing}`, form);
    else         await axios.post('/api/members', form);
    setShowForm(false); fetchMembers();
  };

  const handleDelete = async id => {
    if (!window.confirm('Remove this member?')) return;
    await axios.delete(`/api/members/${id}`); fetchMembers();
  };

  const toggleDept = dept => setForm(f => ({
    ...f,
    departments: f.departments.includes(dept)
      ? f.departments.filter(d => d !== dept)
      : [...f.departments, dept],
  }));

  const handlePhoto = e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Photo must be under 2MB'); return; }
    const reader = new FileReader();
    reader.onload = ev => setForm(f => ({ ...f, photo: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const Avatar = ({ member, size = 36, radius = 10 }) => {
    if (member.photo) {
      return <img src={member.photo} alt={member.firstName} style={{ width:size, height:size, borderRadius:radius, objectFit:'cover', flexShrink:0 }}/>;
    }
    return (
      <div style={{ width:size, height:size, borderRadius:radius, background:'rgba(201,148,58,0.12)', border:'1px solid rgba(201,148,58,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*0.33, fontWeight:700, color:'var(--gold2)', flexShrink:0 }}>
        {member.firstName[0]}{member.lastName[0]}
      </div>
    );
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <div className="pg-breadcrumb">Gospel Light International Church</div>
          <h1 className="pg-title">Members</h1>
          <p className="pg-sub">{members.length} members registered</p>
        </div>
        <button onClick={openAdd} className="btn btn-gold">+ Add Member</button>
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:18, flexWrap:'wrap', alignItems:'center' }}>
        <input
          placeholder="Search name, phone, email..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="field-input" style={{ maxWidth:260, padding:'9px 14px' }}
        />
        {['all','active','inactive','visitor'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding:'7px 16px', borderRadius:20, fontSize:12.5, cursor:'pointer',
            fontFamily:'var(--font-body)', transition:'all 0.18s', border:'none',
            background: filter===f ? 'linear-gradient(135deg,var(--gold),#8B6420)' : 'rgba(255,255,255,0.06)',
            color:      filter===f ? 'var(--navy)' : 'rgba(255,255,255,0.5)',
            fontWeight: filter===f ? 600 : 400,
            boxShadow:  filter===f ? 'var(--shadow-gold)' : 'none',
          }}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>
        ))}
      </div>

      <div className="glass-card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>{['Member','WhatsApp','Location','Role','Departments','Monthly Dues','Status',''].map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} style={{ padding:28, textAlign:'center' }}><div className="spinner"/></td></tr>}
              {!loading && members.map(m => (
                <tr key={m._id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <Avatar member={m} size={36} radius={10}/>
                      <div>
                        <div style={{ fontWeight:500, color:'var(--white)' }}>{m.firstName} {m.lastName}</div>
                        <div style={{ fontSize:12, color:'var(--muted)' }}>{m.email||'—'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color:'var(--muted)' }}>{m.whatsapp||m.phone||'—'}</td>
                  <td style={{ color:'var(--muted)' }}>{m.location||'—'}</td>
                  <td style={{ textTransform:'capitalize', color:'rgba(255,255,255,0.7)' }}>{m.role}</td>
                  <td>
                    <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                      {m.departments?.map(d => (
                        <span key={d} style={{ fontSize:10.5, padding:'2px 8px', borderRadius:20, background:'rgba(91,141,239,0.12)', color:'var(--blue)', border:'1px solid rgba(91,141,239,0.2)' }}>{d}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{ color:'var(--gold2)', fontWeight:500 }}>GH₵ {m.duesAmount}</td>
                  <td>
                    <span style={{
                      fontSize:11, fontWeight:600, padding:'4px 10px', borderRadius:20,
                      background: m.status==='active' ? 'rgba(46,204,113,0.1)' : 'rgba(255,255,255,0.06)',
                      color:      m.status==='active' ? 'var(--green)'         : 'var(--muted)',
                      border:     m.status==='active' ? '1px solid rgba(46,204,113,0.2)' : '1px solid rgba(255,255,255,0.1)',
                    }}>{m.status}</span>
                  </td>
                  <td>
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={() => openEdit(m)} className="btn btn-ghost btn-sm">Edit</button>
                      <button onClick={() => handleDelete(m._id)} className="btn btn-danger btn-sm">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && !members.length && (
                <tr><td colSpan={8} style={{ padding:36, textAlign:'center', color:'var(--muted)' }}>No members found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-box modal-box-lg">
            <div className="modal-head">
              <span className="modal-title">{editing ? 'Edit Member' : 'Add New Member'}</span>
              <button onClick={() => setShowForm(false)} style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.6)', width:32, height:32, borderRadius:8, cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>

                {/* Photo upload */}
                <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20, padding:'14px 16px', borderRadius:12, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ width:64, height:64, borderRadius:14, overflow:'hidden', flexShrink:0, background:'rgba(201,148,58,0.1)', border:'1px solid rgba(201,148,58,0.2)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}
                    onClick={() => photoRef.current?.click()}>
                    {form.photo
                      ? <img src={form.photo} alt="preview" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                      : <span style={{ fontSize:24 }}>📷</span>}
                  </div>
                  <div>
                    <div style={{ fontSize:13.5, fontWeight:500, color:'var(--white)', marginBottom:4 }}>Profile Photo</div>
                    <div style={{ fontSize:12, color:'var(--muted)', marginBottom:8 }}>Optional · Max 2MB · JPG or PNG</div>
                    <div style={{ display:'flex', gap:8 }}>
                      <button type="button" onClick={() => photoRef.current?.click()} className="btn btn-ghost btn-sm">
                        {form.photo ? '🔄 Change Photo' : '📷 Upload Photo'}
                      </button>
                      {form.photo && (
                        <button type="button" onClick={() => setForm(f => ({...f, photo:''}))} className="btn btn-danger btn-sm">Remove</button>
                      )}
                    </div>
                  </div>
                  <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display:'none' }} onChange={handlePhoto}/>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  <F label="First Name *"        k="firstName"      form={form} setForm={setForm} required />
                  <F label="Last Name *"         k="lastName"       form={form} setForm={setForm} required />
                  <F label="Email"               k="email"          form={form} setForm={setForm} type="email" />
                  <F label="Phone"               k="phone"          form={form} setForm={setForm} ph="0244000000" />
                  <F label="WhatsApp Number *"   k="whatsapp"       form={form} setForm={setForm} ph="233244000000" required />
                  <F label="Location / Area"     k="location"       form={form} setForm={setForm} ph="e.g. Accra, Tema, Kumasi" />
                  <F label="Date of Birth"       k="dob"            form={form} setForm={setForm} type="date" />
                  <F label="Membership Date"     k="membershipDate" form={form} setForm={setForm} type="date" />
                  <F label="Baptism Date"        k="baptismDate"    form={form} setForm={setForm} type="date" />
                  <F label="Monthly Dues (GH₵)"  k="duesAmount"     form={form} setForm={setForm} type="number" />
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginTop:14 }}>
                  <div>
                    <label className="field-label">Role</label>
                    <select value={form.role} onChange={e => setForm(f => ({...f, role:e.target.value}))} className="field-input">
                      {['member','deacon','elder','pastor','youth','visitor'].map(r => (
                        <option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="field-label">Status</label>
                    <select value={form.status} onChange={e => setForm(f => ({...f, status:e.target.value}))} className="field-input">
                      {['active','inactive','visitor'].map(s => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ marginTop:14 }}>
                  <label className="field-label">Departments</label>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:4 }}>
                    {DEPARTMENTS.map(d => (
                      <button type="button" key={d} onClick={() => toggleDept(d)} style={{
                        padding:'6px 14px', borderRadius:20, fontSize:12.5, cursor:'pointer',
                        fontFamily:'var(--font-body)', transition:'all 0.18s',
                        background: form.departments.includes(d) ? 'linear-gradient(135deg,var(--gold),#8B6420)' : 'rgba(255,255,255,0.06)',
                        color:      form.departments.includes(d) ? 'var(--navy)' : 'rgba(255,255,255,0.5)',
                        border:     form.departments.includes(d) ? 'none' : '1px solid rgba(255,255,255,0.1)',
                        fontWeight: form.departments.includes(d) ? 600 : 400,
                      }}>{d}</button>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop:14 }}>
                  <label className="field-label">Notes</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({...f, notes:e.target.value}))}
                    className="field-input" style={{ resize:'vertical', minHeight:70 }}
                    placeholder="Any additional notes..."/>
                </div>

                <div style={{ display:'flex', gap:10, marginTop:22, justifyContent:'flex-end' }}>
                  <button type="button" onClick={() => setShowForm(false)} className="btn btn-ghost">Cancel</button>
                  <button type="submit" className="btn btn-gold">{editing ? 'Save Changes' : 'Add Member'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const F = ({ label, k, form, setForm, type='text', ph, required }) => (
  <div>
    <label className="field-label">{label}</label>
    <input type={type} value={form[k]} placeholder={ph||''} required={required}
      className="field-input"
      onChange={e => setForm(f => ({ ...f, [k]: type==='number' ? Number(e.target.value) : e.target.value }))}/>
  </div>
);