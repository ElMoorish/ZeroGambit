"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Chess, Square } from "chess.js";
import { ChessBoard } from "@/components/ChessBoard";
import { Check, X, ChevronRight } from "lucide-react";
import Link from "next/link";

// Famous positions with the "correct" first move
const HERO_PUZZLES = [
    {
        name: "The Queen's Gambit",
        fen: "rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR b KQkq - 0 2",
        solution: "dxc4", // Accept the gambit
        hint: "Accept the offer...",
    },
    {
        name: "Opera Game Finale",
        fen: "r1b1kb1r/pppp1ppp/2n2q2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
        solution: "Qxf7+", // Scholar's mate threat
        hint: "Strike decisively.",
    },
    {
        name: "Knight Fork Setup",
        fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
        solution: "Bc4", // Italian Game
        hint: "Control the center.",
    },
];

interface FirstMoveHeroProps {
    onUnlock?: () => void;
}

export function FirstMoveHero({ onUnlock }: FirstMoveHeroProps) {
    const [puzzleIndex] = useState(() => Math.floor(Math.random() * HERO_PUZZLES.length));
    const [chess] = useState(() => new Chess(HERO_PUZZLES[puzzleIndex].fen));
    const [currentFen, setCurrentFen] = useState(HERO_PUZZLES[puzzleIndex].fen);
    const [status, setStatus] = useState<"waiting" | "correct" | "wrong">("waiting");
    const [showHint, setShowHint] = useState(false);
    const [attempts, setAttempts] = useState(0);

    const puzzle = HERO_PUZZLES[puzzleIndex];

    // Show hint after 5 seconds
    useEffect(() => {
        const timer = setTimeout(() => setShowHint(true), 5000);
        return () => clearTimeout(timer);
    }, []);

    const handleMove = useCallback((from: string, to: string): boolean => {
        try {
            const move = chess.move({ from: from as Square, to: to as Square, promotion: 'q' });
            if (!move) return false;

            setCurrentFen(chess.fen());

            // Check if correct
            if (move.san === puzzle.solution || move.san.replace(/[+#]/, '') === puzzle.solution.replace(/[+#]/, '')) {
                setStatus("correct");
                onUnlock?.();
            } else {
                setStatus("wrong");
                setAttempts(prev => prev + 1);
                // Reset after shake
                setTimeout(() => {
                    chess.undo();
                    setCurrentFen(chess.fen());
                    setStatus("waiting");
                }, 1000);
            }

            return true;
        } catch {
            return false;
        }
    }, [chess, puzzle.solution, onUnlock]);

    return (
        <section className="relative min-h-screen flex items-center justify-center py-20 overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#1a1d21] via-[#1a1d21] to-background" />

            {/* Subtle grid pattern */}
            <div className="absolute inset-0 opacity-5"
                style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                    backgroundSize: '50px 50px'
                }}
            />

            <div className="relative z-10 container mx-auto px-6">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Subtle title behind the board */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 0.1 }}
                        className="text-6xl md:text-8xl font-bold text-white/10 absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap pointer-events-none"
                    >
                        ZEROGAMBIT
                    </motion.h1>

                    {/* Puzzle name */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-sm uppercase tracking-widest text-muted-foreground mb-8"
                    >
                        {puzzle.name}
                    </motion.p>

                    {/* Interactive Board */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5, type: "spring" }}
                        className={`relative mx-auto max-w-md ${status === "wrong" ? "animate-shake" : ""
                            } ${status === "correct" ? "ring-4 ring-green-500/50 rounded-xl" : ""}`}
                    >
                        <ChessBoard
                            position={currentFen}
                            orientation={HERO_PUZZLES[puzzleIndex].fen.includes(' w ') ? 'white' : 'black'}
                            onMove={handleMove}
                            interactable={status === "waiting"}
                        />

                        {/* Ripple effect on correct */}
                        <AnimatePresence>
                            {status === "correct" && (
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 1 }}
                                    animate={{ scale: 2, opacity: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-green-500/20 rounded-xl pointer-events-none"
                                />
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* Status Messages */}
                    <AnimatePresence mode="wait">
                        {status === "waiting" && (
                            <motion.div
                                key="waiting"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="mt-8"
                            >
                                <p className="text-lg text-muted-foreground">
                                    Make your first move
                                </p>
                                {showHint && (
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-sm text-primary mt-2"
                                    >
                                        💡 {puzzle.hint}
                                    </motion.p>
                                )}
                            </motion.div>
                        )}

                        {status === "wrong" && (
                            <motion.div
                                key="wrong"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="mt-8 flex items-center justify-center gap-2 text-red-400"
                            >
                                <X className="w-5 h-5" />
                                <span>Focus. Try again.</span>
                            </motion.div>
                        )}

                        {status === "correct" && (
                            <motion.div
                                key="correct"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="mt-8 space-y-4"
                            >
                                <div className="flex items-center justify-center gap-2 text-green-400">
                                    <Check className="w-5 h-5" />
                                    <span className="font-medium">Perfect.</span>
                                </div>

                                <Link href="/games">
                                    <motion.button
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold flex items-center gap-2 mx-auto hover:bg-primary/90 transition-colors"
                                    >
                                        Enter the Dojo
                                        <ChevronRight className="w-5 h-5" />
                                    </motion.button>
                                </Link>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* CSS for shake animation */}
            <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
        </section>
    );
}
