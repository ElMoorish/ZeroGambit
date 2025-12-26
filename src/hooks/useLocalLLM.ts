/**
 * Local LLM Hook - Client-Side AI using WebLLM
 * 
 * Runs large language models directly in the browser using WebGPU.
 * No server required, complete privacy.
 */

"use client";

import { useState, useCallback, useRef, useEffect } from 'react';

// Types for WebLLM (we import dynamically to avoid SSR issues)
interface InitProgressReport {
    progress: number;
    text: string;
}

interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface ChatCompletionResponse {
    choices: Array<{
        message: {
            content: string;
        };
    }>;
}

export type ModelId =
    | 'Llama-3.2-1B-Instruct-q4f16_1-MLC'
    | 'Llama-3.2-3B-Instruct-q4f16_1-MLC'
    | 'gemma-2-2b-it-q4f16_1-MLC'
    | 'Phi-3.5-mini-instruct-q4f16_1-MLC';

const MODEL_INFO: Record<ModelId, { name: string; size: string; speed: string }> = {
    'Llama-3.2-1B-Instruct-q4f16_1-MLC': { name: 'Llama 3.2 1B', size: '~700MB', speed: 'Fast' },
    'Llama-3.2-3B-Instruct-q4f16_1-MLC': { name: 'Llama 3.2 3B', size: '~1.8GB', speed: 'Medium' },
    'gemma-2-2b-it-q4f16_1-MLC': { name: 'Gemma 2 2B', size: '~1.5GB', speed: 'Medium' },
    'Phi-3.5-mini-instruct-q4f16_1-MLC': { name: 'Phi 3.5 Mini', size: '~2.3GB', speed: 'Medium' },
};

export function useLocalLLM(defaultModel: ModelId = 'Llama-3.2-1B-Instruct-q4f16_1-MLC') {
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [loadProgress, setLoadProgress] = useState(0);
    const [loadStatus, setLoadStatus] = useState('');
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentModel, setCurrentModel] = useState<ModelId | null>(null);

    const engineRef = useRef<any>(null);

    // Check WebGPU support
    const checkWebGPU = useCallback(async (): Promise<boolean> => {
        if (typeof window === 'undefined') return false;
        if (!('gpu' in navigator)) {
            setError('WebGPU is not supported in this browser. Please use Chrome 113+ or Edge 113+.');
            return false;
        }
        try {
            const adapter = await (navigator as any).gpu.requestAdapter();
            if (!adapter) {
                setError('No WebGPU adapter found. Your GPU may not be supported.');
                return false;
            }
            return true;
        } catch (e) {
            setError('Failed to initialize WebGPU.');
            return false;
        }
    }, []);

    // Initialize the LLM engine
    const initEngine = useCallback(async (modelId: ModelId = defaultModel): Promise<boolean> => {
        if (isLoading) return false;

        const hasWebGPU = await checkWebGPU();
        if (!hasWebGPU) return false;

        setIsLoading(true);
        setError(null);
        setLoadProgress(0);
        setLoadStatus('Initializing WebLLM...');

        try {
            // Dynamic import to avoid SSR issues
            const { CreateMLCEngine } = await import('@mlc-ai/web-llm');

            const progressCallback = (report: InitProgressReport) => {
                setLoadProgress(Math.round(report.progress * 100));
                setLoadStatus(report.text);
            };

            const engine = await CreateMLCEngine(modelId, {
                initProgressCallback: progressCallback,
            });

            engineRef.current = engine;
            setCurrentModel(modelId);
            setIsReady(true);
            setIsLoading(false);
            setLoadStatus('Model ready!');

            return true;
        } catch (e) {
            console.error('Failed to load LLM:', e);
            setError(e instanceof Error ? e.message : 'Failed to load model');
            setIsLoading(false);
            return false;
        }
    }, [isLoading, defaultModel, checkWebGPU]);

    // Generate a completion
    const generate = useCallback(async (
        messages: ChatMessage[],
        options?: { temperature?: number; maxTokens?: number }
    ): Promise<string | null> => {
        if (!engineRef.current || !isReady) {
            setError('Model not loaded. Call initEngine() first.');
            return null;
        }

        setIsGenerating(true);
        setError(null);

        try {
            const response: ChatCompletionResponse = await engineRef.current.chat.completions.create({
                messages,
                temperature: options?.temperature ?? 0.7,
                max_tokens: options?.maxTokens ?? 512,
            });

            setIsGenerating(false);
            return response.choices[0]?.message?.content || null;
        } catch (e) {
            console.error('Generation error:', e);
            setError(e instanceof Error ? e.message : 'Generation failed');
            setIsGenerating(false);
            return null;
        }
    }, [isReady]);

    // Streaming generation
    const generateStream = useCallback(async (
        messages: ChatMessage[],
        onChunk: (chunk: string) => void,
        options?: { temperature?: number; maxTokens?: number }
    ): Promise<string | null> => {
        if (!engineRef.current || !isReady) {
            setError('Model not loaded. Call initEngine() first.');
            return null;
        }

        setIsGenerating(true);
        setError(null);
        let fullResponse = '';

        try {
            const stream = await engineRef.current.chat.completions.create({
                messages,
                temperature: options?.temperature ?? 0.7,
                max_tokens: options?.maxTokens ?? 512,
                stream: true,
            });

            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || '';
                fullResponse += content;
                onChunk(content);
            }

            setIsGenerating(false);
            return fullResponse;
        } catch (e) {
            console.error('Streaming error:', e);
            setError(e instanceof Error ? e.message : 'Streaming failed');
            setIsGenerating(false);
            return null;
        }
    }, [isReady]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (engineRef.current) {
                // WebLLM engines should be terminated
                engineRef.current = null;
            }
        };
    }, []);

    return {
        // State
        isLoading,
        isGenerating,
        isReady,
        loadProgress,
        loadStatus,
        error,
        currentModel,
        modelInfo: currentModel ? MODEL_INFO[currentModel] : null,

        // Actions
        initEngine,
        generate,
        generateStream,
        checkWebGPU,

        // Available models
        availableModels: MODEL_INFO,
    };
}

// Chess-specific prompt templates
export const CHESS_PROMPTS = {
    viralCaption: (gameInfo: { winner: string; keyMove: string; vibe: string }) => ({
        system: `You are a Gen-Z social media manager for a chess app called ZeroGambit. 
Your job is to write viral TikTok/Instagram Reels captions that make chess look cool and exciting.
Use emojis, trending phrases, and hooks that make people want to watch.
Keep captions under 150 characters. Include 3-5 relevant hashtags.`,
        user: `Game Details:
- Winner: ${gameInfo.winner}
- Key Moment: ${gameInfo.keyMove}
- Vibe: ${gameInfo.vibe}

Write 3 different viral captions for this game.`,
    }),

    moveExplanation: (fen: string, move: string, eval_score: string) => ({
        system: `You are a friendly chess coach explaining moves to intermediate players.
Keep explanations concise (2-3 sentences max). Focus on the strategic idea, not notation.
Use chess concepts but explain them naturally.`,
        user: `Position: ${fen}
Move played: ${move}
Engine evaluation: ${eval_score}

Explain why this move is good/bad in simple terms.`,
    }),

    gameAnalysis: (pgn: string) => ({
        system: `You are a chess analyst summarizing games for content creators.
Identify: 1) The turning point, 2) Brilliant/blunder moments, 3) The "story" of the game.
Keep it conversational and exciting.`,
        user: `Analyze this game and give me a hook-worthy summary:
${pgn}`,
    }),
};
