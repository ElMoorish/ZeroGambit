"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Shield, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface CaptchaModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    gameId: string;
}

type CaptchaStatus = "idle" | "loading" | "solving" | "success" | "error";

export function CaptchaModal({
    isOpen,
    onClose,
    onSuccess,
    gameId,
}: CaptchaModalProps) {
    const [status, setStatus] = useState<CaptchaStatus>("idle");
    const [error, setError] = useState<string | null>(null);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setStatus("idle");
            setError(null);
        }
    }, [isOpen]);

    const handleStartCaptcha = async () => {
        setStatus("loading");
        setError(null);

        try {
            // Request CAPTCHA from backend
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/captcha/request`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ gameId }),
            });

            if (!response.ok) {
                throw new Error("Failed to request CAPTCHA");
            }

            const { taskId } = await response.json();
            setStatus("solving");

            // Poll for CAPTCHA solution
            let attempts = 0;
            const maxAttempts = 60; // 60 seconds max wait

            const pollSolution = async () => {
                attempts++;

                const checkResponse = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/captcha/check/${taskId}`
                );

                if (!checkResponse.ok) {
                    throw new Error("Failed to check CAPTCHA status");
                }

                const result = await checkResponse.json();

                if (result.status === "ready") {
                    setStatus("success");
                    setTimeout(() => {
                        onSuccess();
                    }, 1000);
                } else if (result.status === "processing" && attempts < maxAttempts) {
                    // Continue polling
                    setTimeout(pollSolution, 1000);
                } else if (attempts >= maxAttempts) {
                    throw new Error("CAPTCHA solving timeout");
                } else {
                    throw new Error(result.error || "CAPTCHA solving failed");
                }
            };

            await pollSolution();
        } catch (err) {
            setStatus("error");
            setError(err instanceof Error ? err.message : "An error occurred");
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-md bg-card rounded-2xl border border-border shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Shield className="w-6 h-6 text-primary" />
                            <h2 className="text-lg font-semibold">Verification Required</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-secondary transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {status === "idle" && (
                            <div className="text-center">
                                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Shield className="w-10 h-10 text-primary" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">Ready to Analyze</h3>
                                <p className="text-muted-foreground mb-6">
                                    Complete a quick verification to start your game analysis
                                </p>
                                <button
                                    onClick={handleStartCaptcha}
                                    className="w-full py-3 px-6 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary-hover transition-all btn-glow"
                                >
                                    Start Verification
                                </button>
                            </div>
                        )}

                        {(status === "loading" || status === "solving") && (
                            <div className="text-center py-8">
                                <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
                                <h3 className="text-lg font-semibold mb-2">
                                    {status === "loading" ? "Preparing..." : "Solving CAPTCHA..."}
                                </h3>
                                <p className="text-muted-foreground">
                                    {status === "loading"
                                        ? "Setting up verification"
                                        : "This usually takes 10-30 seconds"}
                                </p>
                            </div>
                        )}

                        {status === "success" && (
                            <div className="text-center py-8">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", bounce: 0.5 }}
                                >
                                    <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
                                </motion.div>
                                <h3 className="text-lg font-semibold mb-2 text-green-500">
                                    Verification Complete!
                                </h3>
                                <p className="text-muted-foreground">Starting analysis...</p>
                            </div>
                        )}

                        {status === "error" && (
                            <div className="text-center py-8">
                                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
                                <h3 className="text-lg font-semibold mb-2 text-red-500">
                                    Verification Failed
                                </h3>
                                <p className="text-muted-foreground mb-4">{error}</p>
                                <button
                                    onClick={handleStartCaptcha}
                                    className="px-6 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                                >
                                    Try Again
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-3 border-t border-border bg-muted/30">
                        <p className="text-xs text-muted-foreground text-center">
                            Powered by 2captcha.com • Protects against automated abuse
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
