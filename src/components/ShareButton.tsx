"use client";
import { useEffect, useRef, useState } from "react";

type Props = { title: string; text?: string; path?: string; label?: string; className?: string };

export default function ShareButton({ title, text, path, label = "Compartilhar", className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUrl(path ? new URL(path, window.location.origin).toString() : window.location.href);
  }, [path]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const msg = text ?? `${title} — vi no KakarotoTV 🔥`;
  const enc = encodeURIComponent;
  const targets = [
    { name: "WhatsApp", color: "#25D366", href: `https://wa.me/?text=${enc(`${msg} ${url}`)}` },
    { name: "X / Twitter", color: "#e7e7e7", href: `https://twitter.com/intent/tweet?text=${enc(msg)}&url=${enc(url)}` },
    { name: "Facebook", color: "#1877F2", href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}` },
    { name: "Telegram", color: "#29A9EB", href: `https://t.me/share/url?url=${enc(url)}&text=${enc(msg)}` },
    { name: "Reddit", color: "#FF4500", href: `https://www.reddit.com/submit?url=${enc(url)}&title=${enc(title)}` },
  ];

  const onClick = async () => {
    // No celular abre a folha nativa (Instagram, TikTok, etc. aparecem lá)
    if (typeof navigator !== "undefined" && navigator.share && window.matchMedia("(pointer: coarse)").matches) {
      try {
        await navigator.share({ title, text: msg, url });
        return;
      } catch {}
    }
    setOpen((o) => !o);
  };

  return (
    <div ref={box} className={`relative inline-block ${className}`}>
      <button onClick={onClick} className="btn-ghost rounded-full px-5 py-3 text-sm font-semibold">
        ↗ {label}
      </button>
      {open && (
        <div className="absolute z-50 mt-2 w-60 rounded-2xl border border-line bg-bg-2/95 backdrop-blur-xl p-2 shadow-2xl rise">
          {targets.map((t) => (
            <a key={t.name} href={t.href} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-white/5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: t.color }} /> {t.name}
            </a>
          ))}
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 1800);
            }}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-white/5"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-ki" /> {copied ? "Link copiado! ✓" : "Copiar link (Instagram/TikTok)"}
          </button>
        </div>
      )}
    </div>
  );
}
