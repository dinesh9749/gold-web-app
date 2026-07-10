import { useState, useEffect } from "react";
import { Plus, Minus, Search, Trash2, TrendingUp, RefreshCw, BarChart2 } from "lucide-react";

const PURITIES = ["22K (916)", "18K", "24K (999)", "14K", "Silver", "General / Non-Metal"];
const COMMON_ITEMS = ["Ring", "Chain", "Bangle", "Necklace", "Bracelet", "Earrings", "Coin", "Gold Bar", "Jewelry Box", "Tag/Label"];

export default function Stock() {
  const [activeTab, setActiveTab] = useState("overview"); // "overview" or "ledger"
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ledgerSearch, setLedgerSearch] = useState("");
  const [selectedPurityFilter, setSelectedPurityFilter] = useState("ALL");

  // Transaction Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("IN"); // "IN" or "OUT"
  const [parentBatch, setParentBatch] = useState(null); // original STOCK_IN item being deducted
  
  const [formData, setFormData] = useState({
    itemName: "",
    purity: "22K (916)",
    weight: "",
    quantity: "1",
    transactionDate: new Date().toISOString().split("T")[0],
    supplierCustomer: "",
    notes: ""
  });

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const res = await window.electronAPI?.getAllStockTransactions();
      if (res) {
        setTransactions(res);
      }
    } catch (err) {
      console.error("Failed to load stock logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenStockInModal = () => {
    setModalType("IN");
    setParentBatch(null);
    setFormData({
      itemName: "",
      purity: "22K (916)",
      weight: "",
      quantity: "1",
      transactionDate: new Date().toISOString().split("T")[0],
      supplierCustomer: "",
      notes: ""
    });
    setShowModal(true);
  };

  const handleOpenStockOutModal = (batch) => {
    setModalType("OUT");
    setParentBatch(batch);
    setFormData({
      itemName: batch.itemName,
      purity: batch.purity,
      weight: batch.remainingWeight.toString(),
      quantity: batch.remainingQuantity.toString(),
      transactionDate: new Date().toISOString().split("T")[0],
      supplierCustomer: "",
      notes: `Deduction from Batch on ${new Date(batch.transactionDate).toLocaleDateString('en-GB')}`
    });
    setShowModal(true);
  };

  const handleSaveTransaction = async (e) => {
    e.preventDefault();
    if (!formData.itemName.trim() || !formData.quantity) {
      alert("Please fill in all required fields.");
      return;
    }

    const wt = parseFloat(formData.weight) || 0;
    const qty = parseInt(formData.quantity, 10) || 0;

    if (formData.purity !== "General / Non-Metal" && wt <= 0) {
      alert("Please enter a valid weight for metal items.");
      return;
    }

    // Constraints check for Stock Out deductions
    if (modalType === "OUT" && parentBatch) {
      if (qty > parentBatch.remainingQuantity) {
        alert(`Cannot stock out more pieces than are available in this batch (${parentBatch.remainingQuantity} max).`);
        return;
      }
      if (formData.purity !== "General / Non-Metal" && wt > parentBatch.remainingWeight) {
        alert(`Cannot stock out more weight than is available in this batch (${parentBatch.remainingWeight.toFixed(3)}g max).`);
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        transactionType: modalType,
        itemName: formData.itemName.trim(),
        purity: formData.purity,
        weight: wt,
        quantity: qty,
        transactionDate: formData.transactionDate,
        supplierCustomer: formData.supplierCustomer.trim() || null,
        notes: formData.notes.trim() || null,
        parentTransactionId: parentBatch ? parentBatch.id : null
      };

      const result = await window.electronAPI?.saveStockTransaction(payload);
      if (result) {
        alert(`Stock ${modalType === 'IN' ? 'In' : 'Out'} transaction logged successfully!`);
        setShowModal(false);
        loadTransactions();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save transaction.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (!window.confirm("Are you sure you want to delete this stock transaction? This will permanently undo its inventory impact.")) return;
    try {
      await window.electronAPI?.deleteStockTransaction(id);
      alert("Transaction deleted.");
      loadTransactions();
    } catch (err) {
      console.error(err);
      alert("Failed to delete transaction.");
    }
  };

  // Process transaction logs to calculate remaining stock for each STOCK_IN batch
  const getAvailableBatches = () => {
    // 1. Separate Stock In items
    const stockInItems = transactions
      .filter(tx => tx.transactionType === "IN")
      .map(tx => ({
        ...tx,
        remainingWeight: parseFloat(tx.weight) || 0,
        remainingQuantity: parseInt(tx.quantity, 10) || 0,
        stockedOutWeight: 0,
        stockedOutQuantity: 0
      }));

    // 2. Map Stock Out reductions to their parents
    transactions
      .filter(tx => tx.transactionType === "OUT" && tx.parentTransactionId)
      .forEach(outTx => {
        const parent = stockInItems.find(inTx => inTx.id === outTx.parentTransactionId);
        if (parent) {
          parent.stockedOutWeight += parseFloat(outTx.weight) || 0;
          parent.stockedOutQuantity += parseInt(outTx.quantity, 10) || 0;
          parent.remainingWeight -= parseFloat(outTx.weight) || 0;
          parent.remainingQuantity -= parseInt(outTx.quantity, 10) || 0;
        }
      });

    // 3. Format remaining values and return active batches (remnants > 0)
    return stockInItems.map(item => ({
      ...item,
      remainingWeight: Math.max(0, Math.round(item.remainingWeight * 1000) / 1000),
      remainingQuantity: Math.max(0, item.remainingQuantity)
    })).filter(item => item.remainingWeight > 0.001 || item.remainingQuantity > 0);
  };

  const activeBatches = getAvailableBatches();

  const selectPresetItem = (name) => {
    setFormData(prev => ({ ...prev, itemName: name }));
  };

  return (
    <div style={{ fontFamily: "var(--font-family)", color: "var(--text-primary)" }}>
      {/* Header Banner */}
      <div className="section-header" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="section-title" style={{ fontSize: 18 }}>Stock & Inventory Management</div>
          <div className="section-sub">Deduct stock items directly from active Stock In entry batches</div>
        </div>
        <button onClick={handleOpenStockInModal} className="btn-primary" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6, background: '#22c55e', borderColor: '#22c55e', color: '#fff', fontSize: 12 }}>
          <Plus size={14} /> New Stock In (Add Product Batch)
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
        <button
          onClick={() => setActiveTab("overview")}
          className={activeTab === "overview" ? "btn-primary" : "btn-secondary"}
          style={{ padding: '6px 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <BarChart2 size={14} /> Active Batch Stock List
        </button>
        <button
          onClick={() => setActiveTab("ledger")}
          className={activeTab === "ledger" ? "btn-primary" : "btn-secondary"}
          style={{ padding: '6px 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <TrendingUp size={14} /> Transactions Ledger Logs
        </button>
      </div>

      {activeTab === "overview" ? (
        <div>
          {/* Current Stock Levels */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Available Batches (Stock In items ready for sale/deduction)</h3>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Click "Stock Out" on any row to deduct quantity or weight from that specific batch.</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  value={selectedPurityFilter}
                  onChange={(e) => setSelectedPurityFilter(e.target.value)}
                  className="form-input"
                  style={{ width: 150, padding: 4, fontSize: 12 }}
                >
                  <option value="ALL">All Purities / Types</option>
                  {PURITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <button onClick={loadTransactions} className="btn-secondary" style={{ padding: '6px' }} title="Refresh Database">
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>Calculating batch stocks...</div>
            ) : activeBatches.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>No active stock batches found. Please record a "New Stock In" batch first.</div>
            ) : (
              <div style={{ overflowX: 'auto', border: '1px solid var(--border-default)', borderRadius: 10 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: 12 }}>Stock In Date</th>
                      <th style={{ padding: 12 }}>Ornament / Product Details</th>
                      <th style={{ padding: 12 }}>Purity / Standard</th>
                      <th style={{ padding: 12, textAlign: 'right' }}>Available Weight (g)</th>
                      <th style={{ padding: 12, textAlign: 'right' }}>Available Qty (pcs)</th>
                      <th style={{ padding: 12 }}>Supplier / Batch Reference</th>
                      <th style={{ padding: 12, textAlign: 'center', width: 120 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeBatches
                      .filter(item => selectedPurityFilter === "ALL" || item.purity === selectedPurityFilter)
                      .map((item, index) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: 12 }}>{new Date(item.transactionDate).toLocaleDateString('en-GB')}</td>
                          <td style={{ padding: 12 }}>
                            <div style={{ fontWeight: 700 }}>{item.itemName}</div>
                            {item.notes && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{item.notes}</div>}
                          </td>
                          <td style={{ padding: 12 }}>
                            <span style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 12,
                              background: item.purity.includes('Non-Metal') ? 'rgba(59,130,246,0.1)' : item.purity.includes('Silver') ? 'rgba(148,163,184,0.12)' : 'rgba(251,191,36,0.1)',
                              color: item.purity.includes('Non-Metal') ? '#3b82f6' : item.purity.includes('Silver') ? 'var(--text-secondary)' : 'var(--gold-200)',
                              border: `1px solid ${item.purity.includes('Non-Metal') ? 'rgba(59,130,246,0.3)' : item.purity.includes('Silver') ? 'rgba(148,163,184,0.3)' : 'rgba(251,191,36,0.2)'}`
                            }}>{item.purity}</span>
                          </td>
                          <td style={{ padding: 12, textAlign: 'right', fontWeight: 600 }}>
                            {item.purity === "General / Non-Metal" ? "-" : `${item.remainingWeight.toFixed(3)} g / ${parseFloat(item.weight).toFixed(3)} g`}
                          </td>
                          <td style={{ padding: 12, textAlign: 'right', fontWeight: 600 }}>
                            {item.remainingQuantity} pcs / {item.quantity} pcs
                          </td>
                          <td style={{ padding: 12 }}>{item.supplierCustomer || '-'}</td>
                          <td style={{ padding: 8, textAlign: 'center' }}>
                            <button
                              onClick={() => handleOpenStockOutModal(item)}
                              className="btn-primary"
                              style={{
                                padding: '4px 10px', fontSize: 11, background: '#ef4444', borderColor: '#ef4444', color: '#fff',
                                display: 'flex', alignItems: 'center', gap: 4, margin: '0 auto'
                              }}
                            >
                              <Minus size={11} /> Stock Out
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* TRANSACTIONS LEDGER TAB */
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, flex: 1 }}>Transaction History Ledger (All Logs)</h3>
            <div style={{ position: 'relative', width: 260 }}>
              <input
                type="text"
                className="form-input"
                style={{ padding: '6px 12px 6px 30px', fontSize: 12 }}
                placeholder="Search ledger logs..."
                value={ledgerSearch}
                onChange={e => setLedgerSearch(e.target.value)}
              />
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', opacity: 0.4, fontSize: 12 }}>🔍</span>
            </div>
            <button onClick={loadTransactions} className="btn-secondary" style={{ padding: '6px' }} title="Refresh">
              <RefreshCw size={14} />
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>Retrieving transactions...</div>
          ) : transactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>No transactions logged yet.</div>
          ) : (
            <div style={{ overflowX: 'auto', border: '1px solid var(--border-default)', borderRadius: 10 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: 12 }}>Date</th>
                    <th style={{ padding: 12 }}>Type</th>
                    <th style={{ padding: 12 }}>Item Details</th>
                    <th style={{ padding: 12, textAlign: 'right' }}>Weight (g)</th>
                    <th style={{ padding: 12, textAlign: 'right' }}>Qty</th>
                    <th style={{ padding: 12 }}>Supplier / Customer / Ref</th>
                    <th style={{ padding: 12, maxWidth: 200 }}>Notes / Remarks</th>
                    <th style={{ padding: 12, textAlign: 'center', width: 60 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {transactions
                    .filter(tx => (
                      tx.itemName.toLowerCase().includes(ledgerSearch.toLowerCase()) || 
                      (tx.notes && tx.notes.toLowerCase().includes(ledgerSearch.toLowerCase())) ||
                      (tx.supplierCustomer && tx.supplierCustomer.toLowerCase().includes(ledgerSearch.toLowerCase()))
                    ))
                    .map(tx => (
                      <tr key={tx.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: 12 }}>{new Date(tx.transactionDate).toLocaleDateString('en-GB')}</td>
                        <td style={{ padding: 12 }}>
                          <span style={{
                            fontSize: 9,
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: 4,
                            background: tx.transactionType === "IN" ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                            color: tx.transactionType === "IN" ? '#22c55e' : '#ef4444',
                            border: `1px solid ${tx.transactionType === "IN" ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`
                          }}>
                            {tx.transactionType === "IN" ? "📥 STOCK IN" : "📤 STOCK OUT"}
                          </span>
                        </td>
                        <td style={{ padding: 12 }}>
                          <strong>{tx.itemName}</strong> <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>({tx.purity})</span>
                        </td>
                        <td style={{ padding: 12, textAlign: 'right', fontWeight: 600 }}>
                          {tx.purity === "General / Non-Metal" ? "-" : `${tx.weight.toFixed(3)} g`}
                        </td>
                        <td style={{ padding: 12, textAlign: 'right', fontWeight: 600 }}>{tx.quantity} pcs</td>
                        <td style={{ padding: 12 }}>{tx.supplierCustomer || '-'}</td>
                        <td style={{ padding: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={tx.notes}>{tx.notes || '-'}</td>
                        <td style={{ padding: 8, textAlign: 'center' }}>
                          <button
                            onClick={() => handleDeleteTransaction(tx.id)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                            title="Delete Transaction"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TRANSACTION MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>{modalType === "IN" ? "📥 Record Stock In Batch" : "📤 Record Stock Out Deduction"}</span>
              </div>
              <button onClick={() => setShowModal(false)} className="modal-close">✕</button>
            </div>

            <form onSubmit={handleSaveTransaction}>
              <div className="modal-body" style={{ padding: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  
                  {modalType === "OUT" && parentBatch && (
                    <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.06)', border: '1px dashed rgba(239,68,68,0.3)', borderRadius: 8, fontSize: 11, color: 'var(--text-secondary)' }}>
                      <strong>Deducting from batch:</strong> {parentBatch.itemName} ({parentBatch.purity})<br />
                      <strong>Available in batch:</strong> {parentBatch.purity === 'General / Non-Metal' ? '' : `${parentBatch.remainingWeight.toFixed(3)}g / `}{parentBatch.remainingQuantity} pieces.
                    </div>
                  )}

                  {/* Date picker */}
                  <div>
                    <label className="form-label">Transaction Date *</label>
                    <input
                      type="date"
                      value={formData.transactionDate}
                      onChange={e => setFormData(prev => ({ ...prev, transactionDate: e.target.value }))}
                      className="form-input"
                      required
                    />
                  </div>

                  {/* Preset Items Shortcut (Only for New Stock In) */}
                  {modalType === "IN" && (
                    <div>
                      <label className="form-label" style={{ marginBottom: 6 }}>Common Preset Items</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {COMMON_ITEMS.map(item => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => selectPresetItem(item)}
                            style={{
                              padding: '3px 8px', fontSize: 10, borderRadius: 12,
                              background: formData.itemName === item ? 'var(--gold-200)' : 'var(--bg-elevated)',
                              color: formData.itemName === item ? '#000' : 'var(--text-primary)',
                              border: '1px solid var(--border-default)', cursor: 'pointer'
                            }}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Item Name */}
                  <div>
                    <label className="form-label">Item / Product Name *</label>
                    <input
                      type="text"
                      value={formData.itemName}
                      onChange={e => setFormData(prev => ({ ...prev, itemName: e.target.value }))}
                      className="form-input"
                      placeholder="e.g. Gift Box, Bangle, Necklace"
                      disabled={modalType === "OUT"}
                      required
                    />
                  </div>

                  {/* Purity Selection */}
                  <div>
                    <label className="form-label">Purity / Category Grade *</label>
                    <select
                      value={formData.purity}
                      onChange={e => setFormData(prev => ({ ...prev, purity: e.target.value }))}
                      className="form-input"
                      disabled={modalType === "OUT"}
                      required
                    >
                      {PURITIES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>

                  {/* Weight and Qty */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label className="form-label">
                        Weight (grams) {formData.purity === "General / Non-Metal" ? "(Optional)" : "*"}
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={formData.weight}
                        onChange={e => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                        className="form-input"
                        placeholder="0.000"
                        disabled={formData.purity === "General / Non-Metal"}
                        required={formData.purity !== "General / Non-Metal"}
                      />
                    </div>
                    <div>
                      <label className="form-label">Quantity (pcs) *</label>
                      <input
                        type="number"
                        value={formData.quantity}
                        onChange={e => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                        className="form-input"
                        placeholder="1"
                        min="1"
                        required
                      />
                    </div>
                  </div>

                  {/* Supplier/Customer details */}
                  <div>
                    <label className="form-label">
                      {modalType === "IN" ? "Supplier Name / Batch Ref" : "Customer / Invoice No / Remarks"}
                    </label>
                    <input
                      type="text"
                      value={formData.supplierCustomer}
                      onChange={e => setFormData(prev => ({ ...prev, supplierCustomer: e.target.value }))}
                      className="form-input"
                      placeholder={modalType === "IN" ? "e.g. batch-01, bullion-supplier" : "e.g. Ramesh / sold on invoice"}
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="form-label">Notes / Description</label>
                    <textarea
                      rows="2"
                      value={formData.notes}
                      onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      className="form-input"
                      placeholder="Enter description, remarks..."
                    />
                  </div>

                </div>
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-subtle)', padding: '12px 20px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '6px 16px', fontSize: 12, background: modalType === 'IN' ? '#22c55e' : '#ef4444', borderColor: modalType === 'IN' ? '#22c55e' : '#ef4444', color: '#fff' }}>
                  {saving ? "Saving..." : modalType === 'IN' ? "📥 Record Stock In" : "📤 Record Stock Out"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
