/* src/pages/MangaInfo.jsx */
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchManga } from '../api/nexus';
import { Sparkles } from 'lucide-react';

export default function MangaInfo() {
  const { id } = useParams();
  const [manga, setManga] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchManga(id);
        setManga(data);
      } catch (e) {
        console.error('Failed to load manga:', e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  if (loading) return <div style={{ textAlign: 'center', padding: '60px' }}>Loading manga details…</div>;
  if (error) return <div style={{ color: '#ff4444', padding: '20px' }}>Error: {error}</div>;
  if (!manga) return null;

  const { name, description, cover } = manga;

  return (
    <div className="manga-info-container" style={{ maxWidth: '1200px', margin: '40px auto', color: '#fff' }}>
      <div style={{ display: 'flex', gap: '24px', marginBottom: '40px' }}>
        <img src={cover?.poster || cover?.banner || ''} alt={name} style={{ width: '260px', height: '390px', objectFit: 'cover', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.6)' }} />
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '12px' }}>{name}</h1>
          <p style={{ lineHeight: '1.6', color: 'var(--text-secondary)' }}>{description?.replace(/<[^>]+>/g, '')}</p>
        </div>
      </div>
    </div>
  );
}
