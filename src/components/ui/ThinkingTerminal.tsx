"use client";

import { useRef, useEffect, useCallback } from "react";
import gsap from "gsap";

/**
 * ThinkingTerminal - AI "thinking" text scramble effect
 * 
 * Displays random characters that resolve to the final text,
 * simulating the AI decoding/processing the position.
 */

interface ThinkingTerminalProps {
    text: string;
    isThinking?: boolean;
    duration?: number;
    className?: string;
}

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#@$%&*";

function getRandomChar(): string {
    return CHARS[Math.floor(Math.random() * CHARS.length)];
}

function scrambleText(original: string, progress: number): string {
    const chars = original.split("");
    const resolvedCount = Math.floor(progress * chars.length);

    return chars.map((char, i) => {
        if (char === " ") return " ";
        if (i < resolvedCount) return char;
        return getRandomChar();
    }).join("");
}

export function ThinkingTerminal({
    text,
    isThinking = false,
    duration = 2,
    className = "",
}: ThinkingTerminalProps) {
    const textRef = useRef<HTMLSpanElement>(null);
    const tweenRef = useRef<gsap.core.Tween | null>(null);

    const animate = useCallback(() => {
        if (!textRef.current) return;

        // Kill any existing animation
        if (tweenRef.current) {
            tweenRef.current.kill();
        }

        const progress = { value: 0 };

        tweenRef.current = gsap.to(progress, {
            value: 1,
            duration,
            ease: "power2.out",
            onUpdate: () => {
                if (textRef.current) {
                    textRef.current.innerText = scrambleText(text, progress.value);
                }
            },
            onComplete: () => {
                if (textRef.current) {
                    textRef.current.innerText = text;
                }
            },
        });
    }, [text, duration]);

    useEffect(() => {
        if (isThinking) {
            // Start with fully scrambled
            if (textRef.current) {
                textRef.current.innerText = scrambleText(text, 0);
            }
        } else {
            // Animate to resolved text
            animate();
        }

        return () => {
            if (tweenRef.current) {
                tweenRef.current.kill();
            }
        };
    }, [isThinking, text, animate]);

    // Also animate on mount
    useEffect(() => {
        animate();
    }, [animate]);

    return (
        <span
            ref={textRef}
            className={`font-mono ${className}`}
            style={{
                fontVariantNumeric: "tabular-nums",
            }}
        >
            {text}
        </span>
    );
}

/**
 * Usage Example:
 * 
 * <ThinkingTerminal
 *   text="Calculating best move..."
 *   isThinking={isAnalyzing}
 *   duration={1.5}
 *   className="text-primary"
 * />
 */
