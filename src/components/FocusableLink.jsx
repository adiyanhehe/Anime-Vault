// src/components/FocusableLink.jsx
import React from "react";
import { Link } from "react-router-dom";

/**
 * A simple link that can receive focus styles.
 * It works like <Link> but adds a visible focus ring.
 */
export const FocusableLink = ({ to, className = "", children, ...rest }) => (
  <Link
    to={to}
    className={`${className} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-${'{'}'var(--brand-color)${'}'}`}
    {...rest}
  >
    {children}
  </Link>
);

export default FocusableLink;
