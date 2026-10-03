import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAnimeWithPt, getShelves } from "@/lib/catalog";
import { FORMAT_PT, GENRES_PT, STATUS_PT } from "@/lib/anilist";
import { placeSpheres } from "@/lib/spheres";
import FavoriteButton from "@/components/FavoriteButton";
import AlertButton from "@/components/AlertButton";
import ShareButton from "@/components/ShareButton";
import Countdown from "@/components/Countdown";
import SphereHunt from "@/components/SphereHunt";
import Synopsis from "@/components/Synopsis";
import Comments from "@/components/Comments";

export const revalidate = 3600;

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = await getAnimeWithPt(Number((await params).id));
  if (!a) return { title: "Anime não encontrado" };
  const desc = (a.descriptionPt ?? a.description ?? "").slice(0, 160);
  return { title: a.title, description: desc, openGraph: { title: `${a.title} · KakarotoTV`, description: desc, images: [a.banner ?? a.cover] } };
}

const SEASON_PT: Record<string, string> = { WINTER: "Inverno", SPRING: "Primavera", SUMMER: "Verão", FALL: "Outono" };

export default async function AnimePage({ params }: Props) {
  const id = Number((await params).id);
  const [a, shelves] = await Promise.all([getAnimeWithPt(id), getShelves()]);
  if (!a) notFound();

  const by = Object.fromEntries(shelves.map((s) => [s.key, s]));
  const sphere = placeSpheres([...(by.trending?.items ?? []), ...(by.season?.items ?? [])]).find((p) => p.animeId === a.id);

  return (
    <article>
      {sphere && <SphereHunt sphere={sphere.sphere} x={sphere.x} y={sphere.y} />}
      <div className="relative -mt-16 h-[46vh] min-h-[320px] overflow-hidden">
        <img src={a.banner ?? a.cover} alt="" className={`absolute inset-0 w-full h-full object-cover ${a.banner ? "" : "blur-2xl scale-110"}`} />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/50 to-bg/30" />
      </div>

      <div className="relative mx-auto max-w-[1300px] px-4 md:px-8 -mt-48 md:-mt-56 grid gap-8 md:grid-cols-[260px_1fr]">
        <div className="space-y-4">
          <img src={a.cover} alt={a.title} className="w-48 md:w-full rounded-2xl shadow-2xl ring-1 ring-white/10" style={{ boxShadow: `0 30px 80px -20px ${a.coverColor ?? "#ff7a00"}` }} />
          <dl className="hidden md:grid grid-cols-2 gap-3 text-sm rounded-2xl bg-card/60 border border-line p-4">
            {[
              ["Formato", a.format ? FORMAT_PT[a.format] ?? a.format : null],
              ["Episódios", a.episodes],
              ["Status", a.status ? STATUS_PT[a.status] ?? a.status : null],
              ["Temporada", a.season ? `${SEASON_PT[a.season]} ${a.seasonYear}` : a.seasonYear],
              ["Estúdio", a.studio],
              ["Popularidade", a.popularity?.toLocaleString("pt-BR")],
            ].filter(([, v]) => v).map(([k, v]) => (
              <div key={k as string}>
                <dt className="text-muted text-xs">{k}</dt>
                <dd className="font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="pt-2 md:pt-28">
          <h1 className="font-display text-5xl md:text-6xl leading-none">{a.title}</h1>
          <div className="mt-3 flex flex-wrap gap-2 items-center">
            {a.score && <span className="rounded-full bg-ki/20 text-ki-2 font-bold px-3 py-1 text-sm">★ {(a.score / 10).toFixed(1)}</span>}
            {a.genres.map((g) => (
              <Link key={g} href={`/buscar?genero=${encodeURIComponent(g)}`} className="rounded-full border border-white/15 px-3 py-1 text-xs hover:border-ki">{GENRES_PT[g] ?? g}</Link>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {a.streams[0] && <a href={a.streams[0].url} target="_blank" rel="noreferrer" className="btn-ki rounded-full px-6 py-3">▶ Assistir legendado no {a.streams[0].site}</a>}
            <FavoriteButton anime={a} />
            {(a.status === "RELEASING" || a.status === "NOT_YET_RELEASED" || a.nextEpisode) && <AlertButton anime={a} />}
            <ShareButton title={a.title} text={`Bora assistir ${a.title}? Achei no KakarotoTV 🔥`} />
          </div>

          {a.nextEpisode && (
            <div className="mt-8 rounded-2xl border border-aura/30 bg-aura/5 p-5 flex flex-wrap items-center gap-5">
              <div>
                <p className="text-xs uppercase tracking-widest text-aura">Próximo episódio</p>
                <p className="font-display text-3xl">Episódio {a.nextEpisode.episode}</p>
                <p className="text-xs text-muted">{new Date(a.nextEpisode.airingAt * 1000).toLocaleString("pt-BR", { weekday: "long", day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })} (Brasília, no Japão)</p>
              </div>
              <Countdown at={a.nextEpisode.airingAt} big />
            </div>
          )}

          <Synopsis animeId={a.id} original={a.description} pt={a.descriptionPt ?? null} />

          <section className="mt-10">
            <h2 className="font-display text-2xl mb-1">Onde assistir com legenda PT-BR</h2>
            <p className="text-sm text-muted mb-4">Só plataformas oficiais disponíveis no Brasil com legenda em português.</p>
            {a.streams.length ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {a.streams.map((s) => (
                  <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="card-hover flex items-center gap-3 rounded-2xl border border-line bg-card p-4" style={{ ["--glow" as string]: `${s.color ?? "#ff7a00"}88` }}>
                    {s.icon ? <img src={s.icon} alt="" className="w-9 h-9 rounded-lg p-1.5" style={{ background: s.color ?? "#333" }} /> : <span className="w-9 h-9 rounded-lg" style={{ background: s.color ?? "#333" }} />}
                    <div className="min-w-0">
                      <p className="font-semibold">{s.site}</p>
                      <p className="text-xs text-ki-2 truncate">Legendado em PT-BR</p>
                    </div>
                    <span className="ml-auto text-muted">↗</span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl border border-dashed border-line p-5 text-sm text-muted">Ainda sem plataforma oficial com legenda PT-BR. Favorite para acompanhar: quando chegar, aparece aqui.</p>
            )}
          </section>

          {a.trailer && (
            <section className="mt-10">
              <h2 className="font-display text-2xl mb-3">Trailer</h2>
              <div className="aspect-video max-w-3xl overflow-hidden rounded-2xl border border-line">
                <iframe className="w-full h-full" src={`https://www.youtube-nocookie.com/embed/${a.trailer}?hl=en&cc_lang_pref=en&cc_load_policy=1`} title={`Trailer de ${a.title}`} allow="encrypted-media; picture-in-picture" allowFullScreen loading="lazy" />
              </div>
            </section>
          )}

          <Comments animeId={a.id} />
        </div>
      </div>
    </article>
  );
}
