import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';

// Default Gold Logo SVG
const DefaultLogoSVG = () => (
  <svg viewBox="0 0 100 100" width="48" height="48" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}>
    <defs>
      <linearGradient id="logo-gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fffbeb" />
        <stop offset="50%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="45" fill="none" stroke="url(#logo-gold)" strokeWidth="1.5" />
    <circle cx="50" cy="50" r="40" fill="none" stroke="url(#logo-gold)" strokeWidth="0.5" strokeDasharray="3" />
    <path d="M32 65V35l18 16l18-16v30" fill="none" stroke="url(#logo-gold)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M38 52h24" fill="none" stroke="url(#logo-gold)" strokeWidth="1.5" opacity="0.5" />
  </svg>
);

// Vector Gold Earrings SVG (Default for Template A)
const DefaultEarringSVG = () => (
  <svg viewBox="0 0 200 200" width="100%" height="100%">
    <defs>
      <radialGradient id="box-grad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fefefe" />
        <stop offset="100%" stopColor="#ebe7de" />
      </radialGradient>
      <radialGradient id="earring-gold" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fff9c4" />
        <stop offset="70%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#b45309" />
      </radialGradient>
      <filter id="svg-shadow" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#000" floodOpacity="0.16" />
      </filter>
    </defs>
    <rect x="20" y="20" width="160" height="160" rx="24" fill="url(#box-grad)" filter="url(#svg-shadow)" stroke="#ffffff" strokeWidth="2.5" />
    <rect x="30" y="30" width="140" height="140" rx="16" fill="none" stroke="#dce1e5" strokeWidth="1" strokeDasharray="3" />
    <path d="M45 100h110" stroke="#d5d0c3" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
    
    {/* Left Earring */}
    <g transform="translate(68, 95)" filter="url(#svg-shadow)">
      <circle cx="0" cy="0" r="10" fill="url(#earring-gold)" />
      <path d="M0 0 L-14 -14 A10 10 0 1 1 14 -14 Z" fill="url(#earring-gold)" />
      <circle cx="0" cy="-20" r="4" fill="#ffffff" />
      <circle cx="0" cy="0" r="3" fill="#ffffff" />
    </g>
    
    {/* Right Earring */}
    <g transform="translate(132, 95)" filter="url(#svg-shadow)">
      <circle cx="0" cy="0" r="10" fill="url(#earring-gold)" />
      <path d="M0 0 L-14 -14 A10 10 0 1 1 14 -14 Z" fill="url(#earring-gold)" />
      <circle cx="0" cy="-20" r="4" fill="#ffffff" />
      <circle cx="0" cy="0" r="3" fill="#ffffff" />
    </g>
  </svg>
);

// Vector Gold Ring SVG (Default for Template B)
const DefaultRingSVG = () => (
  <svg viewBox="0 0 200 200" width="100%" height="100%">
    <defs>
      <linearGradient id="gold-band" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fffbeb" />
        <stop offset="30%" stopColor="#fbbf24" />
        <stop offset="70%" stopColor="#d97706" />
        <stop offset="100%" stopColor="#78350f" />
      </linearGradient>
      <filter id="ring-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="3" dy="12" stdDeviation="8" floodColor="#000" floodOpacity="0.3" />
      </filter>
    </defs>
    <ellipse cx="100" cy="115" rx="72" ry="12" fill="#000000" opacity="0.18" filter="blur(4px)" />
    <g filter="url(#ring-glow)">
      <ellipse cx="100" cy="100" rx="66" ry="66" fill="none" stroke="url(#gold-band)" strokeWidth="20" />
      <ellipse cx="100" cy="100" rx="55" ry="55" fill="none" stroke="#fff" strokeWidth="2" opacity="0.25" />
      {/* Decorative inner cuts */}
      <path d="M52 52 A66 66 0 0 1 148 52" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" opacity="0.5" />
      <path d="M52 148 A66 66 0 0 0 148 148" fill="none" stroke="#000000" strokeWidth="4" strokeLinecap="round" opacity="0.15" />
    </g>
  </svg>
);

