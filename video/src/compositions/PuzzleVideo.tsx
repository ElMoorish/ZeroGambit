import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, Audio, Sequence, staticFile, Img } from 'remotion';
import { ChessBoardAnimation } from '../components/ChessBoardAnimation';
import { VideoTitle } from '../components/VideoTitle';

// Define the props for our composition
export const puzzleVideoSchema = {
    // defaults
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4',
    moves: ['Qxf7'],
    orientation: 'white',
    hook: 'Can You Find The Mate?',
    creatorName: 'Zerogambit',
    audioUrl: '', // Optional TTS audio path
};

export const PuzzleVideo: React.FC<typeof puzzleVideoSchema> = ({
    fen,
    moves,
    orientation,
    hook,
    creatorName,
    audioUrl
}) => {
    // ... (frame/spring logic same)
    const frame = useCurrentFrame();
    const { fps, durationInFrames } = useVideoConfig();

    const opacity = spring({
        frame,
        fps,
        from: 0,
        to: 1,
        durationInFrames: 30,
    });

    // Timing Logic:
    // We want the puzzle moves to FINISH exactly 25 seconds before the end of the video.
    // This leaves the last 25s for the Outro / CTA / "Deep Dive" explanation.
    const END_BUFFER_SECONDS = 25;
    const MOVE_DURATION_SECONDS = 1.5;

    // Calculate frames
    const endBufferFrames = END_BUFFER_SECONDS * fps;
    const moveDurationFrames = Math.floor(MOVE_DURATION_SECONDS * fps);
    const totalMovesDurationFrames = moves.length * moveDurationFrames;

    // Start time = Total - Buffer - MovesDuration
    let startDelayFrames = durationInFrames - endBufferFrames - totalMovesDurationFrames;

    // Safety check: if audio is short, ensures moves start at least 1s in
    if (startDelayFrames < fps) {
        startDelayFrames = fps;
    }

    return (
        <AbsoluteFill style={{ backgroundColor: '#1a1d21' }}>
            <Sequence from={0}>
                {/* Background music/ambience if needed - or just main TTS */}
                {audioUrl && <Audio src={audioUrl.startsWith('http') ? audioUrl : staticFile(audioUrl)} />}

                {/* Visual Content */}
                <AbsoluteFill style={{ opacity, justifyContent: 'center', alignItems: 'center' }}>

                    {/* Header / Hook */}
                    <div style={{
                        position: 'absolute',
                        top: 60, // Moved up from 100
                        width: '100%',
                        textAlign: 'center',
                        zIndex: 10
                    }}>
                        <VideoTitle text={hook} />
                    </div>

                    {/* Chess Board Area */}
                    <div style={{
                        width: 650, // Reduced from 720
                        height: 650, // Reduced from 720
                        borderRadius: 24,
                        overflow: 'hidden',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                        border: '8px solid #363b44'
                    }}>
                        <ChessBoardAnimation
                            initialFen={fen}
                            moves={moves}
                            orientation={orientation as 'white' | 'black'}
                            startDelayFrames={startDelayFrames}
                            moveDurationFrames={moveDurationFrames}
                        />
                    </div>

                    {/* Footer / Branding */}
                    <div style={{
                        position: 'absolute',
                        bottom: 60,
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        <Img src={staticFile('logo.png')} style={{ height: 120, objectFit: 'contain' }} />
                    </div>

                </AbsoluteFill>
            </Sequence >
        </AbsoluteFill >
    );
};
