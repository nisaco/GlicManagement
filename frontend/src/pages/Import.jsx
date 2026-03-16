import { useState, useRef } from 'react';
import axios from 'axios';

const REQUIRED_COLS = ['firstName', 'lastName'];
const ALL_COLS = [
  { key:'firstName',      label:'First Name',        required:true  },
  { key:'lastName',       label:'Last Name',          required:true  },
  { key:'email',          label:'Email',              required:false },
  { key:'phone',          label:'Phone',              required:false },
  { key:'whatsapp',       label:'WhatsApp',           required:false },
  { key:'location',       label:'Location / Area',    required:false },
  { key:'role',           label:'Role',               required:false },
  { key:'status',         label:'Status',             required:false },
  { key:'duesAmount',     label:'Monthly Dues (GH₵)', required:false },
  { key:'departments',    label:'Departments',        required:false },
  { key:'membershipDate', label:'Membership Date',    required:false },
  { key:'notes',          label:'Notes',              required:false },
];

// Download a blank template CSV
const downloadTemplate = () => {
  const headers = ALL_COLS.map(c => c.key).join(',');
  const example = 'Kwame,Mensah,kwame@email.com,0244000001,233244000001,Accra,member,active,200,"Choir,Ushering",2024-01-15,';
  const csv = `${headers}\n${example}`;
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([csv], { type:'text/csv' })),
    download: 'members-import-template.csv',
  });
  a.click();
};

