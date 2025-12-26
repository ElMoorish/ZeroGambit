"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles,
    Loader2,
    Copy,
    Check,
    AlertCircle,
    Wand2,
    FileText,
    Zap,
    Brain,
    Download,
    Volume2,
    VolumeX,
    Play,
    Square,
    Globe,
    BarChart3
} from "lucide-react";
import Link from "next/link";
import { useLocalLLM, ModelId } from "@/hooks/useLocalLLM";
import { useTTS, LANGUAGES } from "@/hooks/useTTS";
import { detectInputType, quickAnalysis, formatAnalysisForPrompt, InputType } from "@/utils/pgnAnalysis";

export default function StudioPage() {
    const {
        isLoading,
        isGenerating,
        isReady,
        loadProgress,
        loadStatus,
        error,
        initEngine,
        generate,
        availableModels,
    } = useLocalLLM();

    const {
        speak,
        stop,
        voices,
        selectedVoice,
        setSelectedVoice,
        isSpeaking,
        isSupported: ttsSupported,
        getVoicesForLanguage,
    } = useTTS();

    const [selectedModel, setSelectedModel] = useState<ModelId>('Llama-3.2-1B-Instruct-q4f16_1-MLC');
    const [gameInput, setGameInput] = useState('');
    const [detectedType, setDetectedType] = useState<InputType | null>(null);
    const [analysis, setAnalysis] = useState<ReturnType<typeof quickAnalysis> | null>(null);
    const [generatedCaptions, setGeneratedCaptions] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [selectedLang, setSelectedLang] = useState('en');

    // Auto-detect input type as user types
    useEffect(() => {
        if (gameInput.trim().length > 10) {
            const type = detectInputType(gameInput);
            setDetectedType(type);
            const gameAnalysis = quickAnalysis(gameInput);
            setAnalysis(gameAnalysis);
        } else {
            setDetectedType(null);
            setAnalysis(null);
        }
    }, [gameInput]);

    const handleLoadModel = async () => {
        await initEngine(selectedModel);
    };

    const handleGenerate = async () => {
        if (!isReady || !gameInput.trim()) return;

        const gameAnalysis = analysis || quickAnalysis(gameInput);
        const analysisContext = formatAnalysisForPrompt(gameAnalysis);

        const systemPrompt = `You are a Gen-Z social media manager for a chess app called ZeroGambit. 
Your job is to write viral TikTok/Instagram Reels captions that make chess look cool and exciting.
Use emojis, trending phrases, and hooks that make people want to watch.
Keep captions under 150 characters each. Include 3-5 relevant hashtags.
Write in a casual, engaging tone.`;

        const userPrompt = `Based on this game analysis, write 3 different viral captions:

${analysisContext}

Format each caption with a number (1, 2, 3) and include hashtags.`;

        const result = await generate([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ]);

        if (result) {
            setGeneratedCaptions(result);
        }
    };

    const handleCopy = () => {
        if (generatedCaptions) {
            navigator.clipboard.writeText(generatedCaptions);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleSpeak = () => {
        if (isSpeaking) {
            stop();
        } else if (generatedCaptions) {
            // Get voice for selected language
            const langVoices = getVoicesForLanguage(selectedLang);
            const voiceName = langVoices[0]?.name || selectedVoice || undefined;
            speak(generatedCaptions, { voiceName, rate: 1.0 });
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-40">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-pink-500/20">
                            <Sparkles className="w-6 h-6 text-violet-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Ghostwriter Studio</h1>
                            <p className="text-sm text-muted-foreground">AI-Powered Content Creation</p>
                        </div>
                    </div>

                    <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
                        ← Back to Dashboard
                    </Link>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="grid lg:grid-cols-2 gap-8">

                    {/* Left Panel - Input & Controls */}
                    <div className="space-y-6">

                        {/* Model Selection */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-6 rounded-2xl bg-card border border-border"
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <Brain className="w-5 h-5 text-primary" />
                                <h2 className="font-semibold">AI Engine</h2>
                            </div>

                            <div className="mb-4">
                                <select
                                    value={selectedModel}
                                    onChange={(e) => setSelectedModel(e.target.value as ModelId)}
                                    disabled={isLoading || isReady}
                                    className="w-full p-3 rounded-xl bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    {Object.entries(availableModels).map(([id, info]) => (
                                        <option key={id} value={id}>
                                            {info.name} ({info.size}) - {info.speed}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {!isReady ? (
                                <button
                                    onClick={handleLoadModel}
                                    disabled={isLoading}
                                    className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            {Math.round(loadProgress)}% Loading...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-5 h-5" />
                                            Load AI Model
                                        </>
                                    )}
                                </button>
                            ) : (
                                <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 text-green-500">
                                    <Check className="w-5 h-5" />
                                    <span className="font-medium">Model Ready!</span>
                                </div>
                            )}

                            {isLoading && (
                                <div className="mt-4 space-y-2">
                                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-primary"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${loadProgress}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground text-center">{loadStatus}</p>
                                </div>
                            )}

                            {error && (
                                <div className="mt-4 p-3 rounded-xl bg-red-500/10 text-red-500 flex items-start gap-2">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <p className="text-sm">{error}</p>
                                </div>
                            )}
                        </motion.div>

                        {/* Game Input with Auto-Detection */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="p-6 rounded-2xl bg-card border border-border"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-amber-500" />
                                    <h2 className="font-semibold">Game Input</h2>
                                </div>

                                {/* Auto-detected type badge */}
                                {detectedType && (
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${detectedType === 'pgn' ? 'bg-emerald-500/20 text-emerald-400' :
                                        detectedType === 'fen' ? 'bg-blue-500/20 text-blue-400' :
                                            'bg-violet-500/20 text-violet-400'
                                        }`}>
                                        {detectedType.toUpperCase()} Detected
                                    </span>
                                )}
                            </div>

                            <textarea
                                value={gameInput}
                                onChange={(e) => setGameInput(e.target.value)}
                                placeholder="Paste your game (PGN, FEN, or description)...

📋 PGN: [Event]... 1.e4 e5 2.Nf3...
📍 FEN: rnbqkbnr/pppppppp/...
✍️ Text: Won with a queen sacrifice!"
                                className="w-full h-40 p-4 rounded-xl bg-secondary border border-border resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                            />

                            {/* Analysis Preview */}
                            {analysis && (
                                <div className="mt-4 p-3 rounded-xl bg-secondary/50 border border-border">
                                    <div className="flex items-center gap-2 mb-2">
                                        <BarChart3 className="w-4 h-4 text-primary" />
                                        <span className="text-sm font-medium">Quick Analysis</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <span className="text-muted-foreground">Vibe:</span>
                                            <span className="ml-1 font-medium">{analysis.vibe}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Winner:</span>
                                            <span className="ml-1 font-medium capitalize">{analysis.winner}</span>
                                        </div>
                                        {analysis.totalMoves > 0 && (
                                            <div>
                                                <span className="text-muted-foreground">Moves:</span>
                                                <span className="ml-1 font-medium">{analysis.totalMoves}</span>
                                            </div>
                                        )}
                                        {analysis.opening !== 'N/A' && (
                                            <div>
                                                <span className="text-muted-foreground">Opening:</span>
                                                <span className="ml-1 font-medium">{analysis.opening}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleGenerate}
                                disabled={!isReady || isGenerating || !gameInput.trim()}
                                className="w-full mt-4 py-3 bg-gradient-to-r from-violet-500 to-pink-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="w-5 h-5" />
                                        Generate Viral Captions
                                    </>
                                )}
                            </button>
                        </motion.div>
                    </div>

                    {/* Right Panel - Output */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="p-6 rounded-2xl bg-card border border-border h-fit"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Zap className="w-5 h-5 text-amber-500" />
                                <h2 className="font-semibold">Generated Captions</h2>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* TTS Controls */}
                                {ttsSupported && generatedCaptions && (
                                    <>
                                        <select
                                            value={selectedLang}
                                            onChange={(e) => setSelectedLang(e.target.value)}
                                            className="text-xs p-1.5 rounded-lg bg-secondary border border-border"
                                        >
                                            {Object.entries(LANGUAGES).map(([code, name]) => (
                                                <option key={code} value={code}>{name}</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={handleSpeak}
                                            className={`p-2 rounded-lg transition-colors ${isSpeaking ? 'bg-red-500/20 text-red-400' : 'hover:bg-secondary'
                                                }`}
                                            title={isSpeaking ? 'Stop' : 'Read Aloud'}
                                        >
                                            {isSpeaking ? (
                                                <Square className="w-4 h-4" />
                                            ) : (
                                                <Volume2 className="w-4 h-4 text-muted-foreground" />
                                            )}
                                        </button>
                                    </>
                                )}

                                {generatedCaptions && (
                                    <button
                                        onClick={handleCopy}
                                        className="p-2 rounded-lg hover:bg-secondary transition-colors"
                                    >
                                        {copied ? (
                                            <Check className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <Copy className="w-4 h-4 text-muted-foreground" />
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            {generatedCaptions ? (
                                <motion.div
                                    key="result"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="p-4 rounded-xl bg-secondary border border-border"
                                >
                                    <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
                                        {generatedCaptions}
                                    </pre>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="placeholder"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="p-8 rounded-xl border border-dashed border-border text-center text-muted-foreground"
                                >
                                    <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>Your viral captions will appear here</p>
                                    <p className="text-sm mt-1">Supports PGN, FEN, or text descriptions</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {!isReady && (
                            <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                <p className="text-sm text-amber-500 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    <span>
                                        <strong>WebGPU Required:</strong> Chrome/Edge 113+
                                    </span>
                                </p>
                            </div>
                        )}
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
