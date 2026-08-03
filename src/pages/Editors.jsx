import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Users } from "lucide-react";
import EditorCard from "@/components/editors/EditorCard";

const PLATFORMS = [["all", "Todos"], ["tiktok", "TikTok"], ["instagram", "Instagram"], ["youtube", "YouTube"]];

export default function Editors() {
  const [data, setData] = useState(null);
  const [platform, setPlatform] = useState("all");

  const load = () => Promise.all([
    base44.functions.invoke("listUsers", {}).then(r => (r.data?.users || []).filter(u => u.user_type === "editor")),
    base44.entities.EditorAssignment.list("-created_date", 500),
    base44.entities.Clip.list("-created_date", 500),
    base44.entities.Payment.list("-created_date", 500),
  ]).then(([editors, assignments, clips, payments]) => setData({ editors, assignments, clips, payments }));

  useEffect(() => { load(); }, []);

  if (!data) return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-5 h-5 text-primary/60" />
          <h1 className="text-2xl md:text-3xl font-syne font-bold text-foreground">Editores</h1>
        </div>
        <p className="text-muted-foreground text-sm">{data.editors.length} editores dados de alta · cuentas, strikes, pagos y QA de clips</p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {PLATFORMS.map(([key, label]) => (
          <button key={key} onClick={() => setPlatform(key)}
            className={`px-4 py-1.5 rounded-full text-[12px] font-semibold transition-colors border ${
              platform === key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-primary/70 border-border hover:bg-secondary"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {data.editors.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground text-sm">Aún no hay usuarios con tipo "editor". Invítalos desde Usuarios.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.editors.map(ed => (
            <EditorCard key={ed.id} editor={ed} platform={platform}
              assignments={data.assignments.filter(a => a.editor_id === ed.id)}
              clips={data.clips.filter(c => c.editor_id === ed.id)}
              payments={data.payments.filter(p => p.editor_id === ed.id)}
              onChanged={load} />
          ))}
        </div>
      )}
    </div>
  );
}