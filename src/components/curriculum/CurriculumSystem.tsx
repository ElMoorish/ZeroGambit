"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Target,
    Sword,
    Crown,
    Lock,
    Check,
    ChevronRight,
    Zap,
    BookOpen,
    Trophy,
} from "lucide-react";
import { db } from "@/lib/db";

/**
 * Curriculum System - The Stone & Sage Methodology
 * 
 * Phase I: The Stone (Tactics) - Pattern recognition, puzzles
 * Phase II: The Flow (Strategy) - Opening tree mastery
 * Phase III: The Sage (Endgame) - Theoretical draws and wins
 */

export interface CurriculumPhase {
    id: "stone" | "flow" | "sage";
    title: string;
    subtitle: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    borderColor: string;
    description: string;
    modules: CurriculumModule[];
}

export interface CurriculumModule {
    id: string;
    title: string;
    description: string;
    puzzleCount: number;
    requiredAccuracy: number; // 0-100
    unlocked: boolean;
    completed: boolean;
    progress: number; // 0-100
    // NEW: Rating range and themes for filtering puzzles
    ratingMin: number;
    ratingMax: number;
    themes: string[]; // Lichess puzzle themes
}

// The Three Phases with rating-based progression
export const CURRICULUM_PHASES: CurriculumPhase[] = [
    {
        id: "stone",
        title: "The Stone",
        subtitle: "Tactical Foundation",
        icon: Target,
        color: "text-amber-400",
        bgColor: "from-amber-500/20 to-amber-600/20",
        borderColor: "border-amber-500/30",
        description: "Master the patterns that create combinations. Every grandmaster was first a tactician.",
        modules: [
            { id: "stone-1", title: "Pin & Skewer", description: "Geometric attacks", puzzleCount: 200, requiredAccuracy: 70, unlocked: true, completed: false, progress: 0, ratingMin: 400, ratingMax: 800, themes: ["pin", "skewer"] },
            { id: "stone-2", title: "Fork Mastery", description: "Double attacks", puzzleCount: 200, requiredAccuracy: 75, unlocked: true, completed: false, progress: 0, ratingMin: 600, ratingMax: 1000, themes: ["fork", "doubleAttack"] },
            { id: "stone-3", title: "Discovery & Double Check", description: "Hidden threats", puzzleCount: 200, requiredAccuracy: 75, unlocked: true, completed: false, progress: 0, ratingMin: 800, ratingMax: 1200, themes: ["discoveredAttack", "doubleCheck"] },
            { id: "stone-4", title: "Back Rank Tactics", description: "Mate patterns", puzzleCount: 200, requiredAccuracy: 80, unlocked: true, completed: false, progress: 0, ratingMin: 1000, ratingMax: 1400, themes: ["backRankMate", "mateIn1", "mateIn2"] },
            { id: "stone-5", title: "Deflection & Decoy", description: "Advanced combinations", puzzleCount: 200, requiredAccuracy: 80, unlocked: true, completed: false, progress: 0, ratingMin: 1200, ratingMax: 1600, themes: ["deflection", "attraction", "interference"] },
        ],
    },
    {
        id: "flow",
        title: "The Flow",
        subtitle: "Strategic Mastery",
        icon: Sword,
        color: "text-emerald-400",
        bgColor: "from-emerald-500/20 to-emerald-600/20",
        borderColor: "border-emerald-500/30",
        description: "Understand the rhythm of the game. Develop plans that flow from opening to middlegame.",
        modules: [
            { id: "flow-1", title: "Opening Principles", description: "Development & center", puzzleCount: 200, requiredAccuracy: 70, unlocked: true, completed: false, progress: 0, ratingMin: 600, ratingMax: 1000, themes: ["opening", "hangingPiece"] },
            { id: "flow-2", title: "Pawn Structure", description: "The skeleton of position", puzzleCount: 200, requiredAccuracy: 75, unlocked: true, completed: false, progress: 0, ratingMin: 1000, ratingMax: 1400, themes: ["advancedPawn", "quietMove"] },
            { id: "flow-3", title: "Piece Activity", description: "Optimal placement", puzzleCount: 200, requiredAccuracy: 75, unlocked: true, completed: false, progress: 0, ratingMin: 1200, ratingMax: 1600, themes: ["trappedPiece", "sacrifice"] },
            { id: "flow-4", title: "King Safety", description: "Castling & attacks", puzzleCount: 200, requiredAccuracy: 80, unlocked: true, completed: false, progress: 0, ratingMin: 1400, ratingMax: 1800, themes: ["kingsideAttack", "attackingF2F7"] },
            { id: "flow-5", title: "Prophylaxis", description: "Preventing opponent's plans", puzzleCount: 200, requiredAccuracy: 85, unlocked: true, completed: false, progress: 0, ratingMin: 1600, ratingMax: 2000, themes: ["defensiveMove", "zugzwang"] },
        ],
    },
    {
        id: "sage",
        title: "The Sage",
        subtitle: "Endgame Wisdom",
        icon: Crown,
        color: "text-purple-400",
        bgColor: "from-purple-500/20 to-purple-600/20",
        borderColor: "border-purple-500/30",
        description: "The final wisdom. Convert advantages and save half-points with endgame mastery.",
        modules: [
            { id: "sage-1", title: "King & Pawn", description: "Opposition & triangulation", puzzleCount: 200, requiredAccuracy: 75, unlocked: true, completed: false, progress: 0, ratingMin: 800, ratingMax: 1200, themes: ["pawnEndgame", "endgame"] },
            { id: "sage-2", title: "Rook Endgames", description: "The Lucena & Philidor", puzzleCount: 200, requiredAccuracy: 80, unlocked: true, completed: false, progress: 0, ratingMin: 1200, ratingMax: 1600, themes: ["rookEndgame", "endgame"] },
            { id: "sage-3", title: "Minor Piece Endings", description: "Bishop vs Knight", puzzleCount: 200, requiredAccuracy: 80, unlocked: true, completed: false, progress: 0, ratingMin: 1400, ratingMax: 1800, themes: ["bishopEndgame", "knightEndgame", "endgame"] },
            { id: "sage-4", title: "Queen Endings", description: "Perpetual checks & wins", puzzleCount: 200, requiredAccuracy: 85, unlocked: true, completed: false, progress: 0, ratingMin: 1600, ratingMax: 2000, themes: ["queenEndgame", "endgame"] },
            { id: "sage-5", title: "Theoretical Draws", description: "Fortress & stalemate", puzzleCount: 200, requiredAccuracy: 90, unlocked: true, completed: false, progress: 0, ratingMin: 1800, ratingMax: 2200, themes: ["endgame", "master"] },
        ],
    },
];


