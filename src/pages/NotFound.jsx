import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>404 - Page Not Found</h1>
      <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
        Oops! The page you are looking for does not exist.
      </p>
      <Link to="/" style={{
        padding: '0.75rem 1.5rem',
        background: 'linear-gradient(90deg, #8a2be2, #00d2ff)',
        color: '#fff',
        borderRadius: '0.5rem',
        textDecoration: 'none',
        fontWeight: '600'
      }}>
        Return Home
      </Link>
    </div>
  );
};

export default NotFound;
