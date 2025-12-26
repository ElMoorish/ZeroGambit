"use client";

import { useRef, useEffect, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface Move {
    ply: number;
    san: string;
    classification?: string;
}

interface MoveListProps {
    moves: Move[];
    currentPly: number;
    onPlySelect: (ply: number) => void;
}

// Zen color palette for move classifications
const MOVE_COLORS: Record<string, string> = {
    brilliant: "#98d4a8",
    great: "#8ec3d4",
    best: "#7fb285",
    excellent: "#a8c9a0",
    good: "#b4c4be",
    book: "#a88865",
    inaccuracy: "#d4a574",
    mistake: "#c9a078",
    miss: "#c9a078",
    blunder: "#c97b84",
    normal: "#6b7280",
};

const MOVE_SYMBOLS: Record<string, string> = {
    brilliant: "!!",
    great: "!",
    best: "",
    excellent: "",
    good: "",
    book: "📖",
    inaccuracy: "?!",
    mistake: "?",
    blunder: "??",
    normal: "",
};

export function MoveList({ moves, currentPly, onPlySelect }: MoveListProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to active move
    useEffect(() => {
        if (scrollRef.current) {
            const container = scrollRef.current;
            // Find the active element using data attribute - guaranteed to be the correct DOM node
            const element = container.querySelector('[data-active="true"]') as HTMLElement;

            if (element) {
                const containerRect = container.getBoundingClientRect();
                const elementRect = element.getBoundingClientRect();

                // Calculate position relative to container's visible area
                const relativeTop = elementRect.top - containerRect.top;

                // Calculate target scroll position to center the element
                const targetScrollTop = container.scrollTop + relativeTop - (container.clientHeight / 2) + (element.clientHeight / 2);

                container.scrollTo({
                    top: targetScrollTop,
                    behavior: "smooth",
                });
            }
        }
    }, [currentPly]);

    // Group moves by pairs
    const movePairs: { moveNumber: number; white?: Move; black?: Move }[] = [];
    moves.forEach((move) => {
        const moveNumber = Math.ceil(move.ply / 2);
        const isWhite = move.ply % 2 === 1;
        let pair = movePairs.find((p) => p.moveNumber === moveNumber);
        if (!pair) {
            pair = { moveNumber };
            movePairs.push(pair);
        }
        if (isWhite) pair.white = move;
        else pair.black = move;
    });

    return (
        <div className="h-full bg-card rounded-2xl border border-border overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-border/50 bg-card/80 backdrop-blur">
                <h3 className="font-medium text-sm text-foreground/80">Moves</h3>
            </div>

            {/* Scrollable move list */}
            <div
                ref={scrollRef}
                className="h-[calc(100%-48px)] overflow-y-auto p-2 space-y-0.5 scroll-smooth"
            >
                {movePairs.map((pair) => (
                    <div
                        key={pair.moveNumber}
                        className="flex items-center gap-1 py-0.5"
                    >
                        {/* Move number */}
                        <span className="w-8 text-right text-xs text-muted-foreground font-mono pr-1">
                            {pair.moveNumber}.
                        </span>

                        {/* White's move */}
                        <div className="flex-1">
                            {pair.white && (
                                <MoveButton
                                    move={pair.white}
                                    isActive={currentPly === pair.white.ply}
                                    onClick={() => onPlySelect(pair.white!.ply)}
                                />
                            )}
                        </div>

                        {/* Black's move */}
                        <div className="flex-1">
                            {pair.black && (
                                <MoveButton
                                    move={pair.black}
                                    isActive={currentPly === pair.black.ply}
                                    onClick={() => onPlySelect(pair.black!.ply)}
                                />
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

interface MoveButtonProps {
    move: Move;
    isActive: boolean;
    onClick: () => void;
    ref?: React.Ref<HTMLButtonElement>;
}

const MoveButton = forwardRef<HTMLButtonElement, Omit<MoveButtonProps, "ref">>(({ move, isActive, onClick }, ref) => {
    const classification = move.classification || "normal";
    const color = MOVE_COLORS[classification] || MOVE_COLORS.normal;
    const symbol = MOVE_SYMBOLS[classification] || "";

    return (
        <motion.button
            ref={ref}
            onClick={onClick}
            data-active={isActive ? "true" : undefined}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
                "w-full text-left px-2 py-1.5 rounded-lg font-mono text-sm transition-all duration-200",
                isActive
                    ? "bg-primary/20 text-foreground ring-1 ring-primary/40"
                    : "hover:bg-secondary/50"
            )}
            style={{
                color: isActive ? undefined : color,
            }}
        >
            <span>{move.san}</span>
            {symbol && (
                <span className="ml-0.5 opacity-70">{symbol}</span>
            )}
        </motion.button>
    );
});
MoveButton.displayName = "MoveButton";
