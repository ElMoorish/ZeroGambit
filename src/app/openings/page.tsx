"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    BookOpen,
    Search,
    ChevronRight,
    Trophy,
    ArrowLeft,
    RefreshCw,
    Lightbulb,
    Check,
    X,
    Loader2,
    Sparkles,
    Play,
    Pause,
    Volume2,
    VolumeX,
    GraduationCap
} from "lucide-react";
import Link from "next/link";
import { Chess } from "chess.js";
import { ChessBoard } from "@/components/ChessBoard";
import { OpeningTree } from "@/components/openings/OpeningTree";

interface Opening {
    eco: string;
    name: string;
    moves: string[];
    fen: string;
    description: string;
    numMoves: number;
}

interface Category {
    code: string;
    name: string;
    count: number;
}

type Mode = "explore" | "quiz" | "tree";

export default function OpeningsPage() {
    const [mode, setMode] = useState<Mode>("explore");
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [openings, setOpenings] = useState<Opening[]>([]);
    const [selectedOpening, setSelectedOpening] = useState<Opening | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Quiz state
    const [quizOpening, setQuizOpening] = useState<Opening | null>(null);
    const [quizMoveIndex, setQuizMoveIndex] = useState(0);
    const [quizScore, setQuizScore] = useState(0);
    const [quizStreak, setQuizStreak] = useState(0);
    const [quizStatus, setQuizStatus] = useState<"playing" | "correct" | "wrong">("playing");
    const [showHint, setShowHint] = useState(false);

    // Board state
    const [chess, setChess] = useState<Chess | null>(null);
    const [currentFen, setCurrentFen] = useState("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    const [moveIndex, setMoveIndex] = useState(0);

    // Progress state
    const [userId, setUserId] = useState<string>("");
    const [learnedEcob, setLearnedEcob] = useState<Set<string>>(new Set());

    useEffect(() => {
        // Initialize user ID
        let uid = localStorage.getItem("grandmaster_user_id");
        if (!uid) {
            uid = "user_" + Math.random().toString(36).substr(2, 9);
            localStorage.setItem("grandmaster_user_id", uid);
        }
        setUserId(uid);

        // Fetch progress
        fetch(`/api/py/api/progress/openings/${uid}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const learned = new Set(data.filter((i: any) => i.learned).map((i: any) => i.eco));
                    setLearnedEcob(learned);
                }
            })
            .catch(console.error);
    }, []);

    const toggleLearned = async (e: React.MouseEvent, opening: Opening) => {
        e.stopPropagation();
        const newStatus = !learnedEcob.has(opening.eco);

        // Optimistic update
        const newSet = new Set(learnedEcob);
        if (newStatus) newSet.add(opening.eco);
        else newSet.delete(opening.eco);
        setLearnedEcob(newSet);

        try {
            await fetch("/api/py/api/progress/openings/learn", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: userId,
                    eco: opening.eco,
                    learned: newStatus
                })
            });
        } catch (error) {
            console.error("Failed to update progress:", error);
            // Revert on error
            setLearnedEcob(prev => {
                const reverted = new Set(prev);
                if (newStatus) reverted.delete(opening.eco);
                else reverted.add(opening.eco);
                return reverted;
            });
        }
    };

    // Load opening into explorer - defined early so useEffects can use it
    const loadOpening = useCallback((opening: Opening) => {
        setSelectedOpening(opening);

        const newChess = new Chess();
        for (let i = 0; i < opening.moves.length; i++) {
            try {
                newChess.move(opening.moves[i]);
            } catch {
                break;
            }
        }

        setChess(newChess);
        setCurrentFen(newChess.fen());
        setMoveIndex(opening.moves.length);
    }, []);

    // Fetch categories on mount
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch("/api/py/api/openings/categories");
                if (response.ok) {
                    const data = await response.json();
                    const cats = data.categories || [];
                    setCategories(cats);
                    // Auto-select first category to show openings immediately
                    if (cats.length > 0 && !selectedCategory) {
                        setSelectedCategory(cats[0].code);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch categories:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCategories();
    }, []);

    // Fetch openings when category changes
    useEffect(() => {
        if (!selectedCategory) return;

        const fetchOpenings = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/py/api/openings/?eco=${selectedCategory}&limit=100`);
                if (response.ok) {
                    const data = await response.json();
                    const openingsList = data.openings || [];
                    setOpenings(openingsList);
                    // Auto-load first opening so board isn't empty
                    if (openingsList.length > 0 && !selectedOpening) {
                        loadOpening(openingsList[0]);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch openings:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchOpenings();
    }, [selectedCategory, loadOpening]);

    // Search openings
    useEffect(() => {
        if (!searchQuery || searchQuery.length < 2) return;

        const searchOpenings = async () => {
            try {
                const response = await fetch(`/api/py/api/openings/search/${encodeURIComponent(searchQuery)}`);
                if (response.ok) {
                    const data = await response.json();
                    setOpenings(data.openings || []);
                }
            } catch (error) {
                console.error("Failed to search openings:", error);
            }
        };

        const debounce = setTimeout(searchOpenings, 300);
        return () => clearTimeout(debounce);
    }, [searchQuery]);



    // Step through moves in explorer
    const stepMove = useCallback((direction: "forward" | "back") => {
        if (!selectedOpening) return;

        const newChess = new Chess();
        const targetIndex = direction === "forward"
            ? Math.min(moveIndex + 1, selectedOpening.moves.length)
            : Math.max(moveIndex - 1, 0);

        for (let i = 0; i < targetIndex; i++) {
            try {
                newChess.move(selectedOpening.moves[i]);
            } catch {
                break;
            }
        }

        setChess(newChess);
        setCurrentFen(newChess.fen());
        setMoveIndex(targetIndex);
    }, [selectedOpening, moveIndex]);

    // Start quiz mode
    const startQuiz = useCallback((opening?: Opening) => {
        setMode("quiz");
        const quizTarget = opening || openings[Math.floor(Math.random() * openings.length)];
        if (!quizTarget) return;

        setQuizOpening(quizTarget);
        setQuizMoveIndex(0);
        setQuizStatus("playing");
        setShowHint(false);

        // Start from initial position
        const newChess = new Chess();
        setChess(newChess);
        setCurrentFen(newChess.fen());
    }, [openings]);

    // Handle quiz move
    const handleQuizMove = useCallback((from: string, to: string) => {
        if (!chess || !quizOpening || quizStatus !== "playing") return false;

        const expectedMove = quizOpening.moves[quizMoveIndex];

        // Try to make the move
        try {
            const move = chess.move({ from, to, promotion: "q" });
            if (!move) return false;

            // Check if correct - compare SAN notation
            const isCorrect = move.san === expectedMove;

            if (isCorrect) {
                setCurrentFen(chess.fen());

                if (quizMoveIndex + 1 >= quizOpening.moves.length) {
                    // Quiz complete!
                    setQuizStatus("correct");
                    setQuizScore(s => s + 1);
                    setQuizStreak(s => s + 1);
                } else {
                    setQuizMoveIndex(quizMoveIndex + 1);
                    setShowHint(false);
                }
                return true;
            } else {
                // Wrong move
                chess.undo();
                setQuizStatus("wrong");
                setQuizStreak(0);

                // Show correct move briefly, then reset
                setTimeout(() => {
                    setQuizStatus("playing");
                }, 1000);
                return false;
            }
        } catch {
            return false;
        }
    }, [chess, quizOpening, quizMoveIndex, quizStatus]);

    // Next quiz question
    const nextQuiz = useCallback(() => {
        if (!openings.length) return;
        const randomOpening = openings[Math.floor(Math.random() * openings.length)];
        startQuiz(randomOpening);
    }, [openings, startQuiz]);

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="p-2 rounded-lg hover:bg-secondary transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-6 h-6 text-primary" />
                            <h1 className="text-xl font-bold">Opening Trainer</h1>
                        </div>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex items-center gap-2 bg-secondary rounded-lg p-1">
                        <button
                            onClick={() => setMode("explore")}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === "explore"
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-secondary/80"
                                }`}
                        >
                            <span className="flex items-center gap-2">
                                <BookOpen className="w-4 h-4" />
                                Explore
                            </span>
                        </button>
                        <button
                            onClick={() => startQuiz()}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === "quiz"
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-secondary/80"
                                }`}
                        >
                            <span className="flex items-center gap-2">
                                <GraduationCap className="w-4 h-4" />
                                Quiz
                            </span>
                        </button>
                        <button
                            onClick={() => setMode("tree")}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === "tree"
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-secondary/80"
                                }`}
                        >
                            <span className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                Tree
                            </span>
                        </button>
                    </div>

                    {/* Quiz Score */}
                    {mode === "quiz" && (
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary">
                                <Trophy className="w-4 h-4" />
                                <span className="text-sm font-medium">Score: {quizScore}</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-500">
                                <span className="text-sm font-medium">🔥 {quizStreak}</span>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            <main className="container mx-auto px-4 py-6">
                {mode === "tree" ? (
                    /* TREE MODE */
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left - Chess Board */}
                        <div className="space-y-4">
                            <div className="bg-card rounded-2xl border border-border p-4">
                                <ChessBoard
                                    position={currentFen}
                                    onMove={() => false}
                                />
                            </div>

                            {/* Current Position Info */}
                            {selectedOpening && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-card rounded-2xl border border-border p-4"
                                >
                                    <h3 className="font-semibold text-lg mb-2">{selectedOpening.name}</h3>
                                    <p className="text-sm text-muted-foreground">{selectedOpening.description}</p>
                                    <div className="mt-3 flex items-center gap-2">
                                        <span className="px-2 py-1 rounded bg-primary/10 text-primary text-xs font-medium">
                                            {selectedOpening.eco}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {selectedOpening.numMoves} moves
                                        </span>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Right - Opening Tree */}
                        <div>
                            <OpeningTree
                                moves={selectedOpening?.moves || []}
                                onMoveSelect={(path, index) => {
                                    // Update board position based on selected path
                                    const newChess = new Chess();
                                    for (const move of path) {
                                        try {
                                            newChess.move(move);
                                        } catch {
                                            break;
                                        }
                                    }
                                    setCurrentFen(newChess.fen());
                                    setChess(newChess);
                                }}
                            />
                        </div>
                    </div>
                ) : mode === "explore" ? (
                    /* EXPLORE MODE */
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Panel - Categories & Search */}
                        <div className="space-y-4">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search openings..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:outline-none"
                                />
                            </div>

                            {/* Categories */}
                            <div className="bg-card rounded-2xl border border-border p-4">
                                <h2 className="font-semibold mb-3">ECO Categories</h2>
                                <div className="space-y-2">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat.code}
                                            onClick={() => setSelectedCategory(cat.code)}
                                            className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${selectedCategory === cat.code
                                                ? "bg-primary/10 border border-primary/30"
                                                : "hover:bg-secondary"
                                                }`}
                                        >
                                            <div className="text-left">
                                                <div className="font-medium">{cat.code}xx</div>
                                                <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                    {cat.name}
                                                </div>
                                            </div>
                                            <div className="text-sm text-muted-foreground">{cat.count}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Opening List */}
                            {openings.length > 0 && (
                                <div className="bg-card rounded-2xl border border-border p-4 max-h-[400px] overflow-y-auto">
                                    <h2 className="font-semibold mb-3">Openings ({openings.length})</h2>
                                    <div className="space-y-1">
                                        {openings.map((opening) => (
                                            <button
                                                key={`${opening.eco}-${opening.name}`}
                                                onClick={() => loadOpening(opening)}
                                                className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${selectedOpening?.name === opening.name
                                                    ? "bg-primary/10"
                                                    : "hover:bg-secondary"
                                                    }`}
                                            >
                                                <span className="text-xs font-mono bg-secondary px-2 py-0.5 rounded">
                                                    {opening.eco}
                                                </span>
                                                <div className="flex-1 min-w-0 flex items-center justify-between">
                                                    <span className="text-sm truncate pr-2">{opening.name}</span>
                                                    {learnedEcob.has(opening.eco) && (
                                                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Center - Chess Board */}
                        <div className="lg:col-span-2">
                            <div className="bg-card rounded-2xl border border-border p-4">
                                {selectedOpening ? (
                                    <>
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between gap-4 mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">
                                                        {selectedOpening.eco}
                                                    </span>
                                                    <h2 className="text-xl font-bold">{selectedOpening.name}</h2>
                                                </div>

                                                <button
                                                    onClick={(e) => toggleLearned(e, selectedOpening)}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${learnedEcob.has(selectedOpening.eco)
                                                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                                            : "bg-secondary hover:bg-secondary/80 border border-border"
                                                        }`}
                                                >
                                                    <Check className="w-4 h-4" />
                                                    {learnedEcob.has(selectedOpening.eco) ? "Learned" : "Mark Learned"}
                                                </button>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {selectedOpening.description}
                                            </p>
                                        </div>

                                        <ChessBoard
                                            position={currentFen}
                                            orientation="white"
                                            interactable={false}
                                        />

                                        {/* Move Navigation */}
                                        <div className="mt-4 flex items-center justify-center gap-4">
                                            <button
                                                onClick={() => {
                                                    const newChess = new Chess();
                                                    setChess(newChess);
                                                    setCurrentFen(newChess.fen());
                                                    setMoveIndex(0);
                                                }}
                                                className="p-2 rounded-lg hover:bg-secondary"
                                            >
                                                ⏮️
                                            </button>
                                            <button
                                                onClick={() => stepMove("back")}
                                                className="p-3 rounded-xl bg-secondary hover:bg-secondary/80"
                                            >
                                                ◀️
                                            </button>
                                            <span className="text-sm font-medium px-4">
                                                {moveIndex} / {selectedOpening.moves.length}
                                            </span>
                                            <button
                                                onClick={() => stepMove("forward")}
                                                className="p-3 rounded-xl bg-secondary hover:bg-secondary/80"
                                            >
                                                ▶️
                                            </button>
                                            <button
                                                onClick={() => loadOpening(selectedOpening)}
                                                className="p-2 rounded-lg hover:bg-secondary"
                                            >
                                                ⏭️
                                            </button>
                                        </div>

                                        {/* Move List */}
                                        <div className="mt-4 p-3 bg-secondary/50 rounded-xl">
                                            <div className="flex flex-wrap gap-2">
                                                {selectedOpening.moves.map((move, i) => (
                                                    <span
                                                        key={i}
                                                        className={`px-2 py-1 rounded text-sm ${i < moveIndex
                                                            ? "bg-primary/20 text-primary"
                                                            : "bg-secondary"
                                                            }`}
                                                    >
                                                        {i % 2 === 0 && <span className="text-muted-foreground">{Math.floor(i / 2) + 1}.</span>}
                                                        {move}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Practice Button */}
                                        <button
                                            onClick={() => startQuiz(selectedOpening)}
                                            className="mt-4 w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 flex items-center justify-center gap-2"
                                        >
                                            <GraduationCap className="w-5 h-5" />
                                            Practice This Opening
                                        </button>
                                    </>
                                ) : (
                                    <div className="aspect-square flex items-center justify-center text-muted-foreground">
                                        <div className="text-center">
                                            <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                            <p>Select an opening to explore</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* QUIZ MODE */
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Chess Board */}
                        <div className="lg:col-span-2">
                            <div className="bg-card rounded-2xl border border-border p-4">
                                {quizOpening && (
                                    <>
                                        <div className="mb-4 text-center">
                                            <h2 className="text-xl font-bold">
                                                Play the {quizOpening.name}
                                            </h2>
                                            <p className="text-sm text-muted-foreground">
                                                {quizOpening.eco} • Move {quizMoveIndex + 1} of {quizOpening.moves.length}
                                            </p>
                                        </div>

                                        <div className="relative">
                                            <ChessBoard
                                                position={currentFen}
                                                orientation="white"
                                                onMove={handleQuizMove}
                                                interactable={quizStatus === "playing"}
                                            />

                                            {/* Status Overlay */}
                                            <AnimatePresence>
                                                {quizStatus === "correct" && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-lg"
                                                    >
                                                        <div className="text-center p-6">
                                                            <Check className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                                                            <h3 className="text-2xl font-bold text-white mb-2">Perfect!</h3>
                                                            <p className="text-gray-300 mb-4">
                                                                You know the {quizOpening.name}
                                                            </p>
                                                            <button
                                                                onClick={nextQuiz}
                                                                className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium flex items-center gap-2 mx-auto"
                                                            >
                                                                <RefreshCw className="w-5 h-5" />
                                                                Next Opening
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Controls */}
                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={() => setShowHint(!showHint)}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
                                >
                                    <Lightbulb className="w-5 h-5" />
                                    Show Hint
                                </button>
                                <button
                                    onClick={nextQuiz}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                                >
                                    <RefreshCw className="w-5 h-5" />
                                    Skip
                                </button>
                            </div>
                        </div>

                        {/* Info Panel */}
                        <div className="space-y-4">
                            {quizOpening && (
                                <>
                                    {/* Opening Info */}
                                    <div className="bg-card rounded-2xl border border-border p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">
                                                {quizOpening.eco}
                                            </span>
                                            <span className="font-medium">{quizOpening.name}</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {quizOpening.description}
                                        </p>
                                    </div>

                                    {/* Hint */}
                                    {showHint && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4"
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <Lightbulb className="w-4 h-4 text-amber-500" />
                                                <span className="font-medium text-amber-500">Hint</span>
                                            </div>
                                            <p className="text-sm">
                                                Next move: <code className="px-2 py-0.5 bg-secondary rounded">
                                                    {quizOpening.moves[quizMoveIndex]}
                                                </code>
                                            </p>
                                        </motion.div>
                                    )}

                                    {/* Progress */}
                                    <div className="bg-secondary/30 rounded-xl p-4">
                                        <h3 className="font-medium mb-3">Progress</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {quizOpening.moves.map((move, i) => (
                                                <span
                                                    key={i}
                                                    className={`px-2 py-1 rounded text-sm ${i < quizMoveIndex
                                                        ? "bg-emerald-500/20 text-emerald-500"
                                                        : i === quizMoveIndex
                                                            ? "bg-primary/20 text-primary ring-2 ring-primary"
                                                            : "bg-secondary text-muted-foreground"
                                                        }`}
                                                >
                                                    {i % 2 === 0 && `${Math.floor(i / 2) + 1}.`}{move}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
