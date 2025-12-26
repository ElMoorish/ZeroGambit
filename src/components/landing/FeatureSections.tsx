"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Brain, Shield, Zap, Lock, Sparkles, ChevronRight } from "lucide-react";
import Link from "next/link";

const FEATURES = [
    {
        id: "clarity",
        icon: Brain,
        title: "AI That Explains, Not Just Calculates",
        subtitle: "The Clarity Hook",
        description: "Stockfish tells you +1.5. We tell you WHY. Our AI Coach translates engine moves into natural language lessons.",
        gradient: "from-amber-500/20 to-amber-500/5",
        iconColor: "text-amber-400",
        cta: "See How It Works",
        ctaLink: "/pricing",
    },
    {
        id: "speed",
        icon: Zap,
        title: "Zero Latency. Zero Cloud Tax.",
        subtitle: "The Speed Hook",
        description: "We pushed Stockfish, the AI, and your game history directly to your browser. No loading. No waiting. Instant analysis.",
        gradient: "from-emerald-500/20 to-emerald-500/5",
        iconColor: "text-emerald-400",
        cta: "Try It Now",
        ctaLink: "/games",
    },
    {
        id: "privacy",
        icon: Lock,
        title: "Your Moves. Your Hardware. Zero Leaks.",
        subtitle: "The Vault",
        description: "Your opening prep stays on YOUR device. IndexedDB storage means your secrets never touch our servers.",
        gradient: "from-violet-500/20 to-violet-500/5",
        iconColor: "text-violet-400",
        cta: "Learn More",
        ctaLink: "/pricing",
    },
];

function FeatureCard({ feature, index }: { feature: typeof FEATURES[0]; index: number }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });
    const Icon = feature.icon;

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: index * 0.15, ease: [0.2, 0, 0.2, 1] }}
            className={`relative p-8 rounded-3xl border border-border bg-gradient-to-br ${feature.gradient} overflow-hidden group`}
        >
            {/* Glow Effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className={`absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl ${feature.iconColor} opacity-20`} />
            </div>

            <div className="relative z-10">
                <div className={`inline-flex p-3 rounded-xl bg-background/50 border border-border mb-6 ${feature.iconColor}`}>
                    <Icon className="w-6 h-6" />
                </div>

                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">{feature.subtitle}</p>
                <h3 className="text-2xl font-bold mb-4 leading-snug">{feature.title}</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">{feature.description}</p>

                <Link href={feature.ctaLink}>
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                        {feature.cta} <ChevronRight className="w-4 h-4" />
                    </span>
                </Link>
            </div>
        </motion.div>
    );
}

export function FeaturesSection() {
    return (
        <section className="py-24 bg-[#1a1d21]">
            <div className="container mx-auto px-6">
                {/* Section Header */}
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4"
                    >
                        <Sparkles className="w-4 h-4" />
                        Why Players Choose Us
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl font-bold mb-4"
                    >
                        Built Different. Built Better.
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-muted-foreground"
                    >
                        We rebuilt chess analysis from the ground up. No cloud dependency. No subscription walls on core features.
                    </motion.p>
                </div>

                {/* Feature Cards */}
                <div className="grid md:grid-cols-3 gap-6">
                    {FEATURES.map((feature, index) => (
                        <FeatureCard key={feature.id} feature={feature} index={index} />
                    ))}
                </div>
            </div>
        </section>
    );
}

export function CTASection() {
    return (
        <section className="py-24 bg-gradient-to-b from-[#1a1d21] to-background">
            <div className="container mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="relative max-w-4xl mx-auto p-12 rounded-3xl bg-card border border-border overflow-hidden"
                >
                    {/* Background Glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-amber-500/10" />
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-primary/20 rounded-full blur-[100px]" />

                    <div className="relative z-10 text-center">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Ready to Master Your Game?
                        </h2>
                        <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                            Join thousands of players who analyze smarter, not harder.
                            Start with unlimited free analysis today.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/games">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold flex items-center gap-2 hover:bg-primary/90 transition-colors"
                                >
                                    Analyze For Free <ChevronRight className="w-5 h-5" />
                                </motion.button>
                            </Link>
                            <Link href="/pricing">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="px-8 py-4 border border-border rounded-xl font-medium hover:bg-white/5 transition-colors"
                                >
                                    View Pro Plans
                                </motion.button>
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
