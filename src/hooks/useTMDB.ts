const TMDB_API_KEY = "fc113ae7bdb111be9218caccbfb49bfe";
const TMDB_BASE = "https://api.themoviedb.org/3";

export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  genre_ids: number[];
}

interface TMDBGenre {
  id: number;
  name: string;
}

const GENRE_MAP: Record<number, string> = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy",
  80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family",
  14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music",
  9648: "Mystery", 10749: "Romance", 878: "Sci-Fi", 10770: "TV Movie",
  53: "Thriller", 10752: "War", 37: "Western",
};

function mapGenres(ids: number[]): string {
  return ids.map((id) => GENRE_MAP[id] || "Unknown").slice(0, 3).join(", ");
}

export async function fetchTMDBById(tmdbId: number) {
  const res = await fetch(`${TMDB_BASE}/movie/${tmdbId}?api_key=${TMDB_API_KEY}`);
  if (!res.ok) throw new Error("Movie not found");
  const data = await res.json();
  return {
    title: data.title,
    description: data.overview || "",
    poster_url: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : "",
    backdrop_url: data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : "",
    year: data.release_date ? data.release_date.split("-")[0] : "",
    genre: (data.genres as TMDBGenre[])?.map((g) => g.name).slice(0, 3).join(", ") || "",
  };
}

export async function searchTMDB(query: string): Promise<TMDBMovie[]> {
  const res = await fetch(`${TMDB_BASE}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("Search failed");
  const data = await res.json();
  return (data.results || []).slice(0, 8).map((m: TMDBMovie) => ({
    ...m,
    genre_text: mapGenres(m.genre_ids),
  }));
}

export interface TMDBVideo {
  key: string;
  site: string;
  type: string;
  official: boolean;
}

export interface TMDBCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export async function fetchTMDBTrailer(tmdbId: number): Promise<string | null> {
  const res = await fetch(`${TMDB_BASE}/movie/${tmdbId}/videos?api_key=${TMDB_API_KEY}`);
  if (!res.ok) return null;
  const data = await res.json();
  const videos: TMDBVideo[] = data.results || [];
  // Prefer official YouTube trailers
  const trailer =
    videos.find((v) => v.site === "YouTube" && v.type === "Trailer" && v.official) ||
    videos.find((v) => v.site === "YouTube" && v.type === "Trailer") ||
    videos.find((v) => v.site === "YouTube" && v.type === "Teaser");
  return trailer ? trailer.key : null;
}

export async function fetchTMDBCast(tmdbId: number): Promise<TMDBCastMember[]> {
  const res = await fetch(`${TMDB_BASE}/movie/${tmdbId}/credits?api_key=${TMDB_API_KEY}`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.cast || []).slice(0, 10).map((c: TMDBCastMember) => ({
    id: c.id,
    name: c.name,
    character: c.character,
    profile_path: c.profile_path,
  }));
}

export async function searchTMDBByTitle(title: string): Promise<number | null> {
  const res = await fetch(`${TMDB_BASE}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`);
  if (!res.ok) return null;
  const data = await res.json();
  if (data.results && data.results.length > 0) {
    return data.results[0].id;
  }
  return null;
}
