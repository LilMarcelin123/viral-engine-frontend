import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Devuelve al cliente SOLO datos sanitizados de sus campañas (sin presupuesto ni bolsas internas).
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const b44 = base44.asServiceRole;
    const campaigns = await b44.entities.Campaign.filter({ client_id: user.id });

    const safeCampaigns = campaigns.map(c => ({
      id: c.id, name: c.name, artist_name: c.artist_name, title: c.title,
      status: c.status, cover_url: c.cover_url,
      start_date: c.start_date, end_date: c.end_date,
      total_views: c.total_views || 0, approved_clips_count: c.approved_clips_count || 0,
      num_videos: c.num_videos || 0, target_platforms: c.target_platforms || [],
    }));

    if (!campaigns.length) return Response.json({ campaigns: [], videos: [] });

    const ids = campaigns.map(c => c.id);
    const nameById = {};
    for (const c of campaigns) nameById[c.id] = c.name;

    // El cliente SOLO ve clips aprobados: nada de pendientes/rechazados ni estatus de QA
    const allClips = await b44.entities.Clip.filter({ campaign_id: { $in: ids } }, '-created_date', 500);
    const clips = allClips.filter(v => v.qa_status === 'aprobado' && !v.is_strike);

    return Response.json({
      campaigns: safeCampaigns,
      videos: clips.map(v => ({
        id: v.id,
        campaign_id: v.campaign_id,
        campaign_name: nameById[v.campaign_id] || '',
        views: v.total_views || 0,
        tiktok_url: (v.publications || [])[0]?.url || '',
        created_date: v.created_date,
      })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});