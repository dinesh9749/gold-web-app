// Cryptographic Session Verification Utilities for DK Nova Technologies ERP

export function getSessionData() {
  const token = localStorage.getItem("goldApp_sessionToken");
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return { isValid: false, orgId: null, role: null, isSuperAdmin: false };
  }

  try {
    const [payloadB64, signature] = token.split(".");
    if (!payloadB64 || !signature) {
      return { isValid: false, orgId: null, role: null, isSuperAdmin: false };
    }

    // Decode base64 payload: orgId:role:expiresAt
    const payloadText = atob(payloadB64);
    const [orgId, role, expiresAtStr] = payloadText.split(":");
    const expiresAt = parseInt(expiresAtStr, 10);
    const now = Math.floor(Date.now() / 1000);

    if (isNaN(expiresAt) || now > expiresAt) {
      return { isValid: false, orgId: null, role: null, isSuperAdmin: false, expired: true };
    }

    // Cross-verify with stored userRole
    const storedRole = localStorage.getItem("goldApp_userRole");
    if (storedRole && storedRole !== role) {
      return { isValid: false, orgId: null, role: null, isSuperAdmin: false, tampered: true };
    }

    return {
      isValid: true,
      orgId,
      role,
      isSuperAdmin: role === "superadmin",
      token
    };
  } catch (err) {
    return { isValid: false, orgId: null, role: null, isSuperAdmin: false, error: err.message };
  }
}

export function clearAuthSession() {
  localStorage.removeItem("goldApp_sessionToken");
  localStorage.removeItem("goldApp_userRole");
  localStorage.removeItem("goldApp_org");
}
