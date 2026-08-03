import { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react";

const SECTIONS = [
  {
    icon: "🎬", title: "1. Pago base garantizado",
    body: "Por cada clip que apruebe QA cobras $10 MXN, sí o sí, sin importar cuántas vistas haga. Este pago se liquida en el corte quincenal (día 15 y último de mes).",
  },
  {
    icon: "🔥", title: "2. Bonos por clip",
    body: "Cada clip tuyo compite por bonos según sus vistas (TikTok + Instagram sumadas). Cobras el escalón más alto que alcance:\n👁️ 5,000 vistas → $10\n👁️ 10,000 → $25\n👁️ 50,000 → $75\n👁️ 100,000 → $200\n👁️ 500,000 → $600\n👁️ 1,000,000 → $1,500 🤑",
  },
  {
    icon: "📈", title: "3. Bono por consistencia",
    body: "Además, sumamos las vistas de TODOS tus clips de la campaña:\n⭐ 50K acumuladas → +$30\n⭐ 100K acumuladas → +$60\n⭐ 200K acumuladas → +$120\n\nNo necesitas un viral para cobrar esto: trabajo constante y bien hecho = bono seguro.",
  },
  {
    icon: "🏆", title: "4. Premio al clip #1",
    body: "El clip con más vistas de cada campaña se lleva $300 extra. El leaderboard estará visible durante toda la campaña para que veas en vivo quién va ganando. 👀",
  },
  {
    icon: "📋", title: "Las reglas del juego",
    body: "🕒 Las vistas de cada clip se congelan a los 14 días de publicado\n✅ Solo cuentan clips aprobados por QA y publicados en cuentas de la red autorizada\n💰 La bolsa de bonos es limitada y se reparte por ranking de vistas — por eso siempre anunciamos \"hasta $X en bonos\"\n🚫 Vistas compradas o infladas = clip descalificado + strike. 3 strikes = fuera de la comunidad\n📅 Base se paga en la quincena; bonos en la quincena siguiente al cierre de medición",
  },
  {
    icon: "📦", title: "Cómo se reparte el trabajo",
    body: "Cuando abre una campaña, tienes 24 horas para confirmar tu participación. Los videos se reparten parejo entre los confirmados. Si alguien no confirma o se atrasa en el checkpoint del 50%, sus videos pasan a la bolsa de extras que puedes reclamar para ganar más — pero solo si mantienes 85%+ de aprobación en QA. La calidad te da acceso a más trabajo. 💪",
  },
  {
    icon: "🧮", title: "¿Cuánto puedo ganar?",
    body: "Ejemplo real — campaña de 100 videos, 20 clips asignados:\n🟢 Solo cumples: $200 garantizados\n🟡 Rendimiento normal: $270–$310\n🟠 Un clip destacado: $400–$550\n🔴 Ganador de la campaña: $800–$1,000 🏆\n\nClips cortos (~15 min c/u), nosotros ponemos la música, el brief y los assets. Tú editas, publicas y cobras. 🚀",
  },
];

export default function PaymentSystemGuide() {
  const [open, setOpen] = useState(null);

  return (
    <div className="bg-card border border-white/6 rounded-2xl p-5 mb-6">
      <div className="flex items-center gap-2 mb-1">
        <BookOpen className="w-4 h-4 text-[#3B6FD4]" />
        <h2 className="font-syne font-bold text-white text-[15px]">💰 Cómo funciona el sistema de pagos</h2>
      </div>
      <p className="text-[11px] text-white/40 mb-3">Aquí te explicamos exactamente cómo, cuánto y cuándo cobras. Sin letras chiquitas. 👇</p>
      <div className="space-y-1.5">
        {SECTIONS.map((s, i) => (
          <div key={i} className="rounded-xl bg-white/3 border border-white/6 overflow-hidden">
            <button onClick={() => setOpen(o => o === i ? null : i)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 text-left">
              <p className="text-[12px] font-semibold text-white/80">{s.icon} {s.title}</p>
              {open === i ? <ChevronUp className="w-3.5 h-3.5 text-white/30" /> : <ChevronDown className="w-3.5 h-3.5 text-white/30" />}
            </button>
            {open === i && (
              <p className="px-3.5 pb-3 text-[12px] text-white/55 whitespace-pre-wrap leading-relaxed">{s.body}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}