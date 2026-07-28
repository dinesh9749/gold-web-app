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

  // 4. ERP Module Check (defaults to enabled if not explicitly false)
  if (erpModuleKey) {
    const isModuleEnabled = org.features 
      ? (org.features[erpModuleKey] !== undefined ? org.features[erpModuleKey] !== false : true)
      : true;

    if (!isModuleEnabled) {
      // Find fallback module enabled for this org
      const hasGold = org.features ? (org.features.gold_retail_enabled !== false) : true;
      const hasSilverRetail = org.features ? (org.features.silver_retail_enabled === true) : false;

      if (hasGold && location.pathname !== '/dashboard') {
        return <Navigate to="/dashboard" replace />;
      } else if (hasSilverRetail && location.pathname !== '/silver-retail-dashboard') {
        return <Navigate to="/silver-retail-dashboard" replace />;
      }
    }
  }

  // 5. Feature Gate Checks (defaults to enabled if not explicitly false)
  if (featureKey) {
    const isEnabled = org.features 
      ? (org.features[featureKey] !== undefined ? org.features[featureKey] !== false : true)
      : true;

    if (!isEnabled) {
      const activeErp = localStorage.getItem("activeErpModule") || "gold_retail";
      if (activeErp === "silver_retail") {
        return <Navigate to="/silver-retail-dashboard" replace />;
      } else {
        return <Navigate to="/dashboard" replace />;
      }
    }
  }

  return children;
}
