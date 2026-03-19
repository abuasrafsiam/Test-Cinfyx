import { Download } from "lucide-react";

const DownloadsPage = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center pb-20 px-6">
      <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
        <Download className="w-8 h-8 text-muted-foreground" />
      </div>
      <h1 className="text-xl font-bold text-foreground mb-1">Downloads</h1>
      <p className="text-sm text-muted-foreground text-center">Coming Soon — offline downloads will appear here.</p>
    </div>
  );
};

export default DownloadsPage;
