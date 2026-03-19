import { useState } from "react";
import { useShows, useSeasons, useEpisodes, type Show, type Season, type Episode } from "@/hooks/useShows";
import { useHeroItems } from "@/hooks/useHeroItems";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil, Trash2, X, Search, Loader2, ChevronRight, ArrowLeft, Monitor, Film, Download } from "lucide-react";
import { toast } from "sonner";
import { searchTMDBShows, fetchTMDBShowById, fetchTMDBSeasonEpisodes, fetchTMDBShowTrailer, type TMDBTVShow, type TMDBSeason } from "@/hooks/useTMDBShows";

type View = "shows" | "seasons" | "episodes";

const ShowsManager = () => {
  const { data: shows = [], isLoading } = useShows();
  const { data: heroItems = [] } = useHeroItems();
  const queryClient = useQueryClient();

  const [view, setView] = useState<View>("shows");
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);

  // Show form
  const [editingShow, setEditingShow] = useState<Partial<Show> | null>(null);
  const [isNewShow, setIsNewShow] = useState(false);
  const [showOnHero, setShowOnHero] = useState(false);

  // Season form
  const [editingSeason, setEditingSeason] = useState<Partial<Season> | null>(null);
  const [isNewSeason, setIsNewSeason] = useState(false);

  // Episode form
  const [editingEpisode, setEditingEpisode] = useState<Partial<Episode> | null>(null);
  const [isNewEpisode, setIsNewEpisode] = useState(false);

  // TMDB
  const [tmdbSearch, setTmdbSearch] = useState("");
  const [tmdbIdInput, setTmdbIdInput] = useState("");
  const [tmdbResults, setTmdbResults] = useState<TMDBTVShow[]>([]);
  const [tmdbLoading, setTmdbLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");

  const { data: seasons = [] } = useSeasons(selectedShow?.id || "");
  const { data: episodes = [] } = useEpisodes(selectedSeason?.id || "");

  // TMDB search by name
  const doTmdbSearch = async () => {
    if (!tmdbSearch.trim()) return;
    setTmdbLoading(true);
    try {
      const results = await searchTMDBShows(tmdbSearch);
      setTmdbResults(results);
      if (results.length === 0) toast("No results found");
    } catch { toast.error("Search failed"); }
    finally { setTmdbLoading(false); }
  };

  // TMDB fetch by ID
  const fetchByTmdbId = async () => {
    const id = parseInt(tmdbIdInput);
    if (!id) { toast.error("Enter a valid TMDB ID"); return; }
    setTmdbLoading(true);
    try {
      const data = await fetchTMDBShowById(id);
      setEditingShow((p) => p ? { ...p, ...data } : p);
      toast.success(`Fetched: ${data.title}`);
    } catch { toast.error("Not found on TMDB"); }
    finally { setTmdbLoading(false); }
  };

  const selectTmdbShow = async (show: TMDBTVShow) => {
    setTmdbLoading(true);
    try {
      const data = await fetchTMDBShowById(show.id);
      setEditingShow((p) => p ? { ...p, ...data } : p);
      setTmdbResults([]);
      toast.success(`Selected: ${show.name}`);
    } catch { toast.error("Failed to fetch"); }
    finally { setTmdbLoading(false); }
  };

  // Auto-import seasons + episodes from TMDB
  const importFromTMDB = async (showId: string, tmdbId: number) => {
    setTmdbLoading(true);
    try {
      const showData = await fetchTMDBShowById(tmdbId);
      const tmdbSeasons = showData.seasons.filter((s: TMDBSeason) => s.season_number > 0);

      let totalEps = 0;
      for (const ts of tmdbSeasons) {
        // Check if season already exists
        const existingSeason = seasons.find((s) => s.season_number === ts.season_number);
        let seasonId: string;

        if (existingSeason) {
          seasonId = existingSeason.id;
        } else {
          const { data: seasonRow, error: sErr } = await supabase.from("seasons").insert([{
            show_id: showId,
            season_number: ts.season_number,
            title: ts.name || `Season ${ts.season_number}`,
            poster_url: ts.poster_path ? `https://image.tmdb.org/t/p/w500${ts.poster_path}` : "",
            release_year: ts.air_date ? ts.air_date.split("-")[0] : "",
          }]).select().single();
          if (sErr || !seasonRow) continue;
          seasonId = seasonRow.id;
        }

        const tmdbEps = await fetchTMDBSeasonEpisodes(tmdbId, ts.season_number);
        if (tmdbEps.length > 0) {
          const epPayloads = tmdbEps.map((e) => ({
            season_id: seasonId,
            episode_number: e.episode_number,
            title: e.name || `Episode ${e.episode_number}`,
            description: e.overview || "",
            thumbnail_url: e.still_path ? `https://image.tmdb.org/t/p/w500${e.still_path}` : "",
            duration: e.runtime ? `${e.runtime}m` : "",
            video_url: "",
          }));
          await supabase.from("episodes").insert(epPayloads);
          totalEps += tmdbEps.length;
        }
      }
      queryClient.invalidateQueries({ queryKey: ["seasons"] });
      queryClient.invalidateQueries({ queryKey: ["episodes"] });
      toast.success(`Imported ${tmdbSeasons.length} seasons, ${totalEps} episodes from TMDB`);
    } catch { toast.error("Import failed"); }
    finally { setTmdbLoading(false); }
  };

  // SHOW CRUD
  const saveShow = async () => {
    if (!editingShow?.title) { toast.error("Title required"); return; }
    const payload = {
      title: editingShow.title,
      description: editingShow.description || "",
      poster_url: editingShow.poster_url || "",
      backdrop_url: editingShow.backdrop_url || "",
      release_year: editingShow.release_year || "",
      genre: editingShow.genre || "",
      tmdb_id: editingShow.tmdb_id || null,
      featured: editingShow.featured || false,
    };

    let savedId = editingShow.id;

    if (isNewShow) {
      const { data, error } = await supabase.from("shows").insert([payload]).select().single();
      if (error) { toast.error("Failed to add"); return; }
      savedId = data.id;
      toast.success("Show added");

      // Auto-import from TMDB if tmdb_id is set
      if (payload.tmdb_id && savedId) {
        await importFromTMDB(savedId, payload.tmdb_id);
      }
    } else {
      const { error } = await supabase.from("shows").update(payload).eq("id", editingShow.id!);
      if (error) { toast.error("Failed to update"); return; }
      toast.success("Show updated");
    }

    // Hero sync
    const existingHero = heroItems.find((h) => h.title === editingShow.title);
    if (showOnHero && !existingHero) {
      let heroVideoUrl = "";
      if (editingShow.tmdb_id) {
        try {
          const key = await fetchTMDBShowTrailer(editingShow.tmdb_id);
          if (key) heroVideoUrl = `https://www.youtube.com/watch?v=${key}`;
        } catch {}
      }
      await supabase.from("hero_items").insert([{
        title: editingShow.title,
        description: editingShow.description || "",
        backdrop_url: editingShow.backdrop_url || "",
        video_url: heroVideoUrl,
        priority: heroItems.length,
        active: true,
      }]);
    } else if (!showOnHero && existingHero) {
      await supabase.from("hero_items").delete().eq("id", existingHero.id);
    }

    queryClient.invalidateQueries({ queryKey: ["shows"] });
    queryClient.invalidateQueries({ queryKey: ["hero_items"] });
    setEditingShow(null);
    setIsNewShow(false);
    setShowOnHero(false);
    setTmdbResults([]);
  };

  const deleteShow = async (id: string) => {
    await supabase.from("shows").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["shows"] });
    toast.success("Show deleted");
  };

  // SEASON CRUD
  const saveSeason = async () => {
    if (!editingSeason || !selectedShow) return;
    const payload = {
      show_id: selectedShow.id,
      season_number: editingSeason.season_number || 1,
      title: editingSeason.title || "",
      poster_url: editingSeason.poster_url || "",
      backdrop_url: editingSeason.backdrop_url || "",
      release_year: editingSeason.release_year || "",
    };
    if (isNewSeason) {
      const { error } = await supabase.from("seasons").insert([payload]);
      if (error) { toast.error("Failed to add"); return; }
      toast.success("Season added");
    } else {
      const { error } = await supabase.from("seasons").update(payload).eq("id", editingSeason.id!);
      if (error) { toast.error("Failed to update"); return; }
      toast.success("Season updated");
    }
    queryClient.invalidateQueries({ queryKey: ["seasons"] });
    setEditingSeason(null);
    setIsNewSeason(false);
  };

  const deleteSeason = async (id: string) => {
    await supabase.from("seasons").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["seasons"] });
    toast.success("Season deleted");
  };

  // EPISODE CRUD
  const saveEpisode = async () => {
    if (!editingEpisode || !selectedSeason) return;
    if (!editingEpisode.video_url?.trim()) {
      toast.error("Video URL is required for episodes");
      return;
    }
    const payload = {
      season_id: selectedSeason.id,
      episode_number: editingEpisode.episode_number || 1,
      title: editingEpisode.title || "",
      description: editingEpisode.description || "",
      video_url: editingEpisode.video_url || "",
      duration: editingEpisode.duration || "",
      thumbnail_url: editingEpisode.thumbnail_url || "",
    };
    if (isNewEpisode) {
      const { error } = await supabase.from("episodes").insert([payload]);
      if (error) { toast.error("Failed to add"); return; }
      toast.success("Episode added");
    } else {
      const { error } = await supabase.from("episodes").update(payload).eq("id", editingEpisode.id!);
      if (error) { toast.error("Failed to update"); return; }
      toast.success("Episode updated");
    }
    queryClient.invalidateQueries({ queryKey: ["episodes"] });
    setEditingEpisode(null);
    setIsNewEpisode(false);
  };

  const deleteEpisode = async (id: string) => {
    await supabase.from("episodes").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["episodes"] });
    toast.success("Episode deleted");
  };

  // Bulk set video URL for all episodes in a season
  const [bulkVideoUrl, setBulkVideoUrl] = useState("");
  const applyBulkVideoUrl = async () => {
    if (!bulkVideoUrl.trim() || !selectedSeason) return;
    const epsWithoutVideo = episodes.filter((e) => !e.video_url);
    for (const ep of epsWithoutVideo) {
      await supabase.from("episodes").update({ video_url: bulkVideoUrl }).eq("id", ep.id);
    }
    queryClient.invalidateQueries({ queryKey: ["episodes"] });
    toast.success(`Set video URL for ${epsWithoutVideo.length} episodes`);
    setBulkVideoUrl("");
  };

  const filtered = shows.filter((s) => s.title.toLowerCase().includes(searchFilter.toLowerCase()));

  // ====== RENDER ======

  // Episodes view
  if (view === "episodes" && selectedShow && selectedSeason) {
    const epsWithoutVideo = episodes.filter((e) => !e.video_url);
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => { setView("seasons"); setSelectedSeason(null); }} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-foreground">{selectedSeason.title || `Season ${selectedSeason.season_number}`}</h2>
            <p className="text-sm text-muted-foreground">{selectedShow.title} • {episodes.length} episodes</p>
          </div>
          <div className="ml-auto">
            <Button onClick={() => { setEditingEpisode({ episode_number: episodes.length + 1, video_url: "" }); setIsNewEpisode(true); }} className="gap-2">
              <Plus className="w-4 h-4" /> Add Episode
            </Button>
          </div>
        </div>

        {/* Bulk video URL helper */}
        {epsWithoutVideo.length > 0 && (
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl">
            <p className="text-xs font-medium text-primary mb-2">⚠ {epsWithoutVideo.length} episodes missing video URL</p>
            <div className="flex gap-2">
              <Input
                placeholder="Bulk set video URL for episodes without one..."
                value={bulkVideoUrl}
                onChange={(e) => setBulkVideoUrl(e.target.value)}
                className="bg-background border-0 flex-1 text-xs"
              />
              <Button size="sm" variant="secondary" onClick={applyBulkVideoUrl} disabled={!bulkVideoUrl.trim()}>
                Apply
              </Button>
            </div>
          </div>
        )}

        <Card>
          <CardContent className="p-0 divide-y divide-border">
            {episodes.map((ep) => (
              <div key={ep.id} className="flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors">
                <div className="w-20 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                  {ep.thumbnail_url ? <img src={ep.thumbnail_url} alt="" className="w-full h-full object-cover" /> : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">E{ep.episode_number}</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">E{ep.episode_number}: {ep.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {ep.duration && `${ep.duration} • `}
                    {ep.video_url ? (
                      <span className="text-green-500">✓ Video set</span>
                    ) : (
                      <span className="text-destructive font-medium">✗ No video URL</span>
                    )}
                  </p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => { setEditingEpisode({ ...ep }); setIsNewEpisode(false); }}><Pencil className="w-4 h-4" /></Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteEpisode(ep.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
            {episodes.length === 0 && <p className="p-4 text-sm text-muted-foreground">No episodes yet.</p>}
          </CardContent>
        </Card>

        {/* Episode form modal */}
        {editingEpisode && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-card w-full max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto p-6 border border-border shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-foreground">{isNewEpisode ? "Add Episode" : "Edit Episode"}</h2>
                <button onClick={() => { setEditingEpisode(null); setIsNewEpisode(false); }} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Episode #</Label>
                    <Input type="number" value={editingEpisode.episode_number || 1} onChange={(e) => setEditingEpisode((p) => p ? { ...p, episode_number: parseInt(e.target.value) || 1 } : p)} className="bg-secondary border-0 mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Duration</Label>
                    <Input value={editingEpisode.duration || ""} onChange={(e) => setEditingEpisode((p) => p ? { ...p, duration: e.target.value } : p)} placeholder="45m" className="bg-secondary border-0 mt-1" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Title</Label>
                  <Input value={editingEpisode.title || ""} onChange={(e) => setEditingEpisode((p) => p ? { ...p, title: e.target.value } : p)} className="bg-secondary border-0 mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <Textarea value={editingEpisode.description || ""} onChange={(e) => setEditingEpisode((p) => p ? { ...p, description: e.target.value } : p)} className="bg-secondary border-0 mt-1 min-h-[60px]" />
                </div>
                <div>
                  <Label className="text-xs text-foreground font-semibold">Video URL *<span className="text-destructive ml-1">(required)</span></Label>
                  <Input
                    value={editingEpisode.video_url || ""}
                    onChange={(e) => setEditingEpisode((p) => p ? { ...p, video_url: e.target.value } : p)}
                    placeholder="https://example.com/episode.mp4"
                    className={`mt-1 border ${editingEpisode.video_url ? "bg-secondary border-green-500/30" : "bg-secondary border-destructive/30"}`}
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">MP4 or streamable video link for this episode</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Thumbnail URL</Label>
                  <Input value={editingEpisode.thumbnail_url || ""} onChange={(e) => setEditingEpisode((p) => p ? { ...p, thumbnail_url: e.target.value } : p)} className="bg-secondary border-0 mt-1" />
                </div>
                <Button onClick={saveEpisode} className="w-full h-11">{isNewEpisode ? "Add Episode" : "Save Changes"}</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Seasons view
  if (view === "seasons" && selectedShow) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => { setView("shows"); setSelectedShow(null); }} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-foreground">{selectedShow.title}</h2>
            <p className="text-sm text-muted-foreground">{seasons.length} seasons {selectedShow.tmdb_id ? `• TMDB: ${selectedShow.tmdb_id}` : ""}</p>
          </div>
          <div className="ml-auto flex gap-2">
            {selectedShow.tmdb_id && (
              <Button variant="outline" size="sm" onClick={() => importFromTMDB(selectedShow.id, selectedShow.tmdb_id!)} disabled={tmdbLoading} className="gap-1">
                {tmdbLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Import TMDB
              </Button>
            )}
            <Button onClick={() => { setEditingSeason({ season_number: seasons.length + 1, show_id: selectedShow.id }); setIsNewSeason(true); }} className="gap-2">
              <Plus className="w-4 h-4" /> Add Season
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0 divide-y divide-border">
            {seasons.map((s) => (
              <div key={s.id} className="flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors cursor-pointer" onClick={() => { setSelectedSeason(s); setView("episodes"); }}>
                <div className="w-12 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
                  {s.poster_url ? <img src={s.poster_url} alt="" className="w-full h-full object-cover" /> : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">S{s.season_number}</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{s.title || `Season ${s.season_number}`}</p>
                  <p className="text-xs text-muted-foreground">{s.release_year}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditingSeason({ ...s }); setIsNewSeason(false); }}><Pencil className="w-4 h-4" /></Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={(e) => { e.stopPropagation(); deleteSeason(s.id); }}><Trash2 className="w-4 h-4" /></Button>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            ))}
            {seasons.length === 0 && (
              <div className="p-4">
                <p className="text-sm text-muted-foreground">
                  No seasons yet.
                  {selectedShow.tmdb_id ? (
                    <> Click <strong>"Import TMDB"</strong> to auto-import all seasons & episodes.</>
                  ) : (
                    <> Add seasons manually or set a TMDB ID on the show to auto-import.</>
                  )}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Season form modal */}
        {editingSeason && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-card w-full max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto p-6 border border-border shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-foreground">{isNewSeason ? "Add Season" : "Edit Season"}</h2>
                <button onClick={() => { setEditingSeason(null); setIsNewSeason(false); }} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Season #</Label>
                    <Input type="number" value={editingSeason.season_number || 1} onChange={(e) => setEditingSeason((p) => p ? { ...p, season_number: parseInt(e.target.value) || 1 } : p)} className="bg-secondary border-0 mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Year</Label>
                    <Input value={editingSeason.release_year || ""} onChange={(e) => setEditingSeason((p) => p ? { ...p, release_year: e.target.value } : p)} className="bg-secondary border-0 mt-1" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Title (optional)</Label>
                  <Input value={editingSeason.title || ""} onChange={(e) => setEditingSeason((p) => p ? { ...p, title: e.target.value } : p)} className="bg-secondary border-0 mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Poster URL</Label>
                  <Input value={editingSeason.poster_url || ""} onChange={(e) => setEditingSeason((p) => p ? { ...p, poster_url: e.target.value } : p)} className="bg-secondary border-0 mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Backdrop URL</Label>
                  <Input value={editingSeason.backdrop_url || ""} onChange={(e) => setEditingSeason((p) => p ? { ...p, backdrop_url: e.target.value } : p)} className="bg-secondary border-0 mt-1" />
                </div>
                <Button onClick={saveSeason} className="w-full h-11">{isNewSeason ? "Add Season" : "Save Changes"}</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Shows list view (default)
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Shows</h2>
          <p className="text-sm text-muted-foreground mt-1">{shows.length} shows total</p>
        </div>
        <Button onClick={() => { setEditingShow({ featured: false }); setIsNewShow(true); setTmdbResults([]); setTmdbIdInput(""); }} className="gap-2"><Plus className="w-4 h-4" /> Add Show</Button>
      </div>

      <Input placeholder="Filter shows..." value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)} className="max-w-sm bg-secondary border-0" />

      <Card>
        <CardContent className="p-0 divide-y divide-border">
          {isLoading && <p className="p-4 text-sm text-muted-foreground">Loading...</p>}
          {filtered.map((s) => (
            <div key={s.id} className="flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors cursor-pointer" onClick={() => { setSelectedShow(s); setView("seasons"); }}>
              <div className="w-12 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
                {s.poster_url ? <img src={s.poster_url} alt="" className="w-full h-full object-cover" /> : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">{s.title[0]}</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{s.title}</p>
                <p className="text-xs text-muted-foreground">
                  {s.release_year} • {s.genre} {s.featured ? "• ⭐" : ""} {s.tmdb_id ? `• TMDB: ${s.tmdb_id}` : ""}
                </p>
              </div>
              <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditingShow({ ...s }); setIsNewShow(false); setShowOnHero(heroItems.some((h) => h.title === s.title)); setTmdbResults([]); setTmdbIdInput(s.tmdb_id?.toString() || ""); }}><Pencil className="w-4 h-4" /></Button>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={(e) => { e.stopPropagation(); deleteShow(s.id); }}><Trash2 className="w-4 h-4" /></Button>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          ))}
          {filtered.length === 0 && !isLoading && <p className="p-4 text-sm text-muted-foreground">No shows yet.</p>}
        </CardContent>
      </Card>

      {/* Show form modal */}
      {editingShow && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto p-6 border border-border shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-foreground">{isNewShow ? "Add Show" : "Edit Show"}</h2>
              <button onClick={() => { setEditingShow(null); setIsNewShow(false); setTmdbResults([]); }} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>

            {/* TMDB fetch section - available for both new and edit */}
            <div className="mb-5 space-y-3 p-4 bg-secondary/50 rounded-xl border border-border/50">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Auto-fetch from TMDB</p>
              {/* Fetch by ID */}
              <div className="flex gap-2">
                <Input type="number" placeholder="TMDB ID" value={tmdbIdInput} onChange={(e) => setTmdbIdInput(e.target.value)} className="bg-background border-0 flex-1" />
                <Button onClick={fetchByTmdbId} size="sm" variant="secondary" disabled={tmdbLoading}>
                  {tmdbLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Film className="w-4 h-4" />}
                  <span className="ml-1">Fetch</span>
                </Button>
              </div>
              {/* Search by name */}
              <div className="flex gap-2">
                <Input placeholder="Or search by name..." value={tmdbSearch} onChange={(e) => setTmdbSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doTmdbSearch()} className="bg-background border-0 flex-1" />
                <Button onClick={doTmdbSearch} size="sm" variant="secondary" disabled={tmdbLoading}>
                  {tmdbLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
              {tmdbResults.length > 0 && (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {tmdbResults.map((r) => (
                    <button key={r.id} onClick={() => selectTmdbShow(r)} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-background/80 text-left">
                      <div className="w-8 h-12 rounded bg-muted shrink-0 overflow-hidden">
                        {r.poster_path && <img src={`https://image.tmdb.org/t/p/w92${r.poster_path}`} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{r.first_air_date?.split("-")[0]} • TMDB ID: {r.id}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Title *</Label>
                <Input value={editingShow.title || ""} onChange={(e) => setEditingShow((p) => p ? { ...p, title: e.target.value } : p)} className="bg-secondary border-0 mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Description</Label>
                <Textarea value={editingShow.description || ""} onChange={(e) => setEditingShow((p) => p ? { ...p, description: e.target.value } : p)} className="bg-secondary border-0 mt-1 min-h-[80px]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Year</Label>
                  <Input value={editingShow.release_year || ""} onChange={(e) => setEditingShow((p) => p ? { ...p, release_year: e.target.value } : p)} className="bg-secondary border-0 mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Genre</Label>
                  <Input value={editingShow.genre || ""} onChange={(e) => setEditingShow((p) => p ? { ...p, genre: e.target.value } : p)} className="bg-secondary border-0 mt-1" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">TMDB ID</Label>
                <Input type="number" value={editingShow.tmdb_id || ""} onChange={(e) => setEditingShow((p) => p ? { ...p, tmdb_id: parseInt(e.target.value) || null } : p)} className="bg-secondary border-0 mt-1" />
                <p className="text-[11px] text-muted-foreground mt-1">Set this to enable auto-import of seasons & episodes</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Poster URL</Label>
                <Input value={editingShow.poster_url || ""} onChange={(e) => setEditingShow((p) => p ? { ...p, poster_url: e.target.value } : p)} className="bg-secondary border-0 mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Backdrop URL</Label>
                <Input value={editingShow.backdrop_url || ""} onChange={(e) => setEditingShow((p) => p ? { ...p, backdrop_url: e.target.value } : p)} className="bg-secondary border-0 mt-1" />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={showOnHero} onCheckedChange={setShowOnHero} />
                <Label className="text-sm text-foreground flex items-center gap-1.5"><Monitor className="w-3.5 h-3.5" /> Show on Hero Banner</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={editingShow.featured || false} onCheckedChange={(v) => setEditingShow((p) => p ? { ...p, featured: v } : p)} />
                <Label className="text-sm text-foreground">Featured on Home</Label>
              </div>
              <Button onClick={saveShow} className="w-full h-11">{isNewShow ? "Add Show" : "Save Changes"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShowsManager;
