
import React, { useEffect, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useCurrentFrame } from 'remotion';

interface ChessBoardAnimationProps {
    initialFen: string;
    moves: string[]; // LAN or SAN moves
    orientation: 'white' | 'black';
    startDelayFrames?: number;
    moveDurationFrames?: number;
}

export const ChessBoardAnimation: React.FC<ChessBoardAnimationProps> = ({
    initialFen,
    moves,
    orientation,
    startDelayFrames = 60,
    moveDurationFrames = 60
}) => {
    const frame = useCurrentFrame();
    const [game, setGame] = useState(new Chess(initialFen));

    // Calculate current board state based on frame
    useEffect(() => {
        const newGame = new Chess(initialFen);

        // Calculate which move we should be at
        // If frame < START_DELAY, index is -1 (initial position)
        // If frame > START_DELAY, calculate index

        let currentIdx = -1;

        if (frame >= startDelayFrames) {
            const timeAfterStart = frame - startDelayFrames;
            // E.g. 0-60 frames -> move 0
            currentIdx = Math.floor(timeAfterStart / moveDurationFrames);
        }

        // Cap at total moves
        if (currentIdx >= moves.length) {
            currentIdx = moves.length - 1;
        }

        // Apply moves up to current index
        for (let i = 0; i <= currentIdx; i++) {
            try {
                // Try sanitize - if it fails, it might be just SAN
                newGame.move(moves[i]);
            } catch (e) {
                console.error(`Invalid move ${moves[i]}:`, e);
            }
        }

        setGame(newGame);

    }, [frame, initialFen, moves, startDelayFrames, moveDurationFrames]);

    // Custom styles for board
    const customBoardStyle = {
        borderRadius: "4px",
        boxShadow: "0 5px 15px rgba(0, 0, 0, 0.5)",
    };

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <Chessboard
                position={game.fen()}
                boardOrientation={orientation}
                animationDuration={0}
                customBoardStyle={customBoardStyle}
                customDarkSquareStyle={{ backgroundColor: '#769656' }}
                customLightSquareStyle={{ backgroundColor: '#eeeed2' }}
            />
        </div>
    );
};
