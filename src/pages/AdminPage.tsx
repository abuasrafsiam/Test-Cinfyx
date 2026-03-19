import { useState } from "react";
import AdminLayout, { type AdminTab } from "@/components/admin/AdminLayout";
import HeroManager from "@/components/admin/HeroManager";
import MoviesManager from "@/components/admin/MoviesManager";
import ShowsManager from "@/components/admin/ShowsManager";
import AdsManager from "@/components/admin/AdsManager";
import NotificationsManager from "@/components/admin/NotificationsManager";
import DashboardStats from "@/components/admin/DashboardStats";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

const ADMIN_USERNAME = "Abu Asraf Siam";
const ADMIN_PASSWORD = "Abusiam10";

const AdminPage = () => {
  const [tab, setTab] = useState<AdminTab>("dashboard");
  const [authenticated, setAuthenticated] = useState(() => {
    return sessionStorage.getItem("admin_auth") === "true";
  });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      sessionStorage.setItem("admin_auth", "true");
      setAuthenticated(true);
      setError("");
    } else {
      setError("Invalid credentials");
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-card rounded-2xl p-6 border border-border shadow-xl">
            <div className="flex flex-col items-center mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-lg font-bold text-foreground">Admin Login</h1>
              <p className="text-xs text-muted-foreground mt-1">Enter credentials to access the panel</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className="bg-secondary border-0"
                  autoComplete="username"
                />
              </div>
              <div>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="bg-secondary border-0"
                  autoComplete="current-password"
                />
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Button type="submit" className="w-full h-11">Sign In</Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout activeTab={tab} onTabChange={setTab}>
      {tab === "hero" && <HeroManager />}
      {tab === "movies" && <MoviesManager />}
      {tab === "shows" && <ShowsManager />}
      {tab === "ads" && <AdsManager />}
      {tab === "notifications" && <NotificationsManager />}
      {tab === "dashboard" && <DashboardStats />}
    </AdminLayout>
  );
};

export default AdminPage;
