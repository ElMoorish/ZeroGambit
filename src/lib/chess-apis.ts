/**
 * Chess Platform API Client
 *
 * Fetches games directly from Chess.com and Lichess public APIs
 * No backend required - runs entirely in the browser
 */

export interface GameData {
    id: string;
    platform_id: string;
    pgn: string;
    white: { username: string; rating?: number };
    black: { username: string; rating?: number };
    result: string;
    date: string;
    time_class?: string;
    eco?: string;
    opening_name?: string;
    url?: string;
}

/**
 * Fetch games from Chess.com
 * API: https://api.chess.com/pub/player/{username}/games/archives
 */
export async function fetchChessComGames(username: string, maxGames: number = 50): Promise<GameData[]> {
    const games: GameData[] = [];

    try {
        // First get the list of archive URLs
        const archivesResponse = await fetch(
            `https://api.chess.com/pub/player/${username.toLowerCase()}/games/archives`,
            {
                headers: {
                    "User-Agent": "ZeroGambit Chess Analysis (contact: zerogambit@example.com)",
                },
            }
        );

        if (!archivesResponse.ok) {
            if (archivesResponse.status === 404) {
                throw new Error(`User "${username}" not found on Chess.com`);
            }
            throw new Error(`Chess.com API error: ${archivesResponse.status}`);
        }

        const archivesData = await archivesResponse.json();
        const archives: string[] = archivesData.archives || [];

        // Fetch from most recent archives first
        const recentArchives = archives.slice(-3).reverse(); // Last 3 months

        for (const archiveUrl of recentArchives) {
            if (games.length >= maxGames) break;

            try {
                const gamesResponse = await fetch(archiveUrl, {
                    headers: {
                        "User-Agent": "ZeroGambit Chess Analysis (contact: zerogambit@example.com)",
                    },
                });

                if (!gamesResponse.ok) continue;

                const gamesData = await gamesResponse.json();
                const monthGames = gamesData.games || [];

                for (const game of monthGames.reverse()) {
                    if (games.length >= maxGames) break;

                    const gameData: GameData = {
                        id: game.uuid || `chesscom-${games.length}`,
                        platform_id: game.uuid || game.url?.split("/").pop() || `${games.length}`,
                        pgn: game.pgn || "",
                        white: {
                            username: game.white?.username || "Unknown",
                            rating: game.white?.rating,
                        },
                        black: {
                            username: game.black?.username || "Unknown",
                            rating: game.black?.rating,
                        },
                        result: parseChessComResult(game.white?.result, game.black?.result),
                        date: new Date(game.end_time * 1000).toISOString().split("T")[0],
                        time_class: game.time_class,
                        eco: extractEcoFromPgn(game.pgn),
                        opening_name: extractOpeningFromPgn(game.pgn),
                        url: game.url,
                    };

                    games.push(gameData);
                }
            } catch (err) {
                console.warn(`Failed to fetch archive ${archiveUrl}:`, err);
            }
        }

        return games;
    } catch (error) {
        console.error("Chess.com fetch error:", error);
        throw error;
    }
}

/**
 * Fetch games from Lichess
 * API: https://lichess.org/api/games/user/{username}
 */
export async function fetchLichessGames(username: string, maxGames: number = 50): Promise<GameData[]> {
    const games: GameData[] = [];

    try {
        const response = await fetch(
            `https://lichess.org/api/games/user/${username}?max=${maxGames}&pgnInJson=true&opening=true`,
            {
                headers: {
                    Accept: "application/x-ndjson",
                },
            }
        );

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`User "${username}" not found on Lichess`);
            }
            throw new Error(`Lichess API error: ${response.status}`);
        }

        const text = await response.text();
        const lines = text.trim().split("\n");

        for (const line of lines) {
            if (!line.trim()) continue;

            try {
                const game = JSON.parse(line);

                const gameData: GameData = {
                    id: game.id,
                    platform_id: game.id,
                    pgn: game.pgn || "",
                    white: {
                        username: game.players?.white?.user?.name ||
                            (game.players?.white?.aiLevel ? `Stockfish L${game.players.white.aiLevel}` : "Anonymous"),
                        rating: game.players?.white?.rating,
                    },
                    black: {
                        username: game.players?.black?.user?.name ||
                            (game.players?.black?.aiLevel ? `Stockfish L${game.players.black.aiLevel}` : "Anonymous"),
                        rating: game.players?.black?.rating,
                    },
                    result: parseLichessResult(game.winner, game.status),
                    date: new Date(game.createdAt).toISOString().split("T")[0],
                    time_class: game.speed,
                    eco: game.opening?.eco,
                    opening_name: game.opening?.name,
                    url: `https://lichess.org/${game.id}`,
                };

                games.push(gameData);
            } catch (parseError) {
                console.warn("Failed to parse Lichess game:", parseError);
            }
        }

        return games;
    } catch (error) {
        console.error("Lichess fetch error:", error);
        throw error;
    }
}

/**
 * Unified game fetcher
 */
export async function fetchGames(
    username: string,
    platform: "chesscom" | "lichess",
    maxGames: number = 50
): Promise<GameData[]> {
    if (platform === "chesscom") {
        return fetchChessComGames(username, maxGames);
    } else {
        return fetchLichessGames(username, maxGames);
    }
}

// Helper functions
function parseChessComResult(whiteResult?: string, blackResult?: string): string {
    if (whiteResult === "win") return "1-0";
    if (blackResult === "win") return "0-1";
    if (whiteResult === "drawn" || blackResult === "drawn") return "1/2-1/2";
    if (whiteResult === "stalemate" || blackResult === "stalemate") return "1/2-1/2";
    return "*";
}

function parseLichessResult(winner?: string, status?: string): string {
    if (winner === "white") return "1-0";
    if (winner === "black") return "0-1";
    if (status === "draw" || status === "stalemate") return "1/2-1/2";
    return "*";
}

function extractEcoFromPgn(pgn?: string): string | undefined {
    if (!pgn) return undefined;
    const match = pgn.match(/\[ECO "([^"]+)"\]/);
    return match ? match[1] : undefined;
}

function extractOpeningFromPgn(pgn?: string): string | undefined {
    if (!pgn) return undefined;
    const match = pgn.match(/\[Opening "([^"]+)"\]/);
    return match ? match[1] : undefined;
}
