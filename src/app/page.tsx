import Hero from "@/components/Hero";
import Shelf from "@/components/Shelf";
import Radar from "@/components/Radar";
import { getShelves } from "@/lib/catalog";
import { placeSpheres } from "@/lib/spheres";
import { GENRES_PT } from "@/lib/anilist";
import { ensurePt } from "@/lib/translate-store";
import Link from "next/link";

export const revalidate = 3600;

export default async function Home() {
  const shelves = await getShelves();
  const by = Object.fromEntries(shelves.map((s) => [s.key, s]));
  const pool = [...(by.trending?.items ?? []), ...(by.season?.items ?? [])];
  const placements = placeSpheres(pool);
  // destaques do topo já chegam traduzidos
  await ensurePt((by.trending?.items ?? []).filter((a) => a.banner).slice(0, 6));

  return (
    <div className="space-y-12 md:space-y-16">
      <Hero items={by.trending?.items ?? []} />
      {by.trending && <Shelf title="Top 10 de hoje" subtitle={by.trending.subtitle} items={by.trending.items.slice(0, 10)} ranked />}
      <Radar placements={placements} wishPool={[...(by.top?.items ?? []), ...(by.season?.items ?? [])]} />
      {shelves.filter((s) => s.key !== "trending").map((s) => (
        <Shelf key={s.key} title={s.title} subtitle={s.subtitle} items={s.items} />
      ))}
      <Shelf title="Ainda em alta" subtitle="Mais do que está bombando" items={by.trending?.items.slice(10) ?? []} />

      <section className="mx-auto max-w-[1500px] px-4 md:px-8">
        <h2 className="font-display text-3xl md:text-4xl mb-4">Escolha seu estilo de luta</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {["Action", "Adventure", "Comedy", "Fantasy", "Romance", "Sci-Fi", "Mystery", "Slice of Life", "Sports", "Horror", "Supernatural", "Mecha"].map((g, i) => (
            <Link
              key={g}
              href={`/buscar?genero=${encodeURIComponent(g)}`}
              className="card-hover relative overflow-hidden rounded-2xl border border-line p-4 h-24 flex items-end font-display text-2xl"
              style={{ background: `linear-gradient(135deg, hsl(${(i * 31 + 20) % 360} 80% 45% / .35), transparent 70%), var(--card)` }}
            >
              {GENRES_PT[g] ?? g}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
