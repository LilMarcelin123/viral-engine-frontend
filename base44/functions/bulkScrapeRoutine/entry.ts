import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const APIFY_API_KEY = Deno.env.get("APIFY_API_KEY");

async function runApifyActor(actorId, input, maxItems = 100) {
  const safeActorId = actorId.replace("/", "~");
  const runRes = await fetch(`https://api.apify.com/v2/acts/${safeActorId}/runs?token=${APIFY_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, maxItems })
  });
  if (!runRes.ok) {
    const err = await runRes.text();
    throw new Error(`Apify actor start failed: ${err}`);
  }
  const runData = await runRes.json();
  return runData.data;
}

async function waitForApifyRun(runId, timeoutMs = 120000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const res = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_API_KEY}`);
    const data = await res.json();
    const status = data.data?.status;
    if (status === "SUCCEEDED") return data.data;
    if (status === "FAILED" || status === "ABORTED" || status === "TIMED-OUT") throw new Error(`Run ${status}`);
    await new Promise(r => setTimeout(r, 4000));
  }
  throw new Error("Timeout waiting for Apify run");
}

async function getApifyDataset(datasetId) {
  const res = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_API_KEY}&limit=500`);
  if (!res.ok) throw new Error("Failed to fetch dataset");
  return await res.json();
}

// Filtro de hashtags: si el perfil tiene hashtag_filter, solo se guardan posts
// cuyos hashtags o caption contengan alguno de los términos configurados.
function matchesHashtagFilter(post, filters) {
  if (!filters || filters.length === 0) return true;
  const tags = (post.hashtags || []).map(t => String(t).toLowerCase());
  const caption = (post.caption || "").toLowerCase();
  return filters.some(f => {
    const term = String(f).replace("#", "").trim().toLowerCase();
    if (!term) return false;
    return tags.some(t => t.includes(term)) || caption.includes(`#${term}`) || caption.includes(term);
  });
}

