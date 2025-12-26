"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Video,
    Upload,
    Play,
    Download,
    Loader2,
    Palette,
    Settings,
    FileVideo,
    Sparkles,
    AlertCircle,
    Check,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ChessMove } from "@/remotion/ChessGameVideo";
import { videoExportService, ExportOptions, ExportResult } from "@/lib/video-export";

// Dynamic import for ChessVideoPlayer to avoid SSR issues
const ChessVideoPlayer = dynamic(
    () => import("@/components/studio/ChessVideoPlayer"),
    {
        ssr: false,
        loading: () => (
            <div className="aspect-video bg-card rounded-xl flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        ),
    }
);

// Sample game for demo
const SAMPLE_MOVES: ChessMove[] = [
    { from: "e2", to: "e4", san: "e4", piece: "P" },
    { from: "e7", to: "e5", san: "e5", piece: "p" },
    { from: "g1", to: "f3", san: "Nf3", piece: "N" },
    { from: "b8", to: "c6", san: "Nc6", piece: "n" },
    { from: "f1", to: "c4", san: "Bc4", piece: "B" },
    { from: "g8", to: "f6", san: "Nf6", piece: "n" },
    { from: "d2", to: "d3", san: "d3", piece: "P" },
    { from: "f8", to: "c5", san: "Bc5", piece: "b" },
    { from: "c1", to: "g5", san: "Bg5", piece: "B" },
    { from: "h7", to: "h6", san: "h6", piece: "p" },
    { from: "g5", to: "h4", san: "Bh4", piece: "B" },
    { from: "d7", to: "d6", san: "d6", piece: "p" },
];

type Theme = "dark" | "light" | "neon";
type Quality = "high" | "medium" | "low";

export default function VideoStudioPage() {
    // Video settings
    const [moves, setMoves] = useState<ChessMove[]>(SAMPLE_MOVES);
    const [white, setWhite] = useState("Magnus Carlsen");
    const [black, setBlack] = useState("Hikaru Nakamura");
    const [event, setEvent] = useState("Speed Chess Championship");
    const [result, setResult] = useState("1-0");
    const [theme, setTheme] = useState<Theme>("neon");
    const [showAnalysis, setShowAnalysis] = useState(true);
    const [watermark, setWatermark] = useState(true);

    // Export state
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);
    const [exportLog, setExportLog] = useState<string[]>([]);
    const [exportResult, setExportResult] = useState<ExportResult | null>(null);
    const [exportQuality, setExportQuality] = useState<Quality>("medium");

    // PGN input
    const [pgnInput, setPgnInput] = useState("");
    const [parsedMoves, setParsedMoves] = useState<ChessMove[]>([]);

    // Parse PGN to moves
    const parsePgn = useCallback((pgn: string) => {
        // Simple PGN parser - extracts moves
        const moveRegex = /\d+\.\s*([KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?[+#]?)\s*(?:([KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?[+#]?))?/g;
        const moves: ChessMove[] = [];
        let match;

        while ((match = moveRegex.exec(pgn)) !== null) {
            if (match[1]) {
                moves.push({
                    from: "e2", // Simplified - would need chess.js for real moves
                    to: "e4",
                    san: match[1],
                    piece: match[1].charAt(0) === match[1].charAt(0).toUpperCase() ? match[1].charAt(0) : "P",
                });
            }
            if (match[2]) {
                moves.push({
                    from: "e7",
                    to: "e5",
                    san: match[2],
                    piece: match[2].charAt(0) === match[2].charAt(0).toUpperCase() ? match[2].charAt(0).toLowerCase() : "p",
                });
            }
        }

        // Extract player names
        const whiteMatch = pgn.match(/\[White\s+"([^"]+)"\]/);
        const blackMatch = pgn.match(/\[Black\s+"([^"]+)"\]/);
        const eventMatch = pgn.match(/\[Event\s+"([^"]+)"\]/);
        const resultMatch = pgn.match(/\[Result\s+"([^"]+)"\]/);

        if (whiteMatch) setWhite(whiteMatch[1]);
        if (blackMatch) setBlack(blackMatch[1]);
        if (eventMatch) setEvent(eventMatch[1]);
        if (resultMatch) setResult(resultMatch[1]);

        setParsedMoves(moves);
        if (moves.length > 0) {
            setMoves(moves.length > 0 ? moves : SAMPLE_MOVES);
        }
    }, []);

    // Handle export
    const handleExport = async () => {
        setIsExporting(true);
        setExportProgress(0);
        setExportLog([]);
        setExportResult(null);

        try {
            // For now, we'll export a placeholder video
            // In production, this would capture frames from Remotion and encode them
            setExportLog(prev => [...prev, "Initializing FFmpeg WASM..."]);

            const loaded = await videoExportService.load((msg) => {
                setExportLog(prev => [...prev, msg]);
            });

            if (!loaded) {
                throw new Error("Failed to load FFmpeg");
            }

            setExportLog(prev => [...prev, "FFmpeg loaded successfully!"]);
            setExportLog(prev => [...prev, "Note: Full video export requires Remotion Cloud or server-side rendering"]);
            setExportLog(prev => [...prev, "For now, here's a demo of the FFmpeg capabilities"]);

            // Simulate progress
            for (let i = 0; i <= 100; i += 10) {
                setExportProgress(i);
                await new Promise(r => setTimeout(r, 200));
            }

            setExportResult({
                success: true,
                duration: 2000,
            });

            setExportLog(prev => [...prev, "Export simulation complete!"]);
        } catch (error) {
            setExportResult({
                success: false,
                error: error instanceof Error ? error.message : "Export failed",
            });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-40">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                            <Video className="w-6 h-6 text-amber-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Video Studio</h1>
                            <p className="text-sm text-muted-foreground">Create viral chess content</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link
                            href="/studio"
                            className="text-sm text-muted-foreground hover:text-foreground"
                        >
                            ← Caption Studio
                        </Link>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Panel - Settings */}
                    <div className="space-y-6">
                        {/* Game Input */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-6 rounded-2xl bg-card border border-border"
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <Upload className="w-5 h-5 text-primary" />
                                <h2 className="font-semibold">Import Game</h2>
                            </div>

                            <textarea
                                value={pgnInput}
                                onChange={(e) => {
                                    setPgnInput(e.target.value);
                                    parsePgn(e.target.value);
                                }}
                                placeholder="Paste PGN here...

[White &quot;Player 1&quot;]
[Black &quot;Player 2&quot;]
1. e4 e5 2. Nf3 Nc6..."
                                className="w-full h-32 p-3 rounded-xl bg-secondary border border-border resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                            />

                            <button
                                onClick={() => setMoves(SAMPLE_MOVES)}
                                className="mt-3 text-sm text-primary hover:underline"
                            >
                                Load sample game
                            </button>
                        </motion.div>

                        {/* Game Details */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="p-6 rounded-2xl bg-card border border-border"
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <Settings className="w-5 h-5 text-amber-500" />
                                <h2 className="font-semibold">Game Details</h2>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm text-muted-foreground">White Player</label>
                                    <input
                                        type="text"
                                        value={white}
                                        onChange={(e) => setWhite(e.target.value)}
                                        className="w-full mt-1 p-2 rounded-lg bg-secondary border border-border"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-muted-foreground">Black Player</label>
                                    <input
                                        type="text"
                                        value={black}
                                        onChange={(e) => setBlack(e.target.value)}
                                        className="w-full mt-1 p-2 rounded-lg bg-secondary border border-border"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-muted-foreground">Event</label>
                                    <input
                                        type="text"
                                        value={event}
                                        onChange={(e) => setEvent(e.target.value)}
                                        className="w-full mt-1 p-2 rounded-lg bg-secondary border border-border"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-muted-foreground">Result</label>
                                    <select
                                        value={result}
                                        onChange={(e) => setResult(e.target.value)}
                                        className="w-full mt-1 p-2 rounded-lg bg-secondary border border-border"
                                    >
                                        <option value="1-0">1-0 (White wins)</option>
                                        <option value="0-1">0-1 (Black wins)</option>
                                        <option value="1/2-1/2">1/2-1/2 (Draw)</option>
                                        <option value="*">* (In progress)</option>
                                    </select>
                                </div>
                            </div>
                        </motion.div>

                        {/* Visual Settings */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="p-6 rounded-2xl bg-card border border-border"
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <Palette className="w-5 h-5 text-pink-500" />
                                <h2 className="font-semibold">Visual Style</h2>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm text-muted-foreground">Theme</label>
                                    <div className="flex gap-2 mt-2">
                                        {(["neon", "dark", "light"] as Theme[]).map((t) => (
                                            <button
                                                key={t}
                                                onClick={() => setTheme(t)}
                                                className={`flex-1 py-2 px-3 rounded-lg capitalize transition-colors ${theme === t
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-secondary hover:bg-secondary/80"
                                                    }`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Show Analysis</span>
                                    <button
                                        onClick={() => setShowAnalysis(!showAnalysis)}
                                        className={`w-12 h-6 rounded-full transition-colors ${showAnalysis ? "bg-primary" : "bg-secondary"
                                            }`}
                                    >
                                        <div
                                            className={`w-5 h-5 rounded-full bg-white transition-transform ${showAnalysis ? "translate-x-6" : "translate-x-0.5"
                                                }`}
                                        />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Watermark (Free tier)</span>
                                    <button
                                        onClick={() => setWatermark(!watermark)}
                                        className={`w-12 h-6 rounded-full transition-colors ${watermark ? "bg-primary" : "bg-secondary"
                                            }`}
                                    >
                                        <div
                                            className={`w-5 h-5 rounded-full bg-white transition-transform ${watermark ? "translate-x-6" : "translate-x-0.5"
                                                }`}
                                        />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Center Panel - Video Preview */}
                    <div className="lg:col-span-2 space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-2xl bg-card border border-border overflow-hidden"
                        >
                            <div className="p-4 border-b border-border flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Play className="w-5 h-5 text-primary" />
                                    <h2 className="font-semibold">Video Preview</h2>
                                </div>
                                <span className="text-sm text-muted-foreground">
                                    {moves.length} moves • {Math.ceil(moves.length * 1 + 2)}s duration
                                </span>
                            </div>

                            <div className="p-4">
                                <ChessVideoPlayer
                                    moves={moves}
                                    white={white}
                                    black={black}
                                    event={event}
                                    result={result}
                                    theme={theme}
                                    showAnalysis={showAnalysis}
                                    watermark={watermark}
                                    onExportRequest={handleExport}
                                />
                            </div>
                        </motion.div>

                        {/* Export Panel */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="p-6 rounded-2xl bg-card border border-border"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <FileVideo className="w-5 h-5 text-emerald-500" />
                                    <h2 className="font-semibold">Export Video</h2>
                                </div>

                                <select
                                    value={exportQuality}
                                    onChange={(e) => setExportQuality(e.target.value as Quality)}
                                    className="p-2 rounded-lg bg-secondary border border-border text-sm"
                                >
                                    <option value="high">High Quality (1080p)</option>
                                    <option value="medium">Medium (720p)</option>
                                    <option value="low">Fast (480p)</option>
                                </select>
                            </div>

                            {/* Export button */}
                            <button
                                onClick={handleExport}
                                disabled={isExporting}
                                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
                            >
                                {isExporting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Exporting... {exportProgress}%
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-5 h-5" />
                                        Export as MP4
                                    </>
                                )}
                            </button>

                            {/* Progress */}
                            {isExporting && (
                                <div className="mt-4">
                                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${exportProgress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Export log */}
                            {exportLog.length > 0 && (
                                <div className="mt-4 p-3 rounded-xl bg-black/50 font-mono text-xs max-h-32 overflow-y-auto">
                                    {exportLog.map((log, i) => (
                                        <div key={i} className="text-muted-foreground">
                                            {log}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Result */}
                            <AnimatePresence>
                                {exportResult && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className={`mt-4 p-4 rounded-xl flex items-center gap-3 ${exportResult.success
                                                ? "bg-emerald-500/10 text-emerald-400"
                                                : "bg-red-500/10 text-red-400"
                                            }`}
                                    >
                                        {exportResult.success ? (
                                            <>
                                                <Check className="w-5 h-5" />
                                                <div>
                                                    <p className="font-medium">Export Ready!</p>
                                                    <p className="text-sm opacity-80">
                                                        Completed in {(exportResult.duration! / 1000).toFixed(1)}s
                                                    </p>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <AlertCircle className="w-5 h-5" />
                                                <p>{exportResult.error}</p>
                                            </>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Pro tip */}
                            <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                <p className="text-sm text-amber-400 flex items-start gap-2">
                                    <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
                                    <span>
                                        <strong>Pro Tip:</strong> Full HD export with no watermark is available for Grandmaster subscribers.
                                    </span>
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </main>
        </div>
    );
}
