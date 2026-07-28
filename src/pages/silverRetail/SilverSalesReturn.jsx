import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Search, CheckCircle2 } from 'lucide-react';
import { silverStore } from '../../db/silverRetailStore';

export default function SilverSalesReturn() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState(silverStore.getInvoices());
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [returnReason, setReturnReason] = useState('Design Exchange');
  const [refundMode, setRefundMode] = useState('Cash');

  const handleSelectInvoice = (inv) => {
    setSelectedInvoice(inv);
  };

  const handleProcessReturn = () => {
    if (!selectedInvoice) return;
    alert(`Sales Return processed successfully for ${selectedInvoice.invoiceNo}. Refund amount: ₹ ${selectedInvoice.netPayable}`);
    navigate('/silver-retail-dashboard');
  };

  return (
    <div style={{ padding: '24px 32px', color: 'var(--text-primary)', fontFamily: 'var(--font-family)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button 
            onClick={() => navigate('/silver-retail-dashboard')}
            style={{ padding: 8, borderRadius: 10, border: '1px solid var(--border-default)', background: 'var(--bg-elevated)', cursor: 'pointer', color: 'var(--text-primary)' }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: '#f8fafc' }}>
              Silver Sales Return & Bill Return Processing
            </h1>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>
              DK Nova Technologies — Customer Silver Return Voucher & Restocking
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Search Invoice */}
        <div className="card" style={{ padding: 24, borderRadius: 18 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#38bdf8' }}>
            1. Search Original Silver Invoice
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-subtle)', border: '1px solid var(--border-default)', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
            <Search size={16} color="#94a3b8" />
            <input 
              type="text"
              placeholder="Search Invoice # (e.g. DKN-SLV-2026-001) or Customer Name..."
              value={invoiceSearch}
              onChange={(e) => setInvoiceSearch(e.target.value)}
              style={{ width: '100%', border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {invoices.filter(i => (i.invoiceNo || '').toLowerCase().includes(invoiceSearch.toLowerCase()) || (i.customerName || '').toLowerCase().includes(invoiceSearch.toLowerCase())).map(inv => (
              <div 
                key={inv.id}
                onClick={() => handleSelectInvoice(inv)}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  background: selectedInvoice?.id === inv.id ? 'rgba(56, 189, 248, 0.15)' : 'var(--bg-elevated)',
                  border: '1px solid',
                  borderColor: selectedInvoice?.id === inv.id ? '#38bdf8' : 'var(--border-default)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                  <span style={{ color: '#38bdf8' }}>{inv.invoiceNo}</span>
                  <span style={{ color: '#34d399' }}>₹ {inv.netPayable?.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  Customer: <strong>{inv.customerName}</strong> | Date: {inv.invoiceDate}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Process Return Voucher */}
        <div className="card" style={{ padding: 24, borderRadius: 18 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#f8fafc' }}>
            2. Process Silver Return Voucher
          </h3>

          {selectedInvoice ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ padding: 14, borderRadius: 12, background: 'var(--bg-subtle)', border: '1px solid var(--border-default)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>SELECTED INVOICE</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#38bdf8', marginTop: 2 }}>{selectedInvoice.invoiceNo}</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>Customer: <strong>{selectedInvoice.customerName}</strong></div>
                <div style={{ fontSize: 13, color: '#34d399', fontWeight: 700, marginTop: 2 }}>
                  Refundable Amount: ₹ {selectedInvoice.netPayable?.toLocaleString('en-IN')}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>REASON FOR RETURN</label>
                <select 
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', marginTop: 4, borderRadius: 10, border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}
                >
                  <option value="Design Exchange">Design / Pattern Exchange</option>
                  <option value="Size Fitting Issue">Size / Weight Fitting Issue</option>
                  <option value="Defective Ornament">Defective / Damaged Ornament</option>
                  <option value="Customer Cancellation">Customer Cancellation</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>REFUND / ADJUSTMENT METHOD</label>
                <select 
                  value={refundMode}
                  onChange={(e) => setRefundMode(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', marginTop: 4, borderRadius: 10, border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}
                >
                  <option value="Cash">Cash Refund</option>
                  <option value="CreditNote">Issue Store Credit Note Voucher</option>
                  <option value="MetalCredit">Deposit Fine Silver Weight to Customer Ledger</option>
                </select>
              </div>

              <button 
                onClick={handleProcessReturn}
                style={{
                  width: '100%',
                  padding: 14,
                  marginTop: 12,
                  borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                <RotateCcw size={18} /> Confirm Silver Sales Return & Re-Stock
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 13 }}>
              Please select an invoice from the left panel to begin the return voucher process.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
