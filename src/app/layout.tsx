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

export const metadata: Metadata = {
  title: {
    default: "ZeroGambit - AI Chess Coach & Analysis",
    template: "%s | ZeroGambit"
  },
  description: "Master chess with ZeroGambit. Advanced AI analysis, personalized coaching, and grandmaster-level insights for every move.",
  keywords: ["chess analysis", "stockfish", "ai chess coach", "chess improvement", "game review", "webrtc chess"],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://zerogambit.app",
    siteName: "ZeroGambit",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ZeroGambit Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ZeroGambit - AI Chess Coach",
    description: "Analyze your games with the power of local AI and Stockfish.",
    images: ["/og-image.png"],
  },
};

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
