import type { Metadata, Viewport } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "BelajarOnchain: Kuis Kripto Harian",
  description:
    "Kuis kripto harian berbahasa Indonesia di jaringan Base. Lulus kuis, dapat badge gratis. Daily crypto quiz on Base.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0052FF",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className="min-h-dvh antialiased">
        <Providers>
          <Header />
          <main className="mx-auto max-w-xl px-4 pb-10">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
