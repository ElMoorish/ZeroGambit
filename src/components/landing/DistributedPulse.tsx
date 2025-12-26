"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Cpu, Zap, Globe, Users } from "lucide-react";

/**
 * Distributed Pulse - Live System Status
 * 
 * Shows "Zero Servers. 100% You." messaging
 * with simulated live stats for the local-first architecture.
 */

export function DistributedPulse() {
    const [stats, setStats] = useState({
        localCores: 0,
        globalNps: 0,
        activeUsers: 0,
    });

    // Simulate live-updating stats
    useEffect(() => {
        // Detect actual cores
        const cores = navigator.hardwareConcurrency || 4;

        // Simulate global stats with realistic-looking numbers
        const updateStats = () => {
            setStats({
                localCores: cores,
                globalNps: Math.floor(450 + Math.random() * 100), // 450-550M
                activeUsers: Math.floor(800 + Math.random() * 400), // 800-1200
            });
        };

        updateStats();
        const interval = setInterval(updateStats, 5000);
        return () => clearInterval(interval);
    }, []);

    const formatNumber = (n: number) => {
        if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
        if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
        return n.toString();
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="border-y border-border bg-card/30 backdrop-blur"
        >
            <div className="container mx-auto px-6 py-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    {/* Main Message */}
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
                            <div className="relative w-3 h-3 bg-green-500 rounded-full" />
                        </div>
                        <span className="text-sm font-medium">
                            Zero Servers. <span className="text-primary">100% You.</span>
                        </span>
                    </div>

                    {/* Live Stats */}
                    <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Cpu className="w-4 h-4" />
                            <span>Your Cores:</span>
                            <span className="font-mono font-medium text-foreground">{stats.localCores}</span>
                        </div>

                        <div className="hidden sm:flex items-center gap-2 text-muted-foreground">
                            <Zap className="w-4 h-4" />
                            <span>Global NPS:</span>
                            <motion.span
                                key={stats.globalNps}
                                initial={{ opacity: 0.5 }}
                                animate={{ opacity: 1 }}
                                className="font-mono font-medium text-foreground"
                            >
                                {formatNumber(stats.globalNps * 1000000)}
                            </motion.span>
                        </div>

                        <div className="hidden md:flex items-center gap-2 text-muted-foreground">
                            <Users className="w-4 h-4" />
                            <span>Active:</span>
                            <motion.span
                                key={stats.activeUsers}
                                initial={{ opacity: 0.5 }}
                                animate={{ opacity: 1 }}
                                className="font-mono font-medium text-foreground"
                            >
                                {formatNumber(stats.activeUsers)}
                            </motion.span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
