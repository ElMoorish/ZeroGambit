"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Puzzle,
    BookOpen,
    Swords,
    Crown,
    ArrowLeft,
    RefreshCw,
    Lightbulb,
    Check,
    X,
    Loader2,
    Sparkles,
    Volume2,
    VolumeX,
    Trophy,
    GraduationCap
} from "lucide-react";
import Link from "next/link";
import { Chess, Square } from "chess.js";
import { ChessBoard } from "@/components/ChessBoard";
import { useSounds } from "@/hooks/useSounds";
import { BoardThemeSelector } from "@/components/BoardThemeSelector";

interface PuzzleData {
    id: string;
    fen: string;
    moves: string[];
    rating: number;
    themes: string[];
    phase: string;
}

type Phase = "opening" | "middlegame" | "endgame" | "all";

// Curriculum module info for display
interface CurriculumMode {
    module: string;
    minRating: number;
    maxRating: number;
    themes: string[];
}

const PHASE_INFO = {
    all: {
        icon: Puzzle,
        label: "All Phases",
        labelFr: "Toutes les phases",
        description: "Mixed puzzles from all game phases",
        color: "text-primary",
        bg: "bg-primary/10",
        border: "border-primary/30",
    },
    opening: {
        icon: BookOpen,
        label: "Opening",
        labelFr: "Ouverture",
        description: "Early game tactics and traps",
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/30",
    },
    middlegame: {
        icon: Swords,
        label: "Middlegame",
        labelFr: "Milieu de partie",
        description: "Tactical combinations and attacks",
        color: "text-amber-500",
        bg: "bg-amber-500/10",
        border: "border-amber-500/30",
    },
    endgame: {
        icon: Crown,
        label: "Endgame",
        labelFr: "Finale",
        description: "Precision and technique",
        color: "text-purple-500",
        bg: "bg-purple-500/10",
        border: "border-purple-500/30",
    },
};

