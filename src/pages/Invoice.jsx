import { useState, useEffect } from "react";
import { Printer, Save, Trash, Eye, RefreshCw, X } from "lucide-react";
import { useOutletContext } from "react-router-dom";

const Invoice = () => {
  const outletContext = useOutletContext();
  const isAdmin = outletContext ? outletContext.isAdmin : (localStorage.getItem("goldApp_adminMode") !== "false");
  const [activeTab, setActiveTab] = useState("generator"); // "generator" or "history"
  const [customers, setCustomers] = useState([]);
  const [liveGoldRate, setLiveGoldRate] = useState(0);
  
  // History tab states
  const [invoices, setInvoices] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState("");

  // Customer dropdown autocomplete state
  const [custSearch, setCustSearch] = useState("");
  const [showCustDropdown, setShowCustDropdown] = useState(false);

  const [showPreview, setShowPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [invoiceData, setInvoiceData] = useState({
    invoiceNo: "",
    date: new Date().toISOString().split("T")[0],
    customerId: null,
    consignee: "",
    items: [
      {
        description: "Gold Ring",
        hsnCode: "7113",
        netWeight: 5.0,
        wastagePct: 10,  // 10% standard wastage
        rate: 6500,
        makingCharges: 500,
        amount: 36250,
      },
    ],
    cgstRate: 1.5,
    sgstRate: 1.5,
    oldGoldWeight: 0,
    oldGoldRate: 0,
    oldGoldAmount: 0
  });

  useEffect(() => {
    loadData();
    generateInvoiceNumber();
  }, []);

  const loadData = async () => {
    try {
      // Load customers
      const custRes = await window.electronAPI?.getAllCustomers();
      if (custRes) setCustomers(custRes);

      // Load live gold rates (22K)
      const ratesRes = await window.electronAPI?.getMetalRates();
      if (ratesRes?.success && ratesRes.metal_rates?.length > 0) {
        const rate = parseFloat(ratesRes.metal_rates[0].gold_rate) || 0;
        setLiveGoldRate(rate);
        
        // Update default rate in first item if not edited
        setInvoiceData(prev => {
          const newItems = [...prev.items];
          newItems[0].rate = rate;
          newItems[0].amount = calculateItemAmount(newItems[0].netWeight, newItems[0].wastagePct, rate, newItems[0].makingCharges);
          return { ...prev, items: newItems };
        });
      }
    } catch (error) {
      console.error("Error loading billing data:", error);
    }
  };

  const generateInvoiceNumber = () => {
    const random = Math.floor(1000 + Math.random() * 9000);
    const year = new Date().getFullYear();
    setInvoiceData(prev => ({ ...prev, invoiceNo: `INV-${year}-${random}` }));
  };

  const loadInvoicesHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await window.electronAPI?.getAllInvoices();
      if (res) setInvoices(res);
    } catch (error) {
      console.error("Error loading invoice history:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "history") {
      loadInvoicesHistory();
    }
  };

  const calculateItemAmount = (netWeight, wastagePct, rate, makingCharges) => {
    const nw = Number(netWeight) || 0;
    const wp = Number(wastagePct) || 0;
    const r = Number(rate) || 0;
    const mc = Number(makingCharges) || 0;

    const grossWeight = nw * (1 + wp / 100);
    const amt = (grossWeight * r) + mc;
    return Math.round(amt * 100) / 100;
  };

  const calculateSubTotal = () => {
    return invoiceData.items.reduce((total, item) => total + Number(item.amount), 0);
  };

  const calculateTax = (subTotal, rate) => {
    return (subTotal * rate) / 100;
  };

  const calculateGrandTotal = () => {
    const subTotal = calculateSubTotal();
    const cgstAmount = calculateTax(subTotal, invoiceData.cgstRate);
    const sgstAmount = calculateTax(subTotal, invoiceData.sgstRate);
    return subTotal + cgstAmount + sgstAmount;
  };

  const calculateFinalAmount = () => {
    const grand = calculateGrandTotal();
    const oldGoldVal = Number(invoiceData.oldGoldWeight || 0) * Number(invoiceData.oldGoldRate || 0);
    return Math.max(0, Math.round(grand - oldGoldVal));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInvoiceData((prev) => {
      let nextState = { ...prev, [name]: value };
      
      // Calculate old gold amount if weight or rate changes
      if (name === "oldGoldWeight" || name === "oldGoldRate") {
        const wt = name === "oldGoldWeight" ? value : prev.oldGoldWeight;
        const rt = name === "oldGoldRate" ? value : prev.oldGoldRate;
        nextState.oldGoldAmount = Math.round((Number(wt) || 0) * (Number(rt) || 0) * 100) / 100;
      }
      
      return nextState;
    });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...invoiceData.items];
    newItems[index][field] = value;

    // Calculate amount dynamically
    const item = newItems[index];
    newItems[index].amount = calculateItemAmount(
      item.netWeight,
      item.wastagePct,
      item.rate,
      item.makingCharges
    );

    setInvoiceData((prev) => ({ ...prev, items: newItems }));
  };

  const handleAddItem = () => {
    setInvoiceData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          description: "Gold Ornament",
          hsnCode: "7113",
          netWeight: 0,
          wastagePct: 0,
          rate: liveGoldRate || 6500,
          makingCharges: 0,
          amount: 0,
        },
      ],
    }));
  };

  const handleRemoveItem = (index) => {
    if (invoiceData.items.length > 1) {
      const newItems = [...invoiceData.items];
      newItems.splice(index, 1);
      setInvoiceData((prev) => ({ ...prev, items: newItems }));
    }
  };

  const handleSelectCustomer = (c) => {
    setInvoiceData(prev => ({
      ...prev,
      customerId: c.id,
      consignee: `${c.title} ${c.name} ${c.surname}`
    }));
    setCustSearch(`${c.title} ${c.name} ${c.surname}`);
    setShowCustDropdown(false);
  };

  const handleSaveInvoice = async () => {
    if (!invoiceData.invoiceNo || !invoiceData.consignee || invoiceData.items.length === 0) {
      alert("Please enter invoice number, select a customer, and add at least one item.");
      return;
    }

    try {
      setSubmitting(true);
      const subTotal = calculateSubTotal();
      const cgstVal = calculateTax(subTotal, invoiceData.cgstRate);
      const sgstVal = calculateTax(subTotal, invoiceData.sgstRate);
      const grand = calculateGrandTotal();
      const finalAmt = calculateFinalAmount();

      const payload = {
        invoiceNo: invoiceData.invoiceNo,
        date: invoiceData.date,
        customerId: invoiceData.customerId,
        customerName: invoiceData.consignee,
        subtotal: subTotal,
        cgstRate: invoiceData.cgstRate,
        cgstAmount: cgstVal,
        sgstRate: invoiceData.sgstRate,
        sgstAmount: sgstVal,
        oldGoldWeight: parseFloat(invoiceData.oldGoldWeight) || 0,
        oldGoldAmount: parseFloat(invoiceData.oldGoldAmount) || 0,
        grandTotal: grand,
        finalAmount: finalAmt,
        items: invoiceData.items.map(item => ({
          description: item.description,
          hsnCode: item.hsnCode,
          netWeight: parseFloat(item.netWeight) || 0,
          wastagePct: parseFloat(item.wastagePct) || 0,
          makingCharges: parseFloat(item.makingCharges) || 0,
          ratePerGram: parseFloat(item.rate) || 0,
          amount: parseFloat(item.amount) || 0
        }))
      };

      const res = await window.electronAPI?.saveInvoice(payload);
      if (res?.id) {
        alert("Invoice saved to database successfully!");
        setShowPreview(true);
      }
    } catch (error) {
      console.error("Error saving invoice:", error);
      alert("Failed to save invoice. Invoice number might be duplicate.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById("invoice-preview");
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  const handleDeleteInvoice = async (id) => {
    if (!isAdmin) {
      alert("Admin Access Required. Please unlock Admin Mode from the top bar.");
      return;
    }

    if (window.confirm("Are you sure you want to delete this invoice permanently?")) {
      try {
        await window.electronAPI?.deleteInvoice(id);
        setInvoices(prev => prev.filter(inv => inv.id !== id));
      } catch (error) {
        console.error(error);
        alert("Failed to delete invoice.");
      }
    }
  };

  const handleLoadInvoiceDetails = async (id) => {
    try {
      const res = await window.electronAPI?.getInvoiceById(id);
      if (res) {
        // Map back to input model
        setInvoiceData({
          invoiceNo: res.invoiceNo,
          date: res.date,
          customerId: res.customerId,
          consignee: res.customerName,
          items: res.items.map(i => ({
            description: i.description,
            hsnCode: i.hsnCode,
            netWeight: i.netWeight,
            wastagePct: i.wastagePct,
            rate: i.ratePerGram,
            makingCharges: i.makingCharges,
            amount: i.amount
          })),
          cgstRate: res.cgstRate,
          sgstRate: res.sgstRate,
          oldGoldWeight: res.oldGoldWeight,
          oldGoldRate: res.oldGoldWeight > 0 ? (res.oldGoldAmount / res.oldGoldWeight) : 0,
          oldGoldAmount: res.oldGoldAmount
        });
        setShowPreview(true);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to load invoice details.");
    }
  };

  // Convert number to words for amount
  const convertToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const numString = num.toString();
    const decimalParts = numString.split('.');
    const rupees = parseInt(decimalParts[0]);
    const paise = decimalParts.length > 1 ? parseInt(decimalParts[1].substring(0, 2).padEnd(2, '0')) : 0;

    if (rupees === 0) return paise > 0 ? `Paise ${convertToWords(paise)} Only` : 'Zero Only';

    function convertNumberToWords(num) {
      if (num === 0) return '';
      if (num < 20) return ones[num];
      if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '');
      if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 !== 0 ? ' ' + convertNumberToWords(num % 100) : '');
      if (num < 100000) return convertNumberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 !== 0 ? ' ' + convertNumberToWords(num % 1000) : '');
      if (num < 10000000) return convertNumberToWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 !== 0 ? ' ' + convertNumberToWords(num % 100000) : '');
      return convertNumberToWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 !== 0 ? ' ' + convertNumberToWords(num % 10000000) : '');
    }

    let result = `Rupees ${convertNumberToWords(rupees)}`;
    if (paise > 0) {
      result += ` and Paise ${convertNumberToWords(paise)}`;
    }
    return result + ' Only';
  };

  const filteredHistory = invoices.filter(inv => {
    const q = historySearch.toLowerCase();
    return inv.invoiceNo.toLowerCase().includes(q) || inv.customerName.toLowerCase().includes(q);
  });

  const filteredCustomers = customers.filter(c => {
    const q = custSearch.toLowerCase();
    return `${c.name} ${c.surname} ${c.mobile}`.toLowerCase().includes(q);
  });

  const subTotal = calculateSubTotal();
  const cgstAmount = calculateTax(subTotal, invoiceData.cgstRate);
  const sgstAmount = calculateTax(subTotal, invoiceData.sgstRate);
  const grandTotal = calculateGrandTotal();
  const finalAmount = calculateFinalAmount();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
        <button
          onClick={() => handleTabChange("generator")}
          className={`btn-secondary ${activeTab === "generator" ? "active" : ""}`}
          style={{ background: activeTab === "generator" ? "rgba(251,191,36,0.12)" : "transparent", color: activeTab === "generator" ? "var(--gold-300)" : "" }}
        >
          🧾 Create Invoice
        </button>
        <button
          onClick={() => handleTabChange("history")}
          className={`btn-secondary ${activeTab === "history" ? "active" : ""}`}
          style={{ background: activeTab === "history" ? "rgba(251,191,36,0.12)" : "transparent", color: activeTab === "history" ? "var(--gold-300)" : "" }}
        >
          📂 Past Invoices Log
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
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>Tax Invoice Generator</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>GST TAX INVOICE — M.S. GOLD SMITH</div>
            </div>
            <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={generateInvoiceNumber}>
              ⟲ Regenerate Bill No
            </button>
          </div>

          {/* Form details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>
              <label className="form-label">Invoice Number</label>
              <input type="text" name="invoiceNo" value={invoiceData.invoiceNo}
                onChange={handleInputChange} className="form-input" required />
            </div>
            <div>
              <label className="form-label">Date</label>
              <input type="date" name="date" value={invoiceData.date}
                onChange={handleInputChange} className="form-input" required />
            </div>
          </div>

          <div style={{ marginBottom: 20, position: 'relative' }}>
            <label className="form-label">Select Customer (Autocomplete Search) *</label>
            <input
              type="text"
              className="form-input"
              value={custSearch}
              onFocus={() => setShowCustDropdown(true)}
              onChange={e => {
                setCustSearch(e.target.value);
                setShowCustDropdown(true);
                setInvoiceData(prev => ({ ...prev, consignee: e.target.value, customerId: null }));
              }}
              placeholder="Type customer name or mobile number..."
              required
            />
            {showCustDropdown && filteredCustomers.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                borderRadius: 8, overflow: 'hidden', maxHeight: 200, overflowY: 'auto',
                boxShadow: '0 8px 16px rgba(0,0,0,0.5)'
              }}>
                {filteredCustomers.map(c => (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCustomer(c)}
                    style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', hover: 'var(--bg-hover)' }}
                    className="cust-dropdown-item"
                  >
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{c.title} {c.name} {c.surname}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Mobile: {c.mobile} | City: {c.city}</div>
                  </div>
                ))}
              </div>
            )}
            {showCustDropdown && (
              <div style={{ position: 'fixed', inset: 0, zIndex: 5 }} onClick={() => setShowCustDropdown(false)} />
            )}
          </div>

          {/* Items Section */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <label className="form-label" style={{ margin: 0 }}>Invoice Items (Purity, Weight, Wastage, Charges)</label>
              <button onClick={handleAddItem} className="btn-primary" style={{ padding: '6px 14px', fontSize: 12 }}>
                + Add Item
              </button>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-elevated)' }}>
                    {['#', 'Ornaments Description', 'HSN', 'Net Wt (g)', 'Wastage %', 'Gross Wt', 'Rate/g', 'Making (₹)', 'Amount', ''].map(h => (
                      <th key={h} style={{
                        padding: '8px 10px', textAlign: 'left', fontSize: 9,
                        fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase',
                        color: 'var(--text-muted)', borderBottom: '1px solid var(--border-default)',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoiceData.items.map((item, index) => {
                    const gross = item.netWeight * (1 + item.wastagePct / 100);
                    return (
                      <tr key={index} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '8px 10px', fontSize: 12, color: 'var(--text-muted)' }}>{index + 1}</td>
                        <td style={{ padding: '4px 6px' }}>
                          <input type="text" value={item.description}
                            onChange={e => handleItemChange(index, 'description', e.target.value)}
                            className="form-input" style={{ padding: '6px 10px', fontSize: 12 }} />
                        </td>
                        <td style={{ padding: '4px 6px' }}>
                          <input type="text" value={item.hsnCode}
                            onChange={e => handleItemChange(index, 'hsnCode', e.target.value)}
                            className="form-input" style={{ padding: '6px 10px', fontSize: 12, width: 60 }} />
                        </td>
                        <td style={{ padding: '4px 6px' }}>
                          <input type="text" value={item.netWeight}
                            onChange={e => {
                              const val = e.target.value;
                              if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) {
                                handleItemChange(index, 'netWeight', val);
                              }
                            }}
                            className="form-input" style={{ padding: '6px 10px', fontSize: 12, width: 75 }} />
                        </td>
                        <td style={{ padding: '4px 6px' }}>
                          <input type="text" value={item.wastagePct}
                            onChange={e => {
                              const val = e.target.value;
                              if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) {
                                handleItemChange(index, 'wastagePct', val);
                              }
                            }}
                            className="form-input" style={{ padding: '6px 10px', fontSize: 12, width: 65 }} />
                        </td>
                        <td style={{ padding: '8px 10px', fontSize: 12, color: 'var(--text-secondary)' }}>
                          {gross.toFixed(3)}g
                        </td>
                        <td style={{ padding: '4px 6px' }}>
                          <input type="text" value={item.rate}
                            onChange={e => {
                              const val = e.target.value;
                              if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) {
                                handleItemChange(index, 'rate', val);
                              }
                            }}
                            className="form-input" style={{ padding: '6px 10px', fontSize: 12, width: 85 }} />
                        </td>
                        <td style={{ padding: '4px 6px' }}>
                          <input type="text" value={item.makingCharges}
                            onChange={e => {
                              const val = e.target.value;
                              if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) {
                                handleItemChange(index, 'makingCharges', val);
                              }
                            }}
                            className="form-input" style={{ padding: '6px 10px', fontSize: 12, width: 75 }} />
                        </td>
                        <td style={{ padding: '8px 10px', fontSize: 12, fontWeight: 700, color: 'var(--gold-300)' }}>
                          ₹{Number(item.amount).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '4px 6px' }}>
                          <button onClick={() => handleRemoveItem(index)}
                            disabled={invoiceData.items.length === 1}
                            className="btn-danger" style={{ padding: '5px 8px', fontSize: 11 }}>✕</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Trade-ins & Totals Panel Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            {/* Old Gold Buyback Card */}
            <div className="card" style={{ background: 'rgba(251,191,36,0.03)', border: '1px dashed var(--border-default)' }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--gold-300)', textTransform: 'uppercase', marginBottom: 12 }}>
                🔄 Old Gold Exchange / Purchase (Deductions)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label className="form-label">Old Gold Weight (g)</label>
                  <input
                    type="text"
                    name="oldGoldWeight"
                    value={invoiceData.oldGoldWeight}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Weight in grams"
                  />
                </div>
                <div>
                  <label className="form-label">Valuation Rate per Gram</label>
                  <input
                    type="text"
                    name="oldGoldRate"
                    value={invoiceData.oldGoldRate}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Rate in ₹"
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Old Gold Valuation:</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#f87171' }}>
                  - ₹{(Number(invoiceData.oldGoldAmount) || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Tax Rates & Invoice Totals */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="form-label">CGST Rate (%)</label>
                  <input type="number" name="cgstRate" value={invoiceData.cgstRate}
                    onChange={handleInputChange} className="form-input" step="0.01" />
                </div>
                <div>
                  <label className="form-label">SGST Rate (%)</label>
                  <input type="number" name="sgstRate" value={invoiceData.sgstRate}
                    onChange={handleInputChange} className="form-input" step="0.01" />
                </div>
              </div>

              <div style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: 14, border: '1px solid var(--border-subtle)' }}>
                <TotalRow label="Subtotal Purchase" value={`₹${subTotal.toLocaleString('en-IN')}`} />
                <TotalRow label={`CGST (${invoiceData.cgstRate}%)`} value={`₹${cgstAmount.toFixed(2)}`} />
                <TotalRow label={`SGST (${invoiceData.sgstRate}%)`} value={`₹${sgstAmount.toFixed(2)}`} />
                <TotalRow label="Grand Purchase Total" value={`₹${grandTotal.toLocaleString('en-IN')}`} />
                {invoiceData.oldGoldAmount > 0 && (
                  <TotalRow label="Old Gold Deduction" value={`- ₹${(Number(invoiceData.oldGoldAmount) || 0).toLocaleString('en-IN')}`} />
                )}
                <div style={{ height: 1, background: 'var(--border-default)', margin: '8px 0' }} />
                <TotalRow label="Final Payable" value={`₹${finalAmount.toLocaleString('en-IN')}`} highlight />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              onClick={handleSaveInvoice}
              className="btn-primary"
              style={{ fontSize: 13, padding: '10px 24px' }}
              disabled={submitting}
            >
              <Save size={16} /> {submitting ? "Saving Bill..." : "✓ Save Invoice & Print"}
            </button>
          </div>
        </div>
      ) : (
        /* PAST INVOICES HISTORY TAB */
        <div className="card" style={{ width: '100%' }}>
          <div className="section-header" style={{ marginBottom: 16 }}>
            <span className="section-title">Past Tax Invoices Directory</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{filteredHistory.length} total bills</span>
          </div>

          {/* Search History */}
          <div style={{ marginBottom: 16, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--text-muted)' }}>🔍</span>
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: 36 }}
              placeholder="Search past bills by Invoice No. or Customer Name..."
              value={historySearch}
              onChange={e => setHistorySearch(e.target.value)}
            />
          </div>

          {historyLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 50, gap: 10 }}>
              <div className="spinner" />
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading invoices from database…</span>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🧾</div>
              <div className="empty-state-text">No invoices found. Generate your first invoice to view log history.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Invoice No</th>
                    <th>Customer</th>
                    <th>Subtotal</th>
                    <th>Deduction (Old Gold)</th>
                    <th>Final Total</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map(inv => (
                    <tr key={inv.id}>
                      <td>{inv.date}</td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--gold-300)' }}>{inv.invoiceNo}</span>
                      </td>
                      <td>{inv.customerName}</td>
                      <td>₹{inv.subtotal.toLocaleString('en-IN')}</td>
                      <td>
                        {inv.oldGoldAmount > 0 ? (
                          <span style={{ color: '#f87171' }}>- ₹{inv.oldGoldAmount.toLocaleString('en-IN')}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td>
                        <strong style={{ color: '#4ade80' }}>₹{inv.finalAmount.toLocaleString('en-IN')}</strong>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn-secondary"
                            style={{ padding: '5px 10px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
                            onClick={() => handleLoadInvoiceDetails(inv.id)}
                          >
                            <Eye size={12} /> View/Print
                          </button>
                          {isAdmin && (
                            <button
                              className="btn-danger"
                              style={{ padding: '5px 10px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
                              onClick={() => handleDeleteInvoice(inv.id)}
                            >
                              <Trash size={12} /> Delete
                            </button>
                          )}
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
          <div className="modal-box" style={{ maxWidth: 840 }}>
            <div className="modal-header">
              <div className="modal-title">✦ GST Tax Invoice Preview</div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handlePrint} className="btn-primary" style={{ padding: '6px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Printer size={14} /> Print Bill
                </button>
                <button onClick={() => setShowPreview(false)} className="modal-close">✕</button>
              </div>
            </div>

            <div className="modal-body" style={{ background: '#fff', color: '#000', padding: 36, fontFamily: 'serif' }}>
              <div id="invoice-preview">
                {/* Print Invoice Header */}
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <h2 style={{ margin: '0 0 4px 0', fontSize: 24, letterSpacing: 0.5, fontWeight: 800 }}>M S GOLD SMITH</h2>
                  <p style={{ margin: '2px 0', fontSize: 12 }}>No.37C, Chettiyakudi South Street, Nadaga Salai,</p>
                  <p style={{ margin: '2px 0', fontSize: 12 }}>Srivilliputhur, Virudhunagar - 626 125.</p>
                  <p style={{ margin: '2px 0', fontSize: 12 }}><strong>GSTIN:</strong> 33BDVPR1363J1Z2 | <strong>Mobile:</strong> 94431 12034</p>
                  <h3 style={{ margin: '14px 0 6px 0', fontSize: 15, textDecoration: 'underline', fontWeight: 700 }}>TAX INVOICE</h3>
                  <span style={{ fontSize: 11, fontStyle: 'italic' }}>Original for Recipient</span>
                </div>

                {/* Consignee & Details Grid */}
                <div style={{ display: 'flex', justifyContent: 'space-between', border: '1px solid #000', padding: 12, marginBottom: 20, fontSize: 12 }}>
                  <div>
                    <strong>Consignee Details:</strong>
                    <div style={{ marginTop: 4, fontWeight: 700 }}>{invoiceData.consignee}</div>
                    {invoiceData.customerId && (
                      <div style={{ fontSize: 11, color: '#444' }}>Customer ID: #{invoiceData.customerId}</div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div><strong>Invoice No:</strong> {invoiceData.invoiceNo}</div>
                    <div><strong>Date:</strong> {new Date(invoiceData.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                  </div>
                </div>

                {/* Items Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20, fontSize: 12, border: '1px solid #000' }}>
                  <thead>
                    <tr style={{ background: '#f5f5f5', borderBottom: '1px solid #000' }}>
                      <th style={{ border: '1px solid #000', padding: 6, width: 30 }}>S.N</th>
                      <th style={{ border: '1px solid #000', padding: 6, textAlign: 'left' }}>Description of Ornaments</th>
                      <th style={{ border: '1px solid #000', padding: 6, width: 60 }}>HSN</th>
                      <th style={{ border: '1px solid #000', padding: 6, textAlign: 'right', width: 70 }}>Net Wt (g)</th>
                      <th style={{ border: '1px solid #000', padding: 6, textAlign: 'right', width: 60 }}>Wastage %</th>
                      <th style={{ border: '1px solid #000', padding: 6, textAlign: 'right', width: 70 }}>Gross Wt</th>
                      <th style={{ border: '1px solid #000', padding: 6, textAlign: 'right', width: 70 }}>Rate/g</th>
                      <th style={{ border: '1px solid #000', padding: 6, textAlign: 'right', width: 70 }}>Making (₹)</th>
                      <th style={{ border: '1px solid #000', padding: 6, textAlign: 'right', width: 90 }}>Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceData.items.map((item, index) => {
                      const gross = item.netWeight * (1 + item.wastagePct / 100);
                      return (
                        <tr key={index}>
                          <td style={{ border: '1px solid #000', padding: 6, textAlign: 'center' }}>{index + 1}</td>
                          <td style={{ border: '1px solid #000', padding: 6 }}>{item.description}</td>
                          <td style={{ border: '1px solid #000', padding: 6, textAlign: 'center' }}>{item.hsnCode}</td>
                          <td style={{ border: '1px solid #000', padding: 6, textAlign: 'right' }}>{Number(item.netWeight).toFixed(3)}g</td>
                          <td style={{ border: '1px solid #000', padding: 6, textAlign: 'right' }}>{item.wastagePct}%</td>
                          <td style={{ border: '1px solid #000', padding: 6, textAlign: 'right' }}>{gross.toFixed(3)}g</td>
                          <td style={{ border: '1px solid #000', padding: 6, textAlign: 'right' }}>₹{Number(item.rate).toLocaleString('en-IN')}</td>
                          <td style={{ border: '1px solid #000', padding: 6, textAlign: 'right' }}>₹{Number(item.makingCharges).toLocaleString('en-IN')}</td>
                          <td style={{ border: '1px solid #000', padding: 6, textAlign: 'right' }}>₹{Number(item.amount).toLocaleString('en-IN')}</td>
                        </tr>
                      );
                    })}
                    <tr style={{ fontWeight: 'bold' }}>
                      <td colSpan="3" style={{ border: '1px solid #000', padding: 6, textAlign: 'right' }}>Total Weight &amp; Subtotal:</td>
                      <td style={{ border: '1px solid #000', padding: 6, textAlign: 'right' }}>
                        {invoiceData.items.reduce((sum, i) => sum + (Number(i.netWeight) || 0), 0).toFixed(3)}g
                      </td>
                      <td style={{ border: '1px solid #000' }}></td>
                      <td style={{ border: '1px solid #000', padding: 6, textAlign: 'right' }}>
                        {invoiceData.items.reduce((sum, i) => sum + (Number(i.netWeight) * (1 + (Number(i.wastagePct) || 0) / 100)), 0).toFixed(3)}g
                      </td>
                      <td colSpan="2" style={{ border: '1px solid #000' }}></td>
                      <td style={{ border: '1px solid #000', padding: 6, textAlign: 'right' }}>₹{subTotal.toLocaleString('en-IN')}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Taxes & Deductions Calculations Block */}
                <div style={{ display: 'flex', gap: 14, marginBottom: 20, fontSize: 12 }}>
                  {/* Words */}
                  <div style={{ flex: 1, border: '1px solid #000', padding: 10 }}>
                    <strong>Amount Chargeable in Words:</strong>
                    <div style={{ marginTop: 6, fontStyle: 'italic', fontWeight: 600 }}>{convertToWords(finalAmount)}</div>
                  </div>
                  
                  {/* Tax summary table */}
                  <div style={{ width: 320 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: 11 }}>
                      <tbody>
                        <tr>
                          <td style={{ border: '1px solid #000', padding: 4 }}>Subtotal Taxable</td>
                          <td style={{ border: '1px solid #000', padding: 4, textAlign: 'right' }}>₹{subTotal.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid #000', padding: 4 }}>CGST ({invoiceData.cgstRate}%)</td>
                          <td style={{ border: '1px solid #000', padding: 4, textAlign: 'right' }}>₹{cgstAmount.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid #000', padding: 4 }}>SGST ({invoiceData.sgstRate}%)</td>
                          <td style={{ border: '1px solid #000', padding: 4, textAlign: 'right' }}>₹{sgstAmount.toFixed(2)}</td>
                        </tr>
                        <tr style={{ fontWeight: 'bold', background: '#f5f5f5' }}>
                          <td style={{ border: '1px solid #000', padding: 4 }}>Grand Total</td>
                          <td style={{ border: '1px solid #000', padding: 4, textAlign: 'right' }}>₹{grandTotal.toFixed(2)}</td>
                        </tr>
                        {invoiceData.oldGoldAmount > 0 && (
                          <>
                            <tr>
                              <td style={{ border: '1px solid #000', padding: 4, color: '#c00' }}>Old Gold Exchange (Deduction)</td>
                              <td style={{ border: '1px solid #000', padding: 4, textAlign: 'right', color: '#c00' }}>
                                - ₹{Number(invoiceData.oldGoldAmount).toFixed(2)}
                              </td>
                            </tr>
                            <tr style={{ fontWeight: 'bold', background: '#e8f5e9', fontSize: 12 }}>
                              <td style={{ border: '1px solid #000', padding: 4 }}>Final Payable Amount</td>
                              <td style={{ border: '1px solid #000', padding: 4, textAlign: 'right' }}>₹{finalAmount.toLocaleString('en-IN')}</td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Declarations & Signature */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 36, fontSize: 12 }}>
                  <div style={{ width: '60%' }}>
                    <p style={{ margin: 0 }}><strong>Declaration:</strong></p>
                    <p style={{ margin: '4px 0 0 0', fontSize: 10, lineHeight: 1.4 }}>
                      We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', width: '30%' }}>
                    <p style={{ margin: 0 }}>For <strong>M S GOLD SMITH</strong></p>
                    <p style={{ marginTop: 40, borderTop: '1px solid #000', display: 'inline-block', width: 140, paddingTop: 4 }}>Authorised Signatory</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function TotalRow({ label, value, highlight }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '4px 0',
    }}>
      <span style={{ fontSize: 12, color: highlight ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: highlight ? 700 : 500 }}>{label}</span>
      <span style={{ fontSize: highlight ? 14 : 12, fontWeight: 700, color: highlight ? 'var(--gold-300)' : 'var(--text-secondary)' }}>{value}</span>
    </div>
  );
}

export default Invoice;