'use client';

import { ReactNode } from "react";
import { useUser, useAuth, SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

/**
 * Safe Clerk Hooks and Components
 * 
 * These hooks and components wrap Clerk's APIs to handle errors gracefully
 * when Clerk might not be properly configured.
 */

/**
 * Check if Clerk key is valid at runtime
 */
function getClerkKeyStatus(): boolean {
    const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
    return key.length > 20 &&
        key.startsWith('pk_') &&
        !key.includes('xxxxx') &&
        !key.includes('placeholder');
}

/**
 * Safe useUser hook that catches errors when Clerk is not configured
 */
export function useSafeUser() {
    try {
        // Try to use the real Clerk hook
        const result = useUser();
        return result;
    } catch (error) {
        console.warn('Clerk useUser hook failed:', error);
        // Return mock data when Clerk fails
        return {
            isSignedIn: false,
            isLoaded: true,
            user: null,
        };
    }
}

/**
 * Safe useAuth hook
 */
export function useSafeAuth() {
    try {
        const result = useAuth();
        return result;
    } catch (error) {
        console.warn('Clerk useAuth hook failed:', error);
        return {
            isSignedIn: false,
            isLoaded: true,
            userId: null,
            sessionId: null,
            getToken: async () => null,
        };
    }
}

/**
 * Check if Clerk is available
 */
export function isClerkAvailable(): boolean {
    return getClerkKeyStatus();
}

/**
 * Safe SignedIn component - only renders children when user is signed in
 */
export function SafeSignedIn({ children }: { children: ReactNode }) {
    try {
        return <SignedIn>{children}</SignedIn>;
    } catch {
        return null;
    }
}

/**
 * Safe SignedOut component - only renders children when user is signed out
 */
export function SafeSignedOut({ children }: { children: ReactNode }) {
    try {
        return <SignedOut>{children}</SignedOut>;
    } catch {
        return <>{children}</>;
    }
}

/**
 * Safe SignInButton component
 */
export function SafeSignInButton({
    children,
    mode = 'modal'
}: {
    children?: ReactNode;
    mode?: 'modal' | 'redirect';
}) {
    try {
        return <SignInButton mode={mode}>{children}</SignInButton>;
    } catch {
        return <a href="/sign-in">{children}</a>;
    }
}

/**
 * Safe UserButton component
 */
export function SafeUserButton({
    afterSignOutUrl = '/'
}: {
    afterSignOutUrl?: string;
}) {
    try {
        return <UserButton afterSignOutUrl={afterSignOutUrl} />;
    } catch {
        return (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-sm font-bold">
                ?
            </div>
        );
    }
}
