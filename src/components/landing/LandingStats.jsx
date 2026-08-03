import { motion } from "framer-motion";

const STATS = [
  { value: "500+", label: "Perfiles analizados" },
  { value: "50M+", label: "Vistas rastreadas" },
  { value: "100+", label: "Campañas gestionadas" },
  { value: "24/7", label: "Monitoreo automático" },
];

export default function LandingStats() {
  return (
    <section className="relative py-16 px-6">
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="text-center"
          >
            <p className="font-syne font-extrabold text-3xl md:text-4xl text-brand-blue mb-1">{s.value}</p>
            <p className="text-[11px] text-white/35 uppercase tracking-wider">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}