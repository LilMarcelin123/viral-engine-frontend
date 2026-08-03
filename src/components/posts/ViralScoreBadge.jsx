import { cn } from "@/lib/utils";
import { Flame } from "lucide-react";

export default function ViralScoreBadge({ score, size = "md" }) {
  const getConfig = (s) => {
    if (s >= 80) return { label: "MEGA VIRAL", bg: "bg-red-100", text: "text-red-600", border: "border-red-200" };
    if (s >= 60) return { label: "VIRAL", bg: "bg-orange-100", text: "text-orange-600", border: "border-orange-200" };
    if (s >= 40) return { label: "TRENDING", bg: "bg-[#7BA5F0]", text: "text-[#143A8C]", border: "border-[#5B8DEF]" };
    if (s >= 20) return { label: "NORMAL", bg: "bg-blue-100", text: "text-blue-600", border: "border-blue-200" };
    return { label: "BAJO", bg: "bg-gray-100", text: "text-gray-500", border: "border-gray-200" };
  };

  const { label, bg, text, border } = getConfig(score || 0);

  return (
    <span className={cn(
      "inline-flex items-center gap-1 font-bold border rounded-full",
      bg, text, border,
      size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1"
    )}>
      <Flame className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />
      {score || 0} · {label}
    </span>
  );
}