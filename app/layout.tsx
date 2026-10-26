import type { Metadata, Viewport } from "next";
import "./globals.css";
import { RippleCursor } from "@/components/effects/RippleCursor";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export function getSafeSiteUrl(): URL {
  let raw = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000"
  ).trim();

  if (!raw.startsWith("http://") && !raw.startsWith("https://")) {
    raw = `https://${raw}`;
  }

  try {
    return new URL(raw);
  } catch {
    return new URL("http://localhost:3000");
  }
}

export const metadata: Metadata = {
  metadataBase: getSafeSiteUrl(),
  title: "FOLE — Free Open Learning & Education | KTU Engineering Codex",
  description:
    "Human-curated lecture indices, handwritten KTU professor compendiums, verified exam question vaults, and module-wise video recordings organized under open scholarly governance.",
  keywords: ["FOLE", "KTU", "Engineering", "Mathematics", "Graphics", "Electrical", "Kerala Technological University", "KTU Notes", "KTU Lectures", "Open Education"],
  authors: [{ name: "FOLE Academic Initiative" }],
  openGraph: {
    title: "FOLE — Free Open Learning & Education | KTU Engineering Codex",
    description: "Human-curated lecture indices, handwritten KTU professor compendiums, and verified exam question vaults.",
    type: "website",
    images: [{ url: "/branding/fole-logo.png", width: 1024, height: 306, alt: "FOLE" }],
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Epilogue:wght@500;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=Public+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-surface-canvas text-on-surface font-body antialiased selection:bg-secondary-fixed selection:text-on-secondary-fixed">
        <RippleCursor />
        {children}
      </body>
    </html>
  );
}
