"use client";

import { cn, formatEval } from "@/lib/utils";

interface EvaluationBarProps {
    evaluation: number | null;
    mate: number | null;
    orientation?: "white" | "black";
    className?: string;
}

export function EvaluationBar({
    evaluation,
    mate,
    orientation = "white",
    className,
}: EvaluationBarProps) {
    // Calculate percentage using sigmoid for smooth mapping
    let whitePercentage = 50;

    if (mate !== null) {
        whitePercentage = mate > 0 ? 98 : 2;
    } else if (evaluation !== null) {
        // Using steeper sigmoid (0.006) for more dramatic bar movement
        // +300cp (3 pawns) = ~86% bar, +500cp = ~95% bar
        const sigmoid = 1 / (1 + Math.exp(-0.006 * evaluation));
        whitePercentage = Math.max(5, Math.min(95, sigmoid * 100));
    }

    const displayPercentage = orientation === "white" ? whitePercentage : 100 - whitePercentage;
    const evalText = formatEval(evaluation, mate);
    const isWhiteWinning = (evaluation !== null && evaluation > 0) || (mate !== null && mate > 0);

    return (
        <div className={cn("flex flex-col items-center gap-3", className)}>
            {/* Evaluation text - Zen styled */}
            <div
                className={cn(
                    "text-xs font-mono font-semibold px-2.5 py-1.5 rounded-lg transition-all duration-500",
                    isWhiteWinning
                        ? "bg-[#f5f3f0] text-[#1a1d21]"
                        : "bg-[#1a1d21] text-[#f5f3f0] border border-[#363b44]"
                )}
            >
                {evalText}
            </div>

            {/* Bar - Zen styled with smooth gradient */}
            <div className="relative w-6 h-[350px] rounded-full overflow-hidden bg-gradient-to-b from-[#1a1d21] to-[#252930] border border-[#363b44]">
                {/* White portion (from bottom) - Sage gradient */}
                <div
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#f5f3f0] to-[#e8e6e3] transition-all duration-500 ease-out"
                    style={{ height: `${displayPercentage}%` }}
                />

                {/* Center equilibrium line */}
                <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-[#7fb285]/50 -translate-y-1/2" />

                {/* Subtle inner shadow */}
                <div className="absolute inset-0 rounded-full shadow-inner pointer-events-none" />
            </div>
        </div>
    );
}
