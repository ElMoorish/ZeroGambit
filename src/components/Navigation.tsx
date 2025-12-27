"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Menu,
    X,
    Home,
    Puzzle,
    BarChart3,
    Gamepad2,
    Settings,
    Crown,
    Bot,
    ChevronRight,
    Film,
    Dna,
    GraduationCap,
    Gift,
    Video,
    Swords,
    Cpu,
    Lock
} from "lucide-react";
import { useSafeUser, SafeSignedIn, SafeSignedOut, SafeSignInButton, SafeUserButton } from "@/hooks/useSafeClerk";
import { ComingSoonRibbon } from "@/components/banners/ComingSoonRibbon";

interface NavItem {
    id: string;
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    enabled: boolean;
    description: string;
    color: string;
    comingSoon?: boolean; // Features under development
    adminOnly?: boolean;  // Only admin can access
}

const NAV_ITEMS: NavItem[] = [
    {
        id: "home",
        label: "Home",
        href: "/",
        icon: Home,
        enabled: true,
        description: "Dashboard",
        color: "text-blue-500"
    },
    {
        id: "analysis",
        label: "Game Analysis",
        href: "/games",
        icon: BarChart3,
        enabled: true,
        description: "Analyze your games",
        color: "text-purple-500"
    },
    {
        id: "puzzles",
        label: "Puzzle Training",
        href: "/puzzles",
        icon: Puzzle,
        enabled: true,
        description: "Train with puzzles",
        color: "text-emerald-500"
    },
    {
        id: "trainer",
        label: "AI Trainer",
        href: "/trainer",
        icon: Bot,
        enabled: true,
        description: "AI-powered coaching",
        color: "text-amber-500"
    },
    {
        id: "curriculum",
        label: "Curriculum",
        href: "/curriculum",
        icon: GraduationCap,
        enabled: true,
        description: "Stone → Flow → Sage",
        color: "text-indigo-500"
    },
    {
        id: "dna",
        label: "Chess DNA",
        href: "/dna",
        icon: Dna,
        enabled: true,
        description: "Your playstyle profile",
        color: "text-pink-500",
        comingSoon: true,
        adminOnly: true
    },
    {
        id: "rivals",
        label: "Rivals",
        href: "/rivals",
        icon: Swords,
        enabled: true,
        description: "Challenge friends",
        color: "text-red-500",
        comingSoon: true,
        adminOnly: true
    },
    {
        id: "studio",
        label: "Creator Studio",
        href: "/studio",
        icon: Film,
        enabled: true,
        description: "AI-powered captions",
        color: "text-orange-500",
        comingSoon: true,
        adminOnly: true
    },
    {
        id: "video-studio",
        label: "Video Studio",
        href: "/video-studio",
        icon: Video,
        enabled: true,
        description: "Create chess videos",
        color: "text-cyan-500",
        comingSoon: true,
        adminOnly: true
    },
    {
        id: "benchmark",
        label: "System Benchmark",
        href: "/benchmark",
        icon: Cpu,
        enabled: true,
        description: "Test your hardware",
        color: "text-slate-400",
        comingSoon: true,
        adminOnly: true
    },
    {
        id: "referrals",
        label: "Referrals",
        href: "/referrals",
        icon: Gift,
        enabled: true,
        description: "Earn rewards",
        color: "text-amber-400"
    },
    {
        id: "pricing",
        label: "Upgrade",
        href: "/pricing",
        icon: Crown,
        enabled: true,
        description: "Unlock Pro Features",
        color: "text-amber-400"
    },
    {
        id: "content-studio",
        label: "Content Studio",
        href: "/content-studio",
        icon: Film,
        enabled: true,
        description: "Create viral shorts",
        color: "text-red-500"
    },
];

export function Navigation() {
    const [isOpen, setIsOpen] = useState(false);
    const { user } = useSafeUser();
    const isAdmin = user?.publicMetadata?.role === 'admin';

    // Filter nav items: hide Content Studio for non-admins
    const visibleNavItems = NAV_ITEMS.filter(item => {
        if (item.id === 'content-studio' && !isAdmin) return false;
        return true;
    });

    return (
        <>
            {/* Menu Toggle Button - Top Right */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed top-4 right-4 z-[100] p-3 rounded-xl bg-card border border-border hover:bg-secondary transition-all shadow-lg"
                aria-label="Toggle navigation"
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div
                            key="close"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <X className="w-6 h-6" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="menu"
                            initial={{ rotate: 90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: -90, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Menu className="w-6 h-6" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </button>

            {/* Navigation Panel */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                        />

                        {/* Panel */}
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 bottom-0 z-50 w-80 bg-card border-l border-border shadow-2xl flex flex-col"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 pb-4 border-b border-border">
                                <div className="flex items-center gap-2">
                                    <Gamepad2 className="w-6 h-6 text-primary" />
                                    <span className="font-bold text-lg">Features</span>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 rounded-lg hover:bg-secondary transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Navigation Items - Scrollable */}
                            <nav className="flex-1 overflow-y-auto p-6 pt-4 space-y-2">
                                {visibleNavItems.map((item, index) => {
                                    const Icon = item.icon;
                                    const isLocked = item.adminOnly && !isAdmin;
                                    // Show ribbon for ALL users on comingSoon features
                                    const showComingSoon = item.comingSoon === true;

                                    return (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="relative"
                                        >
                                            {/* Coming Soon Ribbon */}
                                            {showComingSoon && <ComingSoonRibbon />}

                                            {item.enabled && !isLocked ? (
                                                <Link
                                                    href={item.href}
                                                    onClick={() => setIsOpen(false)}
                                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-all group"
                                                >
                                                    <div className={`p-2 rounded-lg bg-secondary ${item.color}`}>
                                                        <Icon className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="font-medium">{item.label}</div>
                                                        <div className="text-xs text-muted-foreground">{item.description}</div>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </Link>
                                            ) : (
                                                <div
                                                    className="flex items-center gap-3 p-3 rounded-xl opacity-60 cursor-not-allowed"
                                                    title={isLocked ? "Coming Soon - Admin Preview Only" : "Coming Soon"}
                                                >
                                                    <div className={`p-2 rounded-lg bg-secondary ${item.color}`}>
                                                        <Icon className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="font-medium flex items-center gap-2">
                                                            {item.label}
                                                            {isLocked && <Lock className="w-3 h-3 text-red-500" />}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">{item.description}</div>
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </nav>

                            {/* Auth & Settings - Fixed at Bottom */}
                            <div className="p-6 pt-4 border-t border-border bg-card space-y-3">
                                {/* Auth Buttons */}
                                <SafeSignedOut>
                                    <div className="p-3 bg-primary/10 rounded-xl">
                                        <SafeSignInButton mode="modal">
                                            <button className="w-full flex items-center justify-center gap-2 text-primary font-medium">
                                                Sign In
                                            </button>
                                        </SafeSignInButton>
                                    </div>
                                </SafeSignedOut>
                                <SafeSignedIn>
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                                        <SafeUserButton afterSignOutUrl="/" />
                                        <span className="text-sm font-medium">My Account</span>
                                    </div>
                                </SafeSignedIn>

                                <Link
                                    href="/settings"
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-all"
                                >
                                    <Settings className="w-5 h-5 text-muted-foreground" />
                                    <span className="text-muted-foreground">Settings</span>
                                </Link>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence >
        </>
    );
}
