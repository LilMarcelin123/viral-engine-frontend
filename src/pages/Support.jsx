import { LifeBuoy, Radar, BrainCircuit, Megaphone, Target, Lightbulb } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const GUIDES = [
  {
    icon: Megaphone,
    title: "Cómo funcionan las campañas",
    steps: [
      "El admin crea la campaña con su número de videos; el presupuesto se calcula solo y queda apartado en garantía.",
      "El admin asigna a los editores; cada editor registra sus cuentas y selecciona cuáles usará en la campaña.",
      "El editor sube sus clips publicados en sus cuentas registradas, respetando las pautas y su tope de clips.",
      "El equipo modera cada clip: aprobado cuenta para el pago; rechazado no cuenta y baja tu tasa de aprobación.",
      "Un clip con strike queda excluido de los bonos pero conserva su pago base si ya fue aprobado.",
    ],
    tip: "Sube tus clips apenas los publiques: las vistas se congelan a los 14 días de publicado y con esas se calcula el pago.",
  },
  {
    icon: Target,
    title: "Cómo se ganan los bonos",
    steps: [
      "Pago base: cada clip aprobado tiene un monto garantizado, sin importar cuántas vistas logre.",
      "Bono por clip (Sub-bolsa A): cada clip alcanza un escalón según sus vistas (TikTok + Instagram + YouTube).",
      "Bono acumulado (Sub-bolsa B): la suma de vistas de todos tus clips desbloquea metas; paga la más alta alcanzada.",
      "Premio al clip #1 (Sub-bolsa C): el clip con más vistas de toda la campaña se lleva el premio.",
      "Todo el que alcanza un escalón cobra: si el total supera la bolsa, los pagos se ajustan proporcionalmente entre todos.",
    ],
    tip: "No depende del orden de llegada: si calificas, cobras. Por eso los bonos se anuncian como «hasta $X» — el monto final depende de cuántos editores califiquen.",
  },
  {
    icon: Lightbulb,
    title: "Tus cuentas y tus límites",
    steps: [
      "Registra tus cuentas de TikTok, Instagram y YouTube desde tu Dashboard: hasta 3 por plataforma, 9 en total.",
      "Al aceptar una campaña seleccionas cuáles de esas cuentas vas a usar; eso define tu tope de clips.",
      "Puedes subir máximo 5 clips por cuenta al día, con un límite de 15 clips diarios entre todas tus cuentas.",
      "Tienes 24 horas para confirmar tu participación; si no, tus videos pasan a la bolsa de reasignación.",
      "Con una tasa de aprobación del 85% o más puedes reclamar videos extra de esa bolsa.",
    ],
    tip: "Registra el link correcto de cada red: el sistema valida que la URL corresponda a la plataforma que elegiste.",
  },
  {
    icon: LifeBuoy,
    title: "Cómo y cuándo se paga",
    steps: [
      "El pago base se liquida en el corte quincenal.",
      "Los bonos se liquidan en la quincena siguiente al cierre de medición de la campaña.",
      "Registra tu correo de PayPal en tu perfil: es el medio por el que recibirás el pago.",
      "Las comisiones del medio de pago y las diferencias por tipo de cambio corren por tu cuenta.",
      "Puedes revisar en todo momento tu desglose (base, escalón, acumulado y premio) en la sección Billetera.",
    ],
    tip: "Aunque una campaña ya esté cerrada, tus pagos pendientes siguen visibles en Billetera hasta que se liquiden.",
  },
];

export default function Support() {
  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <LifeBuoy className="w-5 h-5 text-[#3B6FD4]/60" />
          <h1 className="text-2xl md:text-3xl font-syne font-bold text-white">Guías y Soporte</h1>
        </div>
        <p className="text-white/35 text-sm">Cómo funcionan las campañas, los bonos y los pagos</p>
      </div>

      <Accordion type="single" collapsible className="space-y-3">
        {GUIDES.map((g, i) => {
          const Icon = g.icon;
          return (
            <AccordionItem key={i} value={`item-${i}`}
              className="rounded-2xl px-5 border-0"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(31,71,161,0.12)", border: "1px solid rgba(31,71,161,0.25)" }}>
                    <Icon className="w-4 h-4" style={{ color: "#5B8DEF" }} />
                  </div>
                  <span className="font-syne font-bold text-white text-[14px] text-left">{g.title}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-5">
                <ol className="space-y-2.5 ml-1">
                  {g.steps.map((s, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                        style={{ background: "rgba(31,71,161,0.15)", color: "#5B8DEF" }}>
                        {j + 1}
                      </span>
                      <span className="text-[13px] text-white/60 leading-relaxed">{s}</span>
                    </li>
                  ))}
                </ol>
                <div className="flex items-start gap-2.5 mt-4 p-3.5 rounded-xl"
                  style={{ background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.15)" }}>
                  <Lightbulb className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[12px] text-emerald-300/80 leading-relaxed">{g.tip}</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      <div className="mt-8 p-5 rounded-2xl text-center"
        style={{ background: "rgba(31,71,161,0.05)", border: "1px solid rgba(31,71,161,0.15)" }}>
        <p className="text-[13px] text-white/60">¿Tienes dudas o algo no funciona?</p>
        <p className="text-[12px] text-white/35 mt-1">Contacta al administrador de tu equipo desde la sección Usuarios.</p>
      </div>
    </div>
  );
}