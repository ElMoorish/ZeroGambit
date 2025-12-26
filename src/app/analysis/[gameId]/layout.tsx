
import { Metadata } from "next";

type Props = {
    params: Promise<{ gameId: string }>;
};

export async function generateMetadata(
    { params }: Props,
): Promise<Metadata> {
    const resolvedParams = await params;
    const id = resolvedParams.gameId;

    // Future: Fetch game data here to get players names
    // const game = await fetchGame(id);

    return {
        title: `Game Analysis • ${id.substring(0, 8)}`,
        description: `Deep dive analysis for chess game ${id}. Uncover mistakes, find missed wins, and improve your rating with ZeroGambit AI.`,
        robots: {
            index: false, // Don't index individual user games to save crawl budget? Or true? Let's say false for now to be safe on privacy? Actually users might want to share. Let's default to index: true but let's leave it standard.
        }
    };
}

export default function AnalysisLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
