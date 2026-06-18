import React, { useState, useEffect } from 'react';

const GoldSilverRateInput = () => {
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
        const result = await window.electronAPI.getMetalRates();
        if (result.success && result.metal_rates && result.metal_rates.length > 0) {
          const r = result.metal_rates[0];
          if (r.gold_rate) setGoldRate(r.gold_rate.toString());
          if (r.silver_rate) setSilverRate(r.silver_rate.toString());
          if (r.gold_24_rate) setGold24Rate(r.gold_24_rate.toString());
        }
      } catch (error) {
        console.error('Error fetching current rates:', error);
      }
    };
    fetchCurrentRates();
  }, []);

  const handleSubmit = async (e) => {
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
      const result = await window.electronAPI.saveMetalRates({ goldRate: g, silverRate: s, gold24Rate: g24 });
      if (result.success) {
        showNotification('Metal rates saved successfully!', 'success');
      } else {
        showNotification(`Error: ${result.error}`, 'error');
      }
    } catch (error) {
      showNotification(`Error: ${error.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: 20 }}>
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
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Metal Rates</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Update today's precious metal prices</div>
            </div>
          </div>
        </div>

        {/* Notification */}
        {notification.visible && (
          <div className={`toast ${notification.type === 'success' ? 'toast-success' : 'toast-error'}`}>
            <span>{notification.type === 'success' ? '✅' : '❌'}</span>
            {notification.message}
          </div>
        )}

        {/* Form Card */}
        <div className="card">
          <form onSubmit={handleSubmit}>

            {/* 22K Gold */}
            <RateField
              id="goldRate"
              label="Gold Rate — 22 Carat"
              icon="🥇"
              iconColor="#fbbf24"
              value={goldRate}
              onChange={e => setGoldRate(e.target.value)}
              placeholder="e.g. 7200"
            />

            {/* 24K Gold */}
            <RateField
              id="gold24Rate"
              label="Gold Rate — 24 Carat"
              icon="✨"
              iconColor="#f59e0b"
              value={gold24Rate}
              onChange={e => setGold24Rate(e.target.value)}
              placeholder="e.g. 7800"
            />

            {/* Silver */}
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

            {/* Divider */}
            <div className="divider-gold" style={{ margin: '20px 0' }} />

            {/* Live preview */}
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

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', fontSize: 14, padding: '12px 24px' }}
            >
              {submitting ? (
                <>
                  <div style={{
                    width: 14, height: 14, borderRadius: '50%',
                    border: '2px solid rgba(0,0,0,0.2)',
                    borderTop: '2px solid #000',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  Saving…
                </>
              ) : (
                <>💾 Save Rates</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

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