export default function PosterCreate() {
  const [goldRate, setGoldRate] = useState(13800);
  const [silverRate, setSilverRate] = useState(260);
  const [dateStr, setDateStr] = useState('');
  const [locationStr, setLocationStr] = useState('Srivilliputtur, Dhalavaipuram');
  const [phoneStr, setPhoneStr] = useState('Ph - 9443112034, 9345100001');
  const [activeTemplate, setActiveTemplate] = useState('A');
  const [logoImg, setLogoImg] = useState(null);
  const [jewelryImg, setJewelryImg] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');

  const posterRef = useRef(null);

  // Initialize date as DD.MM.YYYY
  useEffect(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    setDateStr(`${dd}.${mm}.${yyyy}`);

    // Try to load current rates from Supabase database
    const loadCurrentRates = async () => {
      try {
        if (window.electronAPI && typeof window.electronAPI.getMetalRates === 'function') {
          const res = await window.electronAPI.getMetalRates();
          if (res && res.length > 0) {
            const r = res[0];
            if (r.gold_rate) setGoldRate(parseInt(r.gold_rate) || 13800);
            if (r.silver_rate) setSilverRate(parseInt(r.silver_rate) || 260);
          }
        }
      } catch (err) {
        console.warn('Could not auto-load metal rates:', err);
      }
    };
    loadCurrentRates();
  }, []);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setLogoImg(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleJewelryUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setJewelryImg(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = async () => {
    if (isCapturing) return;
    setIsCapturing(true);
    setErrorText('');
    setSuccessText('');

    try {
      const element = posterRef.current;
      if (!element) throw new Error('Preview canvas element not found');

      // Temporarily remove transform scaling if browser is rendering scaled down
      const originalStyle = element.style.transform;
      element.style.transform = 'none';

      // Wait a moment for layout reflow
      await new Promise(r => setTimeout(r, 100));

      const canvas = await html2canvas(element, {
        useCORS: true,
        scale: 2, // 2x scale for high resolution
        backgroundColor: null,
        logging: false,
      });

      // Restore original transform scaling
      element.style.transform = originalStyle;

      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `Gold_Rate_Poster_${dateStr.replace(/\./g, '-')}.png`;
      link.click();
      setSuccessText('Poster downloaded successfully!');
    } catch (err) {
      console.error(err);
      setErrorText('Failed to download image. Try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const gold8gValue = (goldRate * 8).toLocaleString('en-IN');

  return (
    <div style={{ padding: '4px 0', minHeight: '100%' }}>
      {/* Load luxury Google Fonts dynamically */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;800&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Bodoni+Moda:ital,wght@0,400;0,600;1,400&display=swap');
        
        .poster-font-title {
          font-family: 'Cinzel', serif;
          letter-spacing: 2px;
        }
        .poster-font-serif {
          font-family: 'Playfair Display', serif;
        }
        .poster-font-bodoni {
          font-family: 'Bodoni Moda', serif;
        }

        .poster-creator-container {
          display: grid;
          grid-template-columns: 360px 1fr;
          gap: 24px;
          align-items: start;
        }

        @media (max-width: 900px) {
          .poster-creator-container {
            grid-template-columns: 1fr !important;
          }
          .poster-preview-wrapper {
            justify-content: center !important;
          }
        }
      ` }} />

      <div className="section-header">
        <div>
          <h2 className="section-title">Daily Rate Poster Creator</h2>
          <p className="section-sub">Generate premium social media images for WhatsApp, Facebook, or Instagram status</p>
        </div>
      </div>

      {successText && <div className="toast toast-success">{successText}</div>}
      {errorText && <div className="toast toast-error">{errorText}</div>}

      <div className="poster-creator-container">
        
        {/* ── LEFT PANEL: CONTROLS ───────────────────────────── */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold-300)' }}>Poster Settings</h3>
          </div>

          {/* Template Selection */}
          <div>
            <label className="form-label">Select Template Style</label>
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button 
                type="button" 
                className={`btn-secondary ${activeTemplate === 'A' ? 'active' : ''}`}
                style={{ flex: 1, borderColor: activeTemplate === 'A' ? 'var(--gold-400)' : '', color: activeTemplate === 'A' ? 'var(--gold-300)' : '' }}
                onClick={() => setActiveTemplate('A')}
              >
                Satin Velvet (Style A)
              </button>
              <button 
                type="button" 
                className={`btn-secondary ${activeTemplate === 'B' ? 'active' : ''}`}
                style={{ flex: 1, borderColor: activeTemplate === 'B' ? 'var(--gold-400)' : '', color: activeTemplate === 'B' ? 'var(--gold-300)' : '' }}
                onClick={() => setActiveTemplate('B')}
              >
                Royal Marble (Style B)
              </button>
            </div>
          </div>

          {/* Manual Rate Inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label className="form-label">Gold Rate (1g)</label>
              <input 
                type="number" 
                className="form-input" 
                value={goldRate} 
                onChange={e => setGoldRate(parseFloat(e.target.value) || 0)} 
              />
            </div>
            <div>
              <label className="form-label">Silver Rate (1g)</label>
              <input 
                type="number" 
                className="form-input" 
                value={silverRate} 
                onChange={e => setSilverRate(parseFloat(e.target.value) || 0)} 
              />
            </div>
          </div>

          {/* Date, Location, Contact */}
          <div>
            <label className="form-label">Date Display</label>
            <input 
              type="text" 
              className="form-input" 
              value={dateStr} 
              onChange={e => setDateStr(e.target.value)} 
            />
          </div>

          <div>
            <label className="form-label">Location Text</label>
            <input 
              type="text" 
              className="form-input" 
              value={locationStr} 
              onChange={e => setLocationStr(e.target.value)} 
            />
          </div>

          <div>
            <label className="form-label">Contact / Phone Numbers</label>
            <input 
              type="text" 
              className="form-input" 
              value={phoneStr} 
              onChange={e => setPhoneStr(e.target.value)} 
            />
          </div>

          {/* File Uploaders */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
            <label className="form-label" style={{ marginBottom: 4 }}>Custom Logo (Optional)</label>
            <input 
              type="file" 
              accept="image/*" 
              className="form-input" 
              style={{ fontSize: 12, padding: '6px 10px' }} 
              onChange={handleLogoUpload} 
            />
            {logoImg && (
              <button 
                className="btn-danger" 
                style={{ marginTop: 6, width: '100%', padding: 4 }} 
                onClick={() => setLogoImg(null)}
              >
                Reset Logo
              </button>
            )}
          </div>

          <div>
            <label className="form-label" style={{ marginBottom: 4 }}>Custom Jewelry Image (Optional)</label>
            <input 
              type="file" 
              accept="image/*" 
              className="form-input" 
              style={{ fontSize: 12, padding: '6px 10px' }} 
              onChange={handleJewelryUpload} 
            />
            {jewelryImg && (
              <button 
                className="btn-danger" 
                style={{ marginTop: 6, width: '100%', padding: 4 }} 
                onClick={() => setJewelryImg(null)}
              >
                Reset Jewelry Photo
              </button>
            )}
          </div>

          {/* Download Button */}
          <button 
            type="button" 
            className="btn-primary" 
            style={{ width: '100%', marginTop: 8, justifyContent: 'center', height: 42 }} 
            onClick={handleDownload}
            disabled={isCapturing}
          >
            {isCapturing ? 'Generating Poster...' : '📥 Download Poster PNG'}
          </button>
        </div>

        {/* ── RIGHT PANEL: LIVE PREVIEW CANVAS ────────────────── */}
        <div className="poster-preview-wrapper" style={{ display: 'flex', justifyContent: 'flex-start', overflow: 'auto', padding: '10px 0' }}>
          
          {/* 
            The actual Canvas wrapper is sized at 540x675 (exactly 50% scale of 1080x1350 for sharp rendering).
            This maintains standard proportions while avoiding a massive window inside the app.
          */}
          <div 
            ref={posterRef}
            id="poster-canvas"
            style={{
              width: 540,
              height: 675,
              minWidth: 540,
              minHeight: 675,
              position: 'relative',
              borderRadius: 4,
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
              background: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
            }}
          >
            {activeTemplate === 'A' ? (
              // ── STYLE A: CLASSIC SATIN VELVET ──────────────────
              <div style={{
                width: '100%',
                height: '100%',
                background: 'radial-gradient(circle at 60% 40%, #ffffff 0%, #f7f3e8 45%, #e6dfcf 100%)',
                padding: '34px 28px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                color: '#4a3f29',
                boxSizing: 'border-box',
                position: 'relative'
              }}>
                {/* Decorative subtle leaves corner vectors */}
                <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 18, opacity: 0.25 }}>🍂</div>
                <div style={{ position: 'absolute', bottom: 10, right: 10, fontSize: 18, opacity: 0.25 }}>🍂</div>

                {/* Top header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  {/* Left: Product Showcase */}
                  <div style={{ width: 170, height: 170, borderRadius: 16, overflow: 'hidden' }}>
                    {jewelryImg ? (
                      <img src={jewelryImg} alt="Jewelry Item" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <DefaultEarringSVG />
                    )}
                  </div>

                  {/* Right: Brand Header */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, textAlign: 'center', paddingLeft: 10 }}>
                    <div style={{ marginBottom: 6 }}>
                      {logoImg ? (
                        <img src={logoImg} alt="Logo" style={{ maxHeight: 52, objectFit: 'contain' }} />
                      ) : (
                        <DefaultLogoSVG />
                      )}
                    </div>
                    <div className="poster-font-title" style={{ fontSize: 20, fontWeight: 700, color: '#3d3016', lineHeight: 1 }}>MSGOLD</div>
                    <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: 2, color: '#786235', marginTop: 4, textTransform: 'uppercase', borderTop: '0.5px solid #dcd1ba', borderBottom: '0.5px solid #dcd1ba', padding: '2px 8px' }}>
                      Since 1930
                    </div>
                    <div style={{ fontSize: 6, letterSpacing: 1.5, color: '#968055', textTransform: 'uppercase', marginTop: 3 }}>
                      Trusted for Generations
                    </div>
                  </div>
                </div>

                {/* Today's rate banner */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, margin: '14px 0' }}>
                  <div className="poster-font-serif" style={{ fontSize: 28, fontStyle: 'italic', fontWeight: 600, color: '#b59345', textShadow: '0 1px 1px #fff', lineHeight: 1 }}>
                    Today's
                  </div>
                  <div className="poster-font-title" style={{ fontSize: 34, fontWeight: 800, color: '#3d3016', lineHeight: 1, letterSpacing: 2 }}>
                    GOLD RATE
                  </div>
                  <div style={{
                    border: '1.5px solid #d4c5a3',
                    borderRadius: 20,
                    padding: '3px 26px',
                    fontSize: 15,
                    fontWeight: 700,
                    color: '#3d3016',
                    background: 'rgba(255,255,255,0.4)',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)',
                  }}>
                    {dateStr}
                  </div>
                </div>

                {/* Bottom Rates Grid */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  
                  {/* Gram row cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    {/* Gold card */}
                    <div style={{
                      background: 'linear-gradient(180deg, #ffffff 0%, #fdfcf9 100%)',
                      border: '1px solid #e2d7be',
                      borderRadius: 14,
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 4px 10px rgba(74, 63, 41, 0.05)'
                    }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #fce089, #d4a32c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#4a3605', border: '1.5px stroke #fff' }}>Au</div>
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: '#8c7d5f', textTransform: 'uppercase', letterSpacing: 0.5 }}>Gold Rate (1g)</div>
                        <div className="poster-font-serif" style={{ fontSize: 18, fontWeight: 700, color: '#3d3016' }}>₹{goldRate.toLocaleString('en-IN')}</div>
                      </div>
                    </div>

                    {/* Silver card */}
                    <div style={{
                      background: 'linear-gradient(180deg, #ffffff 0%, #fdfcf9 100%)',
                      border: '1px solid #e2d7be',
                      borderRadius: 14,
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 4px 10px rgba(74, 63, 41, 0.05)'
                    }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #e4eaf0, #9eb0c2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#313f4d', border: '1.5px stroke #fff' }}>Ag</div>
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: '#8c7d5f', textTransform: 'uppercase', letterSpacing: 0.5 }}>Silver Rate (1g)</div>
                        <div className="poster-font-serif" style={{ fontSize: 18, fontWeight: 700, color: '#3d3016' }}>₹{silverRate.toLocaleString('en-IN')}</div>
                      </div>
                    </div>
                  </div>

                  {/* 8 Gram Banner */}
                  <div style={{
                    background: 'linear-gradient(90deg, #fdfbf7 0%, #fff7eb 50%, #fdfbf7 100%)',
                    border: '1px solid #e8dbbe',
                    borderRadius: 12,
                    padding: '12px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 4px 12px rgba(74, 63, 41, 0.08)'
                  }}>
                    <div className="poster-font-title" style={{ fontSize: 14, fontWeight: 700, color: '#786235', letterSpacing: 1 }}>8 GRAMS</div>
                    <div className="poster-font-serif" style={{ fontSize: 24, fontWeight: 800, color: '#822c1d', textShadow: '0 1px 1px #fff' }}>₹{gold8gValue}</div>
                  </div>
                </div>

                {/* Footer Address */}
                <div style={{
                  borderTop: '0.5px solid #d4c5a3',
                  paddingTop: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                  fontSize: 10,
                  fontWeight: 600,
                  color: '#6e5e40',
                  textAlign: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>📍</span> <span>LOCATION: {locationStr.toUpperCase()}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>📞</span> <span>{phoneStr}</span>
                  </div>
                </div>
              </div>
            ) : (
              // ── STYLE B: ROYAL MARBLE RING ────────────────────
              <div style={{
                width: '100%',
                height: '100%',
                background: '#faf9f6',
                border: '14px solid #ffffff',
                outline: '1px solid #dcd1ba',
                outlineOffset: '-14px',
                padding: '24px 20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                color: '#1a3325',
                boxSizing: 'border-box',
                position: 'relative'
              }}>
                {/* Gold floral corner borders */}
                <div style={{ position: 'absolute', top: 18, left: 18, borderLeft: '2px solid #b59345', borderTop: '2px solid #b59345', width: 24, height: 24, opacity: 0.6 }} />
                <div style={{ position: 'absolute', top: 18, right: 18, borderRight: '2px solid #b59345', borderTop: '2px solid #b59345', width: 24, height: 24, opacity: 0.6 }} />
                <div style={{ position: 'absolute', bottom: 18, left: 18, borderLeft: '2px solid #b59345', borderBottom: '2px solid #b59345', width: 24, height: 24, opacity: 0.6 }} />
                <div style={{ position: 'absolute', bottom: 18, right: 18, borderRight: '2px solid #b59345', borderBottom: '2px solid #b59345', width: 24, height: 24, opacity: 0.6 }} />

                {/* Brand Header */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginTop: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {logoImg ? (
                      <img src={logoImg} alt="Logo" style={{ maxHeight: 46, objectFit: 'contain' }} />
                    ) : (
                      <DefaultLogoSVG />
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <h1 className="poster-font-title" style={{ fontSize: 24, fontWeight: 700, color: '#a38237', margin: 0, lineHeight: 1, letterSpacing: 2 }}>MSGOLD</h1>
                      <span style={{ fontSize: 9, fontWeight: 600, color: '#7a6a4c', letterSpacing: 1, textTransform: 'uppercase' }}>Since 1930</span>
                    </div>
                  </div>
                  <div style={{ width: '80%', height: '1px', background: 'linear-gradient(90deg, transparent, #dcd1ba, transparent)', margin: '10px 0' }} />
                </div>

                {/* Middle Content: Split Ring & Rates */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10, alignItems: 'center', margin: '10px 0' }}>
                  
                  {/* Left: Product Image */}
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 190, padding: 8 }}>
                    {jewelryImg ? (
                      <img src={jewelryImg} alt="Jewelry product" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.12))' }} />
                    ) : (
                      <DefaultRingSVG />
                    )}
                  </div>

                  {/* Right: Rates Panel */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    
                    {/* Calendar date badge */}
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      border: '1px solid #b59345',
                      borderRadius: 6,
                      padding: '4px 10px',
                      background: 'rgba(181, 147, 69, 0.05)',
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#a38237',
                      alignSelf: 'flex-start'
                    }}>
                      <span>📅</span> <span>{dateStr}</span>
                    </div>

                    {/* Gold rate row */}
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#7a6a4c', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ color: '#a38237' }}>✦</span> Gold Rate
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#2b2311', marginTop: 2 }}>
                        ₹{goldRate.toLocaleString('en-IN')} <span style={{ fontSize: 10, fontWeight: 500, color: '#7a6a4c' }}>/ Gram</span>
                      </div>
                    </div>

                    {/* Silver rate row */}
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#7a6a4c', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ color: '#a38237' }}>✦</span> Silver Rate
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#2b2311', marginTop: 2 }}>
                        ₹{silverRate.toLocaleString('en-IN')} <span style={{ fontSize: 10, fontWeight: 500, color: '#7a6a4c' }}>/ Gram</span>
                      </div>
                    </div>

                    {/* 8g Weight Banner */}
                    <div style={{
                      border: '1.5px solid #b59345',
                      borderRadius: 8,
                      padding: '8px 12px',
                      background: '#ffffff',
                      boxShadow: '0 4px 10px rgba(181, 147, 69, 0.1)'
                    }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: '#7a6a4c', textTransform: 'uppercase', letterSpacing: 0.5 }}>8 Gram Value</div>
                      <div style={{ fontSize: 19, fontWeight: 800, color: '#8a2b1f', marginTop: 1 }}>
                        ₹{gold8gValue}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer details */}
                <div style={{
                  borderTop: '1px solid #dcd1ba',
                  paddingTop: 12,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: 10,
                  fontWeight: 600,
                  color: '#7a6a4c'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, maxWidth: '50%', textAlign: 'left' }}>
                    <span>📍</span> <span>{locationStr}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, textAlign: 'right' }}>
                    <span>📞</span> <span>{phoneStr}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
