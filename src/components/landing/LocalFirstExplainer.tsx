"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { motion } from "framer-motion";
import { Monitor, Cpu, Database, Lock, Zap, Wifi, ArrowRight } from "lucide-react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * LocalFirstExplainer - Horizontal scroll-driven architecture reveal
 * 
 * Creates a cinematic left-to-right journey as user scrolls down.
 * Each architecture layer slides in from the right and settles into place.
 */

const STACK_LAYERS = [
    {
        id: "interface",
        title: "The Interface",
        subtitle: "React + Next.js",
        icon: Monitor,
        color: "from-violet-500 to-violet-600",
        borderColor: "border-violet-500/30",
        bgColor: "bg-violet-500/10",
        description: "Beautiful, responsive UI that feels native",
    },
    {
        id: "engine",
        title: "The Engine",
        subtitle: "Stockfish WASM",
        icon: Cpu,
        color: "from-emerald-500 to-emerald-600",
        borderColor: "border-emerald-500/30",
        bgColor: "bg-emerald-500/10",
        description: "Grandmaster-level analysis in your browser",
    },
    {
        id: "memory",
        title: "The Memory",
        subtitle: "IndexedDB Local Storage",
        icon: Database,
        color: "from-amber-500 to-amber-600",
        borderColor: "border-amber-500/30",
        bgColor: "bg-amber-500/10",
        description: "Your data never leaves your device",
    },
];

const VALUE_PROPS = [
    { icon: Lock, label: "100% Private", value: "Zero data sent to servers" },
    { icon: Zap, label: "Zero Latency", value: "No round-trip to the cloud" },
    { icon: Wifi, label: "Works Offline", value: "Full functionality anywhere" },
];

export function LocalFirstExplainer() {
    const containerRef = useRef<HTMLDivElement>(null);
    const horizontalRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        if (!containerRef.current || !horizontalRef.current) return;

        const mm = gsap.matchMedia();

        // Desktop: Horizontal scroll effect
        mm.add("(min-width: 768px)", () => {
            const horizontalSection = horizontalRef.current;
            const sections = gsap.utils.toArray<HTMLElement>(".arch-panel");

            // Calculate total scroll distance
            const totalWidth = horizontalSection!.scrollWidth - window.innerWidth;

            // Create the horizontal scroll effect
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: "top top",
                    end: () => `+=${totalWidth}`,
                    scrub: 0.5, // Smooth, cinematic feel
                    pin: true,
                    anticipatePin: 1,
                },
            });

            // Animate the horizontal scroll
            tl.to(horizontalSection, {
                x: -totalWidth,
                ease: "none",
            });

            return () => {
                tl.kill();
            };
        });

        // Mobile: Simple fade-in sequence
        mm.add("(max-width: 767px)", () => {
            gsap.set(".arch-panel", { opacity: 1 });
        });

        return () => mm.revert();
    }, { scope: containerRef });

    return (
        <section
            ref={containerRef}
            className="relative bg-[#1a1d21] overflow-hidden"
        >
            {/* Horizontal Scroll Track */}
            <div
                ref={horizontalRef}
                className="flex items-center h-screen"
                style={{ width: "fit-content" }}
            >
                {/* Panel 1: Introduction */}
                <div className="arch-panel flex-shrink-0 w-screen h-screen flex items-center justify-center px-8 md:px-16">
                    <div className="text-center max-w-3xl">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
                                <Cpu className="w-4 h-4" />
                                Local-First Architecture
                            </div>
                            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-white">
                                The <span className="bg-gradient-to-r from-primary to-amber-400 bg-clip-text text-transparent">Thick Client</span> Architecture
                            </h2>
                            <p className="text-xl text-muted-foreground mb-8">
                                We pushed everything to your browser. No servers to lag.
                                No data to leak. Just pure, instant chess intelligence.
                            </p>
                            <div className="flex items-center justify-center gap-2 text-primary/70">
                                <span className="text-sm">Scroll to explore</span>
                                <ArrowRight className="w-4 h-4 animate-pulse" />
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Panels 2-4: Stack Layers */}
                {STACK_LAYERS.map((layer, index) => {
                    const Icon = layer.icon;
                    return (
                        <div
                            key={layer.id}
                            className="arch-panel flex-shrink-0 w-screen h-screen flex items-center justify-center px-8 md:px-16"
                        >
                            <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl w-full">
                                {/* Left: Visual */}
                                <div className="relative">
                                    {/* Large Icon Background */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${layer.color} opacity-10 rounded-3xl blur-3xl`} />

                                    {/* Main Card */}
                                    <div className={`relative p-8 md:p-12 rounded-3xl border ${layer.borderColor} ${layer.bgColor} backdrop-blur-sm`}>
                                        <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${layer.color} mb-6`}>
                                            <Icon className="w-8 h-8 text-white" />
                                        </div>
                                        <h3 className="text-3xl md:text-4xl font-bold text-white mb-2">
                                            {layer.title}
                                        </h3>
                                        <p className="text-lg text-muted-foreground">
                                            {layer.subtitle}
                                        </p>
                                    </div>

                                    {/* Step indicator */}
                                    <div className="absolute -bottom-4 -right-4 w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white font-bold">
                                        {index + 1}
                                    </div>
                                </div>

                                {/* Right: Description */}
                                <div className="text-center md:text-left">
                                    <p className="text-2xl md:text-3xl text-white/90 leading-relaxed">
                                        {layer.description}
                                    </p>

                                    {/* Progress Dots */}
                                    <div className="flex items-center gap-2 mt-8 justify-center md:justify-start">
                                        {STACK_LAYERS.map((_, i) => (
                                            <div
                                                key={i}
                                                className={`w-2 h-2 rounded-full transition-all ${i === index
                                                        ? "bg-primary w-8"
                                                        : "bg-white/20"
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Panel 5: Value Props Summary */}
                <div className="arch-panel flex-shrink-0 w-screen h-screen flex items-center justify-center px-8 md:px-16">
                    <div className="max-w-5xl w-full">
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="text-center mb-12"
                        >
                            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                                What This Means For You
                            </h3>
                            <p className="text-muted-foreground text-lg">
                                A chess platform that respects your privacy and works anywhere
                            </p>
                        </motion.div>

                        {/* Value Props Grid */}
                        <div className="grid md:grid-cols-3 gap-6">
                            {VALUE_PROPS.map((prop, index) => {
                                const Icon = prop.icon;
                                return (
                                    <motion.div
                                        key={prop.label}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.1 }}
                                        className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center hover:bg-white/10 transition-colors"
                                    >
                                        <div className="inline-flex p-3 rounded-xl bg-primary/10 mb-4">
                                            <Icon className="w-6 h-6 text-primary" />
                                        </div>
                                        <h4 className="font-semibold text-white text-lg mb-2">
                                            {prop.label}
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                            {prop.value}
                                        </p>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Continue indicator */}
                        <div className="flex items-center justify-center gap-2 text-primary/70 mt-12">
                            <span className="text-sm">Continue scrolling</span>
                            <ArrowRight className="w-4 h-4 animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
