/* src/pages/AnimeInfo.jsx */
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchAnime } from '../api/nexus';
import { Calendar, Film, Sparkles, ExternalLink } from 'lucide-react';

export default function AnimeInfo() {
  const { id } = useParams(); // anime ID from route
  const [anime, setAnime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchAnime(id);
        setAnime(data);
      } catch (e) {
        console.error('Failed to load anime:', e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  if (loading) return <div style={{ textAlign: 'center', padding: '60px' }}>Loading anime details…</div>;
  if (error) return <div style={{ color: '#ff4444', padding: '20px' }}>Error: {error}</div>;
  if (!anime) return null;

  const { name, description, cover, episodes = [], characters = [] } = anime;

  return (
    <div className="anime-info-container" style={{ maxWidth: '1200px', margin: '40px auto', color: '#fff' }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: '24px', marginBottom: '40px' }}>
        <img src={cover?.poster || cover?.banner || ''} alt={name} style={{ width: '260px', height: '390px', objectFit: 'cover', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.6)' }} />
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '12px' }}>{name}</h1>
          <p style={{ lineHeight: '1.6', color: 'var(--text-secondary)' }}>{description?.replace(/<[^>]+>/g, '')}</p>
        </div>
      </div>

      {/* Episodes */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Episodes</h2>
        {episodes.length === 0 ? (
          <p>No episode data available.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
            {episodes.map((ep, idx) => (
              <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '8px' }}>
                <div style={{ fontWeight: '800', color: '#ff1a75' }}>Ep {ep.episode || idx + 1}</div>
                <div style={{ fontSize: '0.85rem', marginTop: '4px', color: 'var(--text-tertiary)' }}>{ep.title || 'Untitled'}</div>
                <div style={{ fontSize: '0.75rem', marginTop: '2px', color: 'var(--text-secondary)' }}>{ep.air_date || ''}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Characters */}
      <section>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Characters</h2>
        {characters.length === 0 ? (
          <p>No character data available.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
            {characters.map((char, idx) => (
              <div key={idx} style={{ textAlign: 'center' }}>
                <img src={char.image || 'https://placehold.co/140x200?text=No+Image'} alt={char.name} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }} />
                <div style={{ marginTop: '8px', fontWeight: '600', color: '#fff' }}>{char.name}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
