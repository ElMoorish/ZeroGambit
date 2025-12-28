import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route Proxy - Proxies requests to Python backend
 * This ensures HTTPS is used and redirects don't leak to the browser
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    return proxyRequest(request, await params);
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    return proxyRequest(request, await params);
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    return proxyRequest(request, await params);
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    return proxyRequest(request, await params);
}

async function proxyRequest(
    request: NextRequest,
    params: { path: string[] }
) {
    // Get backend URL and force HTTPS for trycloudflare
    let backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';

    console.log(`[API Proxy] Original BACKEND_URL: ${process.env.BACKEND_URL || 'NOT SET'}`);

    if (backendUrl.includes('trycloudflare.com')) {
        backendUrl = backendUrl.replace(/^http:\/\//i, 'https://');
    }

    // Build the target URL
    const pathString = params.path?.join('/') || '';
    const searchParams = request.nextUrl.searchParams.toString();
    const targetUrl = `${backendUrl}/${pathString}${searchParams ? '?' + searchParams : ''}`;

    console.log(`[API Proxy] ${request.method} -> ${targetUrl}`);

    try {
        // Get request body for non-GET requests
        let body: string | undefined;
        if (request.method !== 'GET' && request.method !== 'HEAD') {
            try {
                body = await request.text();
            } catch {
                // No body
            }
        }

        // Make the request to backend
        const response = await fetch(targetUrl, {
            method: request.method,
            headers: {
                'Content-Type': request.headers.get('Content-Type') || 'application/json',
                'Accept': request.headers.get('Accept') || 'application/json',
                // Forward auth headers if present
                ...(request.headers.get('Authorization')
                    ? { 'Authorization': request.headers.get('Authorization')! }
                    : {}
                ),
            },
            body: body,
            // Don't follow redirects - handle them ourselves
            redirect: 'manual',
        });

        // If backend returns a redirect, follow it ourselves with HTTPS
        if (response.status >= 300 && response.status < 400) {
            const location = response.headers.get('Location');
            if (location) {
                // Force HTTPS in redirect URL
                const secureLocation = location.replace(/^http:\/\//i, 'https://');
                console.log(`[API Proxy] Following redirect to: ${secureLocation}`);

                const redirectResponse = await fetch(secureLocation, {
                    method: request.method,
                    headers: {
                        'Content-Type': request.headers.get('Content-Type') || 'application/json',
                        'Accept': request.headers.get('Accept') || 'application/json',
                    },
                    body: body,
                });

                const data = await redirectResponse.text();
                return new NextResponse(data, {
                    status: redirectResponse.status,
                    headers: {
                        'Content-Type': redirectResponse.headers.get('Content-Type') || 'application/json',
                    },
                });
            }
        }

        // Return the response
        const data = await response.text();
        return new NextResponse(data, {
            status: response.status,
            headers: {
                'Content-Type': response.headers.get('Content-Type') || 'application/json',
            },
        });

    } catch (error) {
        console.error('[API Proxy] Error:', error);
        return NextResponse.json(
            { error: 'Proxy error', message: String(error) },
            { status: 500 }
        );
    }
}
