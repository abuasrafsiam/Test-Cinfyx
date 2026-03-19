const TMDB_API_KEY = "fc113ae7bdb111be9218caccbfb49bfe";
const TMDB_BASE = "https://api.themoviedb.org/3";

export interface TMDBTVShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  genre_ids: number[];
}

export interface TMDBSeason {
  id: number;
  season_number: number;
  name: string;
  overview: string;
  poster_path: string | null;
  air_date: string;
  episode_count: number;
}

export interface TMDBEpisode {
  id: number;
  episode_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date: string;
  runtime: number | null;
}

export async function searchTMDBShows(query: string): Promise<TMDBTVShow[]> {
  const res = await fetch(`${TMDB_BASE}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("Search failed");
  const data = await res.json();
  return (data.results || []).slice(0, 8);
}

export async function fetchTMDBShowById(tmdbId: number) {
  const res = await fetch(`${TMDB_BASE}/tv/${tmdbId}?api_key=${TMDB_API_KEY}`);
  if (!res.ok) throw new Error("Show not found");
  const data = await res.json();
  return {
    title: data.name,
    description: data.overview || "",
    poster_url: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : "",
    backdrop_url: data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : "",
    release_year: data.first_air_date ? data.first_air_date.split("-")[0] : "",
    genre: (data.genres || []).map((g: { name: string }) => g.name).slice(0, 3).join(", "),
    tmdb_id: tmdbId,
    seasons: (data.seasons || []) as TMDBSeason[],
  };
}

export async function fetchTMDBSeasonEpisodes(tmdbId: number, seasonNumber: number): Promise<TMDBEpisode[]> {
  const res = await fetch(`${TMDB_BASE}/tv/${tmdbId}/season/${seasonNumber}?api_key=${TMDB_API_KEY}`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.episodes || []).map((e: TMDBEpisode) => ({
    id: e.id,
    episode_number: e.episode_number,
    name: e.name,
    overview: e.overview,
    still_path: e.still_path,
    air_date: e.air_date,
    runtime: e.runtime,
  }));
}

export async function fetchTMDBShowTrailer(tmdbId: number): Promise<string | null> {
  const res = await fetch(`${TMDB_BASE}/tv/${tmdbId}/videos?api_key=${TMDB_API_KEY}`);
  if (!res.ok) return null;
  const data = await res.json();
  const videos = data.results || [];
  const trailer =
    videos.find((v: any) => v.site === "YouTube" && v.type === "Trailer" && v.official) ||
    videos.find((v: any) => v.site === "YouTube" && v.type === "Trailer") ||
    videos.find((v: any) => v.site === "YouTube" && v.type === "Teaser");
  return trailer ? trailer.key : null;
}
