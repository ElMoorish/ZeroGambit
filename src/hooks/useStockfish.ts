"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface AnalysisResult {
    depth: number;
    score: { type: "cp" | "mate"; value: number };
    pv: string[];
    bestMove: string;
}

export function useStockfish(options: { depth?: number } = {}) {
    const { depth = 20 } = options;

    const workerRef = useRef<Worker | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
    const analysisResolveRef = useRef<((result: AnalysisResult) => void) | null>(null);
    const currentAnalysisRef = useRef<AnalysisResult | null>(null);

    // Initialize Stockfish
    useEffect(() => {
        if (typeof window === "undefined") return;

        let worker: Worker | null = null;

        const initEngine = () => {
            try {
                // Create inline worker that loads stockfish from CDN
                const workerCode = `
          importScripts('https://unpkg.com/stockfish.js@10.0.2/stockfish.js');
        `;
                const blob = new Blob([workerCode], { type: 'application/javascript' });
                worker = new Worker(URL.createObjectURL(blob));

                worker.onmessage = (e: MessageEvent<string>) => {
                    const message = e.data;

                    if (message === "uciok") {
                        console.log("[Stockfish] UCI initialized");
                        worker?.postMessage("isready");
                    } else if (message === "readyok") {
                        console.log("[Stockfish] Engine ready");
                        setIsReady(true);
                    } else if (message.startsWith("info depth")) {
                        const parsed = parseInfoString(message);
                        if (parsed) {
                            currentAnalysisRef.current = parsed;
                            setCurrentAnalysis(parsed);
                        }
                    } else if (message.startsWith("bestmove")) {
                        const parts = message.split(" ");
                        const bestMove = parts[1];

                        setIsAnalyzing(false);

                        if (currentAnalysisRef.current && analysisResolveRef.current) {
                            analysisResolveRef.current({
                                ...currentAnalysisRef.current,
                                bestMove,
                            });
                            analysisResolveRef.current = null;
                        }
                    }
                };

                worker.onerror = (error) => {
                    console.error("Stockfish error:", error);
                    // Fallback: set as ready but with limited functionality
                    setIsReady(true);
                };

                // Initialize UCI protocol
                worker.postMessage("uci");
                workerRef.current = worker;
            } catch (error) {
                console.error("Failed to initialize Stockfish:", error);
                // Still set as ready so UI can function
                setIsReady(true);
            }
        };

        initEngine();

        return () => {
            if (worker) {
                worker.terminate();
            }
        };
    }, []);

    // Parse UCI info string
    const parseInfoString = (info: string): AnalysisResult | null => {
        const depthMatch = info.match(/depth (\d+)/);
        const scoreMatch = info.match(/score (cp|mate) (-?\d+)/);
        const pvMatch = info.match(/pv (.+?)(?:$| bmc)/);

        if (!depthMatch || !scoreMatch) return null;

        return {
            depth: parseInt(depthMatch[1]),
            score: {
                type: scoreMatch[1] as "cp" | "mate",
                value: parseInt(scoreMatch[2]),
            },
            pv: pvMatch ? pvMatch[1].trim().split(" ") : [],
            bestMove: "",
        };
    };

    // Analyze a position (FEN)
    const analyze = useCallback(
        (fen: string): Promise<AnalysisResult> => {
            return new Promise((resolve, reject) => {
                if (!workerRef.current || !isReady) {
                    // Return dummy result if engine not available
                    resolve({
                        depth: 0,
                        score: { type: "cp", value: 0 },
                        pv: [],
                        bestMove: "",
                    });
                    return;
                }

                setIsAnalyzing(true);
                analysisResolveRef.current = resolve;
                currentAnalysisRef.current = null;

                workerRef.current.postMessage(`position fen ${fen}`);
                workerRef.current.postMessage(`go depth ${depth}`);

                // Timeout after 30 seconds
                setTimeout(() => {
                    if (analysisResolveRef.current === resolve) {
                        setIsAnalyzing(false);
                        resolve(
                            currentAnalysisRef.current || {
                                depth: 0,
                                score: { type: "cp", value: 0 },
                                pv: [],
                                bestMove: "",
                            }
                        );
                        analysisResolveRef.current = null;
                    }
                }, 5000);
            });
        },
        [isReady, depth]
    );

    // Analyze from starting position with moves
    const analyzeFromMoves = useCallback(
        (moves: string[]): Promise<AnalysisResult> => {
            return new Promise((resolve, reject) => {
                if (!workerRef.current || !isReady) {
                    resolve({
                        depth: 0,
                        score: { type: "cp", value: 0 },
                        pv: [],
                        bestMove: "",
                    });
                    return;
                }

                setIsAnalyzing(true);
                analysisResolveRef.current = resolve;
                currentAnalysisRef.current = null;

                const movesStr = moves.length > 0 ? ` moves ${moves.join(" ")}` : "";
                workerRef.current.postMessage(`position startpos${movesStr}`);
                workerRef.current.postMessage(`go depth ${depth}`);

                setTimeout(() => {
                    if (analysisResolveRef.current === resolve) {
                        setIsAnalyzing(false);
                        resolve(
                            currentAnalysisRef.current || {
                                depth: 0,
                                score: { type: "cp", value: 0 },
                                pv: [],
                                bestMove: "",
                            }
                        );
                        analysisResolveRef.current = null;
                    }
                }, 5000);
            });
        },
        [isReady, depth]
    );

    // Stop analysis
    const stop = useCallback(() => {
        if (workerRef.current) {
            workerRef.current.postMessage("stop");
            setIsAnalyzing(false);
        }
    }, []);

    // Set position
    const setPosition = useCallback(
        (fen: string) => {
            if (workerRef.current && isReady) {
                workerRef.current.postMessage(`position fen ${fen}`);
            }
        },
        [isReady]
    );

    return {
        isReady,
        isAnalyzing,
        currentAnalysis,
        analyze,
        analyzeFromMoves,
        stop,
        setPosition,
    };
}
