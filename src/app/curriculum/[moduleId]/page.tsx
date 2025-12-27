"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    Trophy,
    Zap,
    Target,
    Check,
    X,
    ChevronRight,
    Loader2
} from "lucide-react";
import Link from "next/link";
import { Chess, Square } from "chess.js";
import { ChessBoard } from "@/components/ChessBoard";
import { useSounds } from "@/hooks/useSounds";
import { CURRICULUM_PHASES, CurriculumModule } from "@/components/curriculum/CurriculumSystem";
import { curriculumApi } from "@/lib/curriculumApi";
import { useUser } from "@clerk/nextjs";

// Types
interface PuzzleData {
    id: string;
    fen: string;
    moves: string[];
    rating: number;
    themes: string[];
}

export default function ModuleTrainerPage() {
    const params = useParams();
    const router = useRouter();
    const moduleId = params.moduleId as string;
    const { user, isLoaded } = useUser();

    // State
    const [module, setModule] = useState<CurriculumModule | null>(null);
    const [level, setLevel] = useState(1); // 1-5
    const [xp, setXp] = useState(0); // Session XP
    const [totalXp, setTotalXp] = useState(0); // Persisted XP for this module
    const [streak, setStreak] = useState(0);
    const [puzzles, setPuzzles] = useState<PuzzleData[]>([]);
    const [currentPuzzle, setCurrentPuzzle] = useState<PuzzleData | null>(null);

    // Chess State
    const [chess, setChess] = useState<Chess | null>(null);
    const [currentFen, setCurrentFen] = useState("");
    const [moveIndex, setMoveIndex] = useState(0);
    const [status, setStatus] = useState<"solving" | "correct" | "wrong">("solving");
    const [playerColor, setPlayerColor] = useState<"white" | "black">("white");
    const { playMove, playCapture, playCheck, playBrilliant, playBlunder } = useSounds();

    // Load Module Info
    useEffect(() => {
        if (!moduleId) return;

        // Find module definition
        let foundModule: CurriculumModule | null = null;
        for (const phase of CURRICULUM_PHASES) {
            const m = phase.modules.find(mod => mod.id === moduleId);
            if (m) foundModule = m;
        }

        if (foundModule) {
            setModule(foundModule);
        } else {
            console.error("Module not found:", moduleId);
        }
    }, [moduleId]);

    // Sync User & Load Progress
    useEffect(() => {
        if (!isLoaded || !user || !module) return;

        async function initSession() {
            // 1. Sync User Profile
            await curriculumApi.syncUser({
                id: user!.id,
                name: user!.fullName || user!.username || "Chess Player",
                email: user!.primaryEmailAddress?.emailAddress || "",
                // TODO: Add extra fields like country if available in metadata
            });

            // 2. Fetch Progress
            const progress = await curriculumApi.getUserProgress(user!.id);
            if (progress && progress.modules && progress.modules[moduleId]) {
                const modProgress = progress.modules[moduleId];
                setLevel(modProgress.level || 1);
                setStreak(modProgress.streak || 0);
                setTotalXp(modProgress.xp || 0);
            }
        }
        initSession();
    }, [isLoaded, user, module, moduleId]);

    // Fetch Puzzles for Current Level
    const fetchLevelPuzzles = useCallback(async () => {
        if (!module) return;

        // Calculate rating range for current level
        // Level 1: Min Rating
        // Level 5: Max Rating
        const range = module.ratingMax - module.ratingMin;
        const levelStep = range / 5;
        const minR = Math.floor(module.ratingMin + (level - 1) * levelStep);
        const maxR = Math.floor(module.ratingMin + level * levelStep);

        try {
            const themesStr = module.themes.join(',');
            const url = `/api/py/api/puzzles/curriculum?minRating=${minR}&maxRating=${maxR}&themes=${themesStr}&count=20`;
            console.log(`Fetching Level ${level} puzzles (${minR}-${maxR})...`);

            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                if (data.puzzles && data.puzzles.length > 0) {
                    // Filter out corrupted puzzles (must have pieces for both sides + legal moves)
                    const validPuzzles = data.puzzles.filter((p: PuzzleData) => {
                        try {
                            const fen = p.fen || '';
                            const board = fen.split(' ')[0] || '';

                            // Check if there are lowercase (black) and uppercase (white) pieces
                            const hasBlack = /[pnbrqk]/.test(board);
                            const hasWhite = /[PNBRQK]/.test(board);
                            const hasValidMoves = p.moves && p.moves.length > 0;

                            if (!hasBlack || !hasWhite || !hasValidMoves) return false;

                            // Deeper validation: simulate the puzzle start
                            const testChess = new Chess(fen);

                            // Make opponent's first move
                            if (p.moves.length > 0) {
                                const oppMove = p.moves[0];
                                const from = oppMove.slice(0, 2) as Square;
                                const to = oppMove.slice(2, 4) as Square;
                                const promo = oppMove.slice(4) || undefined;
                                const result = testChess.move({ from, to, promotion: promo as any });
                                if (!result) return false; // Invalid opponent move
                            }

                            // Check if player has legal moves after opponent's move
                            const legalMoves = testChess.moves();
                            if (legalMoves.length === 0) return false; // Checkmate or stalemate

                            // Check the position isn't already over
                            if (testChess.isGameOver()) return false;

                            return true;
                        } catch (e) {
                            console.warn("Puzzle validation failed:", p.id, e);
                            return false;
                        }
                    });

                    if (validPuzzles.length > 0) {
                        setPuzzles(validPuzzles);
                        loadPuzzle(validPuzzles[0]);
                    } else {
                        console.warn("All fetched puzzles were invalid, retrying...");
                    }
                }
            }
        } catch (e) {
            console.error("Failed to fetch puzzles:", e);
        }
    }, [module, level]);

    useEffect(() => {
        if (module) fetchLevelPuzzles();
    }, [module, level, fetchLevelPuzzles]);

    // Load Puzzle Logic
    const loadPuzzle = useCallback((puzzle: PuzzleData) => {
        setCurrentPuzzle(puzzle);
        const newChess = new Chess(puzzle.fen);

        // Make opponent's first move
        if (puzzle.moves.length > 0) {
            const oppMove = puzzle.moves[0];
            const from = oppMove.slice(0, 2) as Square;
            const to = oppMove.slice(2, 4) as Square;
            const promo = oppMove.slice(4) || undefined;
            try {
                newChess.move({ from, to, promotion: promo as any });
            } catch (e) { console.error(e); }
        }

        setChess(newChess);
        setCurrentFen(newChess.fen());
        setMoveIndex(1);
        setStatus("solving");
        setPlayerColor(newChess.turn() === "w" ? "white" : "black");
    }, []);

    // Move Handling
    const handleMove = useCallback((from: string, to: string) => {
        if (!chess || !currentPuzzle || status !== "solving") return false;

        const userMove = `${from}${to}`;
        const expectedMove = currentPuzzle.moves[moveIndex];

        try {
            const move = chess.move({ from: from as Square, to: to as Square, promotion: 'q' });
            if (!move) return false;

            const uci = `${move.from}${move.to}${move.promotion || ''}`;

            if (uci === expectedMove || userMove === expectedMove) {
                // Correct
                setCurrentFen(chess.fen());
                if (move.captured) playCapture();
                else playMove();

                // Check completion
                if (moveIndex + 1 >= currentPuzzle.moves.length) {
                    setStatus("correct");
                    playBrilliant();
                    handlePuzzleSuccess();
                } else {
                    // CPU Move
                    setMoveIndex(moveIndex + 1);
                    setTimeout(() => {
                        const cpuMove = currentPuzzle.moves[moveIndex + 1];
                        if (cpuMove) {
                            const f = cpuMove.slice(0, 2) as Square;
                            const t = cpuMove.slice(2, 4) as Square;
                            const p = cpuMove.slice(4) || undefined;
                            chess.move({ from: f, to: t, promotion: p as any });
                            setCurrentFen(chess.fen());
                            playMove();
                            setMoveIndex(moveIndex + 2);
                        }
                    }, 300);
                }
                return true;
            } else {
                // Wrong
                playBlunder();
                setStatus("wrong");
                setStreak(0); // Reset streak on loss

                // Update persistent streak to 0 immediately on loss
                if (user && moduleId) {
                    curriculumApi.updateModuleProgress(user.id, moduleId, {
                        xp: totalXp,
                        level: level,
                        streak: 0
                    });
                }

                setTimeout(() => {
                    chess.undo();
                    setCurrentFen(chess.fen());
                    setStatus("solving");
                }, 500);
                return true;
            }
        } catch { return false; }
    }, [chess, currentPuzzle, moveIndex, status, playMove, playCapture, playBrilliant, playBlunder, user, moduleId, totalXp, level]);

    // Progression Logic
    const handlePuzzleSuccess = () => {
        setStreak(s => {
            const newStreak = s + 1;

            // Level Up Logic
            if (newStreak % 3 === 0 && level < 5) {
                setLevel(l => l + 1);
            }

            return newStreak;
        });

        // XP Calc
        const gainedXp = 20 + (streak * 5);
        setXp(x => x + gainedXp); // Session XP
        setTotalXp(x => x + gainedXp); // Persistent XP

        // Persist to Backend
        if (user && moduleId) {
            // Need to calculate new values here because state updates are async
            const newStreak = streak + 1;
            const newLevel = (newStreak % 3 === 0 && level < 5) ? level + 1 : level;
            const newTotalXp = totalXp + gainedXp;

            curriculumApi.updateModuleProgress(user.id, moduleId, {
                xp: newTotalXp,
                level: newLevel,
                streak: newStreak
            });
        }
    };

    const nextPuzzle = () => {
        // Find next puzzle in loaded batch
        const idx = puzzles.findIndex(p => p.id === currentPuzzle?.id);
        if (idx !== -1 && idx < puzzles.length - 1) {
            loadPuzzle(puzzles[idx + 1]);
        } else {
            // Fetch more if out
            fetchLevelPuzzles();
        }
    };

    if (!module || !chess) return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    );

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Header */}
            <div className="border-b border-border bg-card/50 backdrop-blur p-4 sticky top-0 z-10">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/curriculum" className="p-2 hover:bg-secondary rounded-lg">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold flex items-center gap-2">
                                {module.title}
                                <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs">
                                    Level {level}
                                </span>
                            </h1>
                            <p className="text-xs text-muted-foreground hidden md:block">{module.description}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">XP Gained</p>
                            <div className="flex flex-col items-end">
                                <p className="font-mono text-xl font-bold text-amber-400">+{xp}</p>
                                <p className="text-[10px] text-muted-foreground">Total: {totalXp}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Streak</p>
                            <div className="flex gap-1">
                                {[...Array(Math.min(streak, 5))].map((_, i) => (
                                    <Zap key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Area */}
            <main className="container mx-auto p-4 md:p-8 flex flex-col md:flex-row gap-8 items-start justify-center">

                {/* Board */}
                <div className="w-full max-w-2xl aspect-square">
                    <ChessBoard
                        position={currentFen}
                        onMove={handleMove}
                        orientation={playerColor}
                        theme="green" // Can be made dynamic
                    // lastMove={null} // Removed invalid prop
                    /* checkSquare={chess.inCheck() ? (chess.turn() === 'w' ? chess.board().reduce((acc, row, rIdx) => {
                         row.forEach((sq, cIdx) => { if (sq?.type === 'k' && sq.color === 'w') acc = String.fromCharCode(97+cIdx) + (8-rIdx); }); return acc;
                    }, "") : chess.board().reduce((acc, row, rIdx) => {
                         row.forEach((sq, cIdx) => { if (sq?.type === 'k' && sq.color === 'b') acc = String.fromCharCode(97+cIdx) + (8-rIdx); }); return acc;
                    }, "")) : undefined} */
                    />
                </div>

                {/* Sidebar / Feedback */}
                <div className="w-full md:w-80 space-y-6">
                    <AnimatePresence mode="wait">
                        {status === "correct" ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-6 rounded-2xl bg-green-500/10 border border-green-500/20 text-center space-y-4"
                            >
                                <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                                    <Check className="w-8 h-8 text-green-500" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-green-500">Excellent!</h2>
                                    <p className="text-muted-foreground">Pattern recognized.</p>
                                </div>
                                <button
                                    onClick={nextPuzzle}
                                    className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    Next Puzzle <ChevronRight className="w-5 h-5" />
                                </button>
                            </motion.div>
                        ) : status === "wrong" ? (
                            <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400"
                            >
                                <X className="w-6 h-6" />
                                <span className="font-medium">Incorrect. Try again!</span>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="p-6 rounded-2xl bg-secondary/30 border border-border text-center"
                            >
                                <Target className="w-12 h-12 mx-auto text-primary mb-4 opacity-50" />
                                <h3 className="text-lg font-medium mb-2">{playerColor === "white" ? "White to Move" : "Black to Move"}</h3>
                                <p className="text-sm text-muted-foreground">Find the best move to apply the <strong>{module.title}</strong> pattern.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Progress Bar (Level) */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            <span>Level {level}</span>
                            <span>Level {level + 1}</span>
                        </div>
                        <div className="h-3 bg-secondary rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-amber-400"
                                initial={{ width: 0 }}
                                animate={{ width: `${(streak % 3) / 3 * 100}%` }}
                                transition={{ type: "spring", stiffness: 50 }}
                            />
                        </div>
                        <p className="text-xs text-center text-muted-foreground">Win 3 in a row to level up!</p>
                    </div>
                </div>

            </main>
        </div>
    );
}
