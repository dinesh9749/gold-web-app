import { useState, useEffect } from 'react';

export default function Settings() {
  const [nextInvoiceNo, setNextInvoiceNo] = useState('');
  const [nextReceiptNo, setNextReceiptNo] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await window.electronAPI?.getOrganizationSettings();
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
      const ok = await window.electronAPI?.updateOrganizationSettings(
        nextInvoiceNo.trim(),
        nextReceiptNo.trim()
      );
      if (ok) {
        setSuccessMessage("Settings updated successfully!");
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage("Failed to save settings.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Error occurred while saving settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="section-header" style={{ marginBottom: 24 }}>
        <div>
          <div className="section-title" style={{ fontSize: 18 }}>Settings</div>
          <div className="section-sub">App configuration settings</div>
        </div>
      </div>

      {successMessage && (
        <div style={{
          padding: '8px 12px',
          background: 'rgba(74,222,128,0.1)',
          border: '1px solid #4ade80',
          color: '#4ade80',
          borderRadius: 8,
          fontSize: 12,
          marginBottom: 14,
          fontWeight: 600,
          maxWidth: 600
        }}>
          ✓ {successMessage}
        </div>
      )}

      {errorMessage && (
        <div style={{
          padding: '8px 12px',
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid #f87171',
          color: '#f87171',
          borderRadius: 8,
          fontSize: 12,
          marginBottom: 14,
          fontWeight: 600,
          maxWidth: 600
        }}>
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Invoice & Receipt Sequence Settings Card */}
      <div className="card" style={{ marginBottom: 20, maxWidth: 600 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 16 }}>
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
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                Provide the start sequence formats. They will auto-increment automatically (e.g. REC-1001 increments to REC-1002 on saving a receipt).
              </span>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary"
                style={{ width: 'fit-content', padding: '8px 16px', fontSize: 12 }}
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* App info */}
      <div className="card" style={{ maxWidth: 600 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12 }}>ℹ️ App Info</div>
        {[
          { label: 'App Name',    value: 'MS Gold Attendance Manager' },
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
  );
}
