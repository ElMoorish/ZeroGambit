"use client";

import React, { useMemo } from "react";
import { Chessboard as ReactChessboard } from "react-chessboard";
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
    hintMove?: { from: string; to: string };
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
    id = "BasicBoard",
}: ChessBoardProps) {
    // Get theme from context
    let contextTheme: BoardTheme = "green";
    let boardSize = 1.0;

    try {
        const ctx = useBoardTheme();
        contextTheme = ctx.theme;
        boardSize = ctx.boardSize;
    } catch (e) {
        // Context not found, use defaults
    }

    const currentThemeName = propTheme || contextTheme;
    const currentTheme = BOARD_THEMES[currentThemeName] || BOARD_THEMES.green;

    // Custom Square Styles (Highlights for best moves, blunders, hints)
    const customSquareStyles = useMemo(() => {
        const styles: Record<string, React.CSSProperties> = {};

        if (hintMove) {
            styles[hintMove.from] = {
                backgroundColor: 'rgba(251, 191, 36, 0.5)',
                boxShadow: 'inset 0 0 8px rgba(251, 191, 36, 0.8)'
            };
            styles[hintMove.to] = {
                backgroundColor: 'rgba(245, 158, 11, 0.5)',
                boxShadow: 'inset 0 0 8px rgba(245, 158, 11, 0.8)'
            };
        }

        if (bestMove) {
            styles[bestMove.from] = { backgroundColor: 'rgba(52, 211, 153, 0.5)' };
            styles[bestMove.to] = { backgroundColor: 'rgba(52, 211, 153, 0.5)' };
        }

        if (blunderMove) {
            styles[blunderMove.from] = { backgroundColor: 'rgba(248, 113, 113, 0.6)' };
            styles[blunderMove.to] = { backgroundColor: 'rgba(220, 38, 38, 0.6)' };
        }

        return styles;
    }, [bestMove, blunderMove, hintMove]);

    // Cast to any for v5 API compatibility
    const ChessboardComponent = ReactChessboard as any;

    // react-chessboard v5 requires ALL props inside an `options` object
    // Removed custom pieces to use default Lichess-style pieces
    const chessboardOptions = {
        id,
        position,
        boardOrientation: orientation,
        arePiecesDraggable: interactable,
        darkSquareStyle: { backgroundColor: currentTheme.dark },
        lightSquareStyle: { backgroundColor: currentTheme.light },
        squareStyles: customSquareStyles,
        animationDuration: 200,
        // v5 API: onPieceDrop receives an event object
        onPieceDrop: (event: { sourceSquare: string; targetSquare: string; piece?: any }) => {
            if (onMove && event.targetSquare) {
                return onMove(event.sourceSquare, event.targetSquare);
            }
            return false;
        },
    };

    return (
        <div
            className="w-full mx-auto select-none border-4 border-[#4d4d4d] rounded-lg shadow-2xl overflow-hidden bg-[#262421]"
            style={{ maxWidth: `${600 * boardSize}px` }}
        >
            <ChessboardComponent options={chessboardOptions} />
        </div>
    );
}
