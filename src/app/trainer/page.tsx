"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    Bot,
    ArrowLeft,
    Puzzle,
    Gamepad2,
    Sparkles,
    Brain,
    Target,
    MessageCircle
} from "lucide-react";
import Link from "next/link";

interface TrainerMode {
    id: string;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    href: string;
    color: string;
    bgGradient: string;
    features: string[];
}

const TRAINER_MODES: TrainerMode[] = [
    {
        id: "puzzle-coach",
        title: "Puzzle Training",
        description: "AI-powered puzzle coaching with automatic explanations for every move",
        icon: Puzzle,
        href: "/puzzles",
        color: "text-emerald-400",
        bgGradient: "from-emerald-500/20 to-teal-500/20",
        features: [
            "Automatic move explanations",
            "Pattern recognition teaching",
            "Progressive hints",
            "Tactical pattern identification"
        ]
    },
    {
        id: "game-coach",
        title: "Game Analysis Coach",
        description: "Deep analysis of your games with AI-generated insights",
        icon: Gamepad2,
        href: "/games",
        color: "text-purple-400",
        bgGradient: "from-purple-500/20 to-blue-500/20",
        features: [
            "Move-by-move explanations",
            "Blunder/mistake analysis",
            "Strategic recommendations",
            "Opening preparation tips"
        ]
    }
];

export default function TrainerPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur">
                <div className="container mx-auto px-4 py-4 flex items-center gap-4">
                    <Link
                        href="/"
                        className="p-2 rounded-lg hover:bg-secondary transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex items-center gap-2">
                        <Bot className="w-6 h-6 text-amber-500" />
                        <h1 className="text-xl font-bold">AI Trainer</h1>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span className="text-sm text-muted-foreground">Powered by LangGraph + Gemma</span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                {/* Hero */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 mb-4">
                        <Brain className="w-4 h-4 text-amber-500" />
                        <span className="text-sm text-amber-500 font-medium">AI-Powered Coaching</span>
                    </div>
                    <h2 className="text-4xl font-bold mb-4">
                        Train Smarter with <span className="text-amber-500">AI Coaching</span>
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Get real-time explanations, hints, and insights powered by our LangGraph AI coach.
                        No chat required - coaching happens automatically as you play.
                    </p>
                </motion.div>

                {/* Mode Cards */}
                <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    {TRAINER_MODES.map((mode, index) => {
                        const Icon = mode.icon;
                        return (
                            <motion.div
                                key={mode.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Link href={mode.href}>
                                    <div className={`group relative p-6 rounded-2xl border border-border bg-gradient-to-br ${mode.bgGradient} hover:border-primary/50 transition-all cursor-pointer`}>
                                        {/* Icon */}
                                        <div className={`inline-flex p-3 rounded-xl bg-background/50 ${mode.color} mb-4`}>
                                            <Icon className="w-8 h-8" />
                                        </div>

                                        {/* Title & Description */}
                                        <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                                            {mode.title}
                                        </h3>
                                        <p className="text-muted-foreground mb-4">
                                            {mode.description}
                                        </p>

                                        {/* Features */}
                                        <ul className="space-y-2">
                                            {mode.features.map((feature, i) => (
                                                <li key={i} className="flex items-center gap-2 text-sm">
                                                    <Target className="w-3 h-3 text-primary" />
                                                    <span className="text-muted-foreground">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>

                                        {/* CTA */}
                                        <div className="mt-6 flex items-center gap-2 text-primary font-medium">
                                            <span>Start Training</span>
                                            <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>

                {/* How it Works */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mt-16 max-w-3xl mx-auto"
                >
                    <h3 className="text-2xl font-bold text-center mb-8">How AI Coaching Works</h3>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            {
                                icon: Puzzle,
                                title: "1. Make a Move",
                                description: "Play puzzles or analyze games as you normally would"
                            },
                            {
                                icon: Brain,
                                title: "2. AI Analyzes",
                                description: "LangGraph agents evaluate your move using Stockfish"
                            },
                            {
                                icon: MessageCircle,
                                title: "3. Get Insight",
                                description: "Receive instant coaching - no questions needed"
                            }
                        ].map((step, i) => (
                            <div key={i} className="text-center p-4">
                                <div className="inline-flex p-3 rounded-xl bg-secondary mb-3">
                                    <step.icon className="w-6 h-6 text-primary" />
                                </div>
                                <h4 className="font-semibold mb-1">{step.title}</h4>
                                <p className="text-sm text-muted-foreground">{step.description}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Security Note */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-12 text-center"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30">
                        <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span className="text-sm text-green-500 font-medium">
                            Secure by Design - No user input to AI, preventing prompt injection
                        </span>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