export function CurriculumOverview() {
    const [selectedPhase, setSelectedPhase] = useState<CurriculumPhase | null>(null);
    const [progress, setProgress] = useState<Record<string, number>>({});

    useEffect(() => {
        // Load progress from IndexedDB
        async function loadProgress() {
            try {
                const setting = await db.settings.where("key").equals("curriculum_progress").first();
                if (setting) {
                    setProgress(JSON.parse(setting.value));
                }
            } catch (error) {
                console.error("Failed to load curriculum progress:", error);
            }
        }
        loadProgress();
    }, []);

    // Calculate phase completion
    const getPhaseProgress = (phase: CurriculumPhase) => {
        const moduleProgress = phase.modules.map(m => progress[m.id] || 0);
        return moduleProgress.reduce((a, b) => a + b, 0) / phase.modules.length;
    };

    return (
        <div className="space-y-8">
            {/* Phase Overview */}
            <div className="grid md:grid-cols-3 gap-6">
                {CURRICULUM_PHASES.map((phase, index) => {
                    const Icon = phase.icon;
                    const phaseProgress = getPhaseProgress(phase);
                    const isLocked = false; // All phases unlocked - no progression gating

                    return (
                        <motion.button
                            key={phase.id}
                            onClick={() => !isLocked && setSelectedPhase(phase)}
                            whileHover={!isLocked ? { scale: 1.02 } : {}}
                            whileTap={!isLocked ? { scale: 0.98 } : {}}
                            className={`relative p-6 rounded-2xl border ${phase.borderColor} bg-gradient-to-br ${phase.bgColor} text-left transition-all ${isLocked ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:shadow-lg"
                                }`}
                        >
                            {isLocked && (
                                <div className="absolute top-4 right-4">
                                    <Lock className="w-5 h-5 text-slate-500" />
                                </div>
                            )}

                            <div className={`inline-flex p-3 rounded-xl bg-white/10 mb-4 ${phase.color}`}>
                                <Icon className="w-6 h-6" />
                            </div>

                            <h3 className={`text-xl font-bold mb-1 ${phase.color}`}>{phase.title}</h3>
                            <p className="text-sm text-slate-400 mb-4">{phase.subtitle}</p>

                            {/* Progress Bar */}
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${phaseProgress}%` }}
                                    className={`h-full bg-gradient-to-r ${phase.bgColor.replace("/20", "")}`}
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-2">{Math.round(phaseProgress)}% complete</p>
                        </motion.button>
                    );
                })}
            </div>

            {/* Phase Detail Modal */}
            <AnimatePresence>
                {selectedPhase && (
                    <PhaseDetailModal
                        phase={selectedPhase}
                        progress={progress}
                        onClose={() => setSelectedPhase(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function PhaseDetailModal({
    phase,
    progress,
    onClose,
}: {
    phase: CurriculumPhase;
    progress: Record<string, number>;
    onClose: () => void;
}) {
    const Icon = phase.icon;

    return (
        <>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
                {/* Header */}
                <div className={`p-6 bg-gradient-to-r ${phase.bgColor}`}>
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl bg-white/10 ${phase.color}`}>
                            <Icon className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className={`text-2xl font-bold ${phase.color}`}>{phase.title}</h2>
                            <p className="text-sm text-white/60">{phase.subtitle}</p>
                        </div>
                    </div>
                    <p className="mt-4 text-sm text-white/80">{phase.description}</p>
                </div>

                {/* Modules */}
                <div className="p-6 max-h-96 overflow-y-auto">
                    <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
                        Training Modules
                    </h3>
                    <div className="space-y-3">
                        {phase.modules.map((module, index) => {
                            const moduleProgress = progress[module.id] || 0;
                            const isCompleted = moduleProgress >= 100;
                            // All levels unlocked for now (during development)
                            const isUnlocked = true;

                            // Build the puzzle URL with filters
                            const puzzleUrl = `/curriculum/${module.id}`;

                            const ModuleWrapper = isUnlocked ? 'a' : 'div';

                            return (
                                <motion.div
                                    key={module.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <ModuleWrapper
                                        {...(isUnlocked ? { href: puzzleUrl } : {})}
                                        className={`block p-4 rounded-xl border transition-all ${isCompleted
                                            ? "border-green-500/30 bg-green-500/10"
                                            : isUnlocked
                                                ? "border-border bg-card hover:bg-white/5 hover:border-primary/50 cursor-pointer"
                                                : "border-border/50 bg-slate-900/50 opacity-60 cursor-not-allowed"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {isCompleted ? (
                                                    <Check className="w-5 h-5 text-green-500" />
                                                ) : isUnlocked ? (
                                                    <BookOpen className="w-5 h-5 text-primary" />
                                                ) : (
                                                    <Lock className="w-5 h-5 text-slate-500" />
                                                )}
                                                <div>
                                                    <p className="font-medium">{module.title}</p>
                                                    <p className="text-xs text-muted-foreground">{module.description}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-mono">{module.ratingMin}-{module.ratingMax}</p>
                                                <p className="text-xs text-muted-foreground">{module.puzzleCount} puzzles</p>
                                            </div>
                                        </div>

                                        {/* Themes */}
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {module.themes.slice(0, 3).map(theme => (
                                                <span key={theme} className="text-xs px-2 py-0.5 bg-white/5 rounded-full text-muted-foreground">
                                                    {theme}
                                                </span>
                                            ))}
                                        </div>

                                        {/* Progress Bar */}
                                        {isUnlocked && (
                                            <div className="mt-3 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${moduleProgress}%` }}
                                                    className="h-full bg-primary rounded-full"
                                                />
                                            </div>
                                        )}

                                        {/* Start button for unlocked modules */}
                                        {isUnlocked && !isCompleted && (
                                            <div className="mt-3 flex items-center justify-end text-primary text-sm font-medium">
                                                Start Training
                                                <ChevronRight className="w-4 h-4 ml-1" />
                                            </div>
                                        )}
                                    </ModuleWrapper>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border flex justify-between items-center">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                        Close
                    </button>
                    <div className="text-sm text-muted-foreground">
                        Complete modules in order • Rating progresses as you advance
                    </div>
                </div>
            </motion.div>
        </>
    );
}

/**
 * Skill Tree Visualization - Stunning Interactive Journey Map
 */
export function SkillTreeVisualization() {
    return (
        <div className="relative py-16 px-4">
            {/* Background Glow */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
                <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
            </div>

            {/* Animated Central Path */}
            <svg className="absolute left-1/2 top-0 -translate-x-1/2 h-full w-32 overflow-visible" style={{ zIndex: 0 }}>
                <defs>
                    <linearGradient id="pathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                        <stop offset="50%" stopColor="#10b981" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#a855f7" stopOpacity="0.8" />
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                <path
                    d="M 64 0 Q 64 150 64 300 Q 64 450 64 600"
                    stroke="url(#pathGradient)"
                    strokeWidth="4"
                    fill="none"
                    filter="url(#glow)"
                    strokeDasharray="10 5"
                />
            </svg>

            {/* Phase Cards */}
            <div className="relative z-10 space-y-24">
                {CURRICULUM_PHASES.map((phase, index) => {
                    const Icon = phase.icon;
                    const isLeft = index % 2 === 0;

                    return (
                        <motion.div
                            key={phase.id}
                            initial={{ opacity: 0, x: isLeft ? -100 : 100, scale: 0.8 }}
                            whileInView={{ opacity: 1, x: 0, scale: 1 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.6, delay: index * 0.1, type: "spring" }}
                            className={`flex items-center ${isLeft ? "justify-start" : "justify-end"}`}
                        >
                            {/* Connecting Line to Center */}
                            <div className={`absolute left-1/2 w-32 h-1 ${isLeft ? "-translate-x-full" : ""}`}>
                                <motion.div
                                    initial={{ scaleX: 0 }}
                                    whileInView={{ scaleX: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.2 + 0.3 }}
                                    className={`h-full bg-gradient-to-r ${isLeft
                                        ? `from-transparent ${phase.bgColor.replace("from-", "to-").replace("to-", "from-")}`
                                        : `${phase.bgColor.replace("from-", "from-").replace("to-", "to-")} to-transparent`
                                        }`}
                                    style={{ transformOrigin: isLeft ? "right" : "left" }}
                                />
                            </div>

                            {/* Glowing Node at Center */}
                            <motion.div
                                className="absolute left-1/2 -translate-x-1/2"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: index * 0.2 + 0.2, type: "spring", stiffness: 200 }}
                            >
                                <div className={`relative w-12 h-12 rounded-full ${phase.color.replace("text-", "bg-")} shadow-lg`}>
                                    <motion.div
                                        className={`absolute inset-0 rounded-full ${phase.color.replace("text-", "bg-")} opacity-30`}
                                        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.1, 0.3] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Icon className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                            </motion.div>

                            {/* Phase Card */}
                            <div className={`w-5/12 ${isLeft ? "pr-16 text-right" : "pl-16 text-left"}`}>
                                <motion.div
                                    whileHover={{ scale: 1.02, y: -4 }}
                                    className={`p-6 rounded-2xl bg-gradient-to-br ${phase.bgColor} border ${phase.borderColor} backdrop-blur-sm shadow-xl cursor-pointer transition-all`}
                                >
                                    {/* Phase Header */}
                                    <div className={`flex items-center gap-3 mb-3 ${isLeft ? "justify-end" : "justify-start"}`}>
                                        <div className={`p-2 rounded-xl bg-white/10 ${phase.color}`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className={`text-xl font-bold ${phase.color}`}>{phase.title}</h3>
                                            <p className="text-xs text-white/60">{phase.subtitle}</p>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <p className="text-sm text-white/80 mb-4">{phase.description}</p>

                                    {/* Modules Preview */}
                                    <div className={`flex flex-wrap gap-2 ${isLeft ? "justify-end" : "justify-start"}`}>
                                        {phase.modules.map((m, i) => (
                                            <motion.span
                                                key={m.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: index * 0.1 + i * 0.05 + 0.5 }}
                                                className="px-3 py-1.5 text-xs bg-white/10 rounded-full border border-white/20 hover:bg-white/20 transition-colors"
                                            >
                                                {m.title}
                                            </motion.span>
                                        ))}
                                    </div>

                                    {/* Rating Range */}
                                    <div className={`mt-4 pt-4 border-t border-white/10 flex items-center gap-2 text-xs text-white/60 ${isLeft ? "justify-end" : "justify-start"}`}>
                                        <span>📊</span>
                                        <span>{phase.modules[0].ratingMin} - {phase.modules[phase.modules.length - 1].ratingMax} Rating</span>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Bottom Achievement */}
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="relative z-10 mt-20 text-center"
            >
                <div className="inline-flex flex-col items-center gap-3 px-8 py-6 rounded-2xl bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-purple-500/20 border border-white/10 backdrop-blur">
                    <div className="flex items-center gap-2">
                        <Trophy className="w-8 h-8 text-amber-400" />
                        <span className="text-2xl font-bold bg-gradient-to-r from-amber-400 via-emerald-400 to-purple-400 bg-clip-text text-transparent">
                            Master Level
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground">Complete all phases to achieve chess mastery</p>
                </div>
            </motion.div>
        </div>
    );
}
