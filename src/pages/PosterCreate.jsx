import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';

// Default Gold Logo SVG
const DefaultLogoSVG = ({ color }) => (
  <svg viewBox="0 0 100 100" width="48" height="48" style={{ filter: 'drop-shadow(0 2px 4px rgba(30,58,138,0.15))' }}>
    <defs>
      <linearGradient id="logo-gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fffbeb" />
        <stop offset="50%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="45" fill="none" stroke={color || "url(#logo-gold)"} strokeWidth="1.5" />
    <circle cx="50" cy="50" r="40" fill="none" stroke={color || "url(#logo-gold)"} strokeWidth="0.5" strokeDasharray="3" />
    <path d="M32 65V35l18 16l18-16v30" fill="none" stroke={color || "url(#logo-gold)"} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M38 52h24" fill="none" stroke={color || "url(#logo-gold)"} strokeWidth="1.5" opacity="0.5" />
  </svg>
);

// Vector Gold Earrings SVG (Default Product)
const DefaultEarringSVG = () => (
  <svg viewBox="0 0 200 200" width="100%" height="100%">
    <defs>
      <radialGradient id="box-grad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fdfdfd" />
        <stop offset="100%" stopColor="#e5e0d5" />
      </radialGradient>
      <radialGradient id="earring-gold" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fff9c4" />
        <stop offset="70%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#b45309" />
      </radialGradient>
      <filter id="svg-shadow" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#1e3a8a" floodOpacity="0.2" />
      </filter>
    </defs>
    <rect x="25" y="25" width="150" height="150" rx="22" fill="url(#box-grad)" filter="url(#svg-shadow)" stroke="#ffffff" strokeWidth="2" />
    <rect x="34" y="34" width="132" height="132" rx="14" fill="none" stroke="#d5dbe0" strokeWidth="1" strokeDasharray="3" />
    <path d="M48 100h104" stroke="#d2ccbe" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
    
    <g transform="translate(72, 95)" filter="url(#svg-shadow)">
      <circle cx="0" cy="0" r="9" fill="url(#earring-gold)" />
      <path d="M0 0 L-12 -12 A9 9 0 1 1 12 -12 Z" fill="url(#earring-gold)" />
      <circle cx="0" cy="-18" r="3.5" fill="#ffffff" />
      <circle cx="0" cy="0" r="2.5" fill="#ffffff" />
    </g>
    
    <g transform="translate(128, 95)" filter="url(#svg-shadow)">
      <circle cx="0" cy="0" r="9" fill="url(#earring-gold)" />
      <path d="M0 0 L-12 -12 A9 9 0 1 1 12 -12 Z" fill="url(#earring-gold)" />
      <circle cx="0" cy="-18" r="3.5" fill="#ffffff" />
      <circle cx="0" cy="0" r="2.5" fill="#ffffff" />
    </g>
  </svg>
);

const presetBgs = {
  champagne: {
    name: 'Champagne Satin',
    style: { background: 'radial-gradient(circle at 60% 40%, #ffffff 0%, #f7f3e8 45%, #e6dfcf 100%)' }
  },
  emerald: {
    name: 'Emerald Velvet',
    style: { background: 'radial-gradient(circle at 30% 30%, #064e3b 0%, #022c22 70%, #011c15 100%)' }
  },
  ruby: {
    name: 'Royal Ruby Satin',
    style: { background: 'radial-gradient(circle at 30% 30%, #7f1d1d 0%, #450a0a 75%, #2d0505 100%)' }
  },
  midnight: {
    name: 'Midnight Gold Dust',
    style: { background: 'radial-gradient(circle at 50% 30%, #1c1c28 0%, #0b0b10 70%, #050508 100%)' }
  },
  rose: {
    name: 'Rose Gold Silk',
    style: { background: 'radial-gradient(circle at 30% 30%, #fff1f2 0%, #ffe4e6 45%, #fecdd3 100%)' }
  },
  ivory: {
    name: 'Classic Ivory Marble',
    style: { background: 'linear-gradient(135deg, #fdfbf7 0%, #f5f0e6 100%)' }
  },
  sapphire: {
    name: 'Sapphire Silk',
    style: { background: 'radial-gradient(circle at 30% 30%, #1e3a8a 0%, #172554 75%, #0f172a 100%)' }
  },
  navyBlue: {
    name: 'Royal Blue Satin',
    style: { background: 'linear-gradient(180deg, #1e3a8a 0%, #0f172a 100%)' }
  }
};

const colorThemes = {
  lightGold: {
    textColor: '#3d3016',
    accentColor: '#b59345',
    cardBg: 'rgba(255, 255, 255, 0.55)',
    cardBorder: '1px solid rgba(181, 147, 69, 0.3)'
  },
  darkGold: {
    textColor: '#fffbeb',
    accentColor: '#fbbf24',
    cardBg: 'rgba(30, 58, 138, 0.65)',
    cardBorder: '1px solid rgba(251, 191, 36, 0.25)'
  },
  silverSlate: {
    textColor: '#f8f8ff',
    accentColor: '#94a3b8',
    cardBg: 'rgba(15, 23, 42, 0.65)',
    cardBorder: '1px solid rgba(148, 163, 184, 0.25)'
  }
};

export default function PosterCreate() {
  // Input states
  const [goldRate, setGoldRate] = useState('13800');
  const [silverRate, setSilverRate] = useState('260');
  const [dateStr, setDateStr] = useState('');
  const [locationStr, setLocationStr] = useState('Srivilliputtur, Dhalavaipuram');
  const [phoneStr, setPhoneStr] = useState('Ph - 9443112034, 9345100001');

  // Background states
  const [bgType, setBgType] = useState('preset'); // 'preset' or 'upload'
  const [selectedPreset, setSelectedPreset] = useState('champagne');
  const [uploadedBg, setUploadedBg] = useState(null);

  // Logo & Jewelry assets
  const [logoImg, setLogoImg] = useState(null);
  const [jewelryImg, setJewelryImg] = useState(null);

  // Styling properties
  const [textColor, setTextColor] = useState('#3d3016');
  const [accentColor, setAccentColor] = useState('#b59345');
  const [cardBg, setCardBg] = useState('rgba(255, 255, 255, 0.55)');
  const [cardBorder, setCardBorder] = useState('1px solid rgba(181, 147, 69, 0.3)');

  // Coordinate Positioning states (percentages)
  const [logoY, setLogoY] = useState(15);
  const [logoX, setLogoX] = useState(65);
  const [logoScale, setLogoScale] = useState(1);

  const [productY, setProductY] = useState(26);
  const [productX, setProductX] = useState(24);
  const [productScale, setProductScale] = useState(1);
  const [showProduct, setShowProduct] = useState(true);

  const [titleY, setTitleY] = useState(48);
  const [titleScale, setTitleScale] = useState(1);

  const [ratesY, setRatesY] = useState(72);
  const [ratesScale, setRatesScale] = useState(1);

  const [footerY, setFooterY] = useState(92);

  // App UI states
  const [activeTab, setActiveTab] = useState('bg'); // 'bg' | 'rates' | 'position' | 'assets'
  const [isCapturing, setIsCapturing] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');

  const posterRef = useRef(null);

  useEffect(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    setDateStr(`${dd}.${mm}.${yyyy}`);

    // Fetch current rates from local sqlite cache via supabase if connected
    const loadCurrentRates = async () => {
      try {
        if (window.electronAPI && typeof window.electronAPI.getMetalRates === 'function') {
          const res = await window.electronAPI.getMetalRates();
          const rates = res?.metal_rates || (Array.isArray(res) ? res : []);
          if (rates && rates.length > 0) {
            const r = rates[0];
            if (r.gold_rate) setGoldRate(r.gold_rate.toString());
            if (r.silver_rate) setSilverRate(r.silver_rate.toString());
          }
        }
      } catch (err) {
        console.warn('Could not auto-load metal rates:', err);
      }
    };
    loadCurrentRates();
  }, []);

  // Quick theme setter
  const applyTheme = (themeName) => {
    const theme = colorThemes[themeName];
    if (theme) {
      setTextColor(theme.textColor);
      setAccentColor(theme.accentColor);
      setCardBg(theme.cardBg);
      setCardBorder(theme.cardBorder);
    }
  };

  const handleBgUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedBg(reader.result);
        setBgType('upload');
      };
      reader.readAsDataURL(file);
    }
  };

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

      // Temporary reset transforms for html2canvas to draw standard dimensions correctly
      const originalTransform = element.style.transform;
      element.style.transform = 'none';

      await new Promise(r => setTimeout(r, 100));

      const canvas = await html2canvas(element, {
        useCORS: true,
        scale: 2.5, // 2.5x scaling for high print resolution (1350x1687px output)
        backgroundColor: null,
        logging: false,
      });

      element.style.transform = originalTransform;

      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `Gold_Rate_Poster_${dateStr.replace(/\./g, '-')}.png`;
      link.click();
      setSuccessText('Poster exported and downloaded successfully!');
    } catch (err) {
      console.error(err);
      setErrorText('Failed to download image. Try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const goldNum = parseFloat(goldRate) || 0;
  const silverNum = parseFloat(silverRate) || 0;
  const gold8gValue = (goldNum * 8).toLocaleString('en-IN');

  const canvasStyle = bgType === 'upload' && uploadedBg
    ? { backgroundImage: `url(${uploadedBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : presetBgs[selectedPreset].style;

  return (
    <div style={{ padding: '2px 0', minHeight: '100%' }}>
      {/* Load Google Serif/Decorative Fonts */}
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

        .studio-layout {
          display: grid;
          grid-template-columns: 380px 1fr;
          gap: 24px;
          align-items: start;
        }

        .studio-tab-btn {
          flex: 1;
          padding: 8px 4px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          background: var(--bg-secondary);
          color: var(--text-secondary);
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .studio-tab-btn.active {
          border-color: var(--gold-400);
          color: var(--gold-300);
          background: rgba(251, 191, 36, 0.08);
        }

        .slider-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 12px;
        }

        .slider-row label {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-secondary);
          display: flex;
          justify-content: space-between;
        }

        .slider-row input[type="range"] {
          width: 100%;
          accent-color: var(--gold-400);
          cursor: pointer;
        }

        @media (max-width: 960px) {
          .studio-layout {
            grid-template-columns: 1fr !important;
          }
          .canvas-wrapper {
            justify-content: center !important;
          }
        }
      ` }} />

      <div className="section-header">
        <div>
          <h2 className="section-title">Interactive Poster Studio</h2>
          <p className="section-sub">Create infinite designs by uploading custom background templates and dragging/sliding text blocks.</p>
        </div>
      </div>

      {successText && <div className="toast toast-success">{successText}</div>}
      {errorText && <div className="toast toast-error">{errorText}</div>}

      <div className="studio-layout">
        
        {/* ── LEFT PANEL: CONFIGURATION & SLIDERS ──────────────── */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Tab Navigation */}
          <div style={{ display: 'flex', gap: 6 }}>
            <button className={`studio-tab-btn ${activeTab === 'bg' ? 'active' : ''}`} onClick={() => setActiveTab('bg')}>Template</button>
            <button className={`studio-tab-btn ${activeTab === 'rates' ? 'active' : ''}`} onClick={() => setActiveTab('rates')}>Rates</button>
            <button className={`studio-tab-btn ${activeTab === 'position' ? 'active' : ''}`} onClick={() => setActiveTab('position')}>Layout</button>
            <button className={`studio-tab-btn ${activeTab === 'assets' ? 'active' : ''}`} onClick={() => setActiveTab('assets')}>Uploads</button>
          </div>

          <div style={{ minHeight: 330 }}>
            {/* ── TAB 1: BACKGROUND & THEME ── */}
            {activeTab === 'bg' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <label className="form-label">Background Template</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button 
                    className={`btn-secondary ${bgType === 'preset' ? 'active' : ''}`}
                    style={{ flex: 1, padding: 6, fontSize: 12 }}
                    onClick={() => setBgType('preset')}
                  >
                    Built-in Presets
                  </button>
                  <button 
                    className={`btn-secondary ${bgType === 'upload' ? 'active' : ''}`}
                    style={{ flex: 1, padding: 6, fontSize: 12 }}
                    onClick={() => setBgType('upload')}
                  >
                    Custom Upload
                  </button>
                </div>

                {bgType === 'preset' ? (
                  <div>
                    <label className="form-label" style={{ fontSize: 10 }}>Select Preset Texture</label>
                    <select 
                      className="form-select" 
                      value={selectedPreset} 
                      onChange={e => setSelectedPreset(e.target.value)}
                    >
                      {Object.entries(presetBgs).map(([key, bg]) => (
                        <option key={key} value={key}>{bg.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="form-label" style={{ fontSize: 10 }}>Upload Background Template</label>
                    <input type="file" accept="image/*" className="form-input" onChange={handleBgUpload} />
                  </div>
                )}

                {/* Color Schemes */}
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
                  <label className="form-label">Quick Color Schemes</label>
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    <button type="button" className="btn-secondary" style={{ flex: 1, padding: '4px 8px', fontSize: 11 }} onClick={() => applyTheme('lightGold')}>Gold & Ivory</button>
                    <button type="button" className="btn-secondary" style={{ flex: 1, padding: '4px 8px', fontSize: 11 }} onClick={() => applyTheme('darkGold')}>Gold & Blue</button>
                    <button type="button" className="btn-secondary" style={{ flex: 1, padding: '4px 8px', fontSize: 11 }} onClick={() => applyTheme('silverSlate')}>Silver Theme</button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label className="form-label" style={{ fontSize: 9 }}>Text Color</label>
                    <input type="color" className="form-input" style={{ padding: '4px 8px', height: 38 }} value={textColor} onChange={e => setTextColor(e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: 9 }}>Accent Color</label>
                    <input type="color" className="form-input" style={{ padding: '4px 8px', height: 38 }} value={accentColor} onChange={e => setAccentColor(e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 2: MANUAL RATES & META ── */}
            {activeTab === 'rates' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label className="form-label">Gold Rate (1g)</label>
                    <input type="text" className="form-input" value={goldRate} onChange={e => setGoldRate(e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Silver Rate (1g)</label>
                    <input type="text" className="form-input" value={silverRate} onChange={e => setSilverRate(e.target.value)} />
                  </div>
                </div>

                <div>
                  <label className="form-label">Date Display</label>
                  <input type="text" className="form-input" value={dateStr} onChange={e => setDateStr(e.target.value)} />
                </div>

                <div>
                  <label className="form-label">Location Address</label>
                  <input type="text" className="form-input" value={locationStr} onChange={e => setLocationStr(e.target.value)} />
                </div>

                <div>
                  <label className="form-label">Contact / Phone Numbers</label>
                  <input type="text" className="form-input" value={phoneStr} onChange={e => setPhoneStr(e.target.value)} />
                </div>
              </div>
            )}

            {/* ── TAB 3: LAYOUT POSITIONING SLIDERS ── */}
            {activeTab === 'position' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Logo positions */}
                <div className="slider-row">
                  <label>Logo Vertical position <span>{logoY}%</span></label>
                  <input type="range" min="5" max="95" value={logoY} onChange={e => setLogoY(parseInt(e.target.value))} />
                </div>
                <div className="slider-row">
                  <label>Logo Horizontal position <span>{logoX}%</span></label>
                  <input type="range" min="5" max="95" value={logoX} onChange={e => setLogoX(parseInt(e.target.value))} />
                </div>
                <div className="slider-row">
                  <label>Logo Size Scale <span>x{logoScale.toFixed(2)}</span></label>
                  <input type="range" min="0.5" max="2.0" step="0.05" value={logoScale} onChange={e => setLogoScale(parseFloat(e.target.value))} />
                </div>

                {/* Product positions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <input type="checkbox" id="showProductBox" checked={showProduct} onChange={e => setShowProduct(e.target.checked)} style={{ accentColor: 'var(--gold-400)' }} />
                  <label htmlFor="showProductBox" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>Show Product Image / Slot</label>
                </div>
                {showProduct && (
                  <>
                    <div className="slider-row">
                      <label>Product Vertical position <span>{productY}%</span></label>
                      <input type="range" min="5" max="95" value={productY} onChange={e => setProductY(parseInt(e.target.value))} />
                    </div>
                    <div className="slider-row">
                      <label>Product Horizontal position <span>{productX}%</span></label>
                      <input type="range" min="5" max="95" value={productX} onChange={e => setProductX(parseInt(e.target.value))} />
                    </div>
                    <div className="slider-row">
                      <label>Product Size Scale <span>x{productScale.toFixed(2)}</span></label>
                      <input type="range" min="0.5" max="2.0" step="0.05" value={productScale} onChange={e => setProductScale(parseFloat(e.target.value))} />
                    </div>
                  </>
                )}

                {/* Title & Rates positions */}
                <div className="slider-row" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
                  <label>Title Banner vertical position <span>{titleY}%</span></label>
                  <input type="range" min="5" max="95" value={titleY} onChange={e => setTitleY(parseInt(e.target.value))} />
                </div>
                <div className="slider-row">
                  <label>Title Banner Scale <span>x{titleScale.toFixed(2)}</span></label>
                  <input type="range" min="0.5" max="2.0" step="0.05" value={titleScale} onChange={e => setTitleScale(parseFloat(e.target.value))} />
                </div>

                <div className="slider-row" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
                  <label>Rates Card vertical position <span>{ratesY}%</span></label>
                  <input type="range" min="5" max="95" value={ratesY} onChange={e => setRatesY(parseInt(e.target.value))} />
                </div>
                <div className="slider-row">
                  <label>Rates Card Scale <span>x{ratesScale.toFixed(2)}</span></label>
                  <input type="range" min="0.5" max="2.0" step="0.05" value={ratesScale} onChange={e => setRatesScale(parseFloat(e.target.value))} />
                </div>

                {/* Footer positions */}
                <div className="slider-row" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
                  <label>Footer details Y-position <span>{footerY}%</span></label>
                  <input type="range" min="80" max="98" value={footerY} onChange={e => setFooterY(parseInt(e.target.value))} />
                </div>
              </div>
            )}

            {/* ── TAB 4: FILE UPLOADS (LOGO & JEWELRY) ── */}
            {activeTab === 'assets' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="form-label">Custom Logo Image (Optional)</label>
                  <input type="file" accept="image/*" className="form-input" style={{ fontSize: 12, padding: '6px 10px' }} onChange={handleLogoUpload} />
                  {logoImg && (
                    <button type="button" className="btn-danger" style={{ marginTop: 6, width: '100%', padding: 4 }} onClick={() => setLogoImg(null)}>Clear Custom Logo</button>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
                  <label className="form-label">Custom Jewelry Image (Optional)</label>
                  <input type="file" accept="image/*" className="form-input" style={{ fontSize: 12, padding: '6px 10px' }} onChange={handleJewelryUpload} />
                  {jewelryImg && (
                    <button type="button" className="btn-danger" style={{ marginTop: 6, width: '100%', padding: 4 }} onClick={() => setJewelryImg(null)}>Clear Custom Photo</button>
                  )}
                </div>

                {/* Opacity slider for cards */}
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
                  <label className="form-label">Rates Container Fill Style</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 8 }}>
                    <input 
                      type="color" 
                      className="form-input" 
                      style={{ padding: '4px 8px', height: 38 }} 
                      value={cardBg.startsWith('rgba') ? '#ffffff' : cardBg} 
                      onChange={e => {
                        const col = e.target.value;
                        // Keep opacity, change color
                        setCardBg(`rgba(${parseInt(col.slice(1,3),16)}, ${parseInt(col.slice(3,5),16)}, ${parseInt(col.slice(5,7),16)}, 0.55)`);
                      }} 
                    />
                    <select 
                      className="form-select" 
                      onChange={e => {
                        const op = e.target.value;
                        // Replace opacity value
                        setCardBg(prev => {
                          if (prev.startsWith('rgba')) {
                            const rgb = prev.substring(5, prev.lastIndexOf(','));
                            return `rgba(${rgb}, ${op})`;
                          }
                          return prev;
                        });
                      }}
                    >
                      <option value="0.75">Solid Fill (75%)</option>
                      <option value="0.55" selected>Medium Blur (55%)</option>
                      <option value="0.30">Light Blur (30%)</option>
                      <option value="0.0">No Fill (0%)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Export Button */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
            <button 
              type="button" 
              className="btn-primary" 
              style={{ width: '100%', justifyContent: 'center', height: 42 }} 
              onClick={handleDownload}
              disabled={isCapturing}
            >
              {isCapturing ? 'Saving Poster...' : '📥 Export Poster PNG'}
            </button>
          </div>
        </div>

        {/* ── RIGHT PANEL: LIVE STUDIO CANVAS ────────────────── */}
        <div className="canvas-wrapper" style={{ display: 'flex', justifyContent: 'flex-start', overflow: 'auto', padding: '10px 0' }}>
          
          {/* 
            Fixed high-resolution layout size (540x675px) matches standard portrait ratio.
            We scale elements inside absolute layouts using translation offsets.
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
              boxShadow: '0 20px 50px rgba(30, 58, 138, 0.25)',
              boxSizing: 'border-box',
              ...canvasStyle
            }}
          >
            {/* 1. BRAND LOGO ELEMENT (ABSOLUTE) */}
            <div style={{
              position: 'absolute',
              top: `${logoY}%`,
              left: `${logoX}%`,
              transform: `translate(-50%, -50%) scale(${logoScale})`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              zIndex: 10,
              pointerEvents: 'none',
              transition: 'all 0.05s'
            }}>
              <div style={{ marginBottom: 4 }}>
                {logoImg ? (
                  <img src={logoImg} alt="Logo" style={{ maxHeight: 52, maxWidth: 180, objectFit: 'contain' }} />
                ) : (
                  <DefaultLogoSVG color={textColor.startsWith('rgba') ? null : textColor} />
                )}
              </div>
              <div className="poster-font-title" style={{ fontSize: 18, fontWeight: 700, color: textColor, lineHeight: 1, letterSpacing: 1.5 }}>MSGOLD</div>
              <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: 1.5, color: accentColor, marginTop: 3, textTransform: 'uppercase', borderTop: `0.5px solid ${accentColor}`, borderBottom: `0.5px solid ${accentColor}`, padding: '1px 6px' }}>
                Since 1930
              </div>
            </div>

            {/* 2. PRODUCT SHOWCASE IMAGE (ABSOLUTE) */}
            {showProduct && (
              <div style={{
                position: 'absolute',
                top: `${productY}%`,
                left: `${productX}%`,
                transform: `translate(-50%, -50%) scale(${productScale})`,
                width: 170,
                height: 170,
                zIndex: 5,
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.05s'
              }}>
                {jewelryImg ? (
                  <img 
                    src={jewelryImg} 
                    alt="Jewelry Showcase" 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '100%', 
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 10px 20px rgba(30,58,138,0.18))' 
                    }} 
                  />
                ) : (
                  <DefaultEarringSVG />
                )}
              </div>
            )}

            {/* 3. HERO TITLE & DATE (ABSOLUTE) */}
            <div style={{
              position: 'absolute',
              top: `${titleY}%`,
              left: '50%',
              transform: `translate(-50%, -50%) scale(${titleScale})`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              zIndex: 8,
              textAlign: 'center',
              width: '100%',
              pointerEvents: 'none',
              transition: 'all 0.05s'
            }}>
              <div className="poster-font-serif" style={{ fontSize: 26, fontStyle: 'italic', fontWeight: 600, color: accentColor, textShadow: '0 1px 1px rgba(255,255,255,0.2)', lineHeight: 1 }}>
                Today's
              </div>
              <div className="poster-font-title" style={{ fontSize: 32, fontWeight: 800, color: textColor, lineHeight: 1, letterSpacing: 2 }}>
                GOLD RATE
              </div>
              <div style={{
                border: `1.5px solid ${accentColor}`,
                borderRadius: 20,
                padding: '3px 24px',
                fontSize: 14,
                fontWeight: 700,
                color: textColor,
                background: cardBg,
                boxShadow: 'inset 0 1px 3px rgba(30,58,138,0.05)',
                marginTop: 2
              }}>
                {dateStr}
              </div>
            </div>

            {/* 4. RATE CARDS PANEL (ABSOLUTE) */}
            <div style={{
              position: 'absolute',
              top: `${ratesY}%`,
              left: '50%',
              transform: `translate(-50%, -50%) scale(${ratesScale})`,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              width: '86%',
              zIndex: 9,
              pointerEvents: 'none',
              transition: 'all 0.05s'
            }}>
              
              {/* Gold & Silver Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                
                {/* Gold Card */}
                <div style={{
                  background: cardBg,
                  border: cardBorder,
                  backdropFilter: 'blur(4px)',
                  borderRadius: 14,
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 10px rgba(30, 58, 138, 0.06)'
                }}>
                  <div style={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: '50%', 
                    background: 'linear-gradient(135deg, #fce089, #d4a32c)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: 12, 
                    fontWeight: 800, 
                    color: '#4a3605', 
                    border: '1.5px stroke #fff',
                    flexShrink: 0
                  }}>
                    Au
                  </div>
                  <div>
                    <div style={{ fontSize: 8, fontWeight: 700, color: textColor, opacity: 0.75, textTransform: 'uppercase', letterSpacing: 0.5 }}>Gold (1g)</div>
                    <div className="poster-font-serif" style={{ fontSize: 16, fontWeight: 700, color: textColor }}>₹{goldNum.toLocaleString('en-IN')}</div>
                  </div>
                </div>

                {/* Silver Card */}
                <div style={{
                  background: cardBg,
                  border: cardBorder,
                  backdropFilter: 'blur(4px)',
                  borderRadius: 14,
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 10px rgba(30, 58, 138, 0.06)'
                }}>
                  <div style={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: '50%', 
                    background: 'linear-gradient(135deg, #e4eaf0, #9eb0c2)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: 12, 
                    fontWeight: 800, 
                    color: '#313f4d', 
                    border: '1.5px stroke #fff',
                    flexShrink: 0
                  }}>
                    Ag
                  </div>
                  <div>
                    <div style={{ fontSize: 8, fontWeight: 700, color: textColor, opacity: 0.75, textTransform: 'uppercase', letterSpacing: 0.5 }}>Silver (1g)</div>
                    <div className="poster-font-serif" style={{ fontSize: 16, fontWeight: 700, color: textColor }}>₹{silverNum.toLocaleString('en-IN')}</div>
                  </div>
                </div>

              </div>

              {/* 8 Gram Banner */}
              <div style={{
                background: cardBg,
                border: cardBorder,
                backdropFilter: 'blur(4px)',
                borderRadius: 12,
                padding: '11px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 4px 12px rgba(30, 58, 138, 0.08)'
              }}>
                <div className="poster-font-title" style={{ fontSize: 13, fontWeight: 700, color: textColor, letterSpacing: 0.8 }}>8 GRAMS</div>
                <div className="poster-font-serif" style={{ fontSize: 22, fontWeight: 800, color: textColor.startsWith('#fff') || textColor.startsWith('#f8') ? textColor : '#991b1b', textShadow: '0 1px 1px rgba(255,255,255,0.1)' }}>
                  ₹{gold8gValue}
                </div>
              </div>

            </div>

            {/* 5. FOOTER DETAILS (ABSOLUTE) */}
            <div style={{
              position: 'absolute',
              top: `${footerY}%`,
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '88%',
              borderTop: `0.5px solid ${accentColor}`,
              paddingTop: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              fontSize: 10,
              fontWeight: 600,
              color: textColor,
              textAlign: 'center',
              zIndex: 10,
              pointerEvents: 'none',
              transition: 'all 0.05s'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 11 }}>📍</span> <span>{locationStr.toUpperCase()}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, opacity: 0.9 }}>
                <span style={{ fontSize: 11 }}>📞</span> <span>{phoneStr}</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
