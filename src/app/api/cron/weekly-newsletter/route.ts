import { NextRequest, NextResponse } from 'next/server';
import { generateWeeklyNewsletter } from '@/lib/newsletter-generator';
import { sendEmail } from '@/lib/email';
import { getActiveSubscribers, logEmailSend, saveNewsletterDraft, markNewsletterSent } from '@/lib/subscribers';

/**
 * Weekly Newsletter Cron Job
 * 
 * GET /api/cron/weekly-newsletter
 * 
 * Triggered by:
 * - Vercel Cron (vercel.json)
 * - Manual trigger (with admin auth)
 * - External cron service
 * 
 * Schedule: Every Sunday at 9:00 AM UTC
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds max for newsletter generation + sending

export async function GET(request: NextRequest) {
    try {
        // Verify authorization
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        // Allow requests from Vercel Cron or with valid secret
        const isVercelCron = request.headers.get('x-vercel-cron') === '1';
        const hasValidSecret = cronSecret && authHeader === `Bearer ${cronSecret}`;

        if (!isVercelCron && !hasValidSecret) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        console.log('📧 Starting weekly newsletter generation...');

        // Generate newsletter content with Gemini
        const newsletter = await generateWeeklyNewsletter();
        console.log(`✅ Newsletter generated: "${newsletter.subject}"`);

        // Save draft for record keeping
        const draft = await saveNewsletterDraft(
            newsletter.subject,
            newsletter.html,
            newsletter.plainText
        );

        // Get all active subscribers who want weekly digest
        const subscribers = await getActiveSubscribers({ weeklyDigest: true });
        console.log(`📬 Sending to ${subscribers.length} subscribers...`);

        if (subscribers.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No active subscribers',
                sent: 0,
            });
        }

        // Send emails in batches
        let successCount = 0;
        let failCount = 0;

        for (const subscriber of subscribers) {
            try {
                const result = await sendEmail({
                    to: subscriber.email,
                    subject: newsletter.subject,
                    html: newsletter.html,
                    text: newsletter.plainText,
                });

                await logEmailSend(
                    subscriber.id!,
                    subscriber.email,
                    newsletter.subject,
                    'weekly_digest',
                    result.success ? 'sent' : 'failed',
                    result.messageId,
                    result.error
                );

                if (result.success) {
                    successCount++;
                } else {
                    failCount++;
                }

                // Small delay to avoid rate limits
                await new Promise(r => setTimeout(r, 100));
            } catch (error) {
                console.error(`Failed to send to ${subscriber.email}:`, error);
                failCount++;

                await logEmailSend(
                    subscriber.id!,
                    subscriber.email,
                    newsletter.subject,
                    'weekly_digest',
                    'failed',
                    undefined,
                    error instanceof Error ? error.message : 'Unknown error'
                );
            }
        }

        // Mark newsletter as sent
        if (draft.id) {
            await markNewsletterSent(draft.id, successCount);
        }

        console.log(`✅ Newsletter complete: ${successCount} sent, ${failCount} failed`);

        return NextResponse.json({
            success: true,
            subject: newsletter.subject,
            sent: successCount,
            failed: failCount,
            total: subscribers.length,
            generatedAt: newsletter.generatedAt,
        });
    } catch (error) {
        console.error('Newsletter cron error:', error);
        return NextResponse.json(
            {
                error: 'Failed to send newsletter',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

/**
 * POST handler for manual trigger with preview
 */
export async function POST(request: NextRequest) {
    try {
        // Only allow with valid secret
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { preview, testEmail } = body;

        // Generate newsletter
        const newsletter = await generateWeeklyNewsletter();

        if (preview) {
            // Return preview without sending
            return NextResponse.json({
                success: true,
                preview: true,
                subject: newsletter.subject,
                html: newsletter.html,
                plainText: newsletter.plainText,
            });
        }

        if (testEmail) {
            // Send to test email only
            const result = await sendEmail({
                to: testEmail,
                subject: `[TEST] ${newsletter.subject}`,
                html: newsletter.html,
                text: newsletter.plainText,
            });

            return NextResponse.json({
                success: result.success,
                testEmail,
                subject: newsletter.subject,
                messageId: result.messageId,
                error: result.error,
            });
        }

        return NextResponse.json({
            error: 'Specify preview: true or testEmail: "email@example.com"'
        }, { status: 400 });
    } catch (error) {
        console.error('Newsletter POST error:', error);
        return NextResponse.json(
            { error: 'Failed to process request' },
            { status: 500 }
        );
    }
}
