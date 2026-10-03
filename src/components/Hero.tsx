"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Anime } from "@/lib/anilist";
import { GENRES_PT } from "@/lib/anilist";
import FavoriteButton from "./FavoriteButton";
import { usePtSynopsis } from "@/lib/usePtSynopsis";

export default function Hero({ items }: { items: Anime[] }) {
  const list = items.filter((a) => a.banner).slice(0, 6);
  const [i, setI] = useState(0);
  const [trailer, setTrailer] = useState(false);

  useEffect(() => {
    if (trailer || list.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % list.length), 7000);
    return () => clearInterval(t);
  }, [trailer, list.length]);

  const a = list[i] as Anime | undefined;
  const { text: pt, status } = usePtSynopsis(a?.id ?? 0, a?.description, a?.descriptionPt);

  if (!a) return null;
  const desc = pt ?? (status === "loading" ? null : a.description);

  return (
    <section className="relative -mt-16 h-[78vh] min-h-[540px] max-h-[860px] overflow-hidden">
      {list.map((x, k) => (
        <img
          key={x.id}
          src={x.banner!}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover transition-all duration-[1500ms] ${k === i ? "opacity-100 scale-105" : "opacity-0 scale-100"}`}
          style={{ transitionProperty: "opacity, transform", transitionDuration: k === i ? "1500ms, 8000ms" : "1500ms, 0ms" }}
        />
      ))}
      {trailer && a.trailer && (
        <iframe
          className="absolute inset-0 h-full w-full scale-[1.35] pointer-events-none"
          src={`https://www.youtube-nocookie.com/embed/${a.trailer}?autoplay=1&mute=1&controls=0&loop=1&playlist=${a.trailer}&modestbranding=1`}
          allow="autoplay; encrypted-media"
          title="Trailer"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-bg/40" />

      <div className="relative mx-auto max-w-[1500px] h-full px-4 md:px-8 flex flex-col justify-end pb-16 md:pb-24">
        <div key={a.id} className="max-w-2xl rise">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-ki/15 border border-ki/40 px-3 py-1 text-xs font-bold uppercase tracking-widest text-ki-2">
            <span className="h-1.5 w-1.5 rounded-full bg-ki animate-pulse" /> #{i + 1} em alta hoje
          </p>
          <h1 className="font-display text-5xl md:text-7xl leading-[.95] drop-shadow-[0_4px_30px_#000]">{a.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted">
            {a.score && <span className="font-bold text-ki-2">★ {(a.score / 10).toFixed(1)}</span>}
            {a.seasonYear && <span>{a.seasonYear}</span>}
            {a.episodes && <span>{a.episodes} eps</span>}
            {a.genres.slice(0, 3).map((g) => (
              <span key={g} className="rounded-full border border-white/15 px-2 py-0.5 text-xs">{GENRES_PT[g] ?? g}</span>
            ))}
          </div>
          {desc && <p className="mt-4 text-sm md:text-base text-text/80 line-clamp-3 max-w-xl">{desc}</p>}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/anime/${a.id}`} className="btn-ki rounded-full px-6 py-3 text-base">▶ Onde assistir</Link>
            {a.trailer && (
              <button onClick={() => setTrailer((t) => !t)} className="btn-ghost rounded-full px-5 py-3 text-sm font-semibold">
                {trailer ? "■ Parar trailer" : "Ver trailer aqui"}
              </button>
            )}
            <FavoriteButton anime={a} />
          </div>
        </div>
        <div className="mt-8 flex gap-2">
          {list.map((x, k) => (
            <button key={x.id} onClick={() => { setI(k); setTrailer(false); }} aria-label={x.title} className={`h-1.5 rounded-full transition-all ${k === i ? "w-10 bg-ki" : "w-4 bg-white/25 hover:bg-white/50"}`} />
          ))}
        </div>
      </div>
    </section>
  );
}
