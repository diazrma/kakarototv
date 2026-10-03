// Camada de catálogo: prefere o snapshot que o robô diário salvou no Supabase
// (com sinopses traduzidas para PT-BR); se não houver, consulta o AniList ao vivo.
import { currentSeason, getAnime, listAnime, ptTitle, type Anime } from "./anilist";
import { getPublicSupabase } from "./supabase/server";
import { ensurePt } from "./translate-store";

export type Shelf = { key: string; title: string; subtitle?: string; items: Anime[] };

const SHELF_DEFS = () => {
  const { season, year } = currentSeason();
  return [
    { key: "trending", title: "Em alta agora", subtitle: "O que a galera está maratonando", opts: { sort: "TRENDING_DESC", perPage: 50 }, ptbrOnly: true },
    { key: "season", title: "Temporada atual", subtitle: "Lançamentos desta temporada", opts: { sort: "POPULARITY_DESC", season, seasonYear: year, perPage: 50 }, ptbrOnly: true },
    { key: "top", title: "Lendários", subtitle: "As maiores notas de todos os tempos", opts: { sort: "SCORE_DESC", perPage: 50 }, ptbrOnly: true },
    { key: "action", title: "Batalhas épicas", subtitle: "Para quem gosta de poder acima de 8000", opts: { sort: "POPULARITY_DESC", genre: "Action", perPage: 50 }, ptbrOnly: true },
    { key: "upcoming", title: "Em breve", subtitle: "Prepare o ki", opts: { sort: "POPULARITY_DESC", status: "NOT_YET_RELEASED", perPage: 24 }, ptbrOnly: false },
  ] as const;
};

export async function fetchShelvesLive(): Promise<Shelf[]> {
  const defs = SHELF_DEFS();
  const lists = await Promise.all(defs.map((d) => listAnime({ ...d.opts }).catch(() => [] as Anime[])));
  // Só entra na prateleira quem tem legenda PT-BR oficial (exceto “Em breve”, que ainda não estreou)
  return defs.map((d, i) => ({ key: d.key, title: d.title, subtitle: d.subtitle, items: (d.ptbrOnly ? lists[i].filter((a) => a.ptbr) : lists[i]).slice(0, 30) }));
}

export async function getShelves(): Promise<Shelf[]> {
  const sb = getPublicSupabase();
  if (sb) {
    const { data } = await sb.from("shelves").select("key,title,subtitle,anime_ids,position").order("position");
    if (data?.length) {
      const ids = [...new Set(data.flatMap((s) => s.anime_ids as number[]))];
      const { data: rows } = await sb.from("animes").select("id,data,description_pt").in("id", ids);
      const map = new Map((rows ?? []).map((r) => [r.id as number, { ...(r.data as Anime), title: ptTitle((r.data as Anime).title), descriptionPt: r.description_pt as string | null }]));
      return data.map((s) => ({
        key: s.key,
        title: s.title,
        subtitle: s.subtitle ?? undefined,
        items: (s.anime_ids as number[]).map((id) => map.get(id)).filter(Boolean) as Anime[],
      }));
    }
  }
  return fetchShelvesLive();
}

export async function getAnimeWithPt(id: number): Promise<Anime | null> {
  const anime = await getAnime(id);
  if (!anime) return null;
  const sb = getPublicSupabase();
  if (sb) {
    const { data } = await sb.from("animes").select("description_pt").eq("id", id).maybeSingle();
    if (data?.description_pt) anime.descriptionPt = data.description_pt;
  }
  await ensurePt([anime]);
  return anime;
}
