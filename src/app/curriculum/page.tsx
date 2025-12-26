"use client";

import { Navigation } from "@/components/Navigation";
import { motion } from "framer-motion";
import { CurriculumOverview, SkillTreeVisualization } from "@/components/curriculum/CurriculumSystem";
import { Target, BookOpen, Trophy } from "lucide-react";

/**
 * Curriculum Page - The Stone & Sage Methodology
 */

export default function CurriculumPage() {
    return (
        <div className="min-h-screen bg-background">
            <Navigation />

            <main className="container mx-auto px-6 py-24">
                {/* Header */}
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4"
                    >
                        <BookOpen className="w-4 h-4" />
                        The Methodology
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-bold mb-4"
                    >
                        Stone. <span className="text-amber-400">Flow.</span>{" "}
                        <span className="text-purple-400">Sage.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-muted-foreground max-w-2xl mx-auto"
                    >
                        A structured path from tactical awareness to strategic mastery.
                        Progress through three phases of chess enlightenment.
                    </motion.p>
                </div>

                {/* The Three Pillars */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="grid md:grid-cols-3 gap-6 mb-24"
                >
                    <div className="text-center p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                        <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Target className="w-8 h-8 text-amber-400" />
                        </div>
                        <h3 className="text-xl font-bold text-amber-400 mb-2">Phase I: Stone</h3>
                        <p className="text-sm text-muted-foreground">
                            Build your tactical foundation. Recognize patterns that create winning combinations.
                        </p>
                    </div>

                    <div className="text-center p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">⚔️</span>
                        </div>
                        <h3 className="text-xl font-bold text-emerald-400 mb-2">Phase II: Flow</h3>
                        <p className="text-sm text-muted-foreground">
                            Master strategic thinking. Understand pawn structures, piece activity, and plans.
                        </p>
                    </div>

                    <div className="text-center p-6 rounded-2xl bg-purple-500/5 border border-purple-500/20">
                        <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trophy className="w-8 h-8 text-purple-400" />
                        </div>
                        <h3 className="text-xl font-bold text-purple-400 mb-2">Phase III: Sage</h3>
                        <p className="text-sm text-muted-foreground">
                            Achieve endgame wisdom. Convert advantages and save draws like a grandmaster.
                        </p>
                    </div>
                </motion.div>

                {/* Curriculum Overview */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <h2 className="text-2xl font-bold mb-8 text-center">Your Training Path</h2>
                    <CurriculumOverview />
                </motion.div>

                {/* Skill Tree */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-24"
                >
                    <h2 className="text-2xl font-bold mb-8 text-center">The Journey</h2>
                    <SkillTreeVisualization />
                </motion.div>

                {/* Quote */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="mt-24 text-center max-w-2xl mx-auto"
                >
                    <blockquote className="text-xl italic text-muted-foreground">
                        &ldquo;The Stone sharpens the blade. The Flow guides the strike. The Sage knows when to stay the hand.&rdquo;
                    </blockquote>
                    <p className="mt-4 text-sm text-slate-500">— The ZeroGambit Methodology</p>
                </motion.div>
            </main>
        </div>
    );
}
