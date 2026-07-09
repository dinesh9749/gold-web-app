import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseAPI } from '../db/supabaseAPI';

export default function Login() {
  const navigate = useNavigate();
  const [loginSlug, setLoginSlug] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // If already logged in, redirect accordingly
    const userRole = localStorage.getItem("goldApp_userRole");
    if (userRole === "superadmin") {
      navigate("/super-admin", { replace: true });
    } else if (userRole === "org") {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginSlug.trim() || !password) {
      setErrorMsg("Please enter both organization name and password.");
      return;
    }
    setErrorMsg('');
    setLoading(true);

    try {
      // 1. Check Super Admin hardcoded login
      if (loginSlug.trim().toLowerCase() === 'superadmin' && password === 'supergold123') {
        localStorage.setItem("goldApp_userRole", "superadmin");
        localStorage.removeItem("goldApp_org");
        navigate("/super-admin", { replace: true });
        return;
      }

      // 2. Query organization in database
      const org = await supabaseAPI.loginOrganization(loginSlug, password);
      if (org) {
        if (!org.isActive) {
          setErrorMsg("This organization account is deactivated. Please contact support.");
          setLoading(false);
          return;
        }
        localStorage.setItem("goldApp_userRole", "org");
        localStorage.setItem("goldApp_org", JSON.stringify(org));
        navigate("/dashboard", { replace: true });
      } else {
        setErrorMsg("Invalid organization slug or password.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Authentication failed. Make sure database migrations are run.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 50%, #fffdf4 0%, #fef3c7 100%)',
      fontFamily: 'var(--font-family)',
      padding: 16
    }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: 400,
        padding: 32,
        borderRadius: 20,
        boxShadow: '0 20px 40px rgba(180, 83, 9, 0.08)',
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(251, 191, 36, 0.3)',
      }}>
        {/* Logo/Icon */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
          <div style={{
            width: 60,
            height: 60,
            borderRadius: 18,
            background: 'linear-gradient(135deg, #fbbf24, #d97706)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
            boxShadow: '0 8px 16px rgba(217, 119, 6, 0.2)',
            marginBottom: 16
          }}>💎</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#92400e', margin: 0 }}>DK Nova Technologies</h2>
          <p style={{ fontSize: 12, color: '#b45309', margin: '4px 0 0 0', fontWeight: 600 }}>Multi-Store Management Portal</p>
        </div>

        {errorMsg && (
          <div style={{
            padding: '10px 14px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid #f87171',
            color: '#ef4444',
            borderRadius: 10,
            fontSize: 12,
            marginBottom: 20,
            fontWeight: 600
          }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleLoginSubmit}>
          <div style={{ marginBottom: 18 }}>
            <label className="form-label" style={{ color: '#92400e', fontWeight: 600 }}>Organization ID / Slug</label>
            <input
              type="text"
              value={loginSlug}
              onChange={e => setLoginSlug(e.target.value)}
              className="form-input"
              placeholder="e.g. msgold, superadmin"
              style={{
                background: '#ffffff',
                borderColor: 'rgba(217, 119, 6, 0.2)',
                color: '#78350f',
                padding: '10px 12px',
                fontSize: 13
              }}
              required
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label className="form-label" style={{ color: '#92400e', fontWeight: 600 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="form-input"
              placeholder="••••••••"
              style={{
                background: '#ffffff',
                borderColor: 'rgba(217, 119, 6, 0.2)',
                color: '#78350f',
                padding: '10px 12px',
                fontSize: 13
              }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: 14,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #fbbf24, #d97706)',
              color: '#ffffff',
              border: 'none',
              boxShadow: '0 4px 12px rgba(217, 119, 6, 0.15)',
              cursor: 'pointer'
            }}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 11, color: '#b45309' }}>
          By logging in, you agree to our multi-tenant security policies.
        </div>
      </div>
    </div>
  );
}
