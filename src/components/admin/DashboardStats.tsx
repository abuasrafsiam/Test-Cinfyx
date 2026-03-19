import { usePlayStats } from "@/hooks/usePlayEvents";
import { useMovies } from "@/hooks/useMovies";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Film, PlayCircle, Bell, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const DashboardStats = () => {
  const { data: playData, isLoading } = usePlayStats();
  const { data: movies = [] } = useMovies();
  const { data: announcements = [] } = useAnnouncements();

  const stats = playData?.stats || [];
  const totalPlays = playData?.totalPlays || 0;
  const featured = movies.filter((m) => m.featured).length;
  const activeAnnouncements = announcements.filter((a) => a.active).length;

  const chartData = stats.slice(0, 8).map((s) => ({
    name: s.title.length > 12 ? s.title.slice(0, 12) + "…" : s.title,
    plays: s.play_count,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-1">Overview of your streaming app</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><Film className="w-4 h-4 text-primary" /></div>
              <div>
                <p className="text-2xl font-bold text-foreground">{movies.length}</p>
                <p className="text-xs text-muted-foreground">Total Movies</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><PlayCircle className="w-4 h-4 text-primary" /></div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalPlays}</p>
                <p className="text-xs text-muted-foreground">Total Plays</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><TrendingUp className="w-4 h-4 text-primary" /></div>
              <div>
                <p className="text-2xl font-bold text-foreground">{featured}</p>
                <p className="text-xs text-muted-foreground">Featured</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><Bell className="w-4 h-4 text-primary" /></div>
              <div>
                <p className="text-2xl font-bold text-foreground">{activeAnnouncements}</p>
                <p className="text-xs text-muted-foreground">Active Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Plays by Movie</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : chartData.length === 0 ? (
            <p className="text-sm text-muted-foreground">No play data yet. Plays will be tracked when users watch movies.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(0 0% 55%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(0 0% 55%)" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(0 0% 8%)", border: "1px solid hsl(0 0% 16%)", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "hsl(0 0% 95%)" }}
                  itemStyle={{ color: "hsl(0 72% 51%)" }}
                />
                <Bar dataKey="plays" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={`hsl(0, 72%, ${51 + i * 3}%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Top movies table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Most Popular Movies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {stats.slice(0, 10).map((s, i) => (
              <div key={s.movie_id} className="flex items-center gap-3 py-2.5">
                <span className="text-xs text-muted-foreground w-5">{i + 1}</span>
                <div className="w-8 h-12 rounded overflow-hidden bg-muted shrink-0">
                  {s.poster_url && <img src={s.poster_url} alt="" className="w-full h-full object-cover" />}
                </div>
                <span className="text-sm text-foreground flex-1 truncate">{s.title}</span>
                <span className="text-sm font-medium text-primary">{s.play_count} plays</span>
              </div>
            ))}
            {stats.length === 0 && <p className="py-3 text-sm text-muted-foreground">No data yet</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardStats;
