import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

/**
 * ZeroGambit Email Service
 * 
 * Supports multiple transports:
 * - Development: Mailocal (local SMTP on port 2525)
 * - Production: Resend API
 * 
 * Usage:
 *   const emailService = new EmailService();
 *   await emailService.send({ to: 'user@example.com', subject: 'Hello', html: '<p>Hi!</p>' });
 */

export interface EmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    from?: string;
    replyTo?: string;
}

export interface EmailResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

// Email templates
export const EMAIL_TEMPLATES = {
    WELCOME: 'welcome',
    WEEKLY_DIGEST: 'weekly_digest',
    ACHIEVEMENT: 'achievement',
    REFERRAL_EARNED: 'referral_earned',
    RE_ENGAGEMENT: 're_engagement',
} as const;

export type EmailTemplate = typeof EMAIL_TEMPLATES[keyof typeof EMAIL_TEMPLATES];

class EmailService {
    private transporter: Transporter | null = null;
    private readonly fromEmail: string;
    private readonly fromName: string;

    constructor() {
        this.fromEmail = process.env.EMAIL_FROM || 'newsletter@zerogambit.io';
        this.fromName = process.env.EMAIL_FROM_NAME || 'ZeroGambit';
    }

    /**
     * Get or create the email transporter
     */
    private async getTransporter(): Promise<Transporter> {
        if (this.transporter) return this.transporter;

        const isDev = process.env.NODE_ENV === 'development';

        if (isDev) {
            // Development: Use Mailocal or any local SMTP
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || '127.0.0.1',
                port: parseInt(process.env.SMTP_PORT || '2525'),
                secure: false,
                auth: process.env.SMTP_USER ? {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                } : undefined,
            });
        } else {
            // Production: Use Resend SMTP
            this.transporter = nodemailer.createTransport({
                host: 'smtp.resend.com',
                port: 587,
                secure: false,
                auth: {
                    user: 'resend',
                    pass: process.env.RESEND_API_KEY,
                },
            });
        }

        return this.transporter;
    }

    /**
     * Send an email
     */
    async send(options: EmailOptions): Promise<EmailResult> {
        try {
            const transporter = await this.getTransporter();

            const result = await transporter.sendMail({
                from: options.from || `${this.fromName} <${this.fromEmail}>`,
                to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
                subject: options.subject,
                html: options.html,
                text: options.text || this.htmlToText(options.html),
                replyTo: options.replyTo,
            });

            console.log(`📧 Email sent: ${result.messageId}`);

            return {
                success: true,
                messageId: result.messageId,
            };
        } catch (error) {
            console.error('Email send error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Send to multiple recipients (batched)
     */
    async sendBatch(recipients: string[], options: Omit<EmailOptions, 'to'>): Promise<EmailResult[]> {
        const results: EmailResult[] = [];

        // Send in batches of 50 to avoid rate limits
        const batchSize = 50;
        for (let i = 0; i < recipients.length; i += batchSize) {
            const batch = recipients.slice(i, i + batchSize);

            const batchResults = await Promise.all(
                batch.map(to => this.send({ ...options, to }))
            );

            results.push(...batchResults);

            // Small delay between batches
            if (i + batchSize < recipients.length) {
                await new Promise(r => setTimeout(r, 1000));
            }
        }

        return results;
    }

    /**
     * Verify transporter connection
     */
    async verifyConnection(): Promise<boolean> {
        try {
            const transporter = await this.getTransporter();
            await transporter.verify();
            console.log('✅ Email transporter verified');
            return true;
        } catch (error) {
            console.error('❌ Email transporter verification failed:', error);
            return false;
        }
    }

    /**
     * Simple HTML to text conversion
     */
    private htmlToText(html: string): string {
        return html
            .replace(/<style[^>]*>.*?<\/style>/gi, '')
            .replace(/<script[^>]*>.*?<\/script>/gi, '')
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/\s+/g, ' ')
            .trim();
    }
}

// Singleton instance
export const emailService = new EmailService();

// Convenience function
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
    return emailService.send(options);
}
