import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { silverStore, calculateSilverItem, calculateOldSilverExchange } from '../../db/silverRetailStore';
import { ShoppingBag, Plus, Trash2, Printer, Search, RefreshCw, ArrowLeft, CheckCircle2, DollarSign } from 'lucide-react';

export default function SilverRetailInvoice() {
  const navigate = useNavigate();
  const [rates, setRates] = useState(silverStore.getRates());
  const [stockList, setStockList] = useState([]);
  
  // Customer State
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerGstin, setCustomerGstin] = useState('');

  // Selected Items State
  const [items, setItems] = useState([
    {
      id: Date.now(),
      tagNumber: '',
      title: '',
      grossWeight: 0,
      stoneWeight: 0,
      purity: 92.5,
      wastagePercent: 3.5,
      makingChargePerGram: 18.00,
      flatMakingCharge: 0,
      ratePerGram: rates.silver925 || 91.10
    }
  ]);

  // Old Silver Exchange State
  const [enableExchange, setEnableExchange] = useState(false);
  const [exchangeItem, setExchangeItem] = useState({
    description: '',
    grossWeight: 0,
    touchPurity: 75.0,
    deductionPercent: 0.0,
    fineSilverRate: rates.silver999 || 98.50
  });

  // Financial Discount & Payment
  const [discount, setDiscount] = useState(0);
  const [paymentMode, setPaymentMode] = useState('UPI');

  // Tag Search query
  const [tagQuery, setTagQuery] = useState('');

  // Invoice Print Modal State
  const [savedInvoice, setSavedInvoice] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  useEffect(() => {
    setStockList(silverStore.getStock().filter(s => s.status === 'In Stock'));
  }, []);

  // Update item rate if purity changes
  const handlePurityChange = (idx, purityVal) => {
    const p = parseFloat(purityVal);
    const updated = [...items];
    updated[idx].purity = p;
    if (p === 99.9) {
      updated[idx].ratePerGram = rates.silver999;
    } else if (p === 92.5) {
      updated[idx].ratePerGram = rates.silver925;
    } else {
      updated[idx].ratePerGram = rates.silver800;
    }
    setItems(updated);
  };

  const updateItemField = (idx, field, value) => {
    const updated = [...items];
    updated[idx][field] = value;
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([
      ...items,
      {
        id: Date.now() + Math.random(),
        tagNumber: '',
        title: 'Silver Ornament',
        grossWeight: 0,
        stoneWeight: 0,
        purity: 92.5,
        wastagePercent: 3.0,
        makingChargePerGram: 15.00,
        flatMakingCharge: 0,
        ratePerGram: rates.silver925
      }
    ]);
  };

  const removeItemRow = (idx) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const selectStockTag = (tagItem) => {
    const newItems = [...items];
    // overwrite first empty row or append
    const emptyIdx = newItems.findIndex(i => i.grossWeight === 0);
    const targetIdx = emptyIdx >= 0 ? emptyIdx : newItems.length;

    const row = {
      id: Date.now() + Math.random(),
      tagNumber: tagItem.tagNumber,
      title: tagItem.title,
      grossWeight: tagItem.grossWeight,
      stoneWeight: tagItem.stoneWeight,
      purity: tagItem.purity,
      wastagePercent: tagItem.wastagePercent,
      makingChargePerGram: tagItem.makingChargePerGram,
      flatMakingCharge: tagItem.flatMakingCharge,
      ratePerGram: tagItem.purity === 99.9 ? rates.silver999 : rates.silver925
    };

    if (emptyIdx >= 0) {
      newItems[emptyIdx] = row;
    } else {
      newItems.push(row);
    }
    setItems(newItems);
    setTagQuery('');
  };

  // Calculations
  const calculatedItems = items.map(it => {
    const calc = calculateSilverItem({
      grossWeight: it.grossWeight,
      stoneWeight: it.stoneWeight,
      purity: it.purity,
      wastagePercent: it.wastagePercent,
      makingChargePerGram: it.makingChargePerGram,
      flatMakingCharge: it.flatMakingCharge,
      ratePerGram: it.ratePerGram,
      gstRate: 3.0
    });
    return { ...it, ...calc };
  });

  const grossSubtotal = calculatedItems.reduce((acc, curr) => acc + curr.totalAmount, 0);

  const exchangeCalc = enableExchange ? calculateOldSilverExchange({
    grossWeight: exchangeItem.grossWeight,
    touchPurity: exchangeItem.touchPurity,
    deductionPercent: exchangeItem.deductionPercent,
    fineSilverRate: exchangeItem.fineSilverRate
  }) : { netTouch: 0, fineWeightCredit: 0, creditValue: 0 };

  const netPayable = Math.max(0, grossSubtotal - (enableExchange ? exchangeCalc.creditValue : 0) - (parseFloat(discount) || 0));

  const handleSaveInvoice = () => {
    if (!customerName) {
      alert('Please enter customer name to proceed with invoice generation.');
      return;
    }

    const invoicePayload = {
      customerName,
      customerMobile,
      customerGstin,
      items: calculatedItems,
      oldSilverExchange: enableExchange ? { ...exchangeItem, ...exchangeCalc } : null,
      subtotal: Number(grossSubtotal.toFixed(2)),
      discount: Number((parseFloat(discount) || 0).toFixed(2)),
      exchangeCredit: Number(exchangeCalc.creditValue.toFixed(2)),
      netPayable: Number(netPayable.toFixed(2)),
      paymentMode,
      status: 'Paid'
    };

    const saved = silverStore.createInvoice(invoicePayload);
    setSavedInvoice(saved);
    setShowPrintModal(true);
  };

  return (
    <div style={{ padding: '24px 32px', color: 'var(--text-primary)', fontFamily: 'var(--font-family)' }}>
      {/* Header Bar */}
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
              Silver Retail POS Invoice Billing
            </h1>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>
              DK Nova Technologies — Silver Jewellery Counter
            </span>
          </div>
        </div>

        {/* Live Rates Display */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ padding: '6px 14px', borderRadius: 10, background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', fontSize: 12 }}>
            <span style={{ color: '#94a3b8' }}>Fine 999: </span>
            <strong style={{ color: '#38bdf8' }}>₹ {rates.silver999}/g</strong>
          </div>
          <div style={{ padding: '6px 14px', borderRadius: 10, background: 'rgba(129, 140, 248, 0.1)', border: '1px solid rgba(129, 140, 248, 0.3)', fontSize: 12 }}>
            <span style={{ color: '#94a3b8' }}>Sterling 925: </span>
            <strong style={{ color: '#818cf8' }}>₹ {rates.silver925}/g</strong>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 24 }}>
        {/* Left Side: Invoice Items & Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Customer Details Box */}
          <div className="card" style={{ padding: 20, borderRadius: 16 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, marginBottom: 14, color: '#38bdf8' }}>
              👤 Customer Details
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>CUSTOMER NAME *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Ramesh Patel" 
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', marginTop: 4, borderRadius: 10, border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontSize: 13 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>MOBILE NUMBER</label>
                <input 
                  type="text" 
                  placeholder="+91 98765 43210" 
                  value={customerMobile}
                  onChange={(e) => setCustomerMobile(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', marginTop: 4, borderRadius: 10, border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontSize: 13 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>GSTIN (OPTIONAL)</label>
                <input 
                  type="text" 
                  placeholder="e.g. 33AAAAA0000A1Z5" 
                  value={customerGstin}
                  onChange={(e) => setCustomerGstin(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', marginTop: 4, borderRadius: 10, border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontSize: 13 }}
                />
              </div>
            </div>
          </div>

          {/* Tag Quick Search */}
          <div className="card" style={{ padding: 16, borderRadius: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Search size={18} color="#94a3b8" />
            <input 
              type="text" 
              placeholder="Scan Barcode Tag # or Search Silver Item (e.g. SLV-1001)..." 
              value={tagQuery}
              onChange={(e) => setTagQuery(e.target.value)}
              style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontSize: 13 }}
            />
            {tagQuery && (
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute', top: 36, right: 0, width: 340, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 100, padding: 8
                }}>
                  {stockList.filter(s => s.tagNumber.toLowerCase().includes(tagQuery.toLowerCase()) || s.title.toLowerCase().includes(tagQuery.toLowerCase())).map(st => (
                    <div 
                      key={st.id} 
                      onClick={() => selectStockTag(st)}
                      style={{ padding: '8px 12px', borderRadius: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', fontSize: 12, borderBottom: '1px solid var(--border-subtle)' }}
                    >
                      <div>
                        <strong>{st.tagNumber}</strong> — {st.title}
                      </div>
                      <span style={{ color: '#38bdf8', fontWeight: 700 }}>{st.grossWeight}g</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Silver Calculation Table */}
          <div className="card" style={{ padding: 20, borderRadius: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                ✨ Silver Items Billing Grid
              </h3>
              <button 
                onClick={addItemRow}
                style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #38bdf8, #0284c7)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Plus size={14} /> Add Silver Item
              </button>
            </div>

            <table className="data-table" style={{ width: '100%', fontSize: 12 }}>
              <thead>
                <tr>
                  <th>Item / Tag</th>
                  <th style={{ width: 80 }}>Purity</th>
                  <th style={{ width: 85 }}>Gross Wt (g)</th>
                  <th style={{ width: 80 }}>Stone Wt (g)</th>
                  <th style={{ width: 80 }}>Net Wt (g)</th>
                  <th style={{ width: 75 }}>Wast %</th>
                  <th style={{ width: 85 }}>Fine Wt (g)</th>
                  <th style={{ width: 85 }}>MC (₹/g)</th>
                  <th style={{ width: 90 }}>Rate (₹/g)</th>
                  <th style={{ width: 95 }}>Item Total</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {calculatedItems.map((item, idx) => (
                  <tr key={item.id}>
                    <td>
                      <input 
                        type="text" 
                        value={item.title} 
                        onChange={(e) => updateItemField(idx, 'title', e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontSize: 12 }}
                      />
                    </td>
                    <td>
                      <select 
                        value={item.purity}
                        onChange={(e) => handlePurityChange(idx, e.target.value)}
                        style={{ width: '100%', padding: '6px 4px', borderRadius: 6, border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontSize: 12 }}
                      >
                        <option value={99.9}>999 Fine</option>
                        <option value={92.5}>925 Sterl</option>
                        <option value={80.0}>800 Util</option>
                      </select>
                    </td>
                    <td>
                      <input 
                        type="number" 
                        step="0.01"
                        value={item.grossWeight} 
                        onChange={(e) => updateItemField(idx, 'grossWeight', e.target.value)}
                        style={{ width: '100%', padding: '6px 6px', borderRadius: 6, border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: '#f8fafc', fontWeight: 700, fontSize: 12 }}
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        step="0.01"
                        value={item.stoneWeight} 
                        onChange={(e) => updateItemField(idx, 'stoneWeight', e.target.value)}
                        style={{ width: '100%', padding: '6px 6px', borderRadius: 6, border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontSize: 12 }}
                      />
                    </td>
                    <td style={{ fontWeight: 700, color: '#f8fafc' }}>
                      {item.netWeight.toFixed(2)}
                    </td>
                    <td>
                      <input 
                        type="number" 
                        step="0.1"
                        value={item.wastagePercent} 
                        onChange={(e) => updateItemField(idx, 'wastagePercent', e.target.value)}
                        style={{ width: '100%', padding: '6px 6px', borderRadius: 6, border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontSize: 12 }}
                      />
                    </td>
                    <td style={{ fontWeight: 700, color: '#38bdf8' }}>
                      {item.fineWeight.toFixed(2)}
                    </td>
                    <td>
                      <input 
                        type="number" 
                        step="1"
                        value={item.makingChargePerGram} 
                        onChange={(e) => updateItemField(idx, 'makingChargePerGram', e.target.value)}
                        style={{ width: '100%', padding: '6px 6px', borderRadius: 6, border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontSize: 12 }}
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        step="0.1"
                        value={item.ratePerGram} 
                        onChange={(e) => updateItemField(idx, 'ratePerGram', e.target.value)}
                        style={{ width: '100%', padding: '6px 6px', borderRadius: 6, border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontSize: 12 }}
                      />
                    </td>
                    <td style={{ fontWeight: 800, color: '#34d399' }}>
                      ₹ {item.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td>
                      <button 
                        onClick={() => removeItemRow(idx)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Old Silver Scrap Exchange Toggle Box */}
          <div className="card" style={{ padding: 20, borderRadius: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: enableExchange ? 16 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input 
                  type="checkbox" 
                  id="oldSilverCheck" 
                  checked={enableExchange}
                  onChange={(e) => setEnableExchange(e.target.checked)}
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
                <label htmlFor="oldSilverCheck" style={{ fontWeight: 700, fontSize: 14, color: '#fbbf24', cursor: 'pointer' }}>
                  ⚖️ Enable Old Silver Scrap Exchange / Buyback Credit
                </label>
              </div>
              {enableExchange && (
                <span style={{ fontSize: 12, color: '#fbbf24', fontWeight: 700 }}>
                  Credit: - ₹ {exchangeCalc.creditValue.toLocaleString('en-IN')} ({exchangeCalc.fineWeightCredit.toFixed(2)}g Fine)
                </span>
              )}
            </div>

            {enableExchange && (
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 14, background: 'var(--bg-subtle)', padding: 14, borderRadius: 12 }}>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>SCRAP DESCRIPTION</label>
                  <input 
                    type="text"
                    value={exchangeItem.description}
                    onChange={(e) => setExchangeItem({ ...exchangeItem, description: e.target.value })}
                    style={{ width: '100%', padding: '6px 8px', marginTop: 2, borderRadius: 6, border: '1px solid var(--border-default)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: 12 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>GROSS SCRAP WT (g)</label>
                  <input 
                    type="number"
                    value={exchangeItem.grossWeight}
                    onChange={(e) => setExchangeItem({ ...exchangeItem, grossWeight: e.target.value })}
                    style={{ width: '100%', padding: '6px 8px', marginTop: 2, borderRadius: 6, border: '1px solid var(--border-default)', background: 'var(--bg-elevated)', color: '#f8fafc', fontWeight: 700, fontSize: 12 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>TOUCH / PURITY %</label>
                  <input 
                    type="number"
                    value={exchangeItem.touchPurity}
                    onChange={(e) => setExchangeItem({ ...exchangeItem, touchPurity: e.target.value })}
                    style={{ width: '100%', padding: '6px 8px', marginTop: 2, borderRadius: 6, border: '1px solid var(--border-default)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: 12 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>DEDUCTION %</label>
                  <input 
                    type="number"
                    value={exchangeItem.deductionPercent}
                    onChange={(e) => setExchangeItem({ ...exchangeItem, deductionPercent: e.target.value })}
                    style={{ width: '100%', padding: '6px 8px', marginTop: 2, borderRadius: 6, border: '1px solid var(--border-default)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: 12 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>BUYBACK RATE (₹/g)</label>
                  <input 
                    type="number"
                    value={exchangeItem.fineSilverRate}
                    onChange={(e) => setExchangeItem({ ...exchangeItem, fineSilverRate: e.target.value })}
                    style={{ width: '100%', padding: '6px 8px', marginTop: 2, borderRadius: 6, border: '1px solid var(--border-default)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: 12 }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Financial Summary Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ padding: 24, borderRadius: 18, background: 'linear-gradient(135deg, rgba(30,41,59,0.95), rgba(15,23,42,0.98))', border: '1px solid rgba(148,163,184,0.25)' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f8fafc', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 12 }}>
              Invoice Total Summary
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, margin: '20px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#94a3b8' }}>
                <span>Subtotal (Incl. GST):</span>
                <strong style={{ color: '#f8fafc' }}>₹ {grossSubtotal.toLocaleString('en-IN')}</strong>
              </div>

              {enableExchange && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#fbbf24' }}>
                  <span>Old Silver Credit:</span>
                  <strong>- ₹ {exchangeCalc.creditValue.toLocaleString('en-IN')}</strong>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#94a3b8' }}>Discount (₹):</span>
                <input 
                  type="number" 
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  style={{ width: 90, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: '#f8fafc', textAlign: 'right', fontSize: 13 }}
                />
              </div>

              <div style={{ borderTop: '1px dashed rgba(255,255,255,0.15)', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#f8fafc' }}>Net Payable:</span>
                <span style={{ fontSize: 24, fontWeight: 800, color: '#34d399' }}>
                  ₹ {netPayable.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>PAYMENT METHOD</label>
              <select 
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', marginTop: 6, borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.4)', color: '#f8fafc', fontSize: 13, fontWeight: 600 }}
              >
                <option value="UPI">UPI / GooglePay / PhonePe</option>
                <option value="Cash">Cash Payment</option>
                <option value="Card">Credit / Debit Card</option>
                <option value="NetBanking">Net Banking Transfer</option>
                <option value="MetalBalance">Fine Metal Ledger Credit</option>
              </select>
            </div>

            <button 
              onClick={handleSaveInvoice}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #34d399, #059669)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 16px rgba(52, 211, 153, 0.3)'
              }}
            >
              <CheckCircle2 size={18} /> Save & Print Silver Invoice
            </button>
          </div>
        </div>
      </div>

      {/* Tax Invoice Print Preview Modal - DK Nova Technologies */}
      {showPrintModal && savedInvoice && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            background: '#ffffff', color: '#0f172a', width: '100%', maxWidth: 720, borderRadius: 16, padding: 32, boxShadow: '0 20px 50px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto', fontFamily: 'sans-serif'
          }}>
            {/* Invoice Header */}
            <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: 16, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
                  DK NOVA TECHNOLOGIES
                </h2>
                <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
                  Fine Silver Jewellery & Bullion Software Division
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                  GSTIN: 33DKNOVA7979A1Z5 | HSN Code: 7113 / 7114
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0284c7' }}>TAX INVOICE</div>
                <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{savedInvoice.invoiceNo}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Date: {savedInvoice.invoiceDate}</div>
              </div>
            </div>

            {/* Customer info */}
            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, marginBottom: 20, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <div>
                <span style={{ color: '#64748b' }}>Billed To: </span>
                <strong style={{ fontSize: 13 }}>{savedInvoice.customerName}</strong>
                {savedInvoice.customerMobile && <div>Mobile: {savedInvoice.customerMobile}</div>}
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Payment Mode: </span>
                <strong style={{ color: '#16a34a' }}>{savedInvoice.paymentMode}</strong>
              </div>
            </div>

            {/* Items Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 20 }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                  <th style={{ padding: 8 }}>Item Particulars</th>
                  <th style={{ padding: 8 }}>Purity</th>
                  <th style={{ padding: 8 }}>Gross Wt</th>
                  <th style={{ padding: 8 }}>Net Wt</th>
                  <th style={{ padding: 8 }}>Fine Wt</th>
                  <th style={{ padding: 8, textAlign: 'right' }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {savedInvoice.items.map((it, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: 8 }}><strong>{it.title}</strong></td>
                    <td style={{ padding: 8 }}>{it.purity}%</td>
                    <td style={{ padding: 8 }}>{it.grossWeight}g</td>
                    <td style={{ padding: 8 }}>{it.netWeight}g</td>
                    <td style={{ padding: 8, color: '#0284c7', fontWeight: 700 }}>{it.fineWeight}g</td>
                    <td style={{ padding: 8, textAlign: 'right', fontWeight: 700 }}>₹ {it.totalAmount.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Old Silver exchange credit if any */}
            {savedInvoice.oldSilverExchange && (
              <div style={{ background: '#fef3c7', padding: 10, borderRadius: 8, fontSize: 12, marginBottom: 20, display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <strong>Less: Old Silver Scrap Exchange ({savedInvoice.oldSilverExchange.description})</strong>
                  <div style={{ fontSize: 11, color: '#78350f' }}>Weight: {savedInvoice.oldSilverExchange.grossWeight}g @ {savedInvoice.oldSilverExchange.touchPurity}% Touch</div>
                </div>
                <div style={{ fontWeight: 800, color: '#92400e', fontSize: 13 }}>
                  - ₹ {savedInvoice.oldSilverExchange.creditValue.toLocaleString('en-IN')}
                </div>
              </div>
            )}

            {/* Total Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #0f172a', paddingTop: 16 }}>
              <div>
                <div style={{ fontSize: 10, color: '#64748b' }}>Authorized Signatory</div>
                <div style={{ fontSize: 12, fontWeight: 800, marginTop: 24 }}>DK Nova Technologies ERP</div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: '#64748b' }}>Grand Total Net Payable</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#16a34a' }}>
                  ₹ {savedInvoice.netPayable.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
              <button 
                onClick={() => window.print()}
                style={{ flex: 1, padding: 12, borderRadius: 10, border: 'none', background: '#0284c7', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <Printer size={18} /> Print Tax Invoice
              </button>
              <button 
                onClick={() => { setShowPrintModal(false); navigate('/silver-retail-dashboard'); }}
                style={{ padding: '12px 20px', borderRadius: 10, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#334155', fontWeight: 700, cursor: 'pointer' }}
              >
                Close & Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
