import React, { useState, useEffect } from 'react';
import { silverStore } from '../../db/silverRetailStore';

const GoldSilverRateInput = () => {
  const initialErp = localStorage.getItem("activeErpModule") || "gold_retail";
  const [activeTab, setActiveTab] = useState(initialErp === "silver_retail" ? "silver" : "gold");
  const [silverSubTab, setSilverSubTab] = useState("input"); // "input" or "report"

  const [goldRate, setGoldRate] = useState('');
  const [silverRate, setSilverRate] = useState('');
  const [gold24Rate, setGold24Rate] = useState('');
  const [notification, setNotification] = useState({ message: '', type: '', visible: false });
  const [submitting, setSubmitting] = useState(false);

  const showNotification = (message, type) => {
    setNotification({ message, type, visible: true });
    setTimeout(() => setNotification(prev => ({ ...prev, visible: false })), 3500);
  };

  useEffect(() => {
    const fetchCurrentRates = async () => {
      try {
        if (window.electronAPI?.getMetalRates) {
          const result = await window.electronAPI.getMetalRates();
          if (result.success && result.metal_rates && result.metal_rates.length > 0) {
            const r = result.metal_rates[0];
            if (r.gold_rate) setGoldRate(r.gold_rate.toString());
            if (r.silver_rate) setSilverRate(r.silver_rate.toString());
            if (r.gold_24_rate) setGold24Rate(r.gold_24_rate.toString());
          }
        }
      } catch (error) {
        console.error('Error fetching current rates:', error);
      }
    };
    fetchCurrentRates();
  }, []);

  const handleGoldSubmit = async (e) => {
    e.preventDefault();
    const g = goldRate.trim();
    const s = silverRate.trim();
    const g24 = gold24Rate.trim();

    if (!g || !s || !g24) {
      showNotification('Please fill in all rate fields.', 'error');
      return;
    }
    try {
      setSubmitting(true);
      if (window.electronAPI?.saveMetalRates) {
        const result = await window.electronAPI.saveMetalRates({ goldRate: g, silverRate: s, gold24Rate: g24 });
        if (result.success) {
          showNotification('Metal rates saved successfully!', 'success');
        } else {
          showNotification(`Error: ${result.error}`, 'error');
        }
      } else {
        showNotification('Rates updated locally!', 'success');
      }
    } catch (error) {
      showNotification(`Error: ${error.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 20, paddingBottom: 40 }}>
      {/* Primary ERP Mode Selector */}
      <div style={{
        display: 'flex',
        gap: 8,
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
        padding: 4,
        borderRadius: 12,
        marginBottom: 20
      }}>
        <button
          onClick={() => setActiveTab('gold')}
          style={{
            padding: '8px 18px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            border: 'none',
            background: activeTab === 'gold' ? 'linear-gradient(135deg, #fbbf24, #d97706)' : 'transparent',
            color: activeTab === 'gold' ? '#ffffff' : 'var(--text-muted)'
          }}
        >
          🏆 Gold ERP Rates
        </button>
        <button
          onClick={() => setActiveTab('silver')}
          style={{
            padding: '8px 18px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            border: 'none',
            background: activeTab === 'silver' ? 'linear-gradient(135deg, #38bdf8, #2563eb)' : 'transparent',
            color: activeTab === 'silver' ? '#ffffff' : 'var(--text-muted)'
          }}
        >
          🥈 Silver ERP Rates & Report
        </button>
      </div>

      {/* Silver Sub-Tabs: Rate Form vs Rate Change Audit Report */}
      {activeTab === 'silver' && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <button
            onClick={() => setSilverSubTab('input')}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              border: '1px solid',
              borderColor: silverSubTab === 'input' ? '#38bdf8' : 'var(--border-default)',
              background: silverSubTab === 'input' ? 'rgba(56,189,248,0.15)' : 'var(--bg-card)',
              color: silverSubTab === 'input' ? '#38bdf8' : 'var(--text-muted)'
            }}
          >
            ✏️ Silver Rate Input
          </button>
          <button
            onClick={() => setSilverSubTab('report')}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              border: '1px solid',
              borderColor: silverSubTab === 'report' ? '#fbbf24' : 'var(--border-default)',
              background: silverSubTab === 'report' ? 'rgba(251,191,36,0.15)' : 'var(--bg-card)',
              color: silverSubTab === 'report' ? '#fbbf24' : 'var(--text-muted)'
            }}
          >
            📜 Rate Audit Report & History Log
          </button>
        </div>
      )}

      {/* Notification Toast */}
      {notification.visible && (
        <div style={{
          padding: '10px 16px',
          borderRadius: 8,
          marginBottom: 16,
          fontSize: 13,
          fontWeight: 600,
          background: notification.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
          border: `1px solid ${notification.type === 'error' ? '#ef4444' : '#22c55e'}`,
          color: notification.type === 'error' ? '#f87171' : '#4ade80'
        }}>
          {notification.type === 'error' ? '❌ ' : '✅ '}
          {notification.message}
        </div>
      )}

      {activeTab === 'silver' ? (
        silverSubTab === 'input' ? (
          <SilverRateForm showNotification={showNotification} />
        ) : (
          <SilverRateAuditReport />
        )
      ) : (
        <div style={{ width: '100%', maxWidth: 500 }}>
          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg, #fbbf24, #d97706)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                boxShadow: '0 4px 14px rgba(251,191,36,0.3)',
              }}>📊</div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Gold Metal Rates</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Update daily Gold precious metal prices</div>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="card">
            <form onSubmit={handleGoldSubmit}>
              <RateField
                id="goldRate"
                label="Gold Rate — 22 Carat"
                icon="🥇"
                iconColor="#fbbf24"
                value={goldRate}
                onChange={e => setGoldRate(e.target.value)}
                placeholder="e.g. 7200"
              />

              <RateField
                id="gold24Rate"
                label="Gold Rate — 24 Carat"
                icon="✨"
                iconColor="#f59e0b"
                value={gold24Rate}
                onChange={e => setGold24Rate(e.target.value)}
                placeholder="e.g. 7800"
              />

              <RateField
                id="silverRate"
                label="Silver Rate"
                icon="🪙"
                iconColor="#94a3b8"
                value={silverRate}
                onChange={e => setSilverRate(e.target.value)}
                placeholder="e.g. 90"
                isLast
              />

              <div className="divider-gold" style={{ margin: '20px 0' }} />

              {(goldRate || gold24Rate || silverRate) && (
                <div style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 10,
                  padding: 14,
                  marginBottom: 20,
                  display: 'flex',
                  gap: 16,
                  flexWrap: 'wrap',
                }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase', width: '100%' }}>
                    Preview (per gram)
                  </span>
                  {goldRate && <PreviewItem label="22K" value={`₹${goldRate}`} color="#fbbf24" />}
                  {gold24Rate && <PreviewItem label="24K" value={`₹${gold24Rate}`} color="#f59e0b" />}
                  {silverRate && <PreviewItem label="Silver" value={`₹${silverRate}`} color="#94a3b8" />}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', fontSize: 14, padding: '12px 24px' }}
              >
                {submitting ? 'Saving…' : '💾 Save Gold Rates'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

function SilverRateForm({ showNotification }) {
  const currentRates = silverStore.getRates();

  const [boardRate, setBoardRate] = useState(currentRates.boardRate ?? '250');
  const [rtgsPureRate, setRtgsPureRate] = useState(currentRates.rtgsPureRate ?? '250');
  const [rtgsKachaRate, setRtgsKachaRate] = useState(currentRates.rtgsKachaRate ?? '245');
  const [cashPureRate, setCashPureRate] = useState(currentRates.cashPureRate ?? '245');
  const [cashKachaRate, setCashKachaRate] = useState(currentRates.cashKachaRate ?? '250');
  const [averageRate, setAverageRate] = useState(currentRates.averageRate ?? '245');
  const [rateDate, setRateDate] = useState(currentRates.rateDate || new Date().toISOString().split('T')[0]);
  const [lastUpdated, setLastUpdated] = useState(currentRates.lastUpdated);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const r = silverStore.getRates();
    setBoardRate(r.boardRate ?? '250');
    setRtgsPureRate(r.rtgsPureRate ?? '250');
    setRtgsKachaRate(r.rtgsKachaRate ?? '245');
    setCashPureRate(r.cashPureRate ?? '245');
    setCashKachaRate(r.cashKachaRate ?? '250');
    setAverageRate(r.averageRate ?? '245');
    setRateDate(r.rateDate || new Date().toISOString().split('T')[0]);
    setLastUpdated(r.lastUpdated);
  }, []);

  const handleReset = () => {
    const r = silverStore.getRates();
    setBoardRate(r.boardRate ?? '250');
    setRtgsPureRate(r.rtgsPureRate ?? '250');
    setRtgsKachaRate(r.rtgsKachaRate ?? '245');
    setCashPureRate(r.cashPureRate ?? '245');
    setCashKachaRate(r.cashKachaRate ?? '250');
    setAverageRate(r.averageRate ?? '245');
    setRateDate(r.rateDate || new Date().toISOString().split('T')[0]);
    showNotification('Reverted to last saved rates.', 'info');
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!boardRate) {
      showNotification('Board Rate (22ct) is required.', 'error');
      return;
    }
    setSaving(true);
    const updatedRates = {
      boardRate: parseFloat(boardRate) || 0,
      rtgsPureRate: parseFloat(rtgsPureRate) || 0,
      rtgsKachaRate: parseFloat(rtgsKachaRate) || 0,
      cashPureRate: parseFloat(cashPureRate) || 0,
      cashKachaRate: parseFloat(cashKachaRate) || 0,
      averageRate: parseFloat(averageRate) || 0,
      rateDate,
    };
    
    const role = localStorage.getItem("goldApp_userRole");
    const org = JSON.parse(localStorage.getItem("goldApp_org") || "null");
    const userContext = { role, org };

    const saved = silverStore.setRates(updatedRates, userContext);
    setLastUpdated(saved.lastUpdated);
    setSaving(false);
    showNotification('Silver rates saved successfully & audit logged!', 'success');
  };

  const formatTimestamp = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    const day = String(date.getDate()).padStart(2, '0');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${day}-${month}-${year}, ${String(hours).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
  };

  return (
    <div className="card" style={{ padding: '32px 36px', borderRadius: 16, background: 'var(--bg-card)', border: '1px solid var(--border-default)', maxWidth: 840, width: '100%' }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 28px 0', color: 'var(--text-primary)' }}>
        Silver Rate
      </h2>

      <form onSubmit={handleSave}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px 32px', marginBottom: 32 }}>
          {/* Column 1 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <UnderlineInput
              label="Board Rate(22ct)"
              required
              value={boardRate}
              onChange={e => setBoardRate(e.target.value)}
              placeholder="250"
            />
            <UnderlineInput
              label="Cash-Pure Rate"
              value={cashPureRate}
              onChange={e => setCashPureRate(e.target.value)}
              placeholder="245"
            />
            <UnderlineInput
              label="Date"
              type="date"
              value={rateDate}
              onChange={e => setRateDate(e.target.value)}
            />
          </div>

          {/* Column 2 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <UnderlineInput
              label="RTGS-Pure Rate"
              value={rtgsPureRate}
              onChange={e => setRtgsPureRate(e.target.value)}
              placeholder="250"
            />
            <UnderlineInput
              label="Cash-Kacha Rate"
              value={cashKachaRate}
              onChange={e => setCashKachaRate(e.target.value)}
              placeholder="250"
            />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
              last updated On : {formatTimestamp(lastUpdated)}
            </div>
          </div>

          {/* Column 3 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <UnderlineInput
              label="RTGS-Kacha Rate"
              value={rtgsKachaRate}
              onChange={e => setRtgsKachaRate(e.target.value)}
              placeholder="245"
            />
            <UnderlineInput
              label="Average Rate"
              value={averageRate}
              onChange={e => setAverageRate(e.target.value)}
              placeholder="245"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 24, paddingTop: 12 }}>
          <button
            type="button"
            onClick={handleReset}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              padding: '6px 12px'
            }}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            style={{
              background: 'none',
              border: 'none',
              color: '#3b82f6',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              padding: '6px 12px'
            }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}

function SilverRateAuditReport() {
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setHistory(silverStore.getRateHistory());
  }, []);

  const formatTimestamp = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    const day = String(date.getDate()).padStart(2, '0');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${day}-${month}-${year}, ${String(hours).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
  };

  const filteredHistory = history.filter(item => 
    (item.updatedBy || '').toLowerCase().includes(search.toLowerCase()) ||
    (item.date || '').includes(search) ||
    (item.loginSlug || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="card" style={{ padding: '28px 32px', borderRadius: 16, background: 'var(--bg-card)', border: '1px solid var(--border-default)', maxWidth: 960, width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            📜 Daily Silver Rate Audit Report
          </h2>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Historical log of prices set, effective dates, and logged-in user accounts
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 10, padding: '6px 12px', width: 260 }}>
          <span style={{ fontSize: 14 }}>🔍</span>
          <input
            type="text"
            placeholder="Search by date or login user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: 12, outline: 'none' }}
          />
        </div>
      </div>

      {filteredHistory.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          No rate change logs found yet. Save rates in the Rate Input form to generate audit logs.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', fontSize: 12 }}>
            <thead>
              <tr>
                <th>Effective Date</th>
                <th>Timestamp</th>
                <th>Set By (Login Account)</th>
                <th>Board Rate (22ct)</th>
                <th>RTGS Pure / Kacha</th>
                <th>Cash Pure / Kacha</th>
                <th>Average Rate</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 700, color: '#38bdf8' }}>{item.date}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{formatTimestamp(item.timestamp)}</td>
                  <td>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 6,
                      background: 'rgba(251,191,36,0.1)',
                      color: 'var(--gold-200)',
                      border: '1px solid rgba(251,191,36,0.25)'
                    }}>
                      👤 {item.updatedBy || 'Store Partner'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 800, color: '#38bdf8' }}>₹ {item.boardRate}</td>
                  <td>₹ {item.rtgsPureRate} / ₹ {item.rtgsKachaRate}</td>
                  <td>₹ {item.cashPureRate} / ₹ {item.cashKachaRate}</td>
                  <td style={{ fontWeight: 800, color: '#34d399' }}>₹ {item.averageRate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function UnderlineInput({ label, required, value, onChange, placeholder, type = "text" }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: required ? '#3b82f6' : 'var(--text-muted)' }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        style={{
          width: '100%',
          padding: '6px 0',
          fontSize: 16,
          fontWeight: 600,
          color: 'var(--text-primary)',
          background: 'transparent',
          border: 'none',
          borderBottom: required ? '2px solid #3b82f6' : '1px solid var(--border-default)',
          outline: 'none'
        }}
      />
    </div>
  );
}

function RateField({ id, label, icon, iconColor, value, onChange, placeholder, isLast }) {
  return (
    <div style={{ marginBottom: isLast ? 0 : 18 }}>
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <span style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          fontSize: 16, pointerEvents: 'none',
        }}>{icon}</span>
        <input
          type="number"
          id={id}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required
          className="form-input"
          style={{ paddingLeft: 40, paddingRight: 52 }}
        />
        <span style={{
          position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
          fontSize: 11, fontWeight: 700, color: iconColor,
          background: `${iconColor}18`, padding: '2px 7px', borderRadius: 4,
        }}>₹/g</span>
      </div>
    </div>
  );
}

function PreviewItem({ label, value, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1 }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 800, color }}>{value}</span>
    </div>
  );
}

export default GoldSilverRateInput;