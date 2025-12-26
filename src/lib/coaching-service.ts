"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

// Coaching insights response type
export interface CoachingInsights {
    openingSummary: string;
    keyInsights: string[];
    lesson: string;
}

// Generate coaching insights using Gemini API
export async function generateCoachingInsights(
    gameData: {
        whiteName: string;
        blackName: string;
        result: string;
        openingName?: string;
        eco?: string;
        pgn: string;
    },
    analysisData: {
        totalMoves: number;
        blunders: number;
        mistakes: number;
        inaccuracies: number;
        criticalMoves: Array<{
            moveNumber: number;
            move: string;
            evalBefore: number;
            evalAfter: number;
        }>;
    }
): Promise<CoachingInsights> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.warn("GEMINI_API_KEY not set, returning default insights");
        return getDefaultInsights(gameData, analysisData);
    }

    try {
        console.log("[Coaching] Calling Gemini API for coaching insights...");
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

        const prompt = `You are an expert chess coach analyzing a game. Provide helpful insights for a player to learn from.

Game Details:
- White: ${gameData.whiteName}
- Black: ${gameData.blackName}
- Result: ${gameData.result}
- Opening: ${gameData.openingName || gameData.eco || "Unknown"}
- Total Moves: ${analysisData.totalMoves}
- Blunders: ${analysisData.blunders}
- Mistakes: ${analysisData.mistakes}
- Inaccuracies: ${analysisData.inaccuracies}

Critical Moments:
${analysisData.criticalMoves.map(m =>
            `- Move ${m.moveNumber}: ${m.move} (Eval: ${m.evalBefore > 0 ? '+' : ''}${m.evalBefore.toFixed(1)} → ${m.evalAfter > 0 ? '+' : ''}${m.evalAfter.toFixed(1)})`
        ).join('\n')}

PGN: ${gameData.pgn.substring(0, 500)}${gameData.pgn.length > 500 ? '...' : ''}

Respond in JSON format with exactly these fields:
{
    "openingSummary": "Brief 1-2 sentence analysis of the opening phase",
    "keyInsights": ["3-4 specific actionable insights about the game"],
    "lesson": "One key takeaway lesson for the player to focus on"
}

Be encouraging but honest. Focus on patterns, not just individual moves.`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Parse JSON response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            console.log("[Coaching] Successfully received Gemini insights");
            return {
                openingSummary: parsed.openingSummary || "",
                keyInsights: Array.isArray(parsed.keyInsights) ? parsed.keyInsights : [],
                lesson: parsed.lesson || "",
            };
        }

        return getDefaultInsights(gameData, analysisData);
    } catch (error) {
        console.error("Gemini coaching failed:", error);
        return getDefaultInsights(gameData, analysisData);
    }
}

function getDefaultInsights(
    gameData: { openingName?: string; eco?: string; result: string },
    analysisData: { blunders: number; mistakes: number; totalMoves: number }
): CoachingInsights {
    const opening = gameData.openingName || gameData.eco || "standard opening";
    const accuracy = Math.max(0, 100 - (analysisData.blunders * 15 + analysisData.mistakes * 5));

    return {
        openingSummary: `The game featured the ${opening}. Both players navigated the opening phase with varying degrees of accuracy.`,
        keyInsights: [
            analysisData.blunders > 0
                ? `${analysisData.blunders} blunder(s) significantly impacted the game outcome`
                : "No major blunders - solid tactical awareness shown",
            `Game lasted ${analysisData.totalMoves} moves - ${analysisData.totalMoves > 40 ? "a complex battle" : "a relatively quick game"}`,
            `Approximate accuracy: ${accuracy}% - ${accuracy > 80 ? "excellent" : accuracy > 60 ? "good" : "room for improvement"}`,
        ],
        lesson: analysisData.blunders > 0
            ? "Focus on calculating forcing sequences more carefully before committing to moves"
            : "Continue building on solid fundamentals while looking for tactical opportunities",
    };
}
