import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const APIFY_API_KEY = Deno.env.get("APIFY_API_KEY");

// fetch con reintentos automáticos ante rate limit (429) de Apify
async function apifyFetch(url, options = {}, retries = 5) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, options);
    if (res.status !== 429) return res;
    await res.text().catch(() => "");
    await new Promise(r => setTimeout(r, 3000 * (attempt + 1)));
  }
  throw new Error("Apify rate limit: demasiadas peticiones seguidas, intenta de nuevo en unos minutos");
}

async function runApifyActor(actorId, input, maxItems) {
  const safeActorId = actorId.replace("/", "~");
  const runRes = await apifyFetch(`https://api.apify.com/v2/acts/${safeActorId}/runs?token=${APIFY_API_KEY}`, {
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
    const res = await apifyFetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_API_KEY}`);
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

async function getApifyDataset(datasetId, limit = 500) {
  const res = await apifyFetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_API_KEY}&limit=${limit}`);
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

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(() => null);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { profileId } = await req.json().catch(() => ({}));
  if (!profileId) return Response.json({ error: "profileId es requerido" }, { status: 400 });

  const profiles = await base44.asServiceRole.entities.Profile.filter({ id: profileId }).catch(() => []);
  if (!profiles.length) return Response.json({ error: "Profile not found" }, { status: 404 });

  const profile = profiles[0];

  // Solo admins o el creador del perfil pueden gastar créditos de Apify
  const isAdmin = user.role === "admin" || user.user_type === "admin";
  if (!isAdmin && profile.created_by_id !== user.id) {
    return Response.json({ error: "No autorizado para scrapear este perfil" }, { status: 403 });
  }

  // Traer TODOS los videos de la cuenta para que likes/vistas registrados coincidan con los reales
  const limit = Math.max(1000, (profile.posts_count || 0) + 50);
  const hashtagFilters = profile.hashtag_filter || [];

  await base44.asServiceRole.entities.Profile.update(profileId, { scrape_status: "scraping" });

  try {
    let profileData = {};
    let posts = [];

    if (profile.platform === "instagram") {
      const profileRun = await runApifyActor("apify/instagram-profile-scraper", {
        usernames: [profile.username],
        resultsType: "details"
      }, 1);
      await waitForApifyRun(profileRun.id);
      const profileResult = await getApifyDataset(profileRun.defaultDatasetId, 5);

      if (profileResult.length > 0) {
        const p = profileResult[0];
        profileData = {
          full_name: p.fullName || p.full_name || "",
          bio: p.biography || p.bio || "",
          followers: p.followersCount || p.followers_count || 0,
          following: p.followsCount || p.follows_count || 0,
          posts_count: p.postsCount || p.posts_count || 0,
          profile_pic_url: p.profilePicUrl || p.profile_pic_url || "",
          is_verified: p.verified || false,
          category: p.businessCategoryName || ""
        };
      }

      const postsRun = await runApifyActor("apify/instagram-post-scraper", {
        directUrls: [`https://www.instagram.com/${profile.username}/`],
        resultsType: "posts",
        resultsLimit: limit
      }, limit);
      await waitForApifyRun(postsRun.id);
      const postsResult = await getApifyDataset(postsRun.defaultDatasetId, limit);

      for (const p of postsResult) {
        const views = p.videoViewCount || p.video_view_count || p.playCount || 0;
        const likes = p.likesCount || p.likes_count || 0;
        const comments = p.commentsCount || p.comments_count || 0;
        const followers = profileData.followers || 1;
        const engRate = ((likes + comments) / followers) * 100;

        posts.push({
          profile_id: profileId,
          platform: "instagram",
          post_id: p.id || p.shortCode || "",
          url: p.url || `https://instagram.com/p/${p.shortCode}`,
          type: p.type === "Video" ? "video" : p.type === "Sidecar" ? "carousel" : "image",
          caption: p.caption || "",
          thumbnail_url: p.displayUrl || p.thumbnail || "",
          video_url: p.videoUrl || "",
          views, likes, comments,
          shares: p.sharesCount || 0,
          saves: p.savesCount || 0,
          engagement_rate: Math.round(engRate * 100) / 100,
          published_at: p.timestamp || p.takenAt || new Date().toISOString(),
          duration_seconds: p.videoDuration || 0,
          hashtags: p.hashtags || [],
          ai_analysis_done: false
        });
      }

    } else if (profile.platform === "tiktok") {
      const ttRun = await runApifyActor("clockworks/tiktok-profile-scraper", {
        profiles: [`https://www.tiktok.com/@${profile.username}`],
        resultsPerPage: limit
      }, limit);
      await waitForApifyRun(ttRun.id);
      const ttResult = await getApifyDataset(ttRun.defaultDatasetId, limit);

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
            profile_id: profileId,
            platform: "tiktok",
            post_id: v.id || v.videoId || "",
            url: v.webVideoUrl || `https://tiktok.com/@${profile.username}/video/${v.id}`,
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
          });
        }
      }

    } else if (profile.platform === "facebook") {
      const fbRun = await runApifyActor("apify/facebook-pages-scraper", {
        startUrls: [{ url: `https://www.facebook.com/${profile.username}` }],
        maxPosts: Math.min(limit, 50),
        scrapeAbout: true
      }, limit);
      await waitForApifyRun(fbRun.id);
      const fbResult = await getApifyDataset(fbRun.defaultDatasetId, limit);

      if (fbResult.length > 0) {
        const page = fbResult[0];
        profileData = {
          full_name: page.title || page.name || "",
          bio: page.description || page.about || "",
          followers: page.likes || page.followers || 0,
          profile_pic_url: page.profilePic || "",
          is_verified: page.verified || false,
          category: page.categories?.[0] || ""
        };

        for (const post of (page.posts || [])) {
          const likes = post.likes || 0;
          const comments = post.comments || 0;
          const shares = post.shares || 0;
          const views = post.videoViews || 0;
          const followers = profileData.followers || 1;
          const engRate = ((likes + comments + shares) / followers) * 100;

          posts.push({
            profile_id: profileId,
            platform: "facebook",
            post_id: post.postId || post.url || "",
            url: post.url || "",
            type: post.media?.includes("video") ? "video" : "image",
            caption: post.text || "",
            thumbnail_url: post.media?.[0] || "",
            views, likes, comments, shares,
            engagement_rate: Math.round(engRate * 100) / 100,
            published_at: post.time || new Date().toISOString(),
            hashtags: (post.text?.match(/#\w+/g) || []),
            ai_analysis_done: false
          });
        }
      }
    }

    // Aplicar filtro de hashtags configurado en el perfil (post-fetch)
    const totalFetched = posts.length;
    posts = posts.filter(p => matchesHashtagFilter(p, hashtagFilters));

    // Calculate virality scores — estándar duro contra benchmarks reales de TikTok viral
    if (posts.length > 0) {
      const MIN_VIEWS = 10_000;
      for (const post of posts) {
        const views = post.views || 0;
        if (views < MIN_VIEWS) {
          post.virality_score = 0;
          continue;
        }
        const t = (Math.log10(views) - Math.log10(MIN_VIEWS)) / (Math.log10(5_000_000) - Math.log10(MIN_VIEWS));
        post.virality_score = Math.max(1, Math.min(100, Math.round(t * 100)));
      }

      const videosPosts = posts.filter(p => p.views > 0);
      profileData.avg_views = videosPosts.length
        ? Math.round(videosPosts.reduce((a, p) => a + p.views, 0) / videosPosts.length)
        : 0;
      profileData.avg_likes = Math.round(posts.reduce((a, p) => a + p.likes, 0) / posts.length);
      profileData.avg_engagement_rate = Math.round(posts.reduce((a, p) => a + p.engagement_rate, 0) / posts.length * 100) / 100;
    }

    // Marcar videos top (50K+ vistas) para re-scrapeo frecuente
    for (const p of posts) p.is_top = (p.views || 0) >= 50000;

    // Reemplazo total: borramos los posts anteriores del perfil e insertamos los nuevos
    if (posts.length > 0) {
      await base44.asServiceRole.entities.Post.deleteMany({ profile_id: profileId });
      await base44.asServiceRole.entities.Post.bulkCreate(posts);
    }

    await base44.asServiceRole.entities.Profile.update(profileId, {
      ...profileData,
      scrape_status: "done",
      last_scraped: new Date().toISOString(),
      error_message: ""
    });

    return Response.json({
      success: true,
      postsCount: posts.length,
      totalFetched,
      filteredOut: totalFetched - posts.length
    });
  } catch (err) {
    await base44.asServiceRole.entities.Profile.update(profileId, {
      scrape_status: "error",
      error_message: err.message
    });
    return Response.json({ error: err.message }, { status: 500 });
  }
});