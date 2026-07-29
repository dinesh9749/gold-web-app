import { useState, useEffect } from 'react';
import { supabaseAPI } from '../../db/supabaseAPI';

export default function Settings() {
  const [nextInvoiceNo, setNextInvoiceNo] = useState('');
  const [nextReceiptNo, setNextReceiptNo] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // States & Cities Master Management
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [newStateName, setNewStateName] = useState('');
  const [newStateCode, setNewStateCode] = useState('');
  const [newCityName, setNewCityName] = useState('');
  const [newCityState, setNewCityState] = useState('');
  const [addingState, setAddingState] = useState(false);
  const [addingCity, setAddingCity] = useState(false);

  useEffect(() => {
    loadSettings();
    loadMasterLocationData();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const api = window.electronAPI || supabaseAPI;
      const res = await api.getOrganizationSettings();
      if (res) {
        setNextInvoiceNo(res.next_invoice_number || 'INV-1001');
        setNextReceiptNo(res.next_receipt_number || 'REC-1001');
      } else {
        setNextInvoiceNo('INV-1001');
        setNextReceiptNo('REC-1001');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to load settings from database.");
    } finally {
      setLoading(false);
    }
  };

  const loadMasterLocationData = async () => {
    try {
      const api = window.electronAPI || supabaseAPI;
      const [stList, ctList] = await Promise.all([
        api.getAllStates ? api.getAllStates() : [],
        api.getAllCities ? api.getAllCities() : []
      ]);
      setStates(stList || []);
      setCities(ctList || []);
    } catch (err) {
      console.error("Error loading location master data:", err);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!nextInvoiceNo.trim() || !nextReceiptNo.trim()) {
      setErrorMessage("Sequence numbers cannot be blank.");
      return;
    }
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const api = window.electronAPI || supabaseAPI;
      const ok = await api.updateOrganizationSettings(
        nextInvoiceNo.trim(),
        nextReceiptNo.trim()
      );
      if (ok) {
        setSuccessMessage("Sequence settings updated successfully!");
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage("Failed to save sequence settings.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Error occurred while saving settings.");
    } finally {
      setSaving(false);
    }
  };

  // State Add / Remove
  const handleAddState = async (e) => {
    e.preventDefault();
    if (!newStateName.trim()) return;
    setAddingState(true);
    try {
      const api = window.electronAPI || supabaseAPI;
      await api.addState(newStateName.trim(), newStateCode.trim().toUpperCase());
      setNewStateName('');
      setNewStateCode('');
      setSuccessMessage(`State "${newStateName.trim()}" added successfully.`);
      await loadMasterLocationData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to add state.");
    } finally {
      setAddingState(false);
    }
  };

  const handleDeleteState = async (id, name) => {
    if (!window.confirm(`Remove state "${name}"?`)) return;
    try {
      const api = window.electronAPI || supabaseAPI;
      await api.deleteState(id);
      setSuccessMessage(`State "${name}" removed.`);
      await loadMasterLocationData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to delete state.");
    }
  };

  // City Add / Remove
  const handleAddCity = async (e) => {
    e.preventDefault();
    if (!newCityName.trim()) return;
    setAddingCity(true);
    try {
      const api = window.electronAPI || supabaseAPI;
      await api.addCity(newCityName.trim(), newCityState.trim());
      setNewCityName('');
      setNewCityState('');
      setSuccessMessage(`City "${newCityName.trim()}" added successfully.`);
      await loadMasterLocationData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to add city.");
    } finally {
      setAddingCity(false);
    }
  };

  const handleDeleteCity = async (id, name) => {
    if (!window.confirm(`Remove city "${name}"?`)) return;
    try {
      const api = window.electronAPI || supabaseAPI;
      await api.deleteCity(id);
      setSuccessMessage(`City "${name}" removed.`);
      await loadMasterLocationData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to delete city.");
    }
  };

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Header */}
      <div className="section-header" style={{ marginBottom: 24 }}>
        <div>
          <div className="section-title" style={{ fontSize: 18 }}>Settings & Master Data</div>
          <div className="section-sub">Configure app document sequences, cities, and states</div>
        </div>
      </div>

      {successMessage && (
        <div style={{
          padding: '10px 14px',
          background: 'rgba(74,222,128,0.1)',
          border: '1px solid #4ade80',
          color: '#4ade80',
          borderRadius: 8,
          fontSize: 12,
          marginBottom: 16,
          fontWeight: 600,
          maxWidth: 700
        }}>
          ✓ {successMessage}
        </div>
      )}

      {errorMessage && (
        <div style={{
          padding: '10px 14px',
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid #f87171',
          color: '#f87171',
          borderRadius: 8,
          fontSize: 12,
          marginBottom: 16,
          fontWeight: 600,
          maxWidth: 700
        }}>
          ⚠️ {errorMessage}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20, maxWidth: 700 }}>
        {/* Document Number Sequences Settings Card */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold-300)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            ⚙️ Document Number Sequences
          </div>

          {loading ? (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Loading configurations...</div>
          ) : (
            <form onSubmit={handleSaveSettings}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="form-label">Next Invoice Number</label>
                    <input
                      type="text"
                      value={nextInvoiceNo}
                      onChange={e => setNextInvoiceNo(e.target.value)}
                      className="form-input"
                      placeholder="e.g. INV-1001"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Next Receipt Number</label>
                    <input
                      type="text"
                      value={nextReceiptNo}
                      onChange={e => setNextReceiptNo(e.target.value)}
                      className="form-input"
                      placeholder="e.g. REC-1001"
                      required
                    />
                  </div>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Provide starting baseline numbers. Invoices and Receipts will auto-increment continuously from these values.
                </span>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary"
                  style={{ width: 'fit-content', padding: '8px 16px', fontSize: 12, fontWeight: 700 }}
                >
                  {saving ? 'Saving...' : 'Save Sequence Settings'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* 🏙️ City & State Master Management Card */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold-300)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            🏙️ State & City Master Directory
          </div>

          {/* Section A: State Master */}
          <div style={{ marginBottom: 24, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
              1. States Management ({states.length})
            </div>

            {/* Add State Form */}
            <form onSubmit={handleAddState} style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <input
                type="text"
                value={newStateName}
                onChange={e => setNewStateName(e.target.value)}
                className="form-input"
                placeholder="State Name (e.g. Tamil Nadu)"
                style={{ flex: 1, fontSize: 12 }}
                required
              />
              <input
                type="text"
                value={newStateCode}
                onChange={e => setNewStateCode(e.target.value)}
                className="form-input"
                placeholder="Code (e.g. TN)"
                style={{ width: 90, fontSize: 12 }}
              />
              <button type="submit" disabled={addingState} className="btn-primary" style={{ padding: '6px 14px', fontSize: 12, fontWeight: 700 }}>
                {addingState ? '...' : '+ Add State'}
              </button>
            </form>

            {/* Active States Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {states.map(s => (
                <div key={s.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 20,
                  background: 'rgba(251,191,36,0.08)',
                  border: '1px solid var(--border-default)',
                  fontSize: 12,
                  color: 'var(--gold-300)',
                  fontWeight: 600
                }}>
                  <span>{s.name} {s.code ? `(${s.code})` : ''}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteState(s.id, s.name)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#f87171',
                      cursor: 'pointer',
                      fontSize: 12,
                      padding: '0 2px',
                      lineHeight: 1
                    }}
                    title={`Remove ${s.name}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
              {states.length === 0 && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No states added yet.</span>}
            </div>
          </div>

          {/* Section B: City Master */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
              2. Cities Management ({cities.length})
            </div>

            {/* Add City Form */}
            <form onSubmit={handleAddCity} style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <input
                type="text"
                value={newCityName}
                onChange={e => setNewCityName(e.target.value)}
                className="form-input"
                placeholder="City Name (e.g. Madurai)"
                style={{ flex: 1, fontSize: 12 }}
                required
              />
              <select
                value={newCityState}
                onChange={e => setNewCityState(e.target.value)}
                className="form-select"
                style={{ flex: 1, fontSize: 12 }}
              >
                <option value="">Select State (Optional)</option>
                {states.map(st => (
                  <option key={st.id} value={st.name}>{st.name}</option>
                ))}
              </select>
              <button type="submit" disabled={addingCity} className="btn-primary" style={{ padding: '6px 14px', fontSize: 12, fontWeight: 700 }}>
                {addingCity ? '...' : '+ Add City'}
              </button>
            </form>

            {/* Active Cities Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {cities.map(c => (
                <div key={c.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 20,
                  background: 'rgba(56,189,248,0.08)',
                  border: '1px solid rgba(56,189,248,0.25)',
                  fontSize: 12,
                  color: '#38bdf8',
                  fontWeight: 600
                }}>
                  <span>{c.name} {c.stateName ? `(${c.stateName})` : ''}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteCity(c.id, c.name)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#f87171',
                      cursor: 'pointer',
                      fontSize: 12,
                      padding: '0 2px',
                      lineHeight: 1
                    }}
                    title={`Remove ${c.name}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
              {cities.length === 0 && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No cities added yet.</span>}
            </div>
          </div>
        </div>

        {/* App info */}
        <div className="card" style={{ maxWidth: 700 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12 }}>ℹ️ App Info</div>
          {[
            { label: 'App Name',    value: 'DK Nova Technologies Gold & Silver ERP' },
            { label: 'Version',     value: '2.0.0' },
            { label: 'Database',    value: 'Supabase (cloud)' },
          ].map(row => (
            <div key={row.label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '9px 0', borderBottom: '1px solid var(--border-subtle)',
            }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{row.label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
