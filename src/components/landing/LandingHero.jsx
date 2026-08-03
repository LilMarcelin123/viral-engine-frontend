import { motion } from "framer-motion";
import { Disc3, ArrowRight, ChevronDown } from "lucide-react";

export default function LandingHero({ onLogin }) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-6">
      <div className="text-center max-w-4xl mx-auto">
        {/* Spinning vinyl */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="mx-auto mb-8 w-20 h-20 flex items-center justify-center"
        >
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(circle, rgba(31,71,161,0.15) 0%, transparent 70%)" }} />
            <div className="absolute inset-0 rounded-full" style={{ border: "1px solid rgba(31,71,161,0.3)" }} />
            <Disc3 className="w-full h-full relative z-10 text-[#1F47A1]"
              style={{ animation: "spin 8s linear infinite", filter: "drop-shadow(0 0 12px rgba(31,71,161,0.5))" }} />
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-[11px] tracking-[0.3em] uppercase mb-4"
          style={{ color: "rgba(31,71,161,0.5)" }}
        >
          Dan Creative Studio
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="font-syne font-extrabold text-4xl md:text-6xl lg:text-7xl leading-[1.05] mb-6"
        >
          <span className="text-white">Donde la música</span><br />
          <span className="text-brand-blue">se vuelve viral</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="text-white/50 text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          La plataforma todo-en-uno para la industria musical. Analiza contenido viral,
          gestiona campañas de creadores y conecta artistas con su audiencia.
        </motion.p>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          onClick={onLogin}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-[14px] font-semibold text-black"
          style={{ background: "linear-gradient(135deg, #3B6FD4 0%, #1F47A1 50%, #143A8C 100%)", boxShadow: "0 4px 24px rgba(31,71,161,0.3)" }}
        >
          Entrar <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <ChevronDown className="w-5 h-5 text-white/20" style={{ animation: "fadeUp 2s ease-in-out infinite" }} />
      </motion.div>
    </section>
  );
}