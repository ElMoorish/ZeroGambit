"use client";

import { motion } from "framer-motion";

/**
 * The Manifesto - The "Why" Section
 * 
 * Serif font, text-only, philosophical.
 * "People buy why you do it."
 */

export function Manifesto() {
    return (
        <section className="py-24 bg-[#1a1d21]">
            <div className="container mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: [0.2, 0, 0.2, 1] }}
                    className="max-w-2xl mx-auto text-center"
                >
                    <blockquote className="text-xl md:text-2xl leading-relaxed font-serif italic text-foreground/90 space-y-6">
                        <p className="text-muted-foreground">
                            The cloud is noisy. Servers lag. Algorithms distract.
                        </p>
                        <p>
                            <span className="text-foreground">ZeroGambit is different.</span>
                            <br />
                            We run on <span className="text-primary">your metal</span>.
                            We keep <span className="text-primary">your secrets</span>.
                        </p>
                        <p className="text-muted-foreground">
                            No ads. No tracking. Just you, the stone, and the sage.
                        </p>
                    </blockquote>

                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 }}
                        className="mt-12 text-lg font-medium text-primary"
                    >
                        Welcome to the quietest place on the internet.
                    </motion.p>

                    {/* Decorative line */}
                    <div className="mt-8 flex items-center justify-center gap-4">
                        <div className="h-px w-16 bg-gradient-to-r from-transparent to-border" />
                        <div className="w-2 h-2 rounded-full bg-primary/50" />
                        <div className="h-px w-16 bg-gradient-to-l from-transparent to-border" />
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
