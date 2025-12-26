"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Fuse from "fuse.js";
import { useRouter } from "next/navigation";
import {
    Search,
    ArrowRight,
    Home,
    Gamepad2,
    Trophy,
    BarChart3,
    Settings,
    Cpu,
    Swords,
    Dna,
    BookOpen,
    Video,
    Crown,
    Gift,
} from "lucide-react";

/**
 * Command Palette - "God Mode" Navigation
 * 
 * Trigger: Cmd+K (Mac) / Ctrl+K (Windows)
 * Features: Fuzzy search across all routes, openings, and settings.
 */

interface CommandItem {
    id: string;
    title: string;
    subtitle?: string;
    category: "navigation" | "opening" | "action";
    icon: React.ElementType;
    action: () => void;
}

// Command items
const createCommands = (router: ReturnType<typeof useRouter>): CommandItem[] => [
    // Navigation
    { id: "home", title: "Home", subtitle: "Go to homepage", category: "navigation", icon: Home, action: () => router.push("/") },
    { id: "games", title: "My Games", subtitle: "Import and view games", category: "navigation", icon: Gamepad2, action: () => router.push("/games") },
    { id: "puzzles", title: "Puzzles", subtitle: "Tactical training", category: "navigation", icon: Trophy, action: () => router.push("/puzzles") },
    { id: "curriculum", title: "Curriculum", subtitle: "Stone/Flow/Sage methodology", category: "navigation", icon: BookOpen, action: () => router.push("/curriculum") },
    { id: "trainer", title: "Opening Trainer", subtitle: "Practice openings", category: "navigation", icon: BookOpen, action: () => router.push("/trainer") },
    { id: "benchmark", title: "Benchmark", subtitle: "Test your hardware", category: "navigation", icon: Cpu, action: () => router.push("/benchmark") },
    { id: "rivals", title: "Rivals", subtitle: "Async multiplayer", category: "navigation", icon: Swords, action: () => router.push("/rivals") },
    { id: "dna", title: "Chess DNA", subtitle: "Your playing style", category: "navigation", icon: Dna, action: () => router.push("/dna") },
    { id: "studio", title: "Creator Studio", subtitle: "Make viral content", category: "navigation", icon: Video, action: () => router.push("/studio") },
    { id: "video-studio", title: "Video Studio", subtitle: "Create chess videos", category: "navigation", icon: Video, action: () => router.push("/video-studio") },
    { id: "pricing", title: "Pricing", subtitle: "Upgrade your plan", category: "navigation", icon: Crown, action: () => router.push("/pricing") },
    { id: "referrals", title: "Referrals", subtitle: "Earn $13.50 per referral", category: "navigation", icon: Gift, action: () => router.push("/referrals") },
    { id: "settings", title: "Settings", subtitle: "Preferences", category: "navigation", icon: Settings, action: () => router.push("/settings") },

    // Common Openings
    { id: "sicilian", title: "Sicilian Defense", subtitle: "1.e4 c5", category: "opening", icon: BookOpen, action: () => router.push("/trainer?opening=sicilian") },
    { id: "italian", title: "Italian Game", subtitle: "1.e4 e5 2.Nf3 Nc6 3.Bc4", category: "opening", icon: BookOpen, action: () => router.push("/trainer?opening=italian") },
    { id: "queens-gambit", title: "Queen's Gambit", subtitle: "1.d4 d5 2.c4", category: "opening", icon: BookOpen, action: () => router.push("/trainer?opening=queens-gambit") },
    { id: "kings-indian", title: "King's Indian Defense", subtitle: "1.d4 Nf6 2.c4 g6", category: "opening", icon: BookOpen, action: () => router.push("/trainer?opening=kings-indian") },
    { id: "french", title: "French Defense", subtitle: "1.e4 e6", category: "opening", icon: BookOpen, action: () => router.push("/trainer?opening=french") },
    { id: "caro-kann", title: "Caro-Kann Defense", subtitle: "1.e4 c6", category: "opening", icon: BookOpen, action: () => router.push("/trainer?opening=caro-kann") },
];

// Fuse.js options
const fuseOptions = {
    keys: ["title", "subtitle"],
    threshold: 0.3,
    includeScore: true,
};

export function CommandPalette() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const commands = createCommands(router);
    const fuse = new Fuse(commands, fuseOptions);

    // Search results
    const results = query
        ? fuse.search(query).map((r) => r.item)
        : commands;

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Open palette
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setIsOpen((prev) => !prev);
                setQuery("");
                setSelectedIndex(0);
            }

            // Close on escape
            if (e.key === "Escape") {
                setIsOpen(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Navigate with arrow keys
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((prev) => Math.max(prev - 1, 0));
            } else if (e.key === "Enter" && results[selectedIndex]) {
                e.preventDefault();
                results[selectedIndex].action();
                setIsOpen(false);
            }
        },
        [results, selectedIndex]
    );

    // Reset selected index when query changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
                    />

                    {/* Palette */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ type: "spring", duration: 0.3 }}
                        className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-xl z-[201]"
                    >
                        <div className="mx-4 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
                            {/* Search Input */}
                            <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-700">
                                <Search className="w-5 h-5 text-slate-400" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Search commands, openings..."
                                    className="flex-1 bg-transparent text-white placeholder:text-slate-500 outline-none text-lg"
                                />
                                <kbd className="hidden sm:inline-flex px-2 py-1 text-xs text-slate-400 bg-slate-800 rounded border border-slate-600">
                                    ESC
                                </kbd>
                            </div>

                            {/* Results */}
                            <div className="max-h-80 overflow-y-auto py-2">
                                {results.length === 0 ? (
                                    <div className="px-4 py-8 text-center text-slate-500">
                                        No results found
                                    </div>
                                ) : (
                                    results.map((item, index) => {
                                        const Icon = item.icon;
                                        const isSelected = index === selectedIndex;
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => {
                                                    item.action();
                                                    setIsOpen(false);
                                                }}
                                                onMouseEnter={() => setSelectedIndex(index)}
                                                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isSelected ? "bg-primary/20" : "hover:bg-slate-800"
                                                    }`}
                                            >
                                                <div
                                                    className={`p-2 rounded-lg ${isSelected ? "bg-primary/30" : "bg-slate-800"
                                                        }`}
                                                >
                                                    <Icon className={`w-4 h-4 ${isSelected ? "text-primary" : "text-slate-400"}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white font-medium truncate">{item.title}</p>
                                                    {item.subtitle && (
                                                        <p className="text-sm text-slate-400 truncate">{item.subtitle}</p>
                                                    )}
                                                </div>
                                                {isSelected && (
                                                    <ArrowRight className="w-4 h-4 text-primary" />
                                                )}
                                            </button>
                                        );
                                    })
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-4 py-3 border-t border-slate-700 flex items-center justify-between text-xs text-slate-500">
                                <span>
                                    <kbd className="px-1.5 py-0.5 bg-slate-800 rounded mr-1">↑↓</kbd>
                                    Navigate
                                </span>
                                <span>
                                    <kbd className="px-1.5 py-0.5 bg-slate-800 rounded mr-1">↵</kbd>
                                    Select
                                </span>
                                <span>
                                    <kbd className="px-1.5 py-0.5 bg-slate-800 rounded mr-1">⌘K</kbd>
                                    Toggle
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
