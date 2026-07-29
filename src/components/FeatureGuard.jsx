import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export default function FeatureGuard({ children, isSuperAdminOnly, featureKey, erpModuleKey }) {
  const location = useLocation();
  const userRole = localStorage.getItem("goldApp_userRole");
  const org = JSON.parse(localStorage.getItem("goldApp_org") || "null");

  // 1. Check Authentication
  if (!userRole) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Super Admin Authorization
  if (isSuperAdminOnly) {
    if (userRole !== "superadmin") {
      return <Navigate to="/dashboard" replace />;
    }
    return children;
  }

  // If logged in as superadmin, send them to superadmin dashboard
  if (userRole === "superadmin") {
    return <Navigate to="/super-admin" replace />;
  }

  // 3. Organization Account Active Check
  if (!org) {
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }

  if (org.isActive === false) {
    localStorage.clear();
    alert("This organization account is deactivated. Please contact the administrator.");
    return <Navigate to="/login" replace />;
  }

  // 4. Helper Flags for ERP Module Access
  const hasGold = !org.features || org.features.gold_retail_enabled !== false;
  const hasSilverRetail = !org.features || org.features.silver_retail_enabled !== false;

  // 4. ERP Module Check
  if (erpModuleKey) {
    const isModuleEnabled = !org.features || org.features[erpModuleKey] !== false;

    if (!isModuleEnabled) {
      if (hasGold && location.pathname !== '/dashboard') {
        return <Navigate to="/dashboard" replace />;
      } else if (hasSilverRetail && location.pathname !== '/silver-retail-dashboard') {
        return <Navigate to="/silver-retail-dashboard" replace />;
      } else {
        // Access restricted when target module (or both modules) are disabled
        return (
          <div style={{
            minHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: 32,
            fontFamily: 'var(--font-family)'
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
              ERP Module Access Disabled
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 440, margin: '0 0 20px 0', lineHeight: 1.5 }}>
              Access to this software ERP module has been turned off by your administrator for organization "{org.name}".
            </p>
            <button
              onClick={() => { localStorage.clear(); window.location.href = '#/login'; }}
              className="btn-secondary"
              style={{ padding: '8px 18px', fontSize: 12, fontWeight: 700 }}
            >
              Sign Out & Switch Account
            </button>
          </div>
        );
      }
    }
  }

  // 5. Feature Gate Checks
  if (featureKey) {
    const isEnabled = !org.features || org.features[featureKey] !== false;

    if (!isEnabled) {
      // Determine safe target to prevent infinite redirect loops
      const activeErp = localStorage.getItem("activeErpModule") || "gold_retail";
      
      if (activeErp === "silver_retail" && hasSilverRetail && location.pathname !== "/silver-retail-dashboard") {
        return <Navigate to="/silver-retail-dashboard" replace />;
      } else if (hasGold && location.pathname !== "/dashboard") {
        return <Navigate to="/dashboard" replace />;
      } else if (hasSilverRetail && location.pathname !== "/silver-retail-dashboard") {
        return <Navigate to="/silver-retail-dashboard" replace />;
      } else {
        return (
          <div style={{
            padding: 32,
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: 14,
            fontWeight: 600
          }}>
            ⚠️ This feature has been disabled by your organization administrator.
          </div>
        );
      }
    }
  }

  return children;
}
