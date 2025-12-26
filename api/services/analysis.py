"""
Analysis Service
Move classification and evaluation using python-chess with Stockfish
"""

import chess
import chess.engine
import chess.pgn
from typing import List, Dict, Any, Optional
from io import StringIO
import math
import asyncio
import os


def cp_to_win_probability(centipawns: int) -> float:
    """
    Convert centipawn evaluation to win probability.
    Formula: W = 50 + 50 * (2 / (1 + exp(-0.004 * cp)) - 1)
    """
    return 50 + 50 * (2 / (1 + math.exp(-0.004 * centipawns)) - 1)


def classify_move(prev_win_prob: float, curr_win_prob: float, is_white: bool) -> str:
    """
    Classify a move based on win probability change.
    
    Thresholds:
    - Blunder: > 20% drop
    - Mistake: > 10% drop  
    - Inaccuracy: > 5% drop
    """
    # Calculate drop from perspective of player who moved
    if is_white:
        drop = prev_win_prob - curr_win_prob
    else:
        drop = curr_win_prob - prev_win_prob
    
    if drop > 20:
        return "blunder"
    elif drop > 10:
        return "mistake"
    elif drop > 5:
        return "inaccuracy"
    elif drop < -5:
        return "great"
    elif drop <= 2:
        return "best"
    else:
        return "normal"


async def analyze_game_moves(pgn: str, depth: int = 18) -> Dict[str, Any]:
    """
    Analyze all moves in a PGN using Stockfish.
    Returns move evaluations, classifications, and accuracy scores.
    """
    # Parse PGN
    game = chess.pgn.read_game(StringIO(pgn))
    if not game:
        raise ValueError("Invalid PGN")
    
    board = game.board()
    moves = list(game.mainline_moves())
    
    analyzed_moves = []
    white_errors = []
    black_errors = []
    prev_win_prob = 50.0
    
    # Try to use Stockfish if available
    stockfish_path = os.getenv("STOCKFISH_PATH", "/usr/bin/stockfish")
    engine = None
    
    try:
        # Attempt to load engine
        transport, engine = await chess.engine.popen_uci(stockfish_path)
    except Exception as e:
        print(f"Stockfish not available, using heuristic evaluation: {e}")
        engine = None
    
    try:
        for ply, move in enumerate(moves, 1):
            is_white = (ply % 2 == 1)
            
            # Get evaluation
            if engine:
                info = await engine.analyse(board, chess.engine.Limit(depth=depth))
                score = info.get("score")
                
                if score.is_mate():
                    mate = score.relative.mate()
                    evaluation = None
                    win_prob = 100 if mate > 0 else 0
                else:
                    evaluation = score.relative.score()
                    mate = None
                    win_prob = cp_to_win_probability(evaluation)
                
                best_move = info.get("pv", [None])[0]
                best_move_uci = best_move.uci() if best_move else None
            else:
                # Heuristic evaluation without engine
                evaluation = _heuristic_eval(board)
                mate = None
                win_prob = cp_to_win_probability(evaluation)
                best_move_uci = None
            
            # Make the move
            san = board.san(move)
            uci = move.uci()
            board.push(move)
            fen_after = board.fen()
            
            # Post-move evaluation (for classification)
            if engine:
                post_info = await engine.analyse(board, chess.engine.Limit(depth=depth))
                post_score = post_info.get("score")
                
                if post_score.is_mate():
                    post_eval = 10000 if post_score.relative.mate() > 0 else -10000
                else:
                    post_eval = post_score.relative.score() or 0
                
                post_win_prob = cp_to_win_probability(-post_eval)  # Negate for opponent's perspective
            else:
                post_eval = _heuristic_eval(board)
                post_win_prob = cp_to_win_probability(-post_eval)
            
            # Classify the move
            classification = classify_move(prev_win_prob, post_win_prob, is_white)
            
            # Track errors for accuracy
            error = max(0, prev_win_prob - post_win_prob) if is_white else max(0, post_win_prob - prev_win_prob)
            if is_white:
                white_errors.append(error)
            else:
                black_errors.append(error)
            
            analyzed_moves.append({
                "ply": ply,
                "san": san,
                "uci": uci,
                "fen_after": fen_after,
                "evaluation": evaluation,
                "mate": mate,
                "best_move": best_move_uci,
                "classification": classification,
                "motifs": [],  # Would be populated by tactics.py
                "comment": _generate_comment(classification, san, best_move_uci)
            })
            
            prev_win_prob = post_win_prob
    
    finally:
        if engine:
            await engine.quit()
    
    # Calculate accuracy (100 - average error)
    white_accuracy = 100 - (sum(white_errors) / len(white_errors)) if white_errors else 100
    black_accuracy = 100 - (sum(black_errors) / len(black_errors)) if black_errors else 100
    
    return {
        "moves": analyzed_moves,
        "white_accuracy": round(max(0, min(100, white_accuracy)), 1),
        "black_accuracy": round(max(0, min(100, black_accuracy)), 1)
    }


def _heuristic_eval(board: chess.Board) -> int:
    """
    Basic material-based evaluation when Stockfish is not available.
    Returns evaluation in centipawns.
    """
    piece_values = {
        chess.PAWN: 100,
        chess.KNIGHT: 320,
        chess.BISHOP: 330,
        chess.ROOK: 500,
        chess.QUEEN: 900,
        chess.KING: 0
    }
    
    score = 0
    for square in chess.SQUARES:
        piece = board.piece_at(square)
        if piece:
            value = piece_values.get(piece.piece_type, 0)
            if piece.color == chess.WHITE:
                score += value
            else:
                score -= value
    
    # Add small bonus for side to move
    if board.turn == chess.WHITE:
        score += 10
    else:
        score -= 10
    
    return score


def _generate_comment(classification: str, move_san: str, best_move: Optional[str]) -> Optional[str]:
    """Generate a simple comment for significant moves"""
    if classification == "blunder":
        comment = f"{move_san} was a blunder!"
        if best_move:
            comment += f" {best_move} was better."
        return comment
    elif classification == "mistake":
        return f"{move_san} was a mistake. Consider alternatives."
    elif classification == "great":
        return f"Excellent move with {move_san}!"
    return None
