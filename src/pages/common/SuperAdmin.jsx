import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseAPI } from '../../db/supabaseAPI';

const INITIAL_FEATURES = {
  // ERP Modules Access
  gold_retail_enabled: true,
  silver_retail_enabled: true,

  // Gold Retail Pages
  dashboard_enabled: true,
  invoice_enabled: true,
  receipt_enabled: true,
  rateinput_enabled: true,
  customerview_enabled: true,
  salesorders_enabled: true,
  digigold_enabled: true,
  soldering_enabled: true,
  attendance_enabled: true,
  empsetup_enabled: true,
  poster_enabled: true,
  settings_enabled: true,
  stock_enabled: true,

  // Silver Retail Pages
  silver_retail_dashboard_enabled: true,
  silver_retail_invoice_enabled: true,
  silver_retail_stock_enabled: true,
  silver_retail_ledger_enabled: true,
  silver_retail_return_enabled: true,
  silver_retail_rateinput_enabled: true,
};

const FEATURE_CATEGORIES = [
  {
    title: '🏆 Gold Retail ERP Module',
    moduleKey: 'gold_retail_enabled',
    features: [
      { key: 'gold_retail_enabled', label: 'Gold Retail ERP Access (Master Switch)' },
      { key: 'dashboard_enabled', label: 'Gold Dashboard' },
      { key: 'invoice_enabled', label: 'Gold Retail Invoice' },
      { key: 'receipt_enabled', label: 'Payment Receipt' },
      { key: 'rateinput_enabled', label: 'Rate Input' },
      { key: 'customerview_enabled', label: 'Customer Management' },
      { key: 'salesorders_enabled', label: 'Sales Orders' },
      { key: 'digigold_enabled', label: 'DigiGold Schemes' },
      { key: 'soldering_enabled', label: 'M.S. Soldering & Engraving' },
      { key: 'attendance_enabled', label: 'Attendance Management' },
      { key: 'empsetup_enabled', label: 'Employee Setup' },
      { key: 'poster_enabled', label: 'Poster Creator' },
      { key: 'stock_enabled', label: 'Gold Stock Inventory' },
      { key: 'settings_enabled', label: 'Settings' },
    ]
  },
  {
    title: '🥈 Silver Retail ERP Module',
    moduleKey: 'silver_retail_enabled',
    features: [
      { key: 'silver_retail_enabled', label: 'Silver Retail ERP Access (Master Switch)' },
      { key: 'silver_retail_dashboard_enabled', label: 'Silver Retail Dashboard' },
      { key: 'silver_retail_invoice_enabled', label: 'Silver Retail Invoice' },
      { key: 'silver_retail_stock_enabled', label: 'Silver Stock Inventory' },
      { key: 'silver_retail_ledger_enabled', label: 'Silver Customer Ledger' },
      { key: 'silver_retail_return_enabled', label: 'Silver Sales Return' },
      { key: 'silver_retail_rateinput_enabled', label: 'Silver Rate Input & Audit Log' },
    ]
  }
];

const FEATURE_LABELS = {
  gold_retail_enabled: 'Gold Retail ERP Access',
  silver_retail_enabled: 'Silver Retail ERP Access',
  dashboard_enabled: 'Gold Dashboard',
  invoice_enabled: 'Invoice',
  receipt_enabled: 'Receipt',
  rateinput_enabled: 'Rate Input',
  customerview_enabled: 'Customers',
  salesorders_enabled: 'Sales Orders',
  digigold_enabled: 'DigiGold',
  soldering_enabled: 'M.S. Soldering',
  attendance_enabled: 'Attendance',
  empsetup_enabled: 'Employee Setup',
  poster_enabled: 'Poster Creator',
  settings_enabled: 'Settings',
  stock_enabled: 'Stock Inventory',
  silver_retail_dashboard_enabled: 'Silver Retail Dashboard',
  silver_retail_invoice_enabled: 'Silver Retail Invoice',
  silver_retail_stock_enabled: 'Silver Stock Inventory',
  silver_retail_ledger_enabled: 'Silver Customer Ledger',
  silver_retail_return_enabled: 'Silver Sales Return',
};

