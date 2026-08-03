import { motion } from "framer-motion";
import { TrendingUp, Target, Wallet, Users2, Sparkles, ShieldCheck } from "lucide-react";

const ADVANTAGES = [
  { icon: TrendingUp, title: "Crece más rápido", desc: "Identifica tendencias y replica fórmulas virales antes que la competencia. Datos en tiempo real para decisiones rápidas.", color: "#4ade80" },
  { icon: Target, title: "Decisiones con datos", desc: "Score de viralidad, engagement rate y retención analizados por IA. Deja de adivinar qué contenido funciona.", color: "#60a5fa" },
  { icon: Wallet, title: "Pagos automatizados", desc: "Sistema de misiones con hitos de vistas y recompensas automáticas. Los creadores cobran al alcanzar objetivos.", color: "#3B6FD4" },
  { icon: Users2, title: "Gestiona tu equipo", desc: "Asigna artistas a clientes, inscriben editores en campañas y controla quién ve qué con roles y permisos.", color: "#a78bfa" },
  { icon: Sparkles, title: "Análisis con IA", desc: "El agente de IA analiza cada post: hook, estructura, fórmula de retención y tipo de contenido para replicar éxitos.", color: "#f472b6" },
  { icon: ShieldCheck, title: "Escalable y seguro", desc: "Desde una cuenta hasta cientos de perfiles. Scraping automático diario y monitoreo 24/7 sin intervención manual.", color: "#fb923c" },
];

export default function LandingGrowth() {
  return (
    <section className="relative py-24 px-6 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <p className="text-[11px] tracking-[0.3em] uppercase mb-3" style={{ color: "rgba(31,71,161,0.5)" }}>Ventajas</p>
        <h2 className="font-syne font-extrabold text-3xl md:text-5xl text-white mb-4">Crece con la plataforma</h2>
        <p className="text-white/40 max-w-2xl mx-auto text-sm md:text-base">Todo lo que necesitas para escalar tu contenido y tu equipo de creadores.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {ADVANTAGES.map((a, i) => (
          <motion.div
            key={a.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="relative bg-card border border-white/8 rounded-2xl p-6 hover:border-white/15 transition-all overflow-hidden group"
          >
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: `radial-gradient(circle, ${a.color}15, transparent 70%)` }} />
            <div className="relative flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${a.color}15`, border: `1px solid ${a.color}30` }}>
                <a.icon className="w-5 h-5" style={{ color: a.color }} />
              </div>
              <h3 className="font-syne font-bold text-[15px] text-white">{a.title}</h3>
            </div>
            <p className="relative text-[13px] text-white/40 leading-relaxed">{a.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}