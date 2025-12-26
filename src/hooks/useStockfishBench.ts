/**
 * Hardware Benchmarking Hook
 * 
 * Uses Stockfish WASM to benchmark the user's device
 * and classify their hardware tier for adaptive UI/engine depth.
 */

"use client";

import { useState, useCallback, useRef } from 'react';

export type HardwareTier = 'grandmaster' | 'master' | 'club' | 'unknown';

export interface BenchmarkResult {
    tier: HardwareTier;
    nps: number; // Nodes per second
    label: string;
    recommendations: {
        engineDepth: number;
        enableParticles: boolean;
        enableShaders: boolean;
    };
}

const TIER_CONFIG: Record<Exclude<HardwareTier, 'unknown'>, { minNps: number; label: string; recommendations: BenchmarkResult['recommendations'] }> = {
    grandmaster: {
        minNps: 2_000_000,
        label: 'Grandmaster Rig',
        recommendations: {
            engineDepth: 24,
            enableParticles: true,
            enableShaders: true,
        },
    },
    master: {
        minNps: 1_000_000,
        label: 'Master Rig',
        recommendations: {
            engineDepth: 20,
            enableParticles: true,
            enableShaders: true,
        },
    },
    club: {
        minNps: 0,
        label: 'Club Player',
        recommendations: {
            engineDepth: 16,
            enableParticles: false,
            enableShaders: false,
        },
    },
};

function classifyTier(nps: number): Exclude<HardwareTier, 'unknown'> {
    if (nps >= TIER_CONFIG.grandmaster.minNps) return 'grandmaster';
    if (nps >= TIER_CONFIG.master.minNps) return 'master';
    return 'club';
}

export function useStockfishBench() {
    const [isRunning, setIsRunning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState<string>('');
    const [result, setResult] = useState<BenchmarkResult | null>(null);
    const workerRef = useRef<Worker | null>(null);

    const runBenchmark = useCallback(async (): Promise<BenchmarkResult | null> => {
        if (isRunning) return null;

        setIsRunning(true);
        setProgress(0);
        setStatus('Initializing Stockfish...');

        return new Promise((resolve) => {
            try {
                // Check if we have a cached result
                const cached = localStorage.getItem('hardware_benchmark');
                if (cached) {
                    const cachedResult = JSON.parse(cached) as BenchmarkResult;
                    // Use cache if less than 7 days old
                    const cacheAge = Date.now() - (JSON.parse(localStorage.getItem('hardware_benchmark_time') || '0'));
                    if (cacheAge < 7 * 24 * 60 * 60 * 1000) {
                        setResult(cachedResult);
                        setIsRunning(false);
                        setProgress(100);
                        setStatus('Loaded from cache');
                        resolve(cachedResult);
                        return;
                    }
                }

                // Create Stockfish worker
                const worker = new Worker('/stockfish/stockfish.js');
                workerRef.current = worker;

                let benchOutput = '';
                let nps = 0;
                let uciReady = false;
                let engineReady = false;

                // Timeout if benchmark takes too long
                const timeout = setTimeout(() => {
                    console.warn('Benchmark timeout - using fallback');
                    setStatus('Benchmark timeout');
                    setIsRunning(false);
                    worker.terminate();
                    workerRef.current = null;

                    const fallback: BenchmarkResult = {
                        tier: 'club',
                        nps: 500000,
                        label: 'Club Player (timeout)',
                        recommendations: TIER_CONFIG.club.recommendations,
                    };
                    setResult(fallback);
                    resolve(fallback);
                }, 30000); // 30 second timeout

                worker.onmessage = (e: MessageEvent) => {
                    const message = e.data;

                    if (typeof message === 'string') {
                        // UCI initialization complete
                        if (message.includes('uciok')) {
                            uciReady = true;
                            setProgress(15);
                            setStatus('UCI initialized, preparing engine...');
                            worker.postMessage('isready');
                        }

                        // Engine is ready
                        if (message.includes('readyok')) {
                            engineReady = true;
                            setProgress(30);
                            setStatus('Engine ready, running benchmark...');
                            worker.postMessage('bench');
                        }

                        // Parse bench output for NPS
                        if (message.includes('Nodes/second')) {
                            const match = message.match(/Nodes\/second\s*:\s*(\d+)/);
                            if (match) {
                                nps = parseInt(match[1], 10);
                            }
                        }

                        // Track progress through bench phases
                        if (message.includes('position') && engineReady) {
                            setProgress((prev) => Math.min(prev + 8, 90));
                        }

                        benchOutput += message + '\n';

                        // Bench complete
                        if (message.includes('Total time') || message.includes('Nodes searched')) {
                            clearTimeout(timeout);
                            setProgress(100);
                            setStatus('Benchmark complete!');

                            const tier = classifyTier(nps);
                            const config = TIER_CONFIG[tier];

                            const benchResult: BenchmarkResult = {
                                tier,
                                nps,
                                label: config.label,
                                recommendations: config.recommendations,
                            };

                            // Cache the result
                            localStorage.setItem('hardware_benchmark', JSON.stringify(benchResult));
                            localStorage.setItem('hardware_benchmark_time', JSON.stringify(Date.now()));
                            localStorage.setItem('hardware_tier', tier);

                            setResult(benchResult);
                            setIsRunning(false);
                            worker.terminate();
                            workerRef.current = null;

                            resolve(benchResult);
                        }
                    }
                };

                worker.onerror = (error) => {
                    clearTimeout(timeout);
                    console.error('Stockfish worker error:', error);
                    setStatus('Benchmark failed');
                    setIsRunning(false);
                    worker.terminate();
                    workerRef.current = null;

                    // Return a fallback result
                    const fallback: BenchmarkResult = {
                        tier: 'club',
                        nps: 0,
                        label: 'Unknown (fallback)',
                        recommendations: TIER_CONFIG.club.recommendations,
                    };
                    setResult(fallback);
                    resolve(fallback);
                };

                // Start UCI initialization
                setStatus('Starting UCI...');
                setProgress(5);
                worker.postMessage('uci');

            } catch (error) {
                console.error('Benchmark error:', error);
                setIsRunning(false);
                setStatus('Benchmark failed');
                resolve(null);
            }
        });
    }, [isRunning]);

    const cancelBenchmark = useCallback(() => {
        if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
        }
        setIsRunning(false);
        setProgress(0);
        setStatus('Cancelled');
    }, []);

    const getCachedResult = useCallback((): BenchmarkResult | null => {
        try {
            const cached = localStorage.getItem('hardware_benchmark');
            return cached ? JSON.parse(cached) : null;
        } catch {
            return null;
        }
    }, []);

    const clearCache = useCallback(() => {
        localStorage.removeItem('hardware_benchmark');
        localStorage.removeItem('hardware_benchmark_time');
        localStorage.removeItem('hardware_tier');
        setResult(null);
    }, []);

    return {
        runBenchmark,
        cancelBenchmark,
        getCachedResult,
        clearCache,
        isRunning,
        progress,
        status,
        result,
    };
}

/**
 * Get the current hardware tier from localStorage
 * Useful for quick checks without running the full hook
 */
export function getHardwareTier(): HardwareTier {
    if (typeof window === 'undefined') return 'unknown';
    return (localStorage.getItem('hardware_tier') as HardwareTier) || 'unknown';
}
