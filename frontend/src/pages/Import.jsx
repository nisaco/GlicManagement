import { useState, useRef } from 'react';
import axios from 'axios';
import { logActivity } from '../utils/activityLog';

const MEMBER_COLS = [
  { key:'firstName',      label:'First Name',                    required:true  },
  { key:'lastName',       label:'Last Name',                     required:true  },
  { key:'email',          label:'Email',                         required:false },
  { key:'phone',          label:'Phone',                         required:false },
  { key:'whatsapp',       label:'WhatsApp',                      required:false },
  { key:'location',       label:'Location / Area',               required:false },
  { key:'role',           label:'Role',                          required:false },
  { key:'status',         label:'Status',                        required:false },
  { key:'duesAmount',     label:'Monthly Dues (GH₵)',            required:false },
  { key:'departments',    label:'Departments',                   required:false },
  { key:'membershipDate', label:'Membership Date',               required:false },
  { key:'notes',          label:'Notes',                         required:false },
];

const PAYMENT_COLS = [
  { key:'memberName', label:'Member Full Name',                  required:true  },
  { key:'amount',     label:'Amount (GH₵)',                      required:true  },
  { key:'year',       label:'Year',                              required:true  },
  { key:'months',     label:'Months (e.g. 1 or 1,2,3 or 1-12)', required:false },
  { key:'type',       label:'Payment Type',                      required:false },
  { key:'method',     label:'Payment Method',                    required:false },
  { key:'reference',  label:'Reference / Receipt',               required:false },
  { key:'notes',      label:'Notes',                             required:false },
];

const PAYMENT_TYPES   = ['dues','tithe','building_fund','welfare','youth_levy','offering','other'];
const PAYMENT_METHODS = ['cash','momo','bank_transfer','cheque'];

const downloadTemplate = (type) => {
  const cols    = type === 'members' ? MEMBER_COLS : PAYMENT_COLS;
  const headers = cols.map(c => c.key).join(',');
  const example = type === 'members'
    ? 'Kwame,Mensah,kwame@email.com,0244000001,233244000001,Accra,member,active,200,"Choir,Ushering",2024-01-15,'
    : 'Kwame Mensah,120,2024,1-12,dues,cash,REC001,Paid full year';
  const csv = `${headers}\n${example}`;
  const a   = Object.assign(document.createElement('a'), {
    href:     URL.createObjectURL(new Blob([csv], { type:'text/csv' })),
    download: `${type}-import-template.csv`,
  });
  a.click();
};

const parseCSV = (text) => {
  const lines = text.trim().split('\n').filter(Boolean);
  if (lines.length < 2) return { error: 'File must have a header row and at least one data row.' };
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g,'').toLowerCase().replace(/\s+/g,''));
  const rows    = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = []; let cur = ''; let inQ = false;
    for (const ch of lines[i]) {
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    cols.push(cur.trim());
    rows.push(cols);
  }
  return { headers, rows };
};

