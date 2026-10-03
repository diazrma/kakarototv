import Link from "next/link";
import type { Anime } from "@/lib/anilist";
import { GENRES_PT } from "@/lib/anilist";

export default function AnimeCard({ a, rank }: { a: Anime; rank?: number }) {
  return (
    <Link
      href={`/anime/${a.id}`}
      className="card-hover group relative block shrink-0 w-[150px] md:w-[180px] snap-start"
      style={{ ["--glow" as string]: `${a.coverColor ?? "#ff7a00"}99` }}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-card ring-1 ring-white/5">
        <img src={a.cover} alt={a.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent opacity-80" />
        {a.score ? (
          <span className="absolute top-2 right-2 rounded-md bg-black/70 backdrop-blur px-1.5 py-0.5 text-xs font-bold text-ki-2">★ {(a.score / 10).toFixed(1)}</span>
        ) : null}
        {a.nextEpisode && (
          <span className="absolute top-2 left-2 rounded-md bg-aura/90 px-1.5 py-0.5 text-[10px] font-bold text-black">EP {a.nextEpisode.episode} EM BREVE</span>
        )}
        {a.ptbr && (
          <span className="absolute bottom-2 right-2 rounded bg-ki px-1.5 py-0.5 text-[9px] font-extrabold text-black tracking-wide">LEG PT-BR</span>
        )}
        {rank && (
          <span className="absolute -left-1 bottom-1 font-display text-6xl leading-none text-transparent [-webkit-text-stroke:2px_#ffc94d] drop-shadow-[0_0_10px_#ff7a00]">{rank}</span>
        )}
        <div className="absolute bottom-0 inset-x-0 p-2.5 translate-y-2 group-hover:translate-y-0 transition">
          <p className={`text-sm font-semibold leading-tight line-clamp-2 ${rank ? "pl-8" : ""}`}>{a.title}</p>
          <p className="mt-1 text-[11px] text-muted opacity-0 group-hover:opacity-100 transition line-clamp-1">{a.genres.slice(0, 2).map((g) => GENRES_PT[g] ?? g).join(" • ")}</p>
        </div>
      </div>
    </Link>
  );
}
