"use client";

import { motion } from "framer-motion";

/**
 * Yellow "Crime Scene" Diagonal Banner with Merry Christmas message
 * Displays at the top of the homepage for non-logged-in users
 */
export function ChristmasBanner() {
    return (
        <div className="fixed top-0 left-0 w-full h-24 z-[60] overflow-hidden pointer-events-none">
            {/* Main Banner Stripe */}
            <motion.div
                initial={{ x: "-100%", opacity: 0 }}
                animate={{ x: "0%", opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="absolute -left-10 top-4 w-[120%] h-10 bg-yellow-400 flex items-center shadow-lg"
                style={{
                    transform: "rotate(-2deg)",
                }}
            >
                {/* Repeating Text - Scrolling */}
                <motion.div
                    className="flex items-center gap-8 whitespace-nowrap"
                    animate={{ x: [0, -500] }}
                    transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                >
                    {Array(15).fill(null).map((_, i) => (
                        <span key={i} className="flex items-center gap-6 text-black font-black text-base tracking-wide">
                            🎄 MERRY CHRISTMAS 🎅 UNDER CONSTRUCTION 🚧
                        </span>
                    ))}
                </motion.div>
            </motion.div>

            {/* Second Stripe (offset) */}
            <motion.div
                initial={{ x: "100%", opacity: 0 }}
                animate={{ x: "0%", opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                className="absolute -left-10 top-12 w-[120%] h-8 bg-yellow-300 flex items-center shadow-md"
                style={{
                    transform: "rotate(-1.5deg)",
                }}
            >
                <motion.div
                    className="flex items-center gap-10 whitespace-nowrap text-black font-bold text-sm"
                    animate={{ x: [-300, 0] }}
                    transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
                >
                    {Array(15).fill(null).map((_, i) => (
                        <span key={i} className="flex items-center gap-4">
                            ⚠️ ACTIVE DEVELOPMENT ⚠️ NEW FEATURES COMING ⚠️
                        </span>
                    ))}
                </motion.div>
            </motion.div>
        </div>
    );
}
