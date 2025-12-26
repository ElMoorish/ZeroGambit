"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, Zap, Activity, Check, X, ChevronRight, RefreshCw } from "lucide-react";
import { useStockfishBench, BenchmarkResult, HardwareTier } from "@/hooks/useStockfishBench";

const TIER_COLORS: Record<HardwareTier, string> = {
    grandmaster: "text-emerald-400",
    master: "text-amber-400",
    club: "text-violet-400",
    unknown: "text-muted-foreground",
};

const TIER_BG: Record<HardwareTier, string> = {
    grandmaster: "from-emerald-500/20 to-emerald-500/5",
    master: "from-amber-500/20 to-amber-500/5",
    club: "from-violet-500/20 to-violet-500/5",
    unknown: "from-muted/20 to-muted/5",
};

interface SystemAwakeningProps {
    onComplete?: (result: BenchmarkResult) => void;
    onSkip?: () => void;
    autoStart?: boolean;
}

export function SystemAwakening({ onComplete, onSkip, autoStart = false }: SystemAwakeningProps) {
    const { runBenchmark, isRunning, progress, status, result, getCachedResult } = useStockfishBench();
    const [phase, setPhase] = useState<"idle" | "running" | "complete">("idle");
    const [showResult, setShowResult] = useState(false);

    useEffect(() => {
        // Check for cached result
        const cached = getCachedResult();
        if (cached) {
            setPhase("complete");
            setShowResult(true);
        } else if (autoStart) {
            handleStart();
        }
    }, []);

    const handleStart = async () => {
        setPhase("running");
        const benchResult = await runBenchmark();
        if (benchResult) {
            setPhase("complete");
            setTimeout(() => setShowResult(true), 500);
            onComplete?.(benchResult);
        }
    };

    const formatNps = (nps: number): string => {
        if (nps >= 1_000_000) return `${(nps / 1_000_000).toFixed(1)}M`;
        if (nps >= 1_000) return `${(nps / 1_000).toFixed(0)}K`;
        return nps.toString();
    };

    return (
        <div className="min-h-screen bg-[#1a1d21] flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg"
            >
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                    {/* Header */}
                    <div className="p-6 border-b border-border">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-primary/10">
                                <Cpu className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Neural Calibration</h2>
                                <p className="text-sm text-muted-foreground">Optimizing for your hardware</p>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <AnimatePresence mode="wait">
                            {phase === "idle" && (
                                <motion.div
                                    key="idle"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="text-center space-y-6"
                                >
                                    <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                        <Activity className="w-12 h-12 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground mb-4">
                                            We'll benchmark your device to optimize the chess engine and visual effects.
                                        </p>
                                        <p className="text-xs text-muted-foreground">Takes about 10 seconds</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleStart}
                                            className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
                                        >
                                            <Zap className="w-5 h-5" />
                                            Start Calibration
                                        </button>
                                        {onSkip && (
                                            <button
                                                onClick={onSkip}
                                                className="px-4 py-3 border border-border rounded-xl hover:bg-secondary transition-colors"
                                            >
                                                Skip
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {phase === "running" && (
                                <motion.div
                                    key="running"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-6"
                                >
                                    {/* Animated Progress Ring */}
                                    <div className="relative w-32 h-32 mx-auto">
                                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                            <circle
                                                cx="50"
                                                cy="50"
                                                r="45"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="8"
                                                className="text-secondary"
                                            />
                                            <motion.circle
                                                cx="50"
                                                cy="50"
                                                r="45"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="8"
                                                strokeLinecap="round"
                                                className="text-primary"
                                                strokeDasharray={283}
                                                strokeDashoffset={283 - (283 * progress) / 100}
                                                initial={{ strokeDashoffset: 283 }}
                                                animate={{ strokeDashoffset: 283 - (283 * progress) / 100 }}
                                                transition={{ duration: 0.3 }}
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-2xl font-bold">{Math.round(progress)}%</span>
                                        </div>
                                    </div>

                                    <div className="text-center">
                                        <p className="text-sm text-muted-foreground mb-2">{status}</p>
                                        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                            <motion.div
                                                animate={{ opacity: [0.5, 1, 0.5] }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                                className="w-2 h-2 rounded-full bg-primary"
                                            />
                                            Analyzing neural pathways...
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {phase === "complete" && result && showResult && (
                                <motion.div
                                    key="complete"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-6"
                                >
                                    {/* Result Card */}
                                    <div className={`p-6 rounded-xl bg-gradient-to-br ${TIER_BG[result.tier]} border border-border`}>
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className={`p-3 rounded-xl bg-background/50 ${TIER_COLORS[result.tier]}`}>
                                                <Zap className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Your Classification</p>
                                                <h3 className={`text-2xl font-bold ${TIER_COLORS[result.tier]}`}>
                                                    {result.label}
                                                </h3>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="p-3 rounded-lg bg-background/30">
                                                <p className="text-muted-foreground">Speed</p>
                                                <p className="font-mono font-bold">{formatNps(result.nps)} NPS</p>
                                            </div>
                                            <div className="p-3 rounded-lg bg-background/30">
                                                <p className="text-muted-foreground">Engine Depth</p>
                                                <p className="font-mono font-bold">{result.recommendations.engineDepth}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Recommendations */}
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-muted-foreground">Optimizations Applied:</p>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-sm">
                                                {result.recommendations.enableParticles ? (
                                                    <Check className="w-4 h-4 text-green-500" />
                                                ) : (
                                                    <X className="w-4 h-4 text-muted-foreground" />
                                                )}
                                                <span>Particle Effects</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                {result.recommendations.enableShaders ? (
                                                    <Check className="w-4 h-4 text-green-500" />
                                                ) : (
                                                    <X className="w-4 h-4 text-muted-foreground" />
                                                )}
                                                <span>Advanced Shaders</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Hardware Upgrade Suggestions - Only show if affiliate links are configured */}
                                    {result.tier === "club" && result.nps < 500000 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 }}
                                            className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20"
                                        >
                                            <p className="text-sm font-medium text-amber-400 mb-2">
                                                ⚡ Upgrade Your Chess Experience
                                            </p>
                                            <p className="text-xs text-muted-foreground mb-3">
                                                Your hardware is limiting engine depth. A faster CPU would enable deeper analysis (20+ ply instead of {result.recommendations.engineDepth} ply).
                                            </p>
                                            <div className="p-3 rounded-lg bg-background/30 text-sm">
                                                <p className="text-muted-foreground">
                                                    <strong className="text-white">Recommended specs:</strong>
                                                </p>
                                                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                                                    <li>• 8+ core CPU (Intel i7/i9 or AMD Ryzen 7/9)</li>
                                                    <li>• 16GB+ RAM</li>
                                                    <li>• SSD storage for fast position loading</li>
                                                </ul>
                                            </div>
                                        </motion.div>
                                    )}

                                    <button
                                        onClick={() => window.location.href = '/'}
                                        className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
                                    >
                                        Continue to Dashboard
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default SystemAwakening;
