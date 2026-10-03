// Esfera de Ki — arte original do KakarotoTV: núcleo de energia com N faíscas orbitando.
type Props = { n: number; size?: number; dim?: boolean; className?: string };

export default function KiOrb({ n, size = 48, dim = false, className = "" }: Props) {
  const id = `ki${n}${size}${dim ? "d" : ""}`;
  const sparks = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const r = n === 1 ? 0 : 13;
    return { x: 50 + Math.cos(a) * r, y: 52 + Math.sin(a) * r };
  });
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={`${dim ? "opacity-25 grayscale" : "ki-glow"} ${className}`} aria-label={`Esfera de ${n} faísca${n > 1 ? "s" : ""}`}>
      <defs>
        <radialGradient id={`${id}g`} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#fff7d6" />
          <stop offset="25%" stopColor="#ffc94d" />
          <stop offset="70%" stopColor="#ff7a00" />
          <stop offset="100%" stopColor="#b33c00" />
        </radialGradient>
        <radialGradient id={`${id}c`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity=".9" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill={`url(#${id}g)`} />
      {/* anéis de energia */}
      <ellipse cx="50" cy="52" rx="34" ry="12" fill="none" stroke="#fff3" strokeWidth="1.5" transform="rotate(-18 50 52)" />
      <ellipse cx="50" cy="52" rx="30" ry="9" fill="none" stroke="#ffffff22" strokeWidth="1" transform="rotate(24 50 52)" />
      {sparks.map((s, i) => (
        <path
          key={i}
          d={`M${s.x} ${s.y - 7} L${s.x + 2} ${s.y - 2} L${s.x + 7} ${s.y} L${s.x + 2} ${s.y + 2} L${s.x} ${s.y + 7} L${s.x - 2} ${s.y + 2} L${s.x - 7} ${s.y} L${s.x - 2} ${s.y - 2} Z`}
          fill="#e0f2ff"
          stroke="#38bdf8"
          strokeWidth="1"
        />
      ))}
      <ellipse cx="34" cy="26" rx="14" ry="8" fill={`url(#${id}c)`} transform="rotate(-30 34 26)" />
    </svg>
  );
}
