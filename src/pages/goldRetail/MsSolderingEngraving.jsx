import { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Printer, Save, Trash, Eye, Sparkles } from 'lucide-react';
import { supabaseAPI } from '../../db/supabaseAPI';

const incrementInvoiceNo = (invNo) => {
  if (!invNo) return 'INV-1001';
  const match = String(invNo).match(/^(.*?)(\d+)$/);
  if (!match) return String(invNo) + "-1";
  const prefix = match[1];
  const numberStr = match[2];
  const nextNumber = parseInt(numberStr, 10) + 1;
  const paddedNumber = String(nextNumber).padStart(numberStr.length, '0');
  return prefix + paddedNumber;
};

const getNextInvoiceSequence = (settingNo, existingInvoices = [], existingSolderingJobs = []) => {
  const defaultBase = settingNo || 'INV-1001';
  let highestNum = -1;
  let highestStr = defaultBase;

  const checkItem = (invNumStr) => {
    if (invNumStr) {
      const match = String(invNumStr).match(/^(.*?)(\d+)$/);
      if (match) {
        const num = parseInt(match[2], 10);
        if (num > highestNum) {
          highestNum = num;
          highestStr = String(invNumStr);
        }
      }
    }
  };

  (Array.isArray(existingInvoices) ? existingInvoices : []).forEach(inv => {
    if (inv) checkItem(inv.invoiceNumber || inv.invoiceNo || inv.invoice_no);
  });
  (Array.isArray(existingSolderingJobs) ? existingSolderingJobs : []).forEach(job => {
    if (job) checkItem(job.invoiceNumber || job.invoiceNo || job.invoice_number || job.receiptNo);
  });

  if (highestNum === -1) return defaultBase;

  const nextFromDb = incrementInvoiceNo(highestStr);
  const matchSetting = String(defaultBase).match(/^(.*?)(\d+)$/);
  if (matchSetting) {
    const settingNum = parseInt(matchSetting[2], 10);
    if (settingNum > highestNum + 1) {
      return defaultBase;
    }
  }

  return nextFromDb;
};

const convertToWords = (num) => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const numString = (num || 0).toString();
  const decimalParts = numString.split('.');
  const rupees = parseInt(decimalParts[0]) || 0;
  const paise = decimalParts.length > 1 ? parseInt(decimalParts[1].substring(0, 2).padEnd(2, '0')) : 0;

  if (rupees === 0) return paise > 0 ? `Paise ${convertToWords(paise)} Only` : 'Zero Only';

  function convertNumberToWords(n) {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertNumberToWords(n % 100) : '');
    if (n < 100000) return convertNumberToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convertNumberToWords(n % 1000) : '');
    if (n < 10000000) return convertNumberToWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + convertNumberToWords(n % 100000) : '');
    return convertNumberToWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + convertNumberToWords(n % 10000000) : '');
  }

  let result = `Rupees ${convertNumberToWords(rupees)}`;
  if (paise > 0) {
    result += ` and Paise ${convertNumberToWords(paise)}`;
  }
  return result + ' Only';
};

