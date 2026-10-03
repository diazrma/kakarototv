// Robô diário do KakarotoTV: puxa o catálogo novo do AniList, traduz sinopses
// para PT-BR (opcional, via Claude) e salva no Supabase. Disparado pelo Vercel Cron.
import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { fetchShelvesLive } from "@/lib/catalog";
import { getAdminSupabase } from "@/lib/supabase/server";
import type { Anime } from "@/lib/anilist";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

async function translate(text: string): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: `Traduza esta sinopse de anime para português do Brasil, com linguagem natural. Responda só com a tradução.\n\n${text}` }],
    }),
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.content?.[0]?.text?.trim() ?? null;
}

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

    const { data: existing } = await sb.from("animes").select("id,description_pt").in("id", [...all.keys()]);
    const hasPt = new Set((existing ?? []).filter((r) => r.description_pt).map((r) => r.id));
    const isNew = [...all.keys()].filter((id) => !(existing ?? []).some((r) => r.id === id)).length;

    const rows = [...all.values()].map((a) => ({ id: a.id, data: a, updated_at: new Date().toISOString() }));
    const { error } = await sb.from("animes").upsert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    saved = rows.length;

    // Traduz no máximo 40 por execução para caber no tempo do cron
    const pending = [...all.values()].filter((a) => a.description && !hasPt.has(a.id)).slice(0, 40);
    for (const a of pending) {
      const pt = await translate(a.description!);
      if (pt) {
        await sb.from("animes").update({ description_pt: pt }).eq("id", a.id);
        translated++;
      }
    }

    await sb.from("shelves").upsert(
      shelves.map((s, i) => ({ key: s.key, title: s.title, subtitle: s.subtitle ?? null, anime_ids: s.items.map((a) => a.id), position: i })),
    );
    await sb.from("sync_log").insert({ animes: saved, new_animes: isNew, translated });
  }

  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true, shelves: shelves.map((s) => [s.key, s.items.length]), saved, translated });
}
