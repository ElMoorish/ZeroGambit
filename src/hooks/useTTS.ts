/**
 * Fast Multilingual TTS Hook using Web Speech API
 * 
 * Zero-cost, built into all modern browsers.
 * Supports 50+ languages depending on browser/OS.
 */

"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

export interface Voice {
    name: string;
    lang: string;
    localService: boolean;
}

export function useTTS() {
    const [voices, setVoices] = useState<Voice[]>([]);
    const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    // Initialize voices
    useEffect(() => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
            setIsSupported(false);
            return;
        }

        setIsSupported(true);

        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            const voiceList: Voice[] = availableVoices.map(v => ({
                name: v.name,
                lang: v.lang,
                localService: v.localService,
            }));
            setVoices(voiceList);

            // Auto-select a good default voice
            const englishVoice = availableVoices.find(v =>
                v.lang.startsWith('en') && v.localService
            );
            if (englishVoice && !selectedVoice) {
                setSelectedVoice(englishVoice.name);
            }
        };

        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;

        return () => {
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, [selectedVoice]);

    // Speak text
    const speak = useCallback((text: string, options?: {
        rate?: number;
        pitch?: number;
        volume?: number;
        voiceName?: string;
    }) => {
        if (!isSupported || !text.trim()) return;

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utteranceRef.current = utterance;

        // Set voice
        const voiceName = options?.voiceName || selectedVoice;
        if (voiceName) {
            const voice = window.speechSynthesis.getVoices().find(v => v.name === voiceName);
            if (voice) utterance.voice = voice;
        }

        // Set options
        utterance.rate = options?.rate ?? 1.0;
        utterance.pitch = options?.pitch ?? 1.0;
        utterance.volume = options?.volume ?? 1.0;

        // Event handlers
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
            setIsSpeaking(false);
            setIsPaused(false);
        };
        utterance.onerror = () => {
            setIsSpeaking(false);
            setIsPaused(false);
        };

        window.speechSynthesis.speak(utterance);
    }, [isSupported, selectedVoice]);

    // Pause/Resume/Stop
    const pause = useCallback(() => {
        if (isSupported && isSpeaking) {
            window.speechSynthesis.pause();
            setIsPaused(true);
        }
    }, [isSupported, isSpeaking]);

    const resume = useCallback(() => {
        if (isSupported && isPaused) {
            window.speechSynthesis.resume();
            setIsPaused(false);
        }
    }, [isSupported, isPaused]);

    const stop = useCallback(() => {
        if (isSupported) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            setIsPaused(false);
        }
    }, [isSupported]);

    // Get voices by language
    const getVoicesForLanguage = useCallback((langCode: string) => {
        return voices.filter(v => v.lang.startsWith(langCode));
    }, [voices]);

    return {
        speak,
        pause,
        resume,
        stop,
        voices,
        selectedVoice,
        setSelectedVoice,
        isSpeaking,
        isPaused,
        isSupported,
        getVoicesForLanguage,
    };
}

// Language codes for common languages
export const LANGUAGES = {
    en: 'English',
    es: 'Español',
    fr: 'Français',
    de: 'Deutsch',
    it: 'Italiano',
    pt: 'Português',
    ru: 'Русский',
    ja: '日本語',
    ko: '한국어',
    zh: '中文',
    ar: 'العربية',
    hi: 'हिन्दी',
};
