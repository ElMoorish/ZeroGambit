/**
 * PGN Analysis Utilities
 * 
 * Parse PGN, detect input type, and run Stockfish analysis
 * to find key moments (brilliancies, blunders, turning points).
 */

import { Chess } from 'chess.js';

export type InputType = 'pgn' | 'fen' | 'text';

export interface KeyMoment {
    moveNumber: number;
    move: string;
    type: 'brilliancy' | 'blunder' | 'turning_point' | 'sacrifice';
    evalBefore: number;
    evalAfter: number;
    description: string;
}

export interface GameAnalysis {
    inputType: InputType;
    winner: 'white' | 'black' | 'draw' | 'unknown';
    totalMoves: number;
    opening: string;
    keyMoments: KeyMoment[];
    vibe: string;
    summary: string;
}

/**
 * Detect the type of input (PGN, FEN, or natural text)
 */
export function detectInputType(input: string): InputType {
    const trimmed = input.trim();

    // Check for FEN pattern (position notation)
    const fenRegex = /^[rnbqkpRNBQKP1-8\/]+\s+[wb]\s+[KQkq-]+\s+[a-h1-8-]+\s+\d+\s+\d+$/;
    if (fenRegex.test(trimmed)) {
        return 'fen';
    }

    // Check for PGN patterns
    const hasPgnHeaders = /\[Event\s+"/.test(trimmed) || /\[White\s+"/.test(trimmed);
    const hasMoveNumbers = /1\.\s*[a-hNBRQKO]/.test(trimmed);
    const hasChessNotation = /[NBRQK]?[a-h]?[1-8]?x?[a-h][1-8][+#]?/.test(trimmed);

    if (hasPgnHeaders || (hasMoveNumbers && hasChessNotation)) {
        return 'pgn';
    }

    return 'text';
}

/**
 * Parse PGN and extract basic game info
 */
export function parsePGN(pgn: string): {
    headers: Record<string, string>;
    moves: string[];
    result: string;
} | null {
    try {
        const chess = new Chess();
        chess.loadPgn(pgn);

        const headers: Record<string, string> = {};
        const history = chess.history();

        // Extract headers
        const headerRegex = /\[(\w+)\s+"([^"]+)"\]/g;
        let match;
        while ((match = headerRegex.exec(pgn)) !== null) {
            headers[match[1]] = match[2];
        }

        return {
            headers,
            moves: history,
            result: headers['Result'] || '*',
        };
    } catch (e) {
        console.error('Failed to parse PGN:', e);
        return null;
    }
}

/**
 * Determine the winner from game result
 */
export function getWinner(result: string): 'white' | 'black' | 'draw' | 'unknown' {
    if (result === '1-0') return 'white';
    if (result === '0-1') return 'black';
    if (result === '1/2-1/2') return 'draw';
    return 'unknown';
}

/**
 * Detect game "vibe" from moves and result
 */
export function detectGameVibe(moves: string[], result: string): string {
    const totalMoves = moves.length;
    const captures = moves.filter(m => m.includes('x')).length;
    const checks = moves.filter(m => m.includes('+') || m.includes('#')).length;
    const castles = moves.filter(m => m.includes('O-O')).length;

    const captureRatio = captures / totalMoves;
    const checkRatio = checks / totalMoves;

    if (totalMoves < 30 && checkRatio > 0.1) return 'Tactical Blitz';
    if (captureRatio > 0.4) return 'Chaotic Battle';
    if (totalMoves > 60) return 'Endgame Grind';
    if (castles === 0 && totalMoves > 20) return 'Risky Play';
    if (result === '1/2-1/2') return 'Tense Draw';

    return 'Exciting Match';
}

/**
 * Generate a quick summary without Stockfish (fast path)
 */
export function quickAnalysis(input: string): GameAnalysis {
    const inputType = detectInputType(input);

    if (inputType === 'pgn') {
        const parsed = parsePGN(input);
        if (parsed) {
            return {
                inputType: 'pgn',
                winner: getWinner(parsed.result),
                totalMoves: parsed.moves.length,
                opening: parsed.headers['Opening'] || parsed.headers['ECO'] || 'Unknown',
                keyMoments: [], // Would need Stockfish for deep analysis
                vibe: detectGameVibe(parsed.moves, parsed.result),
                summary: `${parsed.moves.length} move game. ${parsed.headers['White'] || 'White'} vs ${parsed.headers['Black'] || 'Black'}. Result: ${parsed.result}`,
            };
        }
    }

    if (inputType === 'fen') {
        return {
            inputType: 'fen',
            winner: 'unknown',
            totalMoves: 0,
            opening: 'N/A',
            keyMoments: [],
            vibe: 'Position Analysis',
            summary: 'Single position for analysis',
        };
    }

    // Natural text - extract what we can
    const lowerInput = input.toLowerCase();
    const vibeKeywords: Record<string, string> = {
        'sacrifice': 'Sacrificial Attack',
        'queen': 'Queen Drama',
        'checkmate': 'Decisive Finish',
        'blunder': 'Comeback Story',
        'win': 'Victory',
        'draw': 'Fighting Draw',
    };

    let detectedVibe = 'Exciting Game';
    for (const [keyword, vibe] of Object.entries(vibeKeywords)) {
        if (lowerInput.includes(keyword)) {
            detectedVibe = vibe;
            break;
        }
    }

    return {
        inputType: 'text',
        winner: lowerInput.includes('win') ? 'white' : 'unknown',
        totalMoves: 0,
        opening: 'N/A',
        keyMoments: [],
        vibe: detectedVibe,
        summary: input.slice(0, 200),
    };
}

/**
 * Format analysis for AI prompt
 */
export function formatAnalysisForPrompt(analysis: GameAnalysis): string {
    return `
Game Type: ${analysis.inputType.toUpperCase()}
Winner: ${analysis.winner}
Total Moves: ${analysis.totalMoves || 'N/A'}
Opening: ${analysis.opening}
Vibe: ${analysis.vibe}
Summary: ${analysis.summary}
`.trim();
}
