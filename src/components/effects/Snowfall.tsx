"use client";

import { useEffect, useState } from "react";

interface Snowflake {
    id: number;
    left: number;
    size: number;
    animationDuration: number;
    animationDelay: number;
    opacity: number;
}

/**
 * Light Snowfall Effect using CSS animations for better compatibility
 */
export function Snowfall({ intensity = "light" }: { intensity?: "light" | "medium" | "heavy" }) {
    const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);
    const [mounted, setMounted] = useState(false);

    const flakeCount = intensity === "light" ? 40 : intensity === "medium" ? 80 : 120;

    useEffect(() => {
        setMounted(true);
        const flakes: Snowflake[] = [];
        for (let i = 0; i < flakeCount; i++) {
            flakes.push({
                id: i,
                left: Math.random() * 100,
                size: Math.random() * 6 + 4, // 4-10px
                animationDuration: Math.random() * 10 + 10, // 10-20s
                animationDelay: Math.random() * 10,
                opacity: Math.random() * 0.5 + 0.5, // 0.5-1.0
            });
        }
        setSnowflakes(flakes);
    }, [flakeCount]);

    // Don't render on server
    if (!mounted) return null;

    return (
        <>
            {/* CSS Keyframes */}
            <style jsx global>{`
                @keyframes snowfall {
                    0% {
                        transform: translateY(-20px) translateX(0);
                        opacity: 1;
                    }
                    50% {
                        transform: translateY(50vh) translateX(20px);
                    }
                    100% {
                        transform: translateY(100vh) translateX(-10px);
                        opacity: 0.3;
                    }
                }
            `}</style>

            <div className="fixed inset-0 z-[5] pointer-events-none overflow-hidden">
                {snowflakes.map((flake) => (
                    <div
                        key={flake.id}
                        className="absolute rounded-full bg-white"
                        style={{
                            left: `${flake.left}%`,
                            top: "-20px",
                            width: `${flake.size}px`,
                            height: `${flake.size}px`,
                            opacity: flake.opacity,
                            animation: `snowfall ${flake.animationDuration}s linear ${flake.animationDelay}s infinite`,
                            boxShadow: "0 0 3px rgba(255,255,255,0.8)",
                        }}
                    />
                ))}
            </div>
        </>
    );
}
