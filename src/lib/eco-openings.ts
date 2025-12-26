// ECO (Encyclopedia of Chess Openings) lookup utility
// Maps ECO codes to full opening names

const ECO_OPENINGS: Record<string, string> = {
    // A - Flank Openings
    "A00": "Uncommon Opening",
    "A01": "Nimzo-Larsen Attack",
    "A02": "Bird's Opening",
    "A04": "Reti Opening",
    "A05": "Reti Opening: King's Indian Attack",
    "A10": "English Opening",
    "A20": "English Opening: King's English Variation",
    "A45": "Indian Defense",
    "A46": "Indian Defense: London System",

    // B - Semi-Open Games
    "B00": "King's Pawn Opening",
    "B01": "Scandinavian Defense",
    "B02": "Alekhine's Defense",
    "B06": "Modern Defense",
    "B07": "Pirc Defense",
    "B10": "Caro-Kann Defense",
    "B12": "Caro-Kann Defense: Advance Variation",
    "B13": "Caro-Kann Defense: Exchange Variation",
    "B20": "Sicilian Defense",
    "B21": "Sicilian Defense: Smith-Morra Gambit",
    "B22": "Sicilian Defense: Alapin Variation",
    "B23": "Sicilian Defense: Closed Variation",
    "B30": "Sicilian Defense: Old Sicilian",
    "B32": "Sicilian Defense: Open Variation",
    "B33": "Sicilian Defense: Sveshnikov Variation",
    "B40": "Sicilian Defense: French Variation",
    "B50": "Sicilian Defense",
    "B52": "Sicilian Defense: Canal Attack",
    "B56": "Sicilian Defense: Classical Variation",
    "B60": "Sicilian Defense: Richter-Rauzer Variation",
    "B70": "Sicilian Defense: Dragon Variation",
    "B80": "Sicilian Defense: Scheveningen Variation",
    "B90": "Sicilian Defense: Najdorf Variation",

    // C - Open Games
    "C00": "French Defense",
    "C01": "French Defense: Exchange Variation",
    "C02": "French Defense: Advance Variation",
    "C03": "French Defense: Tarrasch Variation",
    "C10": "French Defense: Rubinstein Variation",
    "C11": "French Defense: Steinitz Variation",
    "C20": "King's Pawn Game",
    "C21": "Center Game",
    "C23": "Bishop's Opening",
    "C24": "Bishop's Opening: Berlin Defense",
    "C25": "Vienna Game",
    "C30": "King's Gambit",
    "C40": "King's Knight Opening",
    "C41": "Philidor Defense",
    "C42": "Petrov's Defense",
    "C44": "Scotch Game",
    "C45": "Scotch Game: Classical Variation",
    "C46": "Three Knights Game",
    "C47": "Four Knights Game: Scotch Variation",
    "C48": "Four Knights Game: Spanish Variation",
    "C50": "Italian Game",
    "C51": "Italian Game: Evans Gambit",
    "C53": "Italian Game: Giuoco Piano",
    "C54": "Italian Game: Giuoco Pianissimo",
    "C55": "Italian Game: Two Knights Defense",
    "C57": "Italian Game: Traxler Counterattack",
    "C60": "Ruy Lopez",
    "C62": "Ruy Lopez: Steinitz Defense",
    "C63": "Ruy Lopez: Schliemann Defense",
    "C65": "Ruy Lopez: Berlin Defense",
    "C67": "Ruy Lopez: Berlin Defense, Rio Gambit",
    "C68": "Ruy Lopez: Exchange Variation",
    "C70": "Ruy Lopez: Morphy Defense",
    "C78": "Ruy Lopez: Archangelsk Variation",
    "C80": "Ruy Lopez: Open Variation",
    "C84": "Ruy Lopez: Closed Variation",
    "C88": "Ruy Lopez: Closed, Anti-Marshall",
    "C89": "Ruy Lopez: Marshall Attack",

    // D - Closed Games
    "D00": "Queen's Pawn Game",
    "D02": "Queen's Pawn Game: London System",
    "D04": "Queen's Pawn Game: Colle System",
    "D06": "Queen's Gambit",
    "D07": "Queen's Gambit Declined: Chigorin Defense",
    "D10": "Slav Defense",
    "D11": "Slav Defense: Modern Line",
    "D12": "Slav Defense: Quiet Variation",
    "D15": "Slav Defense: Three Knights",
    "D20": "Queen's Gambit Accepted",
    "D30": "Queen's Gambit Declined",
    "D35": "Queen's Gambit Declined: Exchange Variation",
    "D37": "Queen's Gambit Declined: Three Knights",
    "D43": "Semi-Slav Defense",
    "D45": "Semi-Slav Defense: Main Line",
    "D50": "Queen's Gambit Declined: Modern Variation",
    "D52": "Queen's Gambit Declined: Cambridge Springs",
    "D60": "Queen's Gambit Declined: Orthodox Defense",
    "D70": "Neo-Grünfeld Defense",
    "D80": "Grünfeld Defense",
    "D85": "Grünfeld Defense: Exchange Variation",

    // E - Indian Defenses
    "E00": "Indian Defense",
    "E04": "Catalan Opening",
    "E10": "Indian Defense: Anti-Nimzo",
    "E12": "Queen's Indian Defense",
    "E15": "Queen's Indian Defense: Fianchetto Variation",
    "E20": "Nimzo-Indian Defense",
    "E30": "Nimzo-Indian Defense: Leningrad Variation",
    "E40": "Nimzo-Indian Defense: Normal Variation",
    "E60": "King's Indian Defense",
    "E70": "King's Indian Defense: Four Pawns Attack",
    "E80": "King's Indian Defense: Sämisch Variation",
    "E90": "King's Indian Defense: Classical Variation",
    "E97": "King's Indian Defense: Mar del Plata",
};

/**
 * Look up full opening name from ECO code
 */
export function getOpeningName(eco: string | undefined | null): string | null {
    if (!eco) return null;

    // Exact match
    if (ECO_OPENINGS[eco]) {
        return ECO_OPENINGS[eco];
    }

    // Try to find closest match by prefix
    const prefix = eco.substring(0, 2);
    for (const [code, name] of Object.entries(ECO_OPENINGS)) {
        if (code.startsWith(prefix)) {
            return name;
        }
    }

    return null;
}

/**
 * Get full opening info with ECO code
 */
export function getOpeningInfo(eco: string | undefined | null, name?: string | null): string {
    const ecoName = getOpeningName(eco);

    if (name && name.length > 3) {
        // If we have a name from the game data, use it with ECO
        return eco ? `${name} (${eco})` : name;
    }

    if (ecoName) {
        return eco ? `${ecoName} (${eco})` : ecoName;
    }

    return eco || "Unknown Opening";
}
