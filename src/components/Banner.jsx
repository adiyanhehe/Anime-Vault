import React, { useEffect, useState } from 'react';
import '../styles/designTokens.css';

/**
 * Simple image carousel that auto‑rotates every 5 seconds.
 * Expects an array of image URLs via the `images` prop.
 */
export default function Banner({ images }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!images || images.length === 0) return undefined;
    const interval = setInterval(() => {
      setCurrent(prev => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [images]);

  if (!images || images.length === 0) return null;

  return (
    <div className="banner-container" style={{
      position: 'relative',
      overflow: 'hidden',
      borderRadius: '12px',
      marginBottom: '2rem',
      boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
      background: 'rgba(255,255,255,0.05)'
    }}>
      <img
        src={images[current]}
        alt={`Banner ${current + 1}`}
        style={{
          width: '100%',
          height: '200px',
          objectFit: 'cover',
          transition: 'opacity 0.6s ease-in-out',
          opacity: 1,
        }}
      />
      {/* Dots indicator */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '8px'
      }}>
        {images.map((_, idx) => (
          <span
            key={idx}
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: idx === current ? 'var(--brand-color)' : 'rgba(255,255,255,0.5)',
              cursor: 'pointer'
            }}
            onClick={() => setCurrent(idx)}
          />
        ))}
      </div>
    </div>
  );
}
