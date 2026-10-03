import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseEnabled } from "./config";

export async function getServerSupabase() {
  if (!supabaseEnabled) return null;
  const store = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // chamado de Server Component — o middleware cuida da renovação
        }
      },
    },
  });
}

// Cliente com service role: só no servidor (cron). Ignora RLS.
export function getAdminSupabase() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !key) return null;
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false } });
}

// Leitura pública (sem cookies) — pode ser usada em páginas estáticas/ISR.
export function getPublicSupabase() {
  if (!supabaseEnabled) return null;
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
}
