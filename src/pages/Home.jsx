import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AnimeCard from "../components/AnimeCard";
import { fetchTrendingMedia, fetchAnimeBySeason } from "../api/anilist";
import LatestSection from "../components/LatestSection";
import {
  Play,
  Calendar,
  Star,
  Info,
  ChevronRight,
  Sparkles,
  ShieldAlert,
  Hash,
  Filter,
  Zap,
} from "lucide-react";

const GENRES = [
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Fantasy",
  "Horror",
  "Mystery",
  "Psychological",
  "Romance",
  "Sci-Fi",
  "Slice of Life",
  "Sports",
  "Supernatural",
];

const SEASONS = ["WINTER", "SPRING", "SUMMER", "FALL"];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 7 }, (_, index) => CURRENT_YEAR - index);

function getCurrentAnimeSeason() {
  const month = new Date().getMonth() + 1;
  if (month <= 3) return "WINTER";
  if (month <= 6) return "SPRING";
  if (month <= 9) return "SUMMER";
  return "FALL";
}

function getTitle(anime) {
  return (
    anime?.title?.english ||
    anime?.title?.romaji ||
    anime?.title?.native ||
    "Unknown Title"
  );
}

function getImage(anime) {
  return (
    anime?.coverImage?.extraLarge ||
    anime?.coverImage?.large ||
    anime?.coverImage?.medium
  );
}

function getBanner(anime) {
  return anime?.bannerImage || getImage(anime);
}

