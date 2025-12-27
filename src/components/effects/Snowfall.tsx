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

    const flakeCount = intensity === "light" ? 30 : intensity === "medium" ? 60 : 100;

    useEffect(() => {
        const flakes: Snowflake[] = [];
        for (let i = 0; i < flakeCount; i++) {
            flakes.push({
                id: i,
                x: Math.random() * 100, // percentage across screen
                size: Math.random() * 4 + 2, // 2-6px
                duration: Math.random() * 10 + 10, // 10-20s fall time
                delay: Math.random() * 10, // stagger start
                opacity: Math.random() * 0.6 + 0.2, // 0.2-0.8
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
