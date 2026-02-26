import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "2D Grid Explorer",
  description: "Interactive 2D grid with zoom and pan",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
