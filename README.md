# ⚡ KakarotoTV

Radar de animes em PT-BR. Mostra **onde assistir legalmente com legenda em português** (Crunchyroll, Netflix, Prime Video, Disney+, Max), com calendário de episódios, favoritos, login com Google e a **Caça às 7 Esferas de Ki**.

O catálogo **se alimenta sozinho todo dia** por um robô (Vercel Cron) que puxa a API pública do AniList.

## O que tem

- **Início**: destaque rotativo com trailer, Top 10 do dia e prateleiras (Em alta, Temporada, Lendários, Batalhas, Em breve). Só entram animes com legenda PT-BR oficial.
- **Radar de Esferas**: todo dia, 7 esferas se escondem em páginas de animes. O radar dá pistas. Com as 7 coletadas você invoca um desejo, que revela uma recomendação surpresa e dá +9001 de poder.
- **Nível de poder**: favoritos, esferas e desejos aumentam seu nível. Dá para desafiar amigos.
- **Página do anime**: plataformas oficiais com legenda PT-BR, contagem regressiva do próximo episódio, trailer, favoritar e compartilhar.
- **Calendário**: episódios da semana no horário de Brasília.
- **Compartilhar**: WhatsApp, X, Facebook, Telegram, Reddit, copiar link e o compartilhamento nativo do celular.
- **Login**: Google ou link mágico por e-mail (Supabase). Sem login, os favoritos ficam salvos no navegador e são enviados para a nuvem quando a pessoa entra.

## Rodar local

```bash
npm install
npm run dev   # http://localhost:3000
```

Funciona sem configurar nada: o catálogo vem direto do AniList e os favoritos ficam no navegador.

## Colocar no ar (Vercel + Supabase)

1. **Supabase** (grátis): crie um projeto em supabase.com. No **SQL Editor**, rode `supabase/schema.sql` (pode rodar de novo sempre que o arquivo mudar; ele cria as tabelas de comentários e notificações e liga o tempo real).
2. **Login com Google**: no Supabase, vá em Authentication → Providers → Google e ative. Crie o OAuth Client no Google Cloud Console usando a *Callback URL* que o Supabase mostra. Em Authentication → URL Configuration, coloque `https://SEU-DOMINIO/auth/callback` nas Redirect URLs.
3. **Vercel**: importe esta pasta (via GitHub ou `npx vercel`) e configure as variáveis de `.env.example`:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `CRON_SECRET`: qualquer senha longa. A Vercel envia esse valor automaticamente para o cron.
   - `NEXT_PUBLIC_SITE_URL`: o domínio final.
4. O `vercel.json` já agenda o robô para **todo dia às 06:00 (Brasília)**. Para rodar a primeira vez na mão:
   `curl -H "Authorization: Bearer SEU_CRON_SECRET" https://SEU-DOMINIO/api/cron/sync`

## Vídeo de divulgação

Em `marketing/`:
- `kakarototv-promo.mp4`: vertical 1080×1920, 30s, com trilha sintetizada original. Pronto para Reels, TikTok e Shorts.
- `kakarototv-promo-sem-audio.mp4`: para usar com um áudio em alta da rede (ajuda no alcance).
- `capa-video.jpg`: capa/thumbnail.
- `fonte-video/`: fonte do vídeo. Para refazer: `node capturar-telas.mjs` (com o site rodando) e depois `node render.mjs` (requer `playwright` e `ffmpeg`).

## Stack

Next.js 15 (App Router) · Tailwind 4 · Supabase (auth + Postgres) · AniList GraphQL · Vercel Cron
