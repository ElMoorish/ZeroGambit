"use client";

import { useState, useEffect, useCallback, use, useRef } from "react";
import { Chess } from "chess.js";
import { ArrowLeft, Play, Pause, SkipBack, SkipForward, ChevronLeft, ChevronRight, Loader2, Volume2, VolumeX } from "lucide-react";
import Link from "next/link";

import { ChessBoard } from "@/components/ChessBoard";
import { EvaluationBar } from "@/components/EvaluationBar";
import { AdvantageGraph } from "@/components/AdvantageGraph";
import { CoachInsights } from "@/components/CoachInsights";
import { MoveList } from "@/components/MoveList";
import { BoardThemeSelector } from "@/components/BoardThemeSelector";
import { useStockfish } from "@/hooks/useStockfish";
import { useSounds } from "@/hooks/useSounds";
import { cpToWinProbability } from "@/lib/utils";
import { getOpeningInfo } from "@/lib/eco-openings";

interface PageProps {
    params: Promise<{ gameId: string }>;
}

interface GameData {
    _id: string;
    platform_id: string;
    white: { username: string; rating?: number };
    black: { username: string; rating?: number };
    result: string;
    pgn: string;
    date: string;
    eco?: string;
    opening_name?: string;
    time_class?: string;
    analysis_status?: string;
}

// French move classification labels
const CLASSIFICATION_LABELS: Record<string, string> = {
    brilliant: "Très bon",
    great: "Excellent",
    best: "Meilleur",
    excellent: "Bon",
    good: "Bon",
    book: "Théorique",
    inaccuracy: "Imprécision",
    mistake: "Erreur",
    miss: "Manqué",
    blunder: "Gaffe",
    normal: "",
};

const CLASSIFICATION_COLORS: Record<string, string> = {
    brilliant: "#98d4a8",   /* Soft Mint */
    great: "#8ec3d4",       /* Soft Teal */
    best: "#7fb285",        /* Sage Green */
    excellent: "#a8c9a0",   /* Light Sage */
    good: "#b4c4be",        /* Muted Sage */
    book: "#a88865",        /* Warm Brown */
    inaccuracy: "#d4a574",  /* Warm Amber */
    mistake: "#c9a078",     /* Soft Orange */
    miss: "#c9a078",        /* Soft Orange */
    blunder: "#c97b84",     /* Muted Rose - NOT harsh red */
    normal: "#6b7280",      /* Stone Gray */
};

// Classify move based on centipawn loss (Chess.com/Lichess standard)
// prevEval and currEval are in centipawns, from White's perspective
function classifyMoveByCpLoss(
    prevEval: number | null,
    currEval: number | null,
    isWhiteMove: boolean,
    moveNumber: number
): string {
    // Opening book (first 10 moves by each side)
    if (moveNumber <= 10) {
        return "book";
    }

    // Handle missing evaluations
    if (prevEval === null || currEval === null) {
        return "normal";
    }

    // Calculate centipawn loss from player's perspective
    // For White: positive eval is good. Losing eval means cp_loss is positive.
    // For Black: negative eval is good. Gaining positive eval is bad for Black.
    let cpLoss: number;
    if (isWhiteMove) {
        // White moved. If eval dropped (from White's POV), that's a loss.
        cpLoss = prevEval - currEval;
    } else {
        // Black moved. If eval increased (from White's POV), that's bad for Black.
        cpLoss = currEval - prevEval;
    }

    // Classification thresholds (industry standard)
    if (cpLoss <= 0) return "best";       // Improved or maintained position
    if (cpLoss <= 10) return "great";     // < 10 cp loss
    if (cpLoss <= 25) return "excellent"; // < 25 cp loss
    if (cpLoss <= 50) return "good";      // < 50 cp loss
    if (cpLoss <= 100) return "inaccuracy"; // 50-100 cp loss
    if (cpLoss <= 250) return "mistake";  // 100-250 cp loss
    return "blunder";                     // > 250 cp loss
}

