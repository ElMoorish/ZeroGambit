"""
Puzzle Coach Agent - Automatic coaching for puzzle training
Uses LangGraph to generate contextual explanations without user input.
"""

from typing import TypedDict, Optional
from langgraph.graph import StateGraph, END
from langchain_ollama import ChatOllama
from langchain_core.messages import SystemMessage, HumanMessage
import chess
import os

# Ollama configuration
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://ollama:11434")
MODEL = "gemma:2b"


class PuzzleCoachState(TypedDict):
    """State for puzzle coaching - no user input, all structured data"""
    fen: str                    # Current position
    solution: list[str]         # Expected solution moves  
    user_move: str              # Move the user played
    move_index: int             # Which move in the solution
    is_correct: bool            # Did they play the right move?
    tactical_pattern: str       # Detected pattern (fork, pin, etc.)
    player_color: str           # white or black
    coaching_message: str       # AI-generated insight
    mode: str                   # 'hint', 'correct', 'wrong'


# Tactical pattern detection
TACTICAL_PATTERNS = {
    "fork": "a piece attacking two or more enemy pieces",
    "pin": "a piece preventing another from moving",
    "skewer": "attacking through one piece to another behind it",
    "discovery": "moving a piece to reveal an attack from another",
    "deflection": "forcing a piece away from a key square",
    "attraction": "drawing a piece to a vulnerable square",
    "mate": "checkmate pattern",
    "back_rank": "attacking the weak back rank",
    "sacrifice": "giving up material for compensation",
}


def detect_tactical_pattern(fen: str, move: str) -> str:
    """Detect tactical patterns in the position"""
    try:
        board = chess.Board(fen)
        
        # Parse UCI move
        from_sq = move[:2]
        to_sq = move[2:4]
        
        # Check for captures and attacks
        move_obj = chess.Move.from_uci(move)
        if not board.is_legal(move_obj):
            return "unknown"
            
        # Execute move to check result
        piece = board.piece_at(chess.parse_square(from_sq))
        target = board.piece_at(chess.parse_square(to_sq))
        
        board.push(move_obj)
        
        # Check for mate
        if board.is_checkmate():
            return "mate"
        
        # Check for check
        if board.is_check():
            # Could be discovery or direct
            return "attack"
        
        # Check if it's a capture with advantage
        if target:
            return "capture"
        
        # Default
        return "tactical"
        
    except Exception as e:
        print(f"Pattern detection error: {e}")
        return "unknown"


def analyze_position_node(state: PuzzleCoachState) -> PuzzleCoachState:
    """Analyze the position and detect tactical patterns"""
    pattern = detect_tactical_pattern(state["fen"], state["solution"][state["move_index"]] if state["move_index"] < len(state["solution"]) else state["user_move"])
    return {**state, "tactical_pattern": pattern}


def generate_coaching_node(state: PuzzleCoachState) -> PuzzleCoachState:
    """Generate coaching message using Gemma LLM"""
    try:
        llm = ChatOllama(
            model=MODEL, 
            base_url=OLLAMA_URL,
            temperature=0.7,
            num_predict=300,  # Increased for full output
        )
        
        mode = state.get("mode", "correct" if state["is_correct"] else "wrong")
        
        # Build context-aware prompt based on mode
        if mode == "hint":
            # Initial hint when puzzle loads
            context = f"""A chess puzzle has been presented. The player is {state['player_color']}.
Position: {state['fen']}
Solution starts with: {state['solution'][0] if state['solution'] else 'unknown'}
Pattern detected: {state['tactical_pattern']}

Generate a HELPFUL HINT (2-3 sentences) to guide the player.
Do NOT reveal the exact move. Focus on:
- What tactical opportunity exists
- Which piece or area to focus on
- The general idea behind the solution"""
        elif state["is_correct"]:
            context = f"""The player correctly found the move {state['user_move']}.
Position: {state['fen']}
Pattern: {state['tactical_pattern']}

Generate a SHORT, encouraging coaching message (1-2 sentences max).
Explain WHY this move is strong. Mention the tactical pattern.
Be warm and educational."""
        else:
            # For wrong moves, give a hint without revealing the answer
            correct_move = state["solution"][state["move_index"]] if state["move_index"] < len(state["solution"]) else "unknown"
            context = f"""The player tried {state['user_move']} but the correct move is different.
Position: {state['fen']}
Pattern: {state['tactical_pattern']}

Generate a SHORT, encouraging hint (1-2 sentences max).
Do NOT reveal the answer. Guide them toward the right idea.
Be constructive, not critical."""
        
        messages = [
            SystemMessage(content="You are a friendly chess coach. Be concise and educational."),
            HumanMessage(content=context)
        ]
        
        response = llm.invoke(messages)
        return {**state, "coaching_message": response.content}
        
    except Exception as e:
        print(f"LLM error: {e}")
        # Fallback messages
        if state["is_correct"]:
            return {**state, "coaching_message": f"Excellent! {state['user_move']} is the winning move!"}
        else:
            return {**state, "coaching_message": "Not quite. Look for a forcing move that creates a threat."}


def create_puzzle_coach_graph():
    """Create the puzzle coach StateGraph"""
    workflow = StateGraph(PuzzleCoachState)
    
    # Add nodes
    workflow.add_node("analyze", analyze_position_node)
    workflow.add_node("coach", generate_coaching_node)
    
    # Set flow
    workflow.set_entry_point("analyze")
    workflow.add_edge("analyze", "coach")
    workflow.add_edge("coach", END)
    
    return workflow.compile()


# Singleton graph instance
_puzzle_coach_graph = None

def get_puzzle_coach():
    global _puzzle_coach_graph
    if _puzzle_coach_graph is None:
        _puzzle_coach_graph = create_puzzle_coach_graph()
    return _puzzle_coach_graph


async def get_puzzle_coaching(
    fen: str,
    solution: list[str],
    user_move: str,
    move_index: int,
    is_correct: bool,
    player_color: str = "white",
    mode: str = "correct"
) -> str:
    """Get coaching for a puzzle move - main entry point"""
    graph = get_puzzle_coach()
    
    result = await graph.ainvoke({
        "fen": fen,
        "solution": solution,
        "user_move": user_move,
        "move_index": move_index,
        "is_correct": is_correct,
        "player_color": player_color,
        "tactical_pattern": "",
        "coaching_message": "",
        "mode": mode,
    })
    
    return result["coaching_message"]
