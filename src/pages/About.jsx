import React from 'react';
import { Shield, Zap, Globe, Heart, Info, Code } from 'lucide-react';

export default function About() {
  return (
    <div className="status-container" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'left', padding: '4rem 2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Info size={40} color="var(--brand-color)" />
        <h1 style={{ fontSize: '2.5rem', margin: 0 }}>About AnimeVault</h1>
      </div>

      <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: '1.8', marginBottom: '3rem' }}>
        Welcome to <strong>AnimeVault</strong>, the ultimate high-performance streaming hub designed for enthusiasts who demand speed, stability, and a premium viewing experience. Built by <span>Adiyan</span> with a focus on "Instant-Load" architecture, advanced manga libraries, resilient failover systems, and a fully featured, ad-neutral **Hollywood, TV Show & K-Drama Streaming Hub**!
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        <div style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', padding: '1.5rem', borderRadius: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <Zap size={24} color="#ffd700" />
            <h3 style={{ margin: 0 }}>Instant discovery</h3>
          </div>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>
            Leveraging AniList's GraphQL API for blazing-fast metadata retrieval. No more waiting for slow scrapers just to browse.
          </p>
        </div>

        <div style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', padding: '1.5rem', borderRadius: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <Shield size={24} color="#00ff88" />
            <h3 style={{ margin: 0 }}>Anti-Fragile Streaming</h3>
          </div>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>
            Our multi-mirror failover system probes public mirrors in real-time, automatically skipping dead endpoints to ensure you never hit a 404.
          </p>
        </div>

        <div style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', padding: '1.5rem', borderRadius: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <Globe size={24} color="#00d1ff" />
            <h3 style={{ margin: 0 }}>Global Ecosystem</h3>
          </div>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>
            Integrated with 13+ high-stability streaming providers including VidLink, Vidsrc, and Stremio Cinemeta catalogs for anime, manga, Hollywood movies, and TV shows.
          </p>
        </div>

        <div style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', padding: '1.5rem', borderRadius: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <Code size={24} color="var(--brand-color)" />
            <h3 style={{ margin: 0 }}>Open & Secure</h3>
          </div>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>
            Engineered with modern React standards, featuring a sanitized secure environment and optimized background enrichment.
          </p>
        </div>
      </div>

      <div style={{ marginTop: '4rem', textAlign: 'center', opacity: 0.6 }}>
        <p>Made with <Heart size={16} fill="var(--brand-color)" color="var(--brand-color)" /> by Adiyan</p>
      </div>
    </div>
  );
}
