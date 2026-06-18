import { useState } from 'react';

export default function Settings() {
  const [passcode, setPasscode] = useState(() => localStorage.getItem("goldApp_adminPasscode") || "");
  
  // Form states
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSetPasscode = (e) => {
    e.preventDefault();
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setErrorMessage("Passcode must be exactly 4 digits.");
      return;
    }
    localStorage.setItem("goldApp_adminPasscode", newPin);
    localStorage.setItem("goldApp_adminMode", "true");
    setPasscode(newPin);
    setNewPin("");
    setErrorMessage("");
    setSuccessMessage("Passcode set successfully! Admin mode is active.");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleChangePasscode = (e) => {
    e.preventDefault();
    if (currentPin !== passcode) {
      setErrorMessage("Incorrect current passcode.");
      return;
    }
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setErrorMessage("New passcode must be exactly 4 digits.");
      return;
    }
    if (newPin !== confirmPin) {
      setErrorMessage("New passcodes do not match.");
      return;
    }
    localStorage.setItem("goldApp_adminPasscode", newPin);
    setPasscode(newPin);
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
    setErrorMessage("");
    setSuccessMessage("Passcode updated successfully!");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleDisablePasscode = () => {
    const pin = prompt("Enter current passcode to disable security lock:");
    if (pin === null) return;
    if (pin !== passcode) {
      alert("Incorrect passcode PIN.");
      return;
    }
    localStorage.removeItem("goldApp_adminPasscode");
    localStorage.setItem("goldApp_adminMode", "true");
    setPasscode("");
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
    setErrorMessage("");
    setSuccessMessage("Admin passcode disabled. App is now unlocked.");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  return (
    <div>
      {/* Header */}
      <div className="section-header" style={{ marginBottom: 24 }}>
        <div>
          <div className="section-title" style={{ fontSize: 18 }}>Settings</div>
          <div className="section-sub">App configuration and security settings</div>
        </div>
      </div>

      {/* Passcode Security Card */}
      <div className="card" style={{ marginBottom: 20, maxWidth: 600 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, fontSize: 20,
            background: 'linear-gradient(135deg, #fbbf24, #d97706)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>🔒</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Admin Passcode Lock</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Secure Settings, Rates, and Delete operations</div>
          </div>
          <div style={{
            marginLeft: 'auto', fontSize: 11, fontWeight: 700, padding: '4px 10px',
            borderRadius: 20, 
            background: passcode ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)', 
            border: `1px solid ${passcode ? '#4ade80' : '#f87171'}`,
            color: passcode ? '#4ade80' : '#f87171',
          }}>
            {passcode ? '🔐 Enabled' : '🔓 Disabled'}
          </div>
        </div>

        {successMessage && (
          <div style={{ padding: '8px 12px', background: 'rgba(74,222,128,0.1)', border: '1px solid #4ade80', color: '#4ade80', borderRadius: 8, fontSize: 12, marginBottom: 14, fontWeight: 600 }}>
            ✓ {successMessage}
          </div>
        )}
        {errorMessage && (
          <div style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid #f87171', color: '#f87171', borderRadius: 8, fontSize: 12, marginBottom: 14, fontWeight: 600 }}>
            ⚠️ {errorMessage}
          </div>
        )}

        {!passcode ? (
          <form onSubmit={handleSetPasscode}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label className="form-label">Set 4-Digit Admin Passcode PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  className="form-input"
                  placeholder="Enter 4 digits"
                  value={newPin}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === "" || /^[0-9]+$/.test(val)) {
                      setNewPin(val);
                    }
                  }}
                  required
                />
              </div>
              <button type="submit" className="btn-primary">Set Lock PIN</button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleChangePasscode}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="form-label">Current PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    className="form-input"
                    value={currentPin}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === "" || /^[0-9]+$/.test(val)) {
                        setCurrentPin(val);
                      }
                    }}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">New 4-Digit PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    className="form-input"
                    value={newPin}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === "" || /^[0-9]+$/.test(val)) {
                        setNewPin(val);
                      }
                    }}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="form-label">Confirm New PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  className="form-input"
                  value={confirmPin}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === "" || /^[0-9]+$/.test(val)) {
                      setConfirmPin(val);
                    }
                  }}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', marginTop: 8 }}>
                <button type="button" className="btn-secondary" style={{ color: '#f87171', borderColor: 'rgba(239,68,68,0.2)' }} onClick={handleDisablePasscode}>
                  Disable Passcode Lock
                </button>
                <button type="submit" className="btn-primary">Change PIN</button>
              </div>
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
