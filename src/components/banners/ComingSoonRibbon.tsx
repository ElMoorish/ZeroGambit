"use client";

/**
 * Red Diagonal "Coming Soon" Ribbon Badge
 * Used to overlay on menu items that are under development
 */
export function ComingSoonRibbon({ className = "" }: { className?: string }) {
    return (
        <div className={`absolute -right-2 -top-2 overflow-hidden w-16 h-16 ${className}`}>
            <div
                className="absolute top-3 -right-6 w-20 text-center text-[9px] font-bold text-white bg-red-600 py-0.5 shadow-md"
                style={{
                    transform: "rotate(45deg)",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.3)"
                }}
            >
                SOON
            </div>
        </div>
    );
}

/**
 * Larger version of the Coming Soon ribbon for card components
 */
export function ComingSoonBadge() {
    return (
        <div className="absolute top-0 right-0 overflow-hidden w-24 h-24">
            <div
                className="absolute top-6 -right-6 w-28 text-center text-xs font-bold text-white bg-red-600 py-1 shadow-lg"
                style={{
                    transform: "rotate(45deg)",
                }}
            >
                COMING SOON
            </div>
        </div>
    );
}
