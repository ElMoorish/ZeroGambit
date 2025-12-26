"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { motion } from "framer-motion";
import { Lock, Check, Shield, Database, Key } from "lucide-react";

gsap.registerPlugin(useGSAP);

/**
 * DataVault - "Your moves. Your hardware. Zero leaks."
 * 
 * Premium, seamless design with floating shield illustration.
 * Sells the privacy/local-first value proposition.
 */

const FEATURES = [
    { icon: Shield, text: "Local-first architecture" },
    { icon: Database, text: "No cloud dependency" },
    { icon: Key, text: "Works completely offline" },
    { icon: Lock, text: "Your opening prep stays secret" },
];

export function DataVault() {
    const [isLocked, setIsLocked] = useState(false);

    return (
        <section className="relative py-32 overflow-hidden">
            {/* Background with gradient mesh */}
            <div className="absolute inset-0 bg-[#1a1d21]" />

            {/* Subtle gradient orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />

            <div className="relative container mx-auto px-6">
                <div className="grid lg:grid-cols-2 gap-16 items-center">

                    {/* Left: Shield Illustration */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="relative flex items-center justify-center"
                    >
                        {/* Outer glow ring */}
                        <motion.div
                            className="absolute w-64 h-64 rounded-full"
                            style={{
                                background: "radial-gradient(circle, rgba(127, 178, 133, 0.1) 0%, transparent 70%)",
                            }}
                            animate={{
                                scale: [1, 1.1, 1],
                                opacity: [0.5, 0.3, 0.5],
                            }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        />

                        {/* Floating particles */}
                        {[...Array(12)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-2 h-2 rounded-full bg-primary/40"
                                initial={{
                                    x: Math.cos((i / 12) * Math.PI * 2) * 100,
                                    y: Math.sin((i / 12) * Math.PI * 2) * 100,
                                }}
                                animate={{
                                    x: [
                                        Math.cos((i / 12) * Math.PI * 2) * 100,
                                        Math.cos((i / 12) * Math.PI * 2 + 0.5) * 110,
                                        Math.cos((i / 12) * Math.PI * 2) * 100,
                                    ],
                                    y: [
                                        Math.sin((i / 12) * Math.PI * 2) * 100,
                                        Math.sin((i / 12) * Math.PI * 2 + 0.5) * 110,
                                        Math.sin((i / 12) * Math.PI * 2) * 100,
                                    ],
                                    opacity: isLocked ? [0.4, 1, 0.4] : [0.2, 0.4, 0.2],
                                }}
                                transition={{
                                    duration: 3 + i * 0.2,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                            />
                        ))}

                        {/* Central shield */}
                        <motion.div
                            className={`relative z-10 p-8 rounded-3xl backdrop-blur-sm border transition-all duration-500 ${isLocked
                                    ? "bg-primary/20 border-primary/40 shadow-lg shadow-primary/20"
                                    : "bg-white/5 border-white/10"
                                }`}
                            animate={{
                                scale: isLocked ? 1.05 : 1,
                            }}
                            transition={{ type: "spring", stiffness: 300 }}
                        >
                            <motion.div
                                animate={{
                                    rotateY: isLocked ? [0, 360] : 0,
                                }}
                                transition={{ duration: 0.8, ease: "easeInOut" }}
                            >
                                <Shield className={`w-16 h-16 transition-colors duration-500 ${isLocked ? "text-primary" : "text-white/60"
                                    }`} />
                            </motion.div>

                            {/* Lock indicator */}
                            <motion.div
                                className="absolute -bottom-2 -right-2 p-2 rounded-full bg-background border border-border"
                                animate={{
                                    scale: isLocked ? [1, 1.2, 1] : 1,
                                }}
                                transition={{ duration: 0.3 }}
                            >
                                <Lock className={`w-4 h-4 transition-colors ${isLocked ? "text-primary" : "text-muted-foreground"
                                    }`} />
                            </motion.div>
                        </motion.div>

                        {/* Connection lines */}
                        <svg className="absolute w-full h-full pointer-events-none" style={{ opacity: 0.2 }}>
                            <defs>
                                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="transparent" />
                                    <stop offset="50%" stopColor="rgba(127, 178, 133, 0.5)" />
                                    <stop offset="100%" stopColor="transparent" />
                                </linearGradient>
                            </defs>
                            {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                                <motion.line
                                    key={angle}
                                    x1="50%"
                                    y1="50%"
                                    x2={`${50 + Math.cos((angle * Math.PI) / 180) * 40}%`}
                                    y2={`${50 + Math.sin((angle * Math.PI) / 180) * 40}%`}
                                    stroke="url(#lineGradient)"
                                    strokeWidth="1"
                                    initial={{ pathLength: 0 }}
                                    whileInView={{ pathLength: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1, duration: 0.5 }}
                                />
                            ))}
                        </svg>
                    </motion.div>

                    {/* Right: Content */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                            Your <span className="text-primary">Vault</span>. Your Rules.
                        </h2>
                        <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
                            Every move, every analysis, every opening secret stays on YOUR device.
                            IndexedDB encryption means zero leaks to any server.
                        </p>

                        {/* Feature list */}
                        <div className="grid sm:grid-cols-2 gap-4 mb-10">
                            {FEATURES.map((feature, index) => {
                                const Icon = feature.icon;
                                return (
                                    <motion.div
                                        key={feature.text}
                                        initial={{ opacity: 0, y: 10 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.1 }}
                                        className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
                                    >
                                        <div className="p-2 rounded-lg bg-primary/10">
                                            <Icon className="w-4 h-4 text-primary" />
                                        </div>
                                        <span className="text-sm text-foreground">{feature.text}</span>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-wrap gap-4">
                            <motion.button
                                onClick={() => setIsLocked(!isLocked)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`px-8 py-4 rounded-xl font-semibold transition-all ${isLocked
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-white/10 text-white border border-white/20 hover:bg-white/20"
                                    }`}
                            >
                                {isLocked ? (
                                    <span className="flex items-center gap-2">
                                        <Check className="w-5 h-5" />
                                        Data Secured
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <Lock className="w-5 h-5" />
                                        Lock My Data
                                    </span>
                                )}
                            </motion.button>
                        </div>

                        {/* Tagline */}
                        <p className="mt-8 text-sm text-muted-foreground/70">
                            &quot;Your moves. Your hardware. Zero leaks. 100% Local.&quot;
                        </p>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
