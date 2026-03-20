import type { Metadata } from "next";
import "./globals.css";
import WalletProvider from "@/components/WalletProvider";

export const metadata: Metadata = {
  title: "Atlas — Persistent World Protocol",
  description: "El primer framework para mundos persistentes en Solana",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}