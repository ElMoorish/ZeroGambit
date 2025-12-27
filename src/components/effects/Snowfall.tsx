"use client";

import { useEffect, useState, useRef } from "react";

interface Snowflake {
    id: number;
    left: number;
    size: number;
    animationDuration: number;
    animationDelay: number;
    opacity: number;
}

/**
 * Scroll-Aware Snowfall Effect
 * 
 * - Light snow normally
 * - BLIZZARD during LocalFirstExplainer section
 * - Back to light after HeroConverter
 */
export function Snowfall({ intensity = "light" }: { intensity?: "light" | "medium" | "heavy" }) {
    const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);
    const [mounted, setMounted] = useState(false);
    const [currentIntensity, setCurrentIntensity] = useState<"light" | "medium" | "heavy">(intensity);

    // Scroll listener for blizzard zone
    useEffect(() => {
        setMounted(true);

        const handleScroll = () => {
            const scrollY = window.scrollY;
            const viewportHeight = window.innerHeight;

            // Blizzard zone: from LocalFirstExplainer to just before HeroConverter
            const blizzardStart = viewportHeight * 0.8;
            const blizzardEnd = viewportHeight * 5; // Extended to reach From Data to Drama

            if (scrollY >= blizzardStart && scrollY <= blizzardEnd) {
                setCurrentIntensity("heavy");
            } else {
                setCurrentIntensity("light");
            }
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll(); // Initial check

        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Generate snowflakes based on current intensity
    useEffect(() => {
        const flakeCount = currentIntensity === "light" ? 40
            : currentIntensity === "medium" ? 80
                : 150; // BLIZZARD!

        const flakes: Snowflake[] = [];
        for (let i = 0; i < flakeCount; i++) {
            flakes.push({
                id: i,
                left: Math.random() * 100,
                size: currentIntensity === "heavy"
                    ? Math.random() * 8 + 3 // 3-11px in blizzard
                    : Math.random() * 6 + 4, // 4-10px normally
                animationDuration: currentIntensity === "heavy"
                    ? Math.random() * 4 + 3 // 3-7s (FAST in blizzard)
                    : Math.random() * 10 + 10, // 10-20s normally
                animationDelay: Math.random() * 3,
                opacity: currentIntensity === "heavy"
                    ? Math.random() * 0.3 + 0.7 // 0.7-1.0 (very visible)
                    : Math.random() * 0.5 + 0.5, // 0.5-1.0
            });
        }
        setSnowflakes(flakes);
    }, [currentIntensity]);

    // Don't render on server
    if (!mounted) return null;

    // Dynamic animation based on intensity
    const swayAmount = currentIntensity === "heavy" ? "40px" : "20px";
    const windDirection = currentIntensity === "heavy" ? "-30px" : "0px";

    return (
        <>
            {/* CSS Keyframes - Dynamic based on intensity */}
            <style jsx global>{`
                @keyframes snowfall {
                    0% {
                        transform: translateY(-20px) translateX(0);
                        opacity: 1;
                    }
                    25% {
                        transform: translateY(25vh) translateX(${swayAmount});
                    }
                    50% {
                        transform: translateY(50vh) translateX(${windDirection});
                    }
                    75% {
                        transform: translateY(75vh) translateX(${swayAmount});
                    }
                    100% {
                        transform: translateY(100vh) translateX(${windDirection});
                        opacity: 0.3;
                    }
                }
                
                @keyframes blizzard {
                    0% {
                        transform: translateY(-20px) translateX(0) rotate(0deg);
                        opacity: 1;
                    }
                    25% {
                        transform: translateY(20vh) translateX(-40px) rotate(90deg);
                    }
                    50% {
                        transform: translateY(45vh) translateX(30px) rotate(180deg);
                    }
                    75% {
                        transform: translateY(70vh) translateX(-50px) rotate(270deg);
                    }
                    100% {
                        transform: translateY(100vh) translateX(20px) rotate(360deg);
                        opacity: 0.5;
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
                            animation: `${currentIntensity === "heavy" ? "blizzard" : "snowfall"} ${flake.animationDuration}s linear ${flake.animationDelay}s infinite`,
                            boxShadow: currentIntensity === "heavy"
                                ? "0 0 6px rgba(255,255,255,1)"
                                : "0 0 3px rgba(255,255,255,0.8)",
                        }}
                    />
                ))}
            </div>
        </>
    );
}