function Home() {
  const [animeList, setAnimeList] = useState([]);
  const [seasonalList, setSeasonalList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seasonalLoading, setSeasonalLoading] = useState(false);
  const [error, setError] = useState("");

  const [selectedSeason, setSelectedSeason] = useState(getCurrentAnimeSeason);
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);

  const [favorites, setFavorites] = useState(() =>
    JSON.parse(localStorage.getItem("animevault_favorites") || "[]"),
  );
  const [activeSlide, setActiveSlide] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        let data = await fetchTrendingMedia("ANIME");

        const coteIndex = data.findIndex(
          (a) =>
            a.title?.english
              ?.toLowerCase()
              .includes("classroom of the elite") ||
            a.title?.romaji?.toLowerCase().includes("youkoso jitsuryoku"),
        );

        if (coteIndex > 0) {
          const cote = data.splice(coteIndex, 1)[0];
          data.unshift(cote);
        }

        setAnimeList(data);
      } catch (err) {
        setError(err.message || "Failed to load trending anime");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    async function loadSeasonal() {
      try {
        setSeasonalLoading(true);
        const data = await fetchAnimeBySeason(selectedSeason, selectedYear);
        setSeasonalList(data);
      } catch (err) {
        console.error("Failed to load seasonal", err);
      } finally {
        setSeasonalLoading(false);
      }
    }
    loadSeasonal();
  }, [selectedSeason, selectedYear]);

  // Slideshow interval timer
  useEffect(() => {
    if (animeList.length === 0) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % Math.min(5, animeList.length));
    }, 6000);
    return () => clearInterval(interval);
  }, [animeList]);

  const trending = animeList.slice(0, 12);

  function toggleFavorite(anime) {
    setFavorites((current) => {
      const next = current.some((item) => item.id === anime.id)
        ? current.filter((item) => item.id !== anime.id)
        : [...current, { id: anime.id, title: getTitle(anime) }];
      localStorage.setItem("animevault_favorites", JSON.stringify(next));
      return next;
    });
  }

  if (loading)
    return (
      <div className="status-container">
        <div className="spinner" />
        <p>Loading the vault...</p>
      </div>
    );

  return (
    <section className="home-v2">
      {/* Immersive Hero Slideshow Carousel (Flashcards) */}
      {animeList.length > 0 && (
        <div
          className="hero-v2 hero-carousel-v2"
          style={{ position: "relative", overflow: "hidden", height: "520px" }}
        >
          {animeList.slice(0, 5).map((anime, index) => {
            const isActive = index === activeSlide;
            return (
              <div
                key={anime.id}
                className={`carousel-slide ${isActive ? "active" : ""}`}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  opacity: isActive ? 1 : 0,
                  visibility: isActive ? "visible" : "hidden",
                  transition:
                    "opacity 0.8s ease-in-out, visibility 0.8s ease-in-out",
                  zIndex: isActive ? 2 : 1,
                }}
              >
                <div
                  className="hero-img-wrapper"
                  style={{ width: "100%", height: "100%" }}
                >
                  <img
                    src={getBanner(anime)}
                    alt={getTitle(anime)}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  <div className="hero-overlay-v2" />
                </div>
                <div className="hero-content-v2" style={{ zIndex: 5 }}>
                  <div
                    className="hero-info-v2"
                    style={{
                      transform: isActive
                        ? "translateY(0)"
                        : "translateY(20px)",
                      opacity: isActive ? 1 : 0,
                      transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s",
                    }}
                  >
                    <span
                      className="hero-rank"
                      style={{
                        color: "var(--brand-color)",
                        background: "rgba(0,0,0,0.6)",
                        border: "1px solid var(--brand-color)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        width: "fit-content",
                        padding: "4px 12px",
                        borderRadius: "20px",
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      <Sparkles size={14} /> #{index + 1} Trending
                    </span>
                    <h1 className="hero-title-v2">{getTitle(anime)}</h1>
                    <div className="hero-meta-v2">
                      <span>
                        <Calendar size={16} /> {anime?.seasonYear}
                      </span>
                      <span>
                        <Star size={16} /> {anime?.averageScore}%
                      </span>
                      <span>{anime?.format}</span>
                    </div>
                    <p className="hero-desc-v2">
                      {anime?.description
                        ?.replace(/<[^>]+>/g, "")
                        .slice(0, 220)}
                      ...
                    </p>
                    <div className="hero-btns-v2">
                      <button
                        className="btn-play-v2"
                        onClick={() => navigate(`/anime/${anime.id}`)}
                      >
                        <Play size={20} fill="black" /> Watch Now
                      </button>
                      <button
                        className="btn-info-v2"
                        onClick={() => navigate(`/anime/${anime.id}`)}
                      >
                        <Info size={20} /> Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Carousel Slide Indicators / Dots */}
          <div
            className="carousel-dots"
            style={{
              position: "absolute",
              bottom: "25px",
              right: "40px",
              zIndex: 10,
              display: "flex",
              gap: "8px",
            }}
          >
            {animeList.slice(0, 5).map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveSlide(index)}
                style={{
                  width: index === activeSlide ? "30px" : "10px",
                  height: "10px",
                  borderRadius: "5px",
                  border: "none",
                  background:
                    index === activeSlide
                      ? "var(--brand-color)"
                      : "rgba(255, 255, 255, 0.3)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow:
                    index === activeSlide
                      ? "0 0 10px var(--brand-color)"
                      : "none",
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="home-main-v2">
        {/* Security & Updates */}
        <div
          className="security-notice-v2"
          style={{ marginTop: "-4.5rem", zIndex: 10, position: "relative" }}
        >
          <ShieldAlert size={28} color="#ffa500" />
          <div>
            <p>
              <strong>Security & Stability Update</strong>
              Stable Zen Mode added. Removed restrictive attributes for 100%
              server compatibility. AniWave stable mirrors integrated.
            </p>
          </div>
        </div>

        {/* Latest from External Servers */}
        <LatestSection />

        {/* Seasonal Browser */}
        <section className="home-section-v2">
          <div className="section-header-v2">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                flexWrap: "wrap",
              }}
            >
              <h2>Seasonal Browser</h2>
              <div
                className="seasonal-controls-v2"
                style={{ display: "flex", gap: "0.5rem" }}
              >
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(e.target.value)}
                  className="server-dropdown-v2"
                  style={{
                    minWidth: "120px",
                    padding: "0.4rem 2rem 0.4rem 0.8rem",
                  }}
                >
                  {SEASONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="server-dropdown-v2"
                  style={{
                    minWidth: "100px",
                    padding: "0.4rem 2rem 0.4rem 0.8rem",
                  }}
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div
            className="trending-grid-v2"
            style={{
              opacity: seasonalLoading ? 0.5 : 1,
              transition: "opacity 0.2s",
              marginTop: "1.5rem",
            }}
          >
            {seasonalList.length > 0 ? (
              seasonalList
                .slice(0, 12)
                .map((anime) => (
                  <AnimeCard
                    key={anime.id}
                    anime={anime}
                    isFavorite={favorites.some((f) => f.id === anime.id)}
                    onToggleFavorite={toggleFavorite}
                  />
                ))
            ) : (
              <p>No seasonal data found for this period.</p>
            )}
          </div>
        </section>

        {/* Popular Genres */}
        <section className="home-section-v2">
          <div className="section-header-v2" style={{ marginBottom: "1rem" }}>
            <h2>Popular Genres</h2>
          </div>
          <div
            className="genres-container-v2"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem",
              marginBottom: "2rem",
            }}
          >
            {GENRES.map((genre) => (
              <Link
                key={genre}
                to={`/search?genre=${genre}`}
                className="genre-tag-v2"
              >
                <Hash size={14} opacity={0.6} />
                {genre}
              </Link>
            ))}
          </div>
        </section>

        {/* Global Trending */}
        <section className="home-section-v2">
          <div className="section-header-v2">
            <h2>Global Trending</h2>
            <Link to="/search?trending=true" className="view-all">
              View All <ChevronRight size={18} />
            </Link>
          </div>
          <div className="trending-grid-v2" style={{ marginTop: "1.5rem" }}>
            {trending.map((anime) => (
              <AnimeCard
                key={anime.id}
                anime={anime}
                isFavorite={favorites.some((f) => f.id === anime.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

export default Home;
