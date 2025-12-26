"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Brain,
    BookOpen,
    AlertTriangle,
    Lightbulb,
    GraduationCap,
    Volume2,
    VolumeX,
    Globe,
    ChevronRight,
    BarChart3,
    Target
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CriticalMove {
    moveNumber: number;
    move: string;
    played: string;
    best: string;
    evalBefore: number;
    evalAfter: number;
    fen?: string;
}

interface MoveEvaluation {
    ply: number;
    moveNumber: number;
    move: string;
    evaluation: number | null;
    mate: number | null;
    classification?: string;
}

interface CoachInsightsProps {
    openingName?: string;
    openingPgn?: string;
    openingFen?: string;
    openingSummary?: string;
    criticalMoves?: CriticalMove[];
    keyInsights?: string[];
    lesson?: string;
    isAnalyzing?: boolean;
    analysisComplete?: boolean;
    onMoveClick?: (ply: number) => void;
    // TTS props
    ttsEnabled?: boolean;
    onTtsToggle?: (enabled: boolean) => void;
    ttsLanguage?: "en" | "fr";
    onLanguageChange?: (lang: "en" | "fr") => void;
    // New: evaluations for statistics
    evaluations?: MoveEvaluation[];
    totalMoves?: number;
}

// Classification icons and colors
const CLASSIFICATION_CONFIG: Record<string, { label: string; labelFr: string; color: string; icon: string }> = {
    brilliant: { label: "Brilliant", labelFr: "Brillant", color: "#98d4a8", icon: "🌟" },
    great: { label: "Great", labelFr: "Très bon", color: "#8ec3d4", icon: "✨" },
    best: { label: "Best", labelFr: "Meilleur", color: "#7fb285", icon: "✓" },
    excellent: { label: "Excellent", labelFr: "Excellent", color: "#a8c9a0", icon: "👍" },
    good: { label: "Good", labelFr: "Bon", color: "#b4c4be", icon: "○" },
    book: { label: "Book", labelFr: "Théorique", color: "#a88865", icon: "📖" },
    inaccuracy: { label: "Inaccuracy", labelFr: "Imprécision", color: "#d4a574", icon: "?" },
    mistake: { label: "Mistake", labelFr: "Erreur", color: "#c9a078", icon: "✗" },
    miss: { label: "Miss", labelFr: "Manqué", color: "#c9a078", icon: "○" },
    blunder: { label: "Blunder", labelFr: "Gaffe", color: "#c97b84", icon: "??" },
};

// Clean opening name from URL format
function cleanOpeningName(name: string): string {
    if (!name) return "";

    // If it's a URL, extract the opening name
    if (name.includes("chess.com/openings/") || name.includes("/")) {
        const parts = name.split("/");
        const lastPart = parts[parts.length - 1];
        // Remove URL encoding and format
        name = decodeURIComponent(lastPart);
    }

    // Replace hyphens with spaces
    name = name.replace(/-/g, " ");

    // Remove move notations like "4.Nf3" or "4...e5"
    name = name.replace(/\d+\.+[A-Za-z][a-z]?\d?/g, "").trim();

    // Clean up extra spaces
    name = name.replace(/\s+/g, " ").trim();

    return name;
}

