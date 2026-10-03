"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "./Logo";
import KiOrb from "./KiOrb";
import NotificationBell from "./NotificationBell";
import { useStore } from "@/lib/store";

const NAV = [
  { href: "/", label: "Início" },
  { href: "/calendario", label: "Calendário" },
  { href: "/buscar", label: "Explorar" },
  { href: "/perfil", label: "Minha Saga" },
];

export default function Header() {
  const path = usePathname();
  const router = useRouter();
  const { spheres, user, power } = useStore();
  const [scrolled, setScrolled] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 20);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header className={`sticky top-0 z-40 transition-all ${scrolled ? "bg-bg/85 backdrop-blur-xl border-b border-line" : "bg-gradient-to-b from-bg/90 to-transparent"}`}>
      <div className="mx-auto max-w-[1500px] px-4 md:px-8 h-16 flex items-center gap-4 md:gap-8">
        <Logo />
        <nav className="hidden md:flex gap-1">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${path === n.href ? "bg-white/10 text-ki-2" : "text-muted hover:text-text"}`}>
              {n.label}
            </Link>
          ))}
        </nav>
        <form
          className="ml-auto hidden sm:block"
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim()) router.push(`/buscar?q=${encodeURIComponent(q.trim())}`);
          }}
        >
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar anime…" className="w-44 lg:w-64 rounded-full bg-white/5 border border-line px-4 py-1.5 text-sm outline-none focus:border-ki focus:w-72 transition-all" />
        </form>
        <NotificationBell />
        <Link href="/perfil" className="flex items-center gap-2 rounded-full btn-ghost pl-2 pr-3 py-1" title="Esferas de Ki coletadas hoje">
          <KiOrb n={Math.max(1, spheres.length)} size={22} dim={spheres.length === 0} />
          <span className="text-sm font-bold tabular-nums">{spheres.length}/7</span>
        </Link>
        {user ? (
          <Link href="/perfil" className="hidden md:flex items-center gap-2 text-sm">
            <span className="grid place-items-center w-8 h-8 rounded-full bg-gradient-to-br from-ki to-aura-2 font-bold aura">{(user.email ?? "?")[0].toUpperCase()}</span>
            <span className="text-muted tabular-nums">{power.toLocaleString("pt-BR")}</span>
          </Link>
        ) : (
          <Link href="/login" className="hidden md:inline-flex btn-ki rounded-full px-4 py-1.5 text-sm">Entrar</Link>
        )}
      </div>
      <nav className="md:hidden flex gap-1 px-4 pb-2 overflow-x-auto no-scrollbar">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium ${path === n.href ? "bg-white/10 text-ki-2" : "text-muted"}`}>
            {n.label}
          </Link>
        ))}
        {!user && <Link href="/login" className="shrink-0 px-3 py-1 rounded-full text-xs font-bold text-ki">Entrar</Link>}
      </nav>
    </header>
  );
}
