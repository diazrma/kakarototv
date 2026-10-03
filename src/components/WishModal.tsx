"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Anime } from "@/lib/anilist";
import { GENRES_PT } from "@/lib/anilist";
import { useStore } from "@/lib/store";
import KiOrb from "./KiOrb";
import ShareButton from "./ShareButton";
import { usePtSynopsis } from "@/lib/usePtSynopsis";

// O desejo: as 7 esferas se juntam, um pilar de luz sobe e revela um anime escolhido para você
export default function WishModal({ pool, onClose }: { pool: Anime[]; onClose: () => void }) {
  const { favorites, makeWish } = useStore();
  const [stage, setStage] = useState<"gather" | "beam" | "reveal">("gather");

  const pick = useMemo(() => {
    const favIds = new Set(favorites.map((f) => f.id));
    const candidates = pool.filter((a) => !favIds.has(a.id));
    return candidates[Math.floor(Math.random() * candidates.length)] ?? pool[0];
  }, [pool, favorites]);

  const { text: pt } = usePtSynopsis(pick?.id ?? 0, pick?.description, pick?.descriptionPt);

  useEffect(() => {
    const t1 = setTimeout(() => setStage("beam"), 1600);
    const t2 = setTimeout(() => { setStage("reveal"); makeWish(); }, 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [makeWish]);

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/90 backdrop-blur-sm p-4" role="dialog" aria-modal>
      {stage !== "reveal" && (
        <div className="relative w-72 h-72">
          {Array.from({ length: 7 }, (_, i) => {
            const a = (i / 7) * Math.PI * 2;
            const r = stage === "gather" ? 120 : 0;
            return (
              <div key={i} className="absolute left-1/2 top-1/2 transition-all duration-[1400ms] ease-in" style={{ transform: `translate(calc(-50% + ${Math.cos(a) * r}px), calc(-50% + ${Math.sin(a) * r}px))` }}>
                <KiOrb n={i + 1} size={56} className="spin-slow" />
              </div>
            );
          })}
          {stage === "beam" && <div className="absolute left-1/2 bottom-1/2 -translate-x-1/2 w-24 h-[100vh] beam bg-gradient-to-t from-ki-2 via-ki/60 to-transparent blur-md" />}
        </div>
      )}
      {stage === "reveal" && pick && (
        <div className="rise relative max-w-3xl w-full grid md:grid-cols-[220px_1fr] gap-6 rounded-3xl border border-ki/40 bg-gradient-to-br from-[#1b0d02] to-bg p-6 shadow-[0_0_120px_#ff7a0055]">
          <img src={pick.cover} alt={pick.title} className="w-40 md:w-full mx-auto rounded-2xl ring-2 ring-ki-2 aura" />
          <div>
            <p className="text-xs uppercase tracking-[.3em] text-ki-2">Seu desejo foi realizado</p>
            <h3 className="font-display text-4xl mt-1">{pick.title}</h3>
            <p className="text-sm text-muted mt-1">{pick.genres.slice(0, 3).map((g) => GENRES_PT[g] ?? g).join(" • ")}{pick.score ? ` • ★ ${(pick.score / 10).toFixed(1)}` : ""}</p>
            <p className="mt-3 text-sm line-clamp-4 text-text/80">{pt ?? pick.description}</p>
            <p className="mt-4 font-display text-2xl text-aura">+9001 DE PODER!</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href={`/anime/${pick.id}`} onClick={onClose} className="btn-ki rounded-full px-6 py-3">Ver onde assistir</Link>
              <ShareButton title="Juntei as 7 Esferas de Ki no KakarotoTV!" text={`Juntei as 7 Esferas no KakarotoTV e meu desejo foi: ${pick.title} 🐉🔥`} path="/" label="Contar pros amigos" />
              <button onClick={onClose} className="btn-ghost rounded-full px-5 py-3 text-sm">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