export default function Import() {
  const [tab,      setTab]      = useState('members');
  const [step,     setStep]     = useState(1);
  const [rows,     setRows]     = useState([]);
  const [headers,  setHeaders]  = useState([]);
  const [mapping,  setMapping]  = useState({});
  const [result,   setResult]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const COLS = tab === 'members' ? MEMBER_COLS : PAYMENT_COLS;

  const reset            = () => { setStep(1); setRows([]); setHeaders([]); setMapping({}); setResult(null); setError(''); };
  const handleTabChange  = t  => { setTab(t); reset(); };

  const handleFileData = text => {
    const parsed = parseCSV(text);
    if (parsed.error) { setError(parsed.error); return; }
    setHeaders(parsed.headers);
    setRows(parsed.rows);
    const autoMap = {};
    COLS.forEach(col => {
      const match = parsed.headers.findIndex(h =>
        h === col.key.toLowerCase() ||
        h.includes(col.key.toLowerCase().slice(0,5)) ||
        h === col.label.toLowerCase().replace(/[^a-z]/g,'')
      );
      if (match !== -1) autoMap[col.key] = match;
    });
    setMapping(autoMap);
    setStep(2); setError('');
  };

  const handleFile = file => {
    if (!file) return;
    if (!file.name.match(/\.csv$/i)) { setError('Please upload a .csv file. Excel: File → Save As → CSV'); return; }
    const reader = new FileReader();
    reader.onload = e => handleFileData(e.target.result);
    reader.readAsText(file);
  };

  const getMappedValue = (row, colKey) => {
    const idx = mapping[colKey];
    if (idx === undefined || idx === null || idx === '') return '';
    return row[idx] || '';
  };

  const buildList = () => rows.map(row => {
    const obj = {};
    COLS.forEach(col => { obj[col.key] = getMappedValue(row, col.key); });
    return obj;
  });

  const handleImport = async () => {
    const missing = COLS.filter(c => c.required && (mapping[c.key] === undefined || mapping[c.key] === ''));
    if (missing.length) { setError(`Please map required columns: ${missing.map(c=>c.label).join(', ')}`); return; }
    setLoading(true); setError('');
    try {
      const list = buildList();
      const url  = tab === 'members' ? '/api/members/bulk-import' : '/api/payments/bulk-import';
      const body = tab === 'members' ? { members: list } : { payments: list };
      const { data } = await axios.post(url, body);

      // ── Log the activity ──
      await logActivity(
        `Bulk ${tab} import`,
        'import',
        `${tab === 'members' ? 'Members' : 'Payment records'} imported — ${data.created} added, ${data.skipped} skipped${data.errors?.length ? `, ${data.errors.length} errors` : ''}`,
        { type: tab, created: data.created, skipped: data.skipped, errors: data.errors?.length || 0 }
      );

      setResult(data); setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Import failed. Please try again.');
    } finally { setLoading(false); }
  };

  const preview = buildList().slice(0, 5);

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <div className="pg-breadcrumb">Gospel Light International Church</div>
          <h1 className="pg-title">
            Bulk <span style={{ color:'var(--gold2)', fontStyle:'italic' }}>Import</span>
          </h1>
          <p className="pg-sub">Import members or payment records from a CSV file</p>
        </div>
        {step === 1 && (
          <button onClick={() => downloadTemplate(tab)} className="btn btn-ghost">
            📥 Download {tab === 'members' ? 'Members' : 'Payments'} Template
          </button>
        )}
      </div>

      {/* Tab switcher */}
      {step === 1 && (
        <div style={{ display:'flex', gap:0, marginBottom:24, background:'rgba(255,255,255,0.04)', borderRadius:12, padding:4, width:'fit-content', border:'1px solid rgba(255,255,255,0.08)' }}>
          {[
            { k:'members',  label:'👥 Members'         },
            { k:'payments', label:'💳 Payment Records' },
          ].map(t => (
            <button key={t.k} onClick={() => handleTabChange(t.k)} style={{
              padding:'9px 22px', borderRadius:9, fontSize:13.5, fontWeight:500,
              cursor:'pointer', fontFamily:'var(--font-body)', transition:'all 0.2s', border:'none',
              background: tab===t.k ? 'linear-gradient(135deg,var(--gold),#8B6420)' : 'transparent',
              color:      tab===t.k ? 'var(--navy)' : 'rgba(255,255,255,0.5)',
              boxShadow:  tab===t.k ? 'var(--shadow-gold)' : 'none',
            }}>{t.label}</button>
          ))}
        </div>
      )}

      {/* Steps indicator */}
      <div style={{ display:'flex', alignItems:'center', marginBottom:28, flexWrap:'wrap', gap:8 }}>
        {[{ n:1, label:'Upload File' },{ n:2, label:'Map & Preview' },{ n:3, label:'Done' }].map((s, i) => (
          <div key={s.n} style={{ display:'flex', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, transition:'all 0.3s',
                background: step>=s.n ? 'linear-gradient(135deg,var(--gold),#8B6420)' : 'rgba(255,255,255,0.06)',
                color:      step>=s.n ? 'var(--navy)' : 'rgba(255,255,255,0.3)',
                border:     step>=s.n ? 'none' : '1px solid rgba(255,255,255,0.1)',
              }}>{step>s.n ? '✓' : s.n}</div>
              <span style={{ fontSize:13, color:step>=s.n?'var(--white)':'var(--muted)', fontWeight:step===s.n?500:400 }}>{s.label}</span>
            </div>
            {i < 2 && <div style={{ width:32, height:1, background:step>s.n?'var(--gold)':'rgba(255,255,255,0.1)', margin:'0 10px', transition:'background 0.3s' }}/>}
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
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:20 }} className="content-2col">
            {[
              { icon:'📥', title:'Download template',  desc:`Click "Download ${tab==='members'?'Members':'Payments'} Template" above to get a blank CSV with the correct headers` },
              { icon:'📝', title:'Fill in your data',  desc: tab==='members'
                  ? 'Open in Excel or Google Sheets. Fill in member details — First Name and Last Name are required'
                  : 'Fill in payment records. Member Full Name must match exactly as saved in your system. Year is required' },
              { icon:'⬆️', title:'Upload & import',    desc:'Save as CSV and upload here. We show you a preview before anything is saved' },
            ].map(h => (
              <div key={h.title} style={{ padding:16, borderRadius:12, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontSize:24, marginBottom:8 }}>{h.icon}</div>
                <div style={{ fontSize:13.5, fontWeight:500, color:'var(--white)', marginBottom:4 }}>{h.title}</div>
                <div style={{ fontSize:12, color:'var(--muted)', lineHeight:1.6 }}>{h.desc}</div>
              </div>
            ))}
          </div>

          {tab === 'payments' && (
            <div style={{ padding:'14px 18px', borderRadius:12, background:'rgba(201,148,58,0.07)', border:'1px solid rgba(201,148,58,0.2)', marginBottom:20, fontSize:13, color:'rgba(255,255,255,0.7)', lineHeight:1.8 }}>
              💡 <strong style={{ color:'var(--gold2)' }}>Tips for Payment imports:</strong><br/>
              • <strong>Member Full Name</strong> must match how the name is saved e.g. <em>Kwame Mensah</em><br/>
              • <strong>Months column</strong> — single: <span style={{ color:'var(--gold2)' }}>3</span> · list: <span style={{ color:'var(--gold2)' }}>1,2,3</span> · range: <span style={{ color:'var(--gold2)' }}>1-12</span> — one record per month, duplicates automatically skipped<br/>
              • <strong>Payment type:</strong> <span style={{ color:'var(--gold2)' }}>{PAYMENT_TYPES.join(', ')}</span><br/>
              • <strong>Method:</strong> <span style={{ color:'var(--gold2)' }}>{PAYMENT_METHODS.join(', ')}</span><br/>
              • Import members first before importing their payment records
            </div>
          )}

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
            onClick={() => fileRef.current?.click()}
            style={{ border:`2px dashed ${dragOver?'var(--gold)':'rgba(201,148,58,0.25)'}`, borderRadius:16, padding:'48px 24px', textAlign:'center', cursor:'pointer', background:dragOver?'rgba(201,148,58,0.06)':'rgba(255,255,255,0.02)', transition:'all 0.2s' }}>
            <div style={{ fontSize:48, marginBottom:14, opacity:0.6 }}>📂</div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:22, color:'var(--white)', marginBottom:8 }}>Drop your CSV file here</div>
            <div style={{ fontSize:13, color:'var(--muted)', marginBottom:8 }}>or click to browse</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.2)' }}>Supports .csv files · Excel: File → Save As → CSV</div>
            <input ref={fileRef} type="file" accept=".csv" style={{ display:'none' }} onChange={e => handleFile(e.target.files[0])}/>
          </div>
        </div>
      )}

      {/* ── STEP 2: Map & Preview ── */}
      {step === 2 && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }} className="content-2col">
            <div className="glass-card">
              <div style={{ padding:'16px 22px', borderBottom:'1px solid var(--border)', background:'rgba(255,255,255,0.02)' }}>
                <div style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:600, color:'var(--white)' }}>Map Your Columns</div>
                <div style={{ fontSize:12, color:'var(--muted)', marginTop:3 }}>Match your spreadsheet columns to the right fields</div>
              </div>
              <div style={{ padding:'16px 22px', display:'flex', flexDirection:'column', gap:10 }}>
                {COLS.map(col => (
                  <div key={col.key} style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:170, fontSize:12.5, color:col.required?'var(--gold2)':'rgba(255,255,255,0.6)', flexShrink:0 }}>
                      {col.label}{col.required && <span style={{ color:'var(--red)', marginLeft:2 }}>*</span>}
                    </div>
                    <select
                      value={mapping[col.key] ?? ''}
                      onChange={e => setMapping(m => ({ ...m, [col.key]: e.target.value===''?undefined:Number(e.target.value) }))}
                      style={{ flex:1, padding:'6px 10px', borderRadius:8, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'#fff', fontSize:12, fontFamily:'var(--font-body)', outline:'none' }}>
                      <option value="">— Not mapped —</option>
                      {headers.map((h,i) => <option key={i} value={i}>{h}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div className="glass-card" style={{ padding:'20px 22px' }}>
                <div style={{ fontSize:10.5, fontWeight:600, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12 }}>Rows Detected</div>
                <div style={{ fontFamily:'var(--font-display)', fontSize:40, fontWeight:700, color:'var(--gold2)' }}>{rows.length}</div>
                <div style={{ fontSize:12, color:'var(--muted)', marginTop:4 }}>{tab==='members'?'members':'payment records'} ready to import</div>
              </div>
              <div className="glass-card" style={{ padding:'20px 22px' }}>
                <div style={{ fontSize:10.5, fontWeight:600, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12 }}>Columns in File</div>
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
              <span style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:600, color:'var(--white)' }}>
                Preview <span style={{ fontSize:13, fontWeight:400, color:'var(--muted)', fontFamily:'var(--font-body)' }}>(first 5 rows)</span>
              </span>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    {tab === 'members'
                      ? ['First Name','Last Name','WhatsApp','Location','Role','Dues'].map(h=><th key={h}>{h}</th>)
                      : ['Member Name','Amount','Year','Months','Type','Method'].map(h=><th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i}>
                      {tab === 'members' ? (<>
                        <td style={{ fontWeight:500 }}>{row.firstName || <span style={{ color:'var(--red)' }}>Missing</span>}</td>
                        <td style={{ fontWeight:500 }}>{row.lastName  || <span style={{ color:'var(--red)' }}>Missing</span>}</td>
                        <td style={{ color:'var(--muted)' }}>{row.whatsapp||'—'}</td>
                        <td style={{ color:'var(--muted)' }}>{row.location||'—'}</td>
                        <td style={{ color:'var(--muted)', textTransform:'capitalize' }}>{row.role||'member'}</td>
                        <td style={{ color:'var(--gold2)' }}>GH₵ {row.duesAmount||200}</td>
                      </>) : (<>
                        <td style={{ fontWeight:500 }}>{row.memberName || <span style={{ color:'var(--red)' }}>Missing</span>}</td>
                        <td style={{ color:'var(--green)', fontWeight:500 }}>{row.amount ? `GH₵ ${row.amount}` : <span style={{ color:'var(--red)' }}>Missing</span>}</td>
                        <td style={{ color:'var(--muted)' }}>{row.year || <span style={{ color:'var(--red)' }}>Missing</span>}</td>
                        <td style={{ color:'var(--gold2)' }}>{row.months||'—'}</td>
                        <td style={{ color:'var(--muted)', textTransform:'capitalize' }}>{row.type?.replace('_',' ')||'dues'}</td>
                        <td style={{ color:'var(--muted)', textTransform:'capitalize' }}>{row.method||'cash'}</td>
                      </>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', flexWrap:'wrap' }}>
            <button onClick={reset} className="btn btn-ghost">← Start Over</button>
            <button onClick={handleImport} disabled={loading} className="btn btn-gold" style={{ minWidth:180 }}>
              {loading ? 'Importing...' : `Import ${rows.length} ${tab==='members'?'Members':'Records'} →`}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Done ── */}
      {step === 3 && result && (
        <div className="glass-card" style={{ padding:'48px 32px', textAlign:'center' }}>
          <div style={{ fontSize:56, marginBottom:16 }}>🎉</div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:30, fontWeight:700, color:'var(--white)', marginBottom:8 }}>Import Complete!</div>
          <div style={{ fontSize:14, color:'var(--muted)', marginBottom:28 }}>{result.message}</div>

          <div style={{ display:'flex', justifyContent:'center', gap:16, marginBottom:32, flexWrap:'wrap' }}>
            <div style={{ padding:'16px 28px', borderRadius:14, background:'rgba(46,204,113,0.1)', border:'1px solid rgba(46,204,113,0.2)' }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:32, fontWeight:700, color:'var(--green)' }}>{result.created}</div>
              <div style={{ fontSize:12, color:'var(--muted)', marginTop:4 }}>Records Added</div>
            </div>
            <div style={{ padding:'16px 28px', borderRadius:14, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:32, fontWeight:700, color:'var(--muted)' }}>{result.skipped}</div>
              <div style={{ fontSize:12, color:'var(--muted)', marginTop:4 }}>Skipped (duplicates)</div>
            </div>
          </div>

          {result.errors?.length > 0 && (
            <div style={{ background:'rgba(224,85,85,0.08)', border:'1px solid rgba(224,85,85,0.2)', borderRadius:10, padding:16, marginBottom:20, textAlign:'left', maxHeight:180, overflowY:'auto' }}>
              <div style={{ fontSize:12, fontWeight:600, color:'var(--red)', marginBottom:8 }}>⚠ Some rows had issues:</div>
              {result.errors.map((e,i) => (
                <div key={i} style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginBottom:4 }}>• {e}</div>
              ))}
            </div>
          )}

          <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
            <button onClick={reset} className="btn btn-ghost">Import Another File</button>
            <a href={tab==='members'?'/members':'/payments'} className="btn btn-gold" style={{ textDecoration:'none' }}>
              View {tab==='members'?'Members':'Payments'} →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}