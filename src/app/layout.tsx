import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mon Application",
  description: "Application Next.js avec shadcn/ui et Supabase",
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
