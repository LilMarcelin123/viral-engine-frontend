// Waveform animada estilo DAN Records
import { useMemo } from "react";

export default function WaveformBar({ score = 50, bars = 40 }) {
  const heights = useMemo(() => {
    const arr = [];
    for (let i = 0; i < bars; i++) {
      // Forma de waveform: mayor en centro, menor en extremos
      const pos = i / bars;
      const envelope = Math.sin(pos * Math.PI) * 0.7 + 0.3;
      const noise = 0.5 + Math.random() * 0.5;
      arr.push(Math.max(0.15, Math.min(1, envelope * noise)));
    }
    return arr;
  }, [bars]);

  const active = Math.floor((score / 100) * bars);

  return (
    <div className="flex items-center gap-[2px] h-8">
      {heights.map((h, i) => (
        <div
          key={i}
          className="rounded-[1px] flex-shrink-0"
          style={{
            width: "3px",
            height: `${h * 28}px`,
            background: i < active
              ? "rgba(255,255,255,0.85)"
              : "rgba(255,255,255,0.18)",
            animation: i < active
              ? `soundbar ${0.8 + Math.random() * 0.7}s ease-in-out ${i * 0.03}s infinite alternate`
              : "none",
          }}
        />
      ))}
    </div>
  );
}