export default function SuperAdmin() {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [loginSlug, setLoginSlug] = useState('');
  const [password, setPassword] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [features, setFeatures] = useState({ ...INITIAL_FEATURES });

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadOrgs();
  }, []);

  const loadOrgs = async () => {
    try {
      setLoading(true);
      const data = await supabaseAPI.getAllOrganizations();
      setOrganizations(data || []);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to load organizations. Make sure Supabase table migrations are run.");
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureToggle = (key) => {
    setFeatures(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setLoginSlug('');
    setPassword('');
    setIsActive(true);
    setFeatures({ ...INITIAL_FEATURES });
    setErrorMsg('');
  };

  const handleEditClick = (org) => {
    setEditingId(org.id);
    setName(org.name);
    setLoginSlug(org.loginSlug);
    setPassword(org.password);
    setIsActive(org.isActive);
    setFeatures({ ...INITIAL_FEATURES, ...(org.features || {}) });
    setErrorMsg('');
  };

  const handleSaveSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !loginSlug.trim() || !password) {
      setErrorMsg("Please fill in all organization details.");
      return;
    }
    setErrorMsg('');
    setSaving(true);

    const payload = {
      name: name.trim(),
      loginSlug: loginSlug.trim().toLowerCase(),
      password,
      isActive,
      features
    };

    try {
      if (editingId) {
        await supabaseAPI.updateOrganization(editingId, payload);
        setSuccessMsg("Organization updated successfully!");
      } else {
        await supabaseAPI.saveOrganization(payload);
        setSuccessMsg("Organization created successfully!");
      }
      resetForm();
      await loadOrgs();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to save organization.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = async (id, name) => {
    if (!window.confirm(`Delete organization "${name}"? This action cannot be undone.`)) return;
    try {
      await supabaseAPI.deleteOrganization(id);
      setSuccessMsg("Organization deleted.");
      await loadOrgs();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to delete organization.");
    }
  };

  const handleToggleActiveClick = async (e, org) => {
    e.stopPropagation();
    const updatedPayload = {
      name: org.name,
      loginSlug: org.loginSlug,
      password: org.password,
      isActive: !org.isActive,
      features: org.features
    };
    try {
      setSaving(true);
      await supabaseAPI.updateOrganization(org.id, updatedPayload);
      setSuccessMsg(`Organization "${org.name}" has been ${!org.isActive ? 'activated' : 'deactivated'}.`);
      await loadOrgs();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to toggle organization status.");
    } finally {
      setSaving(false);
    }
  };

  const handleQuickModuleToggle = async (e, org, moduleKey) => {
    e.stopPropagation();
    const currentFeatures = org.features || { ...INITIAL_FEATURES };
    const currentVal = currentFeatures[moduleKey] !== undefined ? currentFeatures[moduleKey] !== false : (moduleKey === 'gold_retail_enabled');
    const updatedVal = !currentVal;

    const newFeatures = {
      ...currentFeatures,
      [moduleKey]: updatedVal
    };

    try {
      setSaving(true);
      await supabaseAPI.updateOrganizationFeatures(org.id, newFeatures);
      const moduleLabel = moduleKey === 'gold_retail_enabled' ? 'Gold Retail ERP' : 'Silver Retail ERP';
      setSuccessMsg(`${moduleLabel} ${updatedVal ? 'enabled' : 'disabled'} for "${org.name}".`);
      
      if (editingId === org.id) {
        setFeatures(newFeatures);
      }
      
      await loadOrgs();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to toggle module status.");
    } finally {
      setSaving(false);
    }
  };

  const handleEnableCategoryAll = (cat) => {
    setFeatures(prev => {
      const updated = { ...prev };
      cat.features.forEach(f => {
        updated[f.key] = true;
      });
      return updated;
    });
  };

  const handleDisableCategoryAll = (cat) => {
    setFeatures(prev => {
      const updated = { ...prev };
      cat.features.forEach(f => {
        updated[f.key] = false;
      });
      return updated;
    });
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-default)',
      fontFamily: 'var(--font-family)',
      color: 'var(--text-primary)',
      padding: '24px 32px'
    }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 20,
        marginBottom: 28,
        borderBottom: '1px solid var(--border-default)'
      }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--gold-300)', display: 'flex', alignItems: 'center', gap: 8 }}>
            👑 DK Nova Technologies - SaaS Admin Master Dashboard
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Manage tenant organizations and software ERP module access</div>
        </div>
        <button onClick={handleLogout} className="btn-secondary" style={{
          padding: '8px 16px',
          borderColor: 'var(--border-default)',
          color: 'var(--text-secondary)',
          fontSize: 12,
          fontWeight: 600
        }}>
          Logout
        </button>
      </header>

      {successMsg && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(74,222,128,0.1)',
          border: '1px solid #4ade80',
          color: '#4ade80',
          borderRadius: 8,
          fontSize: 13,
          marginBottom: 20,
          fontWeight: 600
        }}>
          ✓ {successMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid #f87171',
          color: '#f87171',
          borderRadius: 8,
          fontSize: 13,
          marginBottom: 20,
          fontWeight: 600
        }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
        {/* Left Column: Organization List */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
            Registered Organizations ({organizations.length})
          </h3>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>Loading tenant organizations...</div>
          ) : organizations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>No tenant organizations created yet. Add one on the right.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {organizations.map(org => {
                const isGoldEnabled = org.features ? (org.features.gold_retail_enabled !== false) : true;
                const isSilverEnabled = org.features ? (org.features.silver_retail_enabled === true) : false;

                return (
                  <div key={org.id} style={{
                    padding: 16,
                    borderRadius: 12,
                    border: '1px solid var(--border-default)',
                    background: 'var(--bg-elevated)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    transition: 'transform 0.2s',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleEditClick(org)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{org.name}</span>
                          <span style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 20,
                            background: org.isActive ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)',
                            color: org.isActive ? '#4ade80' : '#f87171',
                            border: `1px solid ${org.isActive ? '#4ade80' : '#f87171'}`
                          }}>
                            {org.isActive ? 'Active' : 'Deactivated'}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                          Slug: <code style={{ color: 'var(--gold-200)' }}>{org.loginSlug}</code> | Password: <code>{org.password}</code>
                        </div>
                      </div>
                      
                      {/* Deactivate/Activate & Delete Buttons */}
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 12 }}>
                        <button
                          onClick={(e) => handleToggleActiveClick(e, org)}
                          className={org.isActive ? "btn-secondary" : "btn-primary"}
                          style={{
                            padding: '6px 10px',
                            fontSize: 11,
                            borderColor: org.isActive ? '#ef4444' : '#22c55e',
                            color: org.isActive ? '#ef4444' : '#ffffff',
                            background: org.isActive ? 'none' : '#22c55e',
                          }}
                        >
                          {org.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(org.id, org.name);
                          }}
                          className="btn-danger"
                          style={{ padding: '6px 10px', fontSize: 11 }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Quick Software Module Enable / Disable Toggle Controls */}
                    <div style={{
                      paddingTop: 10,
                      borderTop: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      flexWrap: 'wrap'
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Software Modules:
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {/* Gold Retail ERP Toggle */}
                        <button
                          type="button"
                          onClick={(e) => handleQuickModuleToggle(e, org, 'gold_retail_enabled')}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '5px 12px',
                            borderRadius: 8,
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            border: `1px solid ${isGoldEnabled ? 'rgba(251,191,36,0.4)' : 'var(--border-default)'}`,
                            background: isGoldEnabled ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.03)',
                            color: isGoldEnabled ? '#fbbf24' : 'var(--text-muted)',
                            transition: 'all 0.2s'
                          }}
                          title="Click to Enable or Disable Gold Retail ERP Module"
                        >
                          <span>🏆 Gold ERP</span>
                          <span style={{
                            fontSize: 9,
                            padding: '2px 6px',
                            borderRadius: 4,
                            fontWeight: 800,
                            background: isGoldEnabled ? '#22c55e' : '#ef4444',
                            color: '#ffffff'
                          }}>
                            {isGoldEnabled ? 'ENABLED' : 'DISABLED'}
                          </span>
                        </button>

                        {/* Silver Retail ERP Toggle */}
                        <button
                          type="button"
                          onClick={(e) => handleQuickModuleToggle(e, org, 'silver_retail_enabled')}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '5px 12px',
                            borderRadius: 8,
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            border: `1px solid ${isSilverEnabled ? 'rgba(148,163,184,0.4)' : 'var(--border-default)'}`,
                            background: isSilverEnabled ? 'rgba(148,163,184,0.12)' : 'rgba(255,255,255,0.03)',
                            color: isSilverEnabled ? '#e2e8f0' : 'var(--text-muted)',
                            transition: 'all 0.2s'
                          }}
                          title="Click to Enable or Disable Silver Retail ERP Module"
                        >
                          <span>🥈 Silver ERP</span>
                          <span style={{
                            fontSize: 9,
                            padding: '2px 6px',
                            borderRadius: 4,
                            fontWeight: 800,
                            background: isSilverEnabled ? '#22c55e' : '#ef4444',
                            color: '#ffffff'
                          }}>
                            {isSilverEnabled ? 'ENABLED' : 'DISABLED'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Active Feature Badges */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {Object.keys(org.features || {}).map(fKey => {
                        const isFEnabled = org.features[fKey];
                        if (!isFEnabled) return null;
                        return (
                          <span key={fKey} style={{
                            fontSize: 9,
                            padding: '2px 6px',
                            background: 'rgba(251,191,36,0.06)',
                            border: '1px solid rgba(251,191,36,0.2)',
                            color: 'var(--gold-200)',
                            borderRadius: 4
                          }}>
                            {FEATURE_LABELS[fKey] || fKey}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Add/Edit Form */}
        <div className="card" style={{ padding: 24, position: 'sticky', top: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{editingId ? 'Edit Organization' : 'Create Organization'}</span>
            {editingId && (
              <button onClick={resetForm} className="btn-secondary" style={{ padding: '4px 8px', fontSize: 11 }}>Clear</button>
            )}
          </h3>

          <form onSubmit={handleSaveSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="form-label">Organization Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="form-input"
                  placeholder="e.g. Diamond Jewelers"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label">Login Slug (Unique ID)</label>
                  <input
                    type="text"
                    value={loginSlug}
                    onChange={e => setLoginSlug(e.target.value)}
                    className="form-input"
                    placeholder="e.g. diamond"
                    disabled={editingId && loginSlug === 'msgold'}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Login Password</label>
                  <input
                    type="text"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="form-input"
                    placeholder="e.g. secure123"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0' }}>
                <input
                  type="checkbox"
                  id="orgActiveCheck"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <label htmlFor="orgActiveCheck" style={{ fontSize: 12, fontWeight: 600, cursor: 'pointer', color: 'var(--text-primary)' }}>
                  Organization Account Active
                </label>
              </div>

              {/* Categorized Feature Selection Checklist */}
              <div>
                <label className="form-label" style={{ marginBottom: 8, fontWeight: 700 }}>Enable / Disable ERP Modules & Features</label>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 10,
                  padding: 14,
                  maxHeight: 280,
                  overflowY: 'auto'
                }}>
                  {FEATURE_CATEGORIES.map((cat, idx) => (
                    <div key={idx} style={{ borderBottom: idx !== FEATURE_CATEGORIES.length - 1 ? '1px solid var(--border-subtle)' : 'none', paddingBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold-300)' }}>
                          {cat.title}
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => handleEnableCategoryAll(cat)}
                            style={{ padding: '2px 6px', fontSize: 10, borderRadius: 4, background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)', cursor: 'pointer', fontWeight: 600 }}
                          >
                            Enable All
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDisableCategoryAll(cat)}
                            style={{ padding: '2px 6px', fontSize: 10, borderRadius: 4, background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer', fontWeight: 600 }}
                          >
                            Disable All
                          </button>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 10px' }}>
                        {cat.features.map(feat => {
                          const isChecked = !!features[feat.key];
                          const isMasterSwitch = feat.key.endsWith('_enabled') && (feat.key === 'gold_retail_enabled' || feat.key === 'silver_retail_enabled');

                          return (
                            <div key={feat.key} style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              padding: isMasterSwitch ? '4px 8px' : '2px 4px',
                              borderRadius: isMasterSwitch ? 6 : 0,
                              background: isMasterSwitch ? (isChecked ? 'rgba(251,191,36,0.1)' : 'rgba(239,68,68,0.1)') : 'transparent',
                              border: isMasterSwitch ? `1px solid ${isChecked ? 'rgba(251,191,36,0.3)' : 'rgba(239,68,68,0.3)'}` : 'none'
                            }}>
                              <input
                                type="checkbox"
                                id={`feat_${feat.key}`}
                                checked={isChecked}
                                onChange={() => handleFeatureToggle(feat.key)}
                                style={{ width: 14, height: 14, cursor: 'pointer' }}
                              />
                              <label htmlFor={`feat_${feat.key}`} style={{
                                fontSize: 11,
                                cursor: 'pointer',
                                color: isMasterSwitch ? (isChecked ? '#fbbf24' : '#f87171') : (isChecked ? 'var(--text-primary)' : 'var(--text-secondary)'),
                                fontWeight: isMasterSwitch ? 800 : 400
                              }}>
                                {feat.label}
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="btn-primary"
                style={{
                  padding: '10px 16px',
                  fontSize: 13,
                  fontWeight: 700,
                  marginTop: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {saving ? 'Saving...' : editingId ? 'Update Organization' : 'Create Organization'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
