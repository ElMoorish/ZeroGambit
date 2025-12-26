
import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const VideoTitle: React.FC<{ text: string }> = ({ text }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const scale = spring({
        frame,
        fps,
        from: 0.8,
        to: 1,
        config: {
            damping: 10,
            mass: 0.5,
        },
    });

    return (
        <h1
            style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 800,
                fontSize: 80,
                textAlign: 'center',
                position: 'absolute',
                top: 0,
                width: '100%',
                color: '#f5f3f0',
                transform: `scale(${scale})`,
                textShadow: '0 4px 12px rgba(0,0,0,0.5)',
                margin: 0,
                padding: '0 20px',
                lineHeight: 1.1,
            }}
        >
            {text}
        </h1>
    );
};