function PuzzlesPageContent() {
    const searchParams = useSearchParams();

    // Check if we're in curriculum mode
    const curriculumModule = searchParams.get("module");
    const minRating = searchParams.get("minRating");
    const maxRating = searchParams.get("maxRating");
    const themesParam = searchParams.get("themes");

    const [curriculumMode, setCurriculumMode] = useState<CurriculumMode | null>(null);

    // Initialize curriculum mode from URL params
    useEffect(() => {
        if (curriculumModule && minRating && maxRating) {
            setCurriculumMode({
                module: curriculumModule,
                minRating: parseInt(minRating),
                maxRating: parseInt(maxRating),
                themes: themesParam ? themesParam.split(',') : []
            });
        } else {
            setCurriculumMode(null);
        }
    }, [curriculumModule, minRating, maxRating, themesParam]);

    const [phase, setPhase] = useState<Phase>("middlegame");
    const [puzzles, setPuzzles] = useState<PuzzleData[]>([]);
    const [currentPuzzle, setCurrentPuzzle] = useState<PuzzleData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [chess, setChess] = useState<Chess | null>(null);
    const [currentFen, setCurrentFen] = useState("");
    const [moveIndex, setMoveIndex] = useState(0);
    const [status, setStatus] = useState<"solving" | "correct" | "wrong" | "hint">("solving");
    const [streak, setStreak] = useState(0);
    const [showHint, setShowHint] = useState(false);
    const [lastWrongMove, setLastWrongMove] = useState<{ from: string; to: string } | null>(null);
    const [playerColor, setPlayerColor] = useState<"white" | "black">("white");
    const [seenPuzzleIds, setSeenPuzzleIds] = useState<Set<string>>(new Set());
    const [coachMessage, setCoachMessage] = useState<string>("");
    const [isCoachLoading, setIsCoachLoading] = useState(false);
    const [voiceEnabled, setVoiceEnabled] = useState(true); // Voice toggle for AI coaching
    const { playMove, playCapture, playCheck, playBlunder, playBrilliant } = useSounds();

    // Speak coaching message using browser TTS (only if voice enabled)
    const speakCoaching = useCallback((text: string) => {
        if (!voiceEnabled) return; // Skip TTS if voice disabled
        if ('speechSynthesis' in window && text) {
            // Cancel any ongoing speech
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1;
            utterance.lang = 'en-US';
            window.speechSynthesis.speak(utterance);
        }
    }, [voiceEnabled]);

    // Gamification State
    const [moduleProgress, setModuleProgress] = useState(0);
    const [xpGained, setXpGained] = useState(0);
    const [showModuleComplete, setShowModuleComplete] = useState(false);

    // Load initial progress
    useEffect(() => {
        if (!curriculumMode) return;

        async function loadProgress() {
            try {
                const { getSetting } = await import("@/lib/db");
                const progressJson = await getSetting("curriculum_progress");
                if (progressJson) {
                    const progressMap = JSON.parse(progressJson);
                    const current = progressMap[curriculumMode!.module] || 0;
                    setModuleProgress(current);
                }
            } catch (error) {
                console.error("Failed to load progress:", error);
            }
        }
        loadProgress();
    }, [curriculumMode]);

    // Update progress when puzzle is solved
    const updateProgress = useCallback(async () => {
        if (!curriculumMode) return;

        try {
            const { getSetting, setSetting } = await import("@/lib/db");

            // Calculate XP (Base 10 + streak bonus)
            const xp = 10 + (streak * 2);
            setXpGained(prev => prev + xp);

            // Update module progress (e.g. +4% per puzzle)
            const increment = 4; // 25 puzzles to complete module
            setModuleProgress(prev => {
                const newProgress = Math.min(prev + increment, 100);

                // Save to DB
                getSetting("curriculum_progress").then(json => {
                    const progressMap = json ? JSON.parse(json) : {};
                    progressMap[curriculumMode.module] = newProgress;
                    setSetting("curriculum_progress", JSON.stringify(progressMap));
                });

                // Check completion
                if (newProgress >= 100 && prev < 100) {
                    setShowModuleComplete(true);
                    playBrilliant(); // Play special sound
                }

                return newProgress;
            });

        } catch (error) {
            console.error("Failed to update progress:", error);
        }
    }, [curriculumMode, streak, playBrilliant]);

    // Fetch coaching insight from LangGraph AI Coach
    const fetchCoaching = useCallback(async (
        fen: string,
        solution: string[],
        userMove: string,
        moveIdx: number,
        isCorrect: boolean,
        playerCol: string,
        mode: string = "correct" // 'hint', 'correct', 'wrong'
    ) => {
        setIsCoachLoading(true);
        try {
            // Use the /api/py proxy route (configured in next.config.ts)
            const response = await fetch(`/api/py/api/coach/puzzle`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fen,
                    solution,
                    user_move: userMove,
                    move_index: moveIdx,
                    is_correct: isCorrect,
                    player_color: playerCol,
                    mode,
                }),
            });
            if (response.ok) {
                const data = await response.json();
                if (data.message) {
                    setCoachMessage(data.message);
                    // Speak the coaching message
                    speakCoaching(data.message);
                }
            }
        } catch (error) {
            console.error("Coach API error:", error);
        } finally {
            setIsCoachLoading(false);
        }
    }, [speakCoaching]);

    // Load a puzzle into the board
    // Lichess puzzle format: moves[0] = opponent's move (just played), moves[1] = your response
    const loadPuzzle = useCallback((puzzle: PuzzleData) => {
        console.log("loadPuzzle called with:", puzzle.id, puzzle.fen);
        setCurrentPuzzle(puzzle);

        // Create chess instance with starting FEN
        const newChess = new Chess(puzzle.fen);

        // Play the opponent's first move (moves[0]) - this is the move that just happened
        if (puzzle.moves.length > 0) {
            const opponentMove = puzzle.moves[0];
            const from = opponentMove.slice(0, 2) as Square;
            const to = opponentMove.slice(2, 4) as Square;
            const promo = opponentMove.slice(4) || undefined;

            try {
                newChess.move({ from, to, promotion: promo as any });
                console.log("Played opponent's move:", opponentMove, "New FEN:", newChess.fen());
            } catch (e) {
                console.error("Failed to play opponent's move:", opponentMove, e);
            }
        }

        setChess(newChess);
        setCurrentFen(newChess.fen()); // Position AFTER opponent's move
        setMoveIndex(1); // Player starts finding moves[1], moves[3], etc.
        setStatus("solving");
        setShowHint(false);
        setLastWrongMove(null);
        setCoachMessage(""); // Clear previous coaching

        // Player color = whose turn it is NOW (after opponent moved)
        const turn = newChess.turn(); // 'w' or 'b'
        const color = turn === "w" ? "white" : "black";
        setPlayerColor(color);

        // Cancel any ongoing TTS when switching puzzles
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }

        // NOTE: AI Coach is only triggered on:
        // 1. Hint button click (showHintMove)
        // 2. Puzzle solved (status === "correct")
    }, []);

    // Fallback puzzles with verified FEN positions (hardcoded for reliability)
    const FALLBACK_PUZZLES: Record<Phase, PuzzleData[]> = {
        all: [
            {
                id: "opening_001",
                fen: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
                moves: ["h5f7"],
                rating: 800,
                themes: ["opening", "mateIn1", "sacrifice"],
                phase: "opening"
            },
            {
                id: "middle_001",
                fen: "r1bqkb1r/pppp1ppp/2n2n2/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
                moves: ["b5c6"],
                rating: 1000,
                themes: ["middlegame", "fork", "pin"],
                phase: "middlegame"
            },
            {
                id: "end_001",
                fen: "8/8/8/8/8/5K2/6R1/7k w - - 0 1",
                moves: ["g2g1"],
                rating: 800,
                themes: ["endgame", "rookEndgame", "mateIn1"],
                phase: "endgame"
            }
        ],
        opening: [
            {
                id: "opening_001",
                fen: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
                moves: ["h5f7"],
                rating: 800,
                themes: ["opening", "mateIn1", "sacrifice"],
                phase: "opening"
            }
        ],
        middlegame: [
            {
                id: "middle_001",
                fen: "r1bqkb1r/pppp1ppp/2n2n2/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
                moves: ["b5c6"],
                rating: 1000,
                themes: ["middlegame", "fork", "pin"],
                phase: "middlegame"
            }
        ],
        endgame: [
            {
                id: "end_001",
                fen: "8/8/8/8/8/5K2/6R1/7k w - - 0 1",
                moves: ["g2g1"],
                rating: 800,
                themes: ["endgame", "rookEndgame", "mateIn1"],
                phase: "endgame"
            },
            {
                id: "end_002",
                fen: "8/8/8/8/8/1K6/8/1Q4k1 w - - 0 1",
                moves: ["b3c3", "g1f1", "b1b2"],
                rating: 900,
                themes: ["endgame", "queenEndgame", "mateIn2"],
                phase: "endgame"
            }
        ]
    };

    // Fetch puzzles for the selected phase or curriculum module
    useEffect(() => {
        const fetchPuzzles = async () => {
            setIsLoading(true);
            try {
                let url: string;

                if (curriculumMode) {
                    // Curriculum mode - fetch by rating range and themes
                    const themesStr = curriculumMode.themes.join(',');
                    url = `/api/py/api/puzzles/curriculum?minRating=${curriculumMode.minRating}&maxRating=${curriculumMode.maxRating}&themes=${themesStr}&count=50`;
                    console.log("Fetching curriculum puzzles from:", url);
                } else {
                    // Normal phase mode
                    url = `/api/py/api/puzzles/phase/${phase}?count=50`;
                    console.log("Fetching puzzles from:", url);
                }

                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    console.log("Received puzzles from API:", data.puzzles);
                    if (data.puzzles && data.puzzles.length > 0 && data.puzzles[0].fen) {
                        setPuzzles(data.puzzles);
                        console.log("Loading puzzle with FEN:", data.puzzles[0].fen);
                        loadPuzzle(data.puzzles[0]);
                    } else {
                        // Use fallback if API data is invalid
                        console.log("API returned invalid data, using fallback puzzles");
                        const fallback = FALLBACK_PUZZLES[phase];
                        setPuzzles(fallback);
                        loadPuzzle(fallback[0]);
                    }
                } else {
                    console.error("API request failed, using fallback puzzles");
                    const fallback = FALLBACK_PUZZLES[phase];
                    setPuzzles(fallback);
                    loadPuzzle(fallback[0]);
                }
            } catch (error) {
                console.error("Failed to fetch puzzles:", error);
                // Use fallback puzzles
                console.log("Using fallback puzzles due to error");
                const fallback = FALLBACK_PUZZLES[phase];
                setPuzzles(fallback);
                loadPuzzle(fallback[0]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPuzzles();
    }, [phase, curriculumMode, loadPuzzle]);

    const handleMove = useCallback((sourceSquare: string, targetSquare: string) => {
        if (!chess || !currentPuzzle || status !== "solving") return false;

        const expectedMove = currentPuzzle.moves[moveIndex];
        const userMove = `${sourceSquare}${targetSquare}`;

        // Try to make the move
        try {
            const move = chess.move({
                from: sourceSquare as Square,
                to: targetSquare as Square,
                promotion: "q", // Auto-promote to queen
            });

            if (!move) return false;

            // Check if move matches expected
            const moveUci = `${move.from}${move.to}${move.promotion || ""}`;

            if (moveUci === expectedMove || userMove === expectedMove) {
                // Correct move!
                setCurrentFen(chess.fen());

                // Play appropriate sound
                if (move.captured) {
                    playCapture();
                } else if (move.san.includes("+")) {
                    playCheck();
                } else {
                    playMove();
                }

                // Check if puzzle is complete
                if (moveIndex + 1 >= currentPuzzle.moves.length) {
                    setStatus("correct");
                    setStreak(s => s + 1);
                    playBrilliant();
                    // Fetch coaching for completion
                    fetchCoaching(chess.fen(), currentPuzzle.moves, userMove, moveIndex, true, playerColor, "correct");

                    // Update curriculum progress
                    if (curriculumMode) {
                        updateProgress();
                    }
                } else {
                    // Computer's response
                    setMoveIndex(moveIndex + 1);
                    setTimeout(() => {
                        const computerMove = currentPuzzle.moves[moveIndex + 1];
                        if (computerMove) {
                            const from = computerMove.slice(0, 2) as Square;
                            const to = computerMove.slice(2, 4) as Square;
                            const promo = computerMove.slice(4) || undefined;
                            chess.move({ from, to, promotion: promo as any });
                            setCurrentFen(chess.fen());
                            playMove();
                            setMoveIndex(moveIndex + 2);
                        }
                    }, 300);
                }
                return true;
            } else {
                // Wrong move logic
                // 1. Play Blunder sound instantly
                playBlunder();

                // 2. Set status to wrong (but don't show popup) and track the wrong move
                setStatus("wrong");
                setLastWrongMove({ from: sourceSquare, to: targetSquare });
                setStreak(0);

                // NOTE: We don't fetch coaching on wrong moves to reduce API calls
                // User can click Hint button if they need help

                // 3. Keep the bad move on board for 500ms so user sees it
                // Then undo and clear highlight
                setTimeout(() => {
                    chess.undo(); // Remove the bad move
                    setCurrentFen(chess.fen());
                    setLastWrongMove(null);
                    setStatus("solving");
                }, 500);

                return true; // We executed the move temporarily
            }
        } catch {
            return false;
        }
    }, [chess, currentPuzzle, moveIndex, status, playMove, playCapture, playCheck, playBrilliant, playBlunder, curriculumMode, updateProgress, playerColor, fetchCoaching]);

    const nextPuzzle = useCallback(() => {
        // Mark current puzzle as seen
        if (currentPuzzle) {
            setSeenPuzzleIds(prev => new Set([...prev, currentPuzzle.id]));
        }

        // Find an unseen puzzle
        const unseenPuzzles = puzzles.filter(p => !seenPuzzleIds.has(p.id) && p.id !== currentPuzzle?.id);

        if (unseenPuzzles.length > 0) {
            // Pick a random unseen puzzle
            const randomIndex = Math.floor(Math.random() * unseenPuzzles.length);
            loadPuzzle(unseenPuzzles[randomIndex]);
        } else {
            // All puzzles seen, reset and cycle through again
            setSeenPuzzleIds(new Set());
            const currentIndex = puzzles.findIndex(p => p.id === currentPuzzle?.id);
            const nextIndex = (currentIndex + 1) % puzzles.length;
            loadPuzzle(puzzles[nextIndex]);
        }
    }, [currentPuzzle, puzzles, seenPuzzleIds, loadPuzzle]);

    const showHintMove = useCallback(() => {
        if (!currentPuzzle || !chess) return;
        setShowHint(true);

        // Fetch AI coaching when hint is requested
        fetchCoaching(
            chess.fen(),
            currentPuzzle.moves,
            "",
            moveIndex,
            true,
            playerColor,
            "hint"
        );
    }, [currentPuzzle, chess, moveIndex, playerColor, fetchCoaching]);

    const phaseInfo = PHASE_INFO[phase];
    const PhaseIcon = phaseInfo.icon;

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="p-2 rounded-lg hover:bg-secondary transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div className="flex items-center gap-2">
                            <Puzzle className="w-6 h-6 text-primary" />
                            <h1 className="text-xl font-bold">Puzzle Training</h1>
                        </div>
                    </div>

                    {/* Streak Counter & Voice Toggle */}
                    <div className="flex items-center gap-3">
                        {/* Voice Toggle */}
                        <button
                            onClick={() => {
                                setVoiceEnabled(!voiceEnabled);
                                // Cancel any ongoing speech when disabling
                                if (voiceEnabled && 'speechSynthesis' in window) {
                                    window.speechSynthesis.cancel();
                                }
                            }}
                            className={`p-2 rounded-lg transition-colors ${voiceEnabled
                                ? "bg-primary/10 text-primary hover:bg-primary/20"
                                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                                }`}
                            title={voiceEnabled ? "Voice On - Click to Mute" : "Voice Off - Click to Enable"}
                        >
                            {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                        </button>

                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary">
                            <span className="text-sm font-medium">Streak: {streak}</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-6">
                {/* Phase Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {(Object.keys(PHASE_INFO) as Phase[]).map((p) => {
                        const info = PHASE_INFO[p];
                        const Icon = info.icon;
                        const isActive = phase === p;

                        return (
                            <button
                                key={p}
                                onClick={() => setPhase(p)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all whitespace-nowrap ${isActive
                                    ? `${info.bg} ${info.border} ${info.color}`
                                    : "border-border hover:bg-secondary"
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span className="font-medium">{info.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Chess Board */}
                    <div className="lg:col-span-2">
                        <div className="bg-card rounded-2xl border border-border p-4">
                            {/* Player Turn Indicator */}
                            {!isLoading && (
                                <div className={`flex items-center justify-center gap-2 mb-3 py-2 px-4 rounded-lg ${playerColor === "white"
                                    ? "bg-white/10 text-white border border-white/20"
                                    : "bg-gray-800 text-gray-200 border border-gray-600"
                                    }`}>
                                    <div className={`w-4 h-4 rounded-full ${playerColor === "white" ? "bg-white" : "bg-gray-900 border border-gray-400"}`} />
                                    <span className="font-medium">
                                        Your turn: Play as {playerColor === "white" ? "White" : "Black"}
                                    </span>
                                </div>
                            )}

                            {isLoading ? (
                                <div className="aspect-square flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                </div>
                            ) : (
                                <div className="relative" key={currentPuzzle?.id}>
                                    <ChessBoard
                                        key={`board-${currentPuzzle?.id}`}
                                        position={currentFen}
                                        orientation={playerColor}
                                        onMove={handleMove}
                                        interactable={status === "solving" || showHint}
                                        blunderMove={lastWrongMove || undefined}
                                        hintMove={status === "solving" && currentPuzzle?.moves[moveIndex] ? {
                                            from: currentPuzzle.moves[moveIndex].slice(0, 2),
                                            to: currentPuzzle.moves[moveIndex].slice(2, 4)
                                        } : undefined}
                                    />

                                    {/* Puzzle Completion Overlay */}
                                    <AnimatePresence>
                                        {status === "correct" && currentPuzzle && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-lg"
                                            >
                                                <div className="text-center p-6">
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        transition={{ type: "spring", delay: 0.1 }}
                                                    >
                                                        <Check className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                                                    </motion.div>
                                                    <h3 className="text-2xl font-bold text-white mb-2">Correct!</h3>
                                                    <p className="text-gray-300 mb-1">
                                                        Puzzle solved in {Math.ceil(currentPuzzle.moves.length / 2)} move{Math.ceil(currentPuzzle.moves.length / 2) > 1 ? "s" : ""}
                                                    </p>
                                                    <p className="text-sm text-gray-400 mb-4">Streak: {streak} 🔥</p>
                                                    <button
                                                        onClick={nextPuzzle}
                                                        className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 mx-auto"
                                                    >
                                                        <RefreshCw className="w-5 h-5" />
                                                        Next Puzzle
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>

                        {/* Controls */}
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={showHintMove}
                                disabled={status !== "solving"}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors disabled:opacity-50"
                            >
                                <Lightbulb className="w-5 h-5" />
                                <span>Hint</span>
                            </button>

                            <div className="relative z-[100] flex items-center justify-center">
                                <BoardThemeSelector />
                            </div>

                            <button
                                onClick={nextPuzzle}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                            >
                                <RefreshCw className="w-5 h-5" />
                                <span>Next Puzzle</span>
                            </button>
                        </div>
                    </div>

                    {/* Puzzle Info Panel */}
                    <div className="space-y-4">
                        {/* Gamification Panel - only in curriculum mode */}
                        {curriculumMode && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-4"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <GraduationCap className="w-5 h-5 text-amber-500" />
                                        <span className="font-bold text-amber-500">Module Progress</span>
                                    </div>
                                    <span className="font-mono font-bold">{Math.round(moduleProgress)}%</span>
                                </div>
                                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${moduleProgress}%` }}
                                        className="h-full bg-amber-500"
                                    />
                                </div>
                                {xpGained > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="mt-2 text-center text-sm font-bold text-green-400"
                                    >
                                        +{xpGained} XP Gained this session!
                                    </motion.div>
                                )}
                            </motion.div>
                        )}

                        {/* Current Puzzle Info */}
                        <div className={`bg-card rounded-2xl border ${phaseInfo.border} p-4`}>
                            <div className="flex items-center gap-2 mb-3">
                                <PhaseIcon className={`w-5 h-5 ${phaseInfo.color}`} />
                                <h2 className="font-semibold">{phaseInfo.label} Puzzle</h2>
                            </div>

                            {currentPuzzle && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Rating</span>
                                        <span className="font-mono font-bold">{currentPuzzle.rating}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Moves</span>
                                        <span className="font-mono">{Math.ceil(currentPuzzle.moves.length / 2)}</span>
                                    </div>
                                    {currentPuzzle.themes.length > 0 && (
                                        <div className="flex flex-wrap gap-1 pt-2 border-t border-border">
                                            {currentPuzzle.themes.slice(0, 4).map(theme => (
                                                <span
                                                    key={theme}
                                                    className="px-2 py-0.5 text-xs rounded-full bg-secondary text-muted-foreground"
                                                >
                                                    {theme}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Hint Display */}
                        {showHint && currentPuzzle && currentPuzzle.moves[moveIndex] && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <Lightbulb className="w-4 h-4 text-amber-500" />
                                    <span className="font-medium text-amber-500">Hint</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Your move: <code className="px-1 py-0.5 bg-secondary rounded">
                                        {currentPuzzle.moves[moveIndex]?.slice(0, 2)} → {currentPuzzle.moves[moveIndex]?.slice(2, 4)}
                                    </code>
                                </p>
                            </motion.div>
                        )}

                        {/* AI Coach Insight */}
                        {(coachMessage || isCoachLoading) && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl p-4"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="w-4 h-4 text-purple-400" />
                                    <span className="font-medium text-purple-400">AI Coach</span>
                                    {isCoachLoading && (
                                        <Loader2 className="w-3 h-3 animate-spin text-purple-400 ml-auto" />
                                    )}
                                </div>
                                {coachMessage ? (
                                    <p className="text-sm text-foreground leading-relaxed">
                                        {coachMessage}
                                    </p>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">
                                        Analyzing your move...
                                    </p>
                                )}
                            </motion.div>
                        )}

                        {/* Instructions */}
                        <div className="bg-secondary/30 rounded-xl p-4">
                            <h3 className="font-medium mb-2 text-sm">How to solve</h3>
                            <p className="text-sm text-muted-foreground">
                                Find the best move sequence. Drag pieces to make moves.
                                The computer will respond, then find the next best move.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Module Complete Modal */}
                <AnimatePresence>
                    {showModuleComplete && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                className="bg-card border border-border rounded-2xl p-8 max-w-md w-full text-center relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-purple-500/10" />

                                <div className="relative z-10">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.2, type: "spring" }}
                                        className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
                                    >
                                        <Trophy className="w-10 h-10 text-amber-500" />
                                    </motion.div>

                                    <h2 className="text-3xl font-bold mb-2">Module Mastered!</h2>
                                    <p className="text-muted-foreground mb-6">
                                        You've completed the required training for this module. Your tactical vision is sharp!
                                    </p>

                                    <div className="bg-secondary/50 rounded-xl p-4 mb-6">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm text-muted-foreground">Total XP Gained</span>
                                            <span className="font-bold text-green-400">+{xpGained} XP</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">Puzzles Solved</span>
                                            <span className="font-bold">{streak}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <Link href="/curriculum" className="flex-1">
                                            <button className="w-full py-3 rounded-xl bg-secondary hover:bg-secondary/80 font-medium transition-colors">
                                                Back to Map
                                            </button>
                                        </Link>
                                        <button
                                            onClick={() => setShowModuleComplete(false)}
                                            className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-medium transition-colors"
                                        >
                                            Keep Training
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}

// Default export with Suspense for useSearchParams
export default function PuzzlesPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground">Loading puzzles...</p>
                </div>
            </div>
        }>
            <PuzzlesPageContent />
        </Suspense>
    );
}
