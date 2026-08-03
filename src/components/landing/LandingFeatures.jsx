import { motion } from "framer-motion";
import { BrainCircuit, Megaphone, Users, Trophy, Zap, BarChart2 } from "lucide-react";

const FEATURES = [
  { icon: BrainCircuit, title: "Análisis Viral con IA", desc: "Descubre qué hace que un contenido sea viral con métricas en tiempo real e inteligencia artificial.", color: "#a78bfa" },
  { icon: Megaphone, title: "Gestión de Campañas", desc: "Crea, monitorea y optimiza campañas. Presupuestos, misiones y recompensas en un solo lugar.", color: "#3B6FD4" },
  { icon: Users, title: "Perfiles de Creadores", desc: "Rastrea cuentas en TikTok, Instagram y Facebook con datos actualizados automáticamente.", color: "#60a5fa" },
  { icon: Trophy, title: "Ranking de Edits", desc: "Compara el rendimiento de editores e identifica a los mejores creadores de contenido.", color: "#4ade80" },
  { icon: Zap, title: "Misiones y Recompensas", desc: "Motiva a tus creadores con hitos de vistas, misiones desbloqueables y pagos automáticos.", color: "#fb923c" },
  { icon: BarChart2, title: "Comparativa de Cuentas", desc: "Analiza múltiples perfiles lado a lado y toma decisiones basadas en datos.", color: "#f472b6" },
];

export default function LandingFeatures() {
  return (
    <section className="relative py-24 px-6 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <p className="text-[11px] tracking-[0.3em] uppercase mb-3" style={{ color: "rgba(31,71,161,0.5)" }}>Plataforma</p>
        <h2 className="font-syne font-extrabold text-3xl md:text-5xl text-white mb-4">Todo lo que necesitas</h2>
        <p className="text-white/40 max-w-2xl mx-auto text-sm md:text-base">Herramientas diseñadas para labels, managers y creadores de la industria musical.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="bg-card border border-white/8 rounded-2xl p-6 hover:border-white/15 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all group-hover:scale-110"
              style={{ background: `${f.color}15`, border: `1px solid ${f.color}30` }}>
              <f.icon className="w-5 h-5" style={{ color: f.color }} />
            </div>
            <h3 className="font-syne font-bold text-[16px] text-white mb-2">{f.title}</h3>
            <p className="text-[13px] text-white/40 leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}