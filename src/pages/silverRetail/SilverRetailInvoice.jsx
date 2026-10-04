import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { silverStore, calculateSilverItem, calculateOldSilverExchange } from '../../db/silverRetailStore';
import { ShoppingBag, Plus, Trash2, Printer, Search, RefreshCw, ArrowLeft, CheckCircle2, DollarSign, SlidersHorizontal, Save, Eye } from 'lucide-react';

export default function SilverRetailInvoice() {
  const navigate = useNavigate();
  const [rates, setRates] = useState(silverStore.getRates());
  const [stockList, setStockList] = useState([]);

  // Display Options State (Persisted in localStorage)
  const [displayOptions, setDisplayOptions] = useState(() => {
    const saved = localStorage.getItem('silver_retail_display_options');
    return saved ? JSON.parse(saved) : {
      enableTagging: true,
      deliveryName: true,
      productGroup: true,
      hsn: true,
      stoneWeight: true,
      netWeight: true,
      mcPer: true,
      mcAmt: true,
      stAmt: true,
    };
  });

  const [showDisplayPopover, setShowDisplayPopover] = useState(false);
  const [tempDisplayOptions, setTempDisplayOptions] = useState(displayOptions);

  // Header & Form State
  const [enableGst, setEnableGst] = useState(true);
  const [billDate, setBillDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [customerName, setCustomerName] = useState('');
  const [deliveryName, setDeliveryName] = useState('');
  const [counter, setCounter] = useState('Muthu Kumaran Jewellery');
  const [salesPerson, setSalesPerson] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerGstin, setCustomerGstin] = useState('');

  // Selected Items State
  const [items, setItems] = useState([
    {
      id: Date.now(),
      tagNumber: '',
      productGroup: '',
      title: '',
      hsn: '',
      qty: 1,
      grossWeight: 0,
      stoneWeight: 0,
      stoneAmount: 0,
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

  const handleOpenDisplayPopover = () => {
    setTempDisplayOptions({ ...displayOptions });
    setShowDisplayPopover(prev => !prev);
  };

  const handleSaveDisplayOptions = () => {
    setDisplayOptions(tempDisplayOptions);
    localStorage.setItem('silver_retail_display_options', JSON.stringify(tempDisplayOptions));
    setShowDisplayPopover(false);
  };

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
        productGroup: '',
        title: '',
        hsn: '',
        qty: 1,
        grossWeight: 0,
        stoneWeight: 0,
        stoneAmount: 0,
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
    const emptyIdx = newItems.findIndex(i => i.grossWeight === 0);

    const row = {
      id: Date.now() + Math.random(),
      tagNumber: tagItem.tagNumber,
      productGroup: tagItem.productGroup || 'Silver Ornaments',
      title: tagItem.title,
      hsn: tagItem.hsn || '7113',
      qty: 1,
      grossWeight: tagItem.grossWeight,
      stoneWeight: tagItem.stoneWeight || 0,
      stoneAmount: tagItem.stoneAmount || 0,
      purity: tagItem.purity || 92.5,
      wastagePercent: tagItem.wastagePercent || 3.0,
      makingChargePerGram: tagItem.makingChargePerGram || 15.00,
      flatMakingCharge: tagItem.flatMakingCharge || 0,
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
      gstRate: enableGst ? 3.0 : 0.0
    });
    const stAmt = parseFloat(it.stoneAmount) || 0;
    const finalSubtotal = calc.itemSubtotal + stAmt;
    const finalTax = enableGst ? (finalSubtotal * 0.03) : 0;
    const finalTotal = finalSubtotal + finalTax;
    return {
      ...it,
      ...calc,
      stoneAmount: stAmt,
      itemSubtotal: Number(finalSubtotal.toFixed(2)),
      taxAmount: Number(finalTax.toFixed(2)),
      totalAmount: Number(finalTotal.toFixed(2))
    };
  });

  const totalQty = calculatedItems.reduce((acc, curr) => acc + (parseInt(curr.qty) || 1), 0);
  const totalGrossWt = calculatedItems.reduce((acc, curr) => acc + (parseFloat(curr.grossWeight) || 0), 0);
  const totalStoneWt = calculatedItems.reduce((acc, curr) => acc + (parseFloat(curr.stoneWeight) || 0), 0);
  const totalNetWt = calculatedItems.reduce((acc, curr) => acc + (parseFloat(curr.netWeight) || 0), 0);
  const totalFineWt = calculatedItems.reduce((acc, curr) => acc + (parseFloat(curr.fineWeight) || 0), 0);
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
      deliveryName,
      counter,
      salesPerson,
      customerMobile,
      customerGstin,
      billDate,
      enableGst,
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
    <div style={{ padding: '20px 28px', color: 'var(--text-primary)', fontFamily: 'var(--font-family)', background: 'var(--bg-primary)', minHeight: '100vh' }}>
      
      {/* Top Bar Header with Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Retail Sale Bill :: Create
          </h1>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            DK Nova Technologies — Silver Retail Counter
          </span>
        </div>

        {/* Action Controls Top Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
          
          {/* Enable GST Checkbox */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            <input 
              type="checkbox" 
              checked={enableGst}
              onChange={(e) => setEnableGst(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: '#06b6d4', cursor: 'pointer' }}
            />
            Enable GST
          </label>

          {/* Display Button with Popover Dropdown */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={handleOpenDisplayPopover}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                background: '#06b6d4',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 8px rgba(6, 182, 212, 0.35)'
              }}
            >
              <SlidersHorizontal size={15} /> Display
            </button>

            {/* Display Options Dropdown Popover */}
            {showDisplayPopover && (
              <div 
                style={{
                  position: 'absolute',
                  top: '115%',
                  right: 0,
                  width: 330,
                  background: '#ffffff',
                  color: '#0f172a',
                  borderRadius: 12,
                  padding: 18,
                  boxShadow: '0 12px 36px rgba(0, 0, 0, 0.25)',
                  zIndex: 300,
                  border: '1px solid #cbd5e1'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  
                  {/* Enable Tagging */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                    <input 
                      type="checkbox" 
                      checked={tempDisplayOptions.enableTagging} 
                      onChange={(e) => setTempDisplayOptions({ ...tempDisplayOptions, enableTagging: e.target.checked })}
                      style={{ width: 16, height: 16, accentColor: '#06b6d4', cursor: 'pointer' }}
                    />
                    Enable Tagging
                  </label>

                  {/* Delivery Name */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                    <input 
                      type="checkbox" 
                      checked={tempDisplayOptions.deliveryName} 
                      onChange={(e) => setTempDisplayOptions({ ...tempDisplayOptions, deliveryName: e.target.checked })}
                      style={{ width: 16, height: 16, accentColor: '#06b6d4', cursor: 'pointer' }}
                    />
                    Delivery Name
                  </label>

                  {/* Product Group & Hsn */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                      <input 
                        type="checkbox" 
                        checked={tempDisplayOptions.productGroup} 
                        onChange={(e) => setTempDisplayOptions({ ...tempDisplayOptions, productGroup: e.target.checked })}
                        style={{ width: 16, height: 16, accentColor: '#06b6d4', cursor: 'pointer' }}
                      />
                      Product Group
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                      <input 
                        type="checkbox" 
                        checked={tempDisplayOptions.hsn} 
                        onChange={(e) => setTempDisplayOptions({ ...tempDisplayOptions, hsn: e.target.checked })}
                        style={{ width: 16, height: 16, accentColor: '#06b6d4', cursor: 'pointer' }}
                      />
                      Hsn
                    </label>
                  </div>

                  {/* Stone Weight & Net Weight */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                      <input 
                        type="checkbox" 
                        checked={tempDisplayOptions.stoneWeight} 
                        onChange={(e) => setTempDisplayOptions({ ...tempDisplayOptions, stoneWeight: e.target.checked })}
                        style={{ width: 16, height: 16, accentColor: '#06b6d4', cursor: 'pointer' }}
                      />
                      Stone Weight
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                      <input 
                        type="checkbox" 
                        checked={tempDisplayOptions.netWeight} 
                        onChange={(e) => setTempDisplayOptions({ ...tempDisplayOptions, netWeight: e.target.checked })}
                        style={{ width: 16, height: 16, accentColor: '#06b6d4', cursor: 'pointer' }}
                      />
                      Net Weight
                    </label>
                  </div>

                  {/* Mc/Per & Mc.Amt */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                      <input 
                        type="checkbox" 
                        checked={tempDisplayOptions.mcPer} 
                        onChange={(e) => setTempDisplayOptions({ ...tempDisplayOptions, mcPer: e.target.checked })}
                        style={{ width: 16, height: 16, accentColor: '#06b6d4', cursor: 'pointer' }}
                      />
                      Mc/Per
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                      <input 
                        type="checkbox" 
                        checked={tempDisplayOptions.mcAmt} 
                        onChange={(e) => setTempDisplayOptions({ ...tempDisplayOptions, mcAmt: e.target.checked })}
                        style={{ width: 16, height: 16, accentColor: '#06b6d4', cursor: 'pointer' }}
                      />
                      Mc.Amt
                    </label>
                  </div>

                  {/* St.Amt */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                    <input 
                      type="checkbox" 
                      checked={tempDisplayOptions.stAmt} 
                      onChange={(e) => setTempDisplayOptions({ ...tempDisplayOptions, stAmt: e.target.checked })}
                      style={{ width: 16, height: 16, accentColor: '#06b6d4', cursor: 'pointer' }}
                    />
                    St.Amt
                  </label>

                  {/* Save Button */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                    <button 
                      onClick={handleSaveDisplayOptions}
                      style={{
                        padding: '8px 22px',
                        borderRadius: 8,
                        border: 'none',
                        background: '#0284c7',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(2, 132, 199, 0.4)'
                      }}
                    >
                      Save
                    </button>
                  </div>

                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <button 
            onClick={handleSaveInvoice}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              border: '1px solid var(--border-default)',
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Save size={15} /> Save
          </button>

          {/* Back Button */}
          <button 
            onClick={() => navigate('/silver-retail-dashboard')}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid var(--border-default)',
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <ArrowLeft size={15} /> Back
          </button>
        </div>
      </div>

      {/* Bill Header Info Form (Bill Date, Billing Name, Delivery Name, Counter, Sales Person) */}
      <div className="card" style={{ padding: 18, borderRadius: 12, marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: displayOptions.deliveryName ? '1fr 1.5fr 1.5fr 1.5fr 1fr' : '1fr 1.5fr 1.5fr 1fr', gap: 14, alignItems: 'end' }}>
          
          {/* Bill Date */}
          <div>
            <label style={{ fontSize: 11, color: '#ef4444', fontWeight: 700 }}>Bill Date *</label>
            <input 
              type="date" 
              value={billDate}
              onChange={(e) => setBillDate(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', marginTop: 4, borderRadius: 8, border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontSize: 13 }}
            />
          </div>

          {/* Billing Name */}
          <div>
            <label style={{ fontSize: 11, color: '#ef4444', fontWeight: 700 }}>Billing Name *</label>
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              <input 
                type="text" 
                placeholder="Billing Name" 
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontSize: 13 }}
              />
              <button style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-default)', background: 'var(--bg-elevated)', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}>
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Delivery Name (Conditionally rendered) */}
          {displayOptions.deliveryName && (
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Delivery Name</label>
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <input 
                  type="text" 
                  placeholder="Delivery Name" 
                  value={deliveryName}
                  onChange={(e) => setDeliveryName(e.target.value)}
                  style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontSize: 13 }}
                />
                <button style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-default)', background: 'var(--bg-elevated)', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}>
                  <Plus size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Counter */}
          <div>
            <label style={{ fontSize: 11, color: '#ef4444', fontWeight: 700 }}>Counter *</label>
            <select 
              value={counter}
              onChange={(e) => setCounter(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', marginTop: 4, borderRadius: 8, border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontSize: 13 }}
            >
              <option value="Muthu Kumaran Jewellery">Muthu Kumaran Jewellery</option>
              <option value="Main Showroom Counter">Main Showroom Counter</option>
              <option value="Silver Counter 1">Silver Counter 1</option>
            </select>
          </div>

          {/* Sales Person */}
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Sales Person</label>
            <input 
              type="text" 
              placeholder="Sales Person" 
              value={salesPerson}
              onChange={(e) => setSalesPerson(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', marginTop: 4, borderRadius: 8, border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontSize: 13 }}
            />
          </div>

        </div>
      </div>

      {/* Grid Layout: Left Column (Table & Scrap Exchange), Right Column (Financial Summary) */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 24 }}>
        
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Barcode Tag Scan Input (Conditionally rendered) */}
          {displayOptions.enableTagging && (
            <div style={{ marginBottom: 16, position: 'relative' }}>
              <input 
                type="text" 
                placeholder="Enter or Scan Tag Code" 
                value={tagQuery}
                onChange={(e) => setTagQuery(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontSize: 13 }}
              />
              {tagQuery && (
                <div style={{
                  position: 'absolute', top: 42, left: 0, width: 340, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 100, padding: 8
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
              )}
            </div>
          )}

          {/* Main Items Table Grid */}
          <div className="card" style={{ padding: 16, borderRadius: 12, marginBottom: 20, overflowX: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                ✨ Silver Items Billing Grid
              </h3>
              <button 
                onClick={addItemRow}
                style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #06b6d4, #0284c7)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Plus size={14} /> Add Silver Item
              </button>
            </div>

            <table className="data-table" style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-default)' }}>
                  <th style={{ width: 36, padding: '10px 6px', textAlign: 'center' }}>#</th>
                  {displayOptions.enableTagging && <th style={{ width: 100, padding: '10px 8px' }}>Tag</th>}
                  {displayOptions.productGroup && <th style={{ width: 130, padding: '10px 8px' }}>Product Group</th>}
                  <th style={{ padding: '10px 8px' }}>Product</th>
                  {displayOptions.hsn && <th style={{ width: 80, padding: '10px 8px' }}>HSN</th>}
                  <th style={{ width: 60, padding: '10px 8px' }}>Qty</th>
                  <th style={{ width: 85, padding: '10px 8px' }}>Gross Wt</th>
                  {displayOptions.stoneWeight && <th style={{ width: 80, padding: '10px 8px' }}>Stone Wt</th>}
                  {displayOptions.netWeight && <th style={{ width: 80, padding: '10px 8px' }}>Net Wt</th>}
                  <th style={{ width: 80, padding: '10px 8px' }}>Wst.Type</th>
                  <th style={{ width: 75, padding: '10px 8px' }}>Wst</th>
                  {displayOptions.mcPer && <th style={{ width: 80, padding: '10px 8px' }}>Mc/Per</th>}
                  {displayOptions.mcAmt && <th style={{ width: 80, padding: '10px 8px' }}>Mc.Amt</th>}
                  {displayOptions.stAmt && <th style={{ width: 80, padding: '10px 8px' }}>St.Amt</th>}
                  <th style={{ width: 90, padding: '10px 8px' }}>Rate</th>
                  <th style={{ width: 100, padding: '10px 8px', textAlign: 'right' }}>Total</th>
                  <th style={{ width: 40, padding: '10px 4px' }}></th>
                </tr>
              </thead>
              <tbody>
                {calculatedItems.map((item, idx) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    {/* Row checkbox / index */}
                    <td style={{ textAlign: 'center', padding: '6px' }}>
                      <input type="checkbox" style={{ cursor: 'pointer' }} />
                    </td>

                    {/* Tag Column */}
                    {displayOptions.enableTagging && (
                      <td style={{ padding: '6px 4px' }}>
                        <input 
                          type="text" 
                          placeholder="Tag #"
                          value={item.tagNumber} 
                          onChange={(e) => updateItemField(idx, 'tagNumber', e.target.value)}
                          style={{ width: '100%', padding: '6px 6px', borderRadius: 6, border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontSize: 12 }}
                        />
                      </td>
                    )}

                    {/* Product Group Column */}
                    {displayOptions.productGroup && (
                      <td style={{ padding: '6px 4px' }}>
                        <select 
                          value={item.productGroup}
                          onChange={(e) => updateItemField(idx, 'productGroup', e.target.value)}
                          style={{ width: '100%', padding: '6px 4px', borderRadius: 6, border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontSize: 12 }}
                        >
                          <option value="">Product Group</option>
                          <option value="Silver Ornaments">Silver Ornaments</option>
                          <option value="Silver Coins">Silver Coins</option>
                          <option value="Silver Utensils">Silver Utensils</option>
                          <option value="Silver Payal">Silver Payal</option>
                        </select>
                      </td>
                    )}

                    {/* Product / Title */}
                    <td style={{ padding: '6px 4px' }}>
                      <select 
                        value={item.title} 
                        onChange={(e) => updateItemField(idx, 'title', e.target.value)}
                        style={{ width: '100%', padding: '6px 4px', borderRadius: 6, border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontSize: 12 }}
                      >
                        <option value="">Product</option>
                        <option value="Silver Chain">Silver Chain</option>
                        <option value="Silver Ring">Silver Ring</option>
                        <option value="Silver Bracelet">Silver Bracelet</option>
                        <option value="Silver Anklet (Payal)">Silver Anklet (Payal)</option>
                        <option value="Silver Coin 999">Silver Coin 999</option>
                      </select>
                    </td>

                    {/* HSN Column */}
                    {displayOptions.hsn && (
                      <td style={{ padding: '6px 4px' }}>
                        <input 
                          type="text" 
                          placeholder="HSN"
                          value={item.hsn} 
                          onChange={(e) => updateItemField(idx, 'hsn', e.target.value)}
                          style={{ width: '100%', padding: '6px 6px', borderRadius: 6, border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontSize: 12 }}
                        />
                      </td>
                    )}

                    {/* Qty */}
                    <td style={{ padding: '6px 4px' }}>
                      <input 
                        type="number" 
                        value={item.qty} 
                        onChange={(e) => updateItemField(idx, 'qty', e.target.value)}
                        style={{ width: '100%', padding: '6px 4px', borderRadius: 6, border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontSize: 12, textAlign: 'center' }}
                      />
                    </td>

                    {/* Gross Weight */}
                    <td style={{ padding: '6px 4px' }}>
                      <input 
                        type="number" 
                        step="0.001"
                        value={item.grossWeight || ''} 
                        onChange={(e) => updateItemField(idx, 'grossWeight', e.target.value)}
                        style={{ width: '100%', padding: '6px 6px', borderRadius: 6, border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontWeight: 600, fontSize: 12 }}
                      />
                    </td>

                    {/* Stone Weight Column */}
                    {displayOptions.stoneWeight && (
                      <td style={{ padding: '6px 4px' }}>
                        <input 
                          type="number" 
                          step="0.001"
                          value={item.stoneWeight || ''} 
                          onChange={(e) => updateItemField(idx, 'stoneWeight', e.target.value)}
                          style={{ width: '100%', padding: '6px 6px', borderRadius: 6, border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontSize: 12 }}
                        />
                      </td>
                    )}

                    {/* Net Weight Column */}
                    {displayOptions.netWeight && (
                      <td style={{ padding: '6px 8px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {item.netWeight.toFixed(3)}
                      </td>
                    )}

                    {/* Wastage Type / Purity */}
                    <td style={{ padding: '6px 4px' }}>
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

                    {/* Wastage % */}
                    <td style={{ padding: '6px 4px' }}>
                      <input 
                        type="number" 
                        step="0.1"
                        value={item.wastagePercent || ''} 
                        onChange={(e) => updateItemField(idx, 'wastagePercent', e.target.value)}
                        style={{ width: '100%', padding: '6px 6px', borderRadius: 6, border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontSize: 12 }}
                      />
                    </td>

                    {/* Mc/Per Column */}
                    {displayOptions.mcPer && (
                      <td style={{ padding: '6px 4px' }}>
                        <input 
                          type="number" 
                          step="1"
                          value={item.makingChargePerGram || ''} 
                          onChange={(e) => updateItemField(idx, 'makingChargePerGram', e.target.value)}
                          style={{ width: '100%', padding: '6px 6px', borderRadius: 6, border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontSize: 12 }}
                        />
                      </td>
                    )}

                    {/* Mc.Amt Column */}
                    {displayOptions.mcAmt && (
                      <td style={{ padding: '6px 4px' }}>
                        <input 
                          type="number" 
                          step="1"
                          value={item.flatMakingCharge || ''} 
                          onChange={(e) => updateItemField(idx, 'flatMakingCharge', e.target.value)}
                          style={{ width: '100%', padding: '6px 6px', borderRadius: 6, border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontSize: 12 }}
                        />
                      </td>
                    )}

                    {/* St.Amt Column */}
                    {displayOptions.stAmt && (
                      <td style={{ padding: '6px 4px' }}>
                        <input 
                          type="number" 
                          step="1"
                          value={item.stoneAmount || ''} 
                          onChange={(e) => updateItemField(idx, 'stoneAmount', e.target.value)}
                          style={{ width: '100%', padding: '6px 6px', borderRadius: 6, border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontSize: 12 }}
                        />
                      </td>
                    )}

                    {/* Rate */}
                    <td style={{ padding: '6px 4px' }}>
                      <input 
                        type="number" 
                        step="0.1"
                        value={item.ratePerGram || ''} 
                        onChange={(e) => updateItemField(idx, 'ratePerGram', e.target.value)}
                        style={{ width: '100%', padding: '6px 6px', borderRadius: 6, border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontSize: 12 }}
                      />
                    </td>

                    {/* Total */}
                    <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {item.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Delete Row */}
                    <td style={{ padding: '6px 4px', textAlign: 'center' }}>
                      <button 
                        onClick={() => removeItemRow(idx)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}

                {/* Grid Totals Row */}
                <tr style={{ background: 'var(--bg-subtle)', fontWeight: 700, borderTop: '2px solid var(--border-default)' }}>
                  <td>Total</td>
                  {displayOptions.enableTagging && <td></td>}
                  {displayOptions.productGroup && <td></td>}
                  <td></td>
                  {displayOptions.hsn && <td></td>}
                  <td style={{ textAlign: 'center' }}>{totalQty}</td>
                  <td>{totalGrossWt.toFixed(3)}</td>
                  {displayOptions.stoneWeight && <td>{totalStoneWt.toFixed(3)}</td>}
                  {displayOptions.netWeight && <td>{totalNetWt.toFixed(3)}</td>}
                  <td></td>
                  <td>{totalFineWt.toFixed(3)}</td>
                  {displayOptions.mcPer && <td></td>}
                  {displayOptions.mcAmt && <td></td>}
                  {displayOptions.stAmt && <td></td>}
                  <td></td>
                  <td style={{ textAlign: 'right', color: '#06b6d4', fontSize: 13 }}>
                    ₹ {grossSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td></td>
                </tr>
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

        {/* Right Column: Financial Summary Panel */}
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
