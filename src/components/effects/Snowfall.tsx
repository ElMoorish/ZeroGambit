"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Snowflake {
    id: number;
    x: number;
    size: number;
    duration: number;
    delay: number;
    opacity: number;
}

/**
 * Light Snowfall Effect
 * Creates a gentle, performant snow animation overlay
 */
export function Snowfall({ intensity = "light" }: { intensity?: "light" | "medium" | "heavy" }) {
    const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);

    // Increased flake counts for better visibility
    const flakeCount = intensity === "light" ? 50 : intensity === "medium" ? 100 : 150;

    useEffect(() => {
        const flakes: Snowflake[] = [];
        for (let i = 0; i < flakeCount; i++) {
            flakes.push({
                id: i,
                x: Math.random() * 100, // percentage across screen
                size: Math.random() * 6 + 4, // 4-10px (larger)
                duration: Math.random() * 8 + 8, // 8-16s fall time (faster)
                delay: Math.random() * 5, // less stagger
                opacity: Math.random() * 0.4 + 0.6, // 0.6-1.0 (brighter)
            });
        }
        setSnowflakes(flakes);
    }, [flakeCount]);

    return (
        <div className="fixed inset-0 z-[5] pointer-events-none overflow-hidden">
            {snowflakes.map((flake) => (
                <motion.div
                    key={flake.id}
                    className="absolute rounded-full bg-white"
                    style={{
                        left: `${flake.x}%`,
                        width: flake.size,
                        height: flake.size,
                        opacity: flake.opacity,
                        filter: "blur(0.5px)",
                    }}
                    initial={{ y: -20 }}
                    animate={{
                        y: "110vh",
                        x: [0, 15, -15, 10, -10, 0], // gentle sway
                    }}
                    transition={{
                        y: {
                            duration: flake.duration,
                            repeat: Infinity,
                            ease: "linear",
                            delay: flake.delay,
                        },
                        x: {
                            duration: flake.duration / 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: flake.delay,
                        },
                    }}
                />
            ))}
        </div>
    );
}
