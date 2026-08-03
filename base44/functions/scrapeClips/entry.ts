import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

async function runApify(actorId, input) {
  const APIFY_API_KEY = Deno.env.get('APIFY_API_KEY');
  const safeId = actorId.replace('/', '~');
  const runRes = await fetch(`https://api.apify.com/v2/acts/${safeId}/runs?token=${APIFY_API_KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
  });
  if (!runRes.ok) throw new Error(`Apify start failed: ${await runRes.text()}`);
  const run = (await runRes.json()).data;
  const start = Date.now();
  while (Date.now() - start < 180000) {
    const res = await fetch(`https://api.apify.com/v2/actor-runs/${run.id}?token=${APIFY_API_KEY}`);
    const status = (await res.json()).data?.status;
    if (status === 'SUCCEEDED') break;
    if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(status)) throw new Error(`Apify run ${status}`);
    await new Promise(r => setTimeout(r, 5000));
  }
  const dsRes = await fetch(`https://api.apify.com/v2/datasets/${run.defaultDatasetId}/items?token=${APIFY_API_KEY}&limit=1000`);
  return await dsRes.json();
}

function extractId(url) {
  const m = (url || '').match(/\/(video|reel|p)\/([A-Za-z0-9_-]+)/);
  return m ? m[2] : url;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    // Permitido: admin manual o ejecución por automatización programada (sin usuario)
    if (user && user.user_type !== 'admin') {
      return Response.json({ error: 'Solo admin' }, { status: 403 });
    }
    const b44 = base44.asServiceRole;

    const campaigns = await b44.entities.Campaign.filter({ status: 'active' });
    if (!campaigns.length) return Response.json({ success: true, updated: 0, message: 'Sin campañas activas' });

    const now = Date.now();
    let allClips = [];
    for (const c of campaigns) {
      const clips = await b44.entities.Clip.filter({ campaign_id: c.id });
      allClips = allClips.concat(clips.filter(cl => !cl.frozen));
    }

    // Congelar clips que pasaron los 14 días (última actualización abajo, luego frozen)
    const tiktokUrls = [];
    const igUrls = [];
    for (const clip of allClips) {
      for (const pub of (clip.publications || [])) {
        if (!pub.url) continue;
        if ((pub.platform || '').toLowerCase() === 'tiktok' || pub.url.includes('tiktok.com')) tiktokUrls.push(pub.url);
        else if ((pub.platform || '').toLowerCase() === 'instagram' || pub.url.includes('instagram.com')) igUrls.push(pub.url);
      }
    }

    const viewsByKey = {};
    if (tiktokUrls.length > 0) {
      const items = await runApify('clockworks/tiktok-scraper', { postURLs: tiktokUrls.slice(0, 500) }).catch(() => []);
      for (const it of items) {
        const url = it.webVideoUrl || it.url || '';
        viewsByKey[extractId(url)] = it.playCount || it.videoMeta?.playCount || 0;
      }
    }
    if (igUrls.length > 0) {
      const items = await runApify('apify/instagram-post-scraper', { directUrls: igUrls.slice(0, 500), resultsType: 'posts' }).catch(() => []);
      for (const it of items) {
        const url = it.url || '';
        viewsByKey[extractId(url)] = it.videoViewCount || it.videoPlayCount || 0;
      }
    }

    let updated = 0;
    const campaignViews = {};
    for (const clip of allClips) {
      const pubs = (clip.publications || []).map(pub => {
        const scraped = viewsByKey[extractId(pub.url)];
        return { ...pub, views: scraped !== undefined && scraped > 0 ? scraped : (pub.views || 0) };
      });
      const totalViews = pubs.reduce((a, p) => a + (p.views || 0), 0);
      const shouldFreeze = clip.frozen_at ? now >= new Date(clip.frozen_at).getTime()
        : clip.published_at ? now >= new Date(clip.published_at).getTime() + 14 * 86400000 : false;
      await b44.entities.Clip.update(clip.id, { publications: pubs, total_views: totalViews, frozen: shouldFreeze });
      updated++;
      if (clip.qa_status === 'aprobado' && !clip.is_strike) {
        campaignViews[clip.campaign_id] = (campaignViews[clip.campaign_id] || 0) + totalViews;
      }
    }

    // Refrescar métricas por campaña (incluye clips ya congelados)
    for (const c of campaigns) {
      const clips = await b44.entities.Clip.filter({ campaign_id: c.id, qa_status: 'aprobado' });
      const valid = clips.filter(cl => !cl.is_strike);
      await b44.entities.Campaign.update(c.id, {
        total_views: valid.reduce((a, cl) => a + (cl.total_views || 0), 0),
        approved_clips_count: valid.length,
      });
    }

    return Response.json({ success: true, updated, tiktok: tiktokUrls.length, instagram: igUrls.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});