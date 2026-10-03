"use client";
// Sinopse em PT-BR. Se ainda não tiver tradução salva, traduz na hora.
import { useState } from "react";
import { usePtSynopsis } from "@/lib/usePtSynopsis";

export default function Synopsis({ animeId, original, pt }: { animeId: number; original: string | null; pt: string | null }) {
  const { text, status, retry } = usePtSynopsis(animeId, original, pt);
  const [showOriginal, setShowOriginal] = useState(false);

  if (!original && !text) return null;
  const shown = text && !showOriginal ? text : original;

  return (
    <section className="mt-8">
      <h2 className="font-display text-2xl mb-2">Sinopse</h2>
      <p className={`text-text/80 leading-relaxed whitespace-pre-line max-w-3xl transition ${status === "loading" ? "opacity-50" : ""}`}>{shown}</p>
      <div className="mt-2 text-xs text-muted flex flex-wrap gap-3">
        {status === "loading" && <span className="text-ki-2">⚡ Traduzindo para português…</span>}
        {status === "error" && (
          <button onClick={retry} className="text-ki-2 font-semibold hover:underline">Não deu para traduzir. Tentar de novo</button>
        )}
        {text && original && (
          <button onClick={() => setShowOriginal((s) => !s)} className="hover:text-text underline-offset-2 hover:underline">
            {showOriginal ? "Ver em português" : "Ver texto original"}
          </button>
        )}
      </div>
    </section>
  );
}
