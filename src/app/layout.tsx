import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "InfluComply",
    template: "%s · InfluComply",
  },
  description: "Plateforme de conformité réglementaire pour les créateurs de contenu — loi 2023-451",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
