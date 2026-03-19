import { useState } from "react";
import { useHeroItems, type HeroItem } from "@/hooks/useHeroItems";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, X, Eye, Play, ArrowUp, ArrowDown, Monitor } from "lucide-react";
import { toast } from "sonner";

const emptyHero = { video_url: "", title: "", description: "", backdrop_url: "", start_time: "", end_time: "", priority: 0, active: true };

const HeroManager = () => {
  const { data: heroes = [], isLoading } = useHeroItems();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<(Partial<HeroItem> & typeof emptyHero) | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [preview, setPreview] = useState(false);

  const openNew = () => {
    const maxPriority = heroes.length > 0 ? Math.max(...heroes.map((h) => h.priority)) : 0;
    setEditing({ ...emptyHero, priority: maxPriority + 1 });
    setIsNew(true);
  };

  const openEdit = (h: HeroItem) => {
    setEditing({
      ...h,
      start_time: h.start_time ? new Date(h.start_time).toISOString().slice(0, 16) : "",
      end_time: h.end_time ? new Date(h.end_time).toISOString().slice(0, 16) : "",
    });
    setIsNew(false);
  };

  const close = () => { setEditing(null); setIsNew(false); setPreview(false); };

  const save = async () => {
    if (!editing) return;
    if (!editing.video_url && !editing.backdrop_url) {
      toast.error("Provide a video URL or backdrop image");
      return;
    }
    const payload = {
      video_url: editing.video_url || "",
      title: editing.title || "",
      description: editing.description || "",
      backdrop_url: editing.backdrop_url || "",
      start_time: editing.start_time ? new Date(editing.start_time).toISOString() : null,
      end_time: editing.end_time ? new Date(editing.end_time).toISOString() : null,
      priority: editing.priority ?? 0,
      active: editing.active ?? true,
    };

    if (isNew) {
      const { error } = await supabase.from("hero_items").insert([payload]);
      if (error) { toast.error("Failed to create"); return; }
      toast.success("Hero item created");
    } else {
      const { error } = await supabase.from("hero_items").update(payload).eq("id", editing.id!);
      if (error) { toast.error("Failed to update"); return; }
      toast.success("Hero item updated");
    }
    queryClient.invalidateQueries({ queryKey: ["hero_items"] });
    close();
  };

  const deleteHero = async (id: string) => {
    await supabase.from("hero_items").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["hero_items"] });
    toast.success("Deleted");
  };

  const toggleActive = async (h: HeroItem) => {
    await supabase.from("hero_items").update({ active: !h.active }).eq("id", h.id);
    queryClient.invalidateQueries({ queryKey: ["hero_items"] });
    toast.success(h.active ? "Deactivated" : "Activated");
  };

  const changePriority = async (h: HeroItem, direction: "up" | "down") => {
    const newPriority = direction === "up" ? h.priority + 1 : Math.max(0, h.priority - 1);
    await supabase.from("hero_items").update({ priority: newPriority }).eq("id", h.id);
    queryClient.invalidateQueries({ queryKey: ["hero_items"] });
  };

  const update = (field: string, value: string | boolean | number) =>
    setEditing((p) => (p ? { ...p, [field]: value } : p));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Hero Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage hero banner rotation. Heroes auto-rotate every 6 seconds.
          </p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="w-4 h-4" /> Add Hero
        </Button>
      </div>

      {/* Hero items list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Monitor className="w-4 h-4 text-primary" /> Hero Items ({heroes.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {isLoading && <p className="p-4 text-sm text-muted-foreground">Loading...</p>}
            {heroes.length === 0 && !isLoading && (
              <p className="p-4 text-sm text-muted-foreground">No hero items yet. Add one above.</p>
            )}
            {heroes.map((h) => {
              const now = new Date();
              const scheduled = h.start_time && new Date(h.start_time) > now;
              const expired = h.end_time && new Date(h.end_time) < now;
              return (
                <div key={h.id} className="flex items-center gap-3 p-3 hover:bg-secondary/30 transition-colors">
                  <div className="w-20 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                    {h.backdrop_url ? (
                      <img src={h.backdrop_url} alt="" className="w-full h-full object-cover" />
                    ) : h.video_url ? (
                      <div className="w-full h-full flex items-center justify-center bg-secondary">
                        <Play className="w-4 h-4 text-muted-foreground" />
                      </div>
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {h.title || "Untitled Hero"}
                    </p>
                    <div className="flex gap-1.5 mt-0.5">
                      <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">
                        Priority: {h.priority}
                      </span>
                      {scheduled && (
                        <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded">Scheduled</span>
                      )}
                      {expired && (
                        <span className="text-[10px] bg-destructive/20 text-destructive px-1.5 py-0.5 rounded">Expired</span>
                      )}
                      {!h.active && (
                        <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">Inactive</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => changePriority(h, "up")} className="p-1 rounded hover:bg-secondary text-muted-foreground">
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => changePriority(h, "down")} className="p-1 rounded hover:bg-secondary text-muted-foreground">
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <Switch checked={h.active} onCheckedChange={() => toggleActive(h)} />
                  <Button size="sm" variant="ghost" onClick={() => openEdit(h)} className="text-xs">
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteHero(h.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Edit / Add modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto p-6 border border-border shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-foreground">
                {isNew ? "Add Hero Item" : "Edit Hero Item"}
              </h2>
              <button onClick={close} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live preview */}
            {preview && (
              <div className="relative h-40 rounded-xl overflow-hidden bg-secondary mb-4">
                <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-background to-transparent" />
                <div className="absolute bottom-3 left-4">
                  <h3 className="text-base font-bold text-foreground">{editing.title || "Hero Title"}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{editing.description || "Description..."}</p>
                </div>
                {editing.video_url && (
                  <div className="absolute top-2 right-2 bg-primary/80 text-primary-foreground text-[10px] px-2 py-0.5 rounded">
                    Video
                  </div>
                )}
              </div>
            )}

            <Button size="sm" variant="outline" onClick={() => setPreview(!preview)} className="gap-1 mb-4">
              <Eye className="w-3.5 h-3.5" /> {preview ? "Hide Preview" : "Preview"}
            </Button>

            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Video URL</Label>
                <Input
                  value={editing.video_url || ""}
                  onChange={(e) => update("video_url", e.target.value)}
                  placeholder="https://example.com/video.mp4 or YouTube embed URL"
                  className="bg-secondary border-0 mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Title (optional)</Label>
                <Input
                  value={editing.title || ""}
                  onChange={(e) => update("title", e.target.value)}
                  className="bg-secondary border-0 mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Description (optional)</Label>
                <Textarea
                  value={editing.description || ""}
                  onChange={(e) => update("description", e.target.value)}
                  className="bg-secondary border-0 mt-1 min-h-[60px]"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Backdrop Image URL (fallback)</Label>
                <Input
                  value={editing.backdrop_url || ""}
                  onChange={(e) => update("backdrop_url", e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="bg-secondary border-0 mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Start Time (optional)</Label>
                  <Input
                    type="datetime-local"
                    value={editing.start_time || ""}
                    onChange={(e) => update("start_time", e.target.value)}
                    className="bg-secondary border-0 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">End Time (optional)</Label>
                  <Input
                    type="datetime-local"
                    value={editing.end_time || ""}
                    onChange={(e) => update("end_time", e.target.value)}
                    className="bg-secondary border-0 mt-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Priority (higher = shown first)</Label>
                <Input
                  type="number"
                  value={editing.priority ?? 0}
                  onChange={(e) => update("priority", parseInt(e.target.value) || 0)}
                  className="bg-secondary border-0 mt-1 w-32"
                />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={editing.active ?? true} onCheckedChange={(v) => update("active", v)} />
                <Label className="text-sm text-foreground">Active</Label>
              </div>
              <Button onClick={save} className="w-full h-11">
                {isNew ? "Create Hero" : "Update Hero"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeroManager;
