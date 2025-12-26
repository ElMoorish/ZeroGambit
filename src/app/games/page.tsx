"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Trophy, Clock, User, ExternalLink, ChevronRight } from "lucide-react";
import { fetchGames, type GameData } from "@/lib/chess-apis";

interface Game {
    id: string;
    platform_id: string;
    white: { username: string; rating?: number };
    black: { username: string; rating?: number };
    result: string;
    date: string;
    time_class?: string;
    eco?: string;
    opening_name?: string;
    url?: string;
}

function GamesContent() {
    const searchParams = useSearchParams();
    const username = searchParams.get("username") || "";
    const platform = searchParams.get("platform") || "chesscom";

    const [games, setGames] = useState<Game[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fetchStatus, setFetchStatus] = useState<string>("Connecting to API...");

    useEffect(() => {
        if (!username) {
            setError("No username provided");
            setIsLoading(false);
            return;
        }

        const loadGames = async () => {
            try {
                setFetchStatus(`Fetching games for ${username} from ${platform === "chesscom" ? "Chess.com" : "Lichess"}...`);

                // Fetch directly from Chess.com/Lichess APIs
                const fetchedGames = await fetchGames(
                    username,
                    platform as "chesscom" | "lichess",
                    50 // Fetch up to 50 games
                );

                setFetchStatus(`Found ${fetchedGames.length} games`);
                setGames(fetchedGames);
                setIsLoading(false);
            } catch (err) {
                console.error("Failed to fetch games:", err);
                setError(err instanceof Error ? err.message : "Failed to fetch games");
                setIsLoading(false);
            }
        };

        loadGames();
    }, [username, platform]);

    // If no username, show search prompt instead of error
    if (!username && !isLoading) {
        return (
            <div className="min-h-screen bg-background">
                {/* Header with Search */}
                <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-40">
                    <div className="container mx-auto px-4 py-4 flex items-center gap-4">
                        <Link href="/" className="p-2 rounded-lg hover:bg-secondary transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-semibold flex items-center gap-2">
                                <User className="w-5 h-5 text-primary" />
                                Game Analysis
                            </h1>
                            <p className="text-sm text-muted-foreground">Enter a username to analyze games</p>
                        </div>
                    </div>
                </header>

                {/* Centered Search Form */}
                <main className="container mx-auto px-4 py-20">
                    <div className="max-w-md mx-auto text-center">
                        <h2 className="text-2xl font-bold mb-4">Analyze Your Games</h2>
                        <p className="text-muted-foreground mb-8">Enter your Chess.com or Lichess username to get started.</p>

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                const form = e.target as HTMLFormElement;
                                const input = form.elements.namedItem('username') as HTMLInputElement;
                                const platformSelect = form.elements.namedItem('platform') as HTMLSelectElement;
                                if (input.value.trim()) {
                                    window.location.href = `/games?username=${encodeURIComponent(input.value)}&platform=${platformSelect.value}`;
                                }
                            }}
                            className="space-y-4"
                        >
                            <div className="flex rounded-xl overflow-hidden border border-border">
                                <button
                                    type="button"
                                    id="btn-chesscom"
                                    onClick={() => {
                                        (document.getElementById('platform') as HTMLSelectElement).value = 'chesscom';
                                        document.getElementById('btn-chesscom')?.classList.add('bg-primary/10', 'text-primary');
                                        document.getElementById('btn-lichess')?.classList.remove('bg-primary/10', 'text-primary');
                                    }}
                                    className="flex-1 py-3 px-4 text-sm font-medium transition-all bg-primary/10 text-primary"
                                >
                                    Chess.com
                                </button>
                                <button
                                    type="button"
                                    id="btn-lichess"
                                    onClick={() => {
                                        (document.getElementById('platform') as HTMLSelectElement).value = 'lichess';
                                        document.getElementById('btn-lichess')?.classList.add('bg-primary/10', 'text-primary');
                                        document.getElementById('btn-chesscom')?.classList.remove('bg-primary/10', 'text-primary');
                                    }}
                                    className="flex-1 py-3 px-4 text-sm font-medium transition-all text-muted-foreground hover:text-foreground"
                                >
                                    Lichess
                                </button>
                            </div>
                            <select id="platform" name="platform" defaultValue="chesscom" className="hidden">
                                <option value="chesscom">Chess.com</option>
                                <option value="lichess">Lichess</option>
                            </select>

                            <input
                                name="username"
                                placeholder="Your username"
                                className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-center text-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                autoFocus
                            />

                            <button
                                type="submit"
                                className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-primary/90"
                            >
                                Analyze My Games <ChevronRight className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-500 text-xl mb-4">{error}</p>
                    <Link href="/games" className="text-primary hover:underline">
                        Try again
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-40">
                <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center gap-4 justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="p-2 rounded-lg hover:bg-secondary transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-semibold flex items-center gap-2">
                                <User className="w-5 h-5 text-primary" />
                                {username || "Game Analysis"}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {username ? `${platform === "chesscom" ? "Chess.com" : "Lichess"} • ${fetchStatus}` : "Enter a username to analyze"}
                            </p>
                        </div>
                    </div>

                    {/* Search Input in Header */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            const form = e.target as HTMLFormElement;
                            const input = form.elements.namedItem('username') as HTMLInputElement;
                            if (input.value.trim()) {
                                window.location.href = `/games?username=${encodeURIComponent(input.value)}&platform=${platform}`;
                            }
                        }}
                        className="flex items-center gap-2"
                    >
                        <input
                            name="username"
                            defaultValue={username}
                            placeholder="Search username..."
                            className="bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary w-full md:w-64"
                        />
                        <button type="submit" className="p-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground">{fetchStatus}</p>
                    </div>
                ) : games.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-xl text-muted-foreground mb-4">No games found</p>
                        <Link href="/" className="text-primary hover:underline">
                            Try a different username
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-muted-foreground mb-6">{games.length} games found</p>

                        {games.map((game, index) => (
                            <motion.div
                                key={game.platform_id || index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <div
                                    onClick={() => {
                                        // Store game data in sessionStorage for analysis page
                                        sessionStorage.setItem(`game-${game.platform_id || index}`, JSON.stringify(game));
                                        window.location.href = `/analysis/${game.platform_id || index}`;
                                    }}
                                    className="block p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all group cursor-pointer"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            {/* Players */}
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`font-medium ${game.white.username.toLowerCase() === username.toLowerCase() ? "text-primary" : ""}`}>
                                                    {game.white.username}
                                                    {game.white.rating && <span className="text-muted-foreground ml-1">({game.white.rating})</span>}
                                                </span>
                                                <span className="text-muted-foreground">vs</span>
                                                <span className={`font-medium ${game.black.username.toLowerCase() === username.toLowerCase() ? "text-primary" : ""}`}>
                                                    {game.black.username}
                                                    {game.black.rating && <span className="text-muted-foreground ml-1">({game.black.rating})</span>}
                                                </span>
                                            </div>

                                            {/* Details */}
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span className={`font-medium ${game.result === "1-0" ? "text-white" :
                                                    game.result === "0-1" ? "text-zinc-400" :
                                                        "text-yellow-500"
                                                    }`}>
                                                    {game.result}
                                                </span>
                                                {game.time_class && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {game.time_class}
                                                    </span>
                                                )}
                                                {game.eco && (
                                                    <span>{game.eco}</span>
                                                )}
                                                {game.opening_name && (
                                                    <span className="truncate max-w-[200px]">{game.opening_name}</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-muted-foreground">
                                                {game.date}
                                            </span>
                                            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

// Demo games for when backend isn't running
function getDemoGames(username: string, platform: string): Game[] {
    return [
        {
            id: "demo-1",
            platform_id: "demo-game-1",
            white: { username, rating: 1500 },
            black: { username: "Opponent1", rating: 1480 },
            result: "1-0",
            date: "2024-01-15",
            time_class: "blitz",
            eco: "C50",
            opening_name: "Italian Game",
        },
        {
            id: "demo-2",
            platform_id: "demo-game-2",
            white: { username: "Opponent2", rating: 1520 },
            black: { username, rating: 1505 },
            result: "0-1",
            date: "2024-01-14",
            time_class: "rapid",
            eco: "B20",
            opening_name: "Sicilian Defense",
        },
        {
            id: "demo-3",
            platform_id: "demo-game-3",
            white: { username, rating: 1510 },
            black: { username: "Opponent3", rating: 1490 },
            result: "1/2-1/2",
            date: "2024-01-13",
            time_class: "blitz",
            eco: "D00",
            opening_name: "Queen's Pawn Game",
        },
    ];
}

export default function GamesPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
        }>
            <GamesContent />
        </Suspense>
    );
}
