"use client";

import { motion } from "framer-motion";

/**
 * Yellow "Crime Scene" Diagonal Banner with Merry Christmas message
 * Displays at the top of the homepage for non-logged-in users
 */
export function ChristmasBanner() {
    return (
        <div className="fixed top-0 left-0 w-full z-[60] overflow-hidden pointer-events-none">
            {/* Diagonal Crime Scene Tape */}
            <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "0%" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative"
            >
                {/* Main Banner Stripe */}
                <div
                    className="absolute -left-20 top-8 w-[150%] h-10 bg-yellow-400 flex items-center justify-center gap-8 shadow-lg"
                    style={{
                        transform: "rotate(-3deg)",
                        backgroundImage: "repeating-linear-gradient(90deg, #000 0px, #000 20px, transparent 20px, transparent 40px)",
                        backgroundSize: "40px 10px",
                        backgroundPosition: "0 0, 0 100%",
                        backgroundRepeat: "repeat-x",
                    }}
                >
                    {/* Repeating Text */}
                    <motion.div
                        className="flex items-center gap-16 whitespace-nowrap"
                        animate={{ x: [0, -200] }}
                        transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                    >
                        {Array(10).fill(null).map((_, i) => (
                            <span key={i} className="flex items-center gap-4 text-black font-black text-lg tracking-wider">
                                🎄 MERRY CHRISTMAS 🎅 UNDER CONSTRUCTION 🚧 MERRY CHRISTMAS 🎄
                            </span>
                        ))}
                    </motion.div>
                </div>

                {/* Second Stripe (offset) */}
                <div
                    className="absolute -left-20 top-16 w-[150%] h-8 bg-yellow-300 flex items-center justify-center shadow-md"
                    style={{
                        transform: "rotate(-2deg)",
                    }}
                >
                    <motion.div
                        className="flex items-center gap-12 whitespace-nowrap text-black font-bold text-sm"
                        animate={{ x: [-200, 0] }}
                        transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                    >
                        {Array(10).fill(null).map((_, i) => (
                            <span key={i} className="flex items-center gap-4">
                                ⚠️ ACTIVE DEVELOPMENT ⚠️ NEW FEATURES COMING ⚠️
                            </span>
                        ))}
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}
