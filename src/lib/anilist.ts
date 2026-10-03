// Cliente da API pública do AniList (GraphQL) — fonte legal de metadados.
const ENDPOINT = "https://graphql.anilist.co";

export type StreamLink = { site: string; url: string; language: string | null; color: string | null; icon: string | null };

export type Anime = {
  id: number;
  title: string;
  titleNative: string | null;
  description: string | null;
  descriptionPt?: string | null;
  cover: string;
  coverColor: string | null;
  banner: string | null;
  score: number | null;
  popularity: number;
  genres: string[];
  episodes: number | null;
  format: string | null;
  status: string | null;
  season: string | null;
  seasonYear: number | null;
  studio: string | null;
  trailer: string | null; // id do YouTube
  nextEpisode: { episode: number; airingAt: number } | null;
  streams: StreamLink[]; // só plataformas oficiais com legenda PT-BR no Brasil
  ptbr: boolean;
};

// Plataformas oficiais disponíveis no Brasil com legenda em português
const PTBR_SITES = /^(crunchyroll|netflix|amazon prime video|prime video|disney plus|disney\+|max|hbo max)$/i;

export function isPtBrStream(l: { site: string; language: string | null }) {
  return PTBR_SITES.test(l.site.trim()) || /portug/i.test(l.language ?? "");
}

const FIELDS = `
  id
  title { romaji english native }
  description(asHtml: false)
  coverImage { extraLarge color }
  bannerImage
  averageScore
  popularity
  genres
  episodes
  format
  status
  season
  seasonYear
  isAdult
  studios(isMain: true) { nodes { name } }
  trailer { id site }
  nextAiringEpisode { episode airingAt }
  externalLinks { site url type language color icon }
`;

