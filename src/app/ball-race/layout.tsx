import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ball Race | Bolas Cayendo en Vivo",
  description:
    "Crea una partida de Ball Race, transferi y mira las bolas caer por obstaculos al azar.",
};

export default function BallRaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