async function scrapeOne(base44, profile) {
  const profileId = profile.id;
  // Límite por perfil (opcional; sin configurar = sin límite práctico) + filtro de hashtags
  const limit = Math.max(1, Math.min(200, profile.scrape_limit || 200));
  const hashtagFilters = profile.hashtag_filter || [];
  await base44.asServiceRole.entities.Profile.update(profileId, { scrape_status: "scraping" });

  let profileData = {};
  let posts = [];

  if (profile.platform === "tiktok") {
    const ttRun = await runApifyActor("clockworks/tiktok-profile-scraper", {
      profiles: [`https://www.tiktok.com/@${profile.username}`],
      resultsPerPage: limit
    }, limit);
    await waitForApifyRun(ttRun.id);
    const ttResult = await getApifyDataset(ttRun.defaultDatasetId);

    if (ttResult.length > 0) {
      const first = ttResult[0];
      const author = first.authorMeta || first.author || {};
      profileData = {
        full_name: author.name || author.nickName || "",
        bio: author.signature || author.bio || "",
        followers: author.fans || author.followers || 0,
        following: author.following || 0,
        posts_count: ttResult.length,
        profile_pic_url: author.avatar || author.avatarThumb || "",
        is_verified: author.verified || false,
        category: ""
      };

      for (const v of ttResult) {
        const views = v.playCount || v.videoMeta?.playCount || 0;
        const likes = v.diggCount || v.likesCount || 0;
        const comments = v.commentCount || v.comments || 0;
        const shares = v.shareCount || v.shares || 0;
        const followers = profileData.followers || 1;
        const engRate = ((likes + comments + shares) / followers) * 100;
        posts.push({
          profile_id: profileId, platform: "tiktok",
          post_id: v.id || v.videoId || "",
          url: v.webVideoUrl || `https://tiktok.com/@${profile.username}/video/${v.id}`,
          type: "video", caption: v.text || v.desc || "",
          thumbnail_url: v.covers?.[0] || v.videoMeta?.coverUrl || "",
          video_url: v.videoUrl || "", views, likes, comments, shares,
          saves: v.collectCount || 0,
          engagement_rate: Math.round(engRate * 100) / 100,
          published_at: v.createTime ? new Date(v.createTime * 1000).toISOString() : new Date().toISOString(),
          duration_seconds: v.videoMeta?.duration || v.duration || 0,
          hashtags: (v.challenges || []).map(c => c.title || c.name).filter(Boolean),
          ai_analysis_done: false
        });
      }
    }

  } else if (profile.platform === "instagram") {
    const profileRun = await runApifyActor("apify/instagram-profile-scraper", { usernames: [profile.username] }, 1);
    await waitForApifyRun(profileRun.id);
    const profileResult = await getApifyDataset(profileRun.defaultDatasetId);
    if (profileResult.length > 0) {
      const p = profileResult[0];
      profileData = {
        full_name: p.fullName || "", bio: p.biography || "",
        followers: p.followersCount || 0, following: p.followsCount || 0,
        posts_count: p.postsCount || 0, profile_pic_url: p.profilePicUrl || "",
        is_verified: p.verified || false, category: p.businessCategoryName || ""
      };
    }

    const postsRun = await runApifyActor("apify/instagram-post-scraper", { username: profile.username, resultsLimit: limit }, limit);
    await waitForApifyRun(postsRun.id);
    const postsResult = await getApifyDataset(postsRun.defaultDatasetId);
    for (const p of postsResult) {
      const views = p.videoViewCount || 0, likes = p.likesCount || 0, comments = p.commentsCount || 0;
      const engRate = ((likes + comments) / (profileData.followers || 1)) * 100;
      posts.push({
        profile_id: profileId, platform: "instagram",
        post_id: p.id || p.shortCode || "",
        url: p.url || `https://instagram.com/p/${p.shortCode}`,
        type: p.type === "Video" ? "video" : "image",
        caption: p.caption || "", thumbnail_url: p.displayUrl || "",
        video_url: p.videoUrl || "", views, likes, comments,
        shares: p.sharesCount || 0, saves: p.savesCount || 0,
        engagement_rate: Math.round(engRate * 100) / 100,
        published_at: p.timestamp || new Date().toISOString(),
        duration_seconds: p.videoDuration || 0,
        hashtags: p.hashtags || [], ai_analysis_done: false
      });
    }
  }

  // Aplicar filtro de hashtags configurado en el perfil
  posts = posts.filter(p => matchesHashtagFilter(p, hashtagFilters));

  // Virality scores
  const followers = profileData.followers || 1;
  for (const post of posts) {
    const { views = 0, likes = 0, comments = 0, shares = 0, saves = 0 } = post;
    const absRaw = views <= 0 ? 0 : Math.log10(views) / Math.log10(5_000_000);
    const absScore = Math.min(100, absRaw * 100) * 0.50;
    const followerPenalty = followers < 1000 ? (followers / 1000) : 1;
    const vfRatio = (views / Math.max(followers, 500)) * followerPenalty;
    const ratioRaw = views < 1000 ? 0 : Math.min(100, (vfRatio / 50) * 100);
    const ratioScore = ratioRaw * 0.30;
    const likeRate = views > 0 ? likes / views : 0;
    const saveShareRate = views > 0 ? (saves + shares * 2) / views : 0;
    const commentRate = views > 0 ? comments / views : 0;
    const engQuality = (Math.min(1, likeRate / 0.05) * 0.4) + (Math.min(1, saveShareRate / 0.02) * 0.4) + (Math.min(1, commentRate / 0.01) * 0.2);
    post.virality_score = Math.round(absScore + ratioScore + Math.min(100, engQuality * 100) * 0.20);
  }

  if (posts.length > 0) {
    const videosPosts = posts.filter(p => p.views > 0);
    profileData.avg_views = videosPosts.length ? Math.round(videosPosts.reduce((a, p) => a + p.views, 0) / videosPosts.length) : 0;
    profileData.avg_likes = Math.round(posts.reduce((a, p) => a + p.likes, 0) / posts.length);
    profileData.avg_engagement_rate = Math.round(posts.reduce((a, p) => a + p.engagement_rate, 0) / posts.length * 100) / 100;
    // Marcar videos top (50K+ vistas) para re-scrapeo frecuente
    for (const p of posts) p.is_top = (p.views || 0) >= 50000;

    // Reemplazo total para evitar duplicados en cada corrida diaria
    await base44.asServiceRole.entities.Post.deleteMany({ profile_id: profileId });
    await base44.asServiceRole.entities.Post.bulkCreate(posts);
  }

  await base44.asServiceRole.entities.Profile.update(profileId, {
    ...profileData, scrape_status: "done", last_scraped: new Date().toISOString(), error_message: ""
  });

  return { profileId, postsCount: posts.length };
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // Auth: require either an authenticated admin user (manual) or a valid cron secret (scheduled).
  const cronSecret = req.headers.get("X-Cron-Secret");
  const user = await base44.auth.me().catch(() => null);

  if (cronSecret) {
    if (cronSecret !== Deno.env.get("CRON_SECRET")) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }
  } else {
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const isAdmin = user.role === "admin" || user.user_type === "admin";
    if (!isAdmin) return Response.json({ error: "Forbidden — solo administradores" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  // profileIds puede venir desde la UI (manual) o se toma de daily_scrape=true (automation)
  let profileIds = body.profileIds || [];

  if (profileIds.length === 0) {
    // Modo rutina: tomar todos los perfiles marcados para scrape diario
    const allProfiles = await base44.asServiceRole.entities.Profile.list("-created_date", 100);
    const routineProfiles = allProfiles.filter(p => p.daily_scrape === true);
    profileIds = routineProfiles.map(p => p.id);
  }

  if (profileIds.length === 0) {
    return Response.json({ success: true, message: "No hay perfiles en la rutina diaria", scraped: 0 });
  }

  const allProfiles = await base44.asServiceRole.entities.Profile.list("-created_date", 100);
  const profilesToScrape = allProfiles.filter(p => profileIds.includes(p.id));

  const results = [];
  for (const profile of profilesToScrape) {
    try {
      const result = await scrapeOne(base44, profile);
      results.push({ ...result, success: true });
    } catch (err) {
      await base44.asServiceRole.entities.Profile.update(profile.id, {
        scrape_status: "error",
        error_message: err.message
      });
      results.push({ profileId: profile.id, success: false, error: err.message });
    }
  }

  return Response.json({
    success: true,
    scraped: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results
  });
});