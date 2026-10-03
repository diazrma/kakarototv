"use client";
// Esfera escondida na página de um anime — aparece flutuando e pode ser coletada
import { useEffect, useState } from "react";
import KiOrb from "./KiOrb";
import { useStore } from "@/lib/store";

export default function SphereHunt({ sphere, x, y }: { sphere: number; x: number; y: number }) {
  const { spheres, collect, ready } = useStore();
  const [show, setShow] = useState(false);
  const [toast, setToast] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), 900); return () => clearTimeout(t); }, []);

  if (!ready) return null;
  const got = spheres.includes(sphere);
  return (
    <>
      {!got && show && (
        <button
          onClick={() => { collect(sphere); setToast(true); setTimeout(() => setToast(false), 3500); }}
          className="fixed z-30 float rise cursor-pointer"
          style={{ left: `${Math.min(x, 85)}%`, top: `${Math.min(Math.max(y, 25), 75)}%` }}
          aria-label={`Coletar esfera ${sphere}`}
          title="Uma Esfera de Ki! Clique para coletar"
        >
          <KiOrb n={sphere} size={70} />
        </button>
      )}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rise flex items-center gap-3 rounded-2xl border border-ki/50 bg-bg-2/95 backdrop-blur px-5 py-3 shadow-[0_0_40px_#ff7a0055]">
          <KiOrb n={sphere} size={36} />
          <div>
            <p className="font-display text-xl text-ki-2">Esfera {sphere} coletada! +1200 de poder</p>
            <p className="text-xs text-muted">{spheres.length}/7 — {spheres.length >= 7 ? "volte ao início para invocar o desejo!" : "continue seguindo o radar."}</p>
          </div>
        </div>
      )}
    </>
  );
}
