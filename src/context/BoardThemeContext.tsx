"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { BoardTheme, BOARD_THEMES } from "@/components/ChessBoard";

interface BoardThemeContextType {
    theme: BoardTheme;
    setTheme: (theme: BoardTheme) => void;
    boardSize: number; // 0.5 to 1.0 (multiplier of max width)
    setBoardSize: (size: number) => void;
}

const BoardThemeContext = createContext<BoardThemeContextType | undefined>(undefined);

export function BoardThemeProvider({ children }: { children: ReactNode }) {
    // Default to 'green' and 1.0 size
    const [theme, setThemeState] = useState<BoardTheme>("green");
    const [boardSize, setBoardSizeState] = useState(1.0);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Load from localStorage on client mount
        const storedTheme = localStorage.getItem("board-theme") as BoardTheme;
        if (storedTheme && BOARD_THEMES[storedTheme]) {
            setThemeState(storedTheme);
        }

        const storedSize = localStorage.getItem("board-size");
        if (storedSize) {
            setBoardSizeState(parseFloat(storedSize));
        }

        setMounted(true);
    }, []);

    const setTheme = (newTheme: BoardTheme) => {
        setThemeState(newTheme);
        localStorage.setItem("board-theme", newTheme);
    };

    const setBoardSize = (newSize: number) => {
        setBoardSizeState(newSize);
        localStorage.setItem("board-size", newSize.toString());
    };

    // Avoid hydration mismatch by rendering children without context influence until mounted? 
    // Or just render with default and flip. 
    // To be perfectly safe against flashing, we might want to wait, but for CSS it's better to show something.
    // 'green' is a safe default.

    return (
        <BoardThemeContext.Provider value={{ theme, setTheme, boardSize, setBoardSize }}>
            {children}
        </BoardThemeContext.Provider>
    );
}

export function useBoardTheme() {
    const context = useContext(BoardThemeContext);
    if (!context) {
        throw new Error("useBoardTheme must be used within a BoardThemeProvider");
    }
    return context;
}
