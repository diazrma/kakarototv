import type { Metadata, Viewport } from "next";
import { Bangers, Outfit } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const display = Bangers({ weight: "400", subsets: ["latin"], variable: "--font-display" });
const body = Outfit({ subsets: ["latin"], variable: "--font-body" });

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kakarototv.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "KakarotoTV — Eleve seu nível de poder em anime", template: "%s · KakarotoTV" },
  description: "Descubra animes, veja onde assistir legalmente com legenda em português, acompanhe lançamentos e caçe as 7 Esferas de Ki todo dia.",
  openGraph: { siteName: "KakarotoTV", type: "website", locale: "pt_BR" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#07060b" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${body.variable}`}>
      <body className="antialiased min-h-screen flex flex-col">
        <StoreProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </StoreProvider>
      </body>
    </html>
  );
}
