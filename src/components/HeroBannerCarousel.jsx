import React, { useEffect, useState } from 'react';
import '../styles/designTokens.css';
import './HeroBannerCarousel.css';

export default function HeroBannerCarousel({ items }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!items || items.length === 0) return;
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % items.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [items]);

  if (!items || items.length === 0) return null;
  const activeItem = items[activeIndex];

  return (
    <div className="hero-carousel glass">
      <img
        src={activeItem.images?.jpg?.large_image_url || activeItem.coverImage?.extraLarge || activeItem.image}
        alt={activeItem.title?.english || activeItem.title?.romaji || activeItem.title}
        className="hero-image"
        style={{ width: '100%', height: '300px', objectFit: 'cover' }}
      />
      <div className="hero-overlay">
        <h2 className="hero-title">{activeItem.title?.english || activeItem.title?.romaji || activeItem.title}</h2>
        <p className="hero-episode">Episode {activeItem.episode || '?'}</p>
        {activeItem.broadcast?.day && activeItem.broadcast?.time && (
          <p className="hero-countdown">{activeItem.broadcast.day} {activeItem.broadcast.time}</p>
        )}
        <p className="hero-genres">{activeItem.genres?.join(', ')}</p>
        <p className="hero-score">Score: {activeItem.score || 'N/A'}</p>
      </div>
    </div>
  );
}
