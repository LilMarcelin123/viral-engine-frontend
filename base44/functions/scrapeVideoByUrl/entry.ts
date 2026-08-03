import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const APIFY_API_KEY = Deno.env.get("APIFY_API_KEY");

async function runApifyActor(actorId, input) {
  const safeActorId = actorId.replace("/", "~");
  const runRes = await fetch(`https://api.apify.com/v2/acts/${safeActorId}/runs?token=${APIFY_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  if (!runRes.ok) {
    const err = await runRes.text();
    throw new Error(`Apify actor start failed: ${err}`);
  }
  const runData = await runRes.json();
  return runData.data;
}

async function waitForApifyRun(runId, timeoutMs = 90000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const res = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_API_KEY}`);
    const data = await res.json();
    const status = data.data?.status;
    if (status === "SUCCEEDED") return data.data;
    if (status === "FAILED" || status === "ABORTED" || status === "TIMED-OUT") {
      throw new Error(`Apify run ${status}`);
    }
    await new Promise(r => setTimeout(r, 2000));
  }
  throw new Error("Timeout waiting for Apify run");
}

async function getApifyDataset(datasetId) {
  const res = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_API_KEY}&limit=10`);
  if (!res.ok) throw new Error("Failed to fetch dataset");
  return await res.json();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { url } = await req.json();
    if (!url) return Response.json({ error: "URL is required" }, { status: 400 });

    const isTikTok = url.includes("tiktok.com");
    const isInstagram = url.includes("instagram.com");

    let videoData = {};

    if (isTikTok) {
      const run = await runApifyActor("clockworks/tiktok-scraper", {
        postURLs: [url],
        shouldDownloadCovers: false,
        shouldDownloadSlideshowImages: false,
        shouldDownloadSubtitles: false,
        shouldDownloadVideos: false
      });
      await waitForApifyRun(run.id);
      const result = await getApifyDataset(run.defaultDatasetId);

      if (result.length > 0) {
        const v = result[0];
        videoData = {
          views: v.playCount || 0,
          likes: v.diggCount || 0,
          comments: v.commentCount || 0,
          shares: v.shareCount || 0,
          saves: v.collectCount || 0,
          duration_seconds: v.videoMeta?.duration || v.duration || 0,
          caption: v.text || v.desc || "",
          thumbnail_url: v.covers?.[0] || v.videoMeta?.coverUrl || "",
          plataforma: "tiktok"
        };
      } else {
        return Response.json({ error: "No se encontró el video. Verifica que el URL sea correcto." }, { status: 404 });
      }
    } else if (isInstagram) {
      const run = await runApifyActor("apify/instagram-post-scraper", {
        directUrls: [url],
        resultsType: "posts",
        resultsLimit: 1
      });
      await waitForApifyRun(run.id);
      const result = await getApifyDataset(run.defaultDatasetId);

      if (result.length > 0) {
        const p = result[0];
        videoData = {
          views: p.videoViewCount || p.video_view_count || p.playCount || 0,
          likes: p.likesCount || p.likes_count || 0,
          comments: p.commentsCount || p.comments_count || 0,
          shares: p.sharesCount || 0,
          saves: p.savesCount || 0,
          duration_seconds: p.videoDuration || 0,
          caption: p.caption || "",
          thumbnail_url: p.displayUrl || p.thumbnail || "",
          plataforma: "instagram"
        };
      } else {
        return Response.json({ error: "No se encontró el video. Verifica que el URL sea correcto." }, { status: 404 });
      }
    } else {
      return Response.json({ error: "URL no soportada. Usa un link de TikTok o Instagram." }, { status: 400 });
    }

    return Response.json({ success: true, data: videoData });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});