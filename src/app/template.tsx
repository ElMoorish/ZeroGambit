"use client";

import { PageTransitionWrapper } from "@/components/PageTransitionWrapper";

/**
 * Template for page transitions
 * 
 * This file wraps all pages in the app directory with AnimatePresence
 * to enable smooth route transitions.
 */

export default function Template({ children }: { children: React.ReactNode }) {
    return <PageTransitionWrapper>{children}</PageTransitionWrapper>;
}
