"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

gsap.registerPlugin(useGSAP);

interface Particle {
    x: number;
    y: number;
    r: number;
    vx: number;
    vy: number;
    originalX: number;
    originalY: number;
    phase: number;
}

export default function NeuralHero() {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Mouse position tracking
    const mouse = useRef({ x: -1000, y: -1000 });

    useGSAP(() => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        // Stone & Sage Palette
        // Sage Green: rgba(127, 178, 133, 0.4) (#7fb285)
        // Slate: #252930
        const particles: Particle[] = [];
        const particleCount = width < 768 ? 60 : 120; // Reduced for mobile

        // Initialize Particles
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                r: Math.random() * 2 + 1,
                vx: (Math.random() - 0.5) * 0.2, // Very slow drift
                vy: (Math.random() - 0.5) * 0.2,
                originalX: Math.random() * width,
                originalY: Math.random() * height,
                phase: Math.random() * Math.PI * 2,
            });
        }

        // Animation Loop
        const render = () => {
            // Clear with slight fade for trail effect (optional, we use full clear for crispness)
            ctx.clearRect(0, 0, width, height);

            const time = Date.now() * 0.001;

            particles.forEach((p, i) => {
                // Natural Sine Wave Motion
                p.x += Math.sin(time + p.phase) * 0.2 + p.vx;
                p.y += Math.cos(time + p.phase) * 0.2 + p.vy;

                // Wrap around screen
                if (p.x < 0) p.x = width;
                if (p.x > width) p.x = 0;
                if (p.y < 0) p.y = height;
                if (p.y > height) p.y = 0;

                // Mouse Repulsion
                const dx = mouse.current.x - p.x;
                const dy = mouse.current.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const repulsionRadius = 200;

                if (dist < repulsionRadius) {
                    const force = (repulsionRadius - dist) / repulsionRadius;
                    const angle = Math.atan2(dy, dx);
                    p.x -= Math.cos(angle) * force * 2;
                    p.y -= Math.sin(angle) * force * 2;
                }

                // Draw Particle
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(127, 178, 133, ${0.3 + Math.sin(time + p.phase) * 0.2})`; // Pulse opacity
                ctx.fill();

                // Draw Connections
                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const dx2 = p.x - p2.x;
                    const dy2 = p.y - p2.y;
                    const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
                    const connectDistance = 120;

                    if (dist2 < connectDistance) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(127, 178, 133, ${(1 - dist2 / connectDistance) * 0.15})`;
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }
            });
        };

        // Use GSAP Ticker for performance (pauses on tab inactive)
        gsap.ticker.add(render);

        // Resize Handler
        const handleResize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };

        // Mouse Handler
        const handleMouseMove = (e: MouseEvent) => {
            mouse.current.x = e.clientX;
            mouse.current.y = e.clientY;
        };

        window.addEventListener("resize", handleResize);
        window.addEventListener("mousemove", handleMouseMove);

        return () => {
            gsap.ticker.remove(render);
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("mousemove", handleMouseMove);
        };
    }, { scope: containerRef });

    return (
        <div ref={containerRef} className="relative h-screen w-full overflow-hidden bg-[#1a1d21]">
            {/* Canvas Layer */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 pointer-events-none"
            />

            {/* Content Layer */}
            <div className="relative z-10 container mx-auto px-6 h-full flex flex-col justify-center items-center text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: [0.2, 0, 0.2, 1] }} // Stone & Sage ease
                    className="max-w-4xl"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="inline-block mb-6 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium tracking-wide"
                    >
                        The First Thick-Client Chess Platform
                    </motion.div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                        Master Chess.<br />
                        <span className="text-primary">Zero Latency.</span> Zero Cost.
                    </h1>

                    <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
                        We pushed the engine, the AI, and the database directly to your browser.
                        Experience instant analysis without the cloud tax.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link href="/games">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-lg flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                            >
                                Analyze Your Games
                                <ArrowRight className="w-5 h-5" />
                            </motion.button>
                        </Link>

                        <Link href="/pricing">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="px-8 py-4 rounded-xl border border-border bg-card/50 backdrop-blur hover:bg-white/5 transition-colors font-medium"
                            >
                                View Architecture
                            </motion.button>
                        </Link>
                    </div>
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground text-sm"
            >
                <span>Explore the Stack</span>
                <div className="w-px h-12 bg-gradient-to-b from-primary/50 to-transparent" />
            </motion.div>
        </div>
    );
}
