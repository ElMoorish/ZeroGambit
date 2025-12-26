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
            { id: "stone-1", title: "Pin & Skewer", description: "Geometric attacks", puzzleCount: 20, requiredAccuracy: 70, unlocked: true, completed: false, progress: 0, ratingMin: 400, ratingMax: 800, themes: ["pin", "skewer"] },
            { id: "stone-2", title: "Fork Mastery", description: "Double attacks", puzzleCount: 25, requiredAccuracy: 75, unlocked: false, completed: false, progress: 0, ratingMin: 600, ratingMax: 1000, themes: ["fork", "doubleAttack"] },
            { id: "stone-3", title: "Discovery & Double Check", description: "Hidden threats", puzzleCount: 25, requiredAccuracy: 75, unlocked: false, completed: false, progress: 0, ratingMin: 800, ratingMax: 1200, themes: ["discoveredAttack", "doubleCheck"] },
            { id: "stone-4", title: "Back Rank Tactics", description: "Mate patterns", puzzleCount: 30, requiredAccuracy: 80, unlocked: false, completed: false, progress: 0, ratingMin: 1000, ratingMax: 1400, themes: ["backRankMate", "mateIn1", "mateIn2"] },
            { id: "stone-5", title: "Deflection & Decoy", description: "Advanced combinations", puzzleCount: 30, requiredAccuracy: 80, unlocked: false, completed: false, progress: 0, ratingMin: 1200, ratingMax: 1600, themes: ["deflection", "attraction", "interference"] },
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
            { id: "flow-1", title: "Opening Principles", description: "Development & center", puzzleCount: 15, requiredAccuracy: 70, unlocked: false, completed: false, progress: 0, ratingMin: 600, ratingMax: 1000, themes: ["opening", "hangingPiece"] },
            { id: "flow-2", title: "Pawn Structure", description: "The skeleton of position", puzzleCount: 20, requiredAccuracy: 75, unlocked: false, completed: false, progress: 0, ratingMin: 1000, ratingMax: 1400, themes: ["advancedPawn", "quietMove"] },
            { id: "flow-3", title: "Piece Activity", description: "Optimal placement", puzzleCount: 20, requiredAccuracy: 75, unlocked: false, completed: false, progress: 0, ratingMin: 1200, ratingMax: 1600, themes: ["trappedPiece", "sacrifice"] },
            { id: "flow-4", title: "King Safety", description: "Castling & attacks", puzzleCount: 25, requiredAccuracy: 80, unlocked: false, completed: false, progress: 0, ratingMin: 1400, ratingMax: 1800, themes: ["kingsideAttack", "attackingF2F7"] },
            { id: "flow-5", title: "Prophylaxis", description: "Preventing opponent's plans", puzzleCount: 25, requiredAccuracy: 85, unlocked: false, completed: false, progress: 0, ratingMin: 1600, ratingMax: 2000, themes: ["defensiveMove", "zugzwang"] },
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
            { id: "sage-1", title: "King & Pawn", description: "Opposition & triangulation", puzzleCount: 20, requiredAccuracy: 75, unlocked: false, completed: false, progress: 0, ratingMin: 800, ratingMax: 1200, themes: ["pawnEndgame", "endgame"] },
            { id: "sage-2", title: "Rook Endgames", description: "The Lucena & Philidor", puzzleCount: 25, requiredAccuracy: 80, unlocked: false, completed: false, progress: 0, ratingMin: 1200, ratingMax: 1600, themes: ["rookEndgame", "endgame"] },
            { id: "sage-3", title: "Minor Piece Endings", description: "Bishop vs Knight", puzzleCount: 20, requiredAccuracy: 80, unlocked: false, completed: false, progress: 0, ratingMin: 1400, ratingMax: 1800, themes: ["bishopEndgame", "knightEndgame", "endgame"] },
            { id: "sage-4", title: "Queen Endings", description: "Perpetual checks & wins", puzzleCount: 20, requiredAccuracy: 85, unlocked: false, completed: false, progress: 0, ratingMin: 1600, ratingMax: 2000, themes: ["queenEndgame", "endgame"] },
            { id: "sage-5", title: "Theoretical Draws", description: "Fortress & stalemate", puzzleCount: 25, requiredAccuracy: 90, unlocked: false, completed: false, progress: 0, ratingMin: 1800, ratingMax: 2200, themes: ["endgame", "master"] },
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
                    const isLocked = index > 0 && getPhaseProgress(CURRICULUM_PHASES[index - 1]) < 80;

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
                            const isUnlocked = index === 0 || (progress[phase.modules[index - 1].id] || 0) >= module.requiredAccuracy;

                            // Build the puzzle URL with filters
                            const puzzleUrl = `/puzzles?module=${module.id}&minRating=${module.ratingMin}&maxRating=${module.ratingMax}&themes=${module.themes.join(',')}`;

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
 * Skill Tree Visualization - Shows overall progress
 */
export function SkillTreeVisualization() {
    return (
        <div className="relative py-12">
            {/* Central Line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-amber-500/50 via-emerald-500/50 to-purple-500/50" />

            {/* Phases */}
            {CURRICULUM_PHASES.map((phase, index) => {
                const Icon = phase.icon;
                const isLeft = index % 2 === 0;

                return (
                    <motion.div
                        key={phase.id}
                        initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.2 }}
                        className={`relative flex items-center mb-16 last:mb-0 ${isLeft ? "justify-start" : "justify-end"
                            }`}
                    >
                        {/* Connector Dot */}
                        <div className="absolute left-1/2 -translate-x-1/2">
                            <div className={`w-4 h-4 rounded-full ${phase.color.replace("text-", "bg-")} ring-4 ring-background`} />
                        </div>

                        {/* Card */}
                        <div className={`w-5/12 ${isLeft ? "pr-8 text-right" : "pl-8 text-left"}`}>
                            <div className={`inline-flex items-center gap-2 mb-2 ${phase.color}`}>
                                <Icon className="w-5 h-5" />
                                <span className="font-bold">{phase.title}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{phase.description}</p>
                            <div className="mt-3 flex flex-wrap gap-2 justify-end">
                                {phase.modules.slice(0, 3).map((m) => (
                                    <span
                                        key={m.id}
                                        className="px-2 py-1 text-xs bg-white/5 rounded-full border border-white/10"
                                    >
                                        {m.title}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
