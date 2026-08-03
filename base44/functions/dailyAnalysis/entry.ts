import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ALLOWED_SCRAPERS = ["ramon", "avanzza", "marcel"];

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // Permission check: only Ramon, Avanzza, or Marcel can trigger manually.
  // Scheduled automations (no user context) are allowed.
  const user = await base44.auth.me().catch(() => null);
  if (user) {
    const name = (user.full_name || "").toLowerCase();
    const email = (user.email || "").toLowerCase();
    const isAllowed = ALLOWED_SCRAPERS.some(s => name.includes(s) || email.includes(s));
    if (!isAllowed) {
      return Response.json({ error: "No autorizado. Solo Ramon, Avanzza o Marcel pueden ejecutar análisis." }, { status: 403 });
    }
  }

  // Obtener todos los posts sin analizar, ordenados por virality_score desc
  const allPosts = await base44.asServiceRole.entities.Post.list('-virality_score', 200);
  const pending = allPosts.filter(p => !p.ai_analysis_done);

  if (pending.length === 0) {
    return Response.json({ success: true, message: "No hay posts pendientes de analizar", analyzed: 0 });
  }

  // Analizar hasta 30 posts por ejecución para no exceder límites
  const toAnalyze = pending.slice(0, 30);
  let analyzed = 0;

  for (const post of toAnalyze) {
    const likeRate = post.views > 0 ? ((post.likes / post.views) * 100).toFixed(2) : 0;
    const commentRate = post.views > 0 ? ((post.comments / post.views) * 100).toFixed(2) : 0;
    const shareRate = post.views > 0 ? (((post.shares || 0) / post.views) * 100).toFixed(2) : 0;
    const saveRate = post.views > 0 ? (((post.saves || 0) / post.views) * 100).toFixed(2) : 0;
    const engScore = parseFloat(likeRate) * 0.3 + parseFloat(commentRate) * 0.2 + parseFloat(shareRate) * 0.25 + parseFloat(saveRate) * 0.25;
    const performance = engScore >= 5 ? "VIRAL" : engScore >= 2 ? "BUENO" : engScore >= 0.8 ? "MEDIO" : "BAJO";

    const prompt = `Eres un estratega senior de contenido viral especializado en música, entretenimiento y creadores digitales.

Analiza en PROFUNDIDAD este video/post. Explica CON CLARIDAD por qué funcionó o por qué no funcionó.

═══ DATOS DEL CONTENIDO ═══
CAPTION: ${post.caption || "(sin caption)"}
TIPO: ${post.type}
PLATAFORMA: ${post.platform}
DURACIÓN: ${post.duration_seconds || 0} segundos
HASHTAGS: ${(post.hashtags || []).join(", ") || "ninguno"}

═══ MÉTRICAS DE RENDIMIENTO ═══
Views: ${post.views?.toLocaleString() || 0}
Likes: ${post.likes?.toLocaleString() || 0} (${likeRate}% like rate)
Comentarios: ${post.comments?.toLocaleString() || 0} (${commentRate}% comment rate)
Shares: ${(post.shares || 0).toLocaleString()} (${shareRate}% share rate)
Saves: ${(post.saves || 0).toLocaleString()} (${saveRate}% save rate)
Clasificación: ${performance}

Un video FUNCIONÓ si tiene: like rate >3%, share rate >0.5%, save rate >0.5%, o clasificación VIRAL/BUENO.

Devuelve JSON con esta estructura EXACTA:
{
  "hook_text": "hook de los primeros 3-5 segundos o primera línea",
  "hook_type": "question|shock|curiosity|story|how_to|list|challenge|other",
  "hook_analysis": "por qué este hook es efectivo o no (2-3 oraciones)",
  "hook_strength": "strong|medium|weak",
  "topic": "tema principal en 3-5 palabras",
  "topic_category": "nicho/categoría del contenido",
  "retention_formula": "fórmula de retención en 1 oración",
  "worked": true,
  "performance_verdict": "1 oración: '✅ Funcionó porque...' o '❌ No funcionó porque...'",
  "why_it_worked": ["razón 1", "razón 2", "razón 3"],
  "why_it_failed": ["razón del fracaso si aplica"],
  "content_structure": {
    "opening": "cómo abre el contenido",
    "middle": "cómo mantiene o pierde la atención",
    "cta": "llamado a acción o cierre",
    "emotional_triggers": ["disparadores emocionales usados"],
    "virality_elements": ["elementos que contribuyeron a su viralidad o su ausencia"],
    "weak_points": ["puntos débiles que limitaron el alcance"],
    "replication_template": "plantilla de 3-5 pasos para replicar o mejorar este formato",
    "improvement_suggestion": "qué cambiaría específicamente para mejorar el rendimiento"
  }
}`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
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

    const enrichedStructure = {
      ...(result.content_structure || {}),
      hook_analysis: result.hook_analysis || "",
      hook_strength: result.hook_strength || "medium",
      worked: result.worked ?? true,
      performance_verdict: result.performance_verdict || "",
      why_it_worked: result.why_it_worked || [],
      why_it_failed: result.why_it_failed || [],
    };

    await base44.asServiceRole.entities.Post.update(post.id, {
      hook_text: result.hook_text || "",
      hook_type: result.hook_type || "other",
      topic: result.topic || "",
      topic_category: result.topic_category || "",
      retention_formula: result.retention_formula || "",
      content_structure: JSON.stringify(enrichedStructure),
      ai_analysis_done: true
    });

    analyzed++;
  }

  return Response.json({
    success: true,
    analyzed,
    pending_remaining: Math.max(0, pending.length - analyzed),
    message: `Análisis diario completado: ${analyzed} posts procesados`
  });
});