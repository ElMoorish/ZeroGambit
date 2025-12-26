"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { motion } from "framer-motion";
import { Leaf, Trophy, Flame, Lock, TrendingUp, Puzzle, Target, Zap, BarChart3 } from "lucide-react";
import Link from "next/link";

gsap.registerPlugin(useGSAP);

interface UserStats {
    puzzlesSolved: number;
    gamesWon: number;
    gamesPlayed: number;
    streakDays: number;
    currentElo: number;
    eloChange: number;
}

const MOCK_STATS: UserStats = {
    puzzlesSolved: 142,
    gamesWon: 28,
    gamesPlayed: 45,
    streakDays: 5,
    currentElo: 1240,
    eloChange: 12,
};

// A more abstract "Growth Ring" visualization instead of a primitive tree
function GrowthRings({ stats }: { stats: UserStats }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Calculate growth metrics (normalized 0-1)
    const puzzleGrowth = Math.min(stats.puzzlesSolved / 200, 1);
    const winRate = stats.gamesPlayed > 0 ? stats.gamesWon / stats.gamesPlayed : 0;
    const streakBonus = Math.min(stats.streakDays / 30, 1);

    useGSAP(() => {
        if (!containerRef.current || !mounted) return;

        // Animate rings expanding
        gsap.fromTo(
            ".growth-ring",
            { scale: 0, opacity: 0 },
            {
                scale: 1,
                opacity: 1,
                duration: 1.2,
                stagger: 0.15,
                ease: "elastic.out(1, 0.5)"
            }
        );

        // Animate progress bars
        gsap.fromTo(
            ".progress-fill",
            { scaleX: 0 },
            { scaleX: 1, duration: 1, delay: 0.5, ease: "power2.out", stagger: 0.1 }
        );

        // Pulse effect on center
        gsap.to(".center-glow", {
            scale: 1.1,
            opacity: 0.8,
            duration: 2,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });

    }, { scope: containerRef, dependencies: [mounted] });

    return (
        <div ref={containerRef} className="relative w-full aspect-square max-w-xs mx-auto">
            {/* Outer Ring - Puzzles */}
            <div
                className="growth-ring absolute inset-0 rounded-full border-4 border-emerald-500/30"
                style={{
                    background: `conic-gradient(from 0deg, rgba(16, 185, 129, 0.3) ${puzzleGrowth * 360}deg, transparent ${puzzleGrowth * 360}deg)`
                }}
            />

            {/* Middle Ring - Win Rate */}
            <div
                className="growth-ring absolute inset-6 rounded-full border-4 border-amber-500/30"
                style={{
                    background: `conic-gradient(from 0deg, rgba(245, 158, 11, 0.3) ${winRate * 360}deg, transparent ${winRate * 360}deg)`
                }}
            />

            {/* Inner Ring - Streak */}
            <div
                className="growth-ring absolute inset-12 rounded-full border-4 border-violet-500/30"
                style={{
                    background: `conic-gradient(from 0deg, rgba(139, 92, 246, 0.4) ${streakBonus * 360}deg, transparent ${streakBonus * 360}deg)`
                }}
            />

            {/* Center Core */}
            <div className="growth-ring absolute inset-[4.5rem] rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center">
                <div className="center-glow absolute inset-2 rounded-full bg-primary/20 blur-xl" />
                <div className="relative z-10 text-center">
                    <Zap className="w-8 h-8 text-primary mx-auto mb-1" />
                    <span className="text-2xl font-bold">{stats.currentElo}</span>
                    <p className="text-xs text-muted-foreground">Elo</p>
                </div>
            </div>
        </div>
    );
}

