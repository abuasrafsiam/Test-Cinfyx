const SUPABASE_URL = "https://yoqzbdctvgnfkrleehzk.supabase.co";

/**
 * Wraps a video URL through the Supabase edge function proxy
 * to avoid CORS issues in production (Vercel / Capacitor APK).
 */
export function getProxiedVideoUrl(originalUrl: string): string {
  if (!originalUrl) return originalUrl;

  // Already a direct MP4/blob/data URL — no proxy needed
  if (
    originalUrl.startsWith("blob:") ||
    originalUrl.startsWith("data:") ||
    originalUrl.startsWith("/")
  ) {
    return originalUrl;
  }

  return `${SUPABASE_URL}/functions/v1/video-proxy?url=${encodeURIComponent(originalUrl)}`;
}
