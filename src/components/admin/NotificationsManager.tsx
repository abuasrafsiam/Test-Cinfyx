import { useState } from "react";
import { useAnnouncements, type Announcement } from "@/hooks/useAnnouncements";
import { useMovies } from "@/hooks/useMovies";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, X, Eye, Bell, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const emptyAnnouncement = { title: "", message: "", link: "", expires_at: "", active: true, target_type: "all", target_value: "" };

const NotificationsManager = () => {
  const { data: announcements = [], isLoading } = useAnnouncements();
  const { data: movies = [] } = useMovies();
  const [editing, setEditing] = useState<Partial<Announcement> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [preview, setPreview] = useState(false);
  const queryClient = useQueryClient();

  const openNew = () => { setEditing({ ...emptyAnnouncement }); setIsNew(true); };
  const openEdit = (a: Announcement) => {
    setEditing({
      ...a,
      expires_at: a.expires_at ? new Date(a.expires_at).toISOString().slice(0, 16) : "",
    });
    setIsNew(false);
  };
  const close = () => { setEditing(null); setIsNew(false); setPreview(false); };

  const save = async () => {
    if (!editing?.title) { toast.error("Title required"); return; }
    const payload = {
      title: editing.title,
      message: editing.message || "",
      link: editing.link || "",
      expires_at: editing.expires_at ? new Date(editing.expires_at).toISOString() : null,
      active: editing.active ?? true,
      target_type: editing.target_type || "all",
      target_value: editing.target_value || "",
    };

    if (isNew) {
      const { error } = await supabase.from("announcements").insert([payload]);
      if (error) { toast.error("Failed to create"); return; }
      toast.success("Announcement created");
    } else {
      const { error } = await supabase.from("announcements").update(payload).eq("id", editing.id!);
      if (error) { toast.error("Failed to update"); return; }
      toast.success("Announcement updated");
    }
    queryClient.invalidateQueries({ queryKey: ["announcements"] });
    close();
  };

  const deleteAnnouncement = async (id: string) => {
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Deleted");
    queryClient.invalidateQueries({ queryKey: ["announcements"] });
  };

  const toggleActive = async (a: Announcement) => {
    await supabase.from("announcements").update({ active: !a.active }).eq("id", a.id);
    queryClient.invalidateQueries({ queryKey: ["announcements"] });
    toast.success(a.active ? "Deactivated" : "Activated");
  };

  const update = (field: string, value: string | boolean) =>
    setEditing((p) => p ? { ...p, [field]: value } : p);

  const categories = [...new Set(movies.map((m) => m.category).filter(Boolean))];

  const targetLabel = (type: string, value: string) => {
    if (type === "all") return "All users";
    if (type === "category") return `Category: ${value}`;
    if (type === "movie") {
      const m = movies.find((mov) => mov.id === value);
      return `Movie: ${m?.title || value}`;
    }
    return type;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Notifications</h2>
          <p className="text-sm text-muted-foreground mt-1">Create targeted popups and announcements</p>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> New Announcement</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {isLoading && <p className="p-4 text-sm text-muted-foreground">Loading...</p>}
            {announcements.length === 0 && !isLoading && <p className="p-4 text-sm text-muted-foreground">No announcements yet.</p>}
            {announcements.map((a) => {
              const expired = a.expires_at && new Date(a.expires_at) < new Date();
              return (
                <div key={a.id} className="flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${a.active && !expired ? "bg-green-500" : "bg-muted-foreground"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{a.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.message}</p>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                        {targetLabel(a.target_type || "all", a.target_value || "")}
                      </span>
                      {a.link && <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">Has link</span>}
                      {expired && <span className="text-[10px] bg-destructive/20 text-destructive px-1.5 py-0.5 rounded">Expired</span>}
                      {!a.active && <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">Inactive</span>}
                    </div>
                  </div>
                  <Switch checked={a.active} onCheckedChange={() => toggleActive(a)} />
                  <Button size="sm" variant="ghost" onClick={() => openEdit(a)} className="text-xs">Edit</Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteAnnouncement(a.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Edit/Add modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto p-6 border border-border shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-foreground">{isNew ? "New Announcement" : "Edit Announcement"}</h2>
              <button onClick={close} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>

            {preview && (
              <div className="mb-4 p-4 bg-primary/10 border border-primary/20 rounded-xl">
                <div className="flex items-start gap-3">
                  <Bell className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{editing.title || "Title"}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{editing.message || "Message..."}</p>
                    {editing.link && (
                      <span className="text-xs text-primary mt-2 flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" /> {editing.link}
                      </span>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-2">
                      Target: {targetLabel(editing.target_type || "all", editing.target_value || "")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Button size="sm" variant="outline" onClick={() => setPreview(!preview)} className="gap-1 mb-4">
              <Eye className="w-3.5 h-3.5" /> {preview ? "Hide" : "Preview"}
            </Button>

            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Title *</Label>
                <Input value={editing.title || ""} onChange={(e) => update("title", e.target.value)} className="bg-secondary border-0 mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Message</Label>
                <Textarea value={editing.message || ""} onChange={(e) => update("message", e.target.value)} className="bg-secondary border-0 mt-1 min-h-[80px]" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Link (optional)</Label>
                <Input value={editing.link || ""} onChange={(e) => update("link", e.target.value)} placeholder="https://..." className="bg-secondary border-0 mt-1" />
              </div>

              {/* Targeting */}
              <div>
                <Label className="text-xs text-muted-foreground">Target</Label>
                <Select value={editing.target_type || "all"} onValueChange={(v) => { update("target_type", v); update("target_value", ""); }}>
                  <SelectTrigger className="bg-secondary border-0 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="category">Specific Category</SelectItem>
                    <SelectItem value="movie">Specific Movie</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {editing.target_type === "category" && (
                <div>
                  <Label className="text-xs text-muted-foreground">Category</Label>
                  <Select value={editing.target_value || ""} onValueChange={(v) => update("target_value", v)}>
                    <SelectTrigger className="bg-secondary border-0 mt-1">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c} value={c!}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {editing.target_type === "movie" && (
                <div>
                  <Label className="text-xs text-muted-foreground">Movie</Label>
                  <Select value={editing.target_value || ""} onValueChange={(v) => update("target_value", v)}>
                    <SelectTrigger className="bg-secondary border-0 mt-1">
                      <SelectValue placeholder="Select movie" />
                    </SelectTrigger>
                    <SelectContent>
                      {movies.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label className="text-xs text-muted-foreground">Expires at (optional)</Label>
                <Input type="datetime-local" value={editing.expires_at || ""} onChange={(e) => update("expires_at", e.target.value)} className="bg-secondary border-0 mt-1" />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={editing.active ?? true} onCheckedChange={(v) => update("active", v)} />
                <Label className="text-sm text-foreground">Active</Label>
              </div>
              <Button onClick={save} className="w-full h-11">{isNew ? "Create" : "Save Changes"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsManager;
