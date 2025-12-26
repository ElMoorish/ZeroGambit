"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface LiquidLoaderProps {
    status: string;
}

export function LiquidLoader({ status }: LiquidLoaderProps) {
    const [progress, setProgress] = useState(0);

    // Simulate progress from 0 to 95% over ~60 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => {
                // Fast start, slow middle, very slow end
                if (prev < 30) return prev + 1;
                if (prev < 60) return prev + 0.5;
                if (prev < 90) return prev + 0.2;
                if (prev < 95) return prev + 0.05;
                return prev;
            });
        }, 500);

        return () => clearInterval(interval);
    }, []);

    // Wave SVG path
    const wavePath = "M0,60 C150,60 150,30 300,30 C450,30 450,60 600,60 L600,150 L0,150 Z";

    return (
        <div className="flex flex-col items-center justify-center space-y-8 py-10">
            {/* The "Jar" / Liquid Container */}
            <div className="relative w-48 h-48 rounded-full border-4 border-secondary/50 overflow-hidden bg-secondary/10 shadow-[0_0_40px_rgba(16,185,129,0.2)]">

                {/* Liquid Fill */}
                <motion.div
                    className="absolute bottom-0 left-0 right-0 bg-emerald-500/80 backdrop-blur-sm mx-auto"
                    initial={{ height: "0%" }}
                    animate={{ height: `${progress}%` }}
                    transition={{ ease: "easeInOut", duration: 0.5 }}
                    style={{ width: "200%", x: "-50%" }} // Wider to allow wave movement
                >
                    {/* The Wave Surface */}
                    <div className="absolute -top-6 left-0 w-full h-12 overflow-hidden">
                        <motion.div
                            animate={{ x: ["0%", "-50%"] }}
                            transition={{ repeat: Infinity, ease: "linear", duration: 3 }}
                            className="w-[200%] h-full flex"
                        >
                            {/* SVG Wave Shape repeated */}
                            <svg viewBox="0 0 600 150" className="w-full h-full text-emerald-500/80 fill-current" preserveAspectRatio="none">
                                <path d={wavePath} />
                            </svg>
                            <svg viewBox="0 0 600 150" className="w-full h-full text-emerald-500/80 fill-current" preserveAspectRatio="none">
                                <path d={wavePath} />
                            </svg>
                        </motion.div>
                    </div>
                </motion.div>

                {/* Percentage Text */}
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <span className="text-4xl font-bold text-white drop-shadow-md">
                        {Math.round(progress)}%
                    </span>
                </div>
            </div>

            {/* Status Text with typing effect or pulse */}
            <div className="text-center space-y-2 max-w-md">
                <h3 className="text-xl font-medium text-primary animate-pulse">
                    Crafting Viral Magic...
                </h3>
                <p className="text-sm text-muted-foreground">
                    {status}
                </p>
            </div>
        </div>
    );
}
