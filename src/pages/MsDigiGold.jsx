import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

function MsDigiGold() {
  const outletContext = useOutletContext();
  const isAdmin = true;

  const [schemes, setSchemes] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [goldRate, setGoldRate] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Selected / Active Scheme
  const [activeScheme, setActiveScheme] = useState(null);
  const [collectionsHistory, setCollectionsHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Form States
  const [schemeForm, setSchemeForm] = useState({
    customerId: '',
    schemeName: 'Daily Gold Saver',
    presetAmount: '',
    intervalType: 'daily',
    startDate: new Date().toISOString().split('T')[0],
    tenureMonths: '11',
    hasBonus: true
  });

  const [collectForm, setCollectForm] = useState({
    collectedAmount: '',
    collectionDate: new Date().toISOString().split('T')[0],
    notes: '',
    isBonus: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load gold rate
      const ratesRes = await window.electronAPI.getMetalRates();
      if (ratesRes.success && ratesRes.metal_rates && ratesRes.metal_rates.length > 0) {
        setGoldRate(parseFloat(ratesRes.metal_rates[0].gold_rate) || 0);
      }

      // Load customers
      const custRes = await window.electronAPI.getAllCustomers();
      if (custRes) setCustomers(custRes);

      // Load schemes
      const schemesRes = await window.electronAPI.getAllGoldSchemes();
      if (schemesRes) setSchemes(schemesRes);

    } catch (err) {
      console.error('Error loading DigiGold data:', err);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateScheme = async (e) => {
    e.preventDefault();
    if (!schemeForm.customerId || !schemeForm.schemeName || !schemeForm.presetAmount || !schemeForm.startDate) {
      alert('Please fill in all required fields.');
      return;
    }

    try {
      const tenure = parseInt(schemeForm.tenureMonths || 11, 10);
      const start = new Date(schemeForm.startDate);
      if (!isNaN(start.getTime())) {
        start.setMonth(start.getMonth() + tenure);
      }
      const maturityDate = !isNaN(start.getTime()) ? start.toISOString().split('T')[0] : null;

      const payload = {
        customerId: parseInt(schemeForm.customerId),
        schemeName: schemeForm.schemeName,
        presetAmount: parseFloat(schemeForm.presetAmount),
        intervalType: schemeForm.intervalType,
        startDate: schemeForm.startDate,
        status: 'active',
        tenureMonths: tenure,
        maturityDate: maturityDate,
        hasBonus: schemeForm.hasBonus ? 1 : 0,
        bonusAmount: schemeForm.hasBonus ? parseFloat(schemeForm.presetAmount) : 0
      };

      const res = await window.electronAPI.saveGoldScheme(payload);
      if (res?.id) {
        showToast('Gold Scheme started successfully!');
        setShowCreateModal(false);
        setSchemeForm({
          customerId: '',
          schemeName: 'Daily Gold Saver',
          presetAmount: '',
          intervalType: 'daily',
          startDate: new Date().toISOString().split('T')[0],
          tenureMonths: '11',
          hasBonus: true
        });
        loadData();
      }
    } catch (err) {
      console.error('Error creating scheme:', err);
      showToast('Failed to start gold scheme', 'error');
    }
  };

  const handleRecordCollection = async (e) => {
    e.preventDefault();
    if (!collectForm.collectedAmount || !collectForm.collectionDate) {
      alert('Please fill in all required fields.');
      return;
    }

    try {
      const payload = {
        schemeId: activeScheme.id,
        collectedAmount: parseFloat(collectForm.collectedAmount),
        collectionDate: collectForm.collectionDate,
        notes: collectForm.notes,
        isBonus: collectForm.isBonus ? 1 : 0
      };

      const res = await window.electronAPI.saveGoldCollection(payload);
      if (res?.id) {
        showToast('Collection payment recorded!');
        setShowCollectModal(false);
        setCollectForm({
          collectedAmount: '',
          collectionDate: new Date().toISOString().split('T')[0],
          notes: '',
          isBonus: false
        });
        loadData();
      }
    } catch (err) {
      console.error('Error saving collection:', err);
      showToast('Failed to save collection payment', 'error');
    }
  };

  const loadCollectionsHistory = async (scheme) => {
    try {
      setHistoryLoading(true);
      const res = await window.electronAPI.getGoldCollections(scheme.id);
      if (res) {
        setCollectionsHistory(res);
      }
    } catch (err) {
      console.error('Error fetching collection history:', err);
      showToast('Failed to load history', 'error');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleViewDetails = async (scheme) => {
    setActiveScheme(scheme);
    setShowDetailsModal(true);
    await loadCollectionsHistory(scheme);
  };

  const handleDeleteCollection = async (collectionId) => {
    if (!window.confirm('Are you sure you want to delete this collection entry?')) return;
    try {
      await window.electronAPI.deleteGoldCollection(collectionId);
      showToast('Collection payment entry deleted.');
      // Refresh current scheme history and total scheme list
      await loadCollectionsHistory(activeScheme);
      loadData();
    } catch (err) {
      console.error('Error deleting collection:', err);
      showToast('Failed to delete collection entry', 'error');
    }
  };

  const handleToggleStatus = async (scheme, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'completed' : 'active';
    if (!window.confirm(`Mark this scheme as ${nextStatus.toUpperCase()}?`)) return;
    try {
      await window.electronAPI.updateGoldSchemeStatus(scheme.id, nextStatus);
      showToast(`Scheme status updated to ${nextStatus}!`);
      loadData();
    } catch (err) {
      console.error('Error updating scheme status:', err);
      showToast('Failed to update status', 'error');
    }
  };

  const handleDeleteScheme = async (schemeId) => {
    if (!window.confirm('Deleting this scheme will delete all its recorded collections too. Proceed?')) return;
    try {
      await window.electronAPI.deleteGoldScheme(schemeId);
      showToast('Gold scheme completely deleted.');
      loadData();
    } catch (err) {
      console.error('Error deleting scheme:', err);
      showToast('Failed to delete scheme', 'error');
    }
  };

  const filteredSchemes = schemes.filter(s => {
    const q = searchTerm.toLowerCase();
    const fullName = `${s.customerTitle} ${s.customerName} ${s.customerSurname}`.toLowerCase();
    return fullName.includes(q) || s.schemeName.toLowerCase().includes(q) || s.customerMobile.includes(q);
  });

  const totalCollectedAll = schemes.reduce((sum, s) => sum + s.totalCollected, 0);
  const totalGoldGramsAll = goldRate > 0 ? (totalCollectedAll / goldRate) : 0;
  const activeCount = schemes.filter(s => s.status === 'active').length;

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 16 }}>
        <div className="spinner" />
        <span style={{ color: 'var(--text-muted)' }}>Loading DigiGold Dashboard…</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Toast Notification */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999 }}>
          <div className={`toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
            <span>{toast.type === 'error' ? '⚠️' : '✓'}</span>
            {toast.message}
          </div>
        </div>
      )}

      {/* Header section */}
      <div className="section-header">
        <div>
          <div className="section-title" style={{ fontSize: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
            DigiGold Daily Scheme Manager
            <span style={{
              fontSize: 12, fontWeight: 600,
              background: 'rgba(251,191,36,0.1)', border: '1px solid var(--border-default)',
              borderRadius: 20, padding: '3px 12px', color: 'var(--gold-300)',
            }}>
              Live Rate: ₹{goldRate > 0 ? `${goldRate.toLocaleString('en-IN')}/g` : 'Not Set (Set in settings)'}
            </span>
          </div>
          <div className="section-sub">Manage micro-investments, installment collections, and gold weight accumulations</div>
        </div>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          + New Gold Scheme
        </button>
      </div>

      {/* Stats Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <div className="card card-gold">
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
            Active Investment Schemes
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--gold-300)' }}>
            {activeCount} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>/ {schemes.length} total</span>
          </div>
        </div>

        <div className="card card-gold">
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
            Total Capital Collected
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--gold-300)' }}>
            ₹{totalCollectedAll.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="card card-gold">
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
            Total Accumulated Gold (22K)
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--gold-300)' }}>
            {totalGoldGramsAll.toFixed(3)}g
          </div>
        </div>
      </div>

      {/* Alerts Panel */}
      {(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        const today = new Date(todayStr);

        const maturedSoonSchemes = schemes.filter(s => {
          if (s.status !== 'active' || !s.maturityDate) return false;
          const mDate = new Date(s.maturityDate);
          const diffTime = mDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays <= 30; // matured or maturing within 30 days
        });

        const defaulterSchemes = schemes.filter(s => {
          if (s.status !== 'active') return false;
          const refDateStr = s.lastCollectionDate || s.startDate;
          if (!refDateStr) return false;
          const refDate = new Date(refDateStr);
          const diffTime = today.getTime() - refDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

          let threshold = 1;
          if (s.intervalType === 'weekly') threshold = 7;
          else if (s.intervalType === 'monthly') threshold = 30;

          return diffDays > threshold;
        });

        if (maturedSoonSchemes.length === 0 && defaulterSchemes.length === 0) return null;

        return (
          <div style={{ display: 'grid', gridTemplateColumns: maturedSoonSchemes.length > 0 && defaulterSchemes.length > 0 ? '1fr 1fr' : '1fr', gap: 16 }}>
            {maturedSoonSchemes.length > 0 && (
              <div className="card" style={{ borderLeft: '4px solid var(--gold-400)', background: 'rgba(251,191,36,0.03)', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 18 }}>⏰</span>
                  <strong style={{ color: 'var(--gold-300)', fontSize: 14 }}>Maturity Alerts ({maturedSoonSchemes.length})</strong>
                </div>
                <div style={{ maxHeight: 120, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {maturedSoonSchemes.map(s => {
                    const mDate = new Date(s.maturityDate);
                    const diffTime = mDate.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    const isMatured = diffDays <= 0;
                    return (
                      <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, background: 'var(--bg-elevated)', padding: '8px 12px', borderRadius: 6 }}>
                        <div>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.customerTitle} {s.customerName} {s.customerSurname}</span>
                          <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>({s.schemeName})</span>
                        </div>
                        <span style={{ 
                          color: isMatured ? '#f87171' : 'var(--gold-300)', 
                          fontWeight: 700,
                          background: isMatured ? 'rgba(239,68,68,0.1)' : 'rgba(251,191,36,0.1)',
                          padding: '2px 8px', borderRadius: 4
                        }}>
                          {isMatured ? 'Matured!' : `${diffDays} days left`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {defaulterSchemes.length > 0 && (
              <div className="card" style={{ borderLeft: '4px solid #ef4444', background: 'rgba(239,68,68,0.03)', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 18 }}>⚠️</span>
                  <strong style={{ color: '#f87171', fontSize: 14 }}>Overdue / Defaulters ({defaulterSchemes.length})</strong>
                </div>
                <div style={{ maxHeight: 120, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {defaulterSchemes.map(s => {
                    const refDateStr = s.lastCollectionDate || s.startDate;
                    const refDate = new Date(refDateStr);
                    const diffTime = today.getTime() - refDate.getTime();
                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                    let threshold = 1;
                    if (s.intervalType === 'weekly') threshold = 7;
                    else if (s.intervalType === 'monthly') threshold = 30;
                    const overdue = diffDays - threshold;
                    return (
                      <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, background: 'var(--bg-elevated)', padding: '8px 12px', borderRadius: 6 }}>
                        <div>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.customerTitle} {s.customerName} {s.customerSurname}</span>
                          <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>({s.intervalType})</span>
                        </div>
                        <span style={{ color: '#f87171', fontWeight: 700, background: 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: 4 }}>
                          {overdue}d overdue
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Filter and Search */}
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--text-muted)' }}>🔍</span>
        <input
          type="text"
          className="form-input"
          style={{ paddingLeft: 36 }}
          placeholder="Search by customer name, scheme name, or mobile…"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Schemes List Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {filteredSchemes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🪙</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)' }}>
              {searchTerm ? 'No matching schemes found' : 'No gold investment schemes yet'}
            </div>
            <div className="empty-state-text">
              {searchTerm ? 'Try a different search term' : 'Enroll a customer in a micro-investment scheme to start.'}
            </div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Scheme ID</th>
                <th>Customer</th>
                <th>Scheme Details</th>
                <th>Preset Amt</th>
                <th>Total Collected</th>
                <th>Est. Gold (22K)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchemes.map(s => {
                const goldWeight = goldRate > 0 ? (s.totalCollected / goldRate) : 0;
                return (
                  <tr key={s.id}>
                    <td>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>#{s.id}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>
                        {s.customerTitle} {s.customerName} {s.customerSurname}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {s.customerMobile}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{s.schemeName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Interval: <span style={{ textTransform: 'capitalize', color: 'var(--gold-300)' }}>{s.intervalType}</span> • Starts: {s.startDate}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                        Tenure: {s.tenureMonths || 11}m • Maturity: <span style={{ color: s.status === 'active' && new Date(s.maturityDate) <= new Date() ? '#f87171' : 'var(--text-secondary)', fontWeight: 600 }}>{s.maturityDate || '—'}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>₹{s.presetAmount.toLocaleString('en-IN')}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--gold-300)' }}>₹{s.totalCollected.toLocaleString('en-IN')}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#4ade80' }}>{goldWeight.toFixed(3)}g</span>
                    </td>
                    <td>
                      <span className={`badge ${s.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {s.status === 'active' && (
                          <button
                            className="btn-primary"
                            style={{ padding: '6px 12px', fontSize: 11 }}
                            onClick={() => {
                              setActiveScheme(s);
                              setCollectForm(prev => ({
                                ...prev,
                                collectedAmount: s.presetAmount
                              }));
                              setShowCollectModal(true);
                            }}
                          >
                            📥 Collect
                          </button>
                        )}
                        <button
                          className="btn-secondary"
                          style={{ padding: '6px 12px', fontSize: 11 }}
                          onClick={() => handleViewDetails(s)}
                        >
                          👁 History
                        </button>
                        <button
                          className="btn-secondary"
                          style={{ padding: '6px 8px', fontSize: 11, color: s.status === 'active' ? '#4ade80' : 'var(--text-muted)' }}
                          onClick={() => handleToggleStatus(s, s.status)}
                          title={s.status === 'active' ? 'Mark Completed' : 'Re-activate'}
                        >
                          {s.status === 'active' ? '✓ Complete' : '⟲ Reopen'}
                        </button>
                        {isAdmin && (
                          <button
                            className="btn-danger"
                            style={{ padding: '6px 8px', fontSize: 11 }}
                            onClick={() => handleDeleteScheme(s.id)}
                          >
                            🗑 Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* CREATE SCHEME MODAL */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <div className="modal-title">✦ Start New Gold Scheme</div>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleCreateScheme}>
                <div style={{ marginBottom: 14 }}>
                  <label className="form-label">Select Customer *</label>
                  <select
                    className="form-select"
                    value={schemeForm.customerId}
                    onChange={e => setSchemeForm(prev => ({ ...prev, customerId: e.target.value }))}
                    required
                  >
                    <option value="">-- Choose registered customer --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.surname} ({c.mobile} - {c.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label className="form-label">Scheme Name / Template *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={schemeForm.schemeName}
                    onChange={e => setSchemeForm(prev => ({ ...prev, schemeName: e.target.value }))}
                    placeholder="e.g. Daily Gold Saver"
                    required
                  />
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ padding: '3px 8px', fontSize: 10 }}
                      onClick={() => setSchemeForm(prev => ({ ...prev, schemeName: 'Daily Gold Saver' }))}
                    >
                      Daily Saver
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ padding: '3px 8px', fontSize: 10 }}
                      onClick={() => setSchemeForm(prev => ({ ...prev, schemeName: 'Weekly Gold Accumulator' }))}
                    >
                      Weekly Flexi
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ padding: '3px 8px', fontSize: 10 }}
                      onClick={() => setSchemeForm(prev => ({ ...prev, schemeName: 'Monthly Gold Scheme' }))}
                    >
                      Monthly Scheme
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label className="form-label">Interval Frequency *</label>
                    <select
                      className="form-select"
                      value={schemeForm.intervalType}
                      onChange={e => setSchemeForm(prev => ({ ...prev, intervalType: e.target.value }))}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Preset Installment *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={schemeForm.presetAmount}
                      onChange={e => {
                        const val = e.target.value;
                        if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) {
                          setSchemeForm(prev => ({ ...prev, presetAmount: val }));
                        }
                      }}
                      placeholder="Amount in ₹"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label className="form-label">Tenure (Months) *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={schemeForm.tenureMonths}
                      min="1"
                      onChange={e => setSchemeForm(prev => ({ ...prev, tenureMonths: e.target.value }))}
                      required
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 16 }}>
                      <input
                        type="checkbox"
                        checked={schemeForm.hasBonus}
                        onChange={e => setSchemeForm(prev => ({ ...prev, hasBonus: e.target.checked }))}
                        style={{ width: 16, height: 16, accentColor: 'var(--gold-400)' }}
                      />
                      <span>Includes Shop Bonus</span>
                    </label>
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label className="form-label">Start Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={schemeForm.startDate}
                    onChange={e => setSchemeForm(prev => ({ ...prev, startDate: e.target.value }))}
                    required
                  />
                </div>

                {schemeForm.startDate && (
                  <div style={{ marginBottom: 20, background: 'rgba(251,191,36,0.03)', border: '1px dashed var(--border-default)', padding: 10, borderRadius: 6, fontSize: 12 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Estimated Maturity Date: </span>
                    <strong style={{ color: 'var(--gold-300)' }}>
                      {(() => {
                        const tenure = parseInt(schemeForm.tenureMonths || 11, 10);
                        const d = new Date(schemeForm.startDate);
                        if (!isNaN(d.getTime())) {
                          d.setMonth(d.getMonth() + tenure);
                          return d.toISOString().split('T')[0];
                        }
                        return '—';
                      })()}
                    </strong>
                  </div>
                )}

                <div className="modal-footer" style={{ padding: '20px 0 0', border: 'none' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">✓ Start Scheme</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* RECORD COLLECTION MODAL */}
      {showCollectModal && activeScheme && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <div className="modal-title">✦ Record Gold Collection Payment</div>
              <button className="modal-close" onClick={() => setShowCollectModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              <div style={{ background: 'rgba(251,191,36,0.04)', border: '1px dashed var(--border-default)', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Enrollment Profile</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4, color: 'var(--text-primary)' }}>
                  {activeScheme.customerTitle} {activeScheme.customerName} {activeScheme.customerSurname}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  Scheme: {activeScheme.schemeName} ({activeScheme.intervalType})
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Preset installment: ₹{activeScheme.presetAmount.toLocaleString('en-IN')}
                </div>
              </div>

              <form onSubmit={handleRecordCollection}>
                <div style={{ marginBottom: 14 }}>
                  <label className="form-label">Collection Amount (₹) *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={collectForm.collectedAmount}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) {
                        setCollectForm(prev => ({ ...prev, collectedAmount: val }));
                      }
                    }}
                    placeholder="Amount collected"
                    required
                  />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label className="form-label">Payment Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={collectForm.collectionDate}
                    onChange={e => setCollectForm(prev => ({ ...prev, collectionDate: e.target.value }))}
                    required
                  />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '6px 0' }}>
                    <input
                      type="checkbox"
                      checked={collectForm.isBonus}
                      onChange={e => {
                        const checked = e.target.checked;
                        setCollectForm(prev => ({
                          ...prev,
                          isBonus: checked,
                          notes: checked ? 'Shop Bonus Installment' : (prev.notes === 'Shop Bonus Installment' ? '' : prev.notes)
                        }));
                      }}
                      style={{ width: 16, height: 16, accentColor: 'var(--gold-400)' }}
                    />
                    <span style={{ fontWeight: 600, color: 'var(--gold-300)' }}>Is Shop Bonus Installment?</span>
                  </label>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label className="form-label">Notes</label>
                  <input
                    type="text"
                    className="form-input"
                    value={collectForm.notes}
                    onChange={e => setCollectForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Optional details (e.g. payment mode)"
                  />
                </div>

                <div className="modal-footer" style={{ padding: '20px 0 0', border: 'none' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowCollectModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">✓ Record Payment</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* SCHEME DETAILS & COLLECTION HISTORY MODAL */}
      {showDetailsModal && activeScheme && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 650 }}>
            <div className="modal-header">
              <div className="modal-title">✦ Investment History - Scheme #{activeScheme.id}</div>
              <button className="modal-close" onClick={() => setShowDetailsModal(false)}>✕</button>
            </div>

            <div className="modal-body" style={{ padding: 20 }}>
              {/* Header profile info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20, background: 'var(--bg-elevated)', padding: 16, borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Customer Details</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
                    {activeScheme.customerTitle} {activeScheme.customerName} {activeScheme.customerSurname}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    Mobile: {activeScheme.customerMobile}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Scheme Profile</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold-300)', marginTop: 4 }}>
                    {activeScheme.schemeName}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    Type: <span style={{ textTransform: 'capitalize' }}>{activeScheme.intervalType}</span> (₹{activeScheme.presetAmount}/installment)
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    Tenure: {activeScheme.tenureMonths || 11} mos • Maturity: {activeScheme.maturityDate || '—'}
                  </div>
                  {activeScheme.hasBonus === 1 && (
                    <div style={{ fontSize: 11, color: 'var(--gold-400)', fontWeight: 600, marginTop: 2 }}>
                      ✓ Shop Bonus Eligible (₹{activeScheme.presetAmount})
                    </div>
                  )}
                </div>
              </div>

              {/* Accumulation Summary Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(74, 222, 128, 0.05)', border: '1px solid rgba(74, 222, 128, 0.2)', padding: '10px 16px', borderRadius: 8, marginBottom: 16 }}>
                <div>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Deposited Capital:</span>
                  <strong style={{ fontSize: 14, color: 'var(--text-primary)', marginLeft: 6 }}>₹{activeScheme.totalCollected.toLocaleString('en-IN')}</strong>
                </div>
                <div>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Accumulated Gold:</span>
                  <strong style={{ fontSize: 14, color: '#4ade80', marginLeft: 6 }}>{(goldRate > 0 ? (activeScheme.totalCollected / goldRate) : 0).toFixed(3)}g</strong>
                </div>
              </div>

              <div className="section-header" style={{ marginBottom: 10 }}>
                <span className="section-title">Timeline of Collections</span>
              </div>

              {/* Collections history table */}
              <div className="card" style={{ padding: 0, overflow: 'hidden', maxHeight: 300, overflowY: 'auto' }}>
                {historyLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120, gap: 10 }}>
                    <div className="spinner" style={{ width: 24, height: 24 }} />
                    <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading payment logs…</span>
                  </div>
                ) : collectionsHistory.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                    No collections recorded for this scheme yet.
                  </div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Deposited</th>
                        <th>Equivalent Gold</th>
                        <th>Notes</th>
                        {isAdmin && <th>Action</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {collectionsHistory.map(c => {
                        const gramWeight = goldRate > 0 ? (c.collectedAmount / goldRate) : 0;
                        return (
                          <tr key={c.id}>
                            <td>{c.collectionDate}</td>
                            <td>
                              <span style={{ fontWeight: 600 }}>₹{c.collectedAmount.toLocaleString('en-IN')}</span>
                              {c.isBonus === 1 && (
                                <span style={{
                                  marginLeft: 6, fontSize: 10, padding: '2px 6px',
                                  background: 'rgba(251,191,36,0.15)', color: 'var(--gold-300)',
                                  borderRadius: 4, border: '1px solid var(--gold-300)'
                                }}>
                                  Bonus
                                </span>
                              )}
                            </td>
                            <td>
                              <span style={{ color: '#4ade80', fontWeight: 600 }}>{gramWeight.toFixed(3)}g</span>
                            </td>
                            <td>
                              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.notes || '—'}</span>
                            </td>
                            {isAdmin && (
                              <td>
                                <button
                                  className="btn-danger"
                                  style={{ padding: '4px 8px', fontSize: 10 }}
                                  onClick={() => handleDeleteCollection(c.id)}
                                >
                                  Delete
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="modal-footer" style={{ padding: '20px 0 0', border: 'none' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowDetailsModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MsDigiGold;
