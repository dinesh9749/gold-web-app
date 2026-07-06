import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseAPI } from '../db/supabaseAPI';

const INITIAL_FEATURES = {
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
  settings_enabled: true
};

const FEATURE_LABELS = {
  dashboard_enabled: 'Dashboard',
  invoice_enabled: 'Invoice',
  receipt_enabled: 'Receipt',
  rateinput_enabled: 'Rate Input',
  customerview_enabled: 'Customers',
  salesorders_enabled: 'Sales Orders',
  digigold_enabled: 'DigiGold',
  soldering_enabled: 'M.S. Soldering & Engraving',
  attendance_enabled: 'Attendance',
  empsetup_enabled: 'Employee Setup',
  poster_enabled: 'Poster Creator',
  settings_enabled: 'Settings'
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
    setFeatures(org.features || { ...INITIAL_FEATURES });
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
            👑 Super Admin Master Dashboard
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Manage organizations and store feature sets</div>
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
              {organizations.map(org => (
                <div key={org.id} style={{
                  padding: 16,
                  borderRadius: 12,
                  border: '1px solid var(--border-default)',
                  background: 'var(--bg-elevated)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  transition: 'transform 0.2s',
                  cursor: 'pointer'
                }}
                onClick={() => handleEditClick(org)}
                >
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
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 10 }}>
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
                  
                  {/* Delete Button */}
                  {org.loginSlug !== 'msgold' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(org.id, org.name);
                      }}
                      className="btn-danger"
                      style={{ padding: '6px 10px', fontSize: 11, marginLeft: 12 }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))}
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

              {/* Feature Selection Checklist */}
              <div>
                <label className="form-label" style={{ marginBottom: 8, fontWeight: 700 }}>Enable / Disable Features</label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px 12px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 8,
                  padding: 12,
                  maxHeight: 250,
                  overflowY: 'auto'
                }}>
                  {Object.keys(INITIAL_FEATURES).map(key => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="checkbox"
                        id={`feat_${key}`}
                        checked={!!features[key]}
                        onChange={() => handleFeatureToggle(key)}
                        style={{ width: 14, height: 14, cursor: 'pointer' }}
                      />
                      <label htmlFor={`feat_${key}`} style={{ fontSize: 11, cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        {FEATURE_LABELS[key]}
                      </label>
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
