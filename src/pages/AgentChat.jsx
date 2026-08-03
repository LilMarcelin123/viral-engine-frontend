import { useEffect, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { confirmDialog } from "@/lib/alerts";
import { Send, Plus, Bot, Loader2, ChevronRight, Sparkles, Table2, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

const AGENT_NAME = "analytics_agent";
const DAILY_LIMIT = 5;

const getTodayMX = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });

const STARTERS = [
  "¿Cuáles son los 5 posts más virales de todos los perfiles?",
  "Compara los perfiles por seguidores y engagement rate",
  "¿Qué tipo de hook genera más views en promedio?",
  "Dame un ranking de artistas por virality score",
  "¿Cuáles son los hashtags más frecuentes en posts virales?",
  "Muestra los últimos posts scrapeados con score > 50",
];

function MessageBubble({ message }) {
  const isUser = message.role === "user";
  const hasContent = !!(message.content && message.content.trim());
  const hasTools = !!(message.tool_calls && message.tool_calls.length > 0);
  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      {!isUser && (
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: "linear-gradient(135deg, #143A8C, #3B6FD4)", boxShadow: "0 0 12px rgba(31,71,161,0.3)" }}>
          <Bot className="w-4 h-4 text-black" />
        </div>
      )}
      <div className={cn("max-w-[80%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed",
        isUser
          ? "text-white rounded-tr-sm"
          : "text-white/85 rounded-tl-sm")}
        style={isUser
          ? { background: "rgba(31,71,161,0.18)", border: "1px solid rgba(31,71,161,0.3)" }
          : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
        {isUser
          ? <p>{message.content}</p>
          : hasContent
            ? <ReactMarkdown className="prose prose-invert prose-sm max-w-none [&_table]:text-xs [&_th]:text-[#3B6FD4]/80 [&_td]:text-white/70 [&_th]:py-1.5 [&_td]:py-1.5 [&_table]:border-collapse [&_th]:border [&_th]:border-white/10 [&_td]:border [&_td]:border-white/10 [&_strong]:text-[#5B8DEF]">
                {message.content}
              </ReactMarkdown>
            : !hasTools && (
              <div className="flex gap-1.5 items-center h-4">
                {[0, 1, 2].map(d => (
                  <div key={d} className="w-1.5 h-1.5 rounded-full"
                    style={{ background: "rgba(31,71,161,0.6)", animation: `soundbar 0.8s ease-in-out ${d * 0.2}s infinite alternate` }} />
                ))}
              </div>
            )
        }
        {message.tool_calls?.map((tc, i) => {
          const dp = tc.display_projection;
          const label = tc.status === "completed" || tc.status === "success"
            ? (dp?.label || "Datos consultados")
            : (dp?.active_label || "Consultando datos...");
          return (
            <div key={i} className="mt-2 flex items-center gap-2 text-[11px] px-3 py-1.5 rounded-lg"
              style={{ background: "rgba(31,71,161,0.08)", border: "1px solid rgba(31,71,161,0.15)", color: "rgba(31,71,161,0.7)" }}>
              {(tc.status === "pending" || tc.status === "running" || tc.status === "in_progress")
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <Table2 className="w-3 h-3" />}
              {label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AgentChat() {
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [dailyCount, setDailyCount] = useState(0);
  const [usageRecord, setUsageRecord] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
      const today = getTodayMX();
      const records = await base44.entities.AgentUsage.filter({ user_id: user.id, date: today });
      if (records.length > 0) {
        setUsageRecord(records[0]);
        setDailyCount(records[0].count || 0);
      }
      const convs = await base44.agents.listConversations({ agent_name: AGENT_NAME });
      setConversations(convs);
      setLoadingConvs(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (!activeConv) return;
    const unsub = base44.agents.subscribeToConversation(activeConv.id, (data) => {
      setMessages(data.messages || []);
    });
    return () => unsub();
  }, [activeConv?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const createConversation = async () => {
    const conv = await base44.agents.createConversation({
      agent_name: AGENT_NAME,
      metadata: { name: `Análisis ${new Date().toLocaleDateString("es-MX")}` }
    });
    setConversations(prev => [conv, ...prev]);
    setActiveConv(conv);
    setMessages([]);
    inputRef.current?.focus();
  };

  const openConversation = async (conv) => {
    const full = await base44.agents.getConversation(conv.id);
    setActiveConv(full);
    setMessages(full.messages || []);
  };

  const deleteConversation = async (e, conv) => {
    e.stopPropagation();
    if (!(await confirmDialog("¿Eliminar esta conversación?", { danger: true, confirmLabel: "Eliminar" }))) return;
    setConversations(prev => prev.filter(c => c.id !== conv.id));
    if (activeConv?.id === conv.id) { setActiveConv(null); setMessages([]); }
    try {
      await base44.agents.deleteConversation(conv.id);
    } catch {
      // si la API no soporta borrado, queda oculta localmente
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    if (dailyCount >= DAILY_LIMIT) return;

    let conv = activeConv;
    if (!conv) {
      conv = await base44.agents.createConversation({
        agent_name: AGENT_NAME,
        metadata: { name: input.slice(0, 40) }
      });
      setConversations(prev => [conv, ...prev]);
      setActiveConv(conv);
    }
    const text = input.trim();
    setInput("");
    setSending(true);

    // Validar e incrementar contador diario en el backend
    try {
      const usageRes = await base44.functions.invoke('checkAgentUsage', {});
      const usage = usageRes.data;
      setDailyCount(usage.count);
      if (!usage.allowed) {
        setSending(false);
        return;
      }
    } catch (e) {
      setSending(false);
      return;
    }

    await base44.agents.addMessage(conv, { role: "user", content: text });
    setSending(false);
    inputRef.current?.focus();
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const applyStarter = (s) => { setInput(s); inputRef.current?.focus(); };

  return (
    <div className="flex h-[calc(100vh-72px)] md:h-screen overflow-hidden" style={{ background: "#03030a" }}>
      {/* Sidebar conversations */}
      <div className="w-16 md:w-56 flex-shrink-0 flex flex-col border-r overflow-hidden"
        style={{ borderColor: "rgba(31,71,161,0.1)", background: "rgba(5,4,10,0.98)" }}>
        <div className="p-3 border-b" style={{ borderColor: "rgba(31,71,161,0.1)" }}>
          <button onClick={createConversation}
            className="w-full flex items-center justify-center md:justify-start gap-2 px-3 py-2 rounded-xl text-[12px] font-semibold transition-all"
            style={{ background: "linear-gradient(135deg, #143A8C, #3B6FD4)", color: "#000" }}
            title="Nueva consulta">
            <Plus className="w-3.5 h-3.5 flex-shrink-0" /> <span className="hidden md:inline">Nueva consulta</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingConvs && <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin text-white/20" /></div>}
          {!loadingConvs && conversations.length === 0 && (
            <p className="hidden md:block text-center text-[11px] text-white/20 py-6 px-2">Sin conversaciones aún</p>
          )}
          {conversations.map(conv => (
            <div key={conv.id} onClick={() => openConversation(conv)}
              className={cn("group relative w-full text-left px-2 md:px-3 py-2.5 rounded-xl text-[11px] transition-all cursor-pointer",
                activeConv?.id === conv.id
                  ? ""
                  : "text-white/45 hover:text-white/75")}
              style={activeConv?.id === conv.id
                ? { background: "rgba(31,71,161,0.14)", border: "1px solid rgba(31,71,161,0.35)", color: "#3B6FD4" }
                : { border: "1px solid transparent" }}
              title={conv.metadata?.name || "Análisis"}>
              <div className="md:hidden flex items-center justify-center">
                <span className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold"
                  style={{ background: "rgba(31,71,161,0.12)", color: "#3B6FD4" }}>
                  {(conv.metadata?.name || "A")[0].toUpperCase()}
                </span>
              </div>
              <div className="hidden md:block">
                <p className="font-medium truncate pr-6">{conv.metadata?.name || "Análisis"}</p>
                <p className="text-[10px] mt-0.5 opacity-60">
                  {new Date(conv.updated_date || conv.created_date).toLocaleDateString("es-MX")}
                </p>
                <button onClick={(e) => deleteConversation(e, conv)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/15"
                  title="Eliminar conversación">
                  <Trash2 className="w-3 h-3 text-white/40 hover:text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center gap-3 flex-shrink-0"
          style={{ borderColor: "rgba(31,71,161,0.1)", background: "rgba(5,4,10,0.95)" }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #143A8C, #3B6FD4)" }}>
            <Sparkles className="w-4 h-4 text-black" />
          </div>
          <div>
            <h2 className="font-syne font-bold text-white text-[14px]">Agente Analítico DanCreativeStudio</h2>
            <p className="text-[10px] text-white/30">Claude · Métricas en tiempo real</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-4">
          {!activeConv && messages.length === 0 && (
            <div className="max-w-2xl mx-auto pt-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #143A8C, #3B6FD4)", boxShadow: "0 0 32px rgba(31,71,161,0.25)" }}>
                  <Bot className="w-8 h-8 text-black" />
                </div>
                <h3 className="font-syne font-bold text-white text-xl mb-2">Analista de Métricas</h3>
                <p className="text-white/35 text-[13px]">Pregúntame sobre los datos scrapeados. Puedo generar tablas, rankings y análisis de patrones virales.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {STARTERS.map((s, i) => (
                  <button key={i} onClick={() => applyStarter(s)}
                    className="flex items-center gap-2 p-3 rounded-xl text-left text-[12px] text-white/55 hover:text-white/85 transition-all group"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(31,71,161,0.2)"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"}>
                    <ChevronRight className="w-3 h-3 text-[#1F47A1]/50 flex-shrink-0 group-hover:text-[#3B6FD4]/80" />
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg, i) => <MessageBubble key={i} message={msg} />)}
          {sending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #143A8C, #3B6FD4)" }}>
                <Bot className="w-4 h-4 text-black" />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-tl-sm"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex gap-1.5 items-center h-4">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full"
                      style={{ background: "rgba(31,71,161,0.6)", animation: `soundbar 0.8s ease-in-out ${i * 0.2}s infinite alternate` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 md:px-8 py-4 border-t flex-shrink-0"
          style={{ borderColor: "rgba(31,71,161,0.1)", background: "rgba(5,4,10,0.95)" }}>
          {dailyCount >= DAILY_LIMIT ? (
            <div className="max-w-4xl mx-auto text-center py-3 px-4 rounded-xl"
              style={{ background: "rgba(31,71,161,0.07)", border: "1px solid rgba(31,71,161,0.2)" }}>
              <p className="text-[13px] font-semibold" style={{ color: "#3B6FD4" }}>
                Límite diario alcanzado ({DAILY_LIMIT}/{DAILY_LIMIT} consultas)
              </p>
              <p className="text-[11px] text-white/30 mt-0.5">Vuelve mañana para continuar analizando tus métricas</p>
            </div>
          ) : (
            <>
              <div className="flex gap-3 items-end max-w-4xl mx-auto">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Pregunta sobre métricas, rankings, patrones..."
                  rows={1}
                  className="flex-1 resize-none rounded-xl px-4 py-3 text-[13px] text-white placeholder-white/20 outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(31,71,161,0.15)",
                    maxHeight: "120px",
                    minHeight: "44px",
                  }}
                  onFocus={e => e.target.style.borderColor = "rgba(31,71,161,0.35)"}
                  onBlur={e => e.target.style.borderColor = "rgba(31,71,161,0.15)"}
                />
                <button onClick={sendMessage} disabled={!input.trim() || sending}
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30"
                  style={{ background: "linear-gradient(135deg, #143A8C, #3B6FD4)" }}>
                  <Send className="w-4 h-4 text-black" />
                </button>
              </div>
              <p className="text-center text-[10px] text-white/15 mt-2">
                {dailyCount}/{DAILY_LIMIT} consultas hoy · Enter para enviar
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}