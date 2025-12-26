"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Crown, Sparkles, Zap, Shield, Gift } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import {
    parseReferralCodeFromUrl,
    storeReferralCode,
    getStoredReferralCode,
    getReferralCodeByCode,
    recordReferralClick,
} from "@/lib/referrals";

const TIERS = [
    {
        name: "Candidate Master",
        price: "$5.00",
        interval: "month",
        description: "Sharpen your tactical vision and analyze deeper.",
        url: "https://pay.boomfi.xyz/37LbNel4no5UxojzmlIfS1NMIKE", // BoomFi Link
        features: [
            "Unlimited AI Coach Insights",
            "Deep Analysis Engine",
            "Opening Explorer Pro",
            "Ad-Free Experience",
        ],
        highlight: false,
        color: "border-blue-500/50",
        buttonColor: "bg-secondary text-foreground hover:bg-secondary/80",
        referralEligible: false,
    },
    {
        name: "Grandmaster",
        price: "$45.00",
        interval: "year",
        description: "Total mastery over your game. Best value.",
        url: "https://pay.boomfi.xyz/37Lm6GzXH4yifrSqbfwRE5nXQya", // BoomFi Link
        features: [
            "Everything in Candidate Master",
            "Save 25% vs Monthly",
            "Personalized Progress Reports",
            "Exclusive Endgame Lessons",
            "Supporter Profile Badge",
            "Referral Program Access",
        ],
        highlight: true,
        color: "border-amber-500/50",
        buttonColor: "bg-amber-500 text-black hover:bg-amber-400",
        referralEligible: true,
    },
];

export default function PricingPage() {
    const [referralCode, setReferralCode] = useState<string | null>(null);
    const [referrerName, setReferrerName] = useState<string | null>(null);

    useEffect(() => {
        async function captureReferral() {
            // Check URL for referral code
            const urlCode = parseReferralCodeFromUrl();
            if (urlCode) {
                // Validate the code exists
                const codeRecord = await getReferralCodeByCode(urlCode);
                if (codeRecord) {
                    storeReferralCode(urlCode);
                    setReferralCode(urlCode);
                    // Record the click
                    await recordReferralClick(urlCode);
                }
            } else {
                // Check for stored code
                const storedCode = getStoredReferralCode();
                if (storedCode) {
                    setReferralCode(storedCode);
                }
            }
        }
        captureReferral();
    }, []);

    return (
        <div className="min-h-screen bg-background">
            <Navigation />
            <div className="container mx-auto px-6 py-24">

                {/* Header */}
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4"
                    >
                        <Crown className="w-4 h-4" />
                        Upgrade Your Game
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-bold mb-6"
                    >
                        Choose Your Path to Mastery
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-muted-foreground"
                    >
                        Unlock the full potential of Zerogambit with our pro tiers.
                        Investment in your skills pays the highest dividends.
                    </motion.p>
                </div>

                {/* Referral Banner */}
                {referralCode && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-4xl mx-auto mb-8 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl"
                    >
                        <div className="flex items-center gap-3">
                            <Gift className="w-5 h-5 text-amber-400" />
                            <p className="text-sm">
                                <span className="text-amber-400 font-medium">Referral applied!</span>
                                {" "}You were referred by a ZeroGambit member. Welcome!
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* Pricing Grid */}
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {TIERS.map((tier, index) => (
                        <motion.div
                            key={tier.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + index * 0.1 }}
                            className={`relative rounded-2xl border-2 p-8 bg-card flex flex-col ${tier.color} ${tier.highlight ? 'shadow-2xl shadow-amber-500/10' : ''}`}
                        >
                            {tier.highlight && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-500 text-black text-xs font-bold rounded-full uppercase tracking-wide">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
                                <p className="text-sm text-muted-foreground min-h-[40px]">{tier.description}</p>
                            </div>

                            <div className="mb-8">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-bold">{tier.price}</span>
                                    <span className="text-muted-foreground">/{tier.interval}</span>
                                </div>
                            </div>

                            <ul className="space-y-4 mb-8 flex-1">
                                {tier.features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-3">
                                        <Check className="w-5 h-5 text-primary shrink-0" />
                                        <span className="text-sm">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <a
                                href={tier.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`w-full py-4 rounded-xl font-bold text-center transition-all ${tier.buttonColor}`}
                            >
                                Choose {tier.name}
                            </a>
                        </motion.div>
                    ))}
                </div>

                {/* FAQ or Trust */}
                <div className="mt-24 text-center">
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                        <Shield className="w-4 h-4" />
                        Payments processed securely via BoomFi. Cancel anytime.
                    </p>
                </div>

            </div>
        </div>
    );
}
