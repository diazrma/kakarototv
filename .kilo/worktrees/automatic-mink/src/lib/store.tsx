"use client";
// Estado do usuário (favoritos + esferas). Funciona sem login (localStorage)
// e sincroniza com o Supabase quando o usuário entra.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getBrowserSupabase } from "./supabase/client";
import { powerLevel, todayKey } from "./spheres";

export type Fav = { id: number; title: string; cover: string };

type State = {
  user: User | null;
  ready: boolean;
  favorites: Fav[];
  spheres: number[];
  wishes: number;
  power: number;
  isFav: (id: number) => boolean;
  toggleFav: (f: Fav) => void;
  collect: (n: number) => void;
  makeWish: () => void;
  signOut: () => Promise<void>;
};

const Ctx = createContext<State | null>(null);
const LS = "kakarototv:v1";

type Local = { favorites: Fav[]; spheres: number[]; sphereDay: string; wishes: number };

function readLocal(): Local {
  try {
    const raw = localStorage.getItem(LS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { favorites: [], spheres: [], sphereDay: todayKey(), wishes: 0 };
}

function writeLocal(l: Local) {
  try {
    localStorage.setItem(LS, JSON.stringify(l));
  } catch {}
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [local, setLocal] = useState<Local>({ favorites: [], spheres: [], sphereDay: todayKey(), wishes: 0 });

  // Carrega local e, se logado, mescla com o servidor
  useEffect(() => {
    const l = readLocal();
    if (l.sphereDay !== todayKey()) {
      l.spheres = [];
      l.sphereDay = todayKey();
    }
    setLocal(l);
    setReady(true);

    const sb = getBrowserSupabase();
    if (!sb) return;
    const load = async (u: User | null) => {
      setUser(u);
      if (!u) return;
      const [{ data: favs }, { data: prof }] = await Promise.all([
        sb.from("favorites").select("anime_id,title,cover").order("created_at", { ascending: false }),
        sb.from("profiles").select("spheres,sphere_day,wishes").eq("user_id", u.id).maybeSingle(),
      ]);
      setLocal((cur) => {
        const server: Fav[] = (favs ?? []).map((f) => ({ id: f.anime_id, title: f.title, cover: f.cover }));
        const merged = [...new Map([...server, ...cur.favorites].map((f) => [f.id, f])).values()];
        // envia favoritos locais que o servidor ainda não tem
        const missing = cur.favorites.filter((f) => !server.some((s) => s.id === f.id));
        if (missing.length) sb.from("favorites").upsert(missing.map((f) => ({ user_id: u.id, anime_id: f.id, title: f.title, cover: f.cover }))).then();
        const sameDay = prof?.sphere_day === todayKey();
        const spheres = [...new Set([...(sameDay ? prof!.spheres : []), ...cur.spheres])];
        const next = { favorites: merged, spheres, sphereDay: todayKey(), wishes: Math.max(prof?.wishes ?? 0, cur.wishes) };
        writeLocal(next);
        return next;
      });
    };
    sb.auth.getUser().then(({ data }) => load(data.user));
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => load(session?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const pushProfile = useCallback(
    (l: Local) => {
      const sb = getBrowserSupabase();
      if (sb && user) sb.from("profiles").upsert({ user_id: user.id, spheres: l.spheres, sphere_day: l.sphereDay, wishes: l.wishes, updated_at: new Date().toISOString() }).then();
    },
    [user],
  );

  const update = useCallback((fn: (l: Local) => Local, sync?: (l: Local) => void) => {
    setLocal((cur) => {
      const next = fn(cur);
      writeLocal(next);
      sync?.(next);
      return next;
    });
  }, []);

  const toggleFav = useCallback(
    (f: Fav) => {
      const sb = getBrowserSupabase();
      update((l) => {
        const has = l.favorites.some((x) => x.id === f.id);
        if (sb && user) {
          if (has) sb.from("favorites").delete().eq("user_id", user.id).eq("anime_id", f.id).then();
          else sb.from("favorites").insert({ user_id: user.id, anime_id: f.id, title: f.title, cover: f.cover }).then();
        }
        return { ...l, favorites: has ? l.favorites.filter((x) => x.id !== f.id) : [f, ...l.favorites] };
      });
    },
    [update, user],
  );

  const collect = useCallback(
    (n: number) => update((l) => (l.spheres.includes(n) || l.spheres.includes(0) ? l : { ...l, spheres: [...l.spheres, n].sort((a, b) => a - b) }), pushProfile),
    [update, pushProfile],
  );

  // O desejo consome as 7 esferas. Elas só voltam a aparecer no dia seguinte.
  const makeWish = useCallback(
    () => update((l) => ({ ...l, spheres: [0], wishes: l.wishes + 1 }), pushProfile),
    [update, pushProfile],
  );

  const signOut = useCallback(async () => {
    await getBrowserSupabase()?.auth.signOut();
    setUser(null);
  }, []);

  const value = useMemo<State>(() => {
    const realSpheres = local.spheres.filter((n) => n > 0);
    return {
      user,
      ready,
      favorites: local.favorites,
      spheres: realSpheres,
      wishes: local.wishes,
      power: powerLevel({ favorites: local.favorites.length, spheres: realSpheres.length, wishes: local.wishes }),
      isFav: (id) => local.favorites.some((f) => f.id === id),
      toggleFav,
      collect,
      makeWish,
      signOut,
    };
  }, [user, ready, local, toggleFav, collect, makeWish, signOut]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore fora do StoreProvider");
  return v;
}

/** true quando o usuário já usou o desejo de hoje (marcador 0 na lista) */
export function useWishUsedToday() {
  const [used, setUsed] = useState(false);
  const { wishes } = useStore();
  useEffect(() => {
    setUsed(readLocal().spheres.includes(0) && readLocal().sphereDay === todayKey());
  }, [wishes]);
  return used;
}
