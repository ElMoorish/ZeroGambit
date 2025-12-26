"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Lightbulb, AlertTriangle, Trophy, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

interface CoachMessage {
    id: string;
    ply: number;
    type: "info" | "tip" | "warning" | "praise" | "insight";
    title: string;
    message: string;
    move?: string;
    bestMove?: string;
}

interface CoachSidebarProps {
    messages: CoachMessage[];
    currentPly: number;
    onMessageClick?: (ply: number) => void;
}

const iconMap = {
    info: <MessageSquare className="w-5 h-5" />,
    tip: <Lightbulb className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    praise: <Trophy className="w-5 h-5" />,
    insight: <Brain className="w-5 h-5" />,
};

const colorMap = {
    info: "border-blue-500/50 bg-blue-500/10",
    tip: "border-green-500/50 bg-green-500/10",
    warning: "border-red-500/50 bg-red-500/10",
    praise: "border-yellow-500/50 bg-yellow-500/10",
    insight: "border-purple-500/50 bg-purple-500/10",
};

const iconColorMap = {
    info: "text-blue-400",
    tip: "text-green-400",
    warning: "text-red-400",
    praise: "text-yellow-400",
    insight: "text-purple-400",
};

export function CoachSidebar({
    messages,
    currentPly,
    onMessageClick,
}: CoachSidebarProps) {
    // Show all messages (no filtering by ply)
    const visibleMessages = messages;

    return (
        <div className="h-full flex flex-col bg-card rounded-2xl border border-border overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-border bg-card/80 backdrop-blur">
                <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-primary" />
                    <h2 className="font-semibold">Silicon Coach</h2>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    Human-like analysis and insights
                </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <AnimatePresence mode="popLayout">
                    {visibleMessages.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center text-muted-foreground py-8"
                        >
                            <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>Click "Analyser la partie" to get AI insights</p>
                        </motion.div>
                    ) : (
                        visibleMessages.map((msg, index) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => onMessageClick?.(msg.ply)}
                                className={cn(
                                    "coach-message p-4 rounded-xl border-l-4 cursor-pointer transition-all hover:scale-[1.02]",
                                    colorMap[msg.type],
                                    msg.ply === currentPly && "ring-2 ring-primary/50"
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={cn("mt-0.5", iconColorMap[msg.type])}>
                                        {iconMap[msg.type]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <h3 className="font-semibold text-sm">{msg.title}</h3>
                                            {msg.move && (
                                                <span className="text-xs font-mono bg-background/50 px-2 py-0.5 rounded">
                                                    {msg.move}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-foreground/80 leading-relaxed">
                                            {msg.message}
                                        </p>
                                        {msg.bestMove && (
                                            <div className="mt-2 flex items-center gap-2 text-xs">
                                                <span className="text-muted-foreground">Better:</span>
                                                <span className="font-mono text-green-400">{msg.bestMove}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Stats footer */}
            <div className="px-4 py-3 border-t border-border bg-card/80 backdrop-blur">
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                        {visibleMessages.filter((m) => m.type === "warning").length} issues found
                    </span>
                    <span>
                        {visibleMessages.filter((m) => m.type === "praise").length} great moves
                    </span>
                </div>
            </div>
        </div>
    );
}
