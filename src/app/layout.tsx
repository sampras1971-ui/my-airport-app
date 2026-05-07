import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Airport Search App",
  description: "Created with Claude",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
