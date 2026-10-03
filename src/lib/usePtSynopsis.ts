"use client";
// Sinopse em PT-BR em qualquer componente: se o catálogo ainda não tem a
// tradução salva, pede para /api/translate (que traduz uma vez e guarda).
// Se o servidor não conseguir, o próprio navegador do visitante traduz
// pelo Google (cada pessoa usa o próprio IP, então não é bloqueado).
import { useEffect, useState } from "react";

const LS = "kakarototv:pt:";
const cache = new Map<number, Promise<string | null>>();

async function viaServer(id: number): Promise<string | null> {
  const r = await fetch("/api/translate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) });
  if (!r.ok) return null;
  return ((await r.json())?.text as string | undefined) ?? null;
}

async function viaBrowser(text: string): Promise<string | null> {
  const r = await fetch("https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=pt&dt=t", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ q: text.slice(0, 4000) }),
  });
  if (!r.ok) return null;
  const json = await r.json();
  const out = (json?.[0] ?? []).map((p: unknown[]) => p?.[0] ?? "").join("").trim();
  return out || null;
}

function fetchPt(id: number, original: string): Promise<string | null> {
  if (!cache.has(id)) {
    const p = (async () => {
      try {
        const saved = localStorage.getItem(LS + id);
        if (saved) return saved;
      } catch {}
      const t = (await viaServer(id).catch(() => null)) ?? (await viaBrowser(original).catch(() => null));
      if (t) {
        try {
          localStorage.setItem(LS + id, t);
        } catch {}
      } else cache.delete(id); // falhou: deixa tentar de novo depois
      return t;
    })();
    cache.set(id, p);
  }
  return cache.get(id)!;
}

export function usePtSynopsis(id: number, original: string | null | undefined, pt: string | null | undefined) {
  const [text, setText] = useState<string | null>(pt ?? null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">(!pt && original ? "loading" : "idle");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setText(pt ?? null);
    if (pt || !original) return setStatus("idle");
    let alive = true;
    setStatus("loading");
    fetchPt(id, original).then((t) => {
      if (!alive) return;
      setText(t);
      setStatus(t ? "idle" : "error");
    });
    return () => {
      alive = false;
    };
  }, [id, original, pt, attempt]);

  return { text, status, retry: () => setAttempt((n) => n + 1) };
}
