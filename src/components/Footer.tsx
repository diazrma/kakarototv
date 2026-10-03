import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto max-w-[1500px] px-4 md:px-8 py-10 grid gap-6 md:grid-cols-[1fr_2fr] text-sm text-muted">
        <div className="space-y-2">
          <Logo />
          <p>Seu radar de animes. Atualizado todo dia.</p>
          <p>Criado por <b className="text-text">Rodrigo Cardoso</b> © {new Date().getFullYear()}</p>
        </div>
        <p className="md:text-right leading-relaxed">
          O KakarotoTV não hospeda vídeos. Mostramos onde assistir em plataformas oficiais. Assistir pelo canal oficial ajuda os estúdios a fazer mais temporadas.
          <br />
          Dados de catálogo: <a className="underline hover:text-text" href="https://anilist.co" target="_blank" rel="noreferrer">AniList</a>. Trailers: YouTube.
        </p>
      </div>
    </footer>
  );
}
