import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '../api/UserContext'; // corrected path

/**
 * Higher‑order component that renders children only if the current user is an admin.
 * Non‑admin users are redirected to the home page (or you can change to a 403 page).
 */
export default function RequireAdmin({ children }) {
  const { user } = useUser();
  const location = useLocation();

  if (!user || !user.is_admin) {
    // Preserve the attempted location for possible future use
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
