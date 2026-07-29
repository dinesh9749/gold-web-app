import { useState, useEffect } from "react";
import { Printer, Save, Trash, Eye, RefreshCw, X } from "lucide-react";
import { useOutletContext } from "react-router-dom";

const incrementReceiptNo = (recNo) => {
  if (!recNo) return 'REC-1001';
  const match = String(recNo).match(/^(.*?)(\d+)$/);
  if (!match) {
    return String(recNo) + "-1";
  }
  const prefix = match[1];
  const numberStr = match[2];
  const nextNumber = parseInt(numberStr, 10) + 1;
  const paddedNumber = String(nextNumber).padStart(numberStr.length, '0');
  return prefix + paddedNumber;
};

const getNextReceiptSequence = (settingNo, existingReceipts) => {
  const defaultBase = settingNo || 'REC-1001';
  if (!existingReceipts || existingReceipts.length === 0) {
    return defaultBase;
  }

  let highestNum = -1;
  let highestStr = defaultBase;

  existingReceipts.forEach(rec => {
    const recNumStr = rec.receiptNumber || rec.receiptNo;
    if (recNumStr) {
      const match = String(recNumStr).match(/^(.*?)(\d+)$/);
      if (match) {
        const num = parseInt(match[2], 10);
        if (num > highestNum) {
          highestNum = num;
          highestStr = recNumStr;
        }
      }
    }
  });

  if (highestNum === -1) {
    return defaultBase;
  }

  const nextFromDb = incrementReceiptNo(highestStr);

  const matchSetting = String(defaultBase).match(/^(.*?)(\d+)$/);
  if (matchSetting) {
    const settingNum = parseInt(matchSetting[2], 10);
    if (settingNum > highestNum + 1) {
      return defaultBase;
    }
  }

  return nextFromDb;
};

