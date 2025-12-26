"""
Natural Language Commentary Service
Generates human-like coaching comments for moves
"""

from typing import Optional, Dict, Any


# Template library for generating comments
COMMENT_TEMPLATES = {
    "blunder": {
        "fork": "You fell into a fork! By playing {move}, your opponent can now attack both your {target1} and {target2} simultaneously.",
        "pin": "Oops! {move} allows a devastating pin. Your piece is now stuck defending something more valuable.",
        "hanging_piece": "Material loss! {move} left a piece hanging. Always check if your pieces are protected after moving.",
        "default": "This was a serious mistake. {move} dramatically worsened your position. {best_move} was much better."
    },
    "mistake": {
        "fork": "Careful with {move}—it allows a forking opportunity. Your opponent can attack multiple pieces.",
        "pin": "{move} creates some pin problems. Try to keep your pieces coordinated.",
        "hanging_piece": "After {move}, you have some loose pieces. Consider protecting them.",
        "default": "{move} was inaccurate. Consider {best_move} which keeps more pressure."
    },
    "inaccuracy": {
        "default": "{move} is slightly imprecise. {best_move} was a bit more accurate here."
    },
    "great": {
        "fork": "Excellent! {move} creates a powerful fork threat!",
        "pin": "Great technique! {move} sets up a strong pin.",
        "attack": "Strong move! {move} increases the pressure on your opponent's position.",
        "default": "Well played! {move} is an excellent choice here."
    },
    "brilliant": {
        "sacrifice": "Brilliant sacrifice! {move} gives up material for a powerful attack.",
        "forced_win": "Stunning! {move} leads to a forced winning sequence.",
        "default": "Exceptional move! {move} demonstrates deep calculation."
    },
    "opening_deviation": {
        "early": "Interesting! You deviated from theory early with {move}. The main line is {book_move}.",
        "rare": "{move} is a rare continuation here. Most players prefer {book_move}."
    }
}


def generate_commentary(
    move_san: str,
    classification: str,
    motifs: list,
    best_move: Optional[str] = None,
    evaluation_change: Optional[float] = None,
    context: Optional[Dict[str, Any]] = None
) -> Optional[str]:
    """
    Generate a natural language comment for a move.
    
    Args:
        move_san: The move in SAN notation (e.g., "Nf3")
        classification: Move classification (blunder, mistake, etc.)
        motifs: List of tactical motifs detected
        best_move: The engine's best move if different
        evaluation_change: Change in evaluation (win probability)
        context: Additional context (opening info, piece types, etc.)
    
    Returns:
        A human-readable coaching comment, or None for normal moves
    """
    context = context or {}
    
    # Don't comment on normal moves
    if classification == "normal":
        return None
    
    # Get template category
    templates = COMMENT_TEMPLATES.get(classification, {})
    
    # Try to find a motif-specific template
    template = None
    for motif in motifs:
        if motif in templates:
            template = templates[motif]
            break
    
    if not template:
        template = templates.get("default")
    
    if not template:
        return None
    
    # Format the template
    comment = template.format(
        move=move_san,
        best_move=best_move or "another move",
        target1=context.get("target1", "piece"),
        target2=context.get("target2", "piece"),
        book_move=context.get("book_move", "the main line"),
        **{k: v for k, v in context.items() if isinstance(v, str)}
    )
    
    return comment


def generate_game_summary(
    white_accuracy: float,
    black_accuracy: float,
    blunder_count: int,
    mistake_count: int,
    great_moves: int,
    result: str,
    white_username: str,
    black_username: str
) -> str:
    """
    Generate a summary comment for the entire game.
    """
    lines = []
    
    # Accuracy comparison
    if abs(white_accuracy - black_accuracy) < 5:
        lines.append(f"A closely matched game! Both players performed at similar levels.")
    elif white_accuracy > black_accuracy:
        lines.append(f"{white_username} played more accurately ({white_accuracy:.1f}% vs {black_accuracy:.1f}%).")
    else:
        lines.append(f"{black_username} played more accurately ({black_accuracy:.1f}% vs {white_accuracy:.1f}%).")
    
    # Error analysis
    total_errors = blunder_count + mistake_count
    if total_errors == 0:
        lines.append("Remarkably clean play with no major errors!")
    elif total_errors <= 2:
        lines.append("A well-played game with only minor inaccuracies.")
    elif blunder_count > mistake_count:
        lines.append(f"The game featured {blunder_count} blunders—focus on checking for tactics before every move.")
    else:
        lines.append(f"There were {mistake_count} mistakes to learn from in this game.")
    
    # Highlight positive play
    if great_moves > 3:
        lines.append(f"Excellent! {great_moves} moves were rated as great or better.")
    
    # Result context
    if result == "1-0":
        lines.append(f"White ({white_username}) won the game.")
    elif result == "0-1":
        lines.append(f"Black ({black_username}) won the game.")
    else:
        lines.append("The game ended in a draw.")
    
    return " ".join(lines)


def generate_opening_insight(
    eco: Optional[str],
    opening_name: Optional[str],
    deviation_ply: Optional[int],
    book_move: Optional[str],
    played_move: Optional[str]
) -> Optional[str]:
    """
    Generate insight about the opening phase.
    """
    if not opening_name:
        return None
    
    lines = [f"Opening: {opening_name}"]
    
    if eco:
        lines[0] += f" ({eco})"
    
    if deviation_ply and deviation_ply <= 10:
        lines.append(f"You left book theory on move {deviation_ply // 2 + 1}.")
        if book_move and played_move:
            lines.append(f"The main line continues with {book_move}, but you played {played_move}.")
    elif deviation_ply:
        lines.append(f"Good opening knowledge! You stayed in theory until move {deviation_ply // 2 + 1}.")
    
    return " ".join(lines)
