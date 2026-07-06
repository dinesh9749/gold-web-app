import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export default function FeatureGuard({ children, isSuperAdminOnly, featureKey }) {
  const location = useLocation();
  const userRole = localStorage.getItem("goldApp_userRole");
  const org = JSON.parse(localStorage.getItem("goldApp_org") || "null");

  // 1. Check Authentication
  if (!userRole) {
    // If not logged in and not on login page, redirect to login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Super Admin Authorization
  if (isSuperAdminOnly) {
    if (userRole !== "superadmin") {
      // Regular tenant trying to access superadmin page
      return <Navigate to="/dashboard" replace />;
    }
    return children;
  }

  // If logged in as superadmin, they should only go to superadmin panel
  if (userRole === "superadmin") {
    // If superadmin tries to access store routes, send them to superadmin dashboard
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

  // 4. Feature Gate Checks
  if (featureKey) {
    const isEnabled = org.features ? !!org.features[featureKey] : true;
    if (!isEnabled) {
      alert("Access Denied: This feature is disabled for your organization.");
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}
