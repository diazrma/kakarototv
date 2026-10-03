import Link from "next/link";
import KiOrb from "@/components/KiOrb";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] grid place-items-center text-center px-4">
      <div>
        <div className="flex justify-center gap-2 float"><KiOrb n={4} size={60} /><KiOrb n={7} size={60} dim /></div>
        <h1 className="font-display text-7xl mt-4">404</h1>
        <p className="text-muted">Essa página foi teletransportada para outra dimensão.</p>
        <Link href="/" className="btn-ki inline-block mt-6 rounded-full px-6 py-3">Voltar ao início</Link>
      </div>
    </div>
  );
}
