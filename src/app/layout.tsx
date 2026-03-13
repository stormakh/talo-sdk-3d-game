import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Derby Club | Carreras de Caballos 3D",
  description:
    "Crea o unite a carreras de caballos en 3D, transferi y mira la accion en vivo.",
  openGraph: {
    title: "The Derby Club",
    description: "Carreras de caballos en 3D. Crea un derby, transferi y corré.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-AR" className={cn("font-sans", geist.variable)}>
      <body className={`${inter.variable} min-h-screen antialiased`}>
        {children}
      </body>
    </html>
  );
}
