import { Link } from 'react-router-dom';

function AnimeCard({ anime, isFavorite, onToggleFavorite, progress }) {
  return (
    <article className="anime-card glass-card">
      <div className="card-media">
        <Link to={`/anime/${anime.id}`}>
          <img src={anime.coverImage?.large || anime.coverImage?.medium} alt={anime.title.romaji} />
          <div className="card-badge">
            <span>HD</span>
            <span>{anime.genres?.includes('Dub') ? 'DUB' : 'SUB'}</span>
          </div>
        </Link>
      </div>
      <div className="card-content">
        <h3>{anime.title.romaji}</h3>
        <p>{anime.episodes ? `Episodes: ${anime.episodes}` : 'Episodes: TBA'}</p>
        {progress ? <p className="progress">Progress: Ep {progress}</p> : null}
        <button onClick={() => onToggleFavorite(anime)} className="favorite-btn">
          {isFavorite ? '★ Favorited' : '☆ Favorite'}
        </button>
      </div>
    </article>
  );
}

export default AnimeCard;
