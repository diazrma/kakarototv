"use client";
// Comentários de um anime. Todo mundo lê; quem está logado comenta.
// Novos comentários chegam em tempo real (Supabase Realtime).
import Link from "next/link";
import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { useStore } from "@/lib/store";
import { timeAgo } from "@/lib/time";

type Comment = { id: number; anime_id: number; user_id: string; author_name: string; author_avatar: string | null; body: string; created_at: string };

const MAX = 1000;

export default function Comments({ animeId }: { animeId: number }) {
  const { user } = useStore();
  const sb = getBrowserSupabase();
  const [items, setItems] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!sb) return;
    sb.from("comments")
      .select("*")
      .eq("anime_id", animeId)
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setItems((data ?? []) as Comment[]);
        setLoading(false);
      });

    const ch = sb
      .channel(`comments:${animeId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "comments", filter: `anime_id=eq.${animeId}` }, ({ new: c }) => {
        setItems((cur) => (cur.some((x) => x.id === (c as Comment).id) ? cur : [c as Comment, ...cur]));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "comments" }, ({ old }) => {
        setItems((cur) => cur.filter((x) => x.id !== (old as { id: number }).id));
      })
      .subscribe();
    return () => {
      sb.removeChannel(ch);
    };
  }, [sb, animeId]);

  if (!sb) return null;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || !user) return;
    setSending(true);
    setErr("");
    const { data, error } = await sb.from("comments").insert({ anime_id: animeId, user_id: user.id, body }).select().single();
    setSending(false);
    if (error) return setErr("Não deu para publicar. Tente de novo.");
    setText("");
    setItems((cur) => (cur.some((x) => x.id === data.id) ? cur : [data as Comment, ...cur]));
  };

  const remove = async (id: number) => {
    setItems((cur) => cur.filter((x) => x.id !== id));
    await sb.from("comments").delete().eq("id", id);
  };

  return (
    <section className="mt-10 max-w-3xl">
      <h2 className="font-display text-2xl mb-3">
        Comentários {items.length > 0 && <span className="text-muted text-lg">({items.length}{items.length === 100 ? "+" : ""})</span>}
      </h2>

      {user ? (
        <form onSubmit={send} className="rounded-2xl border border-line bg-card/60 p-3 focus-within:border-ki transition">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) send(e);
            }}
            rows={3}
            placeholder="O que você achou? Sem spoiler, hein! 👀"
            className="w-full resize-none bg-transparent outline-none text-sm"
          />
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted tabular-nums">{text.length}/{MAX}</span>
            {err && <span className="text-xs text-red-400">{err}</span>}
            <button disabled={sending || !text.trim()} className="ml-auto btn-ki rounded-full px-5 py-1.5 text-sm disabled:opacity-40">
              {sending ? "Enviando…" : "Comentar"}
            </button>
          </div>
        </form>
      ) : (
        <p className="rounded-2xl border border-dashed border-line p-4 text-sm text-muted">
          <Link href="/login" className="text-ki-2 font-semibold hover:underline">Entre</Link> para comentar e trocar ideia com a galera.
        </p>
      )}

      <ul className="mt-5 space-y-4">
        {loading ? (
          <li className="text-sm text-muted">Carregando comentários…</li>
        ) : items.length === 0 ? (
          <li className="text-sm text-muted">Ninguém comentou ainda. Seja o primeiro!</li>
        ) : (
          items.map((c) => (
            <li key={c.id} className="flex gap-3 rise">
              {c.author_avatar ? (
                <img src={c.author_avatar} alt="" referrerPolicy="no-referrer" className="w-9 h-9 rounded-full object-cover shrink-0" />
              ) : (
                <span className="grid place-items-center w-9 h-9 rounded-full bg-gradient-to-br from-ki to-aura-2 font-bold shrink-0">{(c.author_name || "?")[0].toUpperCase()}</span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <span className="font-semibold">{c.author_name || "Guerreiro anônimo"}</span>
                  <span className="text-muted text-xs ml-2">{timeAgo(c.created_at)}</span>
                  {user?.id === c.user_id && (
                    <button onClick={() => remove(c.id)} className="text-xs text-muted hover:text-red-400 ml-3">apagar</button>
                  )}
                </p>
                <p className="text-sm text-text/85 whitespace-pre-line break-words mt-0.5">{c.body}</p>
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
