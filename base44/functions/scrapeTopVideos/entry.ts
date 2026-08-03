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

async function waitForApifyRun(runId, timeoutMs = 240000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const res = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_API_KEY}`);
    const data = await res.json();
    const status = data.data?.status;
    if (status === "SUCCEEDED") return data.data;
    if (status === "FAILED" || status === "ABORTED" || status === "TIMED-OUT") {
      throw new Error(`Apify run ${status}`);
    }
    await new Promise(r => setTimeout(r, 3000));
  }
  throw new Error("Timeout waiting for Apify run");
}

async function getApifyDataset(datasetId) {
  const res = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_API_KEY}&limit=500`);
  if (!res.ok) throw new Error("Failed to fetch dataset");
  return await res.json();
}

function viralityScore(views) {
  const MIN_VIEWS = 10_000;
  if (views < MIN_VIEWS) return 0;
  const t = (Math.log10(views) - Math.log10(MIN_VIEWS)) / (Math.log10(5_000_000) - Math.log10(MIN_VIEWS));
  return Math.max(1, Math.min(100, Math.round(t * 100)));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Permiso: admin autenticado (manual/automatización) o secreto de cron
    const cronSecret = req.headers.get("X-Cron-Secret");
    const user = await base44.auth.me().catch(() => null);
    if (user) {
      const isAdmin = user.role === "admin" || user.user_type === "admin";
      if (!isAdmin) {
        return Response.json({ error: "No autorizado. Solo administradores pueden ejecutar scraping." }, { status: 403 });
      }
    } else if (cronSecret !== Deno.env.get("CRON_SECRET")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Solo los videos marcados como top (is_top) se re-scrapean en esta rutina
    const topPosts = await base44.asServiceRole.entities.Post.filter({ is_top: true }, "-views", 300);
    const ttPosts = topPosts.filter(p => p.platform === "tiktok" && p.url);
    const igPosts = topPosts.filter(p => p.platform === "instagram" && p.url);

    let updatedCount = 0;

    // ── TikTok: un solo run con todas las URLs (eficiente en créditos) ──
    if (ttPosts.length > 0) {
      const run = await runApifyActor("clockworks/tiktok-scraper", {
        postURLs: ttPosts.map(p => p.url),
        shouldDownloadCovers: false,
        shouldDownloadSlideshowImages: false,
        shouldDownloadSubtitles: false,
        shouldDownloadVideos: false
      });
      await waitForApifyRun(run.id);
      const results = await getApifyDataset(run.defaultDatasetId);

      const updates = [];
      for (const p of ttPosts) {
        const v = results.find(r =>
          (r.id && (p.post_id === r.id || p.url.includes(r.id))) ||
          (r.webVideoUrl && r.webVideoUrl === p.url)
        );
        if (!v) continue;
        const views = v.playCount || 0;
        updates.push({
          id: p.id,
          views,
          likes: v.diggCount || 0,
          comments: v.commentCount || 0,
          shares: v.shareCount || 0,
          saves: v.collectCount || 0,
          virality_score: viralityScore(views)
        });
      }
      if (updates.length > 0) {
        await base44.asServiceRole.entities.Post.bulkUpdate(updates);
        updatedCount += updates.length;
      }
    }

    // ── Instagram: un solo run con todas las URLs ──
    if (igPosts.length > 0) {
      const run = await runApifyActor("apify/instagram-post-scraper", {
        directUrls: igPosts.map(p => p.url),
        resultsType: "posts",
        resultsLimit: igPosts.length
      });
      await waitForApifyRun(run.id);
      const results = await getApifyDataset(run.defaultDatasetId);

      const updates = [];
      for (const p of igPosts) {
        const v = results.find(r =>
          (r.url && r.url === p.url) ||
          (r.shortCode && p.url.includes(r.shortCode))
        );
        if (!v) continue;
        const views = v.videoViewCount || v.playCount || 0;
        updates.push({
          id: p.id,
          views,
          likes: v.likesCount || 0,
          comments: v.commentsCount || 0,
          shares: v.sharesCount || 0,
          saves: v.savesCount || 0,
          virality_score: viralityScore(views)
        });
      }
      if (updates.length > 0) {
        await base44.asServiceRole.entities.Post.bulkUpdate(updates);
        updatedCount += updates.length;
      }
    }

    return Response.json({
      success: true,
      top_videos: topPosts.length,
      tiktok: ttPosts.length,
      instagram: igPosts.length,
      updated: updatedCount
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});