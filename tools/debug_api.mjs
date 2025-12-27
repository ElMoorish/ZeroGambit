
// using global fetch

async function testBackend() {
    console.log("🔍 Testing Backend Opening List (ECO=E)...");
    try {
        const res = await fetch("http://localhost:8000/api/openings/?eco=E&limit=5");
        console.log(`Status: ${res.status}`);
        if (!res.ok) {
            console.log("Error Body:", await res.text());
        } else {
            const data = await res.json();
            console.log(`Success! Found ${data.total} openings.`);
            console.log("Sample:", JSON.stringify(data.openings[0], null, 2));
        }
    } catch (e) {
        console.error("Backend connection failed:", e.message);
    }
}

async function testLichess() {
    console.log("\n🔍 Testing Lichess API...");
    // Fen for starting position or E4
    const fen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
    const url = `https://explorer.lichess.ovh/lichess?variant=standard&fen=${encodeURIComponent(fen)}`;
    try {
        const res = await fetch(url);
        console.log(`Status: ${res.status}`);
        const data = await res.json();
        console.log("Response Keys:", Object.keys(data));
        console.log("White:", data.white, typeof data.white);
        console.log("Black:", data.black, typeof data.black);
        console.log("Draws:", data.draws, typeof data.draws);
        console.log("Moves[0]:", data.moves ? data.moves[0] : "No moves");
    } catch (e) {
        console.error("Lichess fetch failed:", e.message);
    }
}

async function run() {
    await testBackend();
    await testLichess();
}

run();