export default function AnalysisPage({ params }: PageProps) {
    const { gameId } = use(params);

    const [gameData, setGameData] = useState<GameData | null>(null);
    const [isLoadingGame, setIsLoadingGame] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [moves, setMoves] = useState<{ ply: number; san: string; uci: string; fen: string; classification?: string }[]>([]);
    const [currentPly, setCurrentPly] = useState(0);
    const [evaluations, setEvaluations] = useState<{ ply: number; moveNumber: number; move: string; evaluation: number | null; mate: number | null; classification?: string }[]>([]);
    const [coachMessages, setCoachMessages] = useState<{ id: string; ply: number; type: "info" | "tip" | "warning" | "praise" | "insight"; title: string; message: string; move?: string; bestMove?: string }[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisComplete, setAnalysisComplete] = useState(false);
    const [analysisProgress, setAnalysisProgress] = useState(0); // 0-100 percentage for liquid progress bar
    const [isAutoPlaying, setIsAutoPlaying] = useState(false);
    const [bestMoveArrow, setBestMoveArrow] = useState<{ from: string; to: string } | undefined>();
    const [blunderArrow, setBlunderArrow] = useState<{ from: string; to: string } | undefined>();
    const [ttsEnabled, setTtsEnabled] = useState(false); // Voice commentary OFF by default
    const [ttsLanguage, setTtsLanguage] = useState<"en" | "fr">("en");
    const [isPausedForTts, setIsPausedForTts] = useState(false); // Pause auto-play during speech
    const [soundEnabled, setSoundEnabled] = useState(true); // Move sounds
    const [aiInsights, setAiInsights] = useState<{
        openingSummary?: string;
        keyInsights?: string;
        lesson?: string;
    }>({});

    const { isReady, analyze } = useStockfish({ depth: 18 });
    const { playMove, playCapture, playCheck, playBlunder, playBrilliant } = useSounds();
    const prevPlyRef = useRef<number>(0);
    const lastSpokenPlyRef = useRef<number>(-1); // Track spoken plies to prevent loops

    // Get current FEN (safely)
    const getFenSafe = useCallback(() => {
        if (currentPly === 0) {
            return "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
        }
        return moves[currentPly - 1]?.fen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    }, [currentPly, moves]);

    const currentFen = getFenSafe();

    // Translation map for French -> English
    const translateMessage = useCallback((msg: { title: string; message: string; type: string; move?: string; bestMove?: string }) => {
        if (ttsLanguage === "fr") return msg;

        // Map titles
        const titleMap: Record<string, string> = {
            "Brillant!": "Brilliant!",
            "Excellent!": "Great Move!",
            "Meilleur": "Best Move",
            "Bon": "Good Move",
            "Théorie": "Book Move",
            "Imprécision": "Inaccuracy",
            "Erreur": "Mistake",
            "Gaffe!": "Blunder!",
            "Manqué": "Missed Win"
        };

        const title = titleMap[msg.title] || msg.title;

        // Map messages (simple template matching or fallback)
        let message = msg.message;
        if (msg.message.includes("était une erreur grave")) {
            message = `${msg.move} was a serious blunder. The evaluation dropped significantly.`;
        } else if (msg.message.includes("a perdu de l'avantage")) {
            message = `${msg.move} lost the advantage. Consider ${msg.bestMove || "the alternative"}.`;
        } else if (msg.message.includes("Excellent coup avec")) {
            message = `Excellent move with ${msg.move}!`;
        }

        return { ...msg, title, message };
    }, [ttsLanguage]);

    // TTS Effect: Read insight when moving to a ply with a message
    useEffect(() => {
        if (!ttsEnabled || !coachMessages.length) {
            window.speechSynthesis.cancel();
            if (isPausedForTts) setIsPausedForTts(false);
            return;
        }

        const rawMsg = coachMessages.find(m => m.ply === currentPly);

        if (rawMsg) {
            if (lastSpokenPlyRef.current === currentPly) return;

            window.speechSynthesis.cancel();
            if (isAutoPlaying) setIsPausedForTts(true);

            // Translate if needed
            const msg = translateMessage(rawMsg);
            const text = msg.message;

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = ttsLanguage === "fr" ? "fr-FR" : "en-US";

            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(v => v.lang.startsWith(utterance.lang) && v.name.includes("Google")) ||
                voices.find(v => v.lang.startsWith(utterance.lang) && v.name.includes("Microsoft")) ||
                voices.find(v => v.lang.startsWith(utterance.lang));

            if (preferredVoice) utterance.voice = preferredVoice;
            utterance.rate = 1.0;

            utterance.onend = () => setIsPausedForTts(false);
            utterance.onerror = () => setIsPausedForTts(false);

            lastSpokenPlyRef.current = currentPly;
            window.speechSynthesis.speak(utterance);
        } else {
            if (isPausedForTts) setIsPausedForTts(false);
            window.speechSynthesis.cancel();
            lastSpokenPlyRef.current = -1;
        }
    }, [currentPly, ttsEnabled, coachMessages, ttsLanguage, isAutoPlaying, isPausedForTts, translateMessage]);

    // Fetch game data - try sessionStorage first (set by games list page), then API
    useEffect(() => {
        const fetchGame = async () => {
            try {
                // First try to get from sessionStorage (set from games list)
                const storedGame = sessionStorage.getItem(`game-${gameId}`);
                if (storedGame) {
                    const parsedGame = JSON.parse(storedGame);
                    setGameData({
                        _id: parsedGame.id || gameId,
                        platform_id: parsedGame.platform_id || gameId,
                        white: parsedGame.white,
                        black: parsedGame.black,
                        result: parsedGame.result,
                        pgn: parsedGame.pgn,
                        date: parsedGame.date,
                        eco: parsedGame.eco,
                        opening_name: parsedGame.opening_name,
                        time_class: parsedGame.time_class,
                    });
                    setIsLoadingGame(false);
                    return;
                }

                // Try backend API as fallback
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
                const response = await fetch(`${apiUrl}/api/games/${gameId}`);

                if (response.ok) {
                    const data = await response.json();
                    setGameData(data);
                } else {
                    setLoadError("Game not found. Please go back to the games list and select a game.");
                }
            } catch (error) {
                console.error("Failed to fetch game:", error);
                setLoadError("Failed to load game. Please return to the games list.");
            } finally {
                setIsLoadingGame(false);
            }
        };

        fetchGame();
    }, [gameId]);

    // Parse PGN when game data changes
    useEffect(() => {
        if (!gameData?.pgn) return;

        const tempGame = new Chess();

        try {
            // Clean and load PGN
            const cleanPgn = gameData.pgn.replace(/\{[^}]*\}/g, '').replace(/\([^)]*\)/g, '');
            console.log("Parsing PGN:", cleanPgn);
            tempGame.loadPgn(cleanPgn);

            const history = tempGame.history({ verbose: true });
            console.log("History length:", history.length);

            const parsedMoves: typeof moves = [];

            tempGame.reset();

            history.forEach((move, index) => {
                const result = tempGame.move(move.san);
                if (!result) console.error("Failed to move:", move.san);

                const currentFen = tempGame.fen();
                // console.log(`Move ${index+1}: ${move.san}, FEN: ${currentFen}`);

                parsedMoves.push({
                    ply: index + 1,
                    san: move.san,
                    uci: move.from + move.to + (move.promotion || ""),
                    fen: currentFen,
                });
            });

            console.log("Parsed moves count:", parsedMoves.length);
            if (parsedMoves.length > 0) {
                console.log("First move FEN:", parsedMoves[0].fen);
                console.log("Last move FEN:", parsedMoves[parsedMoves.length - 1].fen);
            }

            setMoves(parsedMoves);
            setCurrentPly(0);
        } catch (error) {
            console.error("Failed to parse PGN:", error);
        }
    }, [gameData]);



    // Navigation handlers
    const handlePlySelect = useCallback((ply: number) => {
        setCurrentPly(Math.max(0, Math.min(ply, moves.length)));
    }, [moves.length]);

    const goToPreviousMove = () => handlePlySelect(currentPly - 1);
    const goToNextMove = () => handlePlySelect(currentPly + 1);
    const goToStart = () => handlePlySelect(0);
    const goToEnd = () => handlePlySelect(moves.length);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") goToPreviousMove();
            if (e.key === "ArrowRight") goToNextMove();
            if (e.key === "Home") goToStart();
            if (e.key === "End") goToEnd();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [currentPly, moves.length]);

    // Auto-play
    useEffect(() => {
        if (!isAutoPlaying || isPausedForTts) return; // Pause if requested by TTS
        const interval = setInterval(() => {
            setCurrentPly((prev) => {
                if (prev >= moves.length) {
                    setIsAutoPlaying(false);
                    return prev;
                }
                return prev + 1;
            });
        }, 1000); // 1 second per move
        return () => clearInterval(interval);
    }, [isAutoPlaying, isPausedForTts, moves.length]);

    // Sound effects on move navigation (sounds only, no TTS)
    useEffect(() => {
        // Skip initial render
        if (currentPly === prevPlyRef.current) return;

        const prevPly = prevPlyRef.current;
        prevPlyRef.current = currentPly;

        // Skip if going backwards or to start
        if (currentPly < prevPly || currentPly === 0) return;

        // Get current move info
        const moveData = moves[currentPly - 1];
        if (!moveData) return;

        // Play move sound based on move characteristics
        if (soundEnabled) {
            const san = moveData.san;
            const classification = moveData.classification || evaluations.find(e => e.ply === currentPly)?.classification;

            if (classification === 'blunder') {
                playBlunder();
            } else if (classification === 'brilliant' || classification === 'great') {
                playBrilliant();
            } else if (san.includes('+')) {
                playCheck();
            } else if (san.includes('x')) {
                playCapture();
            } else {
                playMove();
            }
        }
    }, [currentPly, soundEnabled, moves, evaluations, playMove, playCapture, playCheck, playBlunder, playBrilliant]);

    // Server-side analysis using local backend (Docker/FastAPI)
    const runServerAnalysis = async () => {
        if (!gameId) return;
        setIsAnalyzing(true);
        setAnalysisProgress(5);

        try {
            console.log("Checking local backend health...");
            const health = await fetch('/api/py/api/health').catch(() => null);
            if (!health || !health.ok) throw new Error("Backend unreachable");

            console.log("Backend healthy, triggering analysis...");
            const trigger = await fetch(`/api/py/api/analyze/${gameId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ depth: 16 })
            });

            if (!trigger.ok) {
                const err = await trigger.json();
                throw new Error(err.detail || "Analysis trigger failed");
            }

            // Poll for completion
            let attempts = 0;
            const maxAttempts = 60; // 60 seconds

            while (attempts < maxAttempts) {
                await new Promise(r => setTimeout(r, 1000));
                const statusRes = await fetch(`/api/py/api/analysis/${gameId}`);
                if (!statusRes.ok) continue;

                const data = await statusRes.json();

                if (data.status === 'complete') {
                    console.log("Server analysis complete!", data);

                    const backendResults: any[] = data.results || [];
                    const mappedEvaluations = backendResults.map((r: any) => ({
                        ply: r.ply,
                        moveNumber: Math.ceil(r.ply / 2),
                        move: r.move,
                        evaluation: r.eval_after,
                        mate: r.mate_after,
                        classification: r.classification
                    }));

                    setEvaluations(mappedEvaluations);
                    setCoachMessages(data.coach_messages || []);

                    // Use backend insights if available, or fall back to frontend generation
                    const backendInsights = data.ai_insights || {};
                    let finalOpeningSummary = backendInsights.opening_summary || "";
                    let finalKeyInsights = backendInsights.key_insights || "";
                    let finalLesson = backendInsights.lesson || "";

                    if (!finalKeyInsights || finalKeyInsights === "") {
                        console.log("Backend insights empty, requesting from Groq...");
                        try {
                            const blunderCount = mappedEvaluations.filter(e => e.classification === "blunder").length;
                            const mistakeCount = mappedEvaluations.filter(e => e.classification === "mistake").length;
                            const inaccuracyCount = mappedEvaluations.filter(e => e.classification === "inaccuracy").length;
                            const criticalMoves = mappedEvaluations
                                .filter(e => e.classification === "blunder" || e.classification === "mistake")
                                .slice(0, 4)
                                .map(e => {
                                    const prev = mappedEvaluations.find(ev => ev.ply === e.ply - 1);
                                    return {
                                        moveNumber: e.moveNumber,
                                        move: e.move,
                                        evalBefore: (prev?.evaluation || 0) / 100,
                                        evalAfter: (e.evaluation || 0) / 100,
                                    };
                                });

                            const coachResponse = await fetch("/api/coaching", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    gameData: {
                                        whiteName: gameData?.white?.username || "White",
                                        blackName: gameData?.black?.username || "Black",
                                        result: gameData?.result || "*",
                                        openingName: gameData?.opening_name,
                                        eco: gameData?.eco,
                                        pgn: gameData?.pgn,
                                    },
                                    analysisData: {
                                        totalMoves: moves.length,
                                        blunders: blunderCount,
                                        mistakes: mistakeCount,
                                        inaccuracies: inaccuracyCount,
                                        criticalMoves,
                                    },
                                }),
                            });
                            const ins = await coachResponse.json();
                            if (!ins.fallback) {
                                finalOpeningSummary = ins.openingSummary;
                                finalKeyInsights = Array.isArray(ins.keyInsights) ? ins.keyInsights.join("\n") : ins.keyInsights;
                                finalLesson = ins.lesson;
                            } else {
                                console.warn("Groq fallback error:", ins.error);
                                finalLesson = `Insight Error: ${ins.error}`;
                            }
                        } catch (e) { console.error("Groq fallback failed", e); }
                    }

                    setAiInsights({
                        openingSummary: finalOpeningSummary,
                        keyInsights: finalKeyInsights,
                        lesson: finalLesson
                    });

                    setAnalysisComplete(true);
                    return;
                }

                if (data.status === 'error') throw new Error(data.error);

                attempts++;
                setAnalysisProgress(10 + Math.round((attempts / maxAttempts) * 80));
            }
            throw new Error("Analysis timeout");

        } catch (error) {
            console.warn("Server analysis failed:", error);
            throw error;
        }
    };

    // Handle analysis start - uses chess-api.com cloud Stockfish or Local Backend
    const handleStartAnalysis = async () => {
        if (!moves || moves.length === 0) return;

        setIsAnalyzing(true);
        setAnalysisProgress(0);

        try {
            // Priority 1: Local Docker Backend (Native Stockfish)
            await runServerAnalysis();
            setIsAnalyzing(false);
            return;
        } catch (serverError) {
            console.log("Local backend failed, falling back to Cloud API...", serverError);
        }

        try {
            const newEvaluations: typeof evaluations = [];
            const newMessages: typeof coachMessages = [];
            let prevWinProb = 50;
            let prevEval = 0;

            // Analyze each position using chess-api.com
            for (let i = 0; i < moves.length; i++) {
                const move = moves[i];
                const isWhiteMove = move.ply % 2 === 1;

                try {
                    // Call chess-api.com for position analysis
                    const response = await fetch("https://chess-api.com/v1", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            fen: move.fen,
                            depth: 12,
                            maxThinkingTime: 50,
                        }),
                    });

                    if (!response.ok) {
                        throw new Error(`Chess API error: ${response.status}`);
                    }

                    const result = await response.json();

                    // Check for API-level errors (e.g. rate limits)
                    if (result.error || result.type === 'error') {
                        throw new Error(`Chess API error: ${result.error || result.text || 'Unknown error'}`);
                    }

                    // Extract evaluation from response
                    // chess-api.com returns eval from the perspective of the side to move
                    // After the move is made, it's the opponent's turn
                    // Normalize all evaluations to White's perspective
                    let rawEval = result.eval !== undefined ? result.eval : 0;

                    // After White's move (ply 1,3,5...), it's Black's turn, eval is from Black's POV
                    // After Black's move (ply 2,4,6...), it's White's turn, eval is from White's POV
                    // We need to flip the sign when it's Black's turn (after White moved)
                    const evalFromWhitePerspective = isWhiteMove ? -rawEval : rawEval;
                    const evaluation = Math.round(evalFromWhitePerspective * 100);
                    const mate = result.mate ? (isWhiteMove ? -result.mate : result.mate) : null;

                    // Now win probability is always from White's perspective
                    const currWinProb = cpToWinProbability(evaluation);

                    // Debug log every 10 moves
                    if (i % 10 === 0 || i < 3) {
                        console.log(`[Analysis] Move ${i + 1} (${move.san}): rawEval=${rawEval?.toFixed(2)}, normalized=${evaluation}cp, winProb=${currWinProb.toFixed(1)}%, prevWinProb=${prevWinProb.toFixed(1)}%`);
                    }

                    // Classify the move based on centipawn loss
                    const moveNumber = Math.ceil(move.ply / 2);
                    const classification = classifyMoveByCpLoss(prevEval, evaluation, isWhiteMove, moveNumber);

                    newEvaluations.push({
                        ply: move.ply,
                        moveNumber: Math.ceil(move.ply / 2),
                        move: move.san,
                        evaluation,
                        mate,
                        classification,
                    });

                    // Generate coach message for significant moves
                    if (classification === "blunder") {
                        newMessages.push({
                            id: `msg-${move.ply}`,
                            ply: move.ply,
                            type: "warning",
                            title: "Blunder!",
                            message: `${move.san} was a serious mistake. The evaluation dropped significantly.`,
                            move: move.san,
                            bestMove: result.san || undefined,
                        });
                    } else if (classification === "mistake") {
                        newMessages.push({
                            id: `msg-${move.ply}`,
                            ply: move.ply,
                            type: "warning",
                            title: "Mistake",
                            message: `${move.san} lost the advantage. Consider the suggested alternative.`,
                            move: move.san,
                            bestMove: result.san || undefined,
                        });
                    } else if (classification === "brilliant" || classification === "great") {
                        newMessages.push({
                            id: `msg-${move.ply}`,
                            ply: move.ply,
                            type: "praise",
                            title: classification === "brilliant" ? "Brilliant!" : "Great Move!",
                            message: `Excellent move with ${move.san}!`,
                            move: move.san,
                        });
                    }

                    // Update move classification
                    moves[i].classification = classification;
                    prevWinProb = currWinProb;
                    prevEval = evaluation || 0;

                } catch (error) {
                    console.error(`Analysis failed for move ${i + 1}:`, error);
                    // Continue with next move if one fails
                }

                // Update progress
                setAnalysisProgress(Math.round(((i + 1) / moves.length) * 100));
            }

            setEvaluations(newEvaluations);
            setCoachMessages(newMessages);
            setMoves([...moves]);
            setAnalysisProgress(100);

            // Generate AI coaching insights using Gemini API
            if (gameData) {
                try {
                    const blunderCount = newEvaluations.filter(e => e.classification === "blunder").length;
                    const mistakeCount = newEvaluations.filter(e => e.classification === "mistake").length;
                    const inaccuracyCount = newEvaluations.filter(e => e.classification === "inaccuracy").length;

                    const criticalMoves = newEvaluations
                        .filter(e => e.classification === "blunder" || e.classification === "mistake")
                        .slice(0, 4)
                        .map(e => {
                            const prev = newEvaluations.find(ev => ev.ply === e.ply - 1);
                            return {
                                moveNumber: e.moveNumber,
                                move: e.move,
                                evalBefore: (prev?.evaluation || 0) / 100,
                                evalAfter: (e.evaluation || 0) / 100,
                            };
                        });

                    console.log("[Analysis] Calling coaching API...");

                    const coachResponse = await fetch("/api/coaching", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            gameData: {
                                whiteName: gameData.white.username,
                                blackName: gameData.black.username,
                                result: gameData.result,
                                openingName: gameData.opening_name,
                                eco: gameData.eco,
                                pgn: gameData.pgn,
                            },
                            analysisData: {
                                totalMoves: moves.length,
                                blunders: blunderCount,
                                mistakes: mistakeCount,
                                inaccuracies: inaccuracyCount,
                                criticalMoves,
                            },
                        }),
                    });

                    const insights = await coachResponse.json();

                    if (insights.fallback) {
                        console.warn("[Analysis] Coaching API returned fallback:", insights.error);
                        setAiInsights({
                            openingSummary: "Analysis Insight Error",
                            keyInsights: "Could not generate insights.",
                            lesson: `Error: ${insights.error}. Please check GROQ_API_KEY or GEMINI_API_KEY in .env.`,
                        });
                    } else {
                        console.log("[Analysis] Received Gemini insights");
                        setAiInsights({
                            openingSummary: insights.openingSummary || "",
                            keyInsights: Array.isArray(insights.keyInsights) ? insights.keyInsights.join("\n") : "",
                            lesson: insights.lesson || "",
                        });
                    }
                } catch (coachError) {
                    console.error("Coaching insights failed:", coachError);
                }
            }

            setAnalysisComplete(true);

        } catch (error) {
            console.error("Cloud analysis failed:", error);
            // Fallback to WASM analysis
            console.log("Falling back to local WASM analysis...");
            await runWasmAnalysis();
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Fallback WASM-based analysis (if server fails)
    const runWasmAnalysis = async () => {
        if (!isReady || moves.length === 0) {
            console.error('WASM not ready or no moves');
            return;
        }

        const newEvaluations: typeof evaluations = [];
        const newMessages: typeof coachMessages = [];
        let prevEval: number | null = 0;  // Track previous evaluation in centipawns

        for (let i = 0; i < moves.length; i++) {
            const move = moves[i];
            const isWhiteMove = move.ply % 2 === 1;

            try {
                const result = await analyze(move.fen);

                // Stockfish returns score relative to side to move
                // Normalize to White perspective
                let evaluation = result.score.type === "cp" ? result.score.value : null;

                // Flip sign if it's Black's turn (after White move)
                if (evaluation !== null && isWhiteMove) {
                    evaluation = -evaluation;
                }

                let mate = result.score.type === "mate" ? result.score.value : null;
                if (mate !== null && isWhiteMove) {
                    mate = -mate;
                }

                // Track previous eval for CP-based classification
                const moveNumber = Math.ceil(move.ply / 2);
                const classification = classifyMoveByCpLoss(prevEval, evaluation, isWhiteMove, moveNumber);
                prevEval = evaluation;

                newEvaluations.push({
                    ply: move.ply,
                    moveNumber: Math.ceil(move.ply / 2),
                    move: move.san,
                    evaluation,
                    mate,
                    classification,
                });

                // Generate coach message for significant moves
                if (classification === "blunder") {
                    newMessages.push({
                        id: `msg-${move.ply}`,
                        ply: move.ply,
                        type: "warning",
                        title: `${CLASSIFICATION_LABELS.blunder}!`,
                        message: `${move.san} était une erreur grave. L'évaluation a chuté significativement.`,
                        move: move.san,
                        bestMove: result.pv[0],
                    });
                } else if (classification === "mistake") {
                    newMessages.push({
                        id: `msg-${move.ply}`,
                        ply: move.ply,
                        type: "warning",
                        title: CLASSIFICATION_LABELS.mistake,
                        message: `${move.san} a perdu de l'avantage. Considérez l'alternative suggérée.`,
                        move: move.san,
                        bestMove: result.pv[0],
                    });
                } else if (classification === "brilliant" || classification === "great") {
                    newMessages.push({
                        id: `msg-${move.ply}`,
                        ply: move.ply,
                        type: "praise",
                        title: classification === "brilliant" ? `${CLASSIFICATION_LABELS.brilliant}!` : `${CLASSIFICATION_LABELS.great}!`,
                        message: `Excellent coup avec ${move.san}!`,
                        move: move.san,
                    });
                }

                moves[i].classification = classification;

                // Debug log
                console.log(`[WASM] Move ${i + 1} (${move.san}): eval=${evaluation}cp, classification=${classification}`);
            } catch (error) {
                console.error(`Analysis failed for move ${i + 1}:`, error);
            }
        }

        setEvaluations(newEvaluations);
        setCoachMessages(newMessages);
        setMoves([...moves]);

        // Generate AI coaching insights using local analysis data
        if (gameData && newEvaluations.length > 0) {
            try {
                const blunderCount = newEvaluations.filter(e => e.classification === "blunder").length;
                const mistakeCount = newEvaluations.filter(e => e.classification === "mistake").length;
                const inaccuracyCount = newEvaluations.filter(e => e.classification === "inaccuracy").length;

                const criticalMoves = newEvaluations
                    .filter(e => e.classification === "blunder" || e.classification === "mistake")
                    .slice(0, 4)
                    .map(e => {
                        const prev = newEvaluations.find(ev => ev.ply === e.ply - 1);
                        return {
                            moveNumber: e.moveNumber,
                            move: e.move,
                            evalBefore: (prev?.evaluation || 0) / 100,
                            evalAfter: (e.evaluation || 0) / 100,
                        };
                    });

                console.log("[WASM] Calling coaching API with local data...");

                const coachResponse = await fetch("/api/coaching", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        gameData: {
                            whiteName: gameData.white.username,
                            blackName: gameData.black.username,
                            result: gameData.result,
                            openingName: gameData.opening_name,
                            eco: gameData.eco,
                            pgn: gameData.pgn,
                        },
                        analysisData: {
                            totalMoves: moves.length,
                            blunders: blunderCount,
                            mistakes: mistakeCount,
                            inaccuracies: inaccuracyCount,
                            criticalMoves,
                        },
                    }),
                });

                const insights = await coachResponse.json();

                if (insights.fallback) {
                    console.warn("[WASM] Coaching API fallback:", insights.error);
                    setAiInsights({
                        openingSummary: "Analysis Insight Error",
                        keyInsights: "Could not generate insights.",
                        lesson: `Error: ${insights.error}. Please check GROQ_API_KEY or GEMINI_API_KEY in .env.`,
                    });
                } else {
                    console.log("[WASM] Received AI insights");
                    setAiInsights({
                        openingSummary: insights.openingSummary || "",
                        keyInsights: Array.isArray(insights.keyInsights) ? insights.keyInsights.join("\n") : "",
                        lesson: insights.lesson || "",
                    });
                }
            } catch (coachError) {
                console.error("Coaching insights failed:", coachError);
            }
        }

        setAnalysisComplete(true);
    };

    const currentEval = evaluations.find((e) => e.ply === currentPly);

    // Loading state
    if (isLoadingGame) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
        );
    }

    // Error state
    if (loadError) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-500 text-xl mb-4">{loadError}</p>
                    <Link href="/" className="text-primary hover:underline">
                        Go back home
                    </Link>
                </div>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-40">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="p-2 rounded-lg hover:bg-secondary transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="font-semibold">
                                {gameData?.white.username} vs {gameData?.black.username}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {gameData?.result} • {gameData?.time_class || "Game"} • {getOpeningInfo(gameData?.eco, gameData?.opening_name)}
                            </p>
                        </div>
                    </div>

                    {!analysisComplete && !isAnalyzing && (
                        <button
                            onClick={handleStartAnalysis}
                            disabled={!moves.length}
                            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium flex items-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50"
                        >
                            Analyze Game
                        </button>
                    )}
                    {isAnalyzing && (
                        <span className="text-sm text-muted-foreground">Analyzing... {analysisProgress}%</span>
                    )}
                    <div className="ml-4 border-l border-border pl-4">
                        <BoardThemeSelector />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-6">
                <div className="grid lg:grid-cols-[1fr_400px] gap-6">
                    {/* Left: Board and Graph */}
                    <div className="space-y-4">
                        {/* Board Section */}
                        <div className="flex gap-4">
                            {/* Evaluation Bar */}
                            <EvaluationBar
                                evaluation={currentEval?.evaluation ?? 0}
                                mate={currentEval?.mate ?? null}
                            />

                            {/* Chess Board */}
                            <div className="flex-1 flex justify-center">
                                <ChessBoard
                                    id={`analysis-board-${gameData?._id || "default"}`}
                                    key={currentPly} // Force remount to ensure visual update
                                    position={currentFen}
                                    interactable={false}
                                    bestMove={bestMoveArrow}
                                    blunderMove={blunderArrow}
                                />
                            </div>
                        </div>

                        {/* Move Info */}
                        {currentPly > 0 && moves[currentPly - 1] && (
                            <div className="text-center">
                                <span className="text-lg font-medium">
                                    {Math.ceil(currentPly / 2)}.{currentPly % 2 === 0 ? ".." : ""} {moves[currentPly - 1].san}
                                </span>
                                {moves[currentPly - 1].classification && moves[currentPly - 1].classification !== "normal" && (
                                    <span
                                        className="ml-2 px-2 py-0.5 rounded text-sm font-medium"
                                        style={{
                                            backgroundColor: CLASSIFICATION_COLORS[moves[currentPly - 1].classification!] + "22",
                                            color: CLASSIFICATION_COLORS[moves[currentPly - 1].classification!]
                                        }}
                                    >
                                        {CLASSIFICATION_LABELS[moves[currentPly - 1].classification!]}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Playback Controls */}
                        <div className="flex items-center justify-center gap-2">
                            <button onClick={goToStart} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                                <SkipBack className="w-5 h-5" />
                            </button>
                            <button onClick={goToPreviousMove} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                                className="p-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover transition-colors"
                            >
                                {isAutoPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                            </button>
                            <button onClick={goToNextMove} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                            <button onClick={goToEnd} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                                <SkipForward className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Advantage Graph */}
                        {evaluations.length > 0 && (
                            <AdvantageGraph
                                evaluations={evaluations}
                                currentPly={currentPly}
                                onPlySelect={handlePlySelect}
                            />
                        )}

                        {/* Move List with Progress Bar */}
                        <div className="space-y-2">
                            {/* Liquid Progress Bar - Shows during analysis */}
                            {isAnalyzing && (
                                <div className="bg-card border border-border rounded-xl p-4">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-muted-foreground font-medium">
                                            Analyzing with Stockfish 17...
                                        </span>
                                        <span className="text-primary font-bold">{analysisProgress}%</span>
                                    </div>
                                    <div className="h-4 bg-slate-800 rounded-full overflow-hidden relative">
                                        {/* Liquid fill effect */}
                                        <div
                                            className="h-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-600 rounded-full transition-all duration-300 ease-out relative"
                                            style={{
                                                width: `${analysisProgress}%`,
                                                boxShadow: '0 0 15px rgba(74, 222, 128, 0.6), inset 0 2px 4px rgba(255,255,255,0.2)'
                                            }}
                                        >
                                            {/* Wave animation overlay */}
                                            <div
                                                className="absolute inset-0"
                                                style={{
                                                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                                                    animation: 'shimmer 1.5s infinite linear',
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                                        <span>Move {Math.ceil(analysisProgress / 100 * (moves.length || 1))} of {moves.length}</span>
                                        <span>{moves.length > 0 ? Math.round((moves.length - Math.ceil(analysisProgress / 100 * moves.length)) * 0.05) : 0}s remaining</span>
                                    </div>
                                </div>
                            )}

                            {/* Moves Header */}
                            <div className="flex items-center justify-between px-2">
                                <span className="text-sm font-medium text-muted-foreground">Moves</span>
                                <span className="text-xs text-muted-foreground">{moves.length} total</span>
                            </div>

                            {/* Move List */}
                            <div className="h-40">
                                <MoveList
                                    moves={moves}
                                    currentPly={currentPly}
                                    onPlySelect={handlePlySelect}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right: Coach Insights Panel */}
                    <div className="h-[calc(100vh-200px)] sticky top-24">
                        <CoachInsights
                            openingName={getOpeningInfo(gameData?.eco, gameData?.opening_name)}
                            openingPgn={moves.slice(0, 10).map((m, i) => `${Math.ceil((i + 1) / 2)}${i % 2 === 0 ? '. ' : '..'}${m.san}`).join(' ')}
                            openingFen={moves[9]?.fen || moves[moves.length - 1]?.fen}
                            openingSummary={aiInsights.openingSummary}
                            criticalMoves={evaluations
                                .filter(e => e.classification === 'blunder' || e.classification === 'mistake')
                                .slice(0, 4)
                                .map(e => {
                                    const prevEval = evaluations.find(ev => ev.ply === e.ply - 1);
                                    return {
                                        moveNumber: e.moveNumber,
                                        move: e.move,
                                        played: e.move,
                                        best: coachMessages.find(m => m.ply === e.ply)?.bestMove || '?',
                                        evalBefore: (prevEval?.evaluation || 0) / 100,
                                        evalAfter: (e.evaluation || 0) / 100,
                                        fen: moves[e.ply - 1]?.fen,
                                    };
                                })}
                            keyInsights={aiInsights.keyInsights
                                ? aiInsights.keyInsights.split(/[•\n]+/)
                                    .map(s => s.trim())
                                    .filter(s => s.length > 5)
                                    .map(s => s.replace(/\*\*/g, '').replace(/^Insight \d+: /, ''))
                                : []}
                            lesson={aiInsights.lesson ? aiInsights.lesson.replace(/\*\*/g, '') : ""}
                            isAnalyzing={isAnalyzing}
                            analysisComplete={analysisComplete}
                            onMoveClick={handlePlySelect}
                            ttsEnabled={ttsEnabled}
                            onTtsToggle={setTtsEnabled}
                            ttsLanguage={ttsLanguage}
                            onLanguageChange={setTtsLanguage}
                            evaluations={evaluations}
                            totalMoves={moves.length}
                        />
                    </div>
                </div>
            </main>

        </div>
    );
}
