"use client";
// Sininho de notificações:
//  • episódio novo dos animes que o usuário marcou (direto do AniList, funciona sem login)
//  • anime novo no catálogo (o robô diário cria no Supabase; chega em tempo real)
// Se o usuário permitir, vira alerta do navegador enquanto o site estiver aberto.
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { useStore, type Fav } from "@/lib/store";
import { timeAgo } from "@/lib/time";

type Item = { key: string; animeId: number; title: string; cover: string | null; kicker: string; at: string };
type DbNotif = { id: number; anime_id: number; title: string; cover: string | null; created_at: string };
type Airing = { id: number; episode: number; airingAt: number; mediaId: number };

const SEEN = "kakarototv:notif-seen";
const DAY = 86400;

function readSeen(): string | null {
  try {
    return localStorage.getItem(SEEN);
  } catch {
    return null;
  }
}

function browserAlert(title: string, body: string, icon: string | null, tag: string) {
  if ("Notification" in window && Notification.permission === "granted") new Notification(title, { body, icon: icon ?? "/icon.svg", tag });
}

const fromDb = (n: DbNotif): Item => ({ key: `n${n.id}`, animeId: n.anime_id, title: n.title, cover: n.cover, kicker: "Anime novo no catálogo", at: n.created_at });

const fromAiring = (a: Airing, f: Fav): Item => ({
  key: `e${a.id}`,
  animeId: a.mediaId,
  title: f.title,
  cover: f.cover,
  kicker: `🔥 Episódio ${a.episode} saiu!`,
  at: new Date(a.airingAt * 1000).toISOString(),
});

async function fetchAirings(ids: number[]): Promise<Airing[]> {
  const now = Math.floor(Date.now() / 1000);
  const res = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      query: `query ($ids:[Int],$from:Int,$to:Int){ Page(perPage:50){ airingSchedules(mediaId_in:$ids, airingAt_greater:$from, airingAt_lesser:$to, sort:TIME_DESC){ id episode airingAt mediaId } } }`,
      variables: { ids, from: now - 7 * DAY, to: now + DAY },
    }),
  });
  if (!res.ok) return [];
  return (await res.json())?.data?.Page?.airingSchedules ?? [];
}

export default function NotificationBell() {
  const { user, alerts } = useStore();
  const [catalog, setCatalog] = useState<Item[]>([]);
  const [episodes, setEpisodes] = useState<Item[]>([]);
  const [seenAt, setSeenAt] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">("unsupported");
  const box = useRef<HTMLDivElement>(null);
  const sb = getBrowserSupabase();
  const alertIds = alerts.map((a) => a.id).join(",");

  useEffect(() => {
    setSeenAt(readSeen());
    if ("Notification" in window) setPerm(Notification.permission);
  }, []);

  // Anime novo no catálogo (Supabase)
  useEffect(() => {
    if (!sb) return;
    sb.from("notifications").select("*").order("created_at", { ascending: false }).limit(20).then(({ data }) => setCatalog(((data ?? []) as DbNotif[]).map(fromDb)));
    const ch = sb
      .channel("notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, ({ new: n }) => {
        const it = fromDb(n as DbNotif);
        setCatalog((cur) => [it, ...cur.filter((x) => x.key !== it.key)].slice(0, 20));
        // mesma tag: vários animes novos de uma vez viram um único alerta
        if (document.hidden) browserAlert("Anime novo no KakarotoTV ⚡", it.title, it.cover, "kakarototv-new");
      })
      .subscribe();
    return () => {
      sb.removeChannel(ch);
    };
  }, [sb]);

  // Episódios dos animes marcados: os da última semana + agenda os das próximas 24h
  useEffect(() => {
    if (!alerts.length) return setEpisodes([]);
    const byId = new Map(alerts.map((f) => [f.id, f]));
    const timers: ReturnType<typeof setTimeout>[] = [];
    let alive = true;

    fetchAirings([...byId.keys()]).then((list) => {
      if (!alive) return;
      const now = Date.now();
      setEpisodes(list.filter((a) => a.airingAt * 1000 <= now).map((a) => fromAiring(a, byId.get(a.mediaId)!)));
      for (const a of list.filter((x) => x.airingAt * 1000 > now)) {
        timers.push(
          setTimeout(() => {
            const it = fromAiring(a, byId.get(a.mediaId)!);
            setEpisodes((cur) => [it, ...cur.filter((x) => x.key !== it.key)]);
            browserAlert(`Episódio ${a.episode} saiu! 🔥`, it.title, it.cover, `kakarototv-ep-${a.id}`);
          }, a.airingAt * 1000 - now),
        );
      }
    });
    return () => {
      alive = false;
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alertIds]);

  // Logado: usa o "visto até" salvo no perfil (vale para todos os aparelhos)
  useEffect(() => {
    if (!sb || !user) return;
    sb.from("profiles").select("notif_seen_at").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      const server = data?.notif_seen_at as string | null | undefined;
      if (server) setSeenAt((cur) => (!cur || server > cur ? server : cur));
    });
  }, [sb, user]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const items = [...episodes, ...catalog].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 30);
  const unread = items.filter((n) => !seenAt || new Date(n.at) > new Date(seenAt)).length;

  const markSeen = () => {
    const now = new Date().toISOString();
    setSeenAt(now);
    try {
      localStorage.setItem(SEEN, now);
    } catch {}
    if (sb && user) sb.from("profiles").upsert({ user_id: user.id, notif_seen_at: now }).then();
  };

  return (
    <div ref={box} className="relative ml-auto sm:ml-0">
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!open && unread) markSeen();
        }}
        className="relative grid place-items-center w-9 h-9 rounded-full btn-ghost"
        aria-label={unread ? `${unread} notificações novas` : "Notificações"}
      >
        <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-ki text-[10px] font-bold text-black">{unread > 9 ? "9+" : unread}</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-line bg-bg-2/95 backdrop-blur-xl shadow-2xl overflow-hidden rise">
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <p className="font-display text-xl">Novidades</p>
            {perm === "default" && (
              <button onClick={() => Notification.requestPermission().then(setPerm)} className="text-xs text-ki-2 hover:underline">
                Ativar alertas
              </button>
            )}
          </div>
          {items.length ? (
            <ul className="max-h-96 overflow-y-auto">
              {items.map((n) => (
                <li key={n.key}>
                  <Link href={`/anime/${n.animeId}`} onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5">
                    {n.cover ? <img src={n.cover} alt="" className="w-10 h-14 rounded-md object-cover shrink-0" /> : <span className="w-10 h-14 rounded-md bg-card shrink-0" />}
                    <div className="min-w-0">
                      <p className="text-xs text-ki-2">{n.kicker}</p>
                      <p className="text-sm font-semibold truncate">{n.title}</p>
                      <p className="text-xs text-muted">{timeAgo(n.at)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-6 text-sm text-muted text-center">
              Nada novo por enquanto. Abra um anime da temporada e toque em <b className="text-text">🔕 Avisar episódios</b> para ser avisado quando sair episódio.
            </p>
          )}
          {alerts.length > 0 && <p className="px-4 py-2 border-t border-line text-xs text-muted">Avisando episódios de {alerts.length} anime{alerts.length > 1 ? "s" : ""}</p>}
        </div>
      )}
    </div>
  );
}
