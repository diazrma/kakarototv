"use client";
import { useRef } from "react";
import type { Anime } from "@/lib/anilist";
import AnimeCard from "./AnimeCard";

export default function Shelf({ title, subtitle, items, ranked = false }: { title: string; subtitle?: string; items: Anime[]; ranked?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });
  if (!items.length) return null;
  return (
    <section className="relative group/shelf">
      <div className="mx-auto max-w-[1500px] px-4 md:px-8 flex items-end justify-between mb-3">
        <div>
          <h2 className="font-display text-3xl md:text-4xl">{title}</h2>
          {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
        </div>
        <div className="hidden md:flex gap-2 opacity-0 group-hover/shelf:opacity-100 transition">
          <button onClick={() => scroll(-1)} className="btn-ghost w-9 h-9 rounded-full" aria-label="Voltar">‹</button>
          <button onClick={() => scroll(1)} className="btn-ghost w-9 h-9 rounded-full" aria-label="Avançar">›</button>
        </div>
      </div>
      <div ref={ref} className="no-scrollbar flex gap-3 md:gap-4 overflow-x-auto snap-x px-4 md:px-8 py-4 scroll-px-4 md:scroll-px-8 max-w-[1500px] mx-auto">
        {items.map((a, i) => (
          <AnimeCard key={a.id} a={a} rank={ranked && i < 10 ? i + 1 : undefined} />
        ))}
      </div>
    </section>
  );
}
