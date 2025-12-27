"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronDown, TrendingUp, Users, Sparkles } from "lucide-react";

interface MoveNode {
    san: string;
    uci?: string;
    count?: number;
    winRate?: number;
    drawRate?: number;
    children?: MoveNode[];
}

interface OpeningTreeProps {
    moves: string[];
    onMoveSelect?: (moves: string[], index: number) => void;
    currentMoveIndex?: number;
}

// Sample opening tree data - in production this would come from Lichess API
const OPENING_TREE: Record<string, MoveNode[]> = {
    "": [ // Initial position
        {
            san: "e4", count: 45, winRate: 54, children: [
                {
                    san: "e5", count: 30, winRate: 46, children: [
                        { san: "Nf3", count: 28, winRate: 55 },
                        { san: "Nc3", count: 5, winRate: 52 },
                        { san: "f4", count: 3, winRate: 48 },
                    ]
                },
                {
                    san: "c5", count: 35, winRate: 45, children: [
                        { san: "Nf3", count: 30, winRate: 54 },
                        { san: "Nc3", count: 8, winRate: 52 },
                        { san: "c3", count: 5, winRate: 55 },
                    ]
                },
                { san: "e6", count: 15, winRate: 48 },
                { san: "c6", count: 12, winRate: 47 },
            ]
        },
        {
            san: "d4", count: 40, winRate: 53, children: [
                {
                    san: "d5", count: 25, winRate: 47, children: [
                        { san: "c4", count: 20, winRate: 54 },
                        { san: "Nf3", count: 10, winRate: 52 },
                    ]
                },
                {
                    san: "Nf6", count: 30, winRate: 46, children: [
                        { san: "c4", count: 28, winRate: 53 },
                        { san: "Nf3", count: 5, winRate: 51 },
                    ]
                },
            ]
        },
        { san: "c4", count: 15, winRate: 52 },
        { san: "Nf3", count: 12, winRate: 51 },
    ],
};

function MoveNode({
    node,
    depth,
    path,
    isSelected,
    onSelect
}: {
    node: MoveNode;
    depth: number;
    path: string[];
    isSelected: boolean;
    onSelect: (path: string[]) => void;
}) {
    const [isExpanded, setIsExpanded] = useState(depth < 2);
    const hasChildren = node.children && node.children.length > 0;

    const getWinRateColor = (rate?: number) => {
        if (!rate) return "text-muted-foreground";
        if (rate >= 55) return "text-emerald-400";
        if (rate >= 50) return "text-blue-400";
        if (rate >= 45) return "text-yellow-400";
        return "text-red-400";
    };

    const getPopularityBar = (count?: number) => {
        if (!count) return 0;
        return Math.min((count / 50) * 100, 100);
    };

    return (
        <div className="select-none">
            <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${isSelected
                        ? "bg-primary/20 border border-primary/30"
                        : "hover:bg-secondary/50"
                    }`}
                onClick={() => {
                    onSelect([...path, node.san]);
                    if (hasChildren) setIsExpanded(!isExpanded);
                }}
            >
                {/* Expand/Collapse Icon */}
                <div className="w-4 h-4 flex items-center justify-center">
                    {hasChildren ? (
                        isExpanded ? (
                            <ChevronDown className="w-3 h-3 text-muted-foreground" />
                        ) : (
                            <ChevronRight className="w-3 h-3 text-muted-foreground" />
                        )
                    ) : (
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                    )}
                </div>

                {/* Move SAN */}
                <span className={`font-mono font-medium ${isSelected ? "text-primary" : ""}`}>
                    {node.san}
                </span>

                {/* Stats */}
                <div className="flex items-center gap-3 ml-auto text-xs">
                    {/* Popularity */}
                    {node.count && (
                        <div className="flex items-center gap-1" title={`${node.count}% popularity`}>
                            <Users className="w-3 h-3 text-muted-foreground" />
                            <div className="w-12 h-1.5 bg-secondary rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500/60 rounded-full"
                                    style={{ width: `${getPopularityBar(node.count)}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Win Rate */}
                    {node.winRate && (
                        <div className={`flex items-center gap-1 ${getWinRateColor(node.winRate)}`} title={`${node.winRate}% white wins`}>
                            <TrendingUp className="w-3 h-3" />
                            <span>{node.winRate}%</span>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Children */}
            <AnimatePresence>
                {isExpanded && hasChildren && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="ml-4 border-l border-border/50 pl-2 mt-1 space-y-0.5"
                    >
                        {node.children!.map((child, idx) => (
                            <MoveNode
                                key={`${child.san}-${idx}`}
                                node={child}
                                depth={depth + 1}
                                path={[...path, node.san]}
                                isSelected={false}
                                onSelect={onSelect}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export function OpeningTree({ moves, onMoveSelect, currentMoveIndex = 0 }: OpeningTreeProps) {
    const [selectedPath, setSelectedPath] = useState<string[]>([]);

    const handleMoveSelect = useCallback((path: string[]) => {
        setSelectedPath(path);
        if (onMoveSelect) {
            onMoveSelect(path, path.length);
        }
    }, [onMoveSelect]);

    const rootNodes = OPENING_TREE[""] || [];

    return (
        <div className="bg-card rounded-xl border border-border p-4">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="font-semibold">Opening Explorer</h3>
                <span className="text-xs text-muted-foreground ml-auto">
                    Click moves to explore
                </span>
            </div>

            {/* Current Line Display */}
            {selectedPath.length > 0 && (
                <div className="mb-4 p-2 bg-secondary/30 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Current line:</div>
                    <div className="font-mono text-sm">
                        {selectedPath.map((move, idx) => (
                            <span key={idx}>
                                {idx % 2 === 0 && <span className="text-muted-foreground">{Math.floor(idx / 2) + 1}. </span>}
                                <span className="text-primary">{move}</span>
                                {idx < selectedPath.length - 1 && " "}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Tree */}
            <div className="space-y-0.5 max-h-[400px] overflow-y-auto pr-2">
                {rootNodes.map((node, idx) => (
                    <MoveNode
                        key={`${node.san}-${idx}`}
                        node={node}
                        depth={0}
                        path={[]}
                        isSelected={selectedPath[0] === node.san}
                        onSelect={handleMoveSelect}
                    />
                ))}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-3 border-t border-border flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>Popularity</span>
                </div>
                <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>White Win %</span>
                </div>
            </div>
        </div>
    );
}
