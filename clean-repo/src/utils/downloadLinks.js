export function buildDownloadSearchQuery({
  title,
  type,
  season,
  episode,
  year,
}) {
  const parts = [title];

  if (type === "anime") {
    if (episode) parts.push(`episode ${episode}`);
    parts.push("anime");
  } else if (type === "series" || type === "tv") {
    if (season && episode) {
      parts.push(
        `S${String(season).padStart(2, "0")}E${String(episode).padStart(2, "0")}`,
      );
    }
    parts.push("series");
  } else {
    if (year) parts.push(year);
    parts.push("movie");
  }

  parts.push("1080p");
  return parts.filter(Boolean).join(" ");
}

export function buildDlhubSearchUrl({ title, type, season, episode, year }) {
  const query = buildDownloadSearchQuery({
    title,
    type,
    season,
    episode,
    year,
  });
  const params = new URLSearchParams({
    q: query,
    search: query,
    category:
      type === "anime" ? "anime" : type === "movie" ? "movies" : "series",
  });

  return `https://dlhub.cc/?${params.toString()}`;
}
