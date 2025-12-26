/**
 * Sonic Identity - Audio Manager
 * 
 * Stone & Sage sound design:
 * - Heavy, matte "thock" for moves (stone on wood)
 * - Subtle ambient soundscape
 */

"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Howl, Howler } from 'howler';

interface SoundConfig {
    src: string;
    volume?: number;
    loop?: boolean;
}

const SOUNDS: Record<string, SoundConfig> = {
    move: { src: '/sounds/stone-move.mp3', volume: 0.6 },
    capture: { src: '/sounds/stone-capture.mp3', volume: 0.7 },
    check: { src: '/sounds/stone-check.mp3', volume: 0.8 },
    success: { src: '/sounds/success.mp3', volume: 0.5 },
    error: { src: '/sounds/error.mp3', volume: 0.3 },
    ambient: { src: '/sounds/ambient.mp3', volume: 0.05, loop: true },
};

export function useSonicIdentity() {
    const [isMuted, setIsMuted] = useState(true);
    const [isAmbientPlaying, setIsAmbientPlaying] = useState(false);
    const soundsRef = useRef<Map<string, Howl>>(new Map());
    const ambientRef = useRef<Howl | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const savedMuted = localStorage.getItem('sonic_muted');
        if (savedMuted !== null) {
            setIsMuted(savedMuted === 'true');
        }

        // Load sounds with error handling for missing files
        Object.entries(SOUNDS).forEach(([key, config]) => {
            if (key !== 'ambient') {
                try {
                    const howl = new Howl({
                        src: [config.src],
                        volume: config.volume || 0.5,
                        preload: true,
                        onloaderror: () => {
                            console.debug(`[Audio] Sound not found: ${config.src}`);
                        },
                    });
                    soundsRef.current.set(key, howl);
                } catch {
                    // Silently fail - sounds are optional
                }
            }
        });

        try {
            ambientRef.current = new Howl({
                src: [SOUNDS.ambient.src],
                volume: SOUNDS.ambient.volume,
                loop: true,
                preload: true,
                onloaderror: () => {
                    console.debug(`[Audio] Ambient sound not found`);
                },
            });
        } catch {
            // Silently fail - ambient is optional
        }

        return () => {
            soundsRef.current.forEach(sound => sound.unload());
            ambientRef.current?.unload();
        };
    }, []);

    useEffect(() => {
        Howler.mute(isMuted);
        localStorage.setItem('sonic_muted', String(isMuted));

        if (isMuted && ambientRef.current) {
            ambientRef.current.pause();
            setIsAmbientPlaying(false);
        }
    }, [isMuted]);

    const play = useCallback((soundKey: keyof typeof SOUNDS) => {
        if (isMuted) return;
        const sound = soundsRef.current.get(soundKey);
        if (sound) {
            sound.play();
        }
    }, [isMuted]);

    const toggleAmbient = useCallback(() => {
        if (!ambientRef.current || isMuted) return;

        if (isAmbientPlaying) {
            ambientRef.current.pause();
            setIsAmbientPlaying(false);
        } else {
            ambientRef.current.play();
            setIsAmbientPlaying(true);
        }
    }, [isMuted, isAmbientPlaying]);

    const toggleMute = useCallback(() => {
        setIsMuted(prev => !prev);
    }, []);

    return {
        play,
        toggleAmbient,
        toggleMute,
        isMuted,
        isAmbientPlaying,
    };
}

export function SonicToggle() {
    const { isMuted, toggleMute } = useSonicIdentity();

    const buttonClass = `fixed bottom-4 left-4 z-50 p-3 rounded-full border transition-all ${isMuted
        ? 'bg-card border-border text-muted-foreground hover:text-foreground'
        : 'bg-primary/10 border-primary/30 text-primary'
        }`;

    return (
        <button
            onClick={toggleMute}
            className={buttonClass}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
            title={isMuted ? 'Enable Sound' : 'Disable Sound'}
        >
            {isMuted ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                    />
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                    />
                </svg>
            ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                    />
                </svg>
            )}
        </button>
    );
}
