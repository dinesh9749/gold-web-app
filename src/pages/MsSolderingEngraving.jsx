import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Printer, Save, Trash, Eye, Sparkles } from 'lucide-react';

export default function MsSolderingEngraving() {
  const outletContext = useOutletContext();
  const isAdmin = outletContext ? outletContext.isAdmin : (localStorage.getItem("goldApp_adminMode") !== "false");
  
  const [activeTab, setActiveTab] = useState("generator"); // "generator" or "history"
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [previewJob, setPreviewJob] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
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
    if (activeTab === "history") {
      loadJobs();
    }
  }, [activeTab]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const res = await window.electronAPI?.getAllSolderingJobs();
      if (res) {
        setJobs(res);
      }
    } catch (err) {
      console.error("Error loading soldering jobs:", err);
    } finally {
      setLoading(false);
    }
  };

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
      
      const payload = {
        date: formData.date,
        customerName: formData.customerName.trim(),
        product: formData.product.trim(),
        markingCharges: chargesVal,
        gstAmount: gstVal,
        totalAmount: totalVal
      };

      const result = await window.electronAPI?.saveSolderingJob(payload);
      if (result?.id) {
        alert("Soldering & Engraving job saved successfully!");
        
        // Show receipt print preview with the saved record (generate a pseudo-receipt number using first few chars of ID)
        const displayId = result.id.substring(0, 8).toUpperCase();
        setPreviewJob({
          receiptNo: `SE-${new Date(formData.date).getFullYear()}-${displayId}`,
          ...payload
        });
        
        // Reset form
        setFormData({
          date: new Date().toISOString().split("T")[0],
          customerName: "",
          product: "",
          markingCharges: ""
        });
        
        setShowPreview(true);
      } else {
        alert("Failed to save. Please make sure database is connected.");
      }
    } catch (err) {
      console.error("Error saving job:", err);
      alert("Failed to save order.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async (id) => {
    if (!isAdmin) {
      alert("Admin Access Required. Please unlock Admin Mode from the top bar.");
      return;
    }

    if (window.confirm("Are you sure you want to delete this job record permanently?")) {
      try {
        await window.electronAPI?.deleteSolderingJob(id);
        setJobs(prev => prev.filter(job => job.id !== id));
      } catch (err) {
        console.error("Error deleting job:", err);
        alert("Failed to delete record.");
      }
    }
  };

  const handleViewReceipt = (job) => {
    const displayId = job.id.substring(0, 8).toUpperCase();
    setPreviewJob({
      receiptNo: `SE-${new Date(job.date).getFullYear()}-${displayId}`,
      date: job.date,
      customerName: job.customerName,
      product: job.product,
      markingCharges: job.markingCharges,
      gstAmount: job.gstAmount,
      totalAmount: job.totalAmount
    });
    setShowPreview(true);
  };

  const filteredJobs = jobs.filter(job => {
    const query = searchQuery.toLowerCase();
    return (
      job.customerName.toLowerCase().includes(query) ||
      job.product.toLowerCase().includes(query)
    );
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
      {activeTab === "generator" ? (
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
                  placeholder="Enter customer name manually..."
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
      ) : (
        /* ── HISTORY DIRECTORY LOG TAB ───────────────────────── */
        <div className="card" style={{ width: '100%' }}>
          <div className="section-header" style={{ marginBottom: 16 }}>
            <span className="section-title">Soldering & Engraving Logs Directory</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{filteredJobs.length} total entries</span>
          </div>

          {/* Search bar */}
          <div style={{ marginBottom: 16, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--text-muted)' }}>🔍</span>
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: 36 }}
              placeholder="Search past logs by Customer Name or Product..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
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
                  {filteredJobs.map(job => (
                    <tr key={job.id}>
                      <td>{job.date}</td>
                      <td><strong>{job.customerName}</strong></td>
                      <td>{job.product}</td>
                      <td>₹{job.markingCharges.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td>₹{job.gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td>
                        <strong style={{ color: '#4ade80' }}>
                          ₹{job.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </strong>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn-secondary"
                            style={{ padding: '5px 10px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
                            onClick={() => handleViewReceipt(job)}
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── 3-INCH THERMAL RECEIPT PRINT PREVIEW MODAL ────────── */}
      {showPreview && previewJob && (
        <div className="modal-overlay" style={{ zIndex: 11000 }}>
          <div className="modal-box" style={{ maxWidth: 360, padding: 0 }}>
            {/* Modal header (Hidden during actual print) */}
            <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div className="modal-title">✦ 3-Inch Thermal Receipt Preview</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handlePrint}
                  className="btn-primary"
                  style={{ padding: '5px 12px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <Printer size={13} /> Print
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="modal-close"
                  style={{ width: 26, height: 26, fontSize: 12 }}
                >✕</button>
              </div>
            </div>

            {/* Receipt container (Simulates thermal receipt inside UI) */}
            <div style={{
              background: '#f9f9f9',
              padding: '24px 20px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              {/* Paper Slip visual style */}
              <div style={{
                background: '#fffdf5',
                color: '#0f172a',
                width: '100%',
                maxWidth: '280px',
                padding: '20px 14px',
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
                  <div><strong>Rcpt No:</strong> {previewJob.receiptNo}</div>
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
                        {previewJob.product}
                      </td>
                      <td style={{ paddingTop: 6, paddingBottom: 4, textAlign: 'right', verticalAlign: 'top' }}>
                        {previewJob.markingCharges.toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ paddingY: 3, color: '#334155' }}>GST (5%)</td>
                      <td style={{ paddingY: 3, textAlign: 'right' }}>{previewJob.gstAmount.toFixed(2)}</td>
                    </tr>
                    <tr style={{ fontWeight: 'bold', borderTop: '1px dashed #b45309' }}>
                      <td style={{ paddingTop: 6 }}>Net Amount</td>
                      <td style={{ paddingTop: 6, textAlign: 'right', fontSize: 13 }}>
                        ₹{previewJob.totalAmount.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ borderBottom: '1px dashed #b45309', marginTop: 10, marginBottom: 10 }} />

                <div style={{ textAlign: 'center', fontSize: 9 }}>
                  <p style={{ margin: '2px 0', fontWeight: 'bold' }}>Thank you! Visit again!</p>
                  <p style={{ margin: '2px 0', color: '#334155' }}>M.S. Gold Jewellery ERP</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DYNAMIC INVISIBLE PRINTER ELEMENT ─────────────────── */}
      {previewJob && (
        <div className="thermal-receipt-print" style={{ display: 'none' }}>
          <div style={{ textAlign: 'center', marginBottom: 10 }}>
            <h2 style={{ margin: '0 0 2px 0', fontSize: 13, fontWeight: 'bold' }}>M S GOLD SMITH</h2>
            <p style={{ margin: '1px 0', fontSize: 8 }}>No.37C, Chettiyakudi South Street, Nadaga Salai,</p>
            <p style={{ margin: '1px 0', fontSize: 8 }}>Srivilliputhur, Virudhunagar - 626 125.</p>
            <p style={{ margin: '1px 0', fontSize: 8 }}>GSTIN: 33BDVPR1363J1Z2 | Ph: 94431 12034</p>
            <div style={{ margin: '6px 0', borderBottom: '1px dashed #b45309' }} />
            <h3 style={{ margin: '0', fontSize: 10, fontWeight: 'bold' }}>SOLDERING &amp; ENGRAVING</h3>
          </div>

          <div style={{ fontSize: 8, marginBottom: 6 }}>
            <div><strong>Receipt No:</strong> {previewJob.receiptNo}</div>
            <div><strong>Date:</strong> {previewJob.date}</div>
            <div><strong>Customer:</strong> {previewJob.customerName}</div>
          </div>

          <div style={{ borderBottom: '1px dashed #b45309', marginBottom: 6 }} />

          <table style={{ width: '100%', fontSize: 8, borderCollapse: 'collapse', marginBottom: 6 }}>
            <thead>
              <tr style={{ borderBottom: '1px dashed #b45309' }}>
                <th style={{ textAlign: 'left', paddingBottom: 2 }}>Description</th>
                <th style={{ textAlign: 'right', paddingBottom: 2 }}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ paddingTop: 4, paddingBottom: 2 }}>{previewJob.product}</td>
                <td style={{ paddingTop: 4, paddingBottom: 2, textAlign: 'right' }}>{previewJob.markingCharges.toFixed(2)}</td>
              </tr>
              <tr>
                <td style={{ paddingY: 2 }}>GST (5%)</td>
                <td style={{ paddingY: 2, textAlign: 'right' }}>{previewJob.gstAmount.toFixed(2)}</td>
              </tr>
              <tr style={{ fontWeight: 'bold', borderTop: '1px dashed #b45309' }}>
                <td style={{ paddingTop: 4 }}>Net Total</td>
                <td style={{ paddingTop: 4, textAlign: 'right' }}>₹{previewJob.totalAmount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div style={{ borderBottom: '1px dashed #b45309', marginTop: 6, marginBottom: 8 }} />

          <div style={{ textAlign: 'center', fontSize: 7 }}>
            <p style={{ margin: '1px 0' }}>Thank you! Visit again!</p>
            <p style={{ margin: '1px 0' }}>M.S. Gold Jewellery ERP</p>
          </div>
        </div>
      )}
    </div>
  );
}
