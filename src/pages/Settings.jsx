import { useState, useEffect } from 'react';

export default function Settings() {
  const [apiInfo, setApiInfo] = useState(null);
  const [copied, setCopied]   = useState(false);

  useEffect(() => {
    window.electronAPI?.getApiInfo?.().then(info => setApiInfo(info)).catch(() => {});
  }, []);

  const copy = (text) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

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
          <div className="section-sub">App configuration and mobile access</div>
        </div>
      </div>

      {/* Mobile Access Card */}
      <div className="card" style={{ marginBottom: 20, maxWidth: 600 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, fontSize: 20,
            background: 'linear-gradient(135deg, #fbbf24, #d97706)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>📱</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Mobile Attendance Report</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>View on phone via same Wi-Fi network</div>
          </div>
          <div style={{
            marginLeft: 'auto', fontSize: 11, fontWeight: 700, padding: '4px 10px',
            borderRadius: 20, background: 'rgba(74,222,128,0.1)', border: '1px solid #4ade80',
            color: '#4ade80',
          }}>● Running</div>
        </div>

        {apiInfo ? (
          <>
            <div style={{
              background: 'rgba(251,191,36,0.05)', border: '1px solid var(--border-default)',
              borderRadius: 10, padding: 16, marginBottom: 14,
            }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Open this URL on your phone browser
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  flex: 1, fontSize: 18, fontWeight: 800, color: 'var(--gold-300)',
                  fontFamily: 'monospace', letterSpacing: '0.04em',
                }}>{apiInfo.url}</div>
                <button onClick={() => copy(apiInfo.url)} style={{
                  padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                  border: '1px solid var(--border-default)', cursor: 'pointer',
                  background: copied ? 'rgba(74,222,128,0.15)' : 'var(--bg-elevated)',
                  color: copied ? '#4ade80' : 'var(--text-secondary)',
                  transition: 'all 0.2s',
                }}>{copied ? '✓ Copied' : '📋 Copy'}</button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'PC IP Address', value: apiInfo.ip, icon: '🖥' },
                { label: 'Port',          value: apiInfo.port, icon: '🔌' },
              ].map(item => (
                <div key={item.label} style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase' }}>
                    {item.icon} {item.label}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{item.value}</div>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: 14, padding: '10px 14px', borderRadius: 8,
              background: 'rgba(251,191,36,0.05)', border: '1px solid var(--border-subtle)',
              fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6,
            }}>
              💡 <strong style={{ color: 'var(--text-secondary)' }}>How to use:</strong> Connect your phone to the same Wi-Fi as this PC →
              Open your phone browser → Type the URL above → See daily &amp; monthly attendance reports
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0' }}>
            <div className="spinner" />
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Fetching server info…</span>
          </div>
        )}
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
          { label: 'Database',    value: 'SQLite (local)' },
          { label: 'Mobile API',  value: `Port ${apiInfo?.port || 3456}` },
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
