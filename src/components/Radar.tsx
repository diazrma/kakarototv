"use client";
// Radar das Esferas de Ki: mostra as pistas do dia e quais já foram coletadas.
import Link from "next/link";
import { useState } from "react";
import KiOrb from "./KiOrb";
import WishModal from "./WishModal";
import type { SpherePlacement } from "@/lib/spheres";
import type { Anime } from "@/lib/anilist";
import { useStore, useWishUsedToday } from "@/lib/store";

export default function Radar({ placements, wishPool }: { placements: SpherePlacement[]; wishPool: Anime[] }) {
  const { spheres, ready } = useStore();
  const wishUsed = useWishUsedToday();
  const [wish, setWish] = useState(false);
  const [reveal, setReveal] = useState<number | null>(null);
  const done = ready && spheres.length >= 7;

  return (
    <section className="mx-auto max-w-[1500px] px-4 md:px-8">
      <div className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-[#12101c] via-[#0c0a12] to-[#1b0d02] p-6 md:p-10 grid gap-8 md:grid-cols-[320px_1fr] items-center">
        {/* tela do radar */}
        <div className="relative mx-auto aspect-square w-full max-w-[320px] rounded-full border-4 border-[#2c3a2a] bg-[radial-gradient(circle,#0f2a1c_0%,#071510_70%)] shadow-[inset_0_0_60px_#000,0_0_40px_#22c55e22] overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(#22c55e22_1px,transparent_1px),linear-gradient(90deg,#22c55e22_1px,transparent_1px)] bg-[size:12.5%_12.5%]" />
          <div className="absolute inset-0 radar-sweep rounded-full" style={{ background: "conic-gradient(from 0deg, #22c55e00 0deg, #22c55e66 40deg, #22c55e00 50deg)" }} />
          {placements.map((p) => {
            const got = ready && spheres.includes(p.sphere);
            return (
              <button
                key={p.sphere}
                onClick={() => setReveal(p.sphere)}
                className={`absolute -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full ${got ? "bg-white/20" : "bg-ki-2 blip"}`}
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
                aria-label={`Esfera ${p.sphere}`}
              />
            );
          })}
          <div className="absolute left-1/2 top-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500 shadow-[0_0_10px_red]" />
        </div>

        <div>
          <p className="text-xs uppercase tracking-[.3em] text-aura">Radar de Esferas • muda todo dia</p>
          <h2 className="font-display text-4xl md:text-5xl mt-1">Junte as 7 Esferas de Ki</h2>
          <p className="text-muted mt-2 max-w-xl">
            Hoje, 7 esferas estão escondidas nas páginas de animes do catálogo. Use as pistas, encontre e colete. Com as sete você invoca um <b className="text-ki-2">desejo</b> e ganha <b className="text-ki-2">+9001 de poder</b>.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {placements.map((p) => {
              const got = ready && spheres.includes(p.sphere);
              return (
                <button key={p.sphere} onClick={() => setReveal(p.sphere)} className={`transition ${reveal === p.sphere ? "scale-110" : "hover:scale-105"}`}>
                  <KiOrb n={p.sphere} size={52} dim={!got} className={got ? "float" : ""} />
                </button>
              );
            })}
          </div>

          <div className="mt-5 min-h-12">
            {reveal && (() => {
              const p = placements.find((x) => x.sphere === reveal)!;
              const got = spheres.includes(p.sphere);
              return (
                <p key={reveal} className="rise text-sm">
                  <b className="text-ki-2">Esfera {p.sphere}:</b> {got ? "já coletada ✓" : <>pista: <span className="text-aura">{p.hint}</span></>}
                </p>
              );
            })()}
          </div>

          {done && !wishUsed ? (
            <button onClick={() => setWish(true)} className="btn-ki aura rounded-full px-8 py-4 text-lg mt-2 shake">
              ✦ INVOCAR O DESEJO ✦
            </button>
          ) : wishUsed ? (
            <p className="text-sm text-muted">Desejo de hoje já realizado. As esferas se espalham de novo amanhã. 🌅</p>
          ) : (
            <Link href={`/anime/${placements.find((p) => !spheres.includes(p.sphere))?.animeId ?? ""}`} className="text-sm text-muted underline decoration-dotted hover:text-text">
              Travou? Dica secreta: siga o radar até a próxima esfera →
            </Link>
          )}
        </div>
      </div>
      {wish && <WishModal pool={wishPool} onClose={() => setWish(false)} />}
    </section>
  );
}
