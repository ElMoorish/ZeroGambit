import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convert centipawn evaluation to win probability percentage
 * Formula: W = 50 + 50 * (2 / (1 + exp(-0.004 * cp)) - 1)
 */
export function cpToWinProbability(centipawns: number): number {
  return 50 + 50 * (2 / (1 + Math.exp(-0.004 * centipawns)) - 1)
}

/**
 * Classify a move based on centipawn loss (industry standard)
 * @param prevEval - Previous evaluation in centipawns (from White's perspective)
 * @param currEval - Current evaluation in centipawns (from White's perspective)
 * @param isWhiteToMove - True if White made this move
 * @param moveNumber - Move number (1-indexed)
 */
export function classifyMove(
  prevEval: number | null,
  currEval: number | null,
  isWhiteToMove: boolean,
  moveNumber: number = 99
): "brilliant" | "great" | "best" | "excellent" | "good" | "book" | "inaccuracy" | "mistake" | "blunder" | "normal" {
  // Opening book (first 10 moves by each side)
  if (moveNumber <= 10) {
    return "book"
  }

  // Handle missing evaluations
  if (prevEval === null || currEval === null) {
    return "normal"
  }

  // Calculate centipawn loss from player's perspective
  let cpLoss: number
  if (isWhiteToMove) {
    cpLoss = prevEval - currEval
  } else {
    cpLoss = currEval - prevEval
  }

  // Classification thresholds (Chess.com/Lichess standard)
  if (cpLoss <= 0) return "best"       // Improved or maintained position
  if (cpLoss <= 10) return "great"     // < 10 cp loss
  if (cpLoss <= 25) return "excellent" // < 25 cp loss
  if (cpLoss <= 50) return "good"      // < 50 cp loss
  if (cpLoss <= 100) return "inaccuracy" // 50-100 cp loss
  if (cpLoss <= 250) return "mistake"  // 100-250 cp loss
  return "blunder"                     // > 250 cp loss
}

/**
 * Format centipawn evaluation for display
 */
export function formatEval(centipawns: number | null, mate: number | null): string {
  if (mate !== null) {
    return mate > 0 ? `M${mate}` : `-M${Math.abs(mate)}`
  }
  if (centipawns === null) return "0.00"
  const pawns = centipawns / 100
  return pawns >= 0 ? `+${pawns.toFixed(2)}` : pawns.toFixed(2)
}

/**
 * Move classification colors for UI (Chess.com style)
 */
export const moveClassColors: Record<string, string> = {
  brilliant: "text-[#1cada8]",
  great: "text-[#5c8bb0]",
  best: "text-[#96bc4b]",
  excellent: "text-[#96bc4b]",
  good: "text-[#96bc4b]",
  book: "text-[#a88865]",
  inaccuracy: "text-[#f7c631]",
  mistake: "text-[#e58f2a]",
  miss: "text-[#e58f2a]",
  blunder: "text-[#ca3431]",
  normal: "text-gray-400",
}

/**
 * Move classification symbols
 */
export const moveClassSymbols: Record<string, string> = {
  brilliant: "!!",
  great: "!",
  best: "",
  excellent: "",
  good: "",
  book: "📖",
  inaccuracy: "?!",
  mistake: "?",
  miss: "?",
  blunder: "??",
  normal: "",
}

/**
 * French move classification labels
 */
export const moveClassLabels: Record<string, string> = {
  brilliant: "Très bon",
  great: "Excellent",
  best: "Meilleur",
  excellent: "Bon",
  good: "Bon",
  book: "Théorique",
  inaccuracy: "Imprécision",
  mistake: "Erreur",
  miss: "Manqué",
  blunder: "Gaffe",
  normal: "",
}
