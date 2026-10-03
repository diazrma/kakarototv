import type { Metadata } from "next";
import Link from "next/link";
import { getWeekSchedule, type ScheduleItem } from "@/lib/anilist";
import Countdown from "@/components/Countdown";

export const metadata: Metadata = { title: "Calendário de lançamentos" };
export const revalidate = 1800;

const TZ = "America/Sao_Paulo";

export default async function Calendario() {
  const items = await getWeekSchedule().catch(() => [] as ScheduleItem[]);
  const days = new Map<string, ScheduleItem[]>();
  for (const it of items.filter((x) => x.anime.ptbr)) {
    const key = new Date(it.airingAt * 1000).toLocaleDateString("pt-BR", { timeZone: TZ, weekday: "long", day: "2-digit", month: "short" });
    days.set(key, [...(days.get(key) ?? []), it]);
  }
  const todayKey = new Date().toLocaleDateString("pt-BR", { timeZone: TZ, weekday: "long", day: "2-digit", month: "short" });
  const now = Date.now() / 1000;

  return (
    <div className="mx-auto max-w-[1500px] px-4 md:px-8 pt-8">
      <p className="text-xs uppercase tracking-[.3em] text-aura">Horário de Brasília</p>
      <h1 className="font-display text-5xl md:text-6xl">Calendário da Semana</h1>
      <p className="text-muted mt-1">Episódios novos dos animes com legenda PT-BR oficial. O horário é o da estreia no Japão; a versão legendada costuma sair pouco depois.</p>

      <div className="mt-8 flex gap-4 overflow-x-auto no-scrollbar snap-x pb-4">
        {[...days.entries()].map(([day, list]) => (
          <section key={day} className={`snap-start shrink-0 w-[300px] rounded-3xl border p-4 ${day === todayKey ? "border-ki/60 bg-ki/5 shadow-[0_0_60px_-20px_#ff7a00]" : "border-line bg-card/40"}`}>
            <h2 className="font-display text-2xl capitalize flex items-center gap-2">
              {day}
              {day === todayKey && <span className="text-[10px] font-sans font-bold bg-ki text-black rounded-full px-2 py-0.5">HOJE</span>}
            </h2>
            <ul className="mt-3 space-y-2">
              {list.map((it) => {
                const aired = it.airingAt < now;
                return (
                  <li key={`${it.anime.id}-${it.episode}`}>
                    <Link href={`/anime/${it.anime.id}`} className={`flex gap-3 rounded-2xl p-2 hover:bg-white/5 transition ${aired ? "opacity-60" : ""}`}>
                      <img src={it.anime.cover} alt="" className="w-12 h-16 object-cover rounded-lg" loading="lazy" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold line-clamp-2 leading-tight">{it.anime.title}</p>
                        <p className="text-xs text-muted mt-1">
                          Ep {it.episode} • {new Date(it.airingAt * 1000).toLocaleTimeString("pt-BR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" })}
                        </p>
                        {!aired && it.airingAt - now < 86400 && (
                          <p className="text-xs text-aura font-semibold mt-0.5">em <Countdown at={it.airingAt} /></p>
                        )}
                        {aired && <p className="text-xs text-ki-2 mt-0.5">✓ Já saiu</p>}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