export function CoachInsights({
    openingName,
    openingPgn,
    openingFen,
    openingSummary,
    criticalMoves = [],
    keyInsights = [],
    lesson,
    isAnalyzing = false,
    analysisComplete = false,
    onMoveClick,
    ttsEnabled = false,
    onTtsToggle,
    ttsLanguage = "fr",
    onLanguageChange,
    evaluations = [],
    totalMoves = 0,
}: CoachInsightsProps) {
    const [language, setLanguage] = useState<"en" | "fr">(ttsLanguage);

    // Sync language with parent
    useEffect(() => {
        setLanguage(ttsLanguage);
    }, [ttsLanguage]);

    // Calculate move statistics
    const moveStats = useMemo(() => {
        const stats: Record<string, { white: number; black: number }> = {};

        // Initialize all categories
        Object.keys(CLASSIFICATION_CONFIG).forEach(key => {
            stats[key] = { white: 0, black: 0 };
        });
        stats['normal'] = { white: 0, black: 0 };

        // Count each classification
        evaluations.forEach(e => {
            const classification = e.classification || 'normal';
            const isWhite = e.ply % 2 === 1;
            if (stats[classification]) {
                if (isWhite) {
                    stats[classification].white++;
                } else {
                    stats[classification].black++;
                }
            }
        });

        return stats;
    }, [evaluations]);

    // Calculate precision for each player
    const precision = useMemo(() => {
        let whiteGood = 0, whiteTotal = 0;
        let blackGood = 0, blackTotal = 0;

        evaluations.forEach(e => {
            const classification = e.classification || 'normal';
            const isWhite = e.ply % 2 === 1;
            const isGood = ['brilliant', 'great', 'best', 'excellent', 'good', 'book', 'normal'].includes(classification);

            if (isWhite) {
                whiteTotal++;
                if (isGood) whiteGood++;
            } else {
                blackTotal++;
                if (isGood) blackGood++;
            }
        });

        return {
            white: whiteTotal > 0 ? Math.round((whiteGood / whiteTotal) * 100) : 0,
            black: blackTotal > 0 ? Math.round((blackGood / blackTotal) * 100) : 0,
        };
    }, [evaluations]);

    const handleLanguageToggle = () => {
        const newLang = language === "en" ? "fr" : "en";
        setLanguage(newLang);
        onLanguageChange?.(newLang);
    };

    const handleTtsToggle = () => {
        onTtsToggle?.(!ttsEnabled);
    };

    const labels = {
        en: {
            title: "Coach Insights",
            subtitle: "Voice commentary " + (ttsEnabled ? "ON" : "OFF"),
            opening: "Opening Recognition",
            critical: "Critical Moves",
            insights: "Key Insights",
            lesson: "Lesson",
            statistics: "Move Statistics",
            precision: "Precision",
            waiting: "Click 'Analyze' to get AI insights",
            analyzing: "Analyzing your game...",
            move: "Move",
            played: "Played",
            best: "Best",
            eval: "Eval",
            totalMoves: "Total Moves",
            white: "White",
            black: "Black",
        },
        fr: {
            title: "Analyse du Coach",
            subtitle: "Commentaire vocal " + (ttsEnabled ? "ACTIVÉ" : "DÉSACTIVÉ"),
            opening: "Reconnaissance d'ouverture",
            critical: "Coups Critiques",
            insights: "Points Clés",
            lesson: "Leçon",
            statistics: "Statistiques des coups",
            precision: "Précision",
            waiting: "Cliquez sur 'Analyser' pour obtenir des conseils",
            analyzing: "Analyse en cours...",
            move: "Coup",
            played: "Joué",
            best: "Meilleur",
            eval: "Éval",
            totalMoves: "Total des coups",
            white: "Blancs",
            black: "Noirs",
        },
    };

    const t = labels[language];
    const cleanedOpeningName = openingName ? cleanOpeningName(openingName) : "";

    const formatEval = (evaluation: number) => {
        if (evaluation >= 0) return `+${evaluation.toFixed(1)}`;
        return evaluation.toFixed(1);
    };

    // Get categories with moves (non-zero)
    const activeCategories = useMemo(() => {
        return Object.entries(CLASSIFICATION_CONFIG).filter(([key]) => {
            const stat = moveStats[key];
            return stat && (stat.white > 0 || stat.black > 0);
        });
    }, [moveStats]);

    // Debug logging
    useEffect(() => {
        console.log("[CoachInsights Debug] keyInsights:", keyInsights);
        console.log("[CoachInsights Debug] lesson:", lesson);
        console.log("[CoachInsights Debug] openingSummary:", openingSummary);
    }, [keyInsights, lesson, openingSummary]);

    return (
        <div className="h-full flex flex-col bg-card rounded-2xl border border-border overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-border bg-card/80 backdrop-blur flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Brain className="w-5 h-5 text-primary" />
                        <div>
                            <h2 className="font-semibold text-sm">{t.title}</h2>
                            <p className="text-xs text-muted-foreground">{t.subtitle}</p>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2">
                        {/* Language toggle */}
                        <button
                            onClick={handleLanguageToggle}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-secondary hover:bg-secondary/80 transition-colors"
                        >
                            <Globe className="w-3 h-3" />
                            {language.toUpperCase()}
                        </button>

                        {/* TTS toggle */}
                        {analysisComplete && (
                            <button
                                onClick={handleTtsToggle}
                                className={cn(
                                    "p-2 rounded-lg transition-all",
                                    ttsEnabled
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-secondary hover:bg-secondary/80"
                                )}
                            >
                                {ttsEnabled ? (
                                    <Volume2 className="w-4 h-4" />
                                ) : (
                                    <VolumeX className="w-4 h-4" />
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
                <AnimatePresence mode="wait">
                    {!analysisComplete && !isAnalyzing ? (
                        <motion.div
                            key="waiting"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center h-full text-center py-12"
                        >
                            <Brain className="w-16 h-16 text-muted-foreground/30 mb-4" />
                            <p className="text-muted-foreground">{t.waiting}</p>
                        </motion.div>
                    ) : isAnalyzing ? (
                        <motion.div
                            key="analyzing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center h-full text-center py-12"
                        >
                            <div className="relative">
                                <Brain className="w-16 h-16 text-primary animate-pulse" />
                            </div>
                            <p className="text-muted-foreground mt-4">{t.analyzing}</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="complete"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-5"
                        >
                            {/* Opening Recognition - Cleaned Name */}
                            {cleanedOpeningName && (
                                <section className="space-y-2">
                                    <div className="flex items-center gap-2 text-primary">
                                        <BookOpen className="w-4 h-4" />
                                        <h3 className="font-medium text-sm">{t.opening}</h3>
                                    </div>
                                    <div className="bg-secondary/30 rounded-xl p-3 space-y-2">
                                        <p className="font-medium text-foreground">{cleanedOpeningName}</p>
                                        {openingPgn && (
                                            <p className="text-xs text-muted-foreground font-mono">{openingPgn}</p>
                                        )}
                                        {openingSummary && (
                                            <p className="text-sm text-muted-foreground leading-relaxed italic border-l-2 border-primary/30 pl-3">
                                                {openingSummary}
                                            </p>
                                        )}
                                    </div>
                                </section>
                            )}

                            {/* Move Statistics */}
                            {evaluations.length > 0 && (
                                <section className="space-y-2">
                                    <div className="flex items-center gap-2 text-[#8ec3d4]">
                                        <BarChart3 className="w-4 h-4" />
                                        <h3 className="font-medium text-sm">{t.statistics}</h3>
                                    </div>
                                    <div className="bg-secondary/30 rounded-xl p-3 space-y-3">
                                        {/* Total moves */}
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">{t.totalMoves}</span>
                                            <span className="font-mono font-medium">{Math.ceil(evaluations.length / 2)}</span>
                                        </div>

                                        {/* Precision */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-white/5 rounded-lg p-2 text-center">
                                                <div className="text-xs text-muted-foreground mb-1">{t.white} {t.precision}</div>
                                                <div className="text-xl font-bold text-foreground">{precision.white}%</div>
                                            </div>
                                            <div className="bg-black/20 rounded-lg p-2 text-center">
                                                <div className="text-xs text-muted-foreground mb-1">{t.black} {t.precision}</div>
                                                <div className="text-xl font-bold text-foreground">{precision.black}%</div>
                                            </div>
                                        </div>

                                        {/* Category breakdown */}
                                        <div className="space-y-1 pt-2 border-t border-border/50">
                                            {activeCategories.map(([key, config]) => {
                                                const stat = moveStats[key];
                                                const total = stat.white + stat.black;
                                                if (total === 0) return null;

                                                return (
                                                    <div key={key} className="flex items-center justify-between text-xs">
                                                        <div className="flex items-center gap-2">
                                                            <span>{config.icon}</span>
                                                            <span style={{ color: config.color }}>
                                                                {language === 'fr' ? config.labelFr : config.label}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-3 font-mono">
                                                            <span className="text-white/70">⬜ {stat.white}</span>
                                                            <span className="text-black/70 bg-white/10 px-1 rounded">⬛ {stat.black}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* Critical Moves */}
                            {criticalMoves.length > 0 && (
                                <section className="space-y-2">
                                    <div className="flex items-center gap-2 text-[#c97b84]">
                                        <AlertTriangle className="w-4 h-4" />
                                        <h3 className="font-medium text-sm">{t.critical}</h3>
                                    </div>
                                    <div className="space-y-2">
                                        {criticalMoves.slice(0, 4).map((m, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                                onClick={() => onMoveClick?.(m.moveNumber * 2 - 1)}
                                                className="bg-[#c97b84]/10 border border-[#c97b84]/20 rounded-lg p-3 cursor-pointer hover:bg-[#c97b84]/20 transition-colors"
                                            >
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="font-mono text-muted-foreground">
                                                        {t.move} {m.moveNumber}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatEval(m.evalBefore)} → {formatEval(m.evalAfter)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-foreground font-medium">{t.played}: <code className="text-[#c97b84]">{m.played}</code></span>
                                                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                                                    <span className="text-foreground">{t.best}: <code className="text-primary">{m.best}</code></span>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Key Insights */}
                            {keyInsights.length > 0 && (
                                <section className="space-y-2">
                                    <div className="flex items-center gap-2 text-[#8ec3d4]">
                                        <Lightbulb className="w-4 h-4" />
                                        <h3 className="font-medium text-sm">{t.insights}</h3>
                                    </div>
                                    <div className="bg-[#8ec3d4]/10 border border-[#8ec3d4]/20 rounded-xl p-3 space-y-2">
                                        {keyInsights.map((insight, i) => (
                                            <div key={i} className="flex items-start gap-2">
                                                <span className="text-[#8ec3d4] mt-1">•</span>
                                                <p className="text-sm text-foreground/90 leading-relaxed">{insight}</p>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Lesson */}
                            {lesson && (
                                <section className="space-y-2">
                                    <div className="flex items-center gap-2 text-[#7fb285]">
                                        <GraduationCap className="w-4 h-4" />
                                        <h3 className="font-medium text-sm">{t.lesson}</h3>
                                    </div>
                                    <div className="bg-[#7fb285]/10 border border-[#7fb285]/20 rounded-xl p-3">
                                        <p className="text-sm text-foreground/90 leading-relaxed">{lesson}</p>
                                    </div>
                                </section>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
