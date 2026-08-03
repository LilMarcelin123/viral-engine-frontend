import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { postId } = await req.json();

  const posts = await base44.asServiceRole.entities.Post.filter({ id: postId });
  if (!posts.length) return Response.json({ error: "Post not found" }, { status: 404 });

  const post = posts[0];

  // Calcular métricas derivadas para contexto
  const likeRate = post.views > 0 ? ((post.likes / post.views) * 100).toFixed(2) : 0;
  const commentRate = post.views > 0 ? ((post.comments / post.views) * 100).toFixed(2) : 0;
  const shareRate = post.views > 0 ? (((post.shares || 0) / post.views) * 100).toFixed(2) : 0;
  const saveRate = post.views > 0 ? (((post.saves || 0) / post.views) * 100).toFixed(2) : 0;
  // Virality score context-aware (same formula as scraper)
  const engScore = parseFloat(likeRate) * 0.3 + parseFloat(commentRate) * 0.2 + parseFloat(shareRate) * 0.25 + parseFloat(saveRate) * 0.25;
  const performance = post.virality_score >= 60 ? "VIRAL"
    : post.virality_score >= 35 ? "BUENO"
    : post.virality_score >= 15 ? "MEDIO" : "BAJO";

  const prompt = `Eres un estratega de contenido viral EXTREMADAMENTE CRÍTICO y objetivo. Tu trabajo es dar feedback duro, honesto y accionable comparando contra el estándar real de videos virales en TikTok a nivel global.

NO seas complaciente. Si el video es mediocre, dilo. Si tiene 200 views, no lo llames "bueno" solo porque el engagement % es alto — eso no es viralidad real.

═══ BENCHMARKS REALES DE TIKTOK VIRAL (úsalos como referencia dura) ═══
- Video mediocre: <10K views
- Video decente: 10K–100K views  
- Video bueno: 100K–500K views
- Video viral: 500K–2M views
- Video mega-viral: >2M views
- Like rate saludable: >3% (promedio TikTok es 2-4%)
- Save rate viral: >1% (señal fuerte de valor)
- Share rate viral: >0.5% (máxima señal de viralidad)
- Comment rate saludable: >0.3%

═══ DATOS DEL CONTENIDO ═══
CAPTION: ${post.caption || "(sin caption)"}
TIPO: ${post.type}
PLATAFORMA: ${post.platform}
DURACIÓN: ${post.duration_seconds || 0} segundos
HASHTAGS: ${(post.hashtags || []).join(", ") || "ninguno"}

═══ MÉTRICAS REALES DEL VIDEO ═══
Views: ${post.views?.toLocaleString() || 0}
Likes: ${post.likes?.toLocaleString() || 0} (${likeRate}% like rate)
Comentarios: ${post.comments?.toLocaleString() || 0} (${commentRate}% comment rate)
Shares: ${(post.shares || 0).toLocaleString()} (${shareRate}% share rate)
Saves: ${(post.saves || 0).toLocaleString()} (${saveRate}% save rate)
Clasificación interna: ${performance}

═══ INSTRUCCIONES DE ANÁLISIS ═══
1. Sé BRUTAL y HONESTO. Compara contra los benchmarks de arriba, no contra la propia cuenta.
2. Si tiene <10K views, es un video de bajo alcance sin importar el engagement. Dilo claro.
3. El engagement alto en pocos views puede ser comunidad cerrada o bots — indícalo si aplica.
4. La "mejora sugerida" debe ser ESPECÍFICA y basada en qué hacen los videos virales reales del nicho musical en TikTok. Menciona formatos, hooks o tendencias reales que funcionan HOY.
5. worked = true SOLO si tiene >50K views O si tiene >500K views independientemente de engagement.

Devuelve JSON con esta estructura EXACTA:
{
  "hook_text": "el hook exacto (primeros 3-5 segundos o primera línea del caption)",
  "hook_type": "question|shock|curiosity|story|how_to|list|challenge|other",
  "hook_analysis": "análisis crítico de 2-3 oraciones: ¿funcionó el hook para retener? compara con hooks virales reales del nicho",
  "hook_strength": "strong|medium|weak",
  "topic": "tema principal en 3-5 palabras",
  "topic_category": "nicho/categoría del contenido",
  "retention_formula": "fórmula de retención en 1 oración (ej: Problema → Tensión → Giro → CTA)",
  "worked": false,
  "performance_verdict": "1 oración directa y dura: '✅ Funcionó porque...' o '❌ No funcionó porque...' — menciona los views absolutos",
  "why_it_worked": ["razón 1 concreta y específica con dato", "razón 2", "razón 3"],
  "why_it_failed": ["razón 1 específica comparando con benchmark real", "razón 2", "razón 3"],
  "content_structure": {
    "opening": "cómo abre el contenido y si es suficientemente fuerte para parar el scroll",
    "middle": "cómo mantiene (o pierde) la atención en los primeros 3 segundos críticos",
    "cta": "llamado a la acción o cierre, y si genera shares/saves",
    "emotional_triggers": ["disparadores emocionales usados o ausentes"],
    "virality_elements": ["elementos virales presentes o ausentes vs videos del nicho que tienen millones de views"],
    "weak_points": ["puntos débiles ESPECÍFICOS que explican el bajo alcance"],
    "replication_template": "plantilla de 3-5 pasos para crear un video similar pero optimizado para >100K views",
    "improvement_suggestion": "qué cambiaría específicamente — menciona un formato o tendencia real de TikTok musical que está funcionando ahora y cómo aplicarlo a este contenido"
  }
}`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    model: "claude_sonnet_4_6",
    response_json_schema: {
      type: "object",
      properties: {
        hook_text: { type: "string" },
        hook_type: { type: "string" },
        hook_analysis: { type: "string" },
        hook_strength: { type: "string" },
        topic: { type: "string" },
        topic_category: { type: "string" },
        retention_formula: { type: "string" },
        worked: { type: "boolean" },
        performance_verdict: { type: "string" },
        why_it_worked: { type: "array", items: { type: "string" } },
        why_it_failed: { type: "array", items: { type: "string" } },
        content_structure: { type: "object" }
      }
    }
  });

  // Guardar en content_structure también los campos nuevos de diagnóstico
  const enrichedStructure = {
    ...(result.content_structure || {}),
    hook_analysis: result.hook_analysis || "",
    hook_strength: result.hook_strength || "medium",
    worked: result.worked ?? true,
    performance_verdict: result.performance_verdict || "",
    why_it_worked: result.why_it_worked || [],
    why_it_failed: result.why_it_failed || [],
  };

  await base44.asServiceRole.entities.Post.update(postId, {
    hook_text: result.hook_text || "",
    hook_type: result.hook_type || "other",
    topic: result.topic || "",
    topic_category: result.topic_category || "",
    retention_formula: result.retention_formula || "",
    content_structure: JSON.stringify(enrichedStructure),
    ai_analysis_done: true
  });

  return Response.json({ success: true, analysis: result });
});