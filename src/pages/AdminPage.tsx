import { useState } from "react";
import AdminLayout, { type AdminTab } from "@/components/admin/AdminLayout";
import HeroManager from "@/components/admin/HeroManager";
import MoviesManager from "@/components/admin/MoviesManager";
import NotificationsManager from "@/components/admin/NotificationsManager";
import DashboardStats from "@/components/admin/DashboardStats";

const AdminPage = () => {
  const [tab, setTab] = useState<AdminTab>("dashboard");

  return (
    <AdminLayout activeTab={tab} onTabChange={setTab}>
      {tab === "hero" && <HeroManager />}
      {tab === "movies" && <MoviesManager />}
      {tab === "notifications" && <NotificationsManager />}
      {tab === "dashboard" && <DashboardStats />}
    </AdminLayout>
  );
};

export default AdminPage;
