import React from 'react';
import {
    AbsoluteFill,
    useCurrentFrame,
    useVideoConfig,
    interpolate,
    Easing,
    spring,
    Sequence,
    Audio,
} from 'remotion';

/**
 * Chess Game Video Composition
 * 
 * Renders a chess game as an animated video with:
 * - Chessboard with piece animations
 * - Move notation overlay
 * - Analysis highlights
 * - Player info bars
 */

// Types
export interface ChessMove {
    from: string;
    to: string;
    san: string;
    piece: string;
    captured?: string;
    timestamp?: number;
}

export interface ChessVideoProps {
    moves: ChessMove[];
    white: string;
    black: string;
    event?: string;
    result: string;
    theme?: 'dark' | 'light' | 'neon';
    showAnalysis?: boolean;
    watermark?: boolean;
}

// Constants
const SQUARE_SIZE = 80;
const BOARD_SIZE = SQUARE_SIZE * 8;
const PIECES: Record<string, string> = {
    'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
    'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟',
};

const THEMES = {
    dark: {
        background: '#0a0a0a',
        lightSquare: '#769656',
        darkSquare: '#baca44',
        border: '#1a1a1a',
        text: '#ffffff',
        accent: '#7c3aed',
        highlight: 'rgba(255, 255, 0, 0.5)',
    },
    light: {
        background: '#f5f5f5',
        lightSquare: '#f0d9b5',
        darkSquare: '#b58863',
        border: '#333333',
        text: '#000000',
        accent: '#7c3aed',
        highlight: 'rgba(255, 255, 0, 0.5)',
    },
    neon: {
        background: '#0a0a0a',
        lightSquare: '#1a1a2e',
        darkSquare: '#16213e',
        border: '#7c3aed',
        text: '#e0e0e0',
        accent: '#a855f7',
        highlight: 'rgba(168, 85, 247, 0.5)',
    },
};

// Initial board position
const INITIAL_POSITION: Record<string, string> = {
    'a1': 'R', 'b1': 'N', 'c1': 'B', 'd1': 'Q', 'e1': 'K', 'f1': 'B', 'g1': 'N', 'h1': 'R',
    'a2': 'P', 'b2': 'P', 'c2': 'P', 'd2': 'P', 'e2': 'P', 'f2': 'P', 'g2': 'P', 'h2': 'P',
    'a7': 'p', 'b7': 'p', 'c7': 'p', 'd7': 'p', 'e7': 'p', 'f7': 'p', 'g7': 'p', 'h7': 'p',
    'a8': 'r', 'b8': 'n', 'c8': 'b', 'd8': 'q', 'e8': 'k', 'f8': 'b', 'g8': 'n', 'h8': 'r',
};

// Helper functions
function squareToCoords(square: string): { x: number; y: number } {
    const file = square.charCodeAt(0) - 97; // a=0, b=1, etc.
    const rank = parseInt(square[1]) - 1;
    return { x: file * SQUARE_SIZE, y: (7 - rank) * SQUARE_SIZE };
}

function isLightSquare(file: number, rank: number): boolean {
    return (file + rank) % 2 === 1;
}

// Chess piece component with animation
const ChessPiece: React.FC<{
    piece: string;
    x: number;
    y: number;
    animatedFrom?: { x: number; y: number };
    progress?: number;
}> = ({ piece, x, y, animatedFrom, progress = 1 }) => {
    const finalX = animatedFrom
        ? interpolate(progress, [0, 1], [animatedFrom.x, x], { easing: Easing.out(Easing.quad) })
        : x;
    const finalY = animatedFrom
        ? interpolate(progress, [0, 1], [animatedFrom.y, y], { easing: Easing.out(Easing.quad) })
        : y;

    const scale = interpolate(progress, [0, 0.5, 1], [1, 1.1, 1]);

    return (
        <div
            style={{
                position: 'absolute',
                left: finalX,
                top: finalY,
                width: SQUARE_SIZE,
                height: SQUARE_SIZE,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: SQUARE_SIZE * 0.7,
                transform: `scale(${scale})`,
                filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.5))',
                zIndex: animatedFrom ? 10 : 1,
            }}
        >
            {PIECES[piece]}
        </div>
    );
};

