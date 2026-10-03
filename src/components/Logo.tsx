import Link from "next/link";

// Emblema original: esfera de ki com um raio cortando, + wordmark
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden className="shrink-0 ki-glow">
      <defs>
        <radialGradient id="lm-g" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#fff7d6" />
          <stop offset="30%" stopColor="#ffc94d" />
          <stop offset="75%" stopColor="#ff7a00" />
          <stop offset="100%" stopColor="#a33600" />
        </radialGradient>
        <linearGradient id="lm-b" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e0f7ff" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="27" fill="url(#lm-g)" />
      <ellipse cx="32" cy="34" rx="30" ry="9" fill="none" stroke="#38bdf8" strokeWidth="2.5" transform="rotate(-20 32 34)" opacity=".9" />
      <path d="M36 8 L22 35 L31 35 L26 56 L44 26 L34 26 L40 8 Z" fill="url(#lm-b)" stroke="#06121f" strokeWidth="2" strokeLinejoin="round" />
      <ellipse cx="22" cy="18" rx="8" ry="4.5" fill="#fff" opacity=".55" transform="rotate(-30 22 18)" />
    </svg>
  );
}

export default function Logo({ big = false }: { big?: boolean }) {
  return (
    <Link href="/" className={`logo select-none inline-flex items-center gap-2 ${big ? "text-4xl md:text-5xl" : "text-[26px]"}`} aria-label="KakarotoTV — início">
      <LogoMark size={big ? 54 : 34} />
      <span className="inline-flex items-center gap-1.5">
        <span className="logo-k">KAKAROTO</span>
        <span className="logo-tv">TV</span>
      </span>
    </Link>
  );
}
