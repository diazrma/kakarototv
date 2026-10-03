"use client";
import { useState } from "react";
import Logo from "@/components/Logo";
import KiOrb from "@/components/KiOrb";
import { getBrowserSupabase } from "@/lib/supabase/client";

export default function Login() {
  const sb = getBrowserSupabase();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");
  const redirect = () => `${window.location.origin}/auth/callback`;

  const magic = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    const { error } = await sb!.auth.signInWithOtp({ email, options: { emailRedirectTo: redirect() } });
    if (error) setErr(error.message);
    else setSent(true);
  };

  const google = () => sb!.auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirect() } });

  return (
    <div className="min-h-[80vh] grid place-items-center px-4">
      <div className="relative w-full max-w-md rounded-3xl border border-line bg-bg-2/80 backdrop-blur-xl p-8 shadow-[0_0_120px_-30px_#ff7a00]">
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 float"><KiOrb n={4} size={80} /></div>
        <div className="text-center pt-6">
          <Logo big />
          <p className="text-muted mt-3">Entre para salvar favoritos, esferas e nível de poder em qualquer aparelho.</p>
        </div>
        {!sb ? (
          <p className="mt-8 rounded-xl border border-dashed border-line p-4 text-sm text-muted">
            Login ainda não configurado. Defina <code>NEXT_PUBLIC_SUPABASE_URL</code> e <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>. Seus favoritos já ficam salvos neste navegador.
          </p>
        ) : sent ? (
          <p className="mt-8 text-center rise">⚡ Link mágico enviado para <b>{email}</b>. Abra seu e-mail!</p>
        ) : (
          <div className="mt-8 space-y-4">
            <button onClick={google} className="w-full rounded-full bg-white text-black font-semibold py-3 hover:bg-white/90 transition">Continuar com Google</button>
            <div className="flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-line" />ou<span className="h-px flex-1 bg-line" /></div>
            <form onSubmit={magic} className="space-y-3">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className="w-full rounded-full bg-white/5 border border-line px-5 py-3 outline-none focus:border-ki" />
              <button className="btn-ki w-full rounded-full py-3">Receber link mágico</button>
            </form>
            {err && <p className="text-sm text-red-400">{err}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
