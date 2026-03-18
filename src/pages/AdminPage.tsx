import { useState } from "react";
import { useMovies, type Movie } from "@/hooks/useMovies";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const emptyMovie = {
  title: "",
  description: "",
  poster_url: "",
  backdrop_url: "",
  video_url: "",
  category: "Trending",
  year: "",
  genre: "",
  featured: false,
};

const AdminPage = () => {
  const { data: movies = [], isLoading } = useMovies();
  const [editing, setEditing] = useState<Partial<Movie> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const queryClient = useQueryClient();

  const openNew = () => {
    setEditing({ ...emptyMovie });
    setIsNew(true);
  };

  const openEdit = (movie: Movie) => {
    setEditing({ ...movie });
    setIsNew(false);
  };

  const close = () => {
    setEditing(null);
    setIsNew(false);
  };

  const save = async () => {
    if (!editing || !editing.title) {
      toast.error("Title is required");
      return;
    }

    if (isNew) {
      const { error } = await supabase.from("movies").insert([{
        title: editing.title,
        description: editing.description || "",
        poster_url: editing.poster_url || "",
        backdrop_url: editing.backdrop_url || "",
        video_url: editing.video_url || "",
        category: editing.category || "Trending",
        year: editing.year || "",
        genre: editing.genre || "",
        featured: editing.featured || false,
      }]);
      if (error) {
        toast.error("Failed to add movie");
        return;
      }
      toast.success("Movie added");
    } else {
      const { error } = await supabase
        .from("movies")
        .update({
          title: editing.title,
          description: editing.description,
          poster_url: editing.poster_url,
          backdrop_url: editing.backdrop_url,
          video_url: editing.video_url,
          category: editing.category,
          year: editing.year,
          genre: editing.genre,
          featured: editing.featured,
        })
        .eq("id", editing.id!);
      if (error) {
        toast.error("Failed to update movie");
        return;
      }
      toast.success("Movie updated");
    }

    queryClient.invalidateQueries({ queryKey: ["movies"] });
    close();
  };

  const deleteMovie = async (id: string) => {
    const { error } = await supabase.from("movies").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
      return;
    }
    toast.success("Movie deleted");
    queryClient.invalidateQueries({ queryKey: ["movies"] });
  };

  const updateField = (field: string, value: string | boolean) => {
    setEditing((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4 sticky top-0 z-10 bg-background/95 backdrop-blur-sm flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">Admin Panel</h1>
        <Button onClick={openNew} size="sm" className="gap-1 rounded-lg">
          <Plus className="w-4 h-4" />
          Add Movie
        </Button>
      </div>

      {/* Movie list */}
      <div className="px-4 space-y-2">
        {isLoading && <p className="text-muted-foreground text-sm">Loading...</p>}
        {movies.map((movie) => (
          <div
            key={movie.id}
            className="flex items-center gap-3 p-3 bg-card rounded-xl"
          >
            <div className="w-12 h-16 rounded-lg overflow-hidden bg-secondary shrink-0">
              {movie.poster_url && (
                <img src={movie.poster_url} alt="" className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{movie.title}</p>
              <p className="text-xs text-muted-foreground">{movie.category} • {movie.year}</p>
            </div>
            <button onClick={() => openEdit(movie)} className="p-2 text-muted-foreground hover:text-foreground">
              <Pencil className="w-4 h-4" />
            </button>
            <button onClick={() => deleteMovie(movie.id)} className="p-2 text-destructive hover:text-destructive/80">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Edit/Add modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center">
          <div className="bg-card w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                {isNew ? "Add Movie" : "Edit Movie"}
              </h2>
              <button onClick={close} className="text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Title *</Label>
                <Input
                  value={editing.title || ""}
                  onChange={(e) => updateField("title", e.target.value)}
                  className="bg-secondary border-0 rounded-lg mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Description</Label>
                <Textarea
                  value={editing.description || ""}
                  onChange={(e) => updateField("description", e.target.value)}
                  className="bg-secondary border-0 rounded-lg mt-1 min-h-[80px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Year</Label>
                  <Input
                    value={editing.year || ""}
                    onChange={(e) => updateField("year", e.target.value)}
                    className="bg-secondary border-0 rounded-lg mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Genre</Label>
                  <Input
                    value={editing.genre || ""}
                    onChange={(e) => updateField("genre", e.target.value)}
                    className="bg-secondary border-0 rounded-lg mt-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Category</Label>
                <Select
                  value={editing.category || "Trending"}
                  onValueChange={(v) => updateField("category", v)}
                >
                  <SelectTrigger className="bg-secondary border-0 rounded-lg mt-1">
                    <SelectValue />
                  </SelectTrigger>
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
                <Input
                  value={editing.poster_url || ""}
                  onChange={(e) => updateField("poster_url", e.target.value)}
                  className="bg-secondary border-0 rounded-lg mt-1"
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Backdrop URL</Label>
                <Input
                  value={editing.backdrop_url || ""}
                  onChange={(e) => updateField("backdrop_url", e.target.value)}
                  className="bg-secondary border-0 rounded-lg mt-1"
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Video URL (MP4/HLS)</Label>
                <Input
                  value={editing.video_url || ""}
                  onChange={(e) => updateField("video_url", e.target.value)}
                  className="bg-secondary border-0 rounded-lg mt-1"
                  placeholder="https://..."
                />
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={editing.featured || false}
                  onCheckedChange={(v) => updateField("featured", v)}
                />
                <Label className="text-sm text-foreground">Featured on Home</Label>
              </div>

              <Button onClick={save} className="w-full rounded-xl h-11 mt-2">
                {isNew ? "Add Movie" : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
