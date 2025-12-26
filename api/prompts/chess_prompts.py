"""Chess-specific AI prompts optimized for Gemma model"""

OPENING_PROMPT = """You are a chess expert providing concise opening descriptions.

Task: Describe the chess opening in ONE sentence (max 20 words).
Focus on: main strategic idea, key piece development, pawn structure goal.

Examples:
- Italian Game: "Controls center with e4, develops bishop to c4 targeting f7, prepares quick castling"
- Sicilian Defense: "Asymmetric pawn structure, fights for central control from the wing, aims for queenside counterplay"
- French Defense: "Solid structure with e6, controls d5, prepares ...d5 central break"

Be specific and concise."""

INSIGHTS_PROMPT = """You are a chess coach analyzing game performance.

Task: Provide 2-3 KEY INSIGHTS about this specific game.

Rules:
- Focus on PATTERNS and TENDENCIES (not individual moves)
- Make insights ACTIONABLE (what to improve)
- Use SIMPLE language (no chess jargon)
- Each insight: ONE clear point (max 12 words)
- Vary your insights based on the statistics provided

Format:
• [Pattern or weakness observed]
• [Actionable improvement]
• [Strategic principle violated]

Example insights:
• "Missed tactical opportunities in complex positions - practice puzzles daily"
• "Rushed moves in time pressure - allocate time better in critical moments"
• "Weak king safety after castling - always check for opponent threats first"

DO NOT repeat the same phrase. Make each insight unique and specific to THIS game's statistics."""

LESSON_PROMPT = """You are a chess teacher extracting one main lesson.

Task: State ONE key lesson that applies to future games.

Rules:
- Focus on a PRINCIPLE, not this specific game
- Make it MEMORABLE (one clear idea)
- Keep it ACTIONABLE (something they can practice)
- ONE sentence only (max 15 words)
- Avoid generic phrases like "think carefully" or "practice more"

Examples of GOOD lessons:
- "Always check for forcing moves before making positional improvements"
- "Calculate all checks, captures, and attacks before moving your king"
- "Control the center early to limit your opponent's piece activity"
- "Don't chase material if it weakens your king's defenses"

Examples of BAD lessons (too generic):
- "Play better chess" ❌
- "Think before you move" ❌  
- "Practice tactics" ❌

Make your lesson specific and useful."""


def format_opening_prompt(opening_name: str) -> str:
    """Format opening summary prompt"""
    return f"Opening to describe: {opening_name}\n\nProvide the one-sentence description:"


def format_insights_prompt(stats: dict) -> str:
    """Format game insights prompt with statistics"""
    top_critical = stats.get('top_critical', [])[:3]
    critical_text = '\n'.join(
        f"- Move {m['move']}: {m['played']} (lost {m['cp_loss']:.0f} centipawns)"
        for m in top_critical
    ) if top_critical else "- No major mistakes detected"
    
    # Add more context for varied insights
    blunder_rate = (stats.get('blunders', 0) / max(stats.get('total_moves', 1), 1)) * 100
    mistake_rate = (stats.get('mistakes', 0) / max(stats.get('total_moves', 1), 1)) * 100
    
    return f"""Game Statistics:
Total moves: {stats.get('total_moves', 0)}
White precision: {stats.get('white_precision', 0)}%
Black precision: {stats.get('black_precision', 0)}%

Errors:
- Blunders: {stats.get('blunders', 0)} ({blunder_rate:.0f}% of moves)
- Mistakes: {stats.get('mistakes', 0)} ({mistake_rate:.0f}% of moves)  
- Inaccuracies: {stats.get('inaccuracies', 0)}
- Average blunder cost: {stats.get('avg_blunder_cp', 0):.0f} centipawns

Critical moments (biggest errors):
{critical_text}

Based on these statistics, provide 2-3 unique insights about THIS specific game:
"""


def format_lesson_prompt(opening_name: str, insights: str) -> str:
    """Format lesson generation prompt"""
    return f"""Opening played: {opening_name}

Game insights identified:
{insights if insights else "Multiple tactical errors and missed opportunities"}

What is the ONE main chess principle this player should focus on?
State it in one memorable sentence:"""
