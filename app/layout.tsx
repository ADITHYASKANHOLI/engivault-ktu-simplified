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
      <body className="min-h-screen flex flex-col bg-[#F7F9FC] text-[#0B1220] antialiased selection:bg-emerald-100 selection:text-emerald-900">
        <RippleCursor />
        {children}
      </body>
    </html>
  );
}