const Receipt = () => {
  const outletContext = useOutletContext();
  const isAdmin = true;
  const [activeTab, setActiveTab] = useState("generator"); // "generator" or "history"
  const [customers, setCustomers] = useState([]);
  const [liveGoldRate, setLiveGoldRate] = useState(0);
  
  // History tab states
  const [receipts, setReceipts] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState("");

  // Customer dropdown autocomplete state
  const [custSearch, setCustSearch] = useState("");
  const [showCustDropdown, setShowCustDropdown] = useState(false);

  const [showPreview, setShowPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPhotoManager, setShowPhotoManager] = useState(false);
  const [photoManagerReceipt, setPhotoManagerReceipt] = useState(null);
  const [deletingPhotoIndex, setDeletingPhotoIndex] = useState(null);
  const [photoManagerMessage, setPhotoManagerMessage] = useState(null);

  useEffect(() => {
    if (!showPhotoManager) {
      setDeletingPhotoIndex(null);
      setPhotoManagerMessage(null);
    }
  }, [showPhotoManager]);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentReceipt, setPaymentReceipt] = useState(null);
  const [newPaymentAmount, setNewPaymentAmount] = useState("");
  const [newPaymentDate, setNewPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paperSize, setPaperSize] = useState("A4");

  const [receiptData, setReceiptData] = useState({
    id: null,
    receiptNo: "",
    date: new Date().toISOString().split("T")[0],
    customerId: null,
    consignee: "",
    items: [
      {
        description: "",
        advGold: "",
        netWeight: "",
        wastagePct: "",
        stoneWeight: "",
        rate: 0,
        makingCharges: "",
        amount: 0,
      },
    ],
    oldGoldWeight: "",
    oldGoldRate: "",
    oldGoldAmount: 0,
    otherCharges: "",
    amountReceived: "",
    productPhoto: null
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load customers
      const custRes = await window.electronAPI?.getAllCustomers();
      if (custRes) setCustomers(custRes);

      // Load settings and existing receipts to calculate true next sequence number
      const [settingsRes, recRes] = await Promise.all([
        window.electronAPI?.getOrganizationSettings(),
        window.electronAPI?.getAllReceipts()
      ]);

      if (recRes) setReceipts(recRes);
      const settingNo = settingsRes?.next_receipt_number || 'REC-1001';
      const nextSeqNo = getNextReceiptSequence(settingNo, recRes || []);
      setReceiptData(prev => ({ ...prev, receiptNo: nextSeqNo }));

      // Load live gold rates (22K)
      const ratesRes = await window.electronAPI?.getMetalRates();
      if (ratesRes?.success && ratesRes.metal_rates?.length > 0) {
        const rate = parseFloat(ratesRes.metal_rates[0].gold_rate) || 0;
        setLiveGoldRate(rate);
        
        setReceiptData(prev => {
          const newItems = [...prev.items];
          newItems[0].rate = rate;
          newItems[0].amount = calculateItemAmount(
            newItems[0].netWeight,
            newItems[0].wastagePct,
            rate,
            newItems[0].makingCharges,
            newItems[0].stoneWeight
          );
          return { ...prev, items: newItems };
        });
      }
    } catch (error) {
      console.error("Error loading billing data:", error);
    }
  };

  const loadReceiptsHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await window.electronAPI?.getAllReceipts();
      if (res) setReceipts(res);
    } catch (error) {
      console.error("Error loading receipt history:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleClosePreview = async () => {
    setShowPreview(false);
    if (!receiptData.id) {
      const freshReceipts = (await window.electronAPI?.getAllReceipts()) || receipts;
      const settingsRes = await window.electronAPI?.getOrganizationSettings();
      const nextSeqNo = getNextReceiptSequence(settingsRes?.next_receipt_number, freshReceipts);

      setReceiptData({
        id: null,
        receiptNo: nextSeqNo,
        date: new Date().toISOString().split("T")[0],
        customerId: null,
        consignee: "",
        items: [
          {
            description: "",
            advGold: "",
            netWeight: "",
            wastagePct: "",
            stoneWeight: "",
            rate: liveGoldRate || 0,
            makingCharges: "",
            amount: 0,
          },
        ],
        oldGoldWeight: "",
        oldGoldRate: "",
        oldGoldAmount: 0,
        otherCharges: "",
        amountReceived: "",
        productPhoto: null
      });
      setCustSearch("");
    }
  };

  const handleReloadSequence = async () => {
    try {
      const [settingsRes, recRes] = await Promise.all([
        window.electronAPI?.getOrganizationSettings(),
        window.electronAPI?.getAllReceipts()
      ]);
      const nextSeqNo = getNextReceiptSequence(settingsRes?.next_receipt_number, recRes || receipts);
      setReceiptData(prev => ({ ...prev, receiptNo: nextSeqNo }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "history") {
      loadReceiptsHistory();
    }
  };

  const calculateItemAmount = (netWeight, wastagePct, rate, makingCharges, stoneWeight = 0, advGold = 0) => {
    const nw = Number(netWeight) || 0;
    const wp = Number(wastagePct) || 0;
    const r = Number(rate) || 0;
    const mc = Number(makingCharges) || 0;
    const sw = Number(stoneWeight) || 0;
    const ag = Number(advGold) || 0;

    const grossWeight = Math.max(0, nw * (1 + wp / 100) - sw - ag);
    const amt = (grossWeight * r) + mc;
    return Math.round(amt * 100) / 100;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setReceiptData(prev => {
      const nextState = { ...prev, [name]: value };
      
      // If we are modifying old gold weight or rate, recalculate old gold amount
      if (name === "oldGoldWeight" || name === "oldGoldRate") {
        const wt = Number(nextState.oldGoldWeight) || 0;
        const rt = Number(nextState.oldGoldRate) || 0;
        nextState.oldGoldAmount = Math.round(wt * rt * 100) / 100;
      }
      
      return nextState;
    });
  };

  const handleItemChange = (index, field, value) => {
    setReceiptData(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      
      // Recalculate item amount
      const nw = newItems[index].netWeight;
      const wp = newItems[index].wastagePct;
      const rt = newItems[index].rate;
      const mc = newItems[index].makingCharges;
      const sw = newItems[index].stoneWeight;
      const ag = newItems[index].advGold;
      
      newItems[index].amount = calculateItemAmount(nw, wp, rt, mc, sw, ag);
      
      return { ...prev, items: newItems };
    });
  };

  const handleAddItem = () => {
    setReceiptData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          description: "",
          advGold: "",
          netWeight: "",
          wastagePct: "",
          stoneWeight: "",
          rate: liveGoldRate || 0,
          makingCharges: "",
          amount: 0,
        },
      ]
    }));
  };

  const handleRemoveItem = (index) => {
    if (receiptData.items.length === 1) return;
    setReceiptData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const selectCustomer = (cust) => {
    setReceiptData(prev => ({
      ...prev,
      customerId: cust.id,
      consignee: `${cust.title} ${cust.name} ${cust.surname}, ${cust.mobile}, ${cust.address1}, ${cust.city}`.trim()
    }));
    setCustSearch(`${cust.name} ${cust.surname}`);
    setShowCustDropdown(false);
  };

  // Calculations for totals
  const subtotal = receiptData.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const oldGoldAmt = parseFloat(receiptData.oldGoldAmount) || 0;
  const otherChargesVal = parseFloat(receiptData.otherCharges) || 0;
  const grandTotal = Math.round((subtotal - oldGoldAmt + otherChargesVal) * 100) / 100;
  const finalAmount = Math.max(0, Math.round(grandTotal));

  const handleSaveReceipt = async () => {
    if (!receiptData.consignee.trim()) {
      alert("Please select or enter customer details.");
      return;
    }
    if (!receiptData.receiptNo.trim()) {
      alert("Please specify a receipt number.");
      return;
    }
    
    setSubmitting(true);
    try {
      const payload = {
        receiptNo: receiptData.receiptNo.trim(),
        date: receiptData.date,
        customerId: receiptData.customerId,
        customerName: receiptData.consignee,
        subtotal: subtotal,
        oldGoldWeight: parseFloat(receiptData.oldGoldWeight) || 0,
        oldGoldAmount: parseFloat(receiptData.oldGoldAmount) || 0,
        grandTotal: grandTotal,
        finalAmount: finalAmount,
        otherCharges: parseFloat(receiptData.otherCharges) || 0,
        amountReceived: parseFloat(receiptData.amountReceived) || 0,
        productPhoto: receiptData.productPhoto || null,
        items: receiptData.items.map(item => ({
          description: item.description,
          hsnCode: null,
          advGold: parseFloat(item.advGold) || 0,
          netWeight: parseFloat(item.netWeight) || 0,
          wastagePct: parseFloat(item.wastagePct) || 0,
          stoneWeight: parseFloat(item.stoneWeight) || 0,
          makingCharges: parseFloat(item.makingCharges) || 0,
          ratePerGram: parseFloat(item.rate) || 0,
          amount: parseFloat(item.amount) || 0
        }))
      };

      const res = await window.electronAPI?.saveReceipt(payload);
      if (res?.id) {
        // Increment and save the sequence formatting
        const nextNo = incrementReceiptNo(receiptData.receiptNo);
        await window.electronAPI?.updateOrganizationSettings(undefined, nextNo);

        const savedObj = { ...payload, id: res.id, receiptNo: receiptData.receiptNo, receiptNumber: receiptData.receiptNo };
        setReceipts(prev => [savedObj, ...prev]);

        alert("Receipt saved to database successfully!");
        setShowPreview(true);
      }
    } catch (error) {
      console.error("Error saving receipt:", error);
      alert("Failed to save receipt. Document number might be duplicate.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReceipt = async (id) => {
    if (!window.confirm("Are you sure you want to delete this receipt record?")) return;
    try {
      const res = await window.electronAPI?.deleteReceipt(id);
      if (res) {
        alert("Receipt deleted.");
        loadReceiptsHistory();
      }
    } catch (err) {
      console.error("Error deleting receipt:", err);
      alert("Failed to delete receipt record.");
    }
  };

  const handleLoadReceiptDetails = async (id) => {
    try {
      const res = await window.electronAPI?.getReceiptById(id);
      if (res) {
        setReceiptData({
          id: res.id,
          receiptNo: res.receiptNo,
          date: res.date,
          customerId: res.customerId,
          consignee: res.customerName,
          items: res.items.map(item => ({
            id: item.id,
            description: item.description,
            advGold: item.advGold,
            netWeight: item.netWeight,
            wastagePct: item.wastagePct,
            stoneWeight: item.stoneWeight || 0,
            rate: item.ratePerGram,
            makingCharges: item.makingCharges,
            amount: item.amount
          })),
          oldGoldWeight: res.oldGoldWeight || "",
          oldGoldRate: res.oldGoldAmount && res.oldGoldWeight ? Math.round((res.oldGoldAmount / res.oldGoldWeight) * 100) / 100 : "",
          oldGoldAmount: res.oldGoldAmount || 0,
          otherCharges: res.otherCharges || "",
          amountReceived: res.amountReceived || "",
          productPhoto: res.productPhoto || null
        });
        setShowPreview(true);
      }
    } catch (err) {
      console.error("Error loading receipt details:", err);
      alert("Failed to retrieve receipt details.");
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById("invoice-preview");
    if (!printContent) return;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContent.outerHTML;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  const handleOpenPaymentModal = async (receipt) => {
    try {
      const fullRes = await window.electronAPI?.getReceiptById(receipt.id);
      if (fullRes) {
        setPaymentReceipt(fullRes);
        setNewPaymentAmount("");
        setNewPaymentDate(new Date().toISOString().split("T")[0]);
        setShowPaymentModal(true);
      }
    } catch (err) {
      console.error("Failed to load receipt payments list:", err);
      alert("Failed to load receipt details.");
    }
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();
    const amt = parseFloat(newPaymentAmount);
    if (isNaN(amt) || amt <= 0) {
      alert("Please enter a valid positive payment amount.");
      return;
    }
    setPaymentSaving(true);
    try {
      const res = await window.electronAPI?.saveReceiptPayment(paymentReceipt.id, amt, newPaymentDate);
      if (res) {
        alert("Payment recorded successfully!");
        const updated = await window.electronAPI?.getReceiptById(paymentReceipt.id);
        if (updated) {
          setPaymentReceipt(updated);
        }
        loadReceiptsHistory();
        setNewPaymentAmount("");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save payment transaction.");
    } finally {
      setPaymentSaving(false);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm("Are you sure you want to delete this payment record?")) return;
    try {
      await window.electronAPI?.deleteReceiptPayment(paymentId);
      alert("Payment transaction deleted successfully.");
      const updated = await window.electronAPI?.getReceiptById(paymentReceipt.id);
      if (updated) {
        setPaymentReceipt(updated);
      }
      loadReceiptsHistory();
    } catch (err) {
      console.error(err);
      alert("Failed to delete payment transaction.");
    }
  };

  // Autocomplete Filter
  const filteredCustomers = customers.filter(c => {
    const search = custSearch.toLowerCase();
    return (
      c.name.toLowerCase().includes(search) ||
      c.surname.toLowerCase().includes(search) ||
      c.mobile.includes(search)
    );
  });

  return (
    <div style={{ fontFamily: "var(--font-family)", color: "var(--text-primary)" }}>
      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
        <button
          onClick={() => handleTabChange("generator")}
          className={activeTab === "generator" ? "btn-primary" : "btn-secondary"}
          style={{ padding: '6px 16px', fontSize: 13 }}
        >
          📝 Create Receipt
        </button>
        <button
          onClick={() => handleTabChange("history")}
          className={activeTab === "history" ? "btn-primary" : "btn-secondary"}
          style={{ padding: '6px 16px', fontSize: 13 }}
        >
          📁 Past Receipts Log
        </button>
      </div>

      {activeTab === "generator" ? (
        <div className="card" style={{ maxWidth: 960, margin: '0 auto', width: '100%' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <div style={{
              width: 38, height: 38, background: 'linear-gradient(135deg, #fbbf24, #d97706)',
              borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
            }}>🧾</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>Receipt Generator</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ESTIMATION RECEIPT — NON-GST BILLING</div>
            </div>
            <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={handleReloadSequence}>
              ⟲ Load Sequence No
            </button>
          </div>

          {/* Form details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>
              <label className="form-label">Receipt Number</label>
              <input type="text" name="receiptNo" value={receiptData.receiptNo}
                onChange={handleInputChange} className="form-input" required />
            </div>
            <div>
              <label className="form-label">Date</label>
              <input type="date" name="date" value={receiptData.date}
                onChange={handleInputChange} className="form-input" required />
            </div>
          </div>

          {/* Customer Lookup */}
          <div style={{ marginBottom: 20, position: 'relative' }}>
            <label className="form-label">Select Customer (Autocomplete Search) *</label>
            <input
              type="text"
              placeholder="Type customer name or mobile number..."
              value={custSearch}
              onChange={(e) => {
                setCustSearch(e.target.value);
                setShowCustDropdown(true);
              }}
              onFocus={() => setShowCustDropdown(true)}
              className="form-input"
            />
            {showCustDropdown && custSearch.trim().length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0,
                background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                borderRadius: 8, zIndex: 10, maxHeight: 200, overflowY: 'auto', marginTop: 4,
                boxShadow: '0 8px 16px rgba(0,0,0,0.15)'
              }}>
                {filteredCustomers.length === 0 ? (
                  <div style={{ padding: 10, fontSize: 12, color: 'var(--text-muted)' }}>No customer matches found</div>
                ) : (
                  filteredCustomers.map(cust => (
                    <div
                      key={cust.id}
                      onClick={() => selectCustomer(cust)}
                      style={{
                        padding: '8px 12px', cursor: 'pointer', fontSize: 12,
                        borderBottom: '1px solid var(--border-subtle)',
                        background: 'var(--bg-elevated)'
                      }}
                      onMouseEnter={(e) => e.target.style.background = 'rgba(251,191,36,0.06)'}
                      onMouseLeave={(e) => e.target.style.background = 'var(--bg-elevated)'}
                    >
                      <strong>{cust.title} {cust.name} {cust.surname}</strong> ({cust.mobile}) — {cust.city}
                    </div>
                  ))
                )}
              </div>
            )}
            <textarea
              name="consignee"
              rows="2"
              value={receiptData.consignee}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Consignee Full Billing Details (Auto-populates from search or type manually)..."
              style={{ marginTop: 10, fontSize: 12 }}
              required
            />
          </div>

          {/* Item Tables */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span className="form-label" style={{ margin: 0, fontWeight: 700 }}>Receipt Items (Purity, Weight, Wastage, Charges)</span>
              <button onClick={handleAddItem} className="btn-primary" style={{ padding: '4px 10px', fontSize: 11 }}>
                + Add Item
              </button>
            </div>
            <div style={{ overflowX: 'auto', border: '1px solid var(--border-default)', borderRadius: 10 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: 8, width: 30 }}>#</th>
                    <th style={{ padding: 8, minWidth: 160 }}>Ornaments Description</th>
                    <th style={{ padding: 8, width: 80 }}>Adv Gold (g)</th>
                    <th style={{ padding: 8, width: 80 }}>Net Wt (g)</th>
                    <th style={{ padding: 8, width: 80 }}>Wastage %</th>
                    <th style={{ padding: 8, width: 80 }}>Stone Wt (g)</th>
                    <th style={{ padding: 8, width: 80 }}>Gross Wt</th>
                    <th style={{ padding: 8, width: 90 }}>Rate/g</th>
                    <th style={{ padding: 8, width: 90 }}>Making (₹)</th>
                    <th style={{ padding: 8, width: 100 }}>Amount</th>
                    <th style={{ padding: 8, width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {receiptData.items.map((item, index) => {
                    const nw = parseFloat(item.netWeight) || 0;
                    const wp = parseFloat(item.wastagePct) || 0;
                    const sw = parseFloat(item.stoneWeight) || 0;
                    const ag = parseFloat(item.advGold) || 0;
                    const grossWt = Math.max(0, nw * (1 + wp / 100) - sw - ag).toFixed(3);

                    return (
                      <tr key={index} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: 8, fontWeight: 700 }}>{index + 1}</td>
                        <td style={{ padding: 6 }}>
                          <input type="text" value={item.description}
                            onChange={(e) => handleItemChange(index, "description", e.target.value)}
                            className="form-input" style={{ padding: 4, fontSize: 11 }} placeholder="e.g. Ring 22K" required />
                        </td>
                        <td style={{ padding: 6 }}>
                          <input type="number" step="any" value={item.advGold}
                            onChange={(e) => handleItemChange(index, "advGold", e.target.value)}
                            className="form-input" style={{ padding: 4, fontSize: 11 }} placeholder="0" />
                        </td>
                        <td style={{ padding: 6 }}>
                          <input type="number" step="any" value={item.netWeight}
                            onChange={(e) => handleItemChange(index, "netWeight", e.target.value)}
                            className="form-input" style={{ padding: 4, fontSize: 11 }} placeholder="0.00" required />
                        </td>
                        <td style={{ padding: 6 }}>
                          <input type="number" step="any" value={item.wastagePct}
                            onChange={(e) => handleItemChange(index, "wastagePct", e.target.value)}
                            className="form-input" style={{ padding: 4, fontSize: 11 }} placeholder="0" />
                        </td>
                        <td style={{ padding: 6 }}>
                          <input type="number" step="any" value={item.stoneWeight}
                            onChange={(e) => handleItemChange(index, "stoneWeight", e.target.value)}
                            className="form-input" style={{ padding: 4, fontSize: 11 }} placeholder="0" />
                        </td>
                        <td style={{ padding: 8, fontWeight: 600, color: 'var(--text-muted)' }}>
                          {grossWt}g
                        </td>
                        <td style={{ padding: 6 }}>
                          <input type="number" step="any" value={item.rate}
                            onChange={(e) => handleItemChange(index, "rate", e.target.value)}
                            className="form-input" style={{ padding: 4, fontSize: 11 }} required />
                        </td>
                        <td style={{ padding: 6 }}>
                          <input type="number" step="any" value={item.makingCharges}
                            onChange={(e) => handleItemChange(index, "makingCharges", e.target.value)}
                            className="form-input" style={{ padding: 4, fontSize: 11 }} placeholder="0" />
                        </td>
                        <td style={{ padding: 8, fontWeight: 700, color: 'var(--gold-300)' }}>
                          ₹{item.amount.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: 6, textAlign: 'center' }}>
                          <button
                            onClick={() => handleRemoveItem(index)}
                            disabled={receiptData.items.length === 1}
                            style={{
                              background: 'none', border: 'none', color: '#ef4444',
                              cursor: receiptData.items.length === 1 ? 'not-allowed' : 'pointer', opacity: receiptData.items.length === 1 ? 0.3 : 1
                            }}
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Lower Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, marginTop: 12 }}>
            {/* Old Gold Deductions */}
            <div className="card" style={{ padding: 18, background: 'var(--bg-elevated)', border: '1px dashed var(--border-default)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold-200)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                📥 Old Gold Exchange / Purchase (Deductions)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label className="form-label" style={{ fontSize: 11 }}>Old Gold Weight (g)</label>
                  <input type="number" step="any" name="oldGoldWeight" value={receiptData.oldGoldWeight}
                    onChange={handleInputChange} className="form-input" style={{ padding: 6, fontSize: 11 }} placeholder="Weight in grams" />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: 11 }}>Valuation Rate per Gram</label>
                  <input type="number" step="any" name="oldGoldRate" value={receiptData.oldGoldRate}
                    onChange={handleInputChange} className="form-input" style={{ padding: 6, fontSize: 11 }} placeholder="Rate in ₹" />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Total Old Gold Valuation:</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#f87171' }}>- ₹{oldGoldAmt.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Final Totals Card */}
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--bg-elevated)', padding: 18, borderRadius: 12, border: '1px solid var(--border-default)' }}>
                {/* Items Subtotal */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Items Subtotal</span>
                  <span style={{ fontWeight: 700 }}>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                {/* Deductions */}
                {oldGoldAmt > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#f87171' }}>
                    <span>Subtotal Purchase</span>
                    <span>₹{oldGoldAmt.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {/* Other Charges */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Other Charges (₹)</span>
                  <input type="number" name="otherCharges" value={receiptData.otherCharges}
                    onChange={handleInputChange} className="form-input" style={{ width: 100, padding: 4, textAlign: 'right', fontSize: 11 }} placeholder="e.g. 100" />
                </div>
                {/* Grand Total */}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid var(--border-default)', paddingTop: 10, fontSize: 15, fontWeight: 800, color: 'var(--gold-300)' }}>
                  <span>Grand Total</span>
                  <span>₹{finalAmount.toLocaleString('en-IN')}</span>
                </div>
                {/* Amount Received */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Amount Received (₹)</span>
                  <input type="number" name="amountReceived" value={receiptData.amountReceived}
                    onChange={handleInputChange} className="form-input" style={{ width: 100, padding: 4, textAlign: 'right', fontSize: 11 }} placeholder="0" />
                </div>
                {/* Balance Pending */}
                {(() => {
                  const recd = parseFloat(receiptData.amountReceived) || 0;
                  const bal = Math.max(0, finalAmount - recd);
                  return (
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: 8, fontSize: 12 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Balance Pending</span>
                      <span style={{ fontWeight: 800, color: bal > 0 ? '#f87171' : 'var(--text-primary)' }}>
                        ₹{bal.toLocaleString('en-IN')}
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
                <button
                  onClick={handleSaveReceipt}
                  disabled={submitting}
                  className="btn-primary"
                  style={{
                    flex: 1, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    fontSize: 13, fontWeight: 700
                  }}
                >
                  <Save size={15} /> {submitting ? "Saving..." : "Save Receipt"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* PAST RECEIPTS HISTORY TAB */
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, flex: 1 }}>Receipts Submission Ledger</h3>
            <div style={{ position: 'relative', width: 260 }}>
              <input
                type="text"
                className="form-input"
                style={{ padding: '6px 12px 6px 30px', fontSize: 12 }}
                placeholder="Search by customer..."
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
              />
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', opacity: 0.4, fontSize: 12 }}>🔍</span>
            </div>
            <button onClick={loadReceiptsHistory} className="btn-secondary" style={{ padding: '6px 10px' }} title="Refresh">
              <RefreshCw size={14} />
            </button>
          </div>

          {historyLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>Retrieving receipt submissions...</div>
          ) : receipts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>No receipts found in log history.</div>
          ) : (
            <div style={{ overflowX: 'auto', border: '1px solid var(--border-default)', borderRadius: 10 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: 12 }}>Date</th>
                    <th style={{ padding: 12 }}>Receipt No</th>
                    <th style={{ padding: 12 }}>Customer Details</th>
                    <th style={{ padding: 12, textAlign: 'right' }}>Total Wt</th>
                    <th style={{ padding: 12, textAlign: 'right' }}>Bill Total</th>
                    <th style={{ padding: 12, textAlign: 'right' }}>Recd Amount</th>
                    <th style={{ padding: 12, textAlign: 'right' }}>Balance</th>
                    <th style={{ padding: 12, textAlign: 'center', width: 220 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {receipts
                    .filter(r => r.customerName.toLowerCase().includes(historySearch.toLowerCase()) || r.receiptNo.toLowerCase().includes(historySearch.toLowerCase()))
                    .map(r => (
                      <tr key={r.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: 12 }}>{new Date(r.date).toLocaleDateString('en-GB')}</td>
                        <td style={{ padding: 12, fontWeight: 700, color: 'var(--gold-200)' }}>{r.receiptNo}</td>
                        <td style={{ padding: 12, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.customerName}</td>
                        <td style={{ padding: 12, textAlign: 'right' }}>{r.oldGoldWeight ? `${r.oldGoldWeight.toFixed(3)}g` : '-'}</td>
                        <td style={{ padding: 12, textAlign: 'right', fontWeight: 700 }}>₹{(r.finalAmount || 0).toLocaleString('en-IN')}</td>
                        <td style={{ padding: 12, textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                            <span>₹{(r.amountReceived || 0).toLocaleString('en-IN')}</span>
                            <button
                              onClick={() => handleOpenPaymentModal(r)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, fontSize: 11 }}
                              title="Update Payment Received"
                            >
                              ✏️
                            </button>
                          </div>
                        </td>
                        <td style={{ padding: 12, textAlign: 'right', fontWeight: 800, color: Math.max(0, (r.finalAmount || 0) - (r.amountReceived || 0)) > 0 ? '#ef4444' : 'var(--text-primary)' }}>
                          ₹{Math.max(0, (r.finalAmount || 0) - (r.amountReceived || 0)).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: 8, textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                            <button
                              onClick={() => handleLoadReceiptDetails(r.id)}
                              className="btn-secondary"
                              style={{ padding: '4px 10px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              <Eye size={12} /> View
                            </button>
                            
                            <button
                              onClick={() => {
                                setPhotoManagerReceipt(r);
                                setShowPhotoManager(true);
                              }}
                              className="btn-secondary"
                              style={{ padding: '4px 10px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              📷 Photo ({r.productPhoto ? "1" : "0"})
                            </button>

                            <button
                              onClick={() => handleDeleteReceipt(r.id)}
                              className="btn-danger"
                              style={{ padding: '4px 10px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              <Trash size={12} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* PREVIEW MODAL */}
      {showPreview && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: paperSize === "A4" ? 840 : 595, transition: 'max-width 0.2s ease-in-out' }}>
            <div className="modal-header">
              <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span>✦ Estimation Receipt Preview</span>
                <div style={{ display: 'flex', border: '1px solid var(--border-default)', borderRadius: 6, overflow: 'hidden' }}>
                  <button
                    type="button"
                    onClick={() => setPaperSize("A4")}
                    style={{
                      padding: '4px 10px', fontSize: 11, border: 'none', cursor: 'pointer',
                      background: paperSize === "A4" ? "var(--gold-200)" : "var(--bg-elevated)",
                      color: paperSize === "A4" ? "#000" : "var(--text-primary)",
                      fontWeight: paperSize === "A4" ? 700 : 500
                    }}
                  >
                    A4 Size
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaperSize("A5")}
                    style={{
                      padding: '4px 10px', fontSize: 11, border: 'none', cursor: 'pointer',
                      background: paperSize === "A5" ? "var(--gold-200)" : "var(--bg-elevated)",
                      color: paperSize === "A5" ? "#000" : "var(--text-primary)",
                      fontWeight: paperSize === "A5" ? 700 : 500
                    }}
                  >
                    A5 Size
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handlePrint} className="btn-primary" style={{ padding: '6px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Printer size={14} /> Print Receipt
                </button>
                <button onClick={handleClosePreview} className="modal-close">✕</button>
              </div>
            </div>

            <div className="modal-body" style={{ background: '#fffdf5', color: '#0f172a', padding: paperSize === "A4" ? 36 : 24, fontFamily: 'serif' }}>
              <div id="invoice-preview" className={`paper-${paperSize.toLowerCase()}`}>
                <style dangerouslySetInnerHTML={{ __html: `
                  @media print {
                    @page {
                      size: ${paperSize === "A4" ? "A4" : "A5"};
                      margin: 0 !important;
                    }
                    body {
                      margin: 0 !important;
                      padding: 0 !important;
                      visibility: hidden;
                    }
                    .paper-a4 {
                      width: 100% !important;
                      min-height: 297mm !important;
                      padding: 12mm 15mm !important;
                      box-sizing: border-box !important;
                      margin: 0 auto !important;
                      font-size: 12px !important;
                      visibility: visible !important;
                    }
                    .paper-a4 * {
                      visibility: visible !important;
                    }
                    .paper-a5 {
                      width: 100% !important;
                      min-height: 210mm !important;
                      padding: 8mm 10mm !important;
                      box-sizing: border-box !important;
                      margin: 0 auto !important;
                      font-size: 9.5px !important;
                      visibility: visible !important;
                    }
                    .paper-a5 * {
                      visibility: visible !important;
                    }
                    .paper-a5 table {
                      font-size: 8.5px !important;
                    }
                    .paper-a5 th, .paper-a5 td {
                      padding: 4px 3px !important;
                    }
                    .paper-a5 .signatory-section {
                      margin-top: 20px !important;
                    }
                  }
                `}} />
                {/* Print Receipt Header */}
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <h2 style={{ margin: '0 0 4px 0', fontSize: 24, letterSpacing: 0.5, fontWeight: 800 }}>M S GOLD SMITH</h2>
                  <p style={{ margin: '2px 0', fontSize: 12 }}>No.37C, Chettiyakudi South Street, Nadaga Salai,</p>
                  <p style={{ margin: '2px 0', fontSize: 12 }}>Srivilliputhur, Virudhunagar - 626 125.</p>
                  <p style={{ margin: '2px 0', fontSize: 12 }}><strong>Mobile:</strong> 94431 12034</p>
                  <h3 style={{ margin: '14px 0 6px 0', fontSize: 15, textDecoration: 'underline', fontWeight: 700 }}>ESTIMATION RECEIPT</h3>
                </div>

                {/* Meta details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20, fontSize: 12, borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '10px 0', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontWeight: 700, textDecoration: 'underline', marginBottom: 4 }}>CUSTOMER DETAILS:</div>
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>{receiptData.consignee}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingLeft: 20, borderLeft: '1px dashed #ccc' }}>
                    <div><strong>Receipt No:</strong> {receiptData.receiptNo}</div>
                    <div><strong>Date:</strong> {new Date(receiptData.date).toLocaleDateString('en-GB')}</div>
                  </div>
                </div>

                {/* Items Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, textAlign: 'left', marginBottom: 16 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #000', fontWeight: 700 }}>
                      <th style={{ padding: '6px 4px', width: 30 }}>#</th>
                      <th style={{ padding: '6px 4px' }}>Description of Ornaments</th>
                      <th style={{ padding: '6px 4px', textAlign: 'right', width: 70 }}>Adv Gold</th>
                      <th style={{ padding: '6px 4px', textAlign: 'right', width: 70 }}>Net Wt</th>
                      <th style={{ padding: '6px 4px', textAlign: 'right', width: 70 }}>Wastage</th>
                      <th style={{ padding: '6px 4px', textAlign: 'right', width: 70 }}>Stone Wt</th>
                      <th style={{ padding: '6px 4px', textAlign: 'right', width: 70 }}>Gross Wt</th>
                      <th style={{ padding: '6px 4px', textAlign: 'right', width: 80 }}>Rate/g</th>
                      <th style={{ padding: '6px 4px', textAlign: 'right', width: 80 }}>Making</th>
                      <th style={{ padding: '6px 4px', textAlign: 'right', width: 90 }}>Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receiptData.items.map((item, index) => {
                      const nw = parseFloat(item.netWeight) || 0;
                      const wp = parseFloat(item.wastagePct) || 0;
                      const sw = parseFloat(item.stoneWeight) || 0;
                      const ag = parseFloat(item.advGold) || 0;
                      const grossWt = Math.max(0, nw * (1 + wp / 100) - sw - ag).toFixed(3);

                      return (
                        <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '6px 4px' }}>{index + 1}</td>
                          <td style={{ padding: '6px 4px', textTransform: 'uppercase' }}>{item.description}</td>
                          <td style={{ padding: '6px 4px', textAlign: 'right' }}>{ag ? `${ag.toFixed(3)}g` : '-'}</td>
                          <td style={{ padding: '6px 4px', textAlign: 'right' }}>{nw.toFixed(3)}g</td>
                          <td style={{ padding: '6px 4px', textAlign: 'right' }}>{wp ? `${wp}%` : '0%'}</td>
                          <td style={{ padding: '6px 4px', textAlign: 'right' }}>{sw ? `${sw.toFixed(3)}g` : '-'}</td>
                          <td style={{ padding: '6px 4px', textAlign: 'right' }}>{grossWt}g</td>
                          <td style={{ padding: '6px 4px', textAlign: 'right' }}>{parseFloat(item.rate).toFixed(2)}</td>
                          <td style={{ padding: '6px 4px', textAlign: 'right' }}>{item.makingCharges ? parseFloat(item.makingCharges).toFixed(2) : '-'}</td>
                          <td style={{ padding: '6px 4px', textAlign: 'right', fontWeight: 700 }}>{item.amount.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Bottom summaries */}
                <div style={{ display: 'grid', gridTemplateColumns: receiptData.productPhoto ? '1.2fr 1fr' : '1fr', gap: 20, fontSize: 11 }}>
                  {/* Photo area */}
                  {receiptData.productPhoto && (
                    <div style={{ border: '1px solid #ddd', padding: 8, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 120, background: '#fafafa' }}>
                      <img src={receiptData.productPhoto} alt="Ornament Thumbnail" style={{ maxHeight: 110, maxWidth: '100%', objectFit: 'contain' }} />
                    </div>
                  )}

                  {/* Calculations */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: receiptData.productPhoto ? 10 : 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Subtotal amount:</span>
                      <strong>₹{subtotal.toFixed(2)}</strong>
                    </div>

                    {oldGoldAmt > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#c2410c' }}>
                        <span>Old Gold Valuation (-):</span>
                        <strong>₹{oldGoldAmt.toFixed(2)}</strong>
                      </div>
                    )}

                    {otherChargesVal > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Other Charges (+):</span>
                        <strong>₹{otherChargesVal.toFixed(2)}</strong>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800, borderTop: '1px solid #000', paddingTop: 6, marginTop: 4 }}>
                      <span>FINAL AMOUNT:</span>
                      <span>₹{finalAmount.toLocaleString('en-IN')}.00</span>
                    </div>
                    {(() => {
                      const recd = parseFloat(receiptData.amountReceived) || 0;
                      const bal = Math.max(0, finalAmount - recd);
                      return (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dotted #ccc', paddingTop: 4, fontSize: 11 }}>
                            <span>Amount Received:</span>
                            <strong>₹{recd.toLocaleString('en-IN')}.00</strong>
                          </div>
                          {receiptData.payments && receiptData.payments.length > 0 && (
                            <div style={{ paddingLeft: 8, fontSize: 10, color: '#475569', borderLeft: '1px solid #ddd', margin: '4px 0' }}>
                              {receiptData.payments.map((p, idx) => (
                                <div key={p.id || idx} style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                                  <span>• {new Date(p.paymentDate).toLocaleDateString('en-GB')}</span>
                                  <span>₹{p.amount.toLocaleString('en-IN')}.00</span>
                                </div>
                              ))}
                            </div>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dotted #ccc', paddingTop: 4, fontSize: 11 }}>
                            <span>Balance Pending:</span>
                            <strong style={{ color: bal > 0 ? '#b91c1c' : '#0f172a' }}>
                              ₹{bal.toLocaleString('en-IN')}.00
                            </strong>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Declarations & Signature */}
                <div className="signatory-section" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 36, fontSize: 11 }}>
                  <div style={{ width: '60%' }}>
                    <p style={{ margin: 0 }}><strong>Declaration:</strong></p>
                    <p style={{ margin: '4px 0 0 0', fontSize: 9, lineHeight: 1.4, color: '#555' }}>
                      This receipt shows the estimated price of the goods described and all particulars are true and correct. (Estimation Only).
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', width: '30%' }}>
                    <p style={{ margin: 0 }}>For <strong>M S GOLD SMITH</strong></p>
                    <p style={{ marginTop: 40, borderTop: '1px solid #000', display: 'inline-block', width: 140, paddingTop: 4 }}>Authorized Signatory</p>
                  </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: 24, fontSize: 10, fontStyle: 'italic', borderTop: '1px dashed #ccc', paddingTop: 8, color: '#555' }}>
                  Thank you for your business. (Estimation/Estimate only)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PHOTO MANAGER MODAL */}
      {showPhotoManager && photoManagerReceipt && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <div className="modal-title">📷 Product Photo Manager</div>
              <button onClick={() => setShowPhotoManager(false)} className="modal-close">✕</button>
            </div>
            <div className="modal-body" style={{ padding: 20 }}>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>
                Manage thumbnail photo for Receipt: <strong>{photoManagerReceipt.receiptNo}</strong> (Customer: {photoManagerReceipt.customerName})
              </p>

              {photoManagerMessage && (
                <div style={{ padding: 8, background: 'rgba(74,222,128,0.1)', border: '1px solid #4ade80', color: '#4ade80', borderRadius: 6, fontSize: 12, marginBottom: 12 }}>
                  {photoManagerMessage}
                </div>
              )}

              {/* Photo Display */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                {photoManagerReceipt.productPhoto ? (
                  <div style={{ position: 'relative', width: 220, height: 180, border: '1px solid var(--border-default)', borderRadius: 8, overflow: 'hidden' }}>
                    <img src={photoManagerReceipt.productPhoto} alt="Product Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    <button
                      onClick={async () => {
                        if (!window.confirm("Remove this thumbnail photo?")) return;
                        try {
                          await window.electronAPI?.updateReceiptPhoto(photoManagerReceipt.id, null);
                          setPhotoManagerReceipt(prev => ({ ...prev, productPhoto: null }));
                          setPhotoManagerMessage("Photo removed successfully!");
                          loadReceiptsHistory();
                        } catch (err) {
                          console.error(err);
                          alert("Failed to delete photo.");
                        }
                      }}
                      className="btn-danger"
                      style={{ position: 'absolute', top: 8, right: 8, padding: '4px 8px', fontSize: 10 }}
                    >
                      Delete Photo
                    </button>
                  </div>
                ) : (
                  <div style={{ width: 220, height: 180, border: '1px dashed var(--border-default)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                    No Photo Uploaded
                  </div>
                )}

                {/* Upload Button */}
                <input
                  type="file"
                  accept="image/*"
                  id="receiptPhotoUploadInput"
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onloadend = async () => {
                      try {
                        const base64 = reader.result;
                        await window.electronAPI?.updateReceiptPhoto(photoManagerReceipt.id, base64);
                        setPhotoManagerReceipt(prev => ({ ...prev, productPhoto: base64 }));
                        setPhotoManagerMessage("Photo uploaded successfully!");
                        loadReceiptsHistory();
                      } catch (err) {
                        console.error(err);
                        alert("Failed to upload photo.");
                      }
                    };
                    reader.readAsDataURL(file);
                  }}
                />
                <button
                  onClick={() => document.getElementById("receiptPhotoUploadInput").click()}
                  className="btn-primary"
                  style={{ padding: '6px 14px', fontSize: 12 }}
                >
                  {photoManagerReceipt.productPhoto ? "Change Photo" : "Upload Photo"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT MANAGER MODAL */}
      {showPaymentModal && paymentReceipt && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-box" style={{ maxWidth: 500, margin: 'auto' }}>
            <div className="modal-header">
              <div className="modal-title">💵 Collect Payment - Receipt {paymentReceipt.receiptNo}</div>
              <button onClick={() => setShowPaymentModal(false)} className="modal-close">✕</button>
            </div>
            <div className="modal-body" style={{ padding: 20 }}>
              {/* Payment Summary */}
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', padding: 14, borderRadius: 8, marginBottom: 18, fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>Bill Total Amount:</span>
                  <strong>₹{paymentReceipt.finalAmount.toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>Total Amount Received:</span>
                  <strong style={{ color: '#22c55e' }}>₹{(paymentReceipt.amountReceived || 0).toLocaleString('en-IN')}</strong>
                </div>
                {(() => {
                  const bal = Math.max(0, paymentReceipt.finalAmount - (paymentReceipt.amountReceived || 0));
                  return (
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: 6, marginTop: 6, fontWeight: 700 }}>
                      <span>Balance Pending:</span>
                      <span style={{ color: bal > 0 ? '#ef4444' : 'var(--text-primary)' }}>₹{bal.toLocaleString('en-IN')}</span>
                    </div>
                  );
                })()}
              </div>

              {/* Add Payment Form */}
              <form onSubmit={handleSavePayment} style={{ marginBottom: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label className="form-label" style={{ fontSize: 11 }}>Payment Date</label>
                    <input
                      type="date"
                      value={newPaymentDate}
                      onChange={e => setNewPaymentDate(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: 11 }}>Amount to Collect (₹)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0"
                      value={newPaymentAmount}
                      onChange={e => setNewPaymentAmount(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={paymentSaving}
                  className="btn-primary"
                  style={{ width: '100%', padding: '8px 12px', background: '#22c55e', borderColor: '#22c55e', color: '#fff', fontSize: 12 }}
                >
                  {paymentSaving ? "Saving..." : "Add Payment Record"}
                </button>
              </form>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '16px 0' }} />

              {/* Payment History Log */}
              <div style={{ fontSize: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--text-secondary)' }}>Recent Received Payments History</div>
                {!paymentReceipt.payments || paymentReceipt.payments.length === 0 ? (
                  <div style={{ padding: '10px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 11 }}>
                    No payment history logged yet.
                  </div>
                ) : (
                  <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 6, background: 'var(--bg-elevated)' }}>
                    {paymentReceipt.payments.map((p) => (
                      <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 700 }}>₹{p.amount.toLocaleString('en-IN')}</span>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Date: {new Date(p.paymentDate).toLocaleDateString('en-GB')}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeletePayment(p.id)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 11 }}
                          title="Delete Payment"
                        >
                          🗑
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Receipt;
