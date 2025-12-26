import { Composition, staticFile } from 'remotion';
import { getAudioDurationInSeconds } from "@remotion/media-utils";
import { PuzzleVideo, puzzleVideoSchema } from './compositions/PuzzleVideo';
import './index.css';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="PuzzleVideo"
        component={PuzzleVideo}
        durationInFrames={450} // Default fallback
        fps={30}
        width={1080}
        height={1920} // 9:16 aspect ratio (TikTok/Reels)
        defaultProps={{
          ...puzzleVideoSchema,
          moves: ['Qxf7'], // Sample default
          fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4'
        }}
        calculateMetadata={async ({ props }: { props: typeof puzzleVideoSchema }) => {
          if (props.audioUrl) {
            try {
              // Fetch audio duration from static file
              const durationInSeconds = await getAudioDurationInSeconds(staticFile(props.audioUrl));
              // Add 2 seconds buffer at the end
              return {
                durationInFrames: Math.ceil(durationInSeconds * 30) + 60
              };
            } catch (e) {
              console.error("Failed to calculate audio duration", e);
              return { durationInFrames: 450 };
            }
          }
          return { durationInFrames: 450 };
        }}
      />
    </>
  );
};
