"use client";

import { useEffect, useState, useMemo } from "react";

interface Snowflake {
    id: number;
    left: number;
    size: number;
    animationDuration: number;
    animationDelay: number;
    opacity: number;
    isBlizzard?: boolean; // Extra flakes that only appear in blizzard
}

/**
 * Scroll-Aware Snowfall Effect
 * 
 * - Keeps base snowflakes always visible
 * - ADDS extra blizzard flakes during blizzard zone (no regeneration)
 * - Smooth transitions with CSS opacity
 */
export function Snowfall() {
    const [mounted, setMounted] = useState(false);
    const [isBlizzard, setIsBlizzard] = useState(false);

    // Generate snowflakes once - memoized to prevent regeneration
    const baseFlakes = useMemo(() => {
        const flakes: Snowflake[] = [];
        for (let i = 0; i < 40; i++) {
            flakes.push({
                id: i,
                left: Math.random() * 100,
                size: Math.random() * 6 + 4,
                animationDuration: Math.random() * 10 + 10,
                animationDelay: Math.random() * 8,
                opacity: Math.random() * 0.5 + 0.5,
                isBlizzard: false,
            });
        }
        return flakes;
    }, []);

    // Extra blizzard flakes - also memoized
    const blizzardFlakes = useMemo(() => {
        const flakes: Snowflake[] = [];
        for (let i = 40; i < 150; i++) {
            flakes.push({
                id: i,
                left: Math.random() * 100,
                size: Math.random() * 8 + 3,
                animationDuration: Math.random() * 4 + 3,
                animationDelay: Math.random() * 2,
                opacity: Math.random() * 0.3 + 0.7,
                isBlizzard: true,
            });
        }
        return flakes;
    }, []);

    // Scroll listener for blizzard zone
    useEffect(() => {
        setMounted(true);

        const handleScroll = () => {
            const scrollY = window.scrollY;
            const viewportHeight = window.innerHeight;

            const blizzardStart = viewportHeight * 0.8;
            const blizzardEnd = viewportHeight * 5;

            setIsBlizzard(scrollY >= blizzardStart && scrollY <= blizzardEnd);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll();

        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    if (!mounted) return null;

    // Show base flakes always + blizzard flakes when in blizzard zone
    const visibleFlakes = isBlizzard
        ? [...baseFlakes, ...blizzardFlakes]
        : baseFlakes;

    return (
        <>
            <style jsx global>{`
                @keyframes snowfall {
                    0% {
                        transform: translateY(-20px) translateX(0);
                    }
                    25% {
                        transform: translateY(25vh) translateX(15px);
                    }
                    50% {
                        transform: translateY(50vh) translateX(-10px);
                    }
                    75% {
                        transform: translateY(75vh) translateX(20px);
                    }
                    100% {
                        transform: translateY(100vh) translateX(-5px);
                    }
                }
                
                @keyframes blizzard {
                    0% {
                        transform: translateY(-20px) translateX(0) rotate(0deg);
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
                    }
                }
                
                .snowflake {
                    transition: opacity 0.5s ease;
                }
            `}</style>

            <div className="fixed inset-0 z-[5] pointer-events-none overflow-hidden">
                {visibleFlakes.map((flake) => (
                    <div
                        key={flake.id}
                        className="snowflake absolute rounded-full bg-white"
                        style={{
                            left: `${flake.left}%`,
                            top: "-20px",
                            width: `${flake.size}px`,
                            height: `${flake.size}px`,
                            opacity: flake.opacity,
                            animation: `${flake.isBlizzard ? "blizzard" : "snowfall"} ${flake.animationDuration}s linear ${flake.animationDelay}s infinite`,
                            boxShadow: flake.isBlizzard
                                ? "0 0 6px rgba(255,255,255,1)"
                                : "0 0 3px rgba(255,255,255,0.8)",
                        }}
                    />
                ))}
            </div>
        </>
    );
}
