"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Heart, Eye, Plus, Video } from "lucide-react";
import { db } from "@/lib/db";

/**
 * Gallery - User-Generated Content Showcase
 * 
 * Shows REAL user-created videos from the Creator Studio.
 * Falls back to empty state prompting users to create content.
 */

export interface GalleryVideo {
    id: number;
    title: string;
    thumbnail?: string;
    views: number;
    likes: number;
    author: string;
    createdAt: Date;
}

// Fetch real user videos from IndexedDB or API
async function fetchUserVideos(): Promise<GalleryVideo[]> {
    // In production, this would fetch from:
    // 1. IndexedDB for local videos
    // 2. API for featured community videos

    // For now, return empty to show the "create first video" state
    return [];
}

export function Gallery() {
    const [videos, setVideos] = useState<GalleryVideo[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadVideos() {
            try {
                const userVideos = await fetchUserVideos();
                setVideos(userVideos);
            } catch (error) {
                console.error("Failed to load videos:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadVideos();
    }, []);

    // Show loading state
    if (isLoading) {
        return (
            <section className="py-24 bg-gradient-to-b from-[#1a1d21] to-background">
                <div className="container mx-auto px-6 text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
            </section>
        );
    }

    // Show empty state when no videos
    if (videos.length === 0) {
        return (
            <section className="py-24 bg-gradient-to-b from-[#1a1d21] to-background">
                <div className="container mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center max-w-2xl mx-auto"
                    >
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Video className="w-10 h-10 text-primary" />
                        </div>

                        <h2 className="text-4xl font-bold mb-4">
                            Be The <span className="text-primary">First</span>
                        </h2>
                        <p className="text-muted-foreground mb-8">
                            Create stunning chess content with our Creator Studio.
                            Turn your best games into viral videos.
                        </p>

                        <motion.a
                            href="/studio"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Create Your First Video
                        </motion.a>

                        <p className="mt-6 text-sm text-muted-foreground italic">
                            "You play the game. We make you famous."
                        </p>
                    </motion.div>
                </div>
            </section>
        );
    }

    // Show real videos in marquee
    const doubledVideos = [...videos, ...videos];

    return (
        <section className="py-24 bg-gradient-to-b from-[#1a1d21] to-background overflow-hidden">
            <div className="container mx-auto px-6 mb-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center"
                >
                    <h2 className="text-4xl font-bold mb-4">
                        Community <span className="text-primary">Highlights</span>
                    </h2>
                    <p className="text-muted-foreground max-w-lg mx-auto">
                        See what others are creating with ZeroGambit Creator Studio.
                    </p>
                </motion.div>
            </div>

            {/* Marquee */}
            <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#1a1d21] to-transparent z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#1a1d21] to-transparent z-10" />

                <motion.div
                    className="flex gap-6"
                    animate={{ x: [0, -1920] }}
                    transition={{
                        x: {
                            repeat: Infinity,
                            repeatType: "loop",
                            duration: 30,
                            ease: "linear",
                        },
                    }}
                >
                    {doubledVideos.map((video, index) => (
                        <VideoCard key={`${video.id}-${index}`} video={video} />
                    ))}
                </motion.div>
            </div>

            <div className="container mx-auto px-6 mt-12 text-center">
                <motion.a
                    href="/studio"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                >
                    <Play className="w-5 h-5" />
                    Create Your Own
                </motion.a>
            </div>
        </section>
    );
}

function VideoCard({ video }: { video: GalleryVideo }) {
    const formatNumber = (num: number): string => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
        return num.toString();
    };

    return (
        <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className="flex-shrink-0 w-64 bg-card border border-border rounded-2xl overflow-hidden cursor-pointer group"
        >
            {/* Thumbnail */}
            <div className="relative aspect-[9/16] bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                {video.thumbnail ? (
                    <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <span className="text-4xl">♟️</span>
                )}

                {/* Play Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
                        <Play className="w-6 h-6 text-white fill-white" />
                    </div>
                </div>
            </div>

            {/* Info */}
            <div className="p-4">
                <p className="font-medium text-sm truncate mb-1">{video.title}</p>
                <p className="text-xs text-muted-foreground mb-2">{video.author}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {formatNumber(video.views)}
                    </span>
                    <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {formatNumber(video.likes)}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}
