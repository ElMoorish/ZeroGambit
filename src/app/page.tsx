
import { Metadata } from "next";
import HomeClient from "./home-client";

export const metadata: Metadata = {
  title: "ZeroGambit - The Local-First Chess AI",
  description: "Analyze your chess games privately with local Stockfish and LLMs. No cloud fees, infinite depth.",
  alternates: {
    canonical: "https://zerogambit.app",
  },
};

export default function Page() {
  return <HomeClient />;
}
