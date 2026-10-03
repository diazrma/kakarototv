import type { Metadata } from "next";
import Link from "next/link";
import AnimeCard from "@/components/AnimeCard";
import { GENRES_PT, listAnime } from "@/lib/anilist";

export const metadata: Metadata = { title: "Explorar" };

type Props = { searchParams: Promise<{ q?: string; genero?: string; ordem?: string; todos?: string }> };

const ORDENS: Record<string, [string, string]> = {
  popular: ["POPULARITY_DESC", "Mais populares"],
  nota: ["SCORE_DESC", "Maior nota"],
  alta: ["TRENDING_DESC", "Em alta"],
  novos: ["START_DATE_DESC", "Mais recentes"],
};

export default async function Buscar({ searchParams }: Props) {
  const { q, genero, ordem = "popular", todos } = await searchParams;
  const sort = q ? "SEARCH_MATCH" : (ORDENS[ordem]?.[0] ?? "POPULARITY_DESC");
  const all = await listAnime({ sort, search: q || undefined, genre: genero || undefined, perPage: 50 }).catch(() => []);
  // Por padrão só mostra o que dá pra assistir com legenda PT-BR oficial
  const items = todos ? all : all.filter((a) => a.ptbr);
  const qs = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { q, genero, ordem, todos, ...patch };
    Object.entries(merged).forEach(([k, v]) => v && p.set(k, v));
    return `/buscar?${p}`;
  };

  return (
    <div className="mx-auto max-w-[1500px] px-4 md:px-8 pt-8">
      <h1 className="font-display text-5xl">{q ? <>Resultados para “{q}”</> : genero ? GENRES_PT[genero] ?? genero : "Explorar"}</h1>
      <form action="/buscar" className="mt-5 flex gap-2 max-w-xl">
        {genero && <input type="hidden" name="genero" value={genero} />}
        <input name="q" defaultValue={q} placeholder="Naruto, Frieren, One Piece…" className="flex-1 rounded-full bg-white/5 border border-line px-5 py-3 outline-none focus:border-ki" />
        <button className="btn-ki rounded-full px-6">Buscar</button>
      </form>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link href={qs({ genero: undefined })} className={`rounded-full px-3 py-1 text-sm border ${!genero ? "border-ki text-ki-2 bg-ki/10" : "border-line text-muted hover:text-text"}`}>Todos</Link>
        {Object.entries(GENRES_PT).filter(([g]) => g !== "Ecchi").map(([g, pt]) => (
          <Link key={g} href={qs({ genero: g })} className={`rounded-full px-3 py-1 text-sm border ${genero === g ? "border-ki text-ki-2 bg-ki/10" : "border-line text-muted hover:text-text"}`}>{pt}</Link>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2 items-center">
        <Link href={qs({ todos: todos ? undefined : "1" })} className={`rounded-full px-3 py-1 text-xs font-bold border ${todos ? "border-line text-muted" : "border-ki bg-ki text-black"}`}>
          {todos ? "☐ Só com legenda PT-BR" : "☑ Só com legenda PT-BR"}
        </Link>
        <span className="text-xs text-muted">{items.length} resultado{items.length === 1 ? "" : "s"}</span>
      </div>
      {!q && (
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(ORDENS).map(([k, [, label]]) => (
            <Link key={k} href={qs({ ordem: k })} className={`text-sm px-2 py-1 ${ordem === k ? "text-aura font-semibold" : "text-muted hover:text-text"}`}>{label}</Link>
          ))}
        </div>
      )}

      {items.length ? (
        <div className="mt-8 grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4 [&>a]:w-auto">
          {items.map((a) => <AnimeCard key={a.id} a={a} />)}
        </div>
      ) : (
        <p className="mt-16 text-center text-muted">Nada encontrado. Nem com o radar… tente outro nome.</p>
      )}
    </div>
  );
}
