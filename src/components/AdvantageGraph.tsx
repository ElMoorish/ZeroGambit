"use client";

import { useMemo } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from "recharts";
import { cpToWinProbability } from "@/lib/utils";

interface MoveEvaluation {
    moveNumber: number;
    ply: number;
    move: string;
    evaluation: number | null; // centipawns
    mate: number | null;
    classification?: string;
}

interface AdvantageGraphProps {
    evaluations: MoveEvaluation[];
    currentPly: number;
    onPlySelect: (ply: number) => void;
}

export function AdvantageGraph({
    evaluations,
    currentPly,
    onPlySelect,
}: AdvantageGraphProps) {
    // Transform data for the chart
    const chartData = useMemo(() => {
        return evaluations.map((eval_) => {
            let value = 0;

            if (eval_.mate !== null) {
                // Mate scores: positive = white winning, cap at ±100 for display
                value = eval_.mate > 0 ? 100 : -100;
            } else if (eval_.evaluation !== null) {
                // Convert centipawns to win probability (-50 to 50 range)
                value = cpToWinProbability(eval_.evaluation) - 50;
            }

            return {
                ply: eval_.ply,
                moveNumber: eval_.moveNumber,
                move: eval_.move,
                value,
                evaluation: eval_.evaluation,
                mate: eval_.mate,
                classification: eval_.classification,
                isWhiteMove: eval_.ply % 2 === 1,
            };
        });
    }, [evaluations]);

    // Custom tooltip
    const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: typeof chartData[0] }[] }) => {
        if (!active || !payload || !payload.length) return null;

        const data = payload[0].payload;
        const evalText = data.mate !== null
            ? `M${data.mate}`
            : data.evaluation !== null
                ? `${(data.evaluation / 100).toFixed(2)}`
                : "0.00";

        return (
            <div className="bg-card border border-border rounded-lg p-3 shadow-xl">
                <p className="font-semibold">
                    {data.moveNumber}. {!data.isWhiteMove && "..."}{data.move}
                </p>
                <p className="text-sm text-muted-foreground">
                    Eval: <span className={data.value > 0 ? "text-white" : "text-zinc-400"}>{evalText}</span>
                </p>
                {data.classification && data.classification !== "normal" && (
                    <p className="text-sm capitalize" style={{ color: getClassificationColor(data.classification) }}>
                        {data.classification}
                    </p>
                )}
            </div>
        );
    };

    return (
        <div className="w-full h-32 bg-card rounded-xl border border-border p-2">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={chartData}
                    margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    onClick={(e: any) => {
                        if (e?.activePayload?.[0]) {
                            onPlySelect(e.activePayload[0].payload.ply);
                        }
                    }}
                >
                    <defs>
                        <linearGradient id="whiteGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ffffff" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="blackGradient" x1="0" y1="1" x2="0" y2="0">
                            <stop offset="0%" stopColor="#18181b" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#18181b" stopOpacity={0} />
                        </linearGradient>
                    </defs>

                    <XAxis dataKey="ply" hide />
                    <YAxis domain={[-60, 60]} hide />

                    {/* Center reference line */}
                    <ReferenceLine y={0} stroke="#3f3f46" strokeWidth={1} />

                    {/* Current position marker */}
                    <ReferenceLine
                        x={currentPly}
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                    />

                    <Tooltip content={<CustomTooltip />} />

                    {/* White advantage area (above 0) */}
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#ffffff"
                        strokeWidth={2}
                        fill="url(#whiteGradient)"
                        fillOpacity={1}
                        isAnimationActive={false}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

function getClassificationColor(classification: string): string {
    const colors: Record<string, string> = {
        brilliant: "#22d3ee",
        great: "#3b82f6",
        best: "#22c55e",
        excellent: "#86efac",
        inaccuracy: "#eab308",
        mistake: "#f97316",
        blunder: "#ef4444",
    };
    return colors[classification] || "#71717a";
}
