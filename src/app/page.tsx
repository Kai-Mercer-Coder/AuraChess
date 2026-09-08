import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 text-center">
      <span className="text-[10px] uppercase tracking-widest text-white/40 border border-white/10 rounded-full px-3 py-1 mb-8">
        100% Free · Runs in your browser
      </span>
      <h1 className="font-display text-6xl md:text-7xl font-bold tracking-tighter text-white leading-[1.05]">
        Aura<span className="text-white/40">Chess</span>
      </h1>
      <p className="text-white/50 font-light max-w-xl mt-6">
        Paste any game and get instant, human-grade analysis — every move
        classified by a local Stockfish engine. No account, no paywall, no
        tracking.
      </p>
      <Link
        href="/review"
        className="mt-10 bg-white text-black px-12 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:bg-neutral-200 transition-all active:scale-95"
      >
        Review a Game
      </Link>
    </div>
  );
}