// Chessboard component
const Chessboard: React.FC<{
    position: Record<string, string>;
    lastMove?: { from: string; to: string };
    moveProgress?: number;
    theme: typeof THEMES.dark;
}> = ({ position, lastMove, moveProgress = 1, theme }) => {
    const squares: React.ReactNode[] = [];

    // Render squares
    for (let rank = 7; rank >= 0; rank--) {
        for (let file = 0; file < 8; file++) {
            const isLight = isLightSquare(file, rank);
            const isHighlighted = lastMove && (
                lastMove.from === String.fromCharCode(97 + file) + (rank + 1) ||
                lastMove.to === String.fromCharCode(97 + file) + (rank + 1)
            );

            squares.push(
                <div
                    key={`${file}-${rank}`}
                    style={{
                        position: 'absolute',
                        left: file * SQUARE_SIZE,
                        top: (7 - rank) * SQUARE_SIZE,
                        width: SQUARE_SIZE,
                        height: SQUARE_SIZE,
                        backgroundColor: isHighlighted
                            ? theme.highlight
                            : isLight
                                ? theme.lightSquare
                                : theme.darkSquare,
                    }}
                />
            );
        }
    }

    // Render pieces
    const pieces: React.ReactNode[] = [];
    for (const [square, piece] of Object.entries(position)) {
        const coords = squareToCoords(square);
        const isMovingPiece = lastMove && lastMove.to === square && moveProgress < 1;

        pieces.push(
            <ChessPiece
                key={square}
                piece={piece}
                x={coords.x}
                y={coords.y}
                animatedFrom={isMovingPiece ? squareToCoords(lastMove.from) : undefined}
                progress={isMovingPiece ? moveProgress : 1}
            />
        );
    }

    return (
        <div
            style={{
                position: 'relative',
                width: BOARD_SIZE,
                height: BOARD_SIZE,
                border: `4px solid ${theme.border}`,
                borderRadius: 8,
                overflow: 'hidden',
            }}
        >
            {squares}
            {pieces}
        </div>
    );
};

// Player info bar
const PlayerBar: React.FC<{
    name: string;
    color: 'white' | 'black';
    isActive: boolean;
    theme: typeof THEMES.dark;
}> = ({ name, color, isActive, theme }) => (
    <div
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 20px',
            backgroundColor: isActive ? theme.accent : 'rgba(255,255,255,0.1)',
            borderRadius: 8,
            transition: 'background-color 0.3s',
        }}
    >
        <div
            style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: color === 'white' ? '#ffffff' : '#333333',
                border: '2px solid rgba(255,255,255,0.3)',
            }}
        />
        <span
            style={{
                color: theme.text,
                fontWeight: 600,
                fontSize: 18,
            }}
        >
            {name}
        </span>
    </div>
);

// Move notation display
const MoveNotation: React.FC<{
    moves: string[];
    currentMoveIndex: number;
    theme: typeof THEMES.dark;
}> = ({ moves, currentMoveIndex, theme }) => (
    <div
        style={{
            backgroundColor: 'rgba(0,0,0,0.5)',
            borderRadius: 8,
            padding: 16,
            maxHeight: 300,
            overflow: 'hidden',
        }}
    >
        <div style={{ color: theme.accent, fontWeight: 600, marginBottom: 12 }}>
            Moves
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 14 }}>
            {moves.slice(0, Math.min(currentMoveIndex + 2, moves.length)).map((move, index) => (
                <div
                    key={index}
                    style={{
                        color: index === currentMoveIndex ? theme.accent : theme.text,
                        fontWeight: index === currentMoveIndex ? 700 : 400,
                        fontFamily: 'monospace',
                    }}
                >
                    {index % 2 === 0 ? `${Math.floor(index / 2) + 1}. ` : ''}{move}
                </div>
            ))}
        </div>
    </div>
);

