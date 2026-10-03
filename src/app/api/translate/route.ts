// Traduz a sinopse de um anime sob demanda e guarda no Supabase,
// assim cada anime só é traduzido uma vez.
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAnime } from "@/lib/anilist";
import { translateToPt } from "@/lib/translate";
import { getAdminSupabase, getPublicSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const memo = new Map<number, string>(); // cache local quando não há Supabase

export async function POST(req: Request) {
  const { id } = (await req.json().catch(() => ({}))) as { id?: unknown };
  const animeId = Number(id);
  if (!Number.isInteger(animeId) || animeId <= 0) return NextResponse.json({ error: "id inválido" }, { status: 400 });

  if (memo.has(animeId)) return NextResponse.json({ text: memo.get(animeId) });

  const pub = getPublicSupabase();
  if (pub) {
    const { data } = await pub.from("animes").select("description_pt").eq("id", animeId).maybeSingle();
    if (data?.description_pt) return NextResponse.json({ text: data.description_pt });
  }

  // O texto vem do AniList, nunca do navegador
  const anime = await getAnime(animeId);
  if (!anime?.description) return NextResponse.json({ error: "sem sinopse" }, { status: 404 });

  const text = await translateToPt(anime.description);
  if (!text) return NextResponse.json({ error: "falha na tradução" }, { status: 502 });

  memo.set(animeId, text);
  const admin = getAdminSupabase();
  if (admin) {
    await admin.from("animes").upsert({ id: animeId, data: anime, description_pt: text, updated_at: new Date().toISOString() });
    revalidatePath(`/anime/${animeId}`);
  }
  return NextResponse.json({ text });
}
