import { Link } from 'react-router-dom';

function AnimeCard({ anime, isFavorite, onToggleFavorite, progress }) {
  function handleFavoriteClick(e) {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite(anime);
  }

  const title = anime.title?.romaji || 'Unknown Title';
  const imgSrc = anime.coverImage?.large || anime.coverImage?.medium;

  return (
    <Link to={`/anime/${anime.id}`} className="anime-card glass-card" aria-label={`View ${title} details`}>
      <div className="card-media">
        <img src={imgSrc} alt={title} />
        <div className="card-badge">
          <span>HD</span>
          <span>{anime.genres?.includes('Dub') ? 'DUB' : 'SUB'}</span>
        </div>
      </div>
      <div className="card-content">
        <h3>{title}</h3>
        <p>{anime.episodes ? `Episodes: ${anime.episodes}` : 'Episodes: TBA'}</p>
        {progress ? <p className="progress">Progress: Ep {progress}</p> : null}
        <button
          type="button"
          onClick={handleFavoriteClick}
          className="favorite-btn"
          aria-label={isFavorite ? `Remove ${title} from favorites` : `Add ${title} to favorites`}
        >
          {isFavorite ? 'Favorited' : 'Favorite'}
        </button>
      </div>
    </Link>
  );
}

export default AnimeCard;
