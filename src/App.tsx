import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import BottomNav from "@/components/BottomNav";
import AnnouncementPopup from "@/components/AnnouncementPopup";
import Index from "./pages/Index";
import MoviesPage from "./pages/MoviesPage";
import ShowsPage from "./pages/ShowsPage";
import ProfilePage from "./pages/ProfilePage";
import DownloadsPage from "./pages/DownloadsPage";
import MovieDetail from "./pages/MovieDetail";
import Watch from "./pages/Watch";
import WatchEpisode from "./pages/WatchEpisode";
import SearchPage from "./pages/SearchPage";
import AdminPage from "./pages/AdminPage";
import ShowDetail from "./pages/ShowDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/movies" element={<MoviesPage />} />
        <Route path="/shows" element={<ShowsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/movie/:id" element={<MovieDetail />} />
        <Route path="/watch/:id" element={<Watch />} />
        <Route path="/watch/episode/:id" element={<WatchEpisode />} />
        <Route path="/show/:id" element={<ShowDetail />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <BottomNav />
      <AnnouncementPopup />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
