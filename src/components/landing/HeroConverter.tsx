"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Play, Heart, MessageCircle, Share2 } from "lucide-react";

gsap.registerPlugin(useGSAP);

/**
 * HeroConverter - "From Data to Drama in one click"
 * 
 * Shows PGN code morphing into a viral video mockup.
 * Sells the Creator Studio feature.
 */

const SAMPLE_PGN = `[Event "World Championship"]
[White "Carlsen, M"]
[Black "Nepo, I"]
[Result "1-0"]

1.d4 Nf6 2.c4 e6 3.Nf3 d5
4.g3 Be7 5.Bg2 O-O 6.O-O
7.Qc2 c6 8.Nbd2 b6 9.e4`;

export function HeroConverter() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [stage, setStage] = useState<"pgn" | "morphing" | "video">("pgn");
    const [likes, setLikes] = useState(0);

    useGSAP(() => {
        if (stage === "morphing") {
            // Animate the morph
            const tl = gsap.timeline({
                onComplete: () => {
                    setStage("video");
                    // Animate like counter
                    gsap.to({ value: 0 }, {
                        value: 10847,
                        duration: 2,
                        ease: "power2.out",
                        onUpdate: function () {
                            setLikes(Math.floor(this.targets()[0].value));
                        },
                    });
                },
            });

            tl.to(".pgn-line", {
                opacity: 0,
                y: -20,
                stagger: 0.05,
                duration: 0.3,
            })
                .to(".morph-overlay", {
                    opacity: 1,
                    scale: 1,
                    duration: 0.5,
                });
        }
    }, { scope: containerRef, dependencies: [stage] });

    const handleConvert = () => {
        setStage("morphing");
    };

    const reset = () => {
        setStage("pgn");
        setLikes(0);
    };

    return (
        <section ref={containerRef} className="py-24 bg-gradient-to-b from-[#1a1d21] to-background">
            <div className="container mx-auto px-6">
                <div className="text-center mb-12">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl font-bold mb-4"
                    >
                        From <span className="text-muted-foreground">Data</span> to{" "}
                        <span className="text-primary">Drama</span>
                    </motion.h2>
                    <p className="text-muted-foreground max-w-lg mx-auto">
                        Turn boring PGN notation into viral chess content in one click
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row items-center justify-center gap-12 max-w-5xl mx-auto">

                    {/* PGN Input */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="relative w-full max-w-md"
                    >
                        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-700 font-mono text-sm">
                            <div className="flex items-center gap-2 mb-4 text-slate-500 text-xs">
                                <span className="w-3 h-3 rounded-full bg-red-500/50" />
                                <span className="w-3 h-3 rounded-full bg-yellow-500/50" />
                                <span className="w-3 h-3 rounded-full bg-green-500/50" />
                                <span className="ml-2">game.pgn</span>
                            </div>
                            <pre className="text-slate-400 whitespace-pre-wrap">
                                {SAMPLE_PGN.split("\n").map((line, i) => (
                                    <span key={i} className="pgn-line block">{line}</span>
                                ))}
                            </pre>
                        </div>

                        {stage === "pgn" && (
                            <motion.button
                                onClick={handleConvert}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg shadow-primary/20 flex items-center gap-2"
                            >
                                <Play className="w-4 h-4" />
                                Make it Viral
                            </motion.button>
                        )}
                    </motion.div>

                    {/* Arrow */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="hidden lg:block text-4xl text-primary"
                    >
                        →
                    </motion.div>

                    {/* Video Output */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="relative"
                    >
                        {/* Phone Frame */}
                        <div className="relative w-64 h-[500px] bg-slate-900 rounded-[3rem] border-4 border-slate-700 overflow-hidden shadow-2xl">
                            {/* Notch */}
                            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-5 bg-slate-800 rounded-full z-20" />

                            {/* Content */}
                            <div className="relative h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                                <AnimatePresence mode="wait">
                                    {stage === "pgn" && (
                                        <motion.div
                                            key="waiting"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="text-center text-slate-500"
                                        >
                                            <Play className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">Waiting for input...</p>
                                        </motion.div>
                                    )}

                                    {stage === "morphing" && (
                                        <motion.div
                                            key="morphing"
                                            className="morph-overlay absolute inset-0 bg-primary/20 flex items-center justify-center"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                        >
                                            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                        </motion.div>
                                    )}

                                    {stage === "video" && (
                                        <motion.div
                                            key="video"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="absolute inset-0"
                                        >
                                            {/* Fake video preview */}
                                            <div className="h-full bg-gradient-to-br from-emerald-900/50 to-slate-900 flex items-center justify-center">
                                                <div className="text-6xl">♔♕♖</div>
                                            </div>

                                            {/* TikTok-style overlay */}
                                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                                                <p className="text-white text-sm font-medium mb-1">
                                                    World Championship Brilliancy 🔥
                                                </p>
                                                <p className="text-white/60 text-xs">
                                                    #chess #grandmaster #brilliantmove
                                                </p>
                                            </div>

                                            {/* Engagement Icons */}
                                            <div className="absolute right-3 bottom-20 flex flex-col gap-4 items-center">
                                                <div className="text-center">
                                                    <Heart className="w-7 h-7 text-red-500 fill-red-500" />
                                                    <span className="text-white text-xs">{likes.toLocaleString()}</span>
                                                </div>
                                                <div className="text-center">
                                                    <MessageCircle className="w-7 h-7 text-white" />
                                                    <span className="text-white text-xs">847</span>
                                                </div>
                                                <div className="text-center">
                                                    <Share2 className="w-7 h-7 text-white" />
                                                    <span className="text-white text-xs">Share</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {stage === "video" && (
                            <motion.button
                                onClick={reset}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1 }}
                                className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-sm text-muted-foreground hover:text-foreground"
                            >
                                Reset Demo
                            </motion.button>
                        )}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
