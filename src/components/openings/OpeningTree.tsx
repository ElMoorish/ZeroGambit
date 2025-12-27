"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronDown, TrendingUp, Users, Sparkles, Loader2, Database } from "lucide-react";
import { fetchLichessStats, LichessExplorerResponse } from "@/lib/lichessApi";
import { Chess } from "chess.js";

interface MoveNode {
    san: string;
    uci?: string;
    count?: number;
    winRate?: number; // White win rate
    drawRate?: number;
    blackWinRate?: number;
    averageRating?: number;
}

interface OpeningTreeProps {
    moves: string[]; // Current moves in the game
    onMoveSelect?: (moves: string[], index: number) => void;
    currentMoveIndex?: number;
}

function MoveRow({
    node,
    onSelect
}: {
    node: MoveNode;
    onSelect: (san: string) => void;
}) {
    const total = node.count || 0;
    // Calculate percentages relative to this node's total
    const whitePct = node.winRate || 0;
    const drawPct = node.drawRate || 0;
    const blackPct = node.blackWinRate || 0;

    return (
        <motion.div
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            className="group flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors"
            onClick={() => onSelect(node.san)}
        >
            <div className="w-16 font-mono font-medium text-primary group-hover:underline decoration-primary/50 underline-offset-4">
                {node.san}
            </div>

            <div className="flex-1 flex flex-col gap-1">
                {/* Progress Bar */}
                <div className="h-2 w-full flex rounded-full overflow-hidden bg-secondary/50">
                    <div className="bg-emerald-400/80" style={{ width: `${whitePct}%` }} title={`White: ${whitePct}%`} />
                    <div className="bg-gray-400/50" style={{ width: `${drawPct}%` }} title={`Draw: ${drawPct}%`} />
                    <div className="bg-red-400/80" style={{ width: `${blackPct}%` }} title={`Black: ${blackPct}%`} />
                </div>
            </div>

            <div className="w-24 text-right text-xs text-muted-foreground flex flex-col">
                <span className="font-medium text-foreground">{(total / 1000).toFixed(1)}k</span>
                <span>games</span>
            </div>

            <div className="w-12 text-right text-xs font-medium">
                <span className="text-emerald-500">{whitePct}%</span>
            </div>
        </motion.div>
    );
}

export function OpeningTree({ moves, onMoveSelect }: OpeningTreeProps) {
    const [stats, setStats] = useState<LichessExplorerResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [fen, setFen] = useState("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");

    // Compute FEN from moves
    useEffect(() => {
        const chess = new Chess();
        for (const move of moves) {
            try {
                chess.move(move);
            } catch {
                break;
            }
        }
        setFen(chess.fen());
    }, [moves]);

    // Fetch stats when FEN changes
    useEffect(() => {
        let isMounted = true;

        async function loadStats() {
            setIsLoading(true);
            const data = await fetchLichessStats(fen);
            if (isMounted) {
                setStats(data);
                setIsLoading(false);
            }
        }

        loadStats();

        return () => {
            isMounted = false;
        };
    }, [fen]);

    const handleMoveSelect = useCallback((san: string) => {
        if (onMoveSelect) {
            onMoveSelect([...moves, san], moves.length + 1);
        }
    }, [moves, onMoveSelect]);

    const moveNodes: MoveNode[] = stats?.moves.map(m => {
        const total = m.white + m.draws + m.black;
        return {
            san: m.san,
            uci: m.uci,
            count: total,
            winRate: Math.round((m.white / total) * 100),
            drawRate: Math.round((m.draws / total) * 100),
            blackWinRate: Math.round((m.black / total) * 100),
            averageRating: m.averageRating
        };
    }) || [];

    return (
        <div className="bg-card rounded-xl border border-border flex flex-col h-[500px]">
            {/* Header */}
            <div className="flex items-center gap-2 p-4 border-b border-border bg-card/50 backdrop-blur-sm z-10 rounded-t-xl">
                <Database className="w-4 h-4 text-primary" />
                <h3 className="font-semibold">Lichess Database</h3>
                <span className="text-xs text-muted-foreground ml-auto">
                    {stats ? `${(stats.white + stats.draws + stats.black).toLocaleString()} games` : "Loading..."}
                </span>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-secondary">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        <span className="text-sm">Loading stats...</span>
                    </div>
                ) : moveNodes.length > 0 ? (
                    <div className="space-y-0.5">
                        {moveNodes.map((node) => (
                            <MoveRow
                                key={node.san}
                                node={node}
                                onSelect={handleMoveSelect}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                        <Database className="w-8 h-8 opacity-20" />
                        <span className="text-sm">No games found in this position</span>
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="p-3 border-t border-border bg-secondary/20 text-xs text-muted-foreground flex justify-between px-6 rounded-b-xl">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>White Wins</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                    <span>Draw</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <span>Black Wins</span>
                </div>
            </div>
        </div>
    );
}
