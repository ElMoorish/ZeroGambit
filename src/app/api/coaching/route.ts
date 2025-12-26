import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: NextRequest) {
    const geminiKey = process.env.GEMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    console.log("[API] /api/coaching called");
    console.log("[API] Keys available - Gemini:", !!geminiKey, "Groq:", !!groqKey);

    if (!geminiKey && !groqKey) {
        console.error("[API] No API keys configured");
        return NextResponse.json(
            { error: "No AI provider configured (GEMINI_API_KEY or GROQ_API_KEY needed)", fallback: true },
            { status: 200 }
        );
    }

    try {
        const body = await request.json();
        const { gameData, analysisData } = body;

        const systemPrompt = `You are an expert chess coach analyzing a game. Provide helpful insights for a player to learn from.
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
${analysisData.criticalMoves?.map((m: { moveNumber: number; move: string; evalBefore: number; evalAfter: number }) =>
            `- Move ${m.moveNumber}: ${m.move} (Eval: ${m.evalBefore > 0 ? '+' : ''}${m.evalBefore.toFixed(1)} → ${m.evalAfter > 0 ? '+' : ''}${m.evalAfter.toFixed(1)})`
        ).join('\n') || 'No critical moments identified'}

PGN: ${gameData.pgn?.substring(0, 500) || ''}${gameData.pgn?.length > 500 ? '...' : ''}

Respond in JSON format with exactly these fields:
{
    "openingSummary": "Brief 1-2 sentence analysis of the opening phase",
    "keyInsights": ["3-4 specific actionable insights about the game"],
    "lesson": "One key takeaway lesson for the player to focus on"
}

Be encouraging but honest. Focus on patterns, not just individual moves.`;

        let jsonResponse = "";

        // Prefer Groq if available (Fastest & Free Tier)
        if (groqKey) {
            console.log("[API] Using Groq (Llama 3)...");
            const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${groqKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        { role: "system", content: "You are a JSON-speaking chess coach." },
                        { role: "user", content: systemPrompt }
                    ],
                    response_format: { type: "json_object" }
                })
            });

            if (!groqResponse.ok) {
                const err = await groqResponse.text();
                throw new Error(`Groq API Error: ${groqResponse.status} - ${err}`);
            }

            const groqData = await groqResponse.json();
            jsonResponse = groqData.choices[0].message.content;

        } else if (geminiKey) {
            console.log("[API] Using Gemini...");
            const genAI = new GoogleGenerativeAI(geminiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

            const result = await model.generateContent(systemPrompt);
            const response = result.response;
            jsonResponse = response.text();
        }

        console.log("[API] AI response received");

        // Parse JSON response
        const jsonMatch = jsonResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            console.log("[API] Successfully parsed insights");
            return NextResponse.json({
                openingSummary: parsed.openingSummary || "",
                keyInsights: Array.isArray(parsed.keyInsights) ? parsed.keyInsights : [],
                lesson: parsed.lesson || "",
            });
        }

        console.warn("[API] Could not parse AI response");
        return NextResponse.json({ error: "Could not parse response", fallback: true }, { status: 200 });

    } catch (error) {
        console.error("[API] AI Provider error:", error);
        return NextResponse.json(
            { error: String(error), fallback: true },
            { status: 200 }
        );
    }
}
