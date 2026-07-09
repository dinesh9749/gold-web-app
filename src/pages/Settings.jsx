import { useState, useEffect } from 'react';

export default function Settings() {
  const [nextInvoiceNo, setNextInvoiceNo] = useState('');
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
      if (res?.next_invoice_number) {
        setNextInvoiceNo(res.next_invoice_number);
      } else {
        setNextInvoiceNo('INV-1001');
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
    if (!nextInvoiceNo.trim()) {
      setErrorMessage("Invoice number sequence cannot be blank.");
      return;
    }
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const ok = await window.electronAPI?.updateOrganizationSettings(nextInvoiceNo.trim());
      if (ok) {
        setSuccessMessage("Invoice number sequence updated successfully!");
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

      {/* Invoice Sequence Settings Card */}
      <div className="card" style={{ marginBottom: 20, maxWidth: 600 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 16 }}>
          ⚙️ Invoice Number Configuration
        </div>

        {loading ? (
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Loading configurations...</div>
        ) : (
          <form onSubmit={handleSaveSettings}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="form-label">Next Invoice Number Sequence</label>
                <input
                  type="text"
                  value={nextInvoiceNo}
                  onChange={e => setNextInvoiceNo(e.target.value)}
                  className="form-input"
                  placeholder="e.g. INV-1001, 2026/0001"
                  required
                />
                <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                  Provide the start sequence format. It will auto-increment (e.g., INV-1001 will count to INV-1002 upon invoice save).
                </span>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary"
                style={{ width: 'fit-content', padding: '8px 16px', fontSize: 12 }}
              >
                {saving ? 'Saving...' : 'Save Sequence'}
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
