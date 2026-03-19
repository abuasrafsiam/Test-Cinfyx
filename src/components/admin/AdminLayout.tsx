import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Film, Bell, BarChart3, Monitor, ChevronLeft, Menu, Tv } from "lucide-react";
import { Button } from "@/components/ui/button";

const tabs = [
  { id: "hero", label: "Hero", icon: Monitor },
  { id: "movies", label: "Movies", icon: Film },
  { id: "shows", label: "Shows", icon: Tv },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
] as const;

export type AdminTab = (typeof tabs)[number]["id"];

interface Props {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  children: React.ReactNode;
}

const AdminLayout = ({ activeTab, onTabChange, children }: Props) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-56" : "w-16"
        } bg-card border-r border-border flex flex-col transition-all duration-200 shrink-0`}
      >
        <div className="h-14 flex items-center px-4 border-b border-border gap-2">
          {sidebarOpen && (
            <h1 className="text-sm font-bold text-foreground tracking-wide flex-1">
              Admin Panel
            </h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"
          >
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                activeTab === id
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {sidebarOpen && <span>{label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-2 border-t border-border">
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4 shrink-0" />
            {sidebarOpen && <span>Back to App</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-6">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;
