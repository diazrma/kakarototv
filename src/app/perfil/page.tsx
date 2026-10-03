"use client";
import Link from "next/link";
import KiOrb from "@/components/KiOrb";
import ShareButton from "@/components/ShareButton";
import { useStore } from "@/lib/store";
import { powerRank } from "@/lib/spheres";

export default function Perfil() {
  const { user, ready, favorites, spheres, wishes, power, signOut, toggleFav } = useStore();
  const rank = powerRank(power);
  const pct = Math.min(100, (power / 50000) * 100);

  return (
    <div className="mx-auto max-w-[1300px] px-4 md:px-8 pt-8">
      <section className="relative overflow-show rounded-3xl border border-line bg-gradient-to-br from-[#1b0d02] via-bg-2 to-[#0b1426] p-6 md:p-10">
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-ki/20 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-6">
          <div className="grid place-items-center w-24 h-24 rounded-full bg-gradient-to-br from-ki to-aura-2 font-display text-5xl aura">
            {user?.email?.[0].toUpperCase() ?? "?"}
          </div>
          <div className="flex-1 min-w-[220px]">
            <p className="text-xs uppercase tracking-[.3em] text-aura">Minha Saga</p>
            <h1 className="font-display text-4xl md:text-5xl">{user?.email?.split("@")[0] ?? "Guerreiro anônimo"}</h1>
            <p className="text-muted text-sm">{user ? "Progresso salvo na nuvem" : "Seu progresso está salvo só neste navegador."}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-widest text-muted">Nível de poder</p>
            <p className="font-display text-6xl text-ki-2 tabular-nums drop-shadow-[0_0_20px_#ff7a00]">{ready ? power.toLocaleString("pt-BR") : "…"}</p>
            <p className="font-bold text-aura">{rank}</p>
          </div>
        </div>
        <div className="relative mt-6 h-3 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-ki via-ki-2 to-aura transition-all duration-1000" style={{ width: `${pct}%` }} />
        </div>
        <div className="relative mt-6 flex flex-wrap items-center gap-3">
          {Array.from({ length: 7 }, (_, i) => <KiOrb key={i} n={i + 1} size={44} dim={!spheres.includes(i + 1)} />)}
          <span className="text-sm text-muted ml-2">{spheres.length}/7 hoje • {wishes} desejo{wishes === 1 ? "" : "s"} realizado{wishes === 1 ? "" : "s"}</span>
        </div>
        <div className="relative mt-6 flex flex-wrap gap-3">
          <ShareButton title="Meu nível de poder no KakarotoTV" text={`Meu nível de poder no KakarotoTV é ${power.toLocaleString("pt-BR")} (${rank}). Consegue me passar? 💥`} path="/" label="Desafiar amigos" />
          {user ? (
            <button onClick={signOut} className="btn-ghost rounded-full px-5 py-3 text-sm">Sair</button>
          ) : (
            <Link href="/login" className="btn-ki rounded-full px-6 py-3">Entrar para salvar na nuvem</Link>
          )}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-4xl mb-4">Meus favoritos <span className="text-muted text-2xl">({favorites.length})</span></h2>
        {favorites.length ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
            {favorites.map((f) => (
              <div key={f.id} className="group relative">
                <Link href={`/anime/${f.id}`} className="card-hover block">
                  <img src={f.cover} alt={f.title} className="aspect-[2/3] w-full object-cover rounded-xl" />
                  <p className="mt-2 text-sm font-semibold line-clamp-2">{f.title}</p>
                </Link>
                <button onClick={() => toggleFav(f)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition rounded-full bg-black/70 w-8 h-8 text-sm" aria-label="Remover">✕</button>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-line p-8 text-center text-muted">
            Nenhum favorito ainda. Cada favorito vale <b className="text-ki-2">+500 de poder</b>. <Link href="/" className="text-ki underline">Começar a explorar</Link>
          </p>
        )}
      </section>
    </div>
  );
}
