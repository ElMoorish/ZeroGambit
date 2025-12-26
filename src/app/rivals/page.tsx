"use client";

import { useState, Suspense } from "react";
import { motion } from "framer-motion";
import { Navigation } from "@/components/Navigation";
import {
    Swords,
    Link2,
    Copy,
    Check,
    Play,
    Clock,
    User,
    ChevronRight,
    Ghost,
    Zap,
    X,
} from "lucide-react";
import { generateChallengeUrl, getReplayFromUrl, type GhostReplay } from "@/utils/ghostProtocol";
import { useSearchParams } from "next/navigation";

/**
 * Rivals Page - Async Multiplayer with Ghost Protocol
 * 
 * Challenge friends via shareable URLs. No server needed.
 * Your moves + timestamps encoded in the URL itself.
 */

// Wrapper component to handle Suspense
export default function RivalsPage() {
    return (
        <Suspense fallback={<RivalsLoading />}>
            <RivalsContent />
        </Suspense>
    );
}

function RivalsLoading() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    );
}

function RivalsContent() {
    const searchParams = useSearchParams();
    const [mode, setMode] = useState<"create" | "accept" | "play">("create");
    const [challengeUrl, setChallengeUrl] = useState("");
    const [copied, setCopied] = useState(false);
    const [timeControl, setTimeControl] = useState("5+0");
    const [opponentName, setOpponentName] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const [recordedMoves, setRecordedMoves] = useState<{ t: number; m: string }[]>([]);
    const [gameStartTime, setGameStartTime] = useState<number | null>(null);

    // Start recording a new game
    const handleStartRecording = () => {
        setIsRecording(true);
        setRecordedMoves([]);
        setGameStartTime(Date.now());
    };

    // Finish recording and generate challenge URL
    const handleFinishRecording = () => {
        if (recordedMoves.length === 0) {
            alert("Play at least one move before creating a challenge!");
            return;
        }

        const replay: GhostReplay = {
            p: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
            m: recordedMoves,
            u: opponentName || "Anonymous",
            mode: timeControl.includes("+") ? "blitz" : "rapid",
            ts: Date.now(),
        };

        const url = generateChallengeUrl(replay);
        setChallengeUrl(url);
        setIsRecording(false);
    };

    // Cancel recording
    const handleCancelRecording = () => {
        setIsRecording(false);
        setRecordedMoves([]);
        setGameStartTime(null);
    };

    // Reset to create new challenge
    const handleReset = () => {
        setChallengeUrl("");
        setIsRecording(false);
        setRecordedMoves([]);
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(challengeUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Check for incoming challenge on mount
    const incomingReplay = searchParams ? getReplayFromUrl(searchParams) : null;

    return (
        <div className="min-h-screen bg-background">
            <Navigation />

            <main className="container mx-auto px-6 py-24">
                {/* Header */}
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4"
                    >
                        <Ghost className="w-4 h-4" />
                        Ghost Protocol
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-bold mb-4"
                    >
                        Async <span className="text-primary">Rivals</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-muted-foreground max-w-lg mx-auto"
                    >
                        Challenge anyone, anywhere. Your moves are encoded in a URL.
                        No servers. No accounts. Just pure chess.
                    </motion.p>
                </div>

                {/* Mode Selector */}
                <div className="flex justify-center gap-4 mb-12">
                    {[
                        { id: "create", label: "Create Challenge", icon: Zap },
                        { id: "accept", label: "Accept Challenge", icon: Link2 },
                    ].map(({ id, label, icon: Icon }) => (
                        <motion.button
                            key={id}
                            onClick={() => setMode(id as "create" | "accept")}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${mode === id
                                ? "bg-primary text-primary-foreground"
                                : "bg-card border border-border hover:bg-white/5"
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                        </motion.button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="max-w-2xl mx-auto">
                    {mode === "create" && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-card border border-border rounded-2xl p-8"
                        >
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <Swords className="w-6 h-6 text-primary" />
                                Create a Challenge
                            </h2>

                            {/* Time Control */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium mb-3">Time Control</label>
                                <div className="grid grid-cols-4 gap-3">
                                    {["1+0", "3+0", "5+0", "10+0"].map((tc) => (
                                        <button
                                            key={tc}
                                            onClick={() => setTimeControl(tc)}
                                            disabled={isRecording || !!challengeUrl}
                                            className={`p-3 rounded-xl border text-center transition-colors disabled:opacity-50 ${timeControl === tc
                                                ? "border-primary bg-primary/10 text-primary"
                                                : "border-border hover:bg-white/5"
                                                }`}
                                        >
                                            <Clock className="w-4 h-4 mx-auto mb-1" />
                                            <span className="text-sm font-medium">{tc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Your Name */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium mb-2">Your Display Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Anonymous"
                                        value={opponentName}
                                        onChange={(e) => setOpponentName(e.target.value)}
                                        disabled={isRecording || !!challengeUrl}
                                        className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-xl focus:border-primary outline-none disabled:opacity-50"
                                    />
                                </div>
                            </div>

                            {/* Start Recording Button */}
                            {!challengeUrl && !isRecording && (
                                <button
                                    onClick={handleStartRecording}
                                    className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
                                >
                                    <Play className="w-5 h-5" />
                                    Start Recording Moves
                                </button>
                            )}

                            {/* Recording State */}
                            {isRecording && (
                                <div className="space-y-4">
                                    <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                                        <div className="flex items-center gap-2 text-red-400 mb-2">
                                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                                            Recording...
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Go to the <a href="/games" className="text-primary underline">Games page</a> to play and record your moves.
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Moves recorded: {recordedMoves.length}
                                        </p>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleCancelRecording}
                                            className="flex-1 py-3 border border-border rounded-xl hover:bg-white/5 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleFinishRecording}
                                            disabled={recordedMoves.length === 0}
                                            className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-medium disabled:opacity-50"
                                        >
                                            Finish & Share
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Challenge URL Generated */}
                            {challengeUrl && !isRecording && (
                                <div className="space-y-4">
                                    <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                                        <p className="text-xs text-green-400 mb-2">Challenge created! Share this link:</p>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                readOnly
                                                value={challengeUrl}
                                                className="flex-1 bg-background px-3 py-2 rounded-lg text-sm truncate outline-none"
                                            />
                                            <button
                                                onClick={handleCopy}
                                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                            >
                                                {copied ? (
                                                    <Check className="w-4 h-4 text-green-500" />
                                                ) : (
                                                    <Copy className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <p className="text-center text-sm text-muted-foreground">
                                        Your opponent will see your moves as a &quot;ghost&quot; and try to beat your time!
                                    </p>

                                    <button
                                        onClick={handleReset}
                                        className="w-full py-3 border border-border rounded-xl hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <X className="w-4 h-4" />
                                        Create New Challenge
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {mode === "accept" && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-card border border-border rounded-2xl p-8"
                        >
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <Link2 className="w-6 h-6 text-primary" />
                                Accept a Challenge
                            </h2>

                            {incomingReplay ? (
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Ghost className="w-8 h-8 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">Challenge Found!</h3>
                                    <p className="text-muted-foreground mb-6">
                                        You&apos;ve been challenged to a {incomingReplay.mode || "rapid"} game.
                                    </p>
                                    <button className="px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold flex items-center gap-2 mx-auto hover:bg-primary/90 transition-colors">
                                        Accept & Play
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Link2 className="w-8 h-8 text-slate-500" />
                                    </div>
                                    <p className="text-muted-foreground mb-2">
                                        Paste a challenge URL in your browser to accept
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        The URL contains the full game data - no server needed!
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>

                {/* How It Works */}
                <div className="max-w-4xl mx-auto mt-24">
                    <h2 className="text-2xl font-bold text-center mb-12">How Ghost Protocol Works</h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                step: "1",
                                title: "Record Your Game",
                                description: "Play against Stockfish or yourself. Every move and timestamp is captured.",
                            },
                            {
                                step: "2",
                                title: "Share the URL",
                                description: "Your entire game is compressed into a shareable link. No account needed.",
                            },
                            {
                                step: "3",
                                title: "Race the Ghost",
                                description: "Your opponent sees your moves play out and tries to beat your time.",
                            },
                        ].map((item) => (
                            <motion.div
                                key={item.step}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="text-center"
                            >
                                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 text-primary font-bold text-lg">
                                    {item.step}
                                </div>
                                <h3 className="font-semibold mb-2">{item.title}</h3>
                                <p className="text-sm text-muted-foreground">{item.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
