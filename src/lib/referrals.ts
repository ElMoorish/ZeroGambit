import Dexie, { type EntityTable } from 'dexie';

/**
 * ZeroGambit Referral System
 * 
 * Local-first referral tracking with Dexie.js.
 * Ready for cloud migration when needed.
 * 
 * Business Rules:
 * - Only annual subscribers can participate
 * - 30% commission on annual memberships ($13.50)
 * - Monthly subscriptions don't qualify
 * - Prize tombola for top referrers (YouTube)
 */

// Types
export interface ReferralCode {
    id?: number;
    userId: string;           // Clerk user ID
    code: string;             // Unique referral code (e.g., "MAGNUS2024")
    isActive: boolean;        // Whether the user is still an annual subscriber
    createdAt: Date;
    updatedAt: Date;
}

export interface Referral {
    id?: number;
    referrerId: string;        // User ID who referred
    referralCode: string;      // Code used
    referredUserId?: string;   // New user ID (set after signup)
    referredEmail?: string;    // Email of referred user (for tracking)
    status: 'clicked' | 'signed_up' | 'subscribed_monthly' | 'qualified' | 'paid';
    subscriptionType?: 'monthly' | 'annual'; // Type of subscription
    commissionAmount: number;  // $13.50 for annual, $0 for monthly
    clickedAt: Date;
    signedUpAt?: Date;
    qualifiedAt?: Date;        // When they paid for annual
    paidAt?: Date;             // When commission was paid to referrer
}

export interface ReferrerStats {
    id?: number;
    userId: string;
    totalClicks: number;
    totalSignups: number;
    qualifiedReferrals: number; // Annual subscribers referred
    pendingCommission: number;
    paidCommission: number;
    totalEarnings: number;
    rank: number;
    lastUpdated: Date;
}

export interface TombolaPrize {
    id?: number;
    title: string;
    description: string;
    period: string;            // e.g., "December 2024"
    winnerId?: string;
    winnerName?: string;
    isDrawn: boolean;
    drawnAt?: Date;
    youtubeVideoUrl?: string;
    createdAt: Date;
}

// Constants
export const ANNUAL_PRICE = 45.00;
export const COMMISSION_RATE = 0.30;
export const COMMISSION_AMOUNT = ANNUAL_PRICE * COMMISSION_RATE; // $13.50

// Database class
class ReferralDB extends Dexie {
    referralCodes!: EntityTable<ReferralCode, 'id'>;
    referrals!: EntityTable<Referral, 'id'>;
    referrerStats!: EntityTable<ReferrerStats, 'id'>;
    tombolaPrizes!: EntityTable<TombolaPrize, 'id'>;

    constructor() {
        super('ZeroGambitReferrals');

        this.version(1).stores({
            referralCodes: '++id, &userId, &code, isActive, createdAt',
            referrals: '++id, referrerId, referralCode, referredUserId, status, clickedAt, qualifiedAt',
            referrerStats: '++id, &userId, qualifiedReferrals, totalEarnings, rank',
            tombolaPrizes: '++id, period, isDrawn, createdAt',
        });
    }
}

// Singleton instance
export const referralDb = new ReferralDB();

// ============================================
// Referral Code Functions
// ============================================

/**
 * Generate a unique referral code for a user
 */
export function generateReferralCode(userId: string): string {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
    return `ZG${random}${timestamp}`;
}

/**
 * Create a new referral code for an annual subscriber
 */
export async function createReferralCode(userId: string): Promise<ReferralCode> {
    // Check if user already has a code
    const existing = await referralDb.referralCodes.where('userId').equals(userId).first();
    if (existing) {
        return existing;
    }

    const code = generateReferralCode(userId);
    const now = new Date();

    const id = await referralDb.referralCodes.add({
        userId,
        code,
        isActive: true,
        createdAt: now,
        updatedAt: now,
    });

    return { id: id as number, userId, code, isActive: true, createdAt: now, updatedAt: now };
}

/**
 * Get referral code by user ID
 */
export async function getReferralCodeByUser(userId: string): Promise<ReferralCode | undefined> {
    return referralDb.referralCodes.where('userId').equals(userId).first();
}

/**
 * Get referral code by code string
 */
