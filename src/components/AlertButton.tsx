"use client";
// Marca o anime para avisar quando sair episódio novo (aparece no sininho).
import type { Anime } from "@/lib/anilist";
import { useStore } from "@/lib/store";

export default function AlertButton({ anime }: { anime: Pick<Anime, "id" | "title" | "cover"> }) {
  const { hasAlert, toggleAlert, ready } = useStore();
  const on = ready && hasAlert(anime.id);
  return (
    <button
      onClick={() => {
        // pede permissão para o alerta do navegador junto com o clique
        if (!on && "Notification" in window && Notification.permission === "default") Notification.requestPermission();
        toggleAlert({ id: anime.id, title: anime.title, cover: anime.cover });
      }}
      aria-pressed={on}
      className={`rounded-full px-5 py-3 text-sm font-semibold transition ${on ? "bg-aura/20 border border-aura text-aura" : "btn-ghost"}`}
      title={on ? "Parar de avisar" : "Receber aviso quando sair episódio novo"}
    >
      {on ? "🔔 Avisando episódios" : "🔕 Avisar episódios"}
    </button>
  );
}
