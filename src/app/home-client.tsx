"use client";
// Build: Christmas Update v1.2 - Snow + Banner

import { SignedIn, SignedOut } from "@clerk/nextjs";
import NeuralHero from "@/components/landing/NeuralHero";
import { FirstMoveHero } from "@/components/landing/FirstMoveHero";
import { LocalFirstExplainer } from "@/components/landing/LocalFirstExplainer";
import { HeroConverter } from "@/components/landing/HeroConverter";
import { DataVault } from "@/components/landing/DataVault";
import { Gallery } from "@/components/landing/Gallery";
import { FeaturesSection, CTASection } from "@/components/landing/FeatureSections";
import { DistributedPulse } from "@/components/landing/DistributedPulse";
import { Manifesto } from "@/components/landing/Manifesto";
import { DailyRitual } from "@/components/landing/DailyRitual";
import { SkillGardenDashboard } from "@/components/dashboard/SkillGarden";
import { SonicToggle } from "@/hooks/useSonicIdentity";
import { ChristmasBanner } from "@/components/banners/ChristmasBanner";
import { Snowfall } from "@/components/effects/Snowfall";

export default function HomePage() {
  return (
    <main className="flex-1 bg-[#1a1d21] min-h-screen">

      {/* Snowfall Effect (both states) */}
      <Snowfall intensity="light" />

      {/* Sound Toggle (both states) */}
      <SonicToggle />

      {/* Public Landing Page */}
      <SignedOut>
        {/* Christmas Under Construction Banner */}
        <ChristmasBanner />

        {/* Distributed Pulse Status Bar */}
        <DistributedPulse />

        {/* Neural Hero with Canvas Particles */}
        <NeuralHero />

        {/* Architecture Explainer (Scroll-driven) */}
        <LocalFirstExplainer />

        {/* PGN to Video Converter Demo */}
        <HeroConverter />

        {/* Gallery - Social Proof Marquee */}
        <Gallery />

        {/* Interactive First Move Hero */}
        <FirstMoveHero />

        {/* Data Vault Animation */}
        <DataVault />

        {/* Daily Ritual - Puzzle, Quote, Tip */}
        <DailyRitual />

        {/* Features Section */}
        <FeaturesSection />

        {/* The Manifesto */}
        <Manifesto />

        {/* Final CTA */}
        <CTASection />
      </SignedOut>

      {/* Authenticated Dashboard */}
      <SignedIn>
        {/* Status Bar */}
        <DistributedPulse />

        {/* Skill Garden Dashboard */}
        <SkillGardenDashboard />

        {/* Daily Ritual for retention */}
        <DailyRitual />
      </SignedIn>

    </main>
  );
}
