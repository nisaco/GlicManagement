import { useEffect, useState, useRef } from 'react';
import axios from 'axios';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function Receipt({ paymentId, onClose }) {
  const [payment, setPayment] = useState(null);
  const printRef = useRef();

  useEffect(() => {
    if (!paymentId) return;
    axios.get(`/api/payments/${paymentId}`).then(r=>setPayment(r.data)).catch(console.error);
  }, [paymentId]);

  const handlePrint = () => {
    const win = window.open('','_blank');
    win.document.write(`<html><head><title>Receipt</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:Arial,sans-serif;padding:40px;background:#fff;color:#111}
      .wrap{max-width:420px;margin:0 auto;border:1px solid #ddd;border-radius:10px;padding:32px}
      .header{text-align:center;margin-bottom:20px;padding-bottom:18px;border-bottom:1px dashed #ddd}
      .church{font-size:18px;font-weight:bold;margin-bottom:4px}
      .sub{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.08em;margin-top:6px}
      .ref{font-size:11px;color:#bbb;margin-top:4px}
      .row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:0.5px solid #f0f0f0;font-size:13px}
      .row label{color:#888}
      .amount-box{margin-top:16px;padding:14px;background:#f8f8f5;border-radius:8px;display:flex;justify-content:space-between;align-items:center}
      .amount-val{font-size:24px;font-weight:bold;color:#1a7a4a}
      .footer{margin-top:22px;text-align:center;font-size:11px;color:#aaa;padding-top:16px;border-top:1px dashed #ddd}
    </style></head><body>
    <div class="wrap">
      <div class="header">
        <div style="font-size:28px;margin-bottom:8px">✝️</div>
        <div class="church">Gospel Light International Church</div>
        <div class="sub">Official Payment Receipt</div>
        <div class="ref">Receipt No: ${payment._id?.slice(-8).toUpperCase()}</div>
      </div>
      ${[
        ['Member Name', `${payment.member?.firstName} ${payment.member?.lastName}`],
        ['Payment Type', payment.type?.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())],
        ['Period', `${payment.month?MONTHS[payment.month-1]:'—'} ${payment.year||''}`],
        ['Method', payment.method?.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())],
        ['Reference', payment.reference||'N/A'],
        ['Date', new Date(payment.createdAt).toLocaleDateString('en-GH',{day:'numeric',month:'long',year:'numeric'})],
      ].map(([l,v])=>`<div class="row"><label>${l}</label><span>${v}</span></div>`).join('')}
      <div class="amount-box">
        <span style="font-size:13px;color:#555">Amount Paid</span>
        <span class="amount-val">GH₵ ${payment.amount?.toLocaleString()}</span>
      </div>
      ${payment.notes?`<p style="margin-top:12px;font-size:12px;color:#888;font-style:italic">Note: ${payment.notes}</p>`:''}
      <div class="footer">Thank you for your faithful giving 🙏<br>Gospel Light International Church</div>
    </div></body></html>`);
    win.document.close(); setTimeout(()=>{win.print();win.close();},500);
  };

  if (!payment) return (
    <div className="modal-overlay">
      <div style={{ color:'var(--muted)', fontSize:13 }}><div className="spinner"/></div>
    </div>
  );

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth:460 }}>
        <div className="modal-head">
          <span className="modal-title">Payment Receipt</span>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={handlePrint} className="btn btn-gold btn-sm">🖨 Print</button>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.6)', width:32, height:32, borderRadius:8, cursor:'pointer', fontSize:16 }}>✕</button>
          </div>
        </div>

        <div ref={printRef} style={{ padding:28 }}>
          {/* Header */}
          <div style={{ textAlign:'center', marginBottom:22, paddingBottom:18, borderBottom:'1px dashed rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize:32, marginBottom:6 }}>✝️</div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:700, color:'var(--white)', marginBottom:4 }}>Gospel Light International Church</div>
            <div style={{ fontSize:10, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginTop:5 }}>Official Payment Receipt</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.2)', marginTop:3 }}>Receipt No: {payment._id?.slice(-8).toUpperCase()}</div>
          </div>

          {/* Rows */}
          {[
            ['Member Name',  `${payment.member?.firstName} ${payment.member?.lastName}`],
            ['Payment Type', payment.type?.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())],
            ['Period',       `${payment.month?MONTHS[payment.month-1]:'—'} ${payment.year||''}`],
            ['Method',       payment.method?.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())],
            ['Reference',    payment.reference||'N/A'],
            ['Date',         new Date(payment.createdAt).toLocaleDateString('en-GH',{day:'numeric',month:'long',year:'numeric'})],
          ].map(([label,val]) => (
            <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid rgba(255,255,255,0.06)', fontSize:13 }}>
              <span style={{ color:'var(--muted)' }}>{label}</span>
              <span style={{ fontWeight:500, color:'var(--white)' }}>{val}</span>
            </div>
          ))}

          {/* Amount */}
          <div style={{ marginTop:18, padding:'16px 18px', background:'rgba(46,204,113,0.08)', border:'1px solid rgba(46,204,113,0.2)', borderRadius:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:13, color:'var(--muted)' }}>Amount Paid</span>
            <span style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:700, color:'var(--green)' }}>GH₵ {payment.amount?.toLocaleString()}</span>
          </div>

          {payment.notes && <div style={{ marginTop:12, fontSize:12, color:'var(--muted)', fontStyle:'italic' }}>Note: {payment.notes}</div>}

          <div style={{ marginTop:22, textAlign:'center', fontSize:11, color:'rgba(255,255,255,0.2)', borderTop:'1px dashed rgba(255,255,255,0.08)', paddingTop:16 }}>
            Thank you for your faithful giving 🙏<br/>Gospel Light International Church
          </div>
        </div>
      </div>
    </div>
  );
}
