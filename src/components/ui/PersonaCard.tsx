"use client";

import { useRef, useState } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { Shield, Sword } from "lucide-react";

/**
 * PersonaCard - 3D Tilt Card with Icon Morph
 * 
 * Shows different AI "Grandmaster Personalities" (Attacker vs Defender)
 * with smooth 3D tilt on mouse and icon transition on hover.
 */

interface PersonaCardProps {
    persona: "attacker" | "defender";
    title: string;
    description: string;
    onClick?: () => void;
}

export function PersonaCard({
    persona,
    title,
    description,
    onClick,
}: PersonaCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    // Motion values for mouse tracking
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Transform mouse position to rotation
    const rotateX = useTransform(mouseY, [-0.5, 0.5], [15, -15]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], [-15, 15]);

    // Spring physics for smooth motion
    const springRotateX = useSpring(rotateX, { stiffness: 150, damping: 20 });
    const springRotateY = useSpring(rotateY, { stiffness: 150, damping: 20 });

    // Glare position
    const glareX = useTransform(mouseX, [-0.5, 0.5], ["0%", "100%"]);
    const glareY = useTransform(mouseY, [-0.5, 0.5], ["0%", "100%"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Normalize to -0.5 to 0.5
        mouseX.set((e.clientX - centerX) / rect.width);
        mouseY.set((e.clientY - centerY) / rect.height);
    };

    const handleMouseLeave = () => {
        mouseX.set(0);
        mouseY.set(0);
        setIsHovered(false);
    };

    const Icon = persona === "attacker" ? Sword : Shield;
    const accentColor = persona === "attacker" ? "text-red-400" : "text-blue-400";
    const bgGradient = persona === "attacker"
        ? "from-red-500/10 to-orange-500/10"
        : "from-blue-500/10 to-cyan-500/10";
    const borderColor = persona === "attacker"
        ? "border-red-500/20"
        : "border-blue-500/20";

    return (
        <motion.div
            ref={cardRef}
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
            style={{
                rotateX: springRotateX,
                rotateY: springRotateY,
                transformStyle: "preserve-3d",
                willChange: "transform",
            }}
            className={`relative p-6 rounded-2xl border ${borderColor} bg-gradient-to-br ${bgGradient} backdrop-blur-sm cursor-pointer overflow-hidden`}
        >
            {/* Glare Effect */}
            <motion.div
                className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100"
                style={{
                    background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.15) 0%, transparent 50%)`,
                    opacity: isHovered ? 0.3 : 0,
                }}
            />

            {/* Content */}
            <div className="relative z-10" style={{ transform: "translateZ(50px)" }}>
                <motion.div
                    animate={{ rotate: isHovered ? 360 : 0 }}
                    transition={{ duration: 0.5, ease: [0.2, 0, 0.2, 1] }}
                    className={`inline-flex p-3 rounded-xl bg-white/5 mb-4 ${accentColor}`}
                >
                    <Icon className="w-6 h-6" />
                </motion.div>

                <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-white/60">{description}</p>
            </div>

            {/* Hover Indicator */}
            <motion.div
                className="absolute bottom-0 left-0 right-0 h-1"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: isHovered ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                style={{
                    background: persona === "attacker"
                        ? "linear-gradient(to right, #ef4444, #f97316)"
                        : "linear-gradient(to right, #3b82f6, #06b6d4)",
                    transformOrigin: "left",
                }}
            />
        </motion.div>
    );
}

/**
 * Usage:
 * 
 * <PersonaCard
 *   persona="attacker"
 *   title="The Aggressor"
 *   description="Finds sacrifices and tactical shots"
 *   onClick={() => setCoachStyle("attacker")}
 * />
 */
