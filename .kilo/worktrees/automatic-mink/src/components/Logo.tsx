import Link from "next/link";

export default function Logo({ big = false }: { big?: boolean }) {
  return (
    <Link href="/" className={`logo select-none ${big ? "text-6xl md:text-8xl" : "text-2xl"}`} aria-label="KakarotoTV — início">
      <span className="logo-k">KAKAROTO</span>
      <span className="logo-tv">TV</span>
    </Link>
  );
}
