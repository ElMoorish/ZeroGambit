"""
Content Creator Agent - LangGraph agent for social media content
Generates captions, hashtags, and enthusiastic commentary for puzzle videos.
"""

from typing import TypedDict, Optional
from langgraph.graph import StateGraph, END
from langchain_ollama import ChatOllama
from langchain_core.messages import SystemMessage, HumanMessage
import os
import re

# Ollama configuration
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://ollama:11434")
MODEL = "gemma:2b"


class ContentCreatorState(TypedDict):
    """State for content creation - no user input"""
    fen: str
    solution: list[str]
    tactical_theme: str
    player_color: str
    puzzle_rating: int
    # Outputs
    hook: str           # Attention-grabbing opener
    caption: str        # Social media caption
    hashtags: list[str] # Optimized hashtags
    commentary: str     # TTS script (enthusiastic)


# Common chess hashtags
BASE_HASHTAGS = [
    "chess", "chesstok", "chesspuzzle", "tactics",
    "checkmate", "chessmoves", "learnchess", "chessgame"
]


import chess

def describe_board(fen: str) -> str:
    """Describe the board state for the LLM"""
    board = chess.Board(fen)
    
    # Material count
    white_material = []
    black_material = []
    piece_map = {chess.PAWN: "Pawn", chess.KNIGHT: "Knight", chess.BISHOP: "Bishop", 
                 chess.ROOK: "Rook", chess.QUEEN: "Queen", chess.KING: "King"}
    
    for sq, piece in board.piece_map().items():
        name = piece_map.get(piece.piece_type, "Piece")
        san = chess.square_name(sq)
        if piece.color == chess.WHITE:
            white_material.append(f"{name} on {san}")
        else:
            black_material.append(f"{name} on {san}")
            
    # King safety (simple check)
    white_king_sq = board.king(chess.WHITE)
    black_king_sq = board.king(chess.BLACK)
    white_in_check = board.is_check() and board.turn == chess.WHITE
    black_in_check = board.is_check() and board.turn == chess.BLACK
    
    desc = f"""
    Current Turn: {'White' if board.turn == chess.WHITE else 'Black'}
    White Pieces: {', '.join(white_material)}
    Black Pieces: {', '.join(black_material)}
    White King at {chess.square_name(white_king_sq) if white_king_sq else 'captured'}
    Black King at {chess.square_name(black_king_sq) if black_king_sq else 'captured'}
    In Check: {'Yes' if board.is_check() else 'No'}
    """
    return desc

