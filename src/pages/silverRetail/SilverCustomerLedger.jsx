import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Search, Plus } from 'lucide-react';

export default function SilverCustomerLedger() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const [customers, setCustomers] = useState(() => {
    const raw = localStorage.getItem('dknova_silver_customers');
    return raw ? JSON.parse(raw) : [];
  });

  const [selectedCust, setSelectedCust] = useState(customers[0] || null);

  useEffect(() => {
    localStorage.setItem('dknova_silver_customers', JSON.stringify(customers));
  }, [customers]);

  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptType, setReceiptType] = useState('Cash'); // Cash or Metal Weight
  const [receiptAmount, setReceiptAmount] = useState('');
  const [receiptWeight, setReceiptWeight] = useState('');
  const [receiptNotes, setReceiptNotes] = useState('');

  // New Customer Fields when creating a ledger entry
  const [newCustName, setNewCustName] = useState('');
  const [newCustMobile, setNewCustMobile] = useState('');
  const [newCustCity, setNewCustCity] = useState('');

  const handleRecordReceipt = (e) => {
    e.preventDefault();
    if (!selectedCust && (!newCustName.trim() || !newCustMobile.trim())) {
      alert("Please enter Customer Name and Mobile number.");
      return;
    }

    const targetCustId = selectedCust ? selectedCust.id : `CUST-SLV-${Date.now()}`;
    const addedCash = parseFloat(receiptAmount) || 0;
    const addedMetal = parseFloat(receiptWeight) || 0;

    let updatedCustomers = [...customers];
    const existingIdx = updatedCustomers.findIndex(c => c.id === targetCustId);

    if (existingIdx >= 0) {
      const c = updatedCustomers[existingIdx];
      let newCash = c.cashBalance;
      let newMetal = c.metalBalanceGrams;
      if (receiptType === 'Cash') {
        newCash += addedCash;
      } else {
        newMetal += addedMetal;
      }
      updatedCustomers[existingIdx] = {
        ...c,
        cashBalance: newCash,
        metalBalanceGrams: newMetal,
        lastTxDate: new Date().toISOString().split('T')[0]
      };
    } else {
      const newCustObj = {
        id: targetCustId,
        name: newCustName.trim(),
        mobile: newCustMobile.trim(),
        city: newCustCity.trim() || 'Local',
        cashBalance: receiptType === 'Cash' ? addedCash : 0,
        metalBalanceGrams: receiptType === 'Metal' ? addedMetal : 0,
        lastTxDate: new Date().toISOString().split('T')[0]
      };
      updatedCustomers.unshift(newCustObj);
    }

    setCustomers(updatedCustomers);
    const targetObj = updatedCustomers.find(c => c.id === targetCustId);
    if (targetObj) setSelectedCust(targetObj);

    setShowReceiptModal(false);
    setReceiptAmount('');
    setReceiptWeight('');
    setReceiptNotes('');
    setNewCustName('');
    setNewCustMobile('');
    setNewCustCity('');
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.mobile.includes(searchQuery)
  );

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
              Customer Dual Metal & Cash Ledgers
            </h1>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>
              DK Nova Technologies — Cash Balance (₹) & Fine Silver Metal Balance (Grams)
            </span>
          </div>
        </div>

        <button 
          onClick={() => setShowReceiptModal(true)}
          style={{
            padding: '10px 18px',
            borderRadius: 12,
            border: 'none',
            background: 'linear-gradient(135deg, #34d399, #059669)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 14px rgba(52, 211, 153, 0.3)'
          }}
        >
          <Plus size={16} /> Record Customer Voucher Receipt
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
        {/* Customer Directory */}
        <div className="card" style={{ padding: 20, borderRadius: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-subtle)', border: '1px solid var(--border-default)', borderRadius: 10, padding: '8px 12px', marginBottom: 16 }}>
            <Search size={16} color="#94a3b8" />
            <input 
              type="text"
              placeholder="Search customer name or mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: 12, outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredCustomers.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                No customer ledger accounts found. Record a voucher receipt to create a customer ledger account.
              </div>
            ) : (
              filteredCustomers.map(cust => (
                <div 
                  key={cust.id}
                  onClick={() => setSelectedCust(cust)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 12,
                    background: selectedCust && selectedCust.id === cust.id ? 'rgba(56, 189, 248, 0.12)' : 'var(--bg-elevated)',
                    border: '1px solid',
                    borderColor: selectedCust && selectedCust.id === cust.id ? '#38bdf8' : 'var(--border-default)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: selectedCust && selectedCust.id === cust.id ? '#38bdf8' : 'var(--text-primary)' }}>
                      {cust.name}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{cust.city}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{cust.mobile}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, borderTop: '1px solid var(--border-subtle)', paddingTop: 6 }}>
                    <span style={{ color: cust.cashBalance < 0 ? '#ef4444' : '#34d399', fontWeight: 700 }}>
                      Cash: ₹ {Math.abs(cust.cashBalance).toLocaleString('en-IN')} {cust.cashBalance < 0 ? 'Dr' : 'Cr'}
                    </span>
                    <span style={{ color: cust.metalBalanceGrams < 0 ? '#ef4444' : '#38bdf8', fontWeight: 700 }}>
                      Fine: {Math.abs(cust.metalBalanceGrams).toFixed(3)}g {cust.metalBalanceGrams < 0 ? 'Dr' : 'Cr'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Selected Customer Statement */}
        {selectedCust ? (
          <div className="card" style={{ padding: 24, borderRadius: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16, marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#f8fafc' }}>
                  {selectedCust.name}
                </h2>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                  {selectedCust.mobile} | {selectedCust.city} | ID: {selectedCust.id}
                </div>
              </div>

              {/* Dual Balance Summary Card */}
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ padding: '10px 16px', borderRadius: 12, background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>CASH BALANCE (₹)</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: selectedCust.cashBalance < 0 ? '#ef4444' : '#34d399', marginTop: 2 }}>
                    ₹ {Math.abs(selectedCust.cashBalance).toLocaleString('en-IN')} {selectedCust.cashBalance < 0 ? 'Due (Dr)' : 'Advance (Cr)'}
                  </div>
                </div>

                <div style={{ padding: '10px 16px', borderRadius: 12, background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>FINE METAL BALANCE (Grams)</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: selectedCust.metalBalanceGrams < 0 ? '#ef4444' : '#38bdf8', marginTop: 2 }}>
                    {Math.abs(selectedCust.metalBalanceGrams).toFixed(3)} g {selectedCust.metalBalanceGrams < 0 ? 'Due (Dr)' : 'Deposit (Cr)'}
                  </div>
                </div>
              </div>
            </div>

            {/* Statement History */}
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 14px 0', color: 'var(--text-primary)' }}>
              Transaction & Settlement Activity Log
            </h3>

            <table className="data-table" style={{ width: '100%', fontSize: 12 }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Voucher Ref</th>
                  <th>Transaction Description</th>
                  <th>Cash Flow (₹)</th>
                  <th>Metal Flow (g)</th>
                  <th>Closing Cash Balance</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{selectedCust.lastTxDate}</td>
                  <td><code style={{ color: '#38bdf8' }}>RCT-SLV-001</code></td>
                  <td>Voucher Receipt Balance Settlement</td>
                  <td style={{ color: selectedCust.cashBalance < 0 ? '#ef4444' : '#34d399', fontWeight: 700 }}>
                    ₹ {Math.abs(selectedCust.cashBalance).toLocaleString('en-IN')} {selectedCust.cashBalance < 0 ? 'Dr' : 'Cr'}
                  </td>
                  <td style={{ color: selectedCust.metalBalanceGrams < 0 ? '#ef4444' : '#38bdf8', fontWeight: 700 }}>
                    {selectedCust.metalBalanceGrams !== 0 ? `${selectedCust.metalBalanceGrams.toFixed(3)} g` : '-'}
                  </td>
                  <td style={{ fontWeight: 700, color: selectedCust.cashBalance < 0 ? '#ef4444' : '#34d399' }}>
                    ₹ {Math.abs(selectedCust.cashBalance).toLocaleString('en-IN')} {selectedCust.cashBalance < 0 ? 'Dr' : 'Cr'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card" style={{ padding: 40, textAlign: 'center', borderRadius: 18, color: 'var(--text-muted)' }}>
            <User size={36} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
            <div style={{ fontSize: 15, fontWeight: 700 }}>No Customer Selected</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Select a customer from the directory on the left or record a new customer receipt voucher.</div>
          </div>
        )}
      </div>

      {/* Record Receipt Modal */}
      {showReceiptModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="card" style={{ width: '100%', maxWidth: 480, padding: 24, borderRadius: 20, background: 'var(--bg-surface)' }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#f8fafc', marginBottom: 16 }}>
              Record Customer Receipt Voucher
            </h3>

            <form onSubmit={handleRecordReceipt} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {!selectedCust && (
                <>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>CUSTOMER NAME *</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Ramesh Jewellers / Rajesh"
                      value={newCustName}
                      onChange={(e) => setNewCustName(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', marginTop: 4, borderRadius: 10, border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontSize: 13 }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>MOBILE *</label>
                      <input 
                        type="text"
                        required
                        placeholder="e.g. +91 98765 43210"
                        value={newCustMobile}
                        onChange={(e) => setNewCustMobile(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', marginTop: 4, borderRadius: 10, border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontSize: 13 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>CITY</label>
                      <input 
                        type="text"
                        placeholder="e.g. Chennai"
                        value={newCustCity}
                        onChange={(e) => setNewCustCity(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', marginTop: 4, borderRadius: 10, border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontSize: 13 }}
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>RECEIPT TYPE</label>
                <select 
                  value={receiptType}
                  onChange={(e) => setReceiptType(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', marginTop: 4, borderRadius: 10, border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}
                >
                  <option value="Cash">Cash / UPI Payment Received (₹)</option>
                  <option value="Metal">Fine Silver Metal Weight Received (Grams)</option>
                </select>
              </div>

              {receiptType === 'Cash' ? (
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>CASH AMOUNT RECEIVED (₹)</label>
                  <input 
                    type="number"
                    required
                    placeholder="e.g. 15000"
                    value={receiptAmount}
                    onChange={(e) => setReceiptAmount(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', marginTop: 4, borderRadius: 10, border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: '#34d399', fontWeight: 800, fontSize: 14 }}
                  />
                </div>
              ) : (
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>FINE SILVER WEIGHT RECEIVED (GRAMS)</label>
                  <input 
                    type="number"
                    step="0.001"
                    required
                    placeholder="e.g. 50.000"
                    value={receiptWeight}
                    onChange={(e) => setReceiptWeight(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', marginTop: 4, borderRadius: 10, border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: '#38bdf8', fontWeight: 800, fontSize: 14 }}
                  />
                </div>
              )}

              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>REMARKS / NOTES</label>
                <input 
                  type="text"
                  placeholder="e.g. Received via GPay for Invoice #1001"
                  value={receiptNotes}
                  onChange={(e) => setReceiptNotes(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', marginTop: 4, borderRadius: 10, border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button type="button" onClick={() => setShowReceiptModal(false)} style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" style={{ flex: 1, padding: 12, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #34d399, #059669)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                  Save Receipt Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
