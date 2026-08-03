// Disco de vinilo cromado animado — estilo DAN Records
export default function VinylRecord({ imageUrl, size = 200 }) {
  const r = size / 2;
  const rings = [0.96, 0.88, 0.80, 0.72, 0.64, 0.56, 0.48, 0.40, 0.32];

  return (
    <div
      className="relative flex-shrink-0"
      style={{
        width: size,
        height: size,
        animation: "spin 8s linear infinite",
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          {/* Chrome gradient para el disco */}
          <radialGradient id="vinyl-radial" cx="35%" cy="30%" r="70%">
            <stop offset="0%"   stopColor="#e8e9eb" />
            <stop offset="25%"  stopColor="#c0c2c8" />
            <stop offset="50%"  stopColor="#5a5c65" />
            <stop offset="75%"  stopColor="#9ea0a8" />
            <stop offset="100%" stopColor="#2a2b30" />
          </radialGradient>
          <radialGradient id="center-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#1a1b1f" />
            <stop offset="60%"  stopColor="#111215" />
            <stop offset="100%" stopColor="#0a0a0c" />
          </radialGradient>
          {/* Brillo cónico */}
          <linearGradient id="shine" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="rgba(255,255,255,0.18)" />
            <stop offset="40%"  stopColor="rgba(255,255,255,0.04)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.12)" />
          </linearGradient>
          {/* Clip para foto */}
          <clipPath id="center-clip">
            <circle cx={r} cy={r} r={r * 0.26} />
          </clipPath>
        </defs>

        {/* Base del disco */}
        <circle cx={r} cy={r} r={r * 0.99} fill="url(#vinyl-radial)" />

        {/* Surcos del vinilo */}
        {rings.map((ratio, i) => (
          <circle
            key={i}
            cx={r} cy={r}
            r={r * ratio}
            fill="none"
            stroke="rgba(0,0,0,0.35)"
            strokeWidth={i % 2 === 0 ? 0.7 : 0.4}
          />
        ))}

        {/* Dientes externos (spikes) */}
        {Array.from({ length: 64 }).map((_, i) => {
          const angle = (i / 64) * Math.PI * 2;
          const inner = r * 0.94;
          const outer = r * 0.985;
          const x1 = r + Math.cos(angle) * inner;
          const y1 = r + Math.sin(angle) * inner;
          const x2 = r + Math.cos(angle) * outer;
          const y2 = r + Math.sin(angle) * outer;
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="rgba(255,255,255,0.25)" strokeWidth={0.8} />
          );
        })}

        {/* Área central oscura */}
        <circle cx={r} cy={r} r={r * 0.30} fill="url(#center-grad)" />

        {/* Foto de perfil o ícono */}
        {imageUrl ? (
          <image
            href={imageUrl}
            x={r - r * 0.26}
            y={r - r * 0.26}
            width={r * 0.52}
            height={r * 0.52}
            clipPath="url(#center-clip)"
            preserveAspectRatio="xMidYMid slice"
          />
        ) : (
          <circle cx={r} cy={r} r={r * 0.26} fill="#1a1b1f" />
        )}

        {/* Agujero central */}
        <circle cx={r} cy={r} r={r * 0.04} fill="#0a0a0c" />
        <circle cx={r} cy={r} r={r * 0.025} fill="#050507" />

        {/* Brillo encima */}
        <circle cx={r} cy={r} r={r * 0.99} fill="url(#shine)" />
      </svg>
    </div>
  );
}