function StatBar({ label, value, max, color, icon: Icon }: {
    label: string;
    value: number;
    max: number;
    color: string;
    icon: React.ComponentType<{ className?: string }>;
}) {
    const percent = Math.min((value / max) * 100, 100);

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                    <Icon className={`w-4 h-4 ${color}`} />
                    {label}
                </span>
                <span className="font-mono font-medium">{value}</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div
                    className={`progress-fill h-full rounded-full origin-left`}
                    style={{
                        width: `${percent}%`,
                        background: `linear-gradient(90deg, ${color.includes('emerald') ? '#10b981' : color.includes('amber') ? '#f59e0b' : '#8b5cf6'}, ${color.includes('emerald') ? '#059669' : color.includes('amber') ? '#d97706' : '#7c3aed'})`
                    }}
                />
            </div>
        </div>
    );
}

import { useSafeUser } from "@/hooks/useSafeClerk";

export function SkillGardenDashboard() {
    const stats = MOCK_STATS;
    const { user } = useSafeUser();

    // Check for any active subscription
    const subscription = user?.publicMetadata?.subscription as string | undefined;
    const isSubscribed = subscription === 'monthly' ||
        subscription === 'annual' ||
        subscription === 'grandmaster' ||
        subscription === 'candidate_master';

    return (
        <div className="container mx-auto px-6 py-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Welcome Back, Grandmaster</h1>
                    <p className="text-muted-foreground">Your skills are growing. Keep the streak alive!</p>
                </div>
                <Link href="/games">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors"
                    >
                        <Target className="w-5 h-5" />
                        Analyze New Game
                    </motion.button>
                </Link>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Growth Visualization */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:col-span-2 p-6 rounded-2xl bg-card border border-border"
                >
                    <div className="flex items-center gap-2 mb-6">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold">Growth Overview</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 items-center">
                        {/* Rings Visualization */}
                        <GrowthRings stats={stats} />

                        {/* Stats Breakdown */}
                        <div className="space-y-6">
                            <StatBar
                                label="Puzzles Solved"
                                value={stats.puzzlesSolved}
                                max={200}
                                color="text-emerald-500"
                                icon={Puzzle}
                            />
                            <StatBar
                                label="Games Won"
                                value={stats.gamesWon}
                                max={stats.gamesPlayed || 50}
                                color="text-amber-500"
                                icon={Trophy}
                            />
                            <StatBar
                                label="Streak Days"
                                value={stats.streakDays}
                                max={30}
                                color="text-violet-500"
                                icon={Flame}
                            />

                            {/* Legend */}
                            <div className="pt-4 border-t border-border">
                                <p className="text-xs text-muted-foreground mb-3">Ring Legend</p>
                                <div className="flex flex-wrap gap-4 text-xs">
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-3 h-3 rounded-full bg-emerald-500" /> Puzzles
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-3 h-3 rounded-full bg-amber-500" /> Win Rate
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-3 h-3 rounded-full bg-violet-500" /> Streak
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Quick Stats Panel */}
                <div className="space-y-4">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="p-6 rounded-2xl bg-card border border-border"
                    >
                        <div className="flex items-center gap-3 mb-3 text-muted-foreground">
                            <Trophy className="w-5 h-5" />
                            <span>Current Rating</span>
                        </div>
                        <p className="text-3xl font-bold">{stats.currentElo}</p>
                        <div className={`text-sm mt-1 flex items-center gap-1 ${stats.eloChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            <TrendingUp className="w-4 h-4" />
                            {stats.eloChange >= 0 ? '+' : ''}{stats.eloChange} this week
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="p-6 rounded-2xl bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20"
                    >
                        <div className="flex items-center gap-3 mb-3 text-orange-400">
                            <Flame className="w-5 h-5" />
                            <span>Current Streak</span>
                        </div>
                        <p className="text-3xl font-bold">{stats.streakDays} days</p>
                        <p className="text-sm text-muted-foreground mt-1">Keep it going!</p>
                    </motion.div>

                    {!isSubscribed && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-amber-500/10 border border-primary/20"
                        >
                            <div className="flex items-center gap-3 mb-3 text-primary">
                                <Lock className="w-5 h-5" />
                                <span>Pro Features</span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">Unlock AI Coach & Deep Analytics</p>
                            <Link href="/pricing" className="text-sm font-medium text-primary hover:underline">
                                Upgrade Now &rarr;
                            </Link>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