// Watermark component
const Watermark: React.FC<{ show: boolean }> = ({ show }) => {
    if (!show) return null;

    return (
        <div
            style={{
                position: 'absolute',
                bottom: 20,
                right: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                backgroundColor: 'rgba(0,0,0,0.7)',
                padding: '8px 16px',
                borderRadius: 20,
            }}
        >
            <span style={{ fontSize: 20 }}>♟️</span>
            <span style={{ color: '#a855f7', fontWeight: 600, fontSize: 14 }}>
                ZeroGambit
            </span>
        </div>
    );
};

// Main composition
export const ChessGameVideo: React.FC<ChessVideoProps> = ({
    moves,
    white,
    black,
    event = 'Chess Game',
    result,
    theme: themeName = 'neon',
    showAnalysis = true,
    watermark = true,
}) => {
    const frame = useCurrentFrame();
    const { fps, durationInFrames } = useVideoConfig();

    const theme = THEMES[themeName];

    // Calculate which move we're on based on frame
    const framesPerMove = 30; // 1 second per move at 30fps
    const moveTransitionFrames = 15;
    const currentMoveIndex = Math.floor(frame / framesPerMove);
    const moveProgress = Math.min((frame % framesPerMove) / moveTransitionFrames, 1);

    // Build position from moves
    const position = { ...INITIAL_POSITION };
    let lastMove: { from: string; to: string } | undefined;

    for (let i = 0; i <= Math.min(currentMoveIndex, moves.length - 1); i++) {
        const move = moves[i];
        const isCurrentMove = i === currentMoveIndex;

        // Apply move to position
        if (!isCurrentMove || moveProgress === 1) {
            const piece = position[move.from];
            delete position[move.from];
            position[move.to] = piece;
        }

        if (isCurrentMove) {
            lastMove = { from: move.from, to: move.to };
        }
    }

    // Intro animation
    const introOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });
    const introScale = spring({ frame, fps, config: { damping: 15, stiffness: 100 } });

    // Determine who's turn
    const isWhiteTurn = currentMoveIndex % 2 === 0;

    return (
        <AbsoluteFill
            style={{
                backgroundColor: theme.background,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Inter', sans-serif",
                opacity: introOpacity,
            }}
        >
            {/* Header */}
            <div
                style={{
                    position: 'absolute',
                    top: 30,
                    color: theme.text,
                    fontSize: 24,
                    fontWeight: 600,
                    opacity: 0.8,
                }}
            >
                {event}
            </div>

            {/* Main content */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 40,
                    transform: `scale(${introScale})`,
                }}
            >
                {/* Left side - Players */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <PlayerBar name={black} color="black" isActive={!isWhiteTurn} theme={theme} />
                    <div style={{ height: BOARD_SIZE - 120 }} />
                    <PlayerBar name={white} color="white" isActive={isWhiteTurn} theme={theme} />
                </div>

                {/* Chessboard */}
                <Chessboard
                    position={position}
                    lastMove={lastMove}
                    moveProgress={moveProgress}
                    theme={theme}
                />

                {/* Right side - Moves */}
                {showAnalysis && (
                    <MoveNotation
                        moves={moves.map(m => m.san)}
                        currentMoveIndex={currentMoveIndex}
                        theme={theme}
                    />
                )}
            </div>

            {/* Result (at end) */}
            {currentMoveIndex >= moves.length && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: 80,
                        fontSize: 32,
                        fontWeight: 700,
                        color: theme.accent,
                    }}
                >
                    Result: {result}
                </div>
            )}

            {/* Watermark */}
            <Watermark show={watermark} />
        </AbsoluteFill>
    );
};

// Default export for Remotion
export default ChessGameVideo;
