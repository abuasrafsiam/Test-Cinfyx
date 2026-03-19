import { useState } from "react";
import { useAdConfig, type AdConfig } from "@/hooks/useAdConfig";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

const AdsManager = () => {
  const { data: config, isLoading } = useAdConfig();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<Partial<AdConfig> | null>(null);

  // Sync form with loaded config
  const activeForm = form ?? config;

  const update = (field: string, value: string | boolean | number) => {
    setForm((prev) => ({ ...(prev ?? config), [field]: value }) as Partial<AdConfig>);
  };

  const save = async () => {
    if (!activeForm?.id) return;
    setSaving(true);
    const { error } = await supabase.from("ad_config").update({
      ads_enabled: activeForm.ads_enabled ?? false,
      ad_video_url: activeForm.ad_video_url || "",
      midroll_trigger_minutes: activeForm.midroll_trigger_minutes ?? 10,
      skip_after_seconds: activeForm.skip_after_seconds ?? 5,
      max_ads_per_video: activeForm.max_ads_per_video ?? 1,
      updated_at: new Date().toISOString(),
    }).eq("id", activeForm.id);
    setSaving(false);
    if (error) { toast.error("Failed to save"); return; }
    toast.success("Ad settings saved");
    setForm(null);
    queryClient.invalidateQueries({ queryKey: ["ad_config"] });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!activeForm) {
    return <p className="text-muted-foreground text-sm">No ad configuration found.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Ads Management</h2>
        <p className="text-sm text-muted-foreground mt-1">Control mid-roll ads across the app.</p>
      </div>

      {/* Master toggle */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-primary" /> Global Ad Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Ads Enabled</p>
              <p className="text-xs text-muted-foreground">Toggle to enable or disable all ads instantly</p>
            </div>
            <Switch
              checked={activeForm.ads_enabled ?? false}
              onCheckedChange={(v) => update("ads_enabled", v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Ad configuration */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Mid-Roll Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Label className="text-xs text-muted-foreground">Ad Video URL</Label>
            <Input
              value={activeForm.ad_video_url || ""}
              onChange={(e) => update("ad_video_url", e.target.value)}
              placeholder="https://example.com/ad-video.mp4"
              className="bg-secondary border-0 mt-1"
            />
            <p className="text-[11px] text-muted-foreground mt-1">MP4 or streamable video URL</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Trigger After (min)</Label>
              <Input
                type="number"
                min={10}
                value={activeForm.midroll_trigger_minutes ?? 10}
                onChange={(e) => update("midroll_trigger_minutes", Math.max(10, parseInt(e.target.value) || 10))}
                className="bg-secondary border-0 mt-1"
              />
              <p className="text-[11px] text-muted-foreground mt-1">Min: 10 minutes</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Skip After (sec)</Label>
              <Input
                type="number"
                min={3}
                max={30}
                value={activeForm.skip_after_seconds ?? 5}
                onChange={(e) => update("skip_after_seconds", Math.max(3, parseInt(e.target.value) || 5))}
                className="bg-secondary border-0 mt-1"
              />
              <p className="text-[11px] text-muted-foreground mt-1">3–30 seconds</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Max Ads/Video</Label>
              <Input
                type="number"
                min={1}
                max={5}
                value={activeForm.max_ads_per_video ?? 1}
                onChange={(e) => update("max_ads_per_video", Math.max(1, parseInt(e.target.value) || 1))}
                className="bg-secondary border-0 mt-1"
              />
            </div>
          </div>

          {/* Preview info */}
          {activeForm.ads_enabled && activeForm.ad_video_url && (
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl">
              <p className="text-xs font-medium text-primary">Ad Preview Summary</p>
              <ul className="text-xs text-muted-foreground mt-1.5 space-y-0.5">
                <li>• Ad will trigger at <span className="text-foreground font-medium">{activeForm.midroll_trigger_minutes} minutes</span> of playback</li>
                <li>• Skip button appears after <span className="text-foreground font-medium">{activeForm.skip_after_seconds} seconds</span></li>
                <li>• Max <span className="text-foreground font-medium">{activeForm.max_ads_per_video} ad(s)</span> per video</li>
                <li>• Movies under 20 minutes won't show ads</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Button onClick={save} className="w-full h-11 gap-2" disabled={saving}>
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save Ad Settings
      </Button>
    </div>
  );
};

export default AdsManager;
