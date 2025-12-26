"use client";

import { useMemo, useContext } from "react";
import { Chessboard as ReactChessboard } from "react-chessboard";
import { PIECE_COMPONENTS } from "./ChessPieces";

// We need to import the context, but careful about circular dependencies if Context imports BOARD_THEMES from here.
// Actually Context does import BOARD_THEMES from here.
// Simplest way is to dynamically require or just duplicate the hook usage if safe?
// No, circular dep is fine in Typescript usually as long as runtime is ok.
// But `useBoardTheme` imports Context which imports types...
// Let's just import the hook.
import { useBoardTheme } from "@/context/BoardThemeContext";

// Board Themes (Hex codes for react-chessboard)
export const BOARD_THEMES = {
    green: { name: "Green", light: "#eeeed2", dark: "#769656", highlight: "#baca2b" },
    blue: { name: "Blue", light: "#dee3e6", dark: "#8ca2ad", highlight: "#7e97a6" },
    wood: { name: "Wood", light: "#f0d9b5", dark: "#b58863", highlight: "#d8c39e" },
    purple: { name: "Purple", light: "#efefef", dark: "#8877b7", highlight: "#9d8cc9" },
};

export type BoardTheme = keyof typeof BOARD_THEMES;

interface ChessBoardProps {
    position: string; // FEN string
    onMove?: (from: string, to: string) => boolean;
    orientation?: "white" | "black";
    bestMove?: { from: string; to: string };
    blunderMove?: { from: string; to: string };
    hintMove?: { from: string; to: string }; // Hint highlighting (amber)
    interactable?: boolean;
    theme?: BoardTheme;
    id?: string;
}

export function ChessBoard({
    position,
    onMove,
    orientation = "white",
    bestMove,
    blunderMove,
    hintMove,
    interactable = true,
    theme: propTheme,
    id = "BasicBoard", // Default ID
}: ChessBoardProps) {
    // DEBUG: Always log position
    console.log(`[ChessBoard] id=${id} position=${position?.substring(0, 30)}...`);

    // Attempt to use context, fallback to prop, fallback to 'green'
    // But wait, hooks must be unconditional.
    // If context is missing (isolated test?), it might throw if useBoardTheme throws.
    // My useBoardTheme throws.
    // Ideally we assume ChessBoard is always wrapped.

    let contextTheme: BoardTheme = "green";
    let boardSize = 1.0;

    try {
        const ctx = useBoardTheme();
        contextTheme = ctx.theme;
        boardSize = ctx.boardSize;
    } catch (e) {
        // Context not found (e.g. strict unit test), ignore
    }

    const currentThemeName = propTheme || contextTheme;
    const currentTheme = BOARD_THEMES[currentThemeName] || BOARD_THEMES.green;

    // Custom Pieces Logic
    const customPieces = useMemo(() => {
        const pieces: Record<string, any> = {};
        const pieceMap = {
            'wP': 'P', 'wN': 'N', 'wB': 'B', 'wR': 'R', 'wQ': 'Q', 'wK': 'K',
            'bP': 'p', 'bN': 'n', 'bB': 'b', 'bR': 'r', 'bQ': 'q', 'bK': 'k'
        };

        Object.entries(pieceMap).forEach(([key, char]) => {
            const Component = PIECE_COMPONENTS[char];
            pieces[key] = ({ squareWidth }: { squareWidth: number }) => (
                <div style={{ width: squareWidth, height: squareWidth, padding: '10%' }}>
                    <Component className="w-full h-full drop-shadow-md" />
                </div>
            );
        });
        return pieces;
    }, []);

    // Custom Square Styles (Highlights)
    const customSquareStyles = useMemo(() => {
        const styles: Record<string, React.CSSProperties> = {};

        // Hint Move (Amber/Gold - subtle guide)
        if (hintMove) {
            styles[hintMove.from] = {
                backgroundColor: 'rgba(251, 191, 36, 0.5)', // amber-400
                boxShadow: 'inset 0 0 8px rgba(251, 191, 36, 0.8)'
            };
            styles[hintMove.to] = {
                backgroundColor: 'rgba(245, 158, 11, 0.5)', // amber-500
                boxShadow: 'inset 0 0 8px rgba(245, 158, 11, 0.8)'
            };
        }

        // Best Move (Emerald)
        if (bestMove) {
            styles[bestMove.from] = { backgroundColor: 'rgba(52, 211, 153, 0.5)' }; // emerald-400
            styles[bestMove.to] = { backgroundColor: 'rgba(52, 211, 153, 0.5)' };
        }

        // Blunder (Red)
        if (blunderMove) {
            styles[blunderMove.from] = { backgroundColor: 'rgba(248, 113, 113, 0.6)' }; // red-400
            styles[blunderMove.to] = { backgroundColor: 'rgba(220, 38, 38, 0.6)' }; // red-600
        }

        return styles;
    }, [bestMove, blunderMove, hintMove]);

    const ReactChessboardAny = ReactChessboard as any;

    // Build options object for react-chessboard v5
    const chessboardOptions = {
        position,
        boardOrientation: orientation,
        arePiecesDraggable: interactable,
        // v5 API: use darkSquareStyle, lightSquareStyle, squareStyles (NOT custom* prefixes)
        darkSquareStyle: { backgroundColor: currentTheme.dark },
        lightSquareStyle: { backgroundColor: currentTheme.light },
        squareStyles: customSquareStyles,
        customPieces: customPieces,
        animationDuration: 200,
        // v5 API: onPieceDrop receives an object, not positional args
        onPieceDrop: ({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string | null }) => {
            if (onMove && targetSquare) {
                return onMove(sourceSquare, targetSquare);
            }
            return false;
        },
    };

    return (
        <div
            className="w-full mx-auto select-none border-4 border-[#4d4d4d] rounded-lg shadow-2xl overflow-hidden bg-[#262421]"
            style={{ maxWidth: `${600 * boardSize}px` }}
        >
            <ReactChessboardAny
                id={id}
                options={chessboardOptions}
            />
        </div>
    );
}
