import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

function getSafeSiteUrl(): URL {
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
  title: "FOLE — Free Open Learning & Education | College of Engineering Vadakara",
  description:
    "A student-led learning community at College of Engineering Vadakara. Explore open KTU learning resources, community activities and student-led projects.",
  keywords: ["FOLE", "KTU", "Engineering", "Mathematics", "Graphics", "Electrical", "Kerala Technological University", "KTU Notes", "KTU Lectures", "Open Education"],
  authors: [{ name: "FOLE Academic Initiative" }],
  openGraph: {
    title: "FOLE — Free Open Learning & Education | College of Engineering Vadakara",
    description: "Open learning resources, campus activities and opportunities shared by the FOLE CEV student community.",
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
      <body className="min-h-screen flex flex-col bg-[#F7F6EF] text-[#17231C] antialiased">
        {children}
      </body>
    </html>
  );
}
