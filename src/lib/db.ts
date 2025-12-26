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