// Nome do anime fica como no streaming BR; só traduz temporada/parte/filme
export function ptTitle(t: string): string {
  return t
    .replace(/\b(\d+)(?:st|nd|rd|th)\s+Season\b/gi, "$1ª Temporada")
    .replace(/\bSeason\s+(\d+)\b/gi, "Temporada $1")
    .replace(/\bFinal Season\b/gi, "Temporada Final")
    .replace(/\b(\d+)(?:st|nd|rd|th)\s+(?:Part|Cour)\b/gi, "Parte $1")
    .replace(/\b(?:Part|Cour)\s+(\d+)\b/gi, "Parte $1")
    .replace(/\bThe Movie\b/gi, "O Filme")
    .replace(/\bMovie\b/gi, "Filme")
    .replace(/\bSpecials?\b/gi, "Especial")
    .trim();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalize(m: any): Anime {
  const a: Anime = {
    id: m.id,
    title: ptTitle(m.title.english || m.title.romaji),
    titleNative: m.title.native,
    description: m.description ? m.description.replace(/<[^>]+>/g, "").replace(/\(Source:.*?\)/gi, "").trim() : null,
    cover: m.coverImage.extraLarge,
    coverColor: m.coverImage.color,
    banner: m.bannerImage,
    score: m.averageScore,
    popularity: m.popularity,
    genres: m.genres ?? [],
    episodes: m.episodes,
    format: m.format,
    status: m.status,
    season: m.season,
    seasonYear: m.seasonYear,
    studio: m.studios?.nodes?.[0]?.name ?? null,
    trailer: m.trailer?.site === "youtube" ? m.trailer.id : null,
    nextEpisode: m.nextAiringEpisode,
    streams: (m.externalLinks ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((l: any) => l.type === "STREAMING" && isPtBrStream(l))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((l: any) => ({ site: l.site, url: l.url, language: l.language, color: l.color, icon: l.icon })),
    ptbr: false,
  };
  a.ptbr = a.streams.length > 0;
  return a;
}

async function gql<T>(query: string, variables: Record<string, unknown> = {}, revalidate = 3600): Promise<T> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables }),
    next: { revalidate, tags: ["anilist"] },
  });
  if (!res.ok) throw new Error(`AniList ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0]?.message ?? "AniList error");
  return json.data as T;
}

export function currentSeason(d = new Date()) {
  const m = d.getMonth();
  const season = m < 3 ? "WINTER" : m < 6 ? "SPRING" : m < 9 ? "SUMMER" : "FALL";
  return { season, year: d.getFullYear() };
}

type ListOpts = { sort: string; perPage?: number; page?: number; season?: string; seasonYear?: number; status?: string; genre?: string; search?: string };

export async function listAnime(opts: ListOpts): Promise<Anime[]> {
  const query = `query ($page:Int,$perPage:Int,$sort:[MediaSort],$season:MediaSeason,$seasonYear:Int,$status:MediaStatus,$genre:String,$search:String){
    Page(page:$page, perPage:$perPage){ media(type:ANIME, isAdult:false, sort:$sort, season:$season, seasonYear:$seasonYear, status:$status, genre:$genre, search:$search){ ${FIELDS} } }
  }`;
  const data = await gql<{ Page: { media: unknown[] } }>(query, {
    page: opts.page ?? 1,
    perPage: opts.perPage ?? 20,
    sort: [opts.sort],
    season: opts.season,
    seasonYear: opts.seasonYear,
    status: opts.status,
    genre: opts.genre,
    search: opts.search,
  }, opts.search ? 600 : 3600);
  return data.Page.media.map(normalize);
}

export async function getAnime(id: number): Promise<Anime | null> {
  const query = `query ($id:Int){ Media(id:$id, type:ANIME){ ${FIELDS}
    relations { edges { relationType node { id type title { romaji english } coverImage { extraLarge } } } }
  } }`;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await gql<{ Media: any }>(query, { id });
    return data.Media && !data.Media.isAdult ? normalize(data.Media) : null;
  } catch {
    return null;
  }
}

export type ScheduleItem = { airingAt: number; episode: number; anime: Anime };

export async function getWeekSchedule(): Promise<ScheduleItem[]> {
  const now = Math.floor(Date.now() / 1000);
  const start = now - 86400;
  const end = now + 6 * 86400;
  const query = `query ($start:Int,$end:Int,$page:Int){ Page(page:$page, perPage:50){ pageInfo { hasNextPage }
    airingSchedules(airingAt_greater:$start, airingAt_lesser:$end, sort:TIME){ airingAt episode media { ${FIELDS} } } } }`;
  const out: ScheduleItem[] = [];
  for (let page = 1; page <= 4; page++) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await gql<{ Page: { pageInfo: { hasNextPage: boolean }; airingSchedules: any[] } }>(query, { start, end, page });
    for (const s of data.Page.airingSchedules) {
      if (s.media && !s.media.isAdult && s.media.popularity > 3000) out.push({ airingAt: s.airingAt, episode: s.episode, anime: normalize(s.media) });
    }
    if (!data.Page.pageInfo.hasNextPage) break;
  }
  return out;
}

export const GENRES_PT: Record<string, string> = {
  Action: "Ação", Adventure: "Aventura", Comedy: "Comédia", Drama: "Drama", Fantasy: "Fantasia",
  Horror: "Terror", "Mahou Shoujo": "Garotas Mágicas", Mecha: "Mecha", Music: "Música", Mystery: "Mistério",
  Psychological: "Psicológico", Romance: "Romance", "Sci-Fi": "Ficção Científica", "Slice of Life": "Cotidiano",
  Sports: "Esportes", Supernatural: "Sobrenatural", Thriller: "Suspense", Ecchi: "Ecchi",
};

export const STATUS_PT: Record<string, string> = {
  RELEASING: "Em lançamento", FINISHED: "Finalizado", NOT_YET_RELEASED: "Em breve", CANCELLED: "Cancelado", HIATUS: "Em hiato",
};

export const FORMAT_PT: Record<string, string> = { TV: "Série", TV_SHORT: "Curta", MOVIE: "Filme", OVA: "OVA", ONA: "ONA", SPECIAL: "Especial", MUSIC: "Clipe" };
