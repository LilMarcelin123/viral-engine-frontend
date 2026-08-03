import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function LandingCTA({ onLogin }) {
  return (
    <section className="relative py-24 px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-3xl mx-auto text-center relative overflow-hidden rounded-3xl p-12"
        style={{ background: "linear-gradient(135deg, rgba(31,71,161,0.08), rgba(20,58,140,0.03))", border: "1px solid rgba(31,71,161,0.15)" }}
      >
        <div className="absolute inset-0 shimmer pointer-events-none" />
        <h2 className="font-syne font-extrabold text-3xl md:text-4xl text-white mb-4 relative">
          ¿Listo para llevar tu contenido al <span className="text-brand-blue">siguiente nivel</span>?
        </h2>
        <p className="text-white/40 mb-8 relative text-sm md:text-base">Entra ahora y empieza a gestionar tus campañas y creadores.</p>
        <button
          onClick={onLogin}
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-[14px] font-semibold text-black relative"
          style={{ background: "linear-gradient(135deg, #3B6FD4 0%, #1F47A1 50%, #143A8C 100%)", boxShadow: "0 4px 24px rgba(31,71,161,0.3)" }}
        >
          Entrar ahora <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </section>
  );
}