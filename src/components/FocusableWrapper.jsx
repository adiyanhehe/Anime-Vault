import React from 'react';
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import { NavLink, Link, useNavigate } from 'react-router-dom';

export function FocusableNavLink({ to, children, className, ...props }) {
  const navigate = useNavigate();
  const { ref, focused } = useFocusable({
    onEnterPress: () => navigate(to)
  });

  return (
    <NavLink
      to={to}
      ref={ref}
      className={({ isActive }) => {
        const baseClass = typeof className === 'function' ? className({ isActive }) : className;
        return `${baseClass} ${focused ? 'focused-card' : ''}`;
      }}
      {...props}
    >
      {children}
    </NavLink>
  );
}

export function FocusableLink({ to, children, className = '', ...props }) {
  const navigate = useNavigate();
  const { ref, focused } = useFocusable({
    onEnterPress: () => navigate(to)
  });

  return (
    <Link
      to={to}
      ref={ref}
      className={`${className} ${focused ? 'focused-card' : ''}`}
      {...props}
    >
      {children}
    </Link>
  );
}

export function FocusableDiv({ children, onEnterPress, className = '', ...props }) {
  const { ref, focused } = useFocusable({
    onEnterPress
  });

  return (
    <div
      ref={ref}
      className={`${className} ${focused ? 'focused-card' : ''}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function FocusableButton({ children, onClick, className = '', ...props }) {
  const { ref, focused } = useFocusable({
    onEnterPress: () => { if (onClick) onClick(); }
  });

  return (
    <button
      ref={ref}
      onClick={onClick}
      className={`${className} ${focused ? 'focused-card' : ''}`}
      {...props}
    >
      {children}
    </button>
  );
}
