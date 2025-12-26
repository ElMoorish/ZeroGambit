
// Native fetch in Node 18+

async function testChessApi() {
    const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

    console.log("Testing chess-api.com with FEN:", fen);

    try {
        const response = await fetch("https://chess-api.com/v1", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                fen: fen,
                depth: 12,
                maxThinkingTime: 50,
            }),
        });

        if (!response.ok) {
            console.error("API Error:", response.status, response.statusText);
            return;
        }

        const result = await response.json();
        console.log("Full JSON Response:");
        console.log(JSON.stringify(result, null, 2));

        console.log("\nChecking 'eval' field:");
        console.log("Type:", typeof result.eval);
        console.log("Value:", result.eval);

    } catch (error) {
        console.error("Fetch failed:", error);
    }
}

testChessApi();
