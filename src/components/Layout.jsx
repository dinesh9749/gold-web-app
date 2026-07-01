import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, Navigate } from 'react-router-dom';

// Icons as inline SVGs for clean, lightweight rendering
const icons = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  invoice: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  receipt: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 01-2-2v-5h20v5a2 2 0 01-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  ),
  rate: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M16 8h-6a2 2 0 000 4h4a2 2 0 010 4H8" /><line x1="12" y1="6" x2="12" y2="8" /><line x1="12" y1="16" x2="12" y2="18" />
    </svg>
  ),
  customers: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  orders: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  ),
  digi: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
    </svg>
  ),
  soldering: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.77 3.77z" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
  attendance: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <path d="M9 16l2 2 4-4" />
    </svg>
  ),
  empsetup: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  ),
  poster: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
};


const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/Invoice', label: 'Invoice', icon: 'invoice' },
  { to: '/Receipt', label: 'Receipt', icon: 'receipt' },
  { to: '/Rateinput', label: 'Rate Input', icon: 'rate' },
  { to: '/CustomerView', label: 'Customers', icon: 'customers' },
  { to: '/SalesOrders', label: 'Sales Orders', icon: 'orders' },
  { to: '/MsDigiGold', label: 'DigiGold', icon: 'digi' },
  { to: '/MsSolderingEngraving', label: 'M.S. Soldering & Engraving', icon: 'soldering' },
  { to: '/attendance', label: 'Attendance', icon: 'attendance' },
  { to: '/employee-setup', label: 'Employee Setup', icon: 'empsetup' },
  { to: '/poster-create', label: 'Poster Creator', icon: 'poster' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
];


const pageTitles = {
  dashboard: 'Dashboard',
  invoice: 'Invoice',
  receipt: 'Receipt',
  rateinput: 'Rate Input',
  customerview: 'Customers',
  salesorders: 'Sales Orders',
  msdigigold: 'DigiGold',
  mssolderingengraving: 'M.S. Soldering & Engraving',
  settings: 'Settings',
  'poster-create': 'Poster Creator',
};

function Layout() {
  const location = useLocation();
  const currentPath = location.pathname.split('/')[1]?.toLowerCase();
  const pageTitle = pageTitles[currentPath] || 'Dashboard';

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const isAdmin = true;
  const mainMenu = navItems.slice(0, 4);
  const managementMenu = navItems.slice(4);

  return (
    <div className={`app-layout ${isMobileSidebarOpen ? 'sidebar-open' : ''}`}>
      {/* Mobile Sidebar Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR ─────────────────────────────────────────── */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-inner">
            <div className="sidebar-logo-icon">💎</div>
            <div className="sidebar-logo-text">
              <span className="sidebar-logo-name">M.S. Gold</span>
              <span className="sidebar-logo-sub">Jewellery ERP</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="nav-section-label">Main Menu</div>
          {mainMenu.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              onClick={() => setIsMobileSidebarOpen(false)}
            >
              <span className="nav-link-icon">{icons[item.icon]}</span>
              {item.label}
            </NavLink>
          ))}

          <div className="nav-section-label" style={{ marginTop: 8 }}>Management</div>
          {managementMenu.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              onClick={() => setIsMobileSidebarOpen(false)}
            >
              <span className="nav-link-icon">{icons[item.icon]}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 10px',
            borderRadius: 8,
            background: 'rgba(251,191,36,0.06)',
            border: '1px solid var(--border-subtle)',
          }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #fbbf24, #d97706)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
              color: '#ffffff',
              flexShrink: 0,
            }}>{isAdmin ? "A" : "S"}</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{isAdmin ? "Dheena" : "Staff User"}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{isAdmin ? "Administrator" : "Staff Account"}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ─────────────────────────────────────── */}
      <div className="main-content">
        {/* Top bar */}
        <header className="topbar">
          <div className="topbar-title">
            <button
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="mobile-menu-btn"
              title="Toggle Menu"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>
            <span className="topbar-title-dot" />
            {pageTitle}
          </div>
          <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="topbar-badge">✦ M.S. Gold</span>
            <div className="topbar-avatar" title="Administrator Mode">
              A
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="page-content">
          <Outlet context={{ isAdmin }} />
        </main>
      </div>
    </div>
  );
}

export default Layout;