import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { BoardThemeProvider } from "@/context/BoardThemeContext";
import { CommandPalette } from "@/components/CommandPalette";
import { ClientClerkProvider } from "@/components/ClientClerkProvider";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} bg-background text-foreground antialiased`}>
        <ClientClerkProvider>
          <BoardThemeProvider>
            <div className="min-h-screen flex flex-col">
              <Navigation />
              {children}
            </div>
            {/* Global Command Palette - Cmd+K */}
            <CommandPalette />
          </BoardThemeProvider>
        </ClientClerkProvider>
      </body>
    </html>
  );
}