export default function MsSolderingEngraving() {
  const outletContext = useOutletContext();
  const isAdmin = true;

  const [activeTab, setActiveTab] = useState("generator"); // "generator" or "history"
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [previewJob, setPreviewJob] = useState(null);
  const [paperSize, setPaperSize] = useState('A4');

  // Form states
  const [formData, setFormData] = useState({
    invoiceNo: "",
    date: new Date().toISOString().split("T")[0],
    customerName: "",
    product: "",
    markingCharges: ""
  });

  // Calculate GST and Total
  const chargesVal = parseFloat(formData.markingCharges) || 0;
  const gstVal = Math.round((chargesVal * 0.05) * 100) / 100;
  const totalVal = Math.round((chargesVal + gstVal) * 100) / 100;

  useEffect(() => {
    loadJobsAndSequence();
  }, [activeTab]);

  const loadJobsAndSequence = async () => {
    try {
      setLoading(true);
      const api = supabaseAPI;
      const [settingsRes, invRes, soldRes] = await Promise.all([
        api?.getOrganizationSettings ? api.getOrganizationSettings() : Promise.resolve(null),
        api?.getAllInvoices ? api.getAllInvoices() : Promise.resolve([]),
        api?.getAllSolderingJobs ? api.getAllSolderingJobs() : Promise.resolve([])
      ]);

      const validInvoices = Array.isArray(invRes) ? invRes : [];
      const validJobs = Array.isArray(soldRes) ? soldRes : [];
      setInvoices(validInvoices);
      setJobs(validJobs);

      const settingNo = settingsRes?.next_invoice_number || 'INV-1001';
      const nextSeqNo = getNextInvoiceSequence(
        settingNo, 
        validInvoices, 
        validJobs
      );
      setFormData(prev => ({
        ...prev,
        invoiceNo: nextSeqNo
      }));
    } catch (err) {
      console.error("Error loading soldering jobs & sequence:", err);
    } finally {
      setLoading(false);
    }
  };

  // Unified Invoice Number Resolver to align Soldering jobs with Retail Invoices
  const resolvedJobInvoiceNos = useMemo(() => {
    const map = {};
    try {
      const combinedRaw = [];

      (Array.isArray(invoices) ? invoices : []).forEach(inv => {
        if (!inv) return;
        const rawDate = inv.createdAt || inv.created_at || inv.date || '';
        const t = new Date(rawDate).getTime();
        combinedRaw.push({
          id: inv.id,
          rawNo: inv.invoiceNo || inv.invoiceNumber || null,
          time: isNaN(t) ? 0 : t
        });
      });

      (Array.isArray(jobs) ? jobs : []).forEach(job => {
        if (!job) return;
        const rawDate = job.createdAt || job.created_at || job.date || '';
        const t = new Date(rawDate).getTime();
        combinedRaw.push({
          id: job.id,
          rawNo: job.invoiceNo || job.invoiceNumber || job.receiptNo || null,
          time: isNaN(t) ? 0 : t,
          isSoldering: true
        });
      });

      combinedRaw.sort((a, b) => (a.time || 0) - (b.time || 0));

      const usedInvoiceNos = new Set();
      let currentSeqNum = 1001;

      combinedRaw.forEach(item => {
        let finalNo = item.rawNo != null ? String(item.rawNo).trim() : '';
        if (!finalNo || finalNo.startsWith('#') || finalNo.length > 20 || usedInvoiceNos.has(finalNo)) {
          while (usedInvoiceNos.has(`INV-${currentSeqNum}`)) {
            currentSeqNum++;
          }
          finalNo = `INV-${currentSeqNum}`;
          currentSeqNum++;
        } else {
          const match = finalNo.match(/(\d+)/);
          if (match) {
            const n = parseInt(match[1], 10);
            if (n >= currentSeqNum) currentSeqNum = n + 1;
          }
        }
        usedInvoiceNos.add(finalNo);
        if (item.id) {
          map[item.id] = finalNo;
        }
      });
    } catch (err) {
      console.error("Error resolving job invoice numbers:", err);
    }
    return map;
  }, [invoices, jobs]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "markingCharges") {
      if (value === "" || /^[0-9]*\.?[0-9]*$/.test(value)) {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.customerName || !formData.product || !formData.markingCharges) {
      alert("Please fill all the required fields");
      return;
    }

    try {
      setSubmitting(true);
      const invoiceNo = formData.invoiceNo || 'INV-1001';

      const payload = {
        invoiceNo: invoiceNo,
        invoiceNumber: invoiceNo,
        date: formData.date,
        customerName: formData.customerName.trim(),
        product: formData.product.trim(),
        markingCharges: chargesVal,
        gstAmount: gstVal,
        totalAmount: totalVal
      };

      const api = supabaseAPI;
      const result = api?.saveSolderingJob ? await api.saveSolderingJob(payload) : null;
      if (result?.id) {
        const savedInvoiceNo = result.invoiceNo || invoiceNo;
        const nextNo = incrementInvoiceNo(savedInvoiceNo);
        if (api?.updateOrganizationSettings) {
          await api.updateOrganizationSettings(nextNo);
        }

        alert(`Soldering & Engraving Invoice (${savedInvoiceNo}) saved successfully!`);

        setPreviewJob({
          receiptNo: savedInvoiceNo,
          invoiceNo: savedInvoiceNo,
          ...payload
        });

        const [freshInvoices, freshJobs] = await Promise.all([
          api?.getAllInvoices ? api.getAllInvoices() : Promise.resolve([]),
          api?.getAllSolderingJobs ? api.getAllSolderingJobs() : Promise.resolve([])
        ]);

        const validInvoices = Array.isArray(freshInvoices) ? freshInvoices : [];
        const validJobs = Array.isArray(freshJobs) ? freshJobs : jobs;

        setInvoices(validInvoices);
        setJobs(validJobs);

        const nextSeqNo = getNextInvoiceSequence(nextNo, validInvoices, validJobs);

        setFormData({
          invoiceNo: nextSeqNo,
          date: new Date().toISOString().split("T")[0],
          customerName: "",
          product: "",
          markingCharges: ""
        });

        setShowPreview(true);
      }
    } catch (error) {
      console.error("Error saving job:", error);
      alert(`Failed to save soldering job: ${error?.message || "Please try again."}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this job record permanently?")) {
      try {
        const api = supabaseAPI;
        if (api?.deleteSolderingJob) {
          await api.deleteSolderingJob(id);
        }
        setJobs(prev => (Array.isArray(prev) ? prev.filter(job => job.id !== id) : []));
      } catch (err) {
        console.error("Error deleting job:", err);
        alert("Failed to delete record.");
      }
    }
  };

  const handleViewReceipt = (job) => {
    if (!job) return;
    const resolvedNo = (resolvedJobInvoiceNos && job.id) ? resolvedJobInvoiceNos[job.id] : null;
    const invNo = resolvedNo || job.invoiceNo || job.invoiceNumber || 'INV-1001';
    const marking = parseFloat(job.markingCharges ?? job.marking_charges ?? job.charge ?? job.amount ?? 0);
    const gst = parseFloat(job.gstAmount ?? job.gst_amount ?? (marking * 0.05) ?? 0);
    const total = parseFloat(job.totalAmount ?? job.total_amount ?? (marking + gst) ?? 0);
    setPreviewJob({
      receiptNo: invNo,
      invoiceNo: invNo,
      date: job.date || new Date().toISOString().split("T")[0],
      customerName: job.customerName || job.customer_name || '',
      product: job.product || job.ornament || '',
      markingCharges: marking,
      gstAmount: gst,
      totalAmount: total
    });
    setShowPreview(true);
  };

  const filteredJobs = (Array.isArray(jobs) ? jobs : []).filter(job => {
    if (!job) return false;
    const query = (searchQuery || '').toLowerCase().trim();
    const cName = String(job.customerName || job.customer_name || '').toLowerCase();
    const prod = String(job.product || job.ornament || '').toLowerCase();
    const resolvedNo = (resolvedJobInvoiceNos && job.id) ? resolvedJobInvoiceNos[job.id] : null;
    const invNo = String(resolvedNo || job.invoiceNo || job.invoiceNumber || '').toLowerCase();
    return cName.includes(query) || prod.includes(query) || invNo.includes(query);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── TABS NAV ────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
        <button
          onClick={() => setActiveTab("generator")}
          className={`btn-secondary ${activeTab === "generator" ? "active" : ""}`}
          style={{
            background: activeTab === "generator" ? "rgba(251,191,36,0.12)" : "transparent",
            color: activeTab === "generator" ? "var(--gold-300)" : ""
          }}
        >
          ⚙️ New Job Entry
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`btn-secondary ${activeTab === "history" ? "active" : ""}`}
          style={{
            background: activeTab === "history" ? "rgba(251,191,36,0.12)" : "transparent",
            color: activeTab === "history" ? "var(--gold-300)" : ""
          }}
        >
          📂 Past Jobs Log
        </button>
      </div>

      {/* ── NEW ORDER GENERATOR TAB ───────────────────────── */}
      {activeTab === "generator" && (
        <div className="card" style={{ maxWidth: 640, margin: '0 auto', width: '100%' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{
              width: 38, height: 38, background: 'linear-gradient(135deg, #fbbf24, #d97706)',
              borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
            }}>🔥</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>Soldering & Engraving Order</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>M.S. SOLDERING & ENGRAVING WORKSTATION</div>
            </div>
          </div>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div>
                <label className="form-label">Invoice No *</label>
                <input
                  type="text"
                  name="invoiceNo"
                  value={formData.invoiceNo || ''}
                  onChange={handleInputChange}
                  className="form-input"
                  style={{ fontWeight: 700, color: 'var(--gold-300)' }}
                  required
                />
              </div>
              <div>
                <label className="form-label">Job Date *</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="form-label">Customer Name *</label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Customer name..."
                  required
                />
              </div>
            </div>

            <div>
              <label className="form-label">Product / Job Description *</label>
              <input
                type="text"
                name="product"
                value={formData.product}
                onChange={handleInputChange}
                className="form-input"
                placeholder="e.g. Gold Ring Soldering, Name Plate Engraving..."
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr', gap: 16, alignItems: 'flex-end' }}>
              <div>
                <label className="form-label">Marking Charges (₹) *</label>
                <input
                  type="text"
                  name="markingCharges"
                  value={formData.markingCharges}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="e.g. 500"
                  required
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, height: '100%', justifyContent: 'center' }}>
                <span className="form-label" style={{ margin: 0 }}>GST Rate</span>
                <div style={{
                  padding: '9px 12px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  textAlign: 'center'
                }}>5%</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, height: '100%', justifyContent: 'center' }}>
                <span className="form-label" style={{ margin: 0 }}>GST Amount</span>
                <div style={{
                  padding: '9px 12px',
                  background: 'rgba(251,191,36,0.04)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--gold-300)',
                  textAlign: 'right'
                }}>₹{gstVal.toFixed(2)}</div>
              </div>
            </div>

            <div style={{
              marginTop: 10,
              padding: '16px 20px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 12,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Total Net Charges</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Includes marking charges + 5% GST</div>
              </div>
              <div style={{
                fontSize: 22,
                fontWeight: 800,
                color: '#4ade80',
                textShadow: '0 0 10px rgba(74, 222, 128, 0.2)'
              }}>₹{totalVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <button
                type="submit"
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px' }}
                disabled={submitting}
              >
                <Save size={16} />
                {submitting ? "Saving record..." : "✓ Save & Print Receipt"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── TAB 2: HISTORY LIST ─────────────────────────────────── */}
      {activeTab === "history" && (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--gold-300)', margin: 0 }}>
              Soldering &amp; Repair Job Records
            </h2>
            <input
              type="text"
              className="form-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Search customer or product..."
              style={{ maxWidth: 280, padding: '6px 12px', fontSize: 12 }}
            />
          </div>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 50, gap: 10 }}>
              <div className="spinner" />
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading database records…</span>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔥</div>
              <div className="empty-state-text">No job logs found. Create your first job entry to populate the database.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice No</th>
                    <th>Date</th>
                    <th>Customer Name</th>
                    <th>Product / Job</th>
                    <th>Charges (₹)</th>
                    <th>GST (5%)</th>
                    <th>Total (₹)</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.map((job, idx) => {
                    const marking = parseFloat(job.markingCharges ?? job.marking_charges ?? job.charge ?? job.amount ?? 0);
                    const gst = parseFloat(job.gstAmount ?? job.gst_amount ?? (marking * 0.05) ?? 0);
                    const total = parseFloat(job.totalAmount ?? job.total_amount ?? (marking + gst) ?? 0);
                    
                    const invNo = job.invoiceNo || job.invoiceNumber || resolvedJobInvoiceNos[job.id] || '—';
                    return (
                      <tr key={job.id}>
                        <td style={{ fontWeight: 700, color: 'var(--gold-200)' }}>{invNo}</td>
                        <td>{job.date}</td>
                        <td><strong>{job.customerName || job.customer_name || '—'}</strong></td>
                        <td>{job.product || job.ornament || '—'}</td>
                        <td>₹{marking.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td>₹{gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td>
                          <strong style={{ color: '#4ade80' }}>
                            ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </strong>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              className="btn-secondary"
                              style={{ padding: '5px 10px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
                              onClick={() => handleViewReceipt({ ...job, invoiceNo: invNo, receiptNo: invNo })}
                            >
                              <Eye size={12} /> View/Print
                            </button>
                            {isAdmin && (
                              <button
                                className="btn-danger"
                                style={{ padding: '5px 10px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
                                onClick={() => handleDelete(job.id)}
                              >
                                <Trash size={12} /> Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── INVOICE / RECEIPT PRINT PREVIEW MODAL ────────── */}
      {showPreview && previewJob && (
        <div className="modal-overlay" style={{ zIndex: 11000 }}>
          <div className="modal-box" style={{ maxWidth: paperSize === 'A4' ? 880 : 380, padding: 0 }}>
            {/* Modal header */}
            <div className="modal-header" style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="modal-title" style={{ fontSize: 14, fontWeight: 700 }}>✦ Soldering Invoice Preview</div>
                {/* Paper size switcher */}
                <div style={{ display: 'flex', background: 'var(--bg-default)', padding: 3, borderRadius: 6, border: '1px solid var(--border-default)' }}>
                  <button
                    onClick={() => setPaperSize('A4')}
                    style={{
                      padding: '3px 10px', fontSize: 11, fontWeight: 700, border: 'none', borderRadius: 4,
                      background: paperSize === 'A4' ? 'var(--gold-300)' : 'transparent',
                      color: paperSize === 'A4' ? '#1e1b18' : 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    📄 A4 Tax Invoice
                  </button>
                  <button
                    onClick={() => setPaperSize('3-inch')}
                    style={{
                      padding: '3px 10px', fontSize: 11, fontWeight: 700, border: 'none', borderRadius: 4,
                      background: paperSize === '3-inch' ? 'var(--gold-300)' : 'transparent',
                      color: paperSize === '3-inch' ? '#1e1b18' : 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    🧾 3-Inch Slip
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handlePrint}
                  className="btn-primary"
                  style={{ padding: '6px 14px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Printer size={13} /> Print ({paperSize})
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: 11 }}
                >Close</button>
              </div>
            </div>

            {/* Modal Body / Paper Container */}
            <div style={{
              background: '#525659',
              padding: '24px 20px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}>
              {paperSize === 'A4' ? (
                /* A4 Tax Invoice Format */
                <div style={{
                  background: '#ffffff',
                  color: '#0f172a',
                  width: '100%',
                  maxWidth: '750px',
                  padding: '32px 36px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                  borderRadius: 4,
                  fontFamily: 'sans-serif',
                  fontSize: '12px',
                  lineHeight: '1.4'
                }}>
                  {/* Header */}
                  <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <h2 style={{ margin: '0 0 4px 0', fontSize: 24, letterSpacing: 0.5, fontWeight: 800, color: '#0f172a' }}>M S GOLD SMITH</h2>
                    <p style={{ margin: '2px 0', fontSize: 12, color: '#334155' }}>No.37C, Chettiyakudi South Street, Nadaga Salai,</p>
                    <p style={{ margin: '2px 0', fontSize: 12, color: '#334155' }}>Srivilliputhur, Virudhunagar - 626 125.</p>
                    <p style={{ margin: '2px 0', fontSize: 12, color: '#334155' }}><strong>GSTIN:</strong> 33BDVPR1363J1Z2 | <strong>Mobile:</strong> 94431 12034</p>
                    <h3 style={{ margin: '14px 0 4px 0', fontSize: 15, textDecoration: 'underline', fontWeight: 700, color: '#0f172a' }}>TAX INVOICE</h3>
                    <span style={{ fontSize: 11, fontStyle: 'italic', color: '#64748b' }}>Original for Recipient</span>
                  </div>

                  {/* Consignee & Details Box */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', border: '1px solid #b45309', padding: 12, marginBottom: 20, fontSize: 12, background: '#fffdf5' }}>
                    <div>
                      <strong>Consignee Details:</strong>
                      <div style={{ marginTop: 4, fontWeight: 700, fontSize: 13 }}>{previewJob.customerName || 'Walk-in Customer'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div><strong>Invoice No:</strong> <span style={{ fontWeight: 700, color: '#b45309' }}>{previewJob.invoiceNo || previewJob.receiptNo}</span></div>
                      <div><strong>Date:</strong> {previewJob.date}</div>
                      <div><strong>Service Type:</strong> Soldering &amp; Engraving</div>
                    </div>
                  </div>

                  {/* Items Table */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20, fontSize: 12, border: '1px solid #b45309' }}>
                    <thead>
                      <tr style={{ background: '#fef3c7', borderBottom: '1px solid #b45309' }}>
                        <th style={{ border: '1px solid #b45309', padding: 8, width: 35, textAlign: 'center' }}>S.N</th>
                        <th style={{ border: '1px solid #b45309', padding: 8, textAlign: 'left' }}>Description of Work / Ornaments</th>
                        <th style={{ border: '1px solid #b45309', padding: 8, width: 80, textAlign: 'center' }}>HSN</th>
                        <th style={{ border: '1px solid #b45309', padding: 8, textAlign: 'right', width: 110 }}>Marking Charge (₹)</th>
                        <th style={{ border: '1px solid #b45309', padding: 8, textAlign: 'right', width: 90 }}>CGST (2.5%)</th>
                        <th style={{ border: '1px solid #b45309', padding: 8, textAlign: 'right', width: 90 }}>SGST (2.5%)</th>
                        <th style={{ border: '1px solid #b45309', padding: 8, textAlign: 'right', width: 110 }}>Total Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const marking = Number(previewJob.markingCharges) || 0;
                        const gst = Number(previewJob.gstAmount) || (marking * 0.05);
                        const cgst = gst / 2;
                        const sgst = gst / 2;
                        const total = Number(previewJob.totalAmount) || (marking + gst);

                        return (
                          <>
                            <tr>
                              <td style={{ border: '1px solid #b45309', padding: 8, textAlign: 'center' }}>1</td>
                              <td style={{ border: '1px solid #b45309', padding: 8, fontWeight: 600 }}>{previewJob.product || 'Soldering & Engraving Work'}</td>
                              <td style={{ border: '1px solid #b45309', padding: 8, textAlign: 'center', fontFamily: 'monospace' }}>7113</td>
                              <td style={{ border: '1px solid #b45309', padding: 8, textAlign: 'right' }}>₹{marking.toFixed(2)}</td>
                              <td style={{ border: '1px solid #b45309', padding: 8, textAlign: 'right' }}>₹{cgst.toFixed(2)}</td>
                              <td style={{ border: '1px solid #b45309', padding: 8, textAlign: 'right' }}>₹{sgst.toFixed(2)}</td>
                              <td style={{ border: '1px solid #b45309', padding: 8, textAlign: 'right', fontWeight: 700 }}>₹{total.toFixed(2)}</td>
                            </tr>
                            <tr style={{ fontWeight: 'bold', background: '#fffdf5' }}>
                              <td colSpan="3" style={{ border: '1px solid #b45309', padding: 8, textAlign: 'right' }}>Subtotal &amp; Taxes:</td>
                              <td style={{ border: '1px solid #b45309', padding: 8, textAlign: 'right' }}>₹{marking.toFixed(2)}</td>
                              <td style={{ border: '1px solid #b45309', padding: 8, textAlign: 'right' }}>₹{cgst.toFixed(2)}</td>
                              <td style={{ border: '1px solid #b45309', padding: 8, textAlign: 'right' }}>₹{sgst.toFixed(2)}</td>
                              <td style={{ border: '1px solid #b45309', padding: 8, textAlign: 'right', color: '#b45309', fontSize: 13 }}>₹{total.toFixed(2)}</td>
                            </tr>
                          </>
                        );
                      })()}
                    </tbody>
                  </table>

                  {/* Words & Summary */}
                  <div style={{ display: 'flex', gap: 14, marginBottom: 24, fontSize: 12 }}>
                    <div style={{ flex: 1, border: '1px solid #b45309', padding: 12, background: '#fffdf5' }}>
                      <strong>Amount Chargeable in Words:</strong>
                      <div style={{ marginTop: 6, fontStyle: 'italic', fontWeight: 700, color: '#0f172a' }}>
                        {convertToWords(Number(previewJob.totalAmount) || 0)}
                      </div>
                    </div>
                  </div>

                  {/* Declarations & Signature */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 36, fontSize: 12 }}>
                    <div style={{ width: '60%' }}>
                      <p style={{ margin: 0 }}><strong>Declaration:</strong></p>
                      <p style={{ margin: '4px 0 0 0', fontSize: 10, lineHeight: 1.4, color: '#475569' }}>
                        We declare that this invoice shows the actual price of the services described and that all particulars are true and correct.
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', width: '35%' }}>
                      <p style={{ margin: 0 }}>For <strong>M S GOLD SMITH</strong></p>
                      <p style={{ marginTop: 45, borderTop: '1px solid #b45309', display: 'inline-block', width: 150, paddingTop: 4, fontWeight: 700 }}>Authorised Signatory</p>
                    </div>
                  </div>
                </div>
              ) : (
                /* 3-Inch Thermal Slip */
                <div style={{
                  background: '#fffdf5',
                  color: '#0f172a',
                  width: '100%',
                  maxWidth: '280px',
                  padding: '14px 14px 8px',
                  boxShadow: '0 4px 20px rgba(217, 119, 6, 0.15)',
                  border: '1px solid var(--border-default)',
                  fontFamily: 'Courier New, Courier, monospace',
                  fontSize: '12px',
                  lineHeight: '1.3'
                }}>
                  <div style={{ textAlign: 'center', marginBottom: 12 }}>
                    <h2 style={{ margin: '0 0 3px 0', fontSize: 15, fontWeight: 'bold', letterSpacing: '0.5px' }}>M S GOLD SMITH</h2>
                    <p style={{ margin: '2px 0', fontSize: 10 }}>No.37C, Chettiyakudi South Street, Nadaga Salai,</p>
                    <p style={{ margin: '2px 0', fontSize: 10 }}>Srivilliputhur, Virudhunagar - 626 125.</p>
                    <p style={{ margin: '2px 0', fontSize: 10 }}><strong>GSTIN:</strong> 33BDVPR1363J1Z2</p>
                    <p style={{ margin: '2px 0', fontSize: 10 }}><strong>Mobile:</strong> 94431 12034</p>
                    <div style={{ margin: '8px 0 6px 0', borderBottom: '1px dashed #b45309' }} />
                    <h3 style={{ margin: '0', fontSize: 12, fontWeight: 'bold', letterSpacing: '1px' }}>SOLDERING &amp; ENGRAVING</h3>
                  </div>

                  <div style={{ fontSize: 10, display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 10 }}>
                    <div><strong>Invoice No:</strong> {previewJob.invoiceNo || previewJob.receiptNo}</div>
                    <div><strong>Date:</strong> {previewJob.date}</div>
                    <div><strong>Customer:</strong> {previewJob.customerName}</div>
                  </div>

                  <div style={{ borderBottom: '1px dashed #b45309', marginBottom: 8 }} />

                  <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse', marginBottom: 8 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px dashed #b45309' }}>
                        <th style={{ textAlign: 'left', paddingBottom: 4 }}>Description</th>
                        <th style={{ textAlign: 'right', paddingBottom: 4 }}>Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ paddingTop: 6, paddingBottom: 4, verticalAlign: 'top' }}>
                          {previewJob.product} (HSN 7113)
                        </td>
                        <td style={{ paddingTop: 6, paddingBottom: 4, textAlign: 'right', verticalAlign: 'top' }}>
                          {(Number(previewJob.markingCharges) || 0).toFixed(2)}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ paddingTop: 3, paddingBottom: 3, color: '#334155' }}>GST (5%)</td>
                        <td style={{ paddingTop: 3, paddingBottom: 3, textAlign: 'right' }}>{(Number(previewJob.gstAmount) || 0).toFixed(2)}</td>
                      </tr>
                      <tr style={{ fontWeight: 'bold', borderTop: '1px dashed #b45309' }}>
                        <td style={{ paddingTop: 6 }}>Net Amount</td>
                        <td style={{ paddingTop: 6, textAlign: 'right', fontSize: 13 }}>
                          ₹{(Number(previewJob.totalAmount) || 0).toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div style={{ borderBottom: '1px dashed #b45309', marginTop: 6, marginBottom: 6 }} />

                  <div style={{ textAlign: 'center', fontSize: 9 }}>
                    <p style={{ margin: '1px 0', fontWeight: 'bold' }}>Thank you! Visit again!</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── DYNAMIC PRINTER ELEMENT FOR SOLDERING INVOICE ─────────── */}
      <style>{`
        @page {
          size: ${paperSize === 'A4' ? 'A4 portrait' : '76mm auto'};
          margin: 0mm;
        }
        @media screen {
          .printable-invoice, .thermal-receipt-print {
            display: none !important;
          }
        }
        @media print {
          html, body {
            width: ${paperSize === 'A4' ? '210mm !important' : 'auto !important'};
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            ${paperSize === '3-inch' ? 'min-height: 0 !important; height: auto !important; max-height: fit-content !important; overflow: hidden !important;' : ''}
          }
          body * {
            visibility: hidden !important;
          }
          .printable-invoice, .printable-invoice *,
          .thermal-receipt-print, .thermal-receipt-print * {
            visibility: visible !important;
          }
          ${paperSize === 'A4' ? `
            .printable-invoice {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 210mm !important;
              max-width: 210mm !important;
              box-sizing: border-box !important;
              padding: 10mm 12mm !important;
              margin: 0 !important;
            }
          ` : `
            html, body, #root, #root > div {
              height: auto !important;
              min-height: 0 !important;
              max-height: max-content !important;
              overflow: hidden !important;
            }
            .thermal-receipt-print {
              display: block !important;
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              width: 100% !important;
              max-width: 76mm !important;
              height: auto !important;
              max-height: fit-content !important;
              margin: 0 !important;
              padding: 2mm 3mm 1mm 5mm !important;
              box-sizing: border-box !important;
              word-break: break-word !important;
              overflow-wrap: break-word !important;
              font-family: 'Courier New', Courier, monospace !important;
              font-size: 11px !important;
              font-weight: bold !important;
              line-height: 1.3 !important;
              color: #000000 !important;
              background: #ffffff !important;
              z-index: 999999 !important;
              page-break-after: avoid !important;
              break-after: avoid !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .thermal-receipt-print .address-text {
              font-weight: normal !important;
            }
          `}
        }
      `}</style>
      {previewJob && (
        paperSize === 'A4' ? (
          <div className="printable-invoice paper-a4" style={{ fontWeight: 'normal' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: '0 0 4px 0', fontSize: 24, letterSpacing: 0.5, fontWeight: 800 }}>M S GOLD SMITH</h2>
              <p style={{ margin: '2px 0', fontSize: 12 }}>No.37C, Chettiyakudi South Street, Nadaga Salai,</p>
              <p style={{ margin: '2px 0', fontSize: 12 }}>Srivilliputhur, Virudhunagar - 626 125.</p>
              <p style={{ margin: '2px 0', fontSize: 12 }}><strong>GSTIN:</strong> 33BDVPR1363J1Z2 | <strong>Mobile:</strong> 94431 12034</p>
              <h3 style={{ margin: '14px 0 6px 0', fontSize: 15, textDecoration: 'underline', fontWeight: 700 }}>TAX INVOICE</h3>
              <span style={{ fontSize: 11, fontStyle: 'italic' }}>Original for Recipient</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', border: '1px solid #b45309', padding: 12, marginBottom: 20, fontSize: 12 }}>
              <div>
                <strong>Consignee Details:</strong>
                <div style={{ marginTop: 4, fontWeight: 700 }}>{previewJob.customerName || 'Walk-in Customer'}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div><strong>Invoice No:</strong> {previewJob.invoiceNo || previewJob.receiptNo}</div>
                <div><strong>Date:</strong> {previewJob.date}</div>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20, fontSize: 12, border: '1px solid #b45309' }}>
              <thead>
                <tr style={{ background: '#fef3c7', borderBottom: '1px solid #b45309' }}>
                  <th style={{ border: '1px solid #b45309', padding: 8, width: 35, textAlign: 'center' }}>S.N</th>
                  <th style={{ border: '1px solid #b45309', padding: 8, textAlign: 'left' }}>Description of Work / Ornaments</th>
                  <th style={{ border: '1px solid #b45309', padding: 8, width: 80, textAlign: 'center' }}>HSN</th>
                  <th style={{ border: '1px solid #b45309', padding: 8, textAlign: 'right', width: 110 }}>Marking Charge (₹)</th>
                  <th style={{ border: '1px solid #b45309', padding: 8, textAlign: 'right', width: 90 }}>CGST (2.5%)</th>
                  <th style={{ border: '1px solid #b45309', padding: 8, textAlign: 'right', width: 90 }}>SGST (2.5%)</th>
                  <th style={{ border: '1px solid #b45309', padding: 8, textAlign: 'right', width: 110 }}>Total Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const marking = Number(previewJob.markingCharges) || 0;
                  const gst = Number(previewJob.gstAmount) || (marking * 0.05);
                  const cgst = gst / 2;
                  const sgst = gst / 2;
                  const total = Number(previewJob.totalAmount) || (marking + gst);
                  return (
                    <>
                      <tr>
                        <td style={{ border: '1px solid #b45309', padding: 8, textAlign: 'center' }}>1</td>
                        <td style={{ border: '1px solid #b45309', padding: 8, fontWeight: 600 }}>{previewJob.product || 'Soldering & Engraving Work'}</td>
                        <td style={{ border: '1px solid #b45309', padding: 8, textAlign: 'center' }}>7113</td>
                        <td style={{ border: '1px solid #b45309', padding: 8, textAlign: 'right' }}>₹{marking.toFixed(2)}</td>
                        <td style={{ border: '1px solid #b45309', padding: 8, textAlign: 'right' }}>₹{cgst.toFixed(2)}</td>
                        <td style={{ border: '1px solid #b45309', padding: 8, textAlign: 'right' }}>₹{sgst.toFixed(2)}</td>
                        <td style={{ border: '1px solid #b45309', padding: 8, textAlign: 'right', fontWeight: 700 }}>₹{total.toFixed(2)}</td>
                      </tr>
                      <tr style={{ fontWeight: 'bold' }}>
                        <td colSpan="3" style={{ border: '1px solid #b45309', padding: 8, textAlign: 'right' }}>Subtotal &amp; Taxes:</td>
                        <td style={{ border: '1px solid #b45309', padding: 8, textAlign: 'right' }}>₹{marking.toFixed(2)}</td>
                        <td style={{ border: '1px solid #b45309', padding: 8, textAlign: 'right' }}>₹{cgst.toFixed(2)}</td>
                        <td style={{ border: '1px solid #b45309', padding: 8, textAlign: 'right' }}>₹{sgst.toFixed(2)}</td>
                        <td style={{ border: '1px solid #b45309', padding: 8, textAlign: 'right' }}>₹{total.toFixed(2)}</td>
                      </tr>
                    </>
                  );
                })()}
              </tbody>
            </table>

            <div style={{ display: 'flex', gap: 14, marginBottom: 24, fontSize: 12 }}>
              <div style={{ flex: 1, border: '1px solid #b45309', padding: 12 }}>
                <strong>Amount Chargeable in Words:</strong>
                <div style={{ marginTop: 6, fontStyle: 'italic', fontWeight: 700 }}>
                  {convertToWords(Number(previewJob.totalAmount) || 0)}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 36, fontSize: 12 }}>
              <div style={{ width: '60%' }}>
                <p style={{ margin: 0 }}><strong>Declaration:</strong></p>
                <p style={{ margin: '4px 0 0 0', fontSize: 10, lineHeight: 1.4 }}>
                  We declare that this invoice shows the actual price of the services described and that all particulars are true and correct.
                </p>
              </div>
              <div style={{ textAlign: 'right', width: '35%' }}>
                <p style={{ margin: 0 }}>For <strong>M S GOLD SMITH</strong></p>
                <p style={{ marginTop: 45, borderTop: '1px solid #b45309', display: 'inline-block', width: 150, paddingTop: 4 }}>Authorised Signatory</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="thermal-receipt-print" style={{ fontWeight: 'bold' }}>
            <div style={{ textAlign: 'center', marginBottom: 10 }}>
              <h2 style={{ margin: '0 0 2px 0', fontSize: 14, fontWeight: 'bold' }}>M S GOLD SMITH</h2>
              <p className="address-text" style={{ margin: '1px 0', fontSize: 9, fontWeight: 'normal' }}>No.37C, Chettiyakudi South Street, Nadaga Salai,</p>
              <p className="address-text" style={{ margin: '1px 0', fontSize: 9, fontWeight: 'normal' }}>Srivilliputhur, Virudhunagar - 626 125.</p>
              <p className="address-text" style={{ margin: '1px 0', fontSize: 9, fontWeight: 'normal' }}>GSTIN: 33BDVPR1363J1Z2 | Ph: 94431 12034</p>
              <div style={{ margin: '6px 0', borderBottom: '1px dashed #000' }} />
              <h3 style={{ margin: '0', fontSize: 11, fontWeight: 'bold' }}>SOLDERING &amp; ENGRAVING RECEIPT</h3>
            </div>

            <div style={{ fontSize: 10, marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 2, fontWeight: 'bold' }}>
              <div><strong>Invoice No:</strong> {previewJob.invoiceNo || previewJob.receiptNo}</div>
              <div><strong>Date:</strong> {previewJob.date}</div>
              <div><strong>Customer:</strong> {previewJob.customerName}</div>
            </div>

            <div style={{ borderBottom: '1px dashed #000', marginBottom: 8 }} />

            <table style={{ width: '100%', fontSize: 10, borderCollapse: 'collapse', marginBottom: 8, fontWeight: 'bold' }}>
              <thead>
                <tr style={{ borderBottom: '1px dashed #000' }}>
                  <th style={{ textAlign: 'left', paddingBottom: 4, fontWeight: 'bold' }}>Description</th>
                  <th style={{ textAlign: 'right', paddingBottom: 4, fontWeight: 'bold' }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ fontWeight: 'bold' }}>
                  <td style={{ paddingTop: 6, paddingBottom: 4, verticalAlign: 'top', fontWeight: 'bold' }}>{previewJob.product} (HSN 7113)</td>
                  <td style={{ paddingTop: 6, paddingBottom: 4, textAlign: 'right', verticalAlign: 'top', fontWeight: 'bold' }}>
                    {(Number(previewJob.markingCharges) || 0).toFixed(2)}
                  </td>
                </tr>
                <tr style={{ fontWeight: 'bold' }}>
                  <td style={{ paddingTop: 2, paddingBottom: 2, color: '#000', fontWeight: 'bold' }}>GST (5%)</td>
                  <td style={{ paddingTop: 2, paddingBottom: 2, textAlign: 'right', fontWeight: 'bold' }}>
                    {(Number(previewJob.gstAmount) || 0).toFixed(2)}
                  </td>
                </tr>
                <tr style={{ fontWeight: 'bold', borderTop: '1px dashed #000' }}>
                  <td style={{ paddingTop: 6, fontWeight: 'bold' }}>Net Total</td>
                  <td style={{ paddingTop: 6, textAlign: 'right', fontSize: 12, fontWeight: 'bold' }}>
                    ₹{(Number(previewJob.totalAmount) || 0).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ borderBottom: '1px dashed #000', marginTop: 6, marginBottom: 6 }} />

            <div style={{ textAlign: 'center', fontSize: 9, fontWeight: 'bold' }}>
              <p style={{ margin: '1px 0', fontWeight: 'bold' }}>Thank you! Visit again!</p>
            </div>
          </div>
        )
      )}
    </div>
  );
}
