import { NextRequest, NextResponse } from 'next/server';
import { unsubscribe, getSubscriberByEmail } from '@/lib/subscribers';

/**
 * Newsletter Unsubscribe API
 * 
 * POST /api/newsletter/unsubscribe
 * Body: { email: string }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        const result = await unsubscribe(email);

        if (!result) {
            return NextResponse.json(
                { error: 'Email not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Successfully unsubscribed. We\'re sorry to see you go!',
        });
    } catch (error) {
        console.error('Unsubscribe error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * GET handler for one-click unsubscribe links
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const token = searchParams.get('token');

    if (!email) {
        return new NextResponse(getUnsubscribePageHtml(false, 'Missing email parameter'), {
            headers: { 'Content-Type': 'text/html' },
        });
    }

    // TODO: Verify token for security
    // For now, just unsubscribe
    const result = await unsubscribe(email);

    return new NextResponse(getUnsubscribePageHtml(result, result ? undefined : 'Email not found'), {
        headers: { 'Content-Type': 'text/html' },
    });
}

function getUnsubscribePageHtml(success: boolean, error?: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unsubscribe - ZeroGambit</title>
  <style>
    body { font-family: 'Segoe UI', sans-serif; background: #0a0a0a; color: #e5e5e5; margin: 0; padding: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .container { max-width: 500px; padding: 40px; text-align: center; }
    .icon { font-size: 64px; margin-bottom: 20px; }
    h1 { color: white; margin-bottom: 15px; }
    p { color: #999; line-height: 1.6; }
    .button { display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">${success ? '✅' : '❌'}</div>
    <h1>${success ? 'Unsubscribed' : 'Oops!'}</h1>
    <p>${success
            ? "You've been successfully unsubscribed from ZeroGambit emails. We're sorry to see you go!"
            : error || 'Something went wrong. Please try again.'
        }</p>
    <a href="https://zerogambit.io" class="button">Back to ZeroGambit</a>
  </div>
</body>
</html>`;
}
