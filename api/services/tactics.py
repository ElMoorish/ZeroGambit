"""
Tactics Detection Service
Detects tactical motifs using python-chess bitboard operations
"""

import chess
from typing import List, Dict, Any, Set


def detect_motifs(board: chess.Board, move: chess.Move) -> List[str]:
    """
    Detect tactical motifs in a position after a move.
    
    Returns list of detected motifs:
    - fork: One piece attacking two+ valuable targets
    - pin: A piece is pinned to the king or more valuable piece
    - hanging_piece: A piece can be captured for free or with positive exchange
    - discovery: Moving piece reveals an attack
    - skewer: Attack through a piece to one behind it
    """
    motifs = []
    
    # Make the move temporarily
    board.push(move)
    
    try:
        # Check for forks
        fork = detect_fork(board, move)
        if fork:
            motifs.append("fork")
        
        # Check for pins
        pin = detect_pin(board)
        if pin:
            motifs.append("pin")
        
        # Check for hanging pieces
        hanging = detect_hanging_pieces(board)
        if hanging:
            motifs.append("hanging_piece")
        
        # Check for discovered attack
        discovery = detect_discovery(board, move)
        if discovery:
            motifs.append("discovery")
    
    finally:
        board.pop()
    
    return motifs


def detect_fork(board: chess.Board, move: chess.Move) -> bool:
    """
    Detect if the moved piece is attacking two or more valuable targets.
    """
    moved_piece = board.piece_at(move.to_square)
    if not moved_piece:
        return False
    
    piece_values = {
        chess.PAWN: 1,
        chess.KNIGHT: 3,
        chess.BISHOP: 3,
        chess.ROOK: 5,
        chess.QUEEN: 9,
        chess.KING: 100  # King is always a valid target
    }
    
    attacker_value = piece_values.get(moved_piece.piece_type, 0)
    
    # Get all squares attacked by the moved piece
    attacked_squares = board.attacks(move.to_square)
    
    # Count valuable targets
    valuable_targets = 0
    target_value_sum = 0
    
    for square in attacked_squares:
        target = board.piece_at(square)
        if target and target.color != moved_piece.color:
            target_value = piece_values.get(target.piece_type, 0)
            if target_value >= attacker_value or target.piece_type == chess.KING:
                valuable_targets += 1
                target_value_sum += target_value
    
    # Fork exists if attacking 2+ valuable targets
    return valuable_targets >= 2


def detect_pin(board: chess.Board) -> bool:
    """
    Detect if any piece is absolutely pinned (pinned to the king).
    """
    for color in [chess.WHITE, chess.BLACK]:
        king_square = board.king(color)
        if king_square is None:
            continue
        
        # Check all enemy sliding pieces
        enemy_color = not color
        
        # Check for pins from rooks and queens (ranks/files)
        for attacker_type in [chess.ROOK, chess.QUEEN]:
            for attacker_square in board.pieces(attacker_type, enemy_color):
                # Check if there's a ray between attacker and king
                ray = chess.SquareSet.ray(attacker_square, king_square)
                if not ray:
                    continue
                
                # Count pieces in between
                blocking_pieces = []
                for sq in ray:
                    if sq in [attacker_square, king_square]:
                        continue
                    piece = board.piece_at(sq)
                    if piece:
                        blocking_pieces.append((sq, piece))
                
                # Pin exists if exactly one friendly piece is blocking
                if len(blocking_pieces) == 1:
                    sq, piece = blocking_pieces[0]
                    if piece.color == color:
                        return True
        
        # Check for pins from bishops and queens (diagonals)
        for attacker_type in [chess.BISHOP, chess.QUEEN]:
            for attacker_square in board.pieces(attacker_type, enemy_color):
                ray = chess.SquareSet.ray(attacker_square, king_square)
                if not ray:
                    continue
                
                blocking_pieces = []
                for sq in ray:
                    if sq in [attacker_square, king_square]:
                        continue
                    piece = board.piece_at(sq)
                    if piece:
                        blocking_pieces.append((sq, piece))
                
                if len(blocking_pieces) == 1:
                    sq, piece = blocking_pieces[0]
                    if piece.color == color:
                        return True
    
    return False


def detect_hanging_pieces(board: chess.Board) -> bool:
    """
    Detect if any piece is hanging (undefended and attacked).
    Uses simplified static exchange evaluation.
    """
    for color in [chess.WHITE, chess.BLACK]:
        for piece_type in [chess.QUEEN, chess.ROOK, chess.BISHOP, chess.KNIGHT, chess.PAWN]:
            for square in board.pieces(piece_type, color):
                # Check if piece is attacked
                if not board.is_attacked_by(not color, square):
                    continue
                
                # Check if piece is defended
                if board.is_attacked_by(color, square):
                    # Could still be hanging if attacker is less valuable
                    # Simplified: just check if it's defended at all
                    continue
                
                # Undefended and attacked = hanging
                return True
    
    return False


def detect_discovery(board: chess.Board, move: chess.Move) -> bool:
    """
    Detect if moving a piece revealed an attack from a sliding piece.
    """
    # Get the piece that was on the from-square before the move
    from_square = move.from_square
    to_square = move.to_square
    
    # Check if any friendly sliding piece is now attacking through the vacated square
    moved_piece = board.piece_at(to_square)
    if not moved_piece:
        return False
    
    attacker_color = moved_piece.color
    
    for attacker_type in [chess.ROOK, chess.BISHOP, chess.QUEEN]:
        for attacker_square in board.pieces(attacker_type, attacker_color):
            if attacker_square == to_square:
                continue
            
            # Check if the from_square was blocking an attack
            ray = chess.SquareSet.ray(attacker_square, from_square)
            if not ray:
                continue
            
            # Find what's at the end of the ray (beyond from_square)
            for sq in ray:
                if sq == attacker_square or sq == from_square:
                    continue
                
                target = board.piece_at(sq)
                if target and target.color != attacker_color:
                    # Found a discovered attack
                    return True
                elif target:
                    break  # Blocked by another piece
    
    return False
