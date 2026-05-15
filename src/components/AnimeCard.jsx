import { Link } from 'react-router-dom';

function AnimeCard({ anime, isFavorite, onToggleFavorite, progress }) {
  function handleFavoriteClick(event) {
    event.preventDefault();
    event.stopPropagation();
    onToggleFavorite(anime);
  }

  return (
    <Link to={`/anime/${anime.id}`} className="anime-card glass-card card-link-overlay" aria-label={`Open ${anime.title.romaji}`}>
      <div className="card-media">
        <img src={anime.coverImage?.large || anime.coverImage?.medium} alt={anime.title.romaji} />
        <div className="card-badge">
          <span>HD</span>
          <span>{anime.genres?.includes('Dub') ? 'DUB' : 'SUB'}</span>
        </div>
      </div>
      <div className="card-content">
        <h3>{anime.title.romaji}</h3>
        <p>{anime.episodes ? `Episodes: ${anime.episodes}` : 'Episodes: TBA'}</p>
        {progress ? <p className="progress">Progress: Ep {progress}</p> : null}
        <button onClick={handleFavoriteClick} className="favorite-btn" type="button">
          {isFavorite ? '★ Favorited' : '☆ Favorite'}
        </button>
      </div>
    </Link>
  );
}

export default AnimeCard;
