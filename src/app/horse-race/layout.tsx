import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Derby Club | Carreras de Caballos 3D",
  description:
    "Crea o unite a carreras de caballos en 3D, transferi y mira la accion en vivo.",
};

export default function HorseRaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