export async function getReferralCodeByCode(code: string): Promise<ReferralCode | undefined> {
    return referralDb.referralCodes.where('code').equals(code.toUpperCase()).first();
}

/**
 * Deactivate a referral code (when user stops annual subscription)
 */
export async function deactivateReferralCode(userId: string): Promise<void> {
    const code = await getReferralCodeByUser(userId);
    if (code) {
        await referralDb.referralCodes.update(code.id!, {
            isActive: false,
            updatedAt: new Date(),
        });
    }
}

// ============================================
// Referral Tracking Functions
// ============================================

/**
 * Record a referral link click
 */
export async function recordReferralClick(referralCode: string): Promise<Referral | null> {
    const codeRecord = await getReferralCodeByCode(referralCode);
    if (!codeRecord || !codeRecord.isActive) {
        return null;
    }

    const referral: Omit<Referral, 'id'> = {
        referrerId: codeRecord.userId,
        referralCode: codeRecord.code,
        status: 'clicked',
        commissionAmount: 0,
        clickedAt: new Date(),
    };

    const id = await referralDb.referrals.add(referral as Referral);
    return { ...referral, id: id as number };
}

/**
 * Update referral when user signs up
 */
export async function markReferralSignedUp(
    referralCode: string,
    referredUserId: string,
    referredEmail?: string
): Promise<void> {
    // Find the most recent click for this code
    const referral = await referralDb.referrals
        .where('referralCode')
        .equals(referralCode.toUpperCase())
        .filter(r => r.status === 'clicked')
        .reverse()
        .first();

    if (referral) {
        await referralDb.referrals.update(referral.id!, {
            referredUserId,
            referredEmail,
            status: 'signed_up',
            signedUpAt: new Date(),
        });
    }
}

/**
 * Mark referral as qualified (annual subscription purchased)
 */
export async function markReferralQualified(
    referredUserId: string,
    subscriptionType: 'monthly' | 'annual'
): Promise<Referral | null> {
    const referral = await referralDb.referrals
        .where('referredUserId')
        .equals(referredUserId)
        .first();

    if (!referral) return null;

    const isAnnual = subscriptionType === 'annual';
    const status = isAnnual ? 'qualified' : 'subscribed_monthly';
    const commissionAmount = isAnnual ? COMMISSION_AMOUNT : 0;

    await referralDb.referrals.update(referral.id!, {
        status,
        subscriptionType,
        commissionAmount,
        qualifiedAt: new Date(),
    });

    // Update referrer stats if annual
    if (isAnnual) {
        await updateReferrerStats(referral.referrerId);
    }

    return { ...referral, status, subscriptionType, commissionAmount, qualifiedAt: new Date() };
}

/**
 * Mark commission as paid
 */
export async function markCommissionPaid(referralId: number): Promise<void> {
    await referralDb.referrals.update(referralId, {
        status: 'paid',
        paidAt: new Date(),
    });
}

// ============================================
// Stats Functions
// ============================================

/**
 * Update referrer statistics
 */
export async function updateReferrerStats(userId: string): Promise<ReferrerStats> {
    const referrals = await referralDb.referrals
        .where('referrerId')
        .equals(userId)
        .toArray();

    const totalClicks = referrals.filter(r => r.clickedAt).length;
    const totalSignups = referrals.filter(r => r.signedUpAt).length;
    const qualifiedReferrals = referrals.filter(r => r.status === 'qualified' || r.status === 'paid').length;
    const pendingCommission = referrals
        .filter(r => r.status === 'qualified')
        .reduce((sum, r) => sum + r.commissionAmount, 0);
    const paidCommission = referrals
        .filter(r => r.status === 'paid')
        .reduce((sum, r) => sum + r.commissionAmount, 0);
    const totalEarnings = pendingCommission + paidCommission;

    // Get current rank
    const rank = await calculateRank(userId);

    const existing = await referralDb.referrerStats.where('userId').equals(userId).first();
    const stats: Omit<ReferrerStats, 'id'> = {
        userId,
        totalClicks,
        totalSignups,
        qualifiedReferrals,
        pendingCommission,
        paidCommission,
        totalEarnings,
        rank,
        lastUpdated: new Date(),
    };

    if (existing) {
        await referralDb.referrerStats.update(existing.id!, stats);
        return { ...stats, id: existing.id };
    } else {
        const id = await referralDb.referrerStats.add(stats as ReferrerStats);
        return { ...stats, id: id as number };
    }
}

/**
 * Calculate user's rank in the leaderboard
 */
async function calculateRank(userId: string): Promise<number> {
    const allStats = await referralDb.referrerStats
        .orderBy('qualifiedReferrals')
        .reverse()
        .toArray();

    const userIndex = allStats.findIndex(s => s.userId === userId);
    return userIndex >= 0 ? userIndex + 1 : allStats.length + 1;
}

/**
 * Get referrer stats for a user
 */
export async function getReferrerStats(userId: string): Promise<ReferrerStats | undefined> {
    return referralDb.referrerStats.where('userId').equals(userId).first();
}

/**
 * Get leaderboard (top referrers)
 */
export async function getLeaderboard(limit: number = 10): Promise<ReferrerStats[]> {
    return referralDb.referrerStats
        .orderBy('qualifiedReferrals')
        .reverse()
        .limit(limit)
        .toArray();
}

/**
 * Get referral history for a user
 */
export async function getReferralHistory(userId: string): Promise<Referral[]> {
    return referralDb.referrals
        .where('referrerId')
        .equals(userId)
        .reverse()
        .toArray();
}

// ============================================
// Tombola Functions
// ============================================

/**
 * Create a new tombola prize period
 */
export async function createTombolaPrize(title: string, period: string, description?: string): Promise<TombolaPrize> {
    const prize: Omit<TombolaPrize, 'id'> = {
        title,
        description: description || '',
        period,
        isDrawn: false,
        createdAt: new Date(),
    };

    const id = await referralDb.tombolaPrizes.add(prize as TombolaPrize);
    return { ...prize, id: id as number };
}

/**
 * Draw a tombola winner
 */
export async function drawTombolaWinner(prizeId: number): Promise<TombolaPrize | null> {
    const prize = await referralDb.tombolaPrizes.get(prizeId);
    if (!prize || prize.isDrawn) return null;

    // Get all eligible referrers (with at least 1 qualified referral)
    const eligibleReferrers = await referralDb.referrerStats
        .filter(s => s.qualifiedReferrals > 0)
        .toArray();

    if (eligibleReferrers.length === 0) return null;

    // Weighted random selection (more referrals = more entries)
    const entries: string[] = [];
    eligibleReferrers.forEach(r => {
        for (let i = 0; i < r.qualifiedReferrals; i++) {
            entries.push(r.userId);
        }
    });

    const winnerUserId = entries[Math.floor(Math.random() * entries.length)];

    await referralDb.tombolaPrizes.update(prizeId, {
        winnerId: winnerUserId,
        isDrawn: true,
        drawnAt: new Date(),
    });

    return (await referralDb.tombolaPrizes.get(prizeId)) || null;
}

/**
 * Get upcoming and past tombola prizes
 */
export async function getTombolaPrizes(): Promise<TombolaPrize[]> {
    return referralDb.tombolaPrizes.orderBy('createdAt').reverse().toArray();
}

// ============================================
// URL Helpers
// ============================================

/**
 * Generate a full referral URL
 */
export function generateReferralUrl(code: string): string {
    const baseUrl = typeof window !== 'undefined'
        ? window.location.origin
        : 'https://zerogambit.io';
    return `${baseUrl}/pricing?ref=${code}`;
}

/**
 * Parse referral code from URL
 */
export function parseReferralCodeFromUrl(): string | null {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get('ref');
}

/**
 * Store referral code in localStorage for later use
 */
export function storeReferralCode(code: string): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem('zerogambit_referral_code', code.toUpperCase());
        localStorage.setItem('zerogambit_referral_timestamp', Date.now().toString());
    }
}

/**
 * Get stored referral code (expires after 30 days)
 */
export function getStoredReferralCode(): string | null {
    if (typeof window === 'undefined') return null;

    const code = localStorage.getItem('zerogambit_referral_code');
    const timestamp = localStorage.getItem('zerogambit_referral_timestamp');

    if (!code || !timestamp) return null;

    // Expire after 30 days
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - parseInt(timestamp) > thirtyDays) {
        localStorage.removeItem('zerogambit_referral_code');
        localStorage.removeItem('zerogambit_referral_timestamp');
        return null;
    }

    return code;
}
