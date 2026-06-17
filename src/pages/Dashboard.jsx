import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [dateTime, setDateTime] = useState(new Date());
  const [rates, setRates] = useState({ gold22: 0, gold24: 0, silver: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMetalRates = async () => {
      try {
        setLoading(true);
        const result = await window.electronAPI.getMetalRates();
        if (result.success && result.metal_rates && result.metal_rates.length > 0) {
          const r = result.metal_rates[0];
          setRates({ gold22: r.gold_rate, gold24: r.gold_24_rate, silver: r.silver_rate });
        } else {
          setError('No rates available. Please update rates.');
        }
      } catch (err) {
        setError('Failed to load rates');
      } finally {
        setLoading(false);
      }
    };
    fetchMetalRates();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = dateTime.toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const formattedTime = dateTime.toLocaleTimeString('en-US', {
    hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'
  });

  const gold22_8g = (rates.gold22 * 8).toLocaleString('en-IN');
  const gold24_8g = (rates.gold24 * 8).toLocaleString('en-IN');
  const silver_8g = (rates.silver * 8).toLocaleString('en-IN');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── HERO DATE/TIME BAR ─────────────────────────────── */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 16,
        padding: '20px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 20,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Glow accent */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, transparent, #fbbf24, transparent)',
        }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}>Today</div>
          <div style={{
            fontSize: 18,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #fcd34d, #f59e0b)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>{formattedDate}</div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(251,191,36,0.06)',
          border: '1px solid var(--border-strong)',
          borderRadius: 12,
          padding: '10px 20px',
        }}>
          <span style={{ fontSize: 16 }}>🕐</span>
          <span className="clock-display" style={{
            fontSize: 28,
            fontWeight: 700,
            color: '#4ade80',
            letterSpacing: 2,
            textShadow: '0 0 20px rgba(74, 222, 128, 0.4)',
          }}>{formattedTime}</span>
        </div>
      </div>

      {/* ── RATE CARDS ─────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, gap: 16 }}>
          <div className="spinner" />
          <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading metal rates…</span>
        </div>
      ) : error ? (
        <div style={{
          background: 'rgba(239,68,68,0.06)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 12,
          padding: '20px 24px',
          color: '#f87171',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span>⚠️</span> {error}
        </div>
      ) : (
        <>
          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 3, height: 18, background: 'linear-gradient(180deg, #fbbf24, #d97706)', borderRadius: 2 }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Live Metal Rates
            </span>
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            {/* 22K Gold */}
            <RateCard
              icon="🥇"
              label="Gold 22 Carat"
              carat="22K"
              rate={rates.gold22}
              price8g={gold22_8g}
              colorClass="rate-card-gold"
              accentColor="#fbbf24"
            />
            {/* 24K Gold */}
            <RateCard
              icon="✨"
              label="Gold 24 Carat"
              carat="24K"
              rate={rates.gold24}
              price8g={gold24_8g}
              colorClass="rate-card-gold"
              accentColor="#f59e0b"
            />
            {/* Silver */}
            <RateCard
              icon="🪙"
              label="Silver"
              carat="999"
              rate={rates.silver}
              price8g={silver_8g}
              colorClass="rate-card-silver"
              accentColor="#94a3b8"
            />
          </div>

          {/* Quick summary bar */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 12,
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 24,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase' }}>
              Per Gram Today
            </span>
            <div style={{ height: 14, width: 1, background: 'var(--border-default)' }} />
            <QuickStat label="22K Gold" value={`₹${rates.gold22.toLocaleString('en-IN')}`} color="#fbbf24" />
            <QuickStat label="24K Gold" value={`₹${rates.gold24.toLocaleString('en-IN')}`} color="#f59e0b" />
            <QuickStat label="Silver" value={`₹${rates.silver.toLocaleString('en-IN')}`} color="#94a3b8" />
          </div>
        </>
      )}
    </div>
  );
}

function RateCard({ icon, label, carat, rate, price8g, colorClass, accentColor }) {
  return (
    <div className={`rate-card ${colorClass}`} style={{ '--card-color': accentColor }}>
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
            {label}
          </div>
        </div>
        <div style={{
          background: `${accentColor}18`,
          border: `1px solid ${accentColor}40`,
          borderRadius: 6,
          padding: '3px 8px',
          fontSize: 11,
          fontWeight: 800,
          color: accentColor,
          letterSpacing: 1,
        }}>{carat}</div>
      </div>

      {/* Price */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: 0.5 }}>Per Gram</div>
        <div style={{
          fontSize: 26,
          fontWeight: 800,
          color: accentColor,
          lineHeight: 1,
          textShadow: `0 0 20px ${accentColor}40`,
        }}>
          ₹{rate.toLocaleString('en-IN')}
        </div>
      </div>

      {/* 8g strip */}
      <div style={{
        background: `${accentColor}0d`,
        border: `1px solid ${accentColor}25`,
        borderRadius: 8,
        padding: '10px 14px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>8 gram value</span>
        <span style={{ fontSize: 14, fontWeight: 800, color: accentColor }}>₹{price8g}</span>
      </div>
    </div>
  );
}

function QuickStat({ label, value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }} />
      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color }}>{value}</span>
    </div>
  );
}