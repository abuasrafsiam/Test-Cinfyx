import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, range",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Expose-Headers":
    "content-length, content-range, accept-ranges, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { searchParams } = new URL(req.url);
    const videoUrl = searchParams.get("url");

    if (!videoUrl) {
      return new Response(JSON.stringify({ error: "Missing url parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Forward range header for progressive download / seeking
    const headers: Record<string, string> = {};
    const rangeHeader = req.headers.get("range");
    if (rangeHeader) {
      headers["Range"] = rangeHeader;
    }

    // Fetch from upstream
    const upstream = await fetch(videoUrl, {
      headers,
      redirect: "follow",
    });

    if (!upstream.ok && upstream.status !== 206) {
      return new Response(
        JSON.stringify({ error: "Upstream error", status: upstream.status }),
        {
          status: upstream.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Build response headers
    const responseHeaders: Record<string, string> = { ...corsHeaders };

    const ct = upstream.headers.get("content-type");
    if (ct) responseHeaders["Content-Type"] = ct;

    const cl = upstream.headers.get("content-length");
    if (cl) responseHeaders["Content-Length"] = cl;

    const cr = upstream.headers.get("content-range");
    if (cr) responseHeaders["Content-Range"] = cr;

    const ar = upstream.headers.get("accept-ranges");
    if (ar) responseHeaders["Accept-Ranges"] = ar;
    else responseHeaders["Accept-Ranges"] = "bytes";

    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
