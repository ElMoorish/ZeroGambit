'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { ReactNode } from 'react';

interface ClientClerkProviderProps {
    children: ReactNode;
}

/**
 * Client-side ClerkProvider wrapper
 * 
 * Always wraps children with ClerkProvider. Clerk itself handles
 * invalid keys gracefully. The conditional key checking was causing
 * issues for valid keys in development.
 */
export function ClientClerkProvider({ children }: ClientClerkProviderProps) {
    // Always use ClerkProvider - Clerk handles missing/invalid keys gracefully
    // The key validation is only done at build time in Docker via Dockerfile
    return <ClerkProvider>{children}</ClerkProvider>;
}
