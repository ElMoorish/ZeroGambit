"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Puzzle, Quote, BookOpen, Sunrise, ChevronRight } from "lucide-react";
import Link from "next/link";

/**
 * Daily Ritual - Changes every 24h
 * 
 * "The Daily Stone": One puzzle, one quote, one tip.
 * Gives users a reason to check the home page daily.
 */

// Curated content that rotates daily
const DAILY_PUZZLES = [
    { fen: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4", solution: "Qxf7#", theme: "Scholar's Mate" },
    { fen: "r1b1kb1r/pppp1ppp/2n2n2/4p1N1/2B1P2q/8/PPPP1PPP/RNBQK2R w KQkq - 0 5", solution: "Nxf7", theme: "Fork" },
    { fen: "r2qkbnr/ppp2ppp/2np4/4p3/2B1P1b1/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 5", solution: "Bxf7+", theme: "Sacrifice" },
];

const GM_QUOTES = [
    { text: "Chess is life in miniature.", author: "Garry Kasparov" },
    { text: "The winner is the one who makes the next-to-last mistake.", author: "Savielly Tartakower" },
    { text: "When you see a good move, look for a better one.", author: "Emanuel Lasker" },
    { text: "Chess is the gymnasium of the mind.", author: "Blaise Pascal" },
    { text: "Every chess master was once a beginner.", author: "Irving Chernev" },
];

const OPENING_TIPS = [
    { opening: "Italian Game", tip: "Control the center with e4/d4, develop knights before bishops, castle early." },
    { opening: "Sicilian Defense", tip: "Black fights for the center asymmetrically. Be ready for sharp tactical play." },
    { opening: "Queen's Gambit", tip: "White offers a pawn to control the center. Accepting isn't necessarily bad!" },
    { opening: "London System", tip: "Solid and reliable. Develop the dark-squared bishop to f4 early." },
    { opening: "King's Indian", tip: "A hypermodern approach. Let White build a center, then attack it." },
];

function getDailyIndex(array: any[]): number {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    return dayOfYear % array.length;
}

function getTimeUntilReset(): string {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const diff = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
}

export function DailyRitual() {
    const [timeUntilReset, setTimeUntilReset] = useState("");

    const puzzle = DAILY_PUZZLES[getDailyIndex(DAILY_PUZZLES)];
    const quote = GM_QUOTES[getDailyIndex(GM_QUOTES)];
    const tip = OPENING_TIPS[getDailyIndex(OPENING_TIPS)];

    useEffect(() => {
        setTimeUntilReset(getTimeUntilReset());
        const interval = setInterval(() => {
            setTimeUntilReset(getTimeUntilReset());
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="py-20 bg-gradient-to-b from-background to-[#1a1d21]">
            <div className="container mx-auto px-6">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-400 text-sm font-medium mb-4"
                    >
                        <Sunrise className="w-4 h-4" />
                        The Daily Stone
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl font-bold mb-2"
                    >
                        Your Daily Ritual
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-muted-foreground"
                    >
                        New content in <span className="text-primary font-mono">{timeUntilReset}</span>
                    </motion.p>
                </div>

                {/* Daily Content Grid */}
                <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">

                    {/* Daily Puzzle */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors"
                    >
                        <div className="flex items-center gap-2 mb-4 text-primary">
                            <Puzzle className="w-5 h-5" />
                            <h3 className="font-semibold">Daily Puzzle</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                            Theme: <span className="text-foreground">{puzzle.theme}</span>
                        </p>
                        <Link href="/puzzles">
                            <button className="w-full py-2.5 bg-primary/10 text-primary rounded-xl text-sm font-medium hover:bg-primary/20 transition-colors flex items-center justify-center gap-2">
                                Solve Now <ChevronRight className="w-4 h-4" />
                            </button>
                        </Link>
                    </motion.div>

                    {/* GM Quote */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="p-6 rounded-2xl bg-card border border-border"
                    >
                        <div className="flex items-center gap-2 mb-4 text-amber-400">
                            <Quote className="w-5 h-5" />
                            <h3 className="font-semibold">Grandmaster Wisdom</h3>
                        </div>
                        <blockquote className="text-foreground italic mb-3">
                            "{quote.text}"
                        </blockquote>
                        <p className="text-sm text-muted-foreground">
                            — {quote.author}
                        </p>
                    </motion.div>

                    {/* Opening Tip */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="p-6 rounded-2xl bg-card border border-border"
                    >
                        <div className="flex items-center gap-2 mb-4 text-emerald-400">
                            <BookOpen className="w-5 h-5" />
                            <h3 className="font-semibold">Opening Study</h3>
                        </div>
                        <p className="text-sm text-primary mb-2">{tip.opening}</p>
                        <p className="text-sm text-muted-foreground">
                            {tip.tip}
                        </p>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
