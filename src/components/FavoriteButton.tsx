"use client";
import { useState } from "react";
import type { Anime } from "@/lib/anilist";
import { useStore } from "@/lib/store";

export default function FavoriteButton({ anime, compact = false }: { anime: Pick<Anime, "id" | "title" | "cover">; compact?: boolean }) {
  const { isFav, toggleFav, ready } = useStore();
  const [burst, setBurst] = useState(false);
  const fav = ready && isFav(anime.id);
  return (
    <button
      onClick={() => {
        if (!fav) {
          setBurst(true);
          setTimeout(() => setBurst(false), 600);
        }
        toggleFav({ id: anime.id, title: anime.title, cover: anime.cover });
      }}
      className={`relative rounded-full font-semibold transition ${compact ? "w-11 h-11 grid place-items-center" : "px-5 py-3 text-sm"} ${fav ? "bg-ki/20 border border-ki text-ki-2" : "btn-ghost"}`}
      aria-pressed={fav}
      title={fav ? "Remover dos favoritos" : "Favoritar (+500 de poder)"}
    >
      {burst && <span className="absolute inset-0 rounded-full aura" />}
      <span className={burst ? "inline-block scale-125 transition" : ""}>{fav ? "★" : "☆"}</span>
      {!compact && <span className="ml-2">{fav ? "Na sua lista" : "Favoritar"}</span>}
    </button>
  );
}
