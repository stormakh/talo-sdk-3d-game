import { GameCard } from "@/components/home/game-card";

const GAMES = [
  {
    title: "The Derby Club",
    description:
      "Carreras de caballos en 3D. Crea un derby, invita amigos y mira la accion en vivo.",
    href: "/horse-race",
    icon: "🏇",
    available: true,
    tags: ["3D", "Multijugador", "Transferencia"],
  },
  {
    title: "Ball Race",
    description:
      "Bolas cayendo por obstaculos al azar. Transferi y mira quien llega primero.",
    href: "/ball-race",
    icon: "🎱",
    available: true,
    tags: ["2D", "Multijugador", "Transferencia"],
  },
  {
    title: "Nuevo juego",
    description: "Mas experiencias interactivas en camino.",
    href: "#",
    icon: "🎲",
    available: false,
    tags: [],
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5">
        <span
          className="text-xl tracking-wide"
          style={{
            fontFamily: "var(--font-serif)",
            color: "var(--text-gold)",
          }}
        >
          Talo Games
        </span>
        <a
          href="https://talo.ar"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm transition-opacity hover:opacity-80"
          style={{ color: "var(--text-secondary)" }}
        >
          talo.ar
        </a>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center px-6 pt-16 pb-20 text-center">
        <h1
          className="mb-4 text-4xl md:text-6xl"
          style={{
            fontFamily: "var(--font-serif)",
            color: "var(--text-primary)",
          }}
        >
          Talo Pay en Accion
        </h1>
        <p
          className="max-w-xl text-lg leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          Experiencias interactivas que muestran las capacidades de{" "}
          <a
            href="https://talo.ar"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--text-gold)" }}
            className="underline underline-offset-4"
          >
            Talo Pay
          </a>
          . Pagos en tiempo real, webhooks, y mas — todo integrado en juegos
          que podes probar ahora.
        </p>
      </section>

      <div className="mx-auto h-px max-w-4xl bg-gradient-to-r from-transparent via-[#c8a84e33] to-transparent" />

      {/* Games grid */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <p className="label mb-6">Juegos</p>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {GAMES.map((game) => (
            <GameCard key={game.title + game.icon} {...game} />
          ))}
        </div>
      </section>

      <div className="mx-auto h-px max-w-4xl bg-gradient-to-r from-transparent via-[#c8a84e33] to-transparent" />

      {/* Footer */}
      <footer className="px-6 py-12 text-center">
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Hecho con{" "}
          <a
            href="https://talo.ar"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--text-gold)" }}
            className="underline underline-offset-4"
          >
            Talo Pay
          </a>{" "}
          — Infraestructura de pagos para Argentina.
        </p>
      </footer>
    </main>
  );
}
