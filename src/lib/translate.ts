// Tradução de sinopses para PT-BR (só no servidor) pelo Google Tradutor, grátis e sem chave.
// Se o Google bloquear o servidor, o navegador do visitante traduz (ver usePtSynopsis).

async function viaGoogle(text: string): Promise<string | null> {
  const res = await fetch("https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=pt&dt=t", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ q: text }),
  });
  if (!res.ok) return null;
  const json = await res.json();
  // formato: [[["trecho traduzido", "original", ...], ...], ...]
  const out = (json?.[0] ?? []).map((p: unknown[]) => p?.[0] ?? "").join("").trim();
  return out || null;
}

export async function translateToPt(text: string): Promise<string | null> {
  const clean = text.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").replace(/\n{3,}/g, "\n\n").trim().slice(0, 4000);
  if (!clean) return null;
  try {
    return await viaGoogle(clean);
  } catch {
    return null;
  }
}
