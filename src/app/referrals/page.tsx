"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Navigation } from "@/components/Navigation";
import { useSafeUser } from "@/hooks/useSafeClerk";
import {
    Gift,
    Copy,
    Check,
    Users,
    DollarSign,
    Trophy,
    Crown,
    Share2,
    Twitter,
    Youtube,
    TrendingUp,
    Lock,
    ExternalLink,
} from "lucide-react";
import {
    getReferralCodeByUser,
    createReferralCode,
    getReferrerStats,
    updateReferrerStats,
    getLeaderboard,
    getReferralHistory,
    getTombolaPrizes,
    generateReferralUrl,
    COMMISSION_AMOUNT,
    type ReferralCode,
    type ReferrerStats,
    type Referral,
    type TombolaPrize,
} from "@/lib/referrals";

/**
 * Referral Dashboard Page
 * 
 * Features:
 * - Referral link generation and sharing
 * - Stats: clicks, signups, qualified referrals, earnings
 * - Leaderboard with top referrers
 * - Tombola prize announcements
 */

export default function ReferralsPage() {
    const { isSignedIn, user, isLoaded } = useSafeUser();
    const [isAnnualSubscriber, setIsAnnualSubscriber] = useState(false);
    const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
    const [stats, setStats] = useState<ReferrerStats | null>(null);
    const [leaderboard, setLeaderboard] = useState<ReferrerStats[]>([]);
    const [referralHistory, setReferralHistory] = useState<Referral[]>([]);
    const [tombolaPrizes, setTombolaPrizes] = useState<TombolaPrize[]>([]);
    const [copied, setCopied] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            // If no user, we still need to set isLoading to false
            if (!user?.id) {
                setIsLoading(false);
                return;
            }

            try {
                // TODO: Check actual subscription status from Clerk/BoomFi
                // For now, simulate annual subscriber check
                const subscriptionStatus = user.publicMetadata?.subscription as string;
                const isAnnual = subscriptionStatus === 'annual' || subscriptionStatus === 'grandmaster';
                setIsAnnualSubscriber(isAnnual);

                if (isAnnual) {
                    // Get or create referral code
                    let code = await getReferralCodeByUser(user.id);
                    if (!code) {
                        code = await createReferralCode(user.id);
                    }
                    setReferralCode(code);

                    // Update and get stats
                    await updateReferrerStats(user.id);
                    const userStats = await getReferrerStats(user.id);
                    setStats(userStats || null);

                    // Get referral history
                    const history = await getReferralHistory(user.id);
                    setReferralHistory(history);
                }

                // Get leaderboard (visible to all)
                const leaders = await getLeaderboard(10);
                setLeaderboard(leaders);

                // Get tombola prizes
                const prizes = await getTombolaPrizes();
                setTombolaPrizes(prizes);
            } catch (error) {
                console.error("Failed to load referral data:", error);
            } finally {
                setIsLoading(false);
            }
        }

        if (isLoaded) {
            loadData();
        }
    }, [user, isLoaded]);

    const referralUrl = referralCode ? generateReferralUrl(referralCode.code) : "";

    const handleCopy = async () => {
        if (!referralUrl) return;
        await navigator.clipboard.writeText(referralUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = (platform: 'twitter' | 'email') => {
        const text = "Level up your chess game with ZeroGambit! Use my link:";

        if (platform === 'twitter') {
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralUrl)}`, '_blank');
        } else {
            window.location.href = `mailto:?subject=Check out ZeroGambit&body=${encodeURIComponent(text + '\n' + referralUrl)}`;
        }
    };

    if (!isLoaded || isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!isSignedIn) {
        return (
            <div className="min-h-screen bg-background">
                <Navigation />
                <main className="container mx-auto px-6 py-24 text-center">
                    <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
                    <h1 className="text-3xl font-bold mb-4">Sign In Required</h1>
                    <p className="text-muted-foreground mb-8">
                        Please sign in to access the referral program.
                    </p>
                    <a
                        href="/sign-in?redirect_url=/referrals"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold"
                    >
                        Sign In
                    </a>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navigation />

            <main className="container mx-auto px-6 py-24">
                {/* Header */}
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-400 mb-4"
                    >
                        <Gift className="w-4 h-4" />
                        Referral Program
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-bold mb-4"
                    >
                        Earn <span className="text-amber-400">${COMMISSION_AMOUNT.toFixed(2)}</span> Per Referral
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-muted-foreground max-w-lg mx-auto"
                    >
                        Share ZeroGambit with chess friends. Earn 30% when they go annual.
                        Top referrers win prizes!
                    </motion.p>
                </div>

                {/* Non-Annual Subscriber Gate */}
                {!isAnnualSubscriber && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-2xl mx-auto text-center py-16"
                    >
                        <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Crown className="w-12 h-12 text-amber-400" />
                        </div>
                        <h2 className="text-2xl font-bold mb-4">Grandmaster Exclusive</h2>
                        <p className="text-muted-foreground mb-8">
                            The referral program is available exclusively for Grandmaster (annual) subscribers.
                            Upgrade to start earning!
                        </p>
                        <a
                            href="/pricing"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-amber-500 text-black rounded-xl font-semibold hover:bg-amber-400 transition-colors"
                        >
                            Upgrade to Grandmaster
                        </a>
                    </motion.div>
                )}

                {/* Annual Subscriber Dashboard */}
                {isAnnualSubscriber && referralCode && (
                    <div className="max-w-6xl mx-auto">
                        {/* Referral Link */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-card border border-border rounded-2xl p-8 mb-8"
                        >
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Share2 className="w-5 h-5 text-primary" />
                                Your Referral Link
                            </h2>

                            <div className="flex items-center gap-3 mb-6">
                                <div className="flex-1 bg-background border border-border rounded-xl px-4 py-3">
                                    <code className="text-sm break-all">{referralUrl}</code>
                                </div>
                                <button
                                    onClick={handleCopy}
                                    className="p-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
                                >
                                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={() => handleShare('twitter')}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#1DA1F2]/10 text-[#1DA1F2] rounded-lg hover:bg-[#1DA1F2]/20 transition-colors"
                                >
                                    <Twitter className="w-4 h-4" />
                                    Share on Twitter
                                </button>
                                <button
                                    onClick={() => handleShare('email')}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Share via Email
                                </button>
                            </div>
                        </motion.div>

                        {/* Stats Grid */}
                        {stats && (
                            <div className="grid md:grid-cols-4 gap-6 mb-12">
                                {[
                                    { label: "Link Clicks", value: stats.totalClicks, icon: TrendingUp, color: "text-blue-400" },
                                    { label: "Signups", value: stats.totalSignups, icon: Users, color: "text-emerald-400" },
                                    { label: "Qualified", value: stats.qualifiedReferrals, icon: Trophy, color: "text-amber-400" },
                                    { label: "Earnings", value: `$${stats.totalEarnings.toFixed(2)}`, icon: DollarSign, color: "text-green-400" },
                                ].map((stat, index) => {
                                    const Icon = stat.icon;
                                    return (
                                        <motion.div
                                            key={stat.label}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 * index }}
                                            className="bg-card border border-border rounded-2xl p-6"
                                        >
                                            <div className={`inline-flex p-2 rounded-lg bg-white/5 mb-3 ${stat.color}`}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <p className="text-3xl font-bold mb-1">{stat.value}</p>
                                            <p className="text-sm text-muted-foreground">{stat.label}</p>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}

                        {/* How It Works */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-8 mb-12"
                        >
                            <h3 className="text-xl font-bold mb-6 text-center">How It Works</h3>
                            <div className="grid md:grid-cols-4 gap-6">
                                {[
                                    { step: "1", title: "Share", desc: "Send your link to chess friends" },
                                    { step: "2", title: "They Subscribe", desc: "They sign up for Grandmaster (annual)" },
                                    { step: "3", title: "You Earn", desc: `Get $${COMMISSION_AMOUNT.toFixed(2)} per qualified referral` },
                                    { step: "4", title: "Win Prizes", desc: "Top referrers win monthly tombola!" },
                                ].map((item) => (
                                    <div key={item.step} className="text-center">
                                        <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-3 text-amber-400 font-bold">
                                            {item.step}
                                        </div>
                                        <h4 className="font-semibold mb-1">{item.title}</h4>
                                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Leaderboard & Tombola */}
                        <div className="grid md:grid-cols-2 gap-8 mb-12">
                            {/* Leaderboard */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-card border border-border rounded-2xl p-6"
                            >
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <Trophy className="w-5 h-5 text-amber-400" />
                                    Leaderboard
                                </h3>

                                {leaderboard.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-8">
                                        Be the first to make a referral!
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {leaderboard.map((leader, index) => (
                                            <div
                                                key={leader.userId}
                                                className={`flex items-center gap-3 p-3 rounded-lg ${leader.userId === user?.id
                                                    ? "bg-primary/10 border border-primary/20"
                                                    : "bg-white/5"
                                                    }`}
                                            >
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? "bg-amber-500 text-black" :
                                                    index === 1 ? "bg-slate-400 text-black" :
                                                        index === 2 ? "bg-orange-600 text-white" :
                                                            "bg-slate-700 text-white"
                                                    }`}>
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm">
                                                        {leader.userId === user?.id ? "You" : `Referrer #${index + 1}`}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {leader.qualifiedReferrals} referrals
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-mono text-sm text-green-400">
                                                        ${leader.totalEarnings.toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>

                            {/* Tombola */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-card border border-border rounded-2xl p-6"
                            >
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <Youtube className="w-5 h-5 text-red-500" />
                                    Prize Tombola
                                </h3>

                                <div className="bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
                                    <p className="text-sm text-center">
                                        🎉 Win surprise prizes in our YouTube tombola!
                                        <br />
                                        <span className="text-xs text-muted-foreground">
                                            Monthly/bi-annual draws for top referrers
                                        </span>
                                    </p>
                                </div>

                                {tombolaPrizes.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-4 text-sm">
                                        No prizes announced yet. Check back soon!
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {tombolaPrizes.slice(0, 3).map((prize) => (
                                            <div
                                                key={prize.id}
                                                className="p-3 rounded-lg bg-white/5"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-medium text-sm">{prize.title}</p>
                                                        <p className="text-xs text-muted-foreground">{prize.period}</p>
                                                    </div>
                                                    {prize.isDrawn ? (
                                                        <span className="text-xs text-green-400">Drawn ✓</span>
                                                    ) : (
                                                        <span className="text-xs text-amber-400">Upcoming</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        </div>

                        {/* Referral History */}
                        {referralHistory.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-card border border-border rounded-2xl p-6"
                            >
                                <h3 className="text-lg font-bold mb-4">Referral History</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-border">
                                                <th className="text-left py-3 px-4">Date</th>
                                                <th className="text-left py-3 px-4">Status</th>
                                                <th className="text-right py-3 px-4">Commission</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {referralHistory.slice(0, 10).map((ref) => (
                                                <tr key={ref.id} className="border-b border-border/50">
                                                    <td className="py-3 px-4 text-muted-foreground">
                                                        {new Date(ref.clickedAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs ${ref.status === 'qualified' || ref.status === 'paid'
                                                            ? 'bg-green-500/20 text-green-400'
                                                            : ref.status === 'signed_up'
                                                                ? 'bg-blue-500/20 text-blue-400'
                                                                : 'bg-slate-500/20 text-slate-400'
                                                            }`}>
                                                            {ref.status.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-mono">
                                                        {ref.commissionAmount > 0 ? (
                                                            <span className="text-green-400">+${ref.commissionAmount.toFixed(2)}</span>
                                                        ) : (
                                                            <span className="text-muted-foreground">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}

                        {/* Terms */}
                        <div className="mt-8 text-center">
                            <p className="text-xs text-muted-foreground max-w-lg mx-auto">
                                Commissions are earned only on annual Grandmaster subscriptions.
                                Monthly subscriptions do not qualify. Referral links expire after 30 days.
                                Prize tombola winners are drawn on our YouTube channel.
                            </p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
