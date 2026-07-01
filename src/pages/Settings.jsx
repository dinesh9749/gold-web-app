import { useState } from 'react';

export default function Settings() {
  return (
    <div>
      {/* Header */}
      <div className="section-header" style={{ marginBottom: 24 }}>
        <div>
          <div className="section-title" style={{ fontSize: 18 }}>Settings</div>
          <div className="section-sub">App configuration settings</div>
        </div>
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
