"use client";
import { useEffect, useState } from "react";

export default function Countdown({ at, big = false }: { at: number; big?: boolean }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now() / 1000);
    const t = setInterval(() => setNow(Date.now() / 1000), 1000);
    return () => clearInterval(t);
  }, []);
  if (now === null) return <span className="tabular-nums">--</span>;
  let s = Math.max(0, Math.floor(at - now));
  const d = Math.floor(s / 86400); s %= 86400;
  const h = Math.floor(s / 3600); s %= 3600;
  const m = Math.floor(s / 60); s %= 60;
  const parts = [
    ["d", d],
    ["h", h],
    ["m", m],
    ["s", s],
  ] as const;
  if (big)
    return (
      <div className="flex gap-2">
        {parts.map(([l, v]) => (
          <div key={l} className="rounded-xl bg-black/40 border border-aura/30 px-3 py-2 text-center min-w-14">
            <div className="font-display text-3xl tabular-nums text-aura">{String(v).padStart(2, "0")}</div>
            <div className="text-[10px] uppercase text-muted">{{ d: "dias", h: "horas", m: "min", s: "seg" }[l]}</div>
          </div>
        ))}
      </div>
    );
  return <span className="tabular-nums">{d > 0 ? `${d}d ` : ""}{String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}</span>;
}
