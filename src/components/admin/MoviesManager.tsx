import { useState, useEffect } from "react";
import { useMovies, type Movie } from "@/hooks/useMovies";
import { useHeroItems } from "@/hooks/useHeroItems";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2, X, Search, Loader2, Film, Eye, Monitor } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchTMDBById, searchTMDB, type TMDBMovie } from "@/hooks/useTMDB";

const emptyMovie = {
  title: "", description: "", poster_url: "", backdrop_url: "",
  video_url: "", category: "Trending", year: "", genre: "", featured: false,
};

const MoviesManager = () => {
  const { data: movies = [], isLoading } = useMovies();
  const { data: heroItems = [] } = useHeroItems();
  const [editing, setEditing] = useState<Partial<Movie> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [showOnHero, setShowOnHero] = useState(false);
  const [preview, setPreview] = useState(false);
  const queryClient = useQueryClient();
  const [searchFilter, setSearchFilter] = useState("");

  // TMDB
  const [tmdbId, setTmdbId] = useState("");
  const [tmdbSearch, setTmdbSearch] = useState("");
  const [tmdbResults, setTmdbResults] = useState<(TMDBMovie & { genre_text?: string })[]>([]);
  const [tmdbLoading, setTmdbLoading] = useState(false);

  const openNew = () => { setEditing({ ...emptyMovie }); setIsNew(true); setTmdbResults([]); };
  const openEdit = (m: Movie) => { setEditing({ ...m }); setIsNew(false); setTmdbResults([]); };
  const close = () => { setEditing(null); setIsNew(false); setTmdbResults([]); setPreview(false); };

  const fetchById = async () => {
    const id = parseInt(tmdbId);
    if (!id) { toast.error("Enter a valid TMDB ID"); return; }
    setTmdbLoading(true);
    try {
      const data = await fetchTMDBById(id);
      setEditing((p) => p ? { ...p, ...data } : p);
      toast.success("Fetched from TMDB");
    } catch { toast.error("Not found on TMDB"); }
    finally { setTmdbLoading(false); }
  };

  const searchMovies = async () => {
    if (!tmdbSearch.trim()) return;
    setTmdbLoading(true);
    try {
      const results = await searchTMDB(tmdbSearch);
      setTmdbResults(results);
      if (results.length === 0) toast("No results found");
    } catch { toast.error("Search failed"); }
    finally { setTmdbLoading(false); }
  };

  const selectResult = async (m: TMDBMovie) => {
    setTmdbLoading(true);
    try {
      const data = await fetchTMDBById(m.id);
      setEditing((p) => p ? { ...p, ...data } : p);
      setTmdbResults([]);
      toast.success(`Selected: ${m.title}`);
    } catch { toast.error("Failed to fetch"); }
    finally { setTmdbLoading(false); }
  };

  const save = async () => {
    if (!editing?.title) { toast.error("Title required"); return; }
    const payload = {
      title: editing.title, description: editing.description || "",
      poster_url: editing.poster_url || "", backdrop_url: editing.backdrop_url || "",
      video_url: editing.video_url || "", category: editing.category || "Trending",
      year: editing.year || "", genre: editing.genre || "", featured: editing.featured || false,
    };
    if (isNew) {
      const { error } = await supabase.from("movies").insert([payload]);
      if (error) { toast.error("Failed to add"); return; }
      toast.success("Movie added");
    } else {
      const { error } = await supabase.from("movies").update(payload).eq("id", editing.id!);
      if (error) { toast.error("Failed to update"); return; }
      toast.success("Movie updated");
    }
    queryClient.invalidateQueries({ queryKey: ["movies"] });
    close();
  };

  const deleteMovie = async (id: string) => {
    const { error } = await supabase.from("movies").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Deleted");
    queryClient.invalidateQueries({ queryKey: ["movies"] });
  };

  const update = (field: string, value: string | boolean) =>
    setEditing((p) => p ? { ...p, [field]: value } : p);

  const filtered = movies.filter((m) =>
    m.title.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Movies</h2>
          <p className="text-sm text-muted-foreground mt-1">{movies.length} movies total</p>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> Add Movie</Button>
      </div>

      {/* Search filter */}
      <Input
        placeholder="Filter movies..."
        value={searchFilter}
        onChange={(e) => setSearchFilter(e.target.value)}
        className="max-w-sm bg-secondary border-0"
      />

      {/* Movie list */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {isLoading && <p className="p-4 text-sm text-muted-foreground">Loading...</p>}
            {filtered.map((m) => (
              <div key={m.id} className="flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors">
                <div className="w-12 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
                  {m.poster_url && <img src={m.poster_url} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{m.title}</p>
                  <p className="text-xs text-muted-foreground">{m.category} • {m.year} {m.featured && "• ⭐ Featured"}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => openEdit(m)}><Pencil className="w-4 h-4" /></Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteMovie(m.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit/Add Dialog */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto p-6 border border-border shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-foreground">{isNew ? "Add Movie" : "Edit Movie"}</h2>
              <button onClick={close} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>

            {/* TMDB Fetch */}
            {isNew && (
              <div className="mb-5 space-y-3 p-4 bg-secondary/50 rounded-xl border border-border/50">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Auto-fetch from TMDB</p>
                <div className="flex gap-2">
                  <Input type="number" placeholder="TMDB ID" value={tmdbId} onChange={(e) => setTmdbId(e.target.value)} className="bg-background border-0 flex-1" />
                  <Button onClick={fetchById} size="sm" variant="secondary" disabled={tmdbLoading}>
                    {tmdbLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Film className="w-4 h-4" />}
                    <span className="ml-1">Fetch</span>
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Or search by name..." value={tmdbSearch} onChange={(e) => setTmdbSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && searchMovies()} className="bg-background border-0 flex-1" />
                  <Button onClick={searchMovies} size="sm" variant="secondary" disabled={tmdbLoading}>
                    {tmdbLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </Button>
                </div>
                {tmdbResults.length > 0 && (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {tmdbResults.map((r) => (
                      <button key={r.id} onClick={() => selectResult(r)} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-background/80 text-left">
                        <div className="w-8 h-12 rounded bg-muted shrink-0 overflow-hidden">
                          {r.poster_path && <img src={`https://image.tmdb.org/t/p/w92${r.poster_path}`} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground truncate">{r.title}</p>
                          <p className="text-xs text-muted-foreground">{r.release_date?.split("-")[0]} • {(r as any).genre_text}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Preview */}
            {preview && editing.poster_url && (
              <div className="mb-4 flex gap-4 p-3 bg-secondary/30 rounded-xl">
                <div className="w-24 h-36 rounded-lg overflow-hidden bg-muted shrink-0">
                  <img src={editing.poster_url} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">{editing.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{editing.year} • {editing.genre}</p>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{editing.description}</p>
                </div>
              </div>
            )}

            <div className="flex gap-2 mb-4">
              <Button size="sm" variant="outline" onClick={() => setPreview(!preview)} className="gap-1">
                <Eye className="w-3.5 h-3.5" /> {preview ? "Hide" : "Preview"}
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Title *</Label>
                <Input value={editing.title || ""} onChange={(e) => update("title", e.target.value)} className="bg-secondary border-0 mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Description</Label>
                <Textarea value={editing.description || ""} onChange={(e) => update("description", e.target.value)} className="bg-secondary border-0 mt-1 min-h-[80px]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Year</Label>
                  <Input value={editing.year || ""} onChange={(e) => update("year", e.target.value)} className="bg-secondary border-0 mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Genre</Label>
                  <Input value={editing.genre || ""} onChange={(e) => update("genre", e.target.value)} className="bg-secondary border-0 mt-1" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Category</Label>
                <Select value={editing.category || "Trending"} onValueChange={(v) => update("category", v)}>
                  <SelectTrigger className="bg-secondary border-0 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Trending">Trending</SelectItem>
                    <SelectItem value="Latest">Latest</SelectItem>
                    <SelectItem value="Action">Action</SelectItem>
                    <SelectItem value="Anime">Anime</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Poster URL</Label>
                <Input value={editing.poster_url || ""} onChange={(e) => update("poster_url", e.target.value)} className="bg-secondary border-0 mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Backdrop URL</Label>
                <Input value={editing.backdrop_url || ""} onChange={(e) => update("backdrop_url", e.target.value)} className="bg-secondary border-0 mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Video URL</Label>
                <Input value={editing.video_url || ""} onChange={(e) => update("video_url", e.target.value)} className="bg-secondary border-0 mt-1" />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={editing.featured || false} onCheckedChange={(v) => update("featured", v)} />
                <Label className="text-sm text-foreground">Featured on Home</Label>
              </div>
              <Button onClick={save} className="w-full h-11">{isNew ? "Add Movie" : "Save Changes"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoviesManager;
