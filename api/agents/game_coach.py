"""
Game Coach Agent - Automatic coaching for game analysis
Uses LangGraph to explain move classifications and provide strategic insights.
"""

from typing import TypedDict, Optional
from langgraph.graph import StateGraph, END
from langchain_ollama import ChatOllama
from langchain_core.messages import SystemMessage, HumanMessage
import os

# Ollama configuration
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://ollama:11434")
MODEL = "gemma:2b"


class GameCoachState(TypedDict):
    """State for game coaching - no user input, all structured data"""
    fen: str                    # Position after the move
    move_san: str               # Move in algebraic notation (e.g., "Nxe5")
    classification: str         # brilliant, best, good, inaccuracy, mistake, blunder
    cp_loss: int                # Centipawn loss
    best_move: str              # What engine says was best
    is_white: bool              # Which color played
    move_number: int            # Move number in game
    coaching_message: str       # AI-generated insight


# Classification explanations
CLASSIFICATION_INFO = {
    "brilliant": {"emoji": "💎", "sentiment": "exceptional", "needs_explanation": True},
    "best": {"emoji": "✅", "sentiment": "perfect", "needs_explanation": False},
    "great": {"emoji": "👍", "sentiment": "very good", "needs_explanation": False},
    "good": {"emoji": "👌", "sentiment": "solid", "needs_explanation": False},
    "book": {"emoji": "📖", "sentiment": "theory", "needs_explanation": False},
    "inaccuracy": {"emoji": "⚠️", "sentiment": "imprecise", "needs_explanation": True},
    "mistake": {"emoji": "❌", "sentiment": "error", "needs_explanation": True},
    "blunder": {"emoji": "💥", "sentiment": "serious error", "needs_explanation": True},
}


def generate_game_coaching_node(state: GameCoachState) -> GameCoachState:
    """Generate coaching message for a game move"""
    try:
        classification = state["classification"]
        info = CLASSIFICATION_INFO.get(classification, {"emoji": "🔍", "sentiment": "unclear", "needs_explanation": True})
        
        # Skip coaching for routine moves
        if not info["needs_explanation"] and state["cp_loss"] < 20:
            return {**state, "coaching_message": ""}
        
        llm = ChatOllama(
            model=MODEL,
            base_url=OLLAMA_URL,
            temperature=0.7,
            num_predict=80,  # Keep it short
        )
        
        color = "White" if state["is_white"] else "Black"
        
        if classification in ["blunder", "mistake"]:
            context = f"""{color} played {state['move_san']} (move {state['move_number']}).
This was a {classification} losing {state['cp_loss']} centipawns.
The best move was {state['best_move']}.
Position: {state['fen']}

Explain briefly (1 sentence) WHY this was a {classification}.
What threat did they miss or what was wrong with the move?"""
        elif classification == "brilliant":
            context = f"""{color} played {state['move_san']} (move {state['move_number']}).
This is marked as brilliant!
Position: {state['fen']}

Explain briefly (1 sentence) what makes this move brilliant.
Focus on the creativity or difficulty of the move."""
        else:
            context = f"""{color} played {state['move_san']} (move {state['move_number']}).
Classification: {classification}
Position: {state['fen']}

Give a brief (1 sentence) educational comment about this move."""
        
        messages = [
            SystemMessage(content="You are a chess coach. Be concise (1 sentence max). Focus on the key idea."),
            HumanMessage(content=context)
        ]
        
        response = llm.invoke(messages)
        return {**state, "coaching_message": response.content}
        
    except Exception as e:
        print(f"Game coach LLM error: {e}")
        # Fallback messages based on classification
        classification = state["classification"]
        if classification == "blunder":
            return {**state, "coaching_message": f"{state['move_san']} was a serious mistake. {state['best_move']} was better."}
        elif classification == "mistake":
            return {**state, "coaching_message": f"{state['move_san']} lost advantage. Consider {state['best_move']} instead."}
        elif classification == "brilliant":
            return {**state, "coaching_message": f"Brilliant move with {state['move_san']}!"}
        else:
            return {**state, "coaching_message": ""}


def create_game_coach_graph():
    """Create the game coach StateGraph"""
    workflow = StateGraph(GameCoachState)
    
    # Simple single-node graph for game coaching
    workflow.add_node("coach", generate_game_coaching_node)
    workflow.set_entry_point("coach")
    workflow.add_edge("coach", END)
    
    return workflow.compile()


# Singleton graph instance
_game_coach_graph = None

def get_game_coach():
    global _game_coach_graph
    if _game_coach_graph is None:
        _game_coach_graph = create_game_coach_graph()
    return _game_coach_graph


async def get_game_coaching(
    fen: str,
    move_san: str,
    classification: str,
    cp_loss: int,
    best_move: str,
    is_white: bool,
    move_number: int
) -> str:
    """Get coaching for a game move - main entry point"""
    graph = get_game_coach()
    
    result = await graph.ainvoke({
        "fen": fen,
        "move_san": move_san,
        "classification": classification,
        "cp_loss": cp_loss,
        "best_move": best_move,
        "is_white": is_white,
        "move_number": move_number,
        "coaching_message": "",
    })
    
    return result["coaching_message"]
