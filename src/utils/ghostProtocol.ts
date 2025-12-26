/**
 * Ghost Protocol - Zero-Cost Async Multiplayer
 * 
 * Compresses game replays into URL-safe strings for sharing
 * without requiring a server backend.
 */

import LZString from 'lz-string';

/**
 * Represents a recorded game/puzzle replay
 */
export interface GhostReplay {
    /** Puzzle ID or starting FEN */
    p: string;
    /** Recorded moves with timestamps (ms from start) */
    m: { t: number; m: string }[];
    /** Player username */
    u: string;
    /** Mode: 'puzzle' | 'rapid' | 'blitz' */
    mode?: string;
    /** Final result: 'solved' | 'failed' | time in ms */
    r?: string | number;
    /** Created timestamp */
    ts?: number;
}

/**
 * Compress a replay object into a URL-safe string
 * Uses LZ-String's URI-safe Base64 encoding
 */
export function encodeReplay(replay: GhostReplay): string {
    const json = JSON.stringify(replay);
    return LZString.compressToEncodedURIComponent(json);
}

/**
 * Decompress a URL-safe string back into a replay object
 */
export function decodeReplay(encoded: string): GhostReplay | null {
    try {
        const json = LZString.decompressFromEncodedURIComponent(encoded);
        if (!json) return null;
        return JSON.parse(json) as GhostReplay;
    } catch (error) {
        console.error('Failed to decode ghost replay:', error);
        return null;
    }
}

/**
 * Generate a shareable challenge URL
 */
export function generateChallengeUrl(replay: GhostReplay, baseUrl?: string): string {
    const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://zerogambit.com');
    const encoded = encodeReplay(replay);
    return `${base}/rivals?challenge=${encoded}`;
}

/**
 * Extract and decode a challenge from URL search params
 */
export function getReplayFromUrl(searchParams: URLSearchParams): GhostReplay | null {
    const challenge = searchParams.get('challenge');
    if (!challenge) return null;
    return decodeReplay(challenge);
}

/**
 * Estimate the size of an encoded replay
 * Useful for checking if we're under URL limits (~2KB recommended)
 */
export function estimateReplaySize(replay: GhostReplay): number {
    return encodeReplay(replay).length;
}

/**
 * Check if a replay is within safe URL limits
 * Most browsers support ~2000 chars, we use 1800 for safety
 */
export function isReplaySafe(replay: GhostReplay): boolean {
    return estimateReplaySize(replay) < 1800;
}
