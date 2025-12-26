"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Film, Play, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { LiquidLoader } from "@/components/LiquidLoader";
import { useSafeUser } from "@/hooks/useSafeClerk";
import { useRouter } from "next/navigation";

export default function ContentStudioPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [status, setStatus] = useState<string>("");
    const [error, setError] = useState<string | null>(null);

    // Admin Access Control
    const { user, isLoaded } = useSafeUser();
    const router = useRouter();

    if (!isLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LiquidLoader status="Verifying Access..." />
            </div>
        );
    }

    if (user?.publicMetadata?.role !== 'admin') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
                <h1 className="text-3xl font-bold mb-4 text-red-500">Restricted Access</h1>
                <p className="text-muted-foreground mb-8 max-w-md">
                    The Content Studio is an internal tool reserved for Administrators.
                </p>
                <div className="flex gap-4">
                    <a href="/" className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80">Home</a>
                    {/* Optional: Sign in as different user */}
                </div>
            </div>
        )
    }

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        setVideoUrl(null);
        setStatus("Fetching a fresh puzzle from the database...");

        try {
            // 1. Fetch a random puzzle (Force no-store to avoid stale cache)
            const puzzleResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8000'}/api/puzzles/random`, { cache: 'no-store' });

            if (!puzzleResponse.ok) {
                throw new Error("Failed to fetch puzzle");
            }

            const puzzle = await puzzleResponse.json();

            setStatus("AI is analyzing the position and writing the script...");

            // Determine orientation from FEN
            const turn = puzzle.fen.split(' ')[1]; // 'w' or 'b'
            const orientation = turn === 'w' ? 'white' : 'black';

            const puzzleData = {
                fen: puzzle.fen,
                solution: puzzle.moves,
                tactical_theme: puzzle.themes?.[0] || "tactical puzzle",
                puzzle_rating: puzzle.rating,
                player_color: orientation,
                voice: "enthusiastic_male"
            };

            // 2. Generate Video
            const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8000'}/api/content/render`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(puzzleData),
            });

            if (!response.ok) {
                throw new Error("Failed to generate video");
            }

            const data = await response.json();

            if (data.success && data.video_path) {
                // Extract filename from path (e.g. /app/video/out/puzzle_123.mp4 -> puzzle_123.mp4)
                const filename = data.video_path.split(/[/\\]/).pop();
                setVideoUrl(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8000'}/videos/${filename}`);
                setStatus("Video generated successfully!");
            } else {
                setError(data.error || "Unknown error occurred");
                setStatus("Generation failed.");
            }

        } catch (err) {
            console.error(err);
            setError("Failed to connect to backend. Is it running?");
            setStatus("Connection error.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="flex-1 py-12">
            <div className="container mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="max-w-4xl mx-auto"
                >
                    {/* Header */}
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 text-primary mb-6">
                            <Film className="w-8 h-8" />
                        </div>
                        <h1 className="text-4xl font-bold mb-4">Content Studio</h1>
                        <p className="text-lg text-muted-foreground">
                            Create viral chess shorts automatically with AI commentary.
                        </p>
                    </div>

                    {/* Generator Card */}
                    <div className="zen-card p-8 md:p-12 mb-8">
                        <div className="flex flex-col items-center justify-center text-center space-y-8">

                            {!videoUrl && !isLoading && (
                                <div className="space-y-4">
                                    <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto">
                                        <Sparkles className="w-10 h-10 text-amber-400" />
                                    </div>
                                    <h3 className="text-xl font-medium">Ready to create?</h3>
                                    <p className="text-sm text-muted-foreground max-w-md">
                                        Click below to generate a new video puzzle. The AI will select a tactic, write a script, generate voiceover, and render the video.
                                    </p>
                                </div>
                            )}

                            {isLoading && (
                                <LiquidLoader status={status} />
                            )}

                            {videoUrl && (
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="w-full max-w-sm mx-auto shadow-2xl rounded-xl overflow-hidden border-4 border-primary/20"
                                >
                                    <video
                                        src={videoUrl}
                                        controls
                                        autoPlay
                                        className="w-full aspect-[9/16] bg-black"
                                    />
                                    <div className="bg-card p-4 text-left border-t border-border">
                                        <p className="text-sm font-medium text-emerald-500 flex items-center gap-2">
                                            <Sparkles className="w-4 h-4" />
                                            Video Ready!
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1 truncate">
                                            {videoUrl}
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {error && (
                                <div className="bg-red-500/10 text-red-500 p-4 rounded-xl flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <button
                                onClick={handleGenerate}
                                disabled={isLoading}
                                className="zen-button px-8 py-4 text-base flex items-center gap-3 min-w-[200px] justify-center"
                            >
                                {isLoading ? (
                                    "Processing..."
                                ) : (
                                    <>
                                        <Play className="w-5 h-5 fill-current" />
                                        {videoUrl ? "Generate Another" : "Generate Video"}
                                    </>
                                )}
                            </button>

                        </div>
                    </div>

                    {/* Info Section */}
                    <div className="grid md:grid-cols-3 gap-6 text-center text-sm text-muted-foreground">
                        <div className="p-4 rounded-xl bg-secondary/30">
                            <span className="block font-medium text-foreground mb-1">AI Scripting</span>
                            Gemini generates unique hooks and commentary.
                        </div>
                        <div className="p-4 rounded-xl bg-secondary/30">
                            <span className="block font-medium text-foreground mb-1">Dynamic TTS</span>
                            Edge-TTS provides realistic voiceovers.
                        </div>
                        <div className="p-4 rounded-xl bg-secondary/30">
                            <span className="block font-medium text-foreground mb-1">Remotion Render</span>
                            React-based 60fps video generation.
                        </div>
                    </div>

                </motion.div>
            </div>
        </main>
    );
}
