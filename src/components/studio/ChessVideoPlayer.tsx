'use client';

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { Player, PlayerRef } from '@remotion/player';
import { ChessGameVideo, ChessMove, ChessVideoProps } from '@/remotion/ChessGameVideo';

/**
 * Chess Video Player Component
 * 
 * Wraps the Remotion Player for use in Next.js app.
 * Provides controls for playback, seeking, and fullscreen.
 */

interface ChessVideoPlayerProps {
    moves: ChessMove[];
    white: string;
    black: string;
    event?: string;
    result: string;
    theme?: 'dark' | 'light' | 'neon';
    showAnalysis?: boolean;
    watermark?: boolean;
    onExportRequest?: () => void;
    className?: string;
}

export const ChessVideoPlayer: React.FC<ChessVideoPlayerProps> = ({
    moves,
    white,
    black,
    event = 'Chess Game',
    result,
    theme = 'neon',
    showAnalysis = true,
    watermark = true,
    onExportRequest,
    className = '',
}) => {
    const playerRef = useRef<PlayerRef>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentFrame, setCurrentFrame] = useState(0);
    const [isMounted, setIsMounted] = useState(false);

    // Calculate video duration based on moves
    const framesPerMove = 30;
    const endFrames = 60; // Extra frames at the end for result display
    const durationInFrames = moves.length * framesPerMove + endFrames;
    const fps = 30;

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Event handlers
    const handlePlayPause = useCallback(() => {
        if (!playerRef.current) return;

        if (isPlaying) {
            playerRef.current.pause();
        } else {
            playerRef.current.play();
        }
    }, [isPlaying]);

    const handleSeek = useCallback((frameNumber: number) => {
        if (!playerRef.current) return;
        playerRef.current.seekTo(frameNumber);
        setCurrentFrame(frameNumber);
    }, []);

    const handleRestart = useCallback(() => {
        if (!playerRef.current) return;
        playerRef.current.seekTo(0);
        playerRef.current.play();
    }, []);

    // Note: Remotion Player doesn't support addEventListener on PlayerRef
    // We use the controls={false} and manage state manually via play/pause callbacks

    if (!isMounted) {
        return (
            <div className={`aspect-video bg-black rounded-xl flex items-center justify-center ${className}`}>
                <div className="animate-pulse text-gray-400">Loading player...</div>
            </div>
        );
    }

    const inputProps: ChessVideoProps = {
        moves,
        white,
        black,
        event,
        result,
        theme,
        showAnalysis,
        watermark,
    };

    const currentMove = Math.floor(currentFrame / framesPerMove);
    const totalSeconds = durationInFrames / fps;
    const currentSeconds = currentFrame / fps;

    return (
        <div className={`flex flex-col gap-4 ${className}`}>
            {/* Video Player */}
            <div className="relative rounded-xl overflow-hidden shadow-2xl">
                <Player
                    ref={playerRef}
                    component={ChessGameVideo as unknown as React.ComponentType<Record<string, unknown>>}
                    inputProps={inputProps as unknown as Record<string, unknown>}
                    durationInFrames={durationInFrames}
                    compositionWidth={1920}
                    compositionHeight={1080}
                    fps={fps}
                    style={{
                        width: '100%',
                        aspectRatio: '16 / 9',
                    }}
                    controls={false}
                />
            </div>

            {/* Custom Controls */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-4">
                {/* Progress bar */}
                <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground w-12">
                        {formatTime(currentSeconds)}
                    </span>
                    <input
                        type="range"
                        min={0}
                        max={durationInFrames}
                        value={currentFrame}
                        onChange={(e) => handleSeek(parseInt(e.target.value))}
                        className="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <span className="text-xs text-muted-foreground w-12 text-right">
                        {formatTime(totalSeconds)}
                    </span>
                </div>

                {/* Control buttons */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleRestart}
                            className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                            title="Restart"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>

                        <button
                            onClick={handlePlayPause}
                            className="p-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                            title={isPlaying ? 'Pause' : 'Play'}
                        >
                            {isPlaying ? (
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <rect x="6" y="4" width="4" height="16" rx="1" />
                                    <rect x="14" y="4" width="4" height="16" rx="1" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            )}
                        </button>
                    </div>

                    {/* Move indicator */}
                    <div className="text-sm text-muted-foreground">
                        Move {Math.min(currentMove + 1, moves.length)} of {moves.length}
                    </div>

                    {/* Export button */}
                    {onExportRequest && (
                        <button
                            onClick={onExportRequest}
                            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-black rounded-lg font-medium hover:bg-amber-400 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Export Video
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default ChessVideoPlayer;