def generate_content_node(state: ContentCreatorState) -> ContentCreatorState:
    """Generate all content in one LLM call"""
    try:
        llm = ChatOllama(
            model=MODEL,
            base_url=OLLAMA_URL,
            temperature=0.7, 
            num_predict=800,  # Increase output limit
        )
        
        moves_count = len(state["solution"])
        theme = state.get("tactical_theme", "tactical puzzle")
        rating = state.get("puzzle_rating", 1500)
        color = state.get("player_color", "white")
        
        # Generate description to prevent hallucinations
        board_desc = describe_board(state["fen"])
        
        prompt = f"""Create VIRAL chess content for this puzzle:
Theme: {theme}
Difficulty: {rating} rating
Moves to solve: {moves_count}
Player plays as: {color}

Player plays as: {color}

BOARD STATE (This is the COMPLETE list of pieces. If a piece is not listed, IT DOES NOT EXIST. Do not hallucinate pieces.):
{board_desc}

Generate these 4 things:

1. HOOK (3-6 words, shocking, all caps):
Example: "ONLY 1% CAN SOLVE THIS!" or "THIS MOVE IS BRILLIANT!"

2. CAPTION (2-3 sentences, engaging):
- Start with an emoji
- Ask a question or make a challenge
- Don't give away the answer

3. HASHTAGS (comma-separated, 8-10):
Include: chess, chesstok, puzzle, and theme-specific ones

4. COMMENTARY (FULL SCRIPT > 200 WORDS - Target 60-90 seconds speaking time):
- **CRITICAL RULE**: You generally hallucinate pieces. LOOK AT "BOARD STATE" ABOVE. Only mention pieces listed there. If you mention a piece not on the board, you fail.
- **STYLE**: DO NOT use bullet points or numbered lists. Write a **continuous, exciting story**. 
- **CONTENT**: Start by describing the tension ("White is in trouble..."). Then explain the trap ("It looks safe, but..."). Then walk through the solution moves ({', '.join(state["solution"])}) with high energy. Finally, explain the deep tactical concept.
- **OUTRO**: "Did you see that coming? Don't forget to Follow and Subscribe for more daily puzzles!"
- Be ENERGETIC and use pauses!

Format your response exactly like this:
HOOK: [your hook]
CAPTION: [your caption]
HASHTAGS: [comma separated]
COMMENTARY: [your TTS script]"""

        messages = [
            SystemMessage(content="You are a viral chess content creator. Be ACCURATE, ENERGETIC, and EXCITING!"),
            HumanMessage(content=prompt)
        ]
        
        response = llm.invoke(messages)
        content = response.content
        
        # Parse the response (regex logic same as before)
        hook = ""
        caption = ""
        hashtags = list(BASE_HASHTAGS)
        commentary = ""
        
        # ... regex matching ...
        hook_match = re.search(r"HOOK:\s*(.+?)(?=CAPTION:|$)", content, re.DOTALL | re.IGNORECASE)
        caption_match = re.search(r"CAPTION:\s*(.+?)(?=HASHTAGS:|$)", content, re.DOTALL | re.IGNORECASE)
        hashtags_match = re.search(r"HASHTAGS:\s*(.+?)(?=COMMENTARY:|$)", content, re.DOTALL | re.IGNORECASE)
        commentary_match = re.search(r"COMMENTARY:\s*(.+?)$", content, re.DOTALL | re.IGNORECASE)
        
        if hook_match: hook = hook_match.group(1).strip()
        if caption_match: caption = caption_match.group(1).strip()
        if hashtags_match:
             raw_tags = hashtags_match.group(1).strip()
             for tag in re.split(r"[,\s#]+", raw_tags):
                tag = tag.strip().lower()
                if tag and tag not in hashtags: hashtags.append(tag)
        if commentary_match: 
            commentary = commentary_match.group(1).strip()
            # Clean Markdown artifacts for TTS (remove * _ # `)
            commentary = re.sub(r"[*_#`]", "", commentary)
            # Remove "Asterisk" explicit text if any
            commentary = commentary.replace("Asterisk", "")
            
        return {
            **state,
            "hook": hook or "CAN YOU FIND THE WINNING MOVE?",
            "caption": caption or f"♟️ Can you find the winning move? Only top players can solve it!",
            "hashtags": hashtags[:15],
            "commentary": commentary or f"Look at this incredible position! {color.capitalize()} to move. Can you spot the winning idea?",
            "creator_name": "Zerogambit"
        }
        
    except Exception as e:
        print(f"Content creation error: {e}")
        return {
            **state,
            "hook": "CAN YOU SOLVE THIS PUZZLE?",
            "caption": f"♟️ A challenging chess puzzle! Find the best move!",
            "hashtags": BASE_HASHTAGS + ["viral"],
            "commentary": "This is an incredible chess puzzle! Can you solve it? Don't forget to Follow and Subscribe!",
            "creator_name": "Zerogambit"
        }


def create_content_creator_graph():
    """Create the content creator StateGraph"""
    workflow = StateGraph(ContentCreatorState)
    
    workflow.add_node("generate", generate_content_node)
    workflow.set_entry_point("generate")
    workflow.add_edge("generate", END)
    
    return workflow.compile()


# Singleton instance
_content_creator_graph = None

def get_content_creator():
    global _content_creator_graph
    if _content_creator_graph is None:
        _content_creator_graph = create_content_creator_graph()
    return _content_creator_graph


async def generate_puzzle_content(
    fen: str,
    solution: list[str],
    tactical_theme: str = "tactical puzzle",
    player_color: str = "white",
    puzzle_rating: int = 1500
) -> dict:
    """Generate all content for a puzzle video - main entry point"""
    graph = get_content_creator()
    
    result = await graph.ainvoke({
        "fen": fen,
        "solution": solution,
        "tactical_theme": tactical_theme,
        "player_color": player_color,
        "puzzle_rating": puzzle_rating,
        "hook": "",
        "caption": "",
        "hashtags": [],
        "commentary": "",
    })
    
    return {
        "hook": result["hook"],
        "caption": result["caption"],
        "hashtags": result["hashtags"],
        "commentary": result["commentary"],
    }
