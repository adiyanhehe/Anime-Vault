import { Link } from 'react-router-dom';

function AnimeCard({ anime, isFavorite, onToggleFavorite, progress }) {
  return (
    <article className="anime-card">
      <Link to={`/anime/${anime.id}`} className="card-media">
        <img src={anime.coverImage?.large || anime.coverImage?.medium} alt={anime.title.romaji} />
      </Link>
      <div className="card-content">
        <h3>{anime.title.romaji}</h3>
        <p>Episodes: {anime.episodes || 'TBA'}</p>
        {progress ? <p className="progress">Progress: Ep {progress}</p> : null}
        <button onClick={() => onToggleFavorite(anime)} className="favorite-btn">
          {isFavorite ? '★ Favorited' : '☆ Favorite'}
        </button>
      </div>
    </article>
  );
}

export default AnimeCard;
