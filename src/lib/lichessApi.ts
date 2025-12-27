
export interface LichessMoveStats {
    uci: string;
    san: string;
    white: number;
    draw: number;
    black: number;
    averageRating: number;
    gameCount: number; // calculated total
}

export interface LichessExplorerResponse {
    white: number;
    draws: number;
    black: number;
    moves: Array<{
        uci: string;
        san: string;
        white: number;
        draws: number;
        black: number;
        averageRating: number;
    }>;
    opening?: {
        eco: string;
        name: string;
    };
}

const CACHE = new Map<string, LichessExplorerResponse>();

export async function fetchLichessStats(fen: string, speeds: string[] = ["blitz", "rapid", "classical"], ratings: number[] = [1600, 1800, 2000, 2200, 2500]): Promise<LichessExplorerResponse | null> {
    // Basic caching
    const cacheKey = `${fen}-${speeds.join(',')}-${ratings.join(',')}`;
    if (CACHE.has(cacheKey)) {
        return CACHE.get(cacheKey)!;
    }

    try {
        const params = new URLSearchParams({
            fen: fen,
            speeds: speeds.join(','),
            ratings: ratings.join(','),
            moves: "12",
            topGames: "0"
        });

        const response = await fetch(`https://explorer.lichess.ovh/lichess?${params.toString()}`);

        if (!response.ok) {
            if (response.status === 429) {
                console.warn("Lichess API rate limit exceeded");
                return null;
            }
            throw new Error(`Lichess API error: ${response.statusText}`);
        }

        const data: LichessExplorerResponse = await response.json();
        CACHE.set(cacheKey, data);
        return data;
    } catch (error) {
        console.error("Failed to fetch Lichess stats:", error);
        return null;
    }
}
