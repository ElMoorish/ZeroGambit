
import { openingBook } from "@chess-openings/eco.json";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generate() {
    console.log("📚 Loading full opening book (12,000+ variations)...");

    // Get ALL openings
    const book = await openingBook();
    const fens = Object.keys(book);
    console.log(`Found ${fens.length} total opening variations.`);

    const outputOpenings = [];

    for (const fen of fens) {
        const op = book[fen];

        // Parse moves string "1. e4 c5 ..." to list ["e4", "c5", ...]
        if (!op.moves) continue;

        let moveList = [];
        try {
            moveList = op.moves.split(" ").filter(t => !t.endsWith(".") && !/^\d+\./.test(t));
        } catch (e) {
            continue;
        }

        outputOpenings.push({
            eco: op.eco,
            name: op.name,
            moves: moveList,
            description: op.name, // Use name as baseline description
            fen: fen
        });
    }

    // Sort by ECO
    outputOpenings.sort((a, b) => a.eco.localeCompare(b.eco));

    console.log(`Prepared ${outputOpenings.length} openings for export.`);

    // Path to save
    const outputPath = path.join(__dirname, "..", "api", "data", "openings_expanded.json");

    // Load existing to preserve custom teaching content
    let existingContent = [];
    if (fs.existsSync(outputPath)) {
        try {
            const raw = fs.readFileSync(outputPath, "utf-8");
            existingContent = JSON.parse(raw);
            if (!Array.isArray(existingContent)) existingContent = [];
            console.log(`Loaded ${existingContent.length} existing openings to preserve teaching content.`);
        } catch (e) {
            console.warn("Could not read existing file, starting fresh.");
            existingContent = [];
        }
    }

    // Merge logic
    const finalMap = new Map();

    // Add new ones first
    for (const op of outputOpenings) {
        // Use ECO+Name as key. Note names might duplicate across FENs (transpositions).
        // If names duplicate, we might just keep one or append.
        // Actually, MongoDB handles unique ID. Here we just want a list.
        // But for teaching content merge, we need a key.
        finalMap.set(`${op.eco}|${op.name}`, op);
    }

    // Overlay existing teaching content
    let preservedCount = 0;
    for (const ex of existingContent) {
        const key = `${ex.eco}|${ex.name}`;
        if (finalMap.has(key)) {
            const current = finalMap.get(key);
            if (ex.keyIdeas) current.keyIdeas = ex.keyIdeas;
            if (ex.typicalPlans) current.typicalPlans = ex.typicalPlans;
            if (ex.commonTraps) current.commonTraps = ex.commonTraps;
            // Prefer existing description if it has extra content or is manually edited
            if ((ex.keyIdeas || ex.description.length > current.description.length) && ex.description) {
                current.description = ex.description;
            }
            preservedCount++;
        } else {
            // If the key is not in the new book (e.g. custom name), keep the old one!
            finalMap.set(key, ex);
        }
    }

    const finalList = Array.from(finalMap.values());
    finalList.sort((a, b) => a.eco.localeCompare(b.eco));

    fs.writeFileSync(outputPath, JSON.stringify(finalList, null, 2));
    console.log(`✅ Successfully wrote ${finalList.length} openings to ${outputPath}`);
    console.log(`   Preserved teaching content for ${preservedCount} openings.`);
}

generate().catch(console.error);