export default function Import() {
  const [step,      setStep]      = useState(1); // 1=upload, 2=preview, 3=done
  const [rows,      setRows]      = useState([]);
  const [headers,   setHeaders]   = useState([]);
  const [mapping,   setMapping]   = useState({});
  const [result,    setResult]    = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [dragOver,  setDragOver]  = useState(false);
  const fileRef = useRef();

  const parseCSV = (text) => {
    const lines = text.trim().split('\n').filter(Boolean);
    if (lines.length < 2) { setError('File must have a header row and at least one data row.'); return; }

    // Parse header
    const hdrs = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g,'').toLowerCase().replace(/\s+/g,''));
    setHeaders(hdrs);

    // Auto-map columns — try to match by name
    const autoMap = {};
    ALL_COLS.forEach(col => {
      const match = hdrs.findIndex(h =>
        h === col.key.toLowerCase() ||
        h === col.label.toLowerCase().replace(/[^a-z]/g,'') ||
        h.includes(col.key.toLowerCase().slice(0,5))
      );
      if (match !== -1) autoMap[col.key] = match;
    });
    setMapping(autoMap);

    // Parse rows
    const parsed = [];
    for (let i = 1; i < lines.length; i++) {
      // Handle quoted commas in CSV
      const cols = [];
      let cur = ''; let inQ = false;
      for (const ch of lines[i]) {
        if (ch === '"') { inQ = !inQ; continue; }
        if (ch === ',' && !inQ) { cols.push(cur.trim()); cur=''; continue; }
        cur += ch;
      }
      cols.push(cur.trim());
      parsed.push(cols);
    }
    setRows(parsed);
    setStep(2);
    setError('');
  };

  const handleFile = file => {
    if (!file) return;
    if (!file.name.match(/\.(csv|xlsx|xls)$/i)) {
      setError('Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
      return;
    }
    // For Excel files, tell user to save as CSV first
    if (file.name.match(/\.xlsx?$/i)) {
      setError('Please save your Excel file as CSV first: File → Save As → CSV (Comma delimited)');
      return;
    }
    const reader = new FileReader();
    reader.onload = e => parseCSV(e.target.result);
    reader.readAsText(file);
  };

  const handleDrop = e => {
    e.preventDefault(); setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const getMappedValue = (row, colKey) => {
    const idx = mapping[colKey];
    if (idx === undefined || idx === null || idx === '') return '';
    return row[idx] || '';
  };

  const buildMemberList = () => rows.map(row => {
    const obj = {};
    ALL_COLS.forEach(col => { obj[col.key] = getMappedValue(row, col.key); });
    return obj;
  });

  const handleImport = async () => {
    // Validate required fields
    const missing = REQUIRED_COLS.filter(k => mapping[k] === undefined || mapping[k] === '');
    if (missing.length) {
      setError(`Please map required columns: ${missing.join(', ')}`);
      return;
    }
    setLoading(true); setError('');
    try {
      const members = buildMemberList();
      const { data } = await axios.post('/api/members/bulk-import', { members });
      setResult(data);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Import failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setStep(1); setRows([]); setHeaders([]); setMapping({}); setResult(null); setError(''); };

  const preview = buildMemberList().slice(0, 5);

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <div className="pg-breadcrumb">Gospel Light International Church</div>
          <h1 className="pg-title">Import <span style={{ color:'var(--gold2)', fontStyle:'italic' }}>Members</span></h1>
          <p className="pg-sub">Bulk upload members from Excel or CSV — no manual entry needed</p>
        </div>
        <button onClick={downloadTemplate} className="btn btn-ghost">📥 Download Template</button>
      </div>

      {/* Steps indicator */}
      <div style={{ display:'flex', alignItems:'center', gap:0, marginBottom:28 }}>
        {[
          { n:1, label:'Upload File'     },
          { n:2, label:'Map & Preview'   },
          { n:3, label:'Done'            },
        ].map((s, i) => (
          <div key={s.n} style={{ display:'flex', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{
                width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:13, fontWeight:700, transition:'all 0.3s',
                background: step >= s.n ? 'linear-gradient(135deg,var(--gold),#8B6420)' : 'rgba(255,255,255,0.06)',
                color:      step >= s.n ? 'var(--navy)' : 'rgba(255,255,255,0.3)',
                border:     step >= s.n ? 'none' : '1px solid rgba(255,255,255,0.1)',
              }}>{step > s.n ? '✓' : s.n}</div>
              <span style={{ fontSize:13, color: step >= s.n ? 'var(--white)' : 'var(--muted)', fontWeight: step===s.n ? 500 : 400 }}>{s.label}</span>
            </div>
            {i < 2 && <div style={{ width:40, height:1, background: step > s.n ? 'var(--gold)' : 'rgba(255,255,255,0.1)', margin:'0 12px', transition:'background 0.3s' }}/>}
          </div>
        ))}
      </div>

      {error && (
        <div style={{ background:'rgba(224,85,85,0.12)', border:'1px solid rgba(224,85,85,0.25)', color:'#FCA5A5', fontSize:13, padding:'12px 16px', borderRadius:10, marginBottom:18 }}>
          ⚠ {error}
        </div>
      )}

      {/* ── STEP 1: Upload ── */}
      {step === 1 && (
        <div>
          {/* How it works */}
          <div className="glass-card" style={{ padding:'20px 24px', marginBottom:20 }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:600, color:'var(--white)', marginBottom:14 }}>How it works</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }} className="content-2col">
              {[
                { icon:'📥', title:'Download template', desc:'Click "Download Template" above to get a blank CSV with the right column headers' },
                { icon:'📝', title:'Fill in your data', desc:'Open in Excel or Google Sheets. Fill in member details — only First Name and Last Name are required' },
                { icon:'⬆️', title:'Upload & import', desc:'Save as CSV and upload here. We\'ll show you a preview before anything is saved' },
              ].map(h => (
                <div key={h.title} style={{ padding:'16px', borderRadius:12, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ fontSize:24, marginBottom:8 }}>{h.icon}</div>
                  <div style={{ fontSize:13.5, fontWeight:500, color:'var(--white)', marginBottom:4 }}>{h.title}</div>
                  <div style={{ fontSize:12, color:'var(--muted)', lineHeight:1.6 }}>{h.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? 'var(--gold)' : 'rgba(201,148,58,0.25)'}`,
              borderRadius:16, padding:'48px 24px', textAlign:'center', cursor:'pointer',
              background: dragOver ? 'rgba(201,148,58,0.06)' : 'rgba(255,255,255,0.02)',
              transition:'all 0.2s',
            }}>
            <div style={{ fontSize:48, marginBottom:14, opacity:0.6 }}>📂</div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:22, color:'var(--white)', marginBottom:8 }}>
              Drop your CSV file here
            </div>
            <div style={{ fontSize:13, color:'var(--muted)', marginBottom:16 }}>or click to browse</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.2)' }}>Supports .csv files · Excel users: File → Save As → CSV</div>
            <input ref={fileRef} type="file" accept=".csv" style={{ display:'none' }} onChange={e => handleFile(e.target.files[0])}/>
          </div>
        </div>
      )}

      {/* ── STEP 2: Map & Preview ── */}
      {step === 2 && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }} className="content-2col">

            {/* Column mapping */}
            <div className="glass-card">
              <div style={{ padding:'16px 22px', borderBottom:'1px solid var(--border)', background:'rgba(255,255,255,0.02)' }}>
                <div style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:600, color:'var(--white)' }}>Map Your Columns</div>
                <div style={{ fontSize:12, color:'var(--muted)', marginTop:3 }}>Match your spreadsheet columns to member fields</div>
              </div>
              <div style={{ padding:'16px 22px', display:'flex', flexDirection:'column', gap:10 }}>
                {ALL_COLS.map(col => (
                  <div key={col.key} style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:160, fontSize:12.5, color: col.required ? 'var(--gold2)' : 'rgba(255,255,255,0.6)', flexShrink:0 }}>
                      {col.label}{col.required && <span style={{ color:'var(--red)', marginLeft:2 }}>*</span>}
                    </div>
                    <select
                      value={mapping[col.key] ?? ''}
                      onChange={e => setMapping(m => ({ ...m, [col.key]: e.target.value === '' ? undefined : Number(e.target.value) }))}
                      style={{ flex:1, padding:'6px 10px', borderRadius:8, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'#fff', fontSize:12, fontFamily:'var(--font-body)', outline:'none' }}>
                      <option value="">— Not mapped —</option>
                      {headers.map((h, i) => (
                        <option key={i} value={i}>{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div className="glass-card" style={{ padding:'20px 22px' }}>
                <div style={{ fontSize:10.5, fontWeight:600, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12 }}>Rows detected</div>
                <div style={{ fontFamily:'var(--font-display)', fontSize:40, fontWeight:700, color:'var(--gold2)' }}>{rows.length}</div>
                <div style={{ fontSize:12, color:'var(--muted)', marginTop:4 }}>members ready to import</div>
              </div>
              <div className="glass-card" style={{ padding:'20px 22px' }}>
                <div style={{ fontSize:10.5, fontWeight:600, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12 }}>Columns in file</div>
                <div style={{ fontFamily:'var(--font-display)', fontSize:40, fontWeight:700, color:'var(--white)' }}>{headers.length}</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginTop:8 }}>
                  {headers.map(h => (
                    <span key={h} style={{ fontSize:10.5, padding:'2px 7px', borderRadius:20, background:'rgba(255,255,255,0.06)', color:'var(--muted)' }}>{h}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Preview table */}
          <div className="glass-card" style={{ marginBottom:20 }}>
            <div style={{ padding:'16px 22px', borderBottom:'1px solid var(--border)', background:'rgba(255,255,255,0.02)' }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:600, color:'var(--white)' }}>
                Preview <span style={{ fontSize:13, fontWeight:400, color:'var(--muted)', fontFamily:'var(--font-body)' }}>(first 5 rows)</span>
              </div>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    {['First Name','Last Name','WhatsApp','Location','Role','Dues','Departments'].map(h => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((m, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight:500 }}>{m.firstName||<span style={{ color:'var(--red)' }}>Missing</span>}</td>
                      <td style={{ fontWeight:500 }}>{m.lastName ||<span style={{ color:'var(--red)' }}>Missing</span>}</td>
                      <td style={{ color:'var(--muted)' }}>{m.whatsapp||'—'}</td>
                      <td style={{ color:'var(--muted)' }}>{m.location||'—'}</td>
                      <td style={{ color:'var(--muted)', textTransform:'capitalize' }}>{m.role||'member'}</td>
                      <td style={{ color:'var(--gold2)' }}>GH₵ {m.duesAmount||200}</td>
                      <td style={{ color:'var(--muted)', fontSize:12 }}>{m.departments||'—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button onClick={reset} className="btn btn-ghost">← Start Over</button>
            <button onClick={handleImport} disabled={loading} className="btn btn-gold" style={{ minWidth:160 }}>
              {loading ? 'Importing...' : `Import ${rows.length} Members →`}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Done ── */}
      {step === 3 && result && (
        <div className="glass-card" style={{ padding:'48px 32px', textAlign:'center' }}>
          <div style={{ fontSize:56, marginBottom:16 }}>🎉</div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:30, fontWeight:700, color:'var(--white)', marginBottom:8 }}>
            Import Complete!
          </div>
          <div style={{ fontSize:14, color:'var(--muted)', marginBottom:28 }}>{result.message}</div>

          <div style={{ display:'flex', justifyContent:'center', gap:16, marginBottom:32, flexWrap:'wrap' }}>
            <div style={{ padding:'16px 28px', borderRadius:14, background:'rgba(46,204,113,0.1)', border:'1px solid rgba(46,204,113,0.2)' }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:32, fontWeight:700, color:'var(--green)' }}>{result.created}</div>
              <div style={{ fontSize:12, color:'var(--muted)', marginTop:4 }}>Members Added</div>
            </div>
            <div style={{ padding:'16px 28px', borderRadius:14, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:32, fontWeight:700, color:'var(--muted)' }}>{result.skipped}</div>
              <div style={{ fontSize:12, color:'var(--muted)', marginTop:4 }}>Skipped (duplicates)</div>
            </div>
          </div>

          {result.errors?.length > 0 && (
            <div style={{ background:'rgba(224,85,85,0.08)', border:'1px solid rgba(224,85,85,0.2)', borderRadius:10, padding:16, marginBottom:20, textAlign:'left' }}>
              <div style={{ fontSize:12, fontWeight:600, color:'var(--red)', marginBottom:8 }}>Some rows had errors:</div>
              {result.errors.map((e, i) => <div key={i} style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginBottom:4 }}>• {e}</div>)}
            </div>
          )}

          <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
            <button onClick={reset} className="btn btn-ghost">Import Another File</button>
            <a href="/members" className="btn btn-gold" style={{ textDecoration:'none' }}>View All Members →</a>
          </div>
        </div>
      )}
    </div>
  );
}
