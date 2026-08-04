import { useState } from "react";
import { ChevronDown, AlertTriangle, ExternalLink } from "lucide-react";
import EditorClipRow from "@/components/editors/EditorClipRow";
import StrikesPanel from "@/components/editors/StrikesPanel";

const PLATFORM_LABELS = { tiktok: "TikTok", instagram: "Instagram", youtube: "YouTube" };
const money = (n) => `$${(n || 0).toLocaleString("es-MX", { maximumFractionDigits: 0 })}`;

export default function EditorCard({ editor, platform, assignments, clips, payments, onChanged }) {
  const [open, setOpen] = useState(false);

  const cuentas = assignments.flatMap(a => a.cuentas || []);
  const uniqueCuentas = [...new Map(cuentas.map(c => [`${c.platform}|${c.url}`, c])).values()];
  const shownCuentas = platform === "all" ? uniqueCuentas : uniqueCuentas.filter(c => c.platform === platform);
  const strikes = Math.max(0, ...assignments.map(a => a.strikes || 0));
  const pagado = payments.filter(p => p.status === "pagado").reduce((s, p) => s + (p.total || 0), 0);
  const pendiente = payments.filter(p => p.status === "pendiente").reduce((s, p) => s + (p.total || 0), 0);

  const shownClips = platform === "all"
    ? clips
    : clips.filter(c => (c.publications || []).some(p => p.platform === platform));

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="p-4 md:p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-[15px] font-bold text-primary-foreground bg-primary flex-shrink-0">
              {(editor.full_name || editor.email || "?")[0].toUpperCase()}
            </div>
            <div>
              <p className="font-syne font-bold text-foreground text-[15px]">{editor.full_name || editor.email}</p>
              <p className="text-[11px] text-muted-foreground">{editor.email}{editor.paypal_email ? ` · PayPal: ${editor.paypal_email}` : ""}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-right">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Pagado</p>
              <p className="text-[14px] font-bold text-green-600">{money(pagado)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Pendiente</p>
              <p className="text-[14px] font-bold text-primary">{money(pendiente)}</p>
            </div>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
              strikes >= 3 ? "bg-red-100 text-red-700" : strikes > 0 ? "bg-amber-100 text-amber-700" : "bg-secondary text-secondary-foreground"
            }`}>
              <AlertTriangle className="w-3 h-3" /> {strikes}/3
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="text-[11px] text-muted-foreground">{uniqueCuentas.length} cuenta{uniqueCuentas.length !== 1 ? "s" : ""}:</span>
          {shownCuentas.length === 0 ? (
            <span className="text-[11px] text-muted-foreground italic">Sin cuentas registradas{platform !== "all" ? ` en ${PLATFORM_LABELS[platform]}` : ""}</span>
          ) : shownCuentas.map((c, i) => (
            <a key={i} href={c.url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-secondary text-primary hover:bg-accent border border-border">
              {PLATFORM_LABELS[c.platform] || c.platform} <ExternalLink className="w-3 h-3" />
            </a>
          ))}
        </div>

        <button onClick={() => setOpen(!open)}
          className="mt-3 flex items-center gap-1.5 text-[12px] font-semibold text-primary hover:underline">
          {shownClips.length} clip{shownClips.length !== 1 ? "s" : ""}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {open && (
        <>
          <div className="border-t border-border px-4 md:px-5">
            <StrikesPanel editor={editor} onChanged={onChanged} />
          </div>
          <div className="border-t border-border divide-y divide-border">
            {shownClips.length === 0 ? (
              <p className="p-4 text-[12px] text-muted-foreground">Sin clips{platform !== "all" ? ` en ${PLATFORM_LABELS[platform]}` : ""}.</p>
            ) : shownClips.map(clip => (
              <EditorClipRow key={clip.id} clip={clip} onChanged={onChanged} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}