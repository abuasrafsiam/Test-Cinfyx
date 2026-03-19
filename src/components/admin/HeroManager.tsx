import { useState, useEffect } from "react";
import { useFeaturedMovies, useMovies } from "@/hooks/useMovies";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor, Star, Save, Eye } from "lucide-react";
import { toast } from "sonner";

const HeroManager = () => {
  const { data: featured = [] } = useFeaturedMovies();
  const { data: allMovies = [] } = useMovies();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", backdrop_url: "", video_url: "", category: "", year: "", genre: "" });
  const [preview, setPreview] = useState(false);

  const movie = allMovies.find((m) => m.id === selected);

  useEffect(() => {
    if (movie) {
      setForm({
        title: movie.title,
        description: movie.description || "",
        backdrop_url: movie.backdrop_url || "",
        video_url: movie.video_url || "",
        category: movie.category || "",
        year: movie.year || "",
        genre: movie.genre || "",
      });
    }
  }, [movie]);

  const toggleFeatured = async (movieId: string, current: boolean) => {
    await supabase.from("movies").update({ featured: !current }).eq("id", movieId);
    queryClient.invalidateQueries({ queryKey: ["movies"] });
    toast.success(!current ? "Added to hero" : "Removed from hero");
  };

  const saveHero = async () => {
    if (!selected) return;
    const { error } = await supabase.from("movies").update(form).eq("id", selected);
    if (error) { toast.error("Failed to save"); return; }
    queryClient.invalidateQueries({ queryKey: ["movies"] });
    toast.success("Hero updated");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Hero Management</h2>
        <p className="text-sm text-muted-foreground mt-1">Control which movies appear in the home hero carousel</p>
      </div>

      {/* Currently Featured */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Star className="w-4 h-4 text-primary" /> Featured Movies ({featured.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {featured.length === 0 && <p className="text-sm text-muted-foreground">No featured movies. Toggle movies below to add them.</p>}
          {featured.map((m) => (
            <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50">
              <div className="w-16 h-10 rounded overflow-hidden bg-muted shrink-0">
                {m.backdrop_url && <img src={m.backdrop_url} alt="" className="w-full h-full object-cover" />}
              </div>
              <span className="text-sm text-foreground flex-1 truncate">{m.title}</span>
              <Button size="sm" variant="ghost" onClick={() => setSelected(m.id)} className="text-xs">Edit</Button>
              <Button size="sm" variant="ghost" onClick={() => toggleFeatured(m.id, true)} className="text-xs text-destructive">Remove</Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* All movies toggle */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">All Movies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-64 overflow-y-auto">
          {allMovies.filter((m) => !m.featured).map((m) => (
            <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50">
              <div className="w-10 h-14 rounded overflow-hidden bg-muted shrink-0">
                {m.poster_url && <img src={m.poster_url} alt="" className="w-full h-full object-cover" />}
              </div>
              <span className="text-sm text-foreground flex-1 truncate">{m.title}</span>
              <Button size="sm" variant="outline" onClick={() => toggleFeatured(m.id, false)} className="text-xs">
                <Star className="w-3 h-3 mr-1" /> Feature
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Edit selected hero movie */}
      {selected && movie && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Monitor className="w-4 h-4" /> Editing: {movie.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Preview */}
            {preview && (
              <div className="relative h-48 rounded-xl overflow-hidden bg-muted">
                {form.backdrop_url && (
                  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${form.backdrop_url})` }} />
                )}
                <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-background to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <h3 className="text-lg font-bold text-foreground">{form.title}</h3>
                  <p className="text-xs text-muted-foreground">{form.year} • {form.genre}</p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setPreview(!preview)} className="gap-1">
                <Eye className="w-3.5 h-3.5" /> {preview ? "Hide Preview" : "Preview"}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-secondary border-0 mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Category</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="bg-secondary border-0 mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-secondary border-0 mt-1 min-h-[60px]" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Backdrop URL</Label>
              <Input value={form.backdrop_url} onChange={(e) => setForm({ ...form, backdrop_url: e.target.value })} className="bg-secondary border-0 mt-1" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Video URL</Label>
              <Input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} className="bg-secondary border-0 mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Year</Label>
                <Input value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className="bg-secondary border-0 mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Genre</Label>
                <Input value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} className="bg-secondary border-0 mt-1" />
              </div>
            </div>
            <Button onClick={saveHero} className="gap-2">
              <Save className="w-4 h-4" /> Save Changes
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HeroManager;
