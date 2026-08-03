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

async function waitForApifyRun(runId, timeoutMs = 300000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const res = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_API_KEY}`);
    const data = await res.json();
    const status = data.data?.status;
    if (status === "SUCCEEDED") return data.data;
    if (status === "FAILED" || status === "ABORTED" || status === "TIMED-OUT") {
      throw new Error(`Run ${status}`);
    }
    await new Promise(r => setTimeout(r, 5000));
  }
  throw new Error("Timeout waiting for Apify run");
}

async function getApifyDataset(datasetId) {
  const res = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_API_KEY}&limit=1000`);
  if (!res.ok) throw new Error("Failed to fetch dataset");
  return await res.json();
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Solo administradores pueden ejecutar bulk scraping (consume créditos de Apify)
  const isAdmin = user.role === "admin" || user.user_type === "admin";
  if (!isAdmin) {
    return Response.json({ error: "No autorizado. Solo administradores pueden ejecutar scraping." }, { status: 403 });
  }

  // usernames: array de usuarios TikTok (sin @); limit: máx posts por perfil (ahorro de créditos)
  const { usernames, limit: reqLimit } = await req.json();
  const limit = Math.max(1, Math.min(200, reqLimit || 200));
  if (!usernames || !usernames.length) {
    return Response.json({ error: "No usernames provided" }, { status: 400 });
  }

  const cleanUsernames = usernames.map(u => u.replace("@", "").trim()).filter(Boolean);

  // Create all profile records first (or find existing ones)
  const profileMap = {}; // username -> profileId
  for (const username of cleanUsernames) {
    const existing = await base44.asServiceRole.entities.Profile.filter({ username, platform: "tiktok" });
    let profile;
    if (existing.length > 0) {
      profile = existing[0];
      await base44.asServiceRole.entities.Profile.update(profile.id, { scrape_status: "scraping" });
    } else {
      profile = await base44.asServiceRole.entities.Profile.create({
        username,
        platform: "tiktok",
        scrape_status: "scraping"
      });
    }
    profileMap[username] = profile.id;
  }

  try {
    // ONE single Apify call with all profiles
    const profileUrls = cleanUsernames.map(u => `https://www.tiktok.com/@${u}`);
    const ttRun = await runApifyActor("clockworks/tiktok-profile-scraper", {
      profiles: profileUrls,
      resultsPerPage: limit,
      maxItems: limit * cleanUsernames.length
    });

    await waitForApifyRun(ttRun.id);
    const ttResult = await getApifyDataset(ttRun.defaultDatasetId);

    // Group results by author username
    const byUsername = {};
    for (const item of ttResult) {
      const author = item.authorMeta || item.author || {};
      const uname = (author.name || author.uniqueId || "").toLowerCase();
      if (!uname) continue;
      if (!byUsername[uname]) byUsername[uname] = [];
      byUsername[uname].push(item);
    }

    let totalPosts = 0;

    for (const username of cleanUsernames) {
      const profileId = profileMap[username];
      const items = byUsername[username.toLowerCase()] || [];

      if (!items.length) {
        await base44.asServiceRole.entities.Profile.update(profileId, {
          scrape_status: "error",
          error_message: "No data returned from Apify"
        });
        continue;
      }

      const first = items[0];
      const author = first.authorMeta || first.author || {};
      const profileData = {
        full_name: author.name || author.nickName || "",
        bio: author.signature || author.bio || "",
        followers: author.fans || author.followers || 0,
        following: author.following || 0,
        posts_count: items.length,
        profile_pic_url: author.avatar || author.avatarThumb || "",
        is_verified: author.verified || false,
        category: ""
      };

      const posts = items.map(v => {
        const views = v.playCount || v.videoMeta?.playCount || 0;
        const likes = v.diggCount || v.likesCount || 0;
        const comments = v.commentCount || v.comments || 0;
        const shares = v.shareCount || v.shares || 0;
        const followers = profileData.followers || 1;
        const engRate = ((likes + comments + shares) / followers) * 100;
        return {
          profile_id: profileId,
          platform: "tiktok",
          post_id: v.id || v.videoId || "",
          url: v.webVideoUrl || `https://tiktok.com/@${username}/video/${v.id}`,
          type: "video",
          caption: v.text || v.desc || "",
          thumbnail_url: v.covers?.[0] || v.videoMeta?.coverUrl || "",
          video_url: v.videoUrl || "",
          views, likes, comments, shares,
          saves: v.collectCount || 0,
          engagement_rate: Math.round(engRate * 100) / 100,
          published_at: v.createTime ? new Date(v.createTime * 1000).toISOString() : new Date().toISOString(),
          duration_seconds: v.videoMeta?.duration || v.duration || 0,
          hashtags: (v.challenges || []).map(c => c.title || c.name).filter(Boolean),
          ai_analysis_done: false
        };
      });

      // Virality scores — estándar duro contra benchmarks reales de TikTok viral
      const followers = profileData.followers || 1;
      for (const post of posts) {
        const views = post.views || 0;
        const likes = post.likes || 0;
        const comments = post.comments || 0;
        const shares = post.shares || 0;
        const saves = post.saves || 0;

        // ── 1. Vistas absolutas (50%) — escala logarítmica real ──
        // <10K ≈ 0, 100K = notable, 500K = bueno, 1M = viral, 5M+ = mega
        const absRaw = views <= 0 ? 0 : Math.log10(views) / Math.log10(5_000_000);
        const absScore = Math.min(100, absRaw * 100) * 0.50;

        // ── 2. Ratio vistas/seguidores (30%) — penaliza cuentas micro sin tracción real ──
        const followerPenalty = followers < 1000 ? (followers / 1000) : 1;
        const vfRatio = (views / Math.max(followers, 500)) * followerPenalty;
        const ratioRaw = views < 1000 ? 0 : Math.min(100, (vfRatio / 50) * 100);
        const ratioScore = ratioRaw * 0.30;

        // ── 3. Engagement de calidad (20%) — shares+saves pesan más ──
        const likeRate = views > 0 ? likes / views : 0;
        const saveShareRate = views > 0 ? (saves + shares * 2) / views : 0;
        const commentRate = views > 0 ? comments / views : 0;
        const engQuality = (Math.min(1, likeRate / 0.05) * 0.4)
                         + (Math.min(1, saveShareRate / 0.02) * 0.4)
                         + (Math.min(1, commentRate / 0.01) * 0.2);
        const engScore = Math.min(100, engQuality * 100) * 0.20;

        post.virality_score = Math.round(absScore + ratioScore + engScore);
      }

      const videosPosts = posts.filter(p => p.views > 0);
      profileData.avg_views = videosPosts.length
        ? Math.round(videosPosts.reduce((a, p) => a + p.views, 0) / videosPosts.length)
        : 0;
      profileData.avg_likes = Math.round(posts.reduce((a, p) => a + p.likes, 0) / posts.length);
      profileData.avg_engagement_rate = Math.round(posts.reduce((a, p) => a + p.engagement_rate, 0) / posts.length * 100) / 100;

      if (posts.length > 0) {
        // Marcar videos top (50K+ vistas) para re-scrapeo frecuente
        for (const p of posts) p.is_top = (p.views || 0) >= 50000;

        // Reemplazo total para evitar duplicados en re-scrapeos
        await base44.asServiceRole.entities.Post.deleteMany({ profile_id: profileId });
        await base44.asServiceRole.entities.Post.bulkCreate(posts);
      }

      await base44.asServiceRole.entities.Profile.update(profileId, {
        ...profileData,
        scrape_status: "done",
        last_scraped: new Date().toISOString()
      });

      totalPosts += posts.length;
    }

    return Response.json({
      success: true,
      profilesProcessed: cleanUsernames.length,
      totalPosts
    });

  } catch (err) {
    // Mark all as error
    for (const username of cleanUsernames) {
      const profileId = profileMap[username];
      await base44.asServiceRole.entities.Profile.update(profileId, {
        scrape_status: "error",
        error_message: err.message
      });
    }
    return Response.json({ error: err.message }, { status: 500 });
  }
});