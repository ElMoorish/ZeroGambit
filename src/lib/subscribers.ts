import Dexie, { type EntityTable } from 'dexie';

/**
 * ZeroGambit Newsletter Subscriber Database
 * 
 * Manages email subscriptions locally.
 * Can be migrated to cloud database when needed.
 */

export interface Subscriber {
    id?: number;
    email: string;
    status: 'active' | 'unsubscribed' | 'bounced';
    preferences: {
        weeklyDigest: boolean;
        achievements: boolean;
        promotions: boolean;
        referralUpdates: boolean;
    };
    userId?: string;          // Clerk user ID if signed in
    source: 'website' | 'referral' | 'import';
    referralCode?: string;    // If they subscribed via referral
    subscribedAt: Date;
    unsubscribedAt?: Date;
    lastEmailSentAt?: Date;
    emailsSent: number;
}

export interface EmailLog {
    id?: number;
    subscriberId: number;
    email: string;
    subject: string;
    template: string;
    status: 'sent' | 'failed' | 'bounced';
    messageId?: string;
    error?: string;
    sentAt: Date;
}

export interface NewsletterDraft {
    id?: number;
    subject: string;
    htmlContent: string;
    plainTextContent: string;
    status: 'draft' | 'scheduled' | 'sent';
    scheduledFor?: Date;
    sentAt?: Date;
    recipientCount?: number;
    createdAt: Date;
    updatedAt: Date;
}

// Database class
class SubscriberDB extends Dexie {
    subscribers!: EntityTable<Subscriber, 'id'>;
    emailLogs!: EntityTable<EmailLog, 'id'>;
    newsletters!: EntityTable<NewsletterDraft, 'id'>;

    constructor() {
        super('ZeroGambitSubscribers');

        this.version(1).stores({
            subscribers: '++id, &email, status, userId, subscribedAt',
            emailLogs: '++id, subscriberId, email, status, sentAt',
            newsletters: '++id, status, scheduledFor, createdAt',
        });
    }
}

// Singleton instance
export const subscriberDb = new SubscriberDB();

// ============================================
// Subscriber Functions
// ============================================

/**
 * Add a new subscriber
 */
export async function addSubscriber(
    email: string,
    options: {
        userId?: string;
        source?: 'website' | 'referral' | 'import';
        referralCode?: string;
    } = {}
): Promise<Subscriber | null> {
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return null;
    }

    // Check if already exists
    const existing = await subscriberDb.subscribers
        .where('email')
        .equals(email.toLowerCase())
        .first();

    if (existing) {
        // Reactivate if unsubscribed
        if (existing.status === 'unsubscribed') {
            await subscriberDb.subscribers.update(existing.id!, {
                status: 'active',
                unsubscribedAt: undefined,
            });
            return { ...existing, status: 'active' };
        }
        return existing;
    }

    // Create new subscriber
    const subscriber: Omit<Subscriber, 'id'> = {
        email: email.toLowerCase(),
        status: 'active',
        preferences: {
            weeklyDigest: true,
            achievements: true,
            promotions: true,
            referralUpdates: true,
        },
        userId: options.userId,
        source: options.source || 'website',
        referralCode: options.referralCode,
        subscribedAt: new Date(),
        emailsSent: 0,
    };

    const id = await subscriberDb.subscribers.add(subscriber as Subscriber);
    return { ...subscriber, id: id as number };
}

/**
 * Unsubscribe an email
 */
export async function unsubscribe(email: string): Promise<boolean> {
    const subscriber = await subscriberDb.subscribers
        .where('email')
        .equals(email.toLowerCase())
        .first();

    if (!subscriber) return false;

    await subscriberDb.subscribers.update(subscriber.id!, {
        status: 'unsubscribed',
        unsubscribedAt: new Date(),
    });

    return true;
}

/**
 * Update subscriber preferences
 */
export async function updatePreferences(
    email: string,
    preferences: Partial<Subscriber['preferences']>
): Promise<boolean> {
    const subscriber = await subscriberDb.subscribers
        .where('email')
        .equals(email.toLowerCase())
        .first();

    if (!subscriber) return false;

    await subscriberDb.subscribers.update(subscriber.id!, {
        preferences: { ...subscriber.preferences, ...preferences },
    });

    return true;
}

/**
 * Get all active subscribers
 */
export async function getActiveSubscribers(
    filter?: { weeklyDigest?: boolean }
): Promise<Subscriber[]> {
    let query = subscriberDb.subscribers.where('status').equals('active');

    const subscribers = await query.toArray();

    if (filter?.weeklyDigest) {
        return subscribers.filter(s => s.preferences.weeklyDigest);
    }

    return subscribers;
}

/**
 * Get subscriber by email
 */
export async function getSubscriberByEmail(email: string): Promise<Subscriber | undefined> {
    return subscriberDb.subscribers
        .where('email')
        .equals(email.toLowerCase())
        .first();
}

/**
 * Get subscriber stats
 */
export async function getSubscriberStats() {
    const total = await subscriberDb.subscribers.count();
    const active = await subscriberDb.subscribers.where('status').equals('active').count();
    const unsubscribed = await subscriberDb.subscribers.where('status').equals('unsubscribed').count();

    return { total, active, unsubscribed };
}

// ============================================
// Email Log Functions
// ============================================

/**
 * Log an email send
 */
export async function logEmailSend(
    subscriberId: number,
    email: string,
    subject: string,
    template: string,
    status: 'sent' | 'failed' | 'bounced',
    messageId?: string,
    error?: string
): Promise<void> {
    await subscriberDb.emailLogs.add({
        subscriberId,
        email,
        subject,
        template,
        status,
        messageId,
        error,
        sentAt: new Date(),
    });

    // Update subscriber's last email sent time
    if (status === 'sent') {
        const subscriber = await subscriberDb.subscribers.get(subscriberId);
        if (subscriber) {
            await subscriberDb.subscribers.update(subscriberId, {
                lastEmailSentAt: new Date(),
                emailsSent: subscriber.emailsSent + 1,
            });
        }
    }

    // Mark as bounced if email bounced
    if (status === 'bounced') {
        await subscriberDb.subscribers.update(subscriberId, {
            status: 'bounced',
        });
    }
}

/**
 * Get email history for a subscriber
 */
export async function getEmailHistory(subscriberId: number): Promise<EmailLog[]> {
    return subscriberDb.emailLogs
        .where('subscriberId')
        .equals(subscriberId)
        .reverse()
        .toArray();
}

// ============================================
// Newsletter Draft Functions
// ============================================

/**
 * Save a newsletter draft
 */
export async function saveNewsletterDraft(
    subject: string,
    htmlContent: string,
    plainTextContent: string
): Promise<NewsletterDraft> {
    const now = new Date();
    const draft: Omit<NewsletterDraft, 'id'> = {
        subject,
        htmlContent,
        plainTextContent,
        status: 'draft',
        createdAt: now,
        updatedAt: now,
    };

    const id = await subscriberDb.newsletters.add(draft as NewsletterDraft);
    return { ...draft, id: id as number };
}

/**
 * Schedule a newsletter
 */
export async function scheduleNewsletter(
    id: number,
    scheduledFor: Date
): Promise<void> {
    await subscriberDb.newsletters.update(id, {
        status: 'scheduled',
        scheduledFor,
        updatedAt: new Date(),
    });
}

/**
 * Get scheduled newsletters
 */
export async function getScheduledNewsletters(): Promise<NewsletterDraft[]> {
    return subscriberDb.newsletters
        .where('status')
        .equals('scheduled')
        .toArray();
}

/**
 * Mark newsletter as sent
 */
export async function markNewsletterSent(
    id: number,
    recipientCount: number
): Promise<void> {
    await subscriberDb.newsletters.update(id, {
        status: 'sent',
        sentAt: new Date(),
        recipientCount,
        updatedAt: new Date(),
    });
}
