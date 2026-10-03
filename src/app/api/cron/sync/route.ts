// Robô diário do KakarotoTV: puxa o catálogo novo do AniList, traduz sinopses
// para PT-BR (Google Tradutor) e salva no Supabase. Disparado pelo Vercel Cron.
import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { fetchShelvesLive } from "@/lib/catalog";
import { getAdminSupabase } from "@/lib/supabase/server";
import type { Anime } from "@/lib/anilist";
import { translateToPt } from "@/lib/translate";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  revalidateTag("anilist"); // força dados frescos do AniList
  const shelves = await fetchShelvesLive();
  const sb = getAdminSupabase();
  let saved = 0;
  let translated = 0;

  if (sb) {
    const all = new Map<number, Anime>();
    shelves.forEach((s) => s.items.forEach((a) => all.set(a.id, a)));

    const [{ data: existing }, { count: total }] = await Promise.all([
      sb.from("animes").select("id,description_pt").in("id", [...all.keys()]),
      sb.from("animes").select("id", { count: "exact", head: true }),
    ]);
    const hasPt = new Set((existing ?? []).filter((r) => r.description_pt).map((r) => r.id));
    const newIds = [...all.keys()].filter((id) => !(existing ?? []).some((r) => r.id === id));
    const isNew = newIds.length;

    const rows = [...all.values()].map((a) => ({ id: a.id, data: a, updated_at: new Date().toISOString() }));
    const { error } = await sb.from("animes").upsert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    saved = rows.length;

    // Avisa a galera dos animes que acabaram de entrar no catálogo
    // (na primeira execução tudo é "novo", então não notifica)
    if (total && newIds.length) {
      await sb.from("notifications").insert(
        newIds.slice(0, 30).map((id) => {
          const a = all.get(id)!;
          return { anime_id: a.id, title: a.title, cover: a.cover, kind: "new_anime" };
        }),
      );
    }

    // Traduz as sinopses que faltam (10 por vez, para caber no tempo do cron)
    const pending = [...all.values()].filter((a) => a.description && !hasPt.has(a.id)).slice(0, 200);
    for (let i = 0; i < pending.length; i += 10) {
      await Promise.all(
        pending.slice(i, i + 10).map(async (a) => {
          const pt = await translateToPt(a.description!);
          if (!pt) return;
          await sb.from("animes").update({ description_pt: pt }).eq("id", a.id);
          translated++;
        }),
      );
    }

    await sb.from("shelves").upsert(
      shelves.map((s, i) => ({ key: s.key, title: s.title, subtitle: s.subtitle ?? null, anime_ids: s.items.map((a) => a.id), position: i })),
    );
    await sb.from("sync_log").insert({ animes: saved, new_animes: isNew, translated });
  }

  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true, shelves: shelves.map((s) => [s.key, s.items.length]), saved, translated });
}
