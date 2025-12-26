import Dexie, { type EntityTable } from 'dexie';

/**
 * ZeroGambit Local Database (IndexedDB via Dexie.js)
 * 
 * Stores all user data locally - no cloud dependency.
 * "Your moves. Your hardware. Zero leaks."
 */

// Type definitions
export interface LocalGame {
    id?: number;
    site: 'chess.com' | 'lichess' | 'custom';
    pgn: string;
    white: string;
    black: string;
    result: string;
    date: string;
    event?: string;
    opening?: string;
    eco?: string;
    timeControl?: string;
    whiteElo?: number;
    blackElo?: number;
    analyzed?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface LocalPuzzle {
    id?: number;
    fen: string;
    solution: string[];
    rating: number;
    themes: string[];
    solved?: boolean;
    solvedAt?: Date;
    attempts: number;
}

export interface LocalAnalysis {
    id?: number;
    gameId: number;
    moveNumber: number;
    fen: string;
    bestMove: string;
    evaluation: number;
    depth: number;
    pv: string[];
    classification?: 'brilliant' | 'great' | 'best' | 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';
    createdAt: Date;
}

export interface UserSettings {
    id?: number;
    key: string;
    value: string;
    updatedAt: Date;
}

export interface ChessDNA {
    id?: number;
    aggressionIndex: number;      // 0-100
    accuracyScore: number;        // 0-100
    tacticSharpness: number;      // 0-100
    endgameStrength: number;      // 0-100
    openingRepertoire: string[];  // ECO codes
    preferredTimeControl: string;
    gamesAnalyzed: number;
    calculatedAt: Date;
}

// Database class
class ZeroGambitDB extends Dexie {
    games!: EntityTable<LocalGame, 'id'>;
    puzzles!: EntityTable<LocalPuzzle, 'id'>;
    analysis!: EntityTable<LocalAnalysis, 'id'>;
    settings!: EntityTable<UserSettings, 'id'>;
    dna!: EntityTable<ChessDNA, 'id'>;

    constructor() {
        super('ZeroGambitDB');

        this.version(1).stores({
            games: '++id, site, white, black, date, opening, eco, analyzed, createdAt',
            puzzles: '++id, rating, solved, *themes',
            analysis: '++id, gameId, moveNumber, classification',
            settings: '++id, &key',
            dna: '++id, calculatedAt',
        });
    }
}

// Singleton instance
export const db = new ZeroGambitDB();

// Helper functions
export async function saveGame(game: Omit<LocalGame, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const now = new Date();
    const id = await db.games.add({
        ...game,
        createdAt: now,
        updatedAt: now,
    });
    return id as number;
}

export async function getGamesByPlayer(playerName: string): Promise<LocalGame[]> {
    return db.games
        .where('white').equalsIgnoreCase(playerName)
        .or('black').equalsIgnoreCase(playerName)
        .toArray();
}

export async function getUnanalyzedGames(): Promise<LocalGame[]> {
    return db.games.filter(game => game.analyzed === false || game.analyzed === undefined).toArray();
}

export async function markGameAnalyzed(gameId: number): Promise<void> {
    await db.games.update(gameId, { analyzed: true, updatedAt: new Date() });
}

export async function getSetting(key: string): Promise<string | undefined> {
    const setting = await db.settings.where('key').equals(key).first();
    return setting?.value;
}

export async function setSetting(key: string, value: string): Promise<void> {
    const existing = await db.settings.where('key').equals(key).first();
    if (existing) {
        await db.settings.update(existing.id!, { value, updatedAt: new Date() });
    } else {
        await db.settings.add({ key, value, updatedAt: new Date() });
    }
}

export async function getChessDNA(): Promise<ChessDNA | undefined> {
    return db.dna.orderBy('calculatedAt').reverse().first();
}

export async function saveChessDNA(dna: Omit<ChessDNA, 'id' | 'calculatedAt'>): Promise<number> {
    const id = await db.dna.add({
        ...dna,
        calculatedAt: new Date(),
    });
    return id as number;
}

// Stats helpers
export async function getGameStats() {
    const total = await db.games.count();
    const analyzed = await db.games.filter(g => g.analyzed === true).count();
    const wins = await db.games.where('result').equals('1-0').count();
    const losses = await db.games.where('result').equals('0-1').count();
    const draws = await db.games.where('result').equals('1/2-1/2').count();

    return { total, analyzed, wins, losses, draws };
}

export async function getPuzzleStats() {
    const total = await db.puzzles.count();
    const solved = await db.puzzles.filter(p => p.solved === true).count();

    return { total, solved, solveRate: total > 0 ? (solved / total) * 100 : 0 };
}

export interface OpeningStats {
    eco: string;
    name: string;
    totalGames: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
}

export async function getOpeningStats(username?: string): Promise<{
    openings: OpeningStats[];
    totalGamesWithOpening: number;
    bestOpening: OpeningStats | null;
    worstOpening: OpeningStats | null;
    mostPlayed: OpeningStats | null;
}> {
    const allGames = await db.games.toArray();

    // Filter games with ECO codes
    const gamesWithEco = allGames.filter(g => g.eco && g.eco.length > 0);

    // Group by ECO code
    const openingMap = new Map<string, {
        name: string;
        games: LocalGame[];
    }>();

    for (const game of gamesWithEco) {
        const eco = game.eco!;
        if (!openingMap.has(eco)) {
            openingMap.set(eco, {
                name: game.opening || eco,
                games: []
            });
        }
        openingMap.get(eco)!.games.push(game);
    }

    // Calculate stats for each opening
    const openings: OpeningStats[] = [];

    for (const [eco, data] of openingMap) {
        let wins = 0;
        let losses = 0;
        let draws = 0;

        for (const game of data.games) {
            // Determine if user is white or black
            const isWhite = username ?
                game.white.toLowerCase() === username.toLowerCase() :
                true; // Default assume white for now

            if (game.result === '1-0') {
                isWhite ? wins++ : losses++;
            } else if (game.result === '0-1') {
                isWhite ? losses++ : wins++;
            } else if (game.result === '1/2-1/2') {
                draws++;
            }
        }

        const totalGames = data.games.length;
        const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;

        openings.push({
            eco,
            name: data.name,
            totalGames,
            wins,
            losses,
            draws,
            winRate
        });
    }

    // Sort by total games (most played first)
    openings.sort((a, b) => b.totalGames - a.totalGames);

    // Find best/worst/most played
    const validOpenings = openings.filter(o => o.totalGames >= 3); // Need at least 3 games for meaningful stats
    const sortedByWinRate = [...validOpenings].sort((a, b) => b.winRate - a.winRate);

    return {
        openings: openings.slice(0, 10), // Top 10
        totalGamesWithOpening: gamesWithEco.length,
        bestOpening: sortedByWinRate[0] || null,
        worstOpening: sortedByWinRate[sortedByWinRate.length - 1] || null,
        mostPlayed: openings[0] || null
    };
}

