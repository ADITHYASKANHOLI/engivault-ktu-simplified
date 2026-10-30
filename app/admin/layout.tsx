import React from "react";

export const metadata = {
  title: "FOLE Administrator Console",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-slate-50 text-slate-900">{children}</div>;
}
