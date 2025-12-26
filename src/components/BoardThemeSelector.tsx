"use client";

import { Palette } from "lucide-react";
import { useBoardTheme } from "@/context/BoardThemeContext";
import { BOARD_THEMES, BoardTheme } from "@/components/ChessBoard";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

export function BoardThemeSelector() {
    const { theme, setTheme, boardSize, setBoardSize } = useBoardTheme();
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            // Position dropdown below and to the LEFT of the button
            setDropdownPosition({
                top: rect.bottom + 8,
                left: Math.max(8, rect.left - 200) // Open to the left, but don't go off-screen
            });
        }
    }, [isOpen]);

    const dropdownContent = (
        <>
            <div
                className="fixed inset-0 z-[9998]"
                onClick={() => setIsOpen(false)}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="fixed w-64 bg-popover border border-border rounded-xl shadow-2xl z-[9999] overflow-hidden"
                style={{
                    top: dropdownPosition.top,
                    left: dropdownPosition.left,
                    pointerEvents: 'auto'
                }}
            >
                <div className="p-4 space-y-4">
                    <div>
                        <h3 className="text-sm font-medium mb-3 text-muted-foreground">Board Theme</h3>
                        <div className="space-y-1">
                            {(Object.entries(BOARD_THEMES) as [BoardTheme, typeof BOARD_THEMES.green][]).map(([key, value]) => (
                                <button
                                    key={key}
                                    onClick={() => setTheme(key)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-3 transition-colors ${theme === key ? "bg-accent text-accent-foreground font-medium" : "hover:bg-muted"
                                        }`}
                                >
                                    <div
                                        className="w-4 h-4 rounded-full border border-border"
                                        style={{
                                            background: `linear-gradient(135deg, ${value.light} 50%, ${value.dark} 50%)`
                                        }}
                                    />
                                    {value.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-3 border-t border-border">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-muted-foreground">Size</h3>
                            <span className="text-xs font-mono">{Math.round(boardSize * 100)}%</span>
                        </div>
                        <input
                            type="range"
                            min="0.5"
                            max="1.0"
                            step="0.05"
                            value={boardSize}
                            onChange={(e) => setBoardSize(parseFloat(e.target.value))}
                            className="w-full accent-primary"
                        />
                    </div>
                </div>
            </motion.div>
        </>
    );

    return (
        <div className="relative z-[100]" style={{ pointerEvents: 'auto' }}>
            <button
                ref={buttonRef}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-colors border border-border cursor-pointer pointer-events-auto"
                title="Board Appearance"
                type="button"
            >
                <Palette className="w-5 h-5" />
            </button>

            {mounted && (
                <AnimatePresence>
                    {isOpen && createPortal(dropdownContent, document.body)}
                </AnimatePresence>
            )}
        </div>
    );
}
