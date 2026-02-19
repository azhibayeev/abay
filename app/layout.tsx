import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Knowledge Graph",
  description: "Интерактивный 3D-граф связей с людьми",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="dark">
      <body className="antialiased bg-[#080c14] text-white font-sans">
        {children}
      </body>
    </html>
  );
}
