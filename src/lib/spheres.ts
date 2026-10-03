// Caça às Esferas de Ki: todo dia 7 esferas se escondem em páginas de animes do catálogo.
// O sorteio é determinístico pelo dia (UTC-3), então todo mundo caça as mesmas esferas.
export function todayKey(d = new Date()) {
  const br = new Date(d.getTime() - 3 * 3600 * 1000);
  return br.toISOString().slice(0, 10);
}

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export type SpherePlacement = { sphere: number; animeId: number; hint: string; x: number; y: number };

export function placeSpheres(pool: { id: number; title: string; genres: string[] }[], day = todayKey()): SpherePlacement[] {
  const uniq = [...new Map(pool.map((a) => [a.id, a])).values()].sort((a, b) => hash(day + a.id) - hash(day + b.id));
  return uniq.slice(0, 7).map((a, i) => {
    const h = hash(day + ":" + a.id);
    const genre = a.genres[h % Math.max(1, a.genres.length)] ?? "Anime";
    return {
      sphere: i + 1,
      animeId: a.id,
      hint: `${genre} • começa com “${a.title.charAt(0).toUpperCase()}”`,
      x: 8 + (h % 80),
      y: 20 + ((h >> 8) % 60),
    };
  });
}

export function powerLevel(p: { favorites: number; spheres: number; wishes: number }) {
  return 1000 + p.favorites * 500 + p.spheres * 1200 + p.wishes * 9001;
}

export function powerRank(level: number) {
  if (level >= 50000) return "Lenda Lendária";
  if (level >= 25000) return "Guerreiro Supremo";
  if (level > 9000) return "Mais de 9000!";
  if (level >= 5000) return "Guerreiro de Elite";
  if (level >= 2500) return "Lutador";
  return "Recruta";
}
