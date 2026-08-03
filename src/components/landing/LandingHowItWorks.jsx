import { motion } from "framer-motion";
import { Search, Rocket, TrendingUp, Award } from "lucide-react";

const STEPS = [
  { icon: Search, title: "Analiza", desc: "Conecta perfiles de TikTok, Instagram y Facebook. La IA analiza el contenido y detecta qué hace viral.", color: "#60a5fa" },
  { icon: Rocket, title: "Lanza campañas", desc: "Crea campañas con misiones, presupuestos y recompensas. Inscribe editores y asigna artistas.", color: "#a78bfa" },
  { icon: TrendingUp, title: "Mide en tiempo real", desc: "Rastrea vistas, likes y engagement automáticamente. Compara editores y optimiza el rendimiento.", color: "#3B6FD4" },
  { icon: Award, title: "Recompensa", desc: "Los creadores desbloquean misiones por hitos de vistas y reciben pagos automáticos a su wallet.", color: "#4ade80" },
];

export default function LandingHowItWorks() {
  return (
    <section className="relative py-24 px-6 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <p className="text-[11px] tracking-[0.3em] uppercase mb-3" style={{ color: "rgba(31,71,161,0.5)" }}>Proceso</p>
        <h2 className="font-syne font-extrabold text-3xl md:text-5xl text-white mb-4">Cómo funciona</h2>
        <p className="text-white/40 max-w-2xl mx-auto text-sm md:text-base">De la idea al viral en cuatro pasos.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 relative">
        {/* Connecting line */}
        <div className="hidden md:block absolute top-10 left-[12%] right-[12%] h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(31,71,161,0.2), rgba(31,71,161,0.2), transparent)" }} />

        {STEPS.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
            className="relative text-center"
          >
            <div className="relative z-10 w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center"
              style={{ background: "#0a0910", border: `1px solid ${s.color}40` }}>
              <div className="absolute inset-0 rounded-2xl" style={{ background: `${s.color}10` }} />
              <s.icon className="w-7 h-7 relative z-10" style={{ color: s.color }} />
              <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-black"
                style={{ background: s.color }}>{i + 1}</span>
            </div>
            <h3 className="font-syne font-bold text-[15px] text-white mb-2">{s.title}</h3>
            <p className="text-[12px] text-white/40 leading-relaxed">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}