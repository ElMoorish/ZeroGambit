import { NextRequest, NextResponse } from 'next/server';
import { addSubscriber, getSubscriberByEmail } from '@/lib/subscribers';
import { sendEmail } from '@/lib/email';
import { getStoredReferralCode } from '@/lib/referrals';

/**
 * Newsletter Subscription API
 * 
 * POST /api/newsletter/subscribe
 * Body: { email: string, preferences?: { ... } }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, userId, source } = body;

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Check if already subscribed
        const existing = await getSubscriberByEmail(email);
        if (existing && existing.status === 'active') {
            return NextResponse.json(
                { message: 'Already subscribed', subscriber: existing },
                { status: 200 }
            );
        }

        // Get referral code if present
        const referralCode = typeof window !== 'undefined' ? getStoredReferralCode() : undefined;

        // Add subscriber
        const subscriber = await addSubscriber(email, {
            userId,
            source: source || 'website',
            referralCode: referralCode || undefined,
        });

        if (!subscriber) {
            return NextResponse.json(
                { error: 'Failed to subscribe' },
                { status: 500 }
            );
        }

        // Send welcome email
        await sendEmail({
            to: email,
            subject: 'Welcome to ZeroGambit! ♟️',
            html: getWelcomeEmailHtml(),
        });

        return NextResponse.json({
            success: true,
            message: 'Successfully subscribed!',
            subscriber: {
                email: subscriber.email,
                subscribedAt: subscriber.subscribedAt,
            },
        });
    } catch (error) {
        console.error('Subscribe error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * Get subscription status
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
        return NextResponse.json(
            { error: 'Email parameter required' },
            { status: 400 }
        );
    }

    const subscriber = await getSubscriberByEmail(email);

    if (!subscriber) {
        return NextResponse.json({ subscribed: false });
    }

    return NextResponse.json({
        subscribed: subscriber.status === 'active',
        status: subscriber.status,
        subscribedAt: subscriber.subscribedAt,
    });
}

/**
 * Welcome email HTML template
 */
function getWelcomeEmailHtml(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ZeroGambit</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0a0a0a; color: #e5e5e5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0; }
    .header h1 { color: white; margin: 0; font-size: 32px; }
    .header p { color: rgba(255,255,255,0.9); margin: 15px 0 0; font-size: 18px; }
    .content { background: #1a1a1a; padding: 40px 30px; border-radius: 0 0 12px 12px; }
    .feature { display: flex; align-items: flex-start; margin-bottom: 25px; }
    .feature-icon { background: #7c3aed20; border-radius: 50%; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 24px; flex-shrink: 0; }
    .feature h3 { margin: 0 0 5px; color: white; }
    .feature p { margin: 0; color: #999; }
    .cta-button { display: inline-block; background: #7c3aed; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>♟️ Welcome to ZeroGambit!</h1>
      <p>Your journey to chess mastery starts now</p>
    </div>
    
    <div class="content">
      <p style="font-size: 16px; line-height: 1.6;">
        Hey there, chess warrior! 👋
      </p>
      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
        You're now part of a community that values privacy, self-improvement, and beautiful chess.
        Here's what you can expect:
      </p>

      <div class="feature">
        <div class="feature-icon">📧</div>
        <div>
          <h3>Weekly Chess Digest</h3>
          <p>Tactics, openings, and strategic tips delivered every Sunday</p>
        </div>
      </div>

      <div class="feature">
        <div class="feature-icon">🎯</div>
        <div>
          <h3>Puzzle of the Week</h3>
          <p>Sharpen your tactical vision with curated puzzles</p>
        </div>
      </div>

      <div class="feature">
        <div class="feature-icon">🏆</div>
        <div>
          <h3>Achievement Updates</h3>
          <p>Celebrate your milestones and track your progress</p>
        </div>
      </div>

      <div class="feature">
        <div class="feature-icon">🎁</div>
        <div>
          <h3>Referral Rewards</h3>
          <p>Earn $13.50 for every friend who joins as an annual member</p>
        </div>
      </div>

      <div style="text-align: center; margin: 40px 0;">
        <a href="https://zerogambit.io" class="cta-button">Start Training →</a>
      </div>

      <p style="text-align: center; color: #888;">
        <em>"Every master was once a beginner."</em>
      </p>
    </div>

    <div class="footer">
      <p>You're receiving this because you subscribed to ZeroGambit.</p>
      <p>© ${new Date().getFullYear()} ZeroGambit. Made with ♟️</p>
    </div>
  </div>
</body>
</html>`;
}
