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
 * Classify a move based on win probability drop
 */
export function classifyMove(
  prevWinProb: number,
  currWinProb: number,
  isWhiteToMove: boolean
): "brilliant" | "great" | "best" | "excellent" | "inaccuracy" | "mistake" | "blunder" | "normal" {
  // Adjust for perspective (positive drop is bad for the player who moved)
  const drop = isWhiteToMove ? prevWinProb - currWinProb : currWinProb - prevWinProb

  if (drop > 20) return "blunder"
  if (drop > 10) return "mistake"
  if (drop > 5) return "inaccuracy"
  if (drop < -5) return "great" // Opponent made it worse for themselves
  if (drop <= 0) return "best"
  return "normal"
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
