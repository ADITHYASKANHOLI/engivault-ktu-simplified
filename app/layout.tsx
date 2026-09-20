import type { Metadata, Viewport } from "next";
import "./globals.css";
import { RippleCursor } from "@/components/effects/RippleCursor";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "ENGIVAULT — KTU Learning. Simplified.",
  description:
    "Authentic video lectures, structured module breakdowns, and exam question notes built specifically for Kerala Technological University (KTU) engineering students.",
  keywords: ["KTU", "Engineering", "Mathematics", "Graphics", "Electrical", "Kerala Technological University", "KTU Notes", "KTU Lectures"],
  authors: [{ name: "ENGIVAULT Team" }],
  openGraph: {
    title: "ENGIVAULT — KTU Learning. Simplified.",
    description: "Master KTU Engineering subjects with recorded video classes and authentic downloadable study materials.",
    type: "website",
    images: [{ url: "/branding/engivault-logo.png", width: 1024, height: 341, alt: "ENGIVAULT" }],
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
      <body className="min-h-screen flex flex-col bg-[#F7F9FC] text-[#0B1220] antialiased selection:bg-cyan-200 selection:text-blue-950">
        <RippleCursor />
        {children}
      </body>
    </html>
  );
}
