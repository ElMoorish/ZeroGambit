"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Navigation } from "@/components/Navigation";
import {
    Dna,
    Sword,
    Shield,
    Target,
    Crown,
    TrendingUp,
    Flame,
    Zap,
    Brain,
    BookOpen,
    Trophy,
    AlertTriangle
} from "lucide-react";
import { getChessDNA, getGameStats, getOpeningStats, type ChessDNA, type OpeningStats } from "@/lib/db";

/**
 * Chess DNA Page - Your Playing Style Visualization
 * 
 * Analyzes your games to reveal:
 * - Aggression Index
 * - Accuracy Score
 * - Tactic Sharpness
 * - Endgame Strength
 * - Opening Preferences
 */

const DNA_TRAITS = [
    { key: "aggressionIndex", label: "Aggression", icon: Flame, color: "from-red-500 to-orange-500" },
    { key: "accuracyScore", label: "Accuracy", icon: Target, color: "from-blue-500 to-cyan-500" },
    { key: "tacticSharpness", label: "Tactics", icon: Zap, color: "from-yellow-500 to-amber-500" },
    { key: "endgameStrength", label: "Endgame", icon: Crown, color: "from-purple-500 to-pink-500" },
];

export default function DNAPage() {
    const [dna, setDna] = useState<ChessDNA | null>(null);
    const [stats, setStats] = useState({ total: 0, analyzed: 0, wins: 0, losses: 0, draws: 0 });
    const [openingData, setOpeningData] = useState<{
        openings: OpeningStats[];
        totalGamesWithOpening: number;
        bestOpening: OpeningStats | null;
        worstOpening: OpeningStats | null;
        mostPlayed: OpeningStats | null;
    } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasRealData, setHasRealData] = useState(false);

    useEffect(() => {
        async function loadData() {
            try {
                const [dnaData, statsData, openingStatsData] = await Promise.all([
                    getChessDNA(),
                    getGameStats(),
                    getOpeningStats(),
                ]);

                // Only use DNA data if we have real analyzed games
                if (dnaData && dnaData.gamesAnalyzed > 0) {
                    setDna(dnaData);
                    setHasRealData(true);
                } else {
                    setDna(null);
                    setHasRealData(false);
                }
                setStats(statsData);
                setOpeningData(openingStatsData);
            } catch (error) {
                console.error("Failed to load DNA:", error);
                setDna(null);
                setHasRealData(false);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, []);

    // Calculate player type based on DNA
    const getPlayerType = (dna: ChessDNA) => {
        if (dna.aggressionIndex > 70) return { type: "The Attacker", icon: Sword, color: "text-red-400" };
        if (dna.endgameStrength > 70) return { type: "The Grinder", icon: Crown, color: "text-purple-400" };
        if (dna.tacticSharpness > 70) return { type: "The Tactician", icon: Zap, color: "text-yellow-400" };
        if (dna.accuracyScore > 70) return { type: "The Surgeon", icon: Target, color: "text-blue-400" };
        return { type: "The Balanced", icon: Shield, color: "text-primary" };
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const playerType = dna ? getPlayerType(dna) : null;

    return (
        <div className="min-h-screen bg-background">
            <Navigation />

            <main className="container mx-auto px-6 py-24">
                {/* Header */}
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4"
                    >
                        <Dna className="w-4 h-4" />
                        Chess DNA Analysis
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-bold mb-4"
                    >
                        Your <span className="text-primary">Playing Style</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-muted-foreground max-w-lg mx-auto"
                    >
                        Deep analysis of your games reveals your unique chess fingerprint.
                    </motion.p>
                </div>

                {/* Empty State - No games analyzed yet */}
                {!dna && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-2xl mx-auto text-center py-16"
                    >
                        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Dna className="w-12 h-12 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold mb-4">No Games Analyzed Yet</h2>
                        <p className="text-muted-foreground mb-8">
                            Import your games from Chess.com or Lichess to generate your unique Chess DNA profile.
                            We'll analyze your playing patterns, opening preferences, and tactical tendencies.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a
                                href="/games"
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                            >
                                Import Games
                            </a>
                            <a
                                href="/puzzles"
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-border rounded-xl font-medium hover:bg-white/5 transition-colors"
                            >
                                Solve Puzzles Instead
                            </a>
                        </div>
                    </motion.div>
                )}

                {/* DNA Visualization - Only show when we have real data */}
                {dna && playerType && (
                    <div className="max-w-6xl mx-auto">
                        {/* Player Type Card */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-card border border-border rounded-2xl p-8 mb-12 text-center"
                        >
                            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <playerType.icon className={`w-10 h-10 ${playerType.color}`} />
                            </div>
                            <h2 className={`text-3xl font-bold mb-2 ${playerType.color}`}>
                                {playerType.type}
                            </h2>
                            <p className="text-muted-foreground">
                                Based on {dna.gamesAnalyzed || stats.total} games analyzed
                            </p>
                        </motion.div>

                        {/* DNA Stats Grid */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                            {DNA_TRAITS.map((trait, index) => {
                                const Icon = trait.icon;
                                const value = dna[trait.key as keyof ChessDNA] as number;
                                return (
                                    <motion.div
                                        key={trait.key}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 * index }}
                                        className="bg-card border border-border rounded-2xl p-6"
                                    >
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className={`p-2 rounded-lg bg-gradient-to-br ${trait.color} bg-opacity-20`}>
                                                <Icon className="w-5 h-5 text-white" />
                                            </div>
                                            <span className="font-medium">{trait.label}</span>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="h-3 bg-slate-800 rounded-full overflow-hidden mb-2">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${value}%` }}
                                                transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                                                className={`h-full bg-gradient-to-r ${trait.color} rounded-full`}
                                            />
                                        </div>

                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Score</span>
                                            <span className="font-bold">{value}%</span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Opening Repertoire */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="bg-card border border-border rounded-2xl p-8 mb-12"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-primary" />
                                    Opening Analyzer
                                </h3>
                                <a
                                    href="/openings"
                                    className="text-sm text-primary hover:underline flex items-center gap-1"
                                >
                                    Train Openings →
                                </a>
                            </div>

                            {openingData && openingData.openings.length > 0 ? (
                                <>
                                    {/* Stats Summary */}
                                    <div className="grid grid-cols-3 gap-4 mb-6">
                                        <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                                            <div className="text-2xl font-bold text-primary">{openingData.totalGamesWithOpening}</div>
                                            <div className="text-xs text-muted-foreground">Games with Opening</div>
                                        </div>
                                        {openingData.bestOpening && (
                                            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
                                                <div className="text-2xl font-bold text-green-400">{openingData.bestOpening.winRate.toFixed(0)}%</div>
                                                <div className="text-xs text-muted-foreground">Best: {openingData.bestOpening.eco}</div>
                                            </div>
                                        )}
                                        {openingData.worstOpening && (
                                            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                                                <div className="text-2xl font-bold text-red-400">{openingData.worstOpening.winRate.toFixed(0)}%</div>
                                                <div className="text-xs text-muted-foreground">Weakest: {openingData.worstOpening.eco}</div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                                        {/* Most Played Openings */}
                                        <div className="bg-slate-800/50 rounded-xl p-4">
                                            <h4 className="text-sm font-medium text-muted-foreground mb-3">Most Played</h4>
                                            <div className="space-y-2">
                                                {openingData.openings.slice(0, 5).map((opening) => {
                                                    const maxGames = openingData.openings[0].totalGames;
                                                    const widthPercent = (opening.totalGames / maxGames) * 100;
                                                    return (
                                                        <div key={opening.eco} className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                <span className="font-mono text-primary text-sm">{opening.eco}</span>
                                                                <span className="text-xs text-muted-foreground truncate">{opening.name.split(':')[0]}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-primary rounded-full"
                                                                        style={{ width: `${widthPercent}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-xs text-muted-foreground w-8 text-right">{opening.totalGames}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Opening Performance */}
                                        <div className="bg-slate-800/50 rounded-xl p-4">
                                            <h4 className="text-sm font-medium text-muted-foreground mb-3">Win Rate by Opening</h4>
                                            <div className="space-y-2">
                                                {openingData.openings.slice(0, 5).map((opening) => {
                                                    const color = opening.winRate >= 55 ? "text-green-400" :
                                                        opening.winRate >= 45 ? "text-yellow-400" : "text-red-400";
                                                    return (
                                                        <div key={opening.eco} className="flex items-center justify-between text-sm">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-mono text-xs">{opening.eco}</span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {opening.wins}W / {opening.losses}L / {opening.draws}D
                                                                </span>
                                                            </div>
                                                            <span className={`font-medium ${color}`}>
                                                                {opening.winRate.toFixed(0)}%
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Weakness Alert */}
                                    {openingData.worstOpening && openingData.worstOpening.winRate < 50 && (
                                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-red-500/20 rounded-lg">
                                                    <AlertTriangle className="w-5 h-5 text-red-400" />
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-red-400 mb-1">Improvement Needed</h4>
                                                    <p className="text-sm text-muted-foreground mb-3">
                                                        Your win rate with <span className="text-white font-medium">{openingData.worstOpening.name}</span> ({openingData.worstOpening.eco}) is only {openingData.worstOpening.winRate.toFixed(0)}%.
                                                    </p>
                                                    <a
                                                        href={`/openings?eco=${openingData.worstOpening.eco.charAt(0)}`}
                                                        className="inline-flex items-center gap-2 text-sm bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg transition-colors"
                                                    >
                                                        <Zap className="w-4 h-4" />
                                                        Practice {openingData.worstOpening.eco} Openings
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Best Opening Highlight */}
                                    {openingData.bestOpening && openingData.bestOpening.winRate >= 60 && (
                                        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mt-4">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-green-500/20 rounded-lg">
                                                    <Trophy className="w-5 h-5 text-green-400" />
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-green-400 mb-1">Your Strongest Opening</h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        <span className="text-white font-medium">{openingData.bestOpening.name}</span> ({openingData.bestOpening.eco}) with {openingData.bestOpening.winRate.toFixed(0)}% win rate across {openingData.bestOpening.totalGames} games!
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>Import games to see your opening statistics</p>
                                    <a href="/games" className="text-primary hover:underline text-sm mt-2 inline-block">
                                        Import Games →
                                    </a>
                                </div>
                            )}
                        </motion.div>

                        {/* Stats Summary */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="bg-card border border-border rounded-2xl p-8"
                        >
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-primary" />
                                Game Statistics
                            </h3>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {[
                                    { label: "Total Games", value: stats.total },
                                    { label: "Wins", value: stats.wins, color: "text-green-400" },
                                    { label: "Losses", value: stats.losses, color: "text-red-400" },
                                    { label: "Draws", value: stats.draws, color: "text-yellow-400" },
                                ].map((stat) => (
                                    <div key={stat.label} className="text-center">
                                        <p className={`text-3xl font-bold ${stat.color || "text-white"}`}>
                                            {stat.value}
                                        </p>
                                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* CTA */}
                        {stats.total === 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8 }}
                                className="text-center mt-12"
                            >
                                <p className="text-muted-foreground mb-4">
                                    Import your games to generate your real Chess DNA
                                </p>
                                <a
                                    href="/games"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
                                >
                                    Import Games
                                </a>
                            </motion.div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
