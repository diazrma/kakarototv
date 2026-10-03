// Garante sinopse em PT-BR no servidor: usa a tradução salva no Supabase ou
// traduz agora e guarda, para cada anime ser traduzido uma vez só.
import type { Anime } from "./anilist";
import { translateToPt } from "./translate";
import { getAdminSupabase } from "./supabase/server";

const memo = new Map<number, string>(); // cache do processo (vale também sem Supabase)

export async function ensurePt<T extends Anime>(list: T[], max = 12): Promise<T[]> {
  for (const a of list) if (!a.descriptionPt && memo.has(a.id)) a.descriptionPt = memo.get(a.id);
  const pending = list.filter((a) => a.description && !a.descriptionPt).slice(0, max);
  if (!pending.length) return list;

  const admin = getAdminSupabase();
  await Promise.all(
    pending.map(async (a) => {
      const pt = await translateToPt(a.description!);
      if (!pt) return;
      a.descriptionPt = pt;
      memo.set(a.id, pt);
      await admin?.from("animes").upsert({ id: a.id, data: { ...a, descriptionPt: undefined }, description_pt: pt, updated_at: new Date().toISOString() });
    }),
  );
  return list;
}
