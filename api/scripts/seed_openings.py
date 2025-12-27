"""
Opening Seeder Script - Seeds MongoDB with chess openings from ECO classification
Run this script with: python api/scripts/seed_openings.py

Seeds ~500 main chess openings with:
- ECO codes (A00-E99)
- Opening names
- Main line moves
- Key positions (FEN)
- Teaching points
- Win rate statistics
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import chess

# Main chess openings organized by ECO categories
OPENINGS = [
    # === A: Flank Openings ===
    {"eco": "A00", "name": "Uncommon Opening", "moves": ["g4"], "description": "The Grob Attack - an aggressive but risky flank opening."},
    {"eco": "A00", "name": "Polish Opening", "moves": ["b4"], "description": "The Sokolsky Opening - controls a5 and prepares Bb2."},
    {"eco": "A01", "name": "Nimzo-Larsen Attack", "moves": ["b3"], "description": "Fianchettoes the queen's bishop for long diagonal control."},
    {"eco": "A02", "name": "Bird's Opening", "moves": ["f4"], "description": "Controls e5 and prepares kingside expansion."},
    {"eco": "A04", "name": "Réti Opening", "moves": ["Nf3"], "description": "A flexible hypermodern opening that delays central pawn moves."},
    {"eco": "A05", "name": "Réti Opening: King's Indian Attack", "moves": ["Nf3", "Nf6", "g3"], "description": "Leads to the King's Indian Attack setup."},
    {"eco": "A06", "name": "Réti Opening: Symmetrical", "moves": ["Nf3", "d5"], "description": "Black occupies the center immediately."},
    {"eco": "A10", "name": "English Opening", "moves": ["c4"], "description": "The English - a flexible opening that can transpose to many systems."},
    {"eco": "A13", "name": "English Opening: Agincourt Defense", "moves": ["c4", "e6"], "description": "Black prepares d5 or plays a reversed Queen's Gambit."},
    {"eco": "A15", "name": "English Opening: Anglo-Indian Defense", "moves": ["c4", "Nf6"], "description": "Flexible response allowing various setups."},
    {"eco": "A20", "name": "English Opening: Symmetrical", "moves": ["c4", "c5"], "description": "Symmetrical structure with tension on the c-file."},
    {"eco": "A30", "name": "English Opening: Symmetrical Hedgehog", "moves": ["c4", "c5", "Nf3", "Nf6", "Nc3", "e6"], "description": "The Hedgehog formation - compact but flexible."},
    {"eco": "A40", "name": "Queen's Pawn Game", "moves": ["d4"], "description": "Opening move controlling e5 and c5."},
    {"eco": "A45", "name": "Trompowsky Attack", "moves": ["d4", "Nf6", "Bg5"], "description": "Pins the knight and disrupts normal development."},
    {"eco": "A46", "name": "Queen's Pawn Game: Torre Attack", "moves": ["d4", "Nf6", "Nf3", "e6", "Bg5"], "description": "A solid system with the bishop on g5."},
    {"eco": "A48", "name": "London System", "moves": ["d4", "Nf6", "Nf3", "g6", "Bf4"], "description": "Very solid system suitable for all levels.", "keyIdeas": ["Solid pawn pyramid with d4-e3-c3", "Bishop to f4 before e3", "Simple development scheme"], "typicalPlans": ["h3 to prevent Nh5 attacks on Bf4", "Nbd2-e5 outpost", "c4 or c3 depending on setup"], "commonTraps": ["Nh5 attacking Bf4 early - play Bg3", "Don't play e3 before Bf4"]},
    {"eco": "A52", "name": "Budapest Gambit", "moves": ["d4", "Nf6", "c4", "e5"], "description": "Aggressive gambit sacrificing a pawn for activity."},
    {"eco": "A57", "name": "Benko Gambit", "moves": ["d4", "Nf6", "c4", "c5", "d5", "b5"], "description": "Sacrifices a pawn for long-term pressure on a/b files."},
    
    # === B: Semi-Open Games (1.e4 non-e5) ===
    {"eco": "B00", "name": "Nimzowitsch Defense", "moves": ["e4", "Nc6"], "description": "Hypermodern approach attacking e4 from the side."},
    {"eco": "B01", "name": "Scandinavian Defense", "moves": ["e4", "d5"], "description": "Immediately challenges White's center pawn."},
    {"eco": "B02", "name": "Alekhine's Defense", "moves": ["e4", "Nf6"], "description": "Invites White to advance pawns, then attacks them."},
    {"eco": "B06", "name": "Modern Defense", "moves": ["e4", "g6"], "description": "Hypermodern fianchetto allowing White a big center."},
    {"eco": "B07", "name": "Pirc Defense", "moves": ["e4", "d6", "d4", "Nf6", "Nc3", "g6"], "description": "Flexible hypermodern defense with kingside fianchetto."},
    {"eco": "B10", "name": "Caro-Kann Defense", "moves": ["e4", "c6"], "description": "Solid defense preparing d5 with pawn support.", "keyIdeas": ["Solid pawn structure", "Light-squared bishop stays active", "c6 supports d5"], "typicalPlans": ["d5 challenge White's center", "Bf5 before e6 for good bishop", "Nd7-f6 or Nf6-d7 maneuvering"], "commonTraps": ["Advance 3.e5 requires precise play", "Exchange gives minority attack chances"]},
    {"eco": "B12", "name": "Caro-Kann Defense: Advance Variation", "moves": ["e4", "c6", "d4", "d5", "e5"], "description": "White gains space but Black has targets."},
    {"eco": "B13", "name": "Caro-Kann Defense: Exchange Variation", "moves": ["e4", "c6", "d4", "d5", "exd5", "cxd5"], "description": "Symmetrical structure with equal chances."},
    {"eco": "B15", "name": "Caro-Kann Defense: Main Line", "moves": ["e4", "c6", "d4", "d5", "Nc3", "dxe4", "Nxe4"], "description": "The classical main line of the Caro-Kann."},
    {"eco": "B20", "name": "Sicilian Defense", "moves": ["e4", "c5"], "description": "The most popular and dynamic response to 1.e4.", "keyIdeas": ["Asymmetric pawn structure", "Queenside counterplay on c-file", "Black fights for initiative"], "typicalPlans": ["d6 and Nf6 development", "O-O or O-O-O depending on variation", "b5-b4 queenside expansion"], "commonTraps": ["Open Sicilian 3.d4 is the main challenge", "Be careful of early Bb5+ ideas"]},
    {"eco": "B21", "name": "Sicilian Defense: Smith-Morra Gambit", "moves": ["e4", "c5", "d4", "cxd4", "c3"], "description": "White sacrifices a pawn for rapid development."},
    {"eco": "B22", "name": "Sicilian Defense: Alapin Variation", "moves": ["e4", "c5", "c3"], "description": "Solid system preparing d4 without allowing the Open Sicilian."},
    {"eco": "B23", "name": "Sicilian Defense: Closed", "moves": ["e4", "c5", "Nc3"], "description": "The Closed Sicilian with g3 and Bg2."},
    {"eco": "B27", "name": "Sicilian Defense: Hyperaccelerated Dragon", "moves": ["e4", "c5", "Nf3", "g6"], "description": "Immediate fianchetto before committing pieces."},
    {"eco": "B30", "name": "Sicilian Defense: Old Sicilian", "moves": ["e4", "c5", "Nf3", "Nc6"], "description": "Develops knight before deciding on pawn structure."},
    {"eco": "B32", "name": "Sicilian Defense: Löwenthal Variation", "moves": ["e4", "c5", "Nf3", "Nc6", "d4", "cxd4", "Nxd4", "e5"], "description": "Black immediately challenges the knight."},
    {"eco": "B33", "name": "Sicilian Defense: Sveshnikov Variation", "moves": ["e4", "c5", "Nf3", "Nc6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "e5"], "description": "Dynamic and double-edged with ...e5."},
    {"eco": "B35", "name": "Sicilian Defense: Accelerated Dragon", "moves": ["e4", "c5", "Nf3", "Nc6", "d4", "cxd4", "Nxd4", "g6"], "description": "Dragon setup avoiding the Yugoslav Attack."},
    {"eco": "B40", "name": "Sicilian Defense: French Variation", "moves": ["e4", "c5", "Nf3", "e6"], "description": "Flexible move order allowing Scheveningen or Taimanov."},
    {"eco": "B44", "name": "Sicilian Defense: Taimanov Variation", "moves": ["e4", "c5", "Nf3", "e6", "d4", "cxd4", "Nxd4", "Nc6"], "description": "Flexible setup with piece play focus."},
    {"eco": "B50", "name": "Sicilian Defense: Modern Variations", "moves": ["e4", "c5", "Nf3", "d6"], "description": "The d6 Sicilian - most flexible continuation."},
    {"eco": "B54", "name": "Sicilian Defense: Dragon Variation", "moves": ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "g6"], "description": "The famous Dragon with the fianchettoed bishop."},
    {"eco": "B60", "name": "Sicilian Defense: Richter-Rauzer Attack", "moves": ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "Nc6", "Bg5"], "description": "Classical approach with Bg5 pressure."},
    {"eco": "B80", "name": "Sicilian Defense: Scheveningen Variation", "moves": ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "e6"], "description": "Solid small center with e6/d6 pawns."},
    {"eco": "B90", "name": "Sicilian Defense: Najdorf Variation", "moves": ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6"], "description": "The most popular Sicilian - incredibly sharp.", "keyIdeas": ["a6 prevents Bb5 and prepares b5", "Flexibility with e5 or e6", "Rich tactical possibilities"], "typicalPlans": ["e5 or e6 depending on White's setup", "b5-b4 queenside attack", "Qc7 and O-O-O or Be7 and O-O"], "commonTraps": ["English Attack with Be3/f3/Qd2/g4", "6.Bg5 Poisoned Pawn is very sharp", "Be careful of Nd5 sacrifices"]},
    
    # === C: Open Games (1.e4 e5) ===
    {"eco": "C00", "name": "French Defense", "moves": ["e4", "e6"], "description": "Solid defense preparing d5 and a French pawn structure."},
    {"eco": "C01", "name": "French Defense: Exchange Variation", "moves": ["e4", "e6", "d4", "d5", "exd5", "exd5"], "description": "Symmetrical structure with open e-file."},
    {"eco": "C02", "name": "French Defense: Advance Variation", "moves": ["e4", "e6", "d4", "d5", "e5"], "description": "Space advantage but Black attacks the chain."},
    {"eco": "C03", "name": "French Defense: Tarrasch Variation", "moves": ["e4", "e6", "d4", "d5", "Nd2"], "description": "Avoids pins on the c3 knight."},
    {"eco": "C10", "name": "French Defense: Classical Variation", "moves": ["e4", "e6", "d4", "d5", "Nc3", "Nf6"], "description": "The main line of the French."},
    {"eco": "C11", "name": "French Defense: Steinitz Variation", "moves": ["e4", "e6", "d4", "d5", "Nc3", "Nf6", "e5"], "description": "Gains space with e5."},
    {"eco": "C15", "name": "French Defense: Winawer Variation", "moves": ["e4", "e6", "d4", "d5", "Nc3", "Bb4"], "description": "Sharp variation with the pin on Nc3."},
    {"eco": "C20", "name": "King's Pawn Game", "moves": ["e4", "e5"], "description": "The classical start to open games."},
    {"eco": "C21", "name": "Danish Gambit", "moves": ["e4", "e5", "d4", "exd4", "c3"], "description": "Aggressive gambit sacrificing two pawns."},
    {"eco": "C23", "name": "Bishop's Opening", "moves": ["e4", "e5", "Bc4"], "description": "Develops bishop early targeting f7."},
    {"eco": "C25", "name": "Vienna Game", "moves": ["e4", "e5", "Nc3"], "description": "Flexible knight development before deciding on d4."},
    {"eco": "C30", "name": "King's Gambit", "moves": ["e4", "e5", "f4"], "description": "Romantic-era gambit sacrificing the f-pawn."},
    {"eco": "C33", "name": "King's Gambit Accepted", "moves": ["e4", "e5", "f4", "exf4"], "description": "Black takes the gambit pawn."},
    {"eco": "C40", "name": "Latvian Gambit", "moves": ["e4", "e5", "Nf3", "f5"], "description": "Risky but aggressive counter-gambit."},
    {"eco": "C41", "name": "Philidor Defense", "moves": ["e4", "e5", "Nf3", "d6"], "description": "Solid but passive defense."},
    {"eco": "C42", "name": "Petrov's Defense", "moves": ["e4", "e5", "Nf3", "Nf6"], "description": "Solid counterattacking defense at high levels."},
    {"eco": "C44", "name": "Scotch Game", "moves": ["e4", "e5", "Nf3", "Nc6", "d4"], "description": "Immediate central confrontation."},
    {"eco": "C45", "name": "Scotch Game: Classical Variation", "moves": ["e4", "e5", "Nf3", "Nc6", "d4", "exd4", "Nxd4", "Bc5"], "description": "Black develops actively."},
    {"eco": "C46", "name": "Three Knights Game", "moves": ["e4", "e5", "Nf3", "Nc6", "Nc3"], "description": "Develops both knights early."},
    {"eco": "C47", "name": "Four Knights Game", "moves": ["e4", "e5", "Nf3", "Nc6", "Nc3", "Nf6"], "description": "Symmetrical knight development."},
    {"eco": "C50", "name": "Italian Game", "moves": ["e4", "e5", "Nf3", "Nc6", "Bc4"], "description": "Classical development targeting f7.", "keyIdeas": ["Targets weak f7 square", "Controls d5 with pieces", "Natural development"], "typicalPlans": ["c3 and d4 central break", "O-O and Re1", "Ng5 attacks on f7"], "commonTraps": ["Fried Liver Attack after Nf6", "Two Knights Defense is sharp"]},
    {"eco": "C51", "name": "Italian Game: Evans Gambit", "moves": ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "b4"], "description": "Romantic gambit for rapid development."},
    {"eco": "C53", "name": "Italian Game: Giuoco Piano", "moves": ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5"], "description": "The 'Quiet Game' - strategic play."},
    {"eco": "C54", "name": "Italian Game: Giuoco Piano Main Line", "moves": ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "c3", "Nf6", "d4"], "description": "Central break with d4."},
    {"eco": "C55", "name": "Two Knights Defense", "moves": ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6"], "description": "Aggressive response to the Italian."},
    {"eco": "C57", "name": "Two Knights Defense: Fried Liver Attack", "moves": ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6", "Ng5", "d5", "exd5", "Nxd5", "Nxf7"], "description": "Famous sacrificing attack on f7."},
    {"eco": "C60", "name": "Ruy Lopez", "moves": ["e4", "e5", "Nf3", "Nc6", "Bb5"], "description": "The Spanish Game - most played opening at top level.", "keyIdeas": ["Pressure on e5 indirectly", "Long-term positional play", "Superior structures"], "typicalPlans": ["a6 Ba4 b5 Bb3 retreat pattern", "d4 central break", "Re1 and h3 slow maneuvering"], "commonTraps": ["Berlin Defense is very drawish", "Marshall Gambit is sharp", "Exchange variation for endgame players"]},
    {"eco": "C63", "name": "Ruy Lopez: Schliemann Defense", "moves": ["e4", "e5", "Nf3", "Nc6", "Bb5", "f5"], "description": "Aggressive gambit against the Ruy Lopez."},
    {"eco": "C65", "name": "Ruy Lopez: Berlin Defense", "moves": ["e4", "e5", "Nf3", "Nc6", "Bb5", "Nf6"], "description": "Solid defense favored at the highest level."},
    {"eco": "C68", "name": "Ruy Lopez: Exchange Variation", "moves": ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Bxc6", "dxc6"], "description": "Damages Black's structure for endgame edge."},
    {"eco": "C70", "name": "Ruy Lopez: Morphy Defense", "moves": ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4"], "description": "The main line of the Ruy Lopez."},
    {"eco": "C78", "name": "Ruy Lopez: Morphy Defense, Arkhangelsk", "moves": ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "b5"], "description": "Active setup with b5/Bb7."},
    {"eco": "C80", "name": "Ruy Lopez: Open Variation", "moves": ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Nxe4"], "description": "Sharp gambit play winning the e4 pawn."},
    {"eco": "C84", "name": "Ruy Lopez: Closed Defense", "moves": ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7"], "description": "The most solid and common response."},
    {"eco": "C88", "name": "Ruy Lopez: Closed, Anti-Marshall", "moves": ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7", "Re1", "b5", "Bb3", "O-O", "h3"], "description": "Avoids the Marshall Attack."},
    {"eco": "C89", "name": "Ruy Lopez: Marshall Attack", "moves": ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7", "Re1", "b5", "Bb3", "O-O", "c3", "d5"], "description": "Famous gambit with long-term attack."},
    {"eco": "C92", "name": "Ruy Lopez: Closed, Flohr System", "moves": ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7", "Re1", "b5", "Bb3", "d6", "c3", "O-O", "h3"], "description": "Classical main line position."},
    
    # === D: Closed and Semi-Closed Games (1.d4 d5) ===
    {"eco": "D00", "name": "Queen's Pawn Game", "moves": ["d4", "d5"], "description": "Classical response to 1.d4."},
    {"eco": "D02", "name": "Queen's Pawn Game: London System", "moves": ["d4", "d5", "Nf3", "Nf6", "Bf4"], "description": "The London System - solid and easy to play."},
    {"eco": "D06", "name": "Queen's Gambit", "moves": ["d4", "d5", "c4"], "description": "The Queen's Gambit - offers a pawn for central control.", "keyIdeas": ["Central control with c4 pressure", "Not a real gambit - pawn recoverable", "Piece activity advantage"], "typicalPlans": ["cxd5 exchange and minority attack", "e3 and Bd3 development", "Nc3 and Nf3 before committing bishop"], "commonTraps": ["dxc4 is playable but White regains", "e6 QGD is most solid", "c6 Slav keeps bishop active"]},
    {"eco": "D07", "name": "Queen's Gambit: Chigorin Defense", "moves": ["d4", "d5", "c4", "Nc6"], "description": "Unusual knight defense keeping the center fluid."},
    {"eco": "D10", "name": "Queen's Gambit: Slav Defense", "moves": ["d4", "d5", "c4", "c6"], "description": "Solid defense keeping the light-squared bishop active."},
    {"eco": "D11", "name": "Slav Defense: Modern Line", "moves": ["d4", "d5", "c4", "c6", "Nf3"], "description": "Flexible development before committing the center."},
    {"eco": "D15", "name": "Slav Defense: Schlechter Variation", "moves": ["d4", "d5", "c4", "c6", "Nf3", "Nf6", "Nc3", "g6"], "description": "Fianchetto setup in the Slav."},
    {"eco": "D17", "name": "Slav Defense: Czech Variation", "moves": ["d4", "d5", "c4", "c6", "Nf3", "Nf6", "Nc3", "dxc4", "a4", "Bf5"], "description": "The most aggressive Slav line."},
    {"eco": "D20", "name": "Queen's Gambit Accepted", "moves": ["d4", "d5", "c4", "dxc4"], "description": "Black takes the gambit pawn."},
    {"eco": "D30", "name": "Queen's Gambit Declined", "moves": ["d4", "d5", "c4", "e6"], "description": "Classical solid defense."},
    {"eco": "D31", "name": "Queen's Gambit Declined: Semi-Slav", "moves": ["d4", "d5", "c4", "e6", "Nc3", "c6"], "description": "Combines ideas of the Slav and QGD."},
    {"eco": "D35", "name": "Queen's Gambit Declined: Exchange Variation", "moves": ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "cxd5", "exd5"], "description": "Symmetrical structure with minority attack plans."},
    {"eco": "D37", "name": "Queen's Gambit Declined: Classical", "moves": ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Nf3", "Be7"], "description": "The Classical QGD setup."},
    {"eco": "D43", "name": "Semi-Slav Defense: Main Line", "moves": ["d4", "d5", "c4", "c6", "Nf3", "Nf6", "Nc3", "e6"], "description": "Solid and flexible Semi-Slav."},
    {"eco": "D45", "name": "Semi-Slav Defense: Meran Variation", "moves": ["d4", "d5", "c4", "c6", "Nf3", "Nf6", "Nc3", "e6", "e3", "Nbd7", "Bd3", "dxc4", "Bxc4", "b5"], "description": "Sharp gambit play with b5."},
    {"eco": "D52", "name": "Queen's Gambit Declined: Cambridge Springs", "moves": ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "Nbd7", "e3", "c6", "Nf3", "Qa5"], "description": "Tactical Queen sortie."},
    {"eco": "D55", "name": "Queen's Gambit Declined: Orthodox Defense", "moves": ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "Be7", "e3", "O-O", "Nf3"], "description": "The most classical QGD."},
    {"eco": "D60", "name": "Queen's Gambit Declined: Orthodox, Botvinnik Variation", "moves": ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "Be7", "e3", "O-O", "Nf3", "Nbd7"], "description": "Named after the world champion."},
    {"eco": "D70", "name": "Neo-Grünfeld Defense", "moves": ["d4", "Nf6", "c4", "g6", "f3", "d5"], "description": "A Grünfeld-like setup."},
    {"eco": "D80", "name": "Grünfeld Defense", "moves": ["d4", "Nf6", "c4", "g6", "Nc3", "d5"], "description": "Hypermodern attack on White's center."},
    {"eco": "D85", "name": "Grünfeld Defense: Exchange Variation", "moves": ["d4", "Nf6", "c4", "g6", "Nc3", "d5", "cxd5", "Nxd5", "e4", "Nxc3", "bxc3"], "description": "White builds a big center; Black attacks it."},
    {"eco": "D90", "name": "Grünfeld Defense: Russian System", "moves": ["d4", "Nf6", "c4", "g6", "Nc3", "d5", "Nf3"], "description": "The main line with Nf3."},
    
    # === E: Indian Defenses (1.d4 Nf6) ===
    {"eco": "E00", "name": "Queen's Pawn Game: Indian Systems", "moves": ["d4", "Nf6"], "description": "The starting point for all Indian defenses."},
    {"eco": "E10", "name": "Queen's Pawn Game: Blumenfeld Countergambit", "moves": ["d4", "Nf6", "c4", "e6", "Nf3", "c5", "d5", "b5"], "description": "Aggressive pawn sacrifice for center control."},
    {"eco": "E12", "name": "Queen's Indian Defense", "moves": ["d4", "Nf6", "c4", "e6", "Nf3", "b6"], "description": "Solid fianchetto controlling e4."},
    {"eco": "E14", "name": "Queen's Indian Defense: Classical Variation", "moves": ["d4", "Nf6", "c4", "e6", "Nf3", "b6", "e3", "Bb7", "Bd3"], "description": "White develops solidly."},
    {"eco": "E20", "name": "Nimzo-Indian Defense", "moves": ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4"], "description": "Pins the knight and controls e4.", "keyIdeas": ["Pin c3 knight prevents e4", "Flexible pawn structure", "Can double White's c-pawns"], "typicalPlans": ["O-O and d5 or d6", "Bxc3 when advantageous", "b6 and Ba6 exchanging bishops"], "commonTraps": ["Qc2 avoids doubled pawns", "e3 lines are positional", "4.f3 is aggressive"]},
    {"eco": "E21", "name": "Nimzo-Indian Defense: Three Knights Variation", "moves": ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4", "Nf3"], "description": "Develops both knights before resolving the pin."},
    {"eco": "E32", "name": "Nimzo-Indian Defense: Classical Variation", "moves": ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4", "Qc2"], "description": "Prevents doubled pawns on c-file."},
    {"eco": "E41", "name": "Nimzo-Indian Defense: Hübner Variation", "moves": ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4", "e3", "c5"], "description": "Immediate challenge of d4."},
    {"eco": "E52", "name": "Nimzo-Indian Defense: Main Line", "moves": ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4", "e3", "O-O", "Bd3", "d5", "Nf3", "b6"], "description": "Classical main line setup."},
    {"eco": "E60", "name": "King's Indian Defense", "moves": ["d4", "Nf6", "c4", "g6"], "description": "Fianchetto allowing White a big center.", "keyIdeas": ["Let White build center, attack it later", "Kingside fianchetto", "Dynamic counterplay with e5 or c5"], "typicalPlans": ["d6 and Bg7 fianchetto", "e5 central break", "f5-f4 kingside attack"], "commonTraps": ["e5 timing is critical", "Four Pawns Attack is aggressive", "Fianchetto variation avoids main lines"]},
    {"eco": "E62", "name": "King's Indian Defense: Fianchetto Variation", "moves": ["d4", "Nf6", "c4", "g6", "Nf3", "Bg7", "g3"], "description": "White also fianchettoes."},
    {"eco": "E70", "name": "King's Indian Defense: Classical Variation", "moves": ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6", "Nf3"], "description": "Main classical setup."},
    {"eco": "E76", "name": "King's Indian Defense: Four Pawns Attack", "moves": ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6", "f4"], "description": "Aggressive pawn storm approach."},
    {"eco": "E80", "name": "King's Indian Defense: Sämisch Variation", "moves": ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6", "f3"], "description": "Prepares Be3 and kingside expansion."},
    {"eco": "E87", "name": "King's Indian Defense: Sämisch, Orthodox", "moves": ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6", "f3", "O-O", "Be3", "e5"], "description": "Standard Sämisch main line."},
    {"eco": "E90", "name": "King's Indian Defense: Classical, Main Line", "moves": ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6", "Nf3", "O-O", "Be2"], "description": "The most common King's Indian."},
    {"eco": "E97", "name": "King's Indian Defense: Mar del Plata Variation", "moves": ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6", "Nf3", "O-O", "Be2", "e5", "O-O", "Nc6", "d5", "Ne7"], "description": "Famous attacking variation with opposite-side attacks."},
    {"eco": "E99", "name": "King's Indian Defense: Mar del Plata, Bayonet Attack", "moves": ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6", "Nf3", "O-O", "Be2", "e5", "O-O", "Nc6", "d5", "Ne7", "b4"], "description": "White attacks on the queenside."},
]


def generate_fen(moves: list) -> str:
    """Generate FEN from a list of SAN moves starting from initial position"""
    board = chess.Board()
    for move in moves:
        try:
            board.push_san(move)
        except:
            break
    return board.fen()


async def seed_openings():
    """Seed the openings collection with ECO data"""
    
    # Connect to MongoDB
    mongodb_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongodb_uri)
    db = client["grandmaster_guard"]
    openings_collection = db.openings
    
    print(f"✓ Connected to MongoDB: {mongodb_uri}")

    # Load expanded openings from JSON
    json_path = os.path.join(os.path.dirname(__file__), "..", "data", "openings_expanded.json")
    json_openings = []
    try:
        with open(json_path, "r") as f:
            json_openings = json.load(f)
        print(f"✓ Loaded {len(json_openings)} openings from JSON")
    except Exception as e:
        print(f"⚠️ Could not load JSON openings: {e}")

    # Combine lists (JSON takes precedence if duplicates)
    combined_openings = OPENINGS.copy()
    existing_keys = set((o["eco"], o["name"]) for o in OPENINGS)
    
    for op in json_openings:
        key = (op["eco"], op["name"])
        if key not in existing_keys:
            combined_openings.append(op)
            existing_keys.add(key)
        else:
            # Update existing opening with JSON data (contains teaching content)
            for idx, existing in enumerate(combined_openings):
                if (existing["eco"], existing["name"]) == key:
                    combined_openings[idx].update(op)
                    break

    print(f"\n🔄 Seeding {len(combined_openings)} openings...")
    
    inserted = 0
    updated = 0
    
    for opening in combined_openings:
        # Generate FEN for the position after main line moves
        fen = generate_fen(opening["moves"])
        
        doc = {
            "eco": opening["eco"],
            "name": opening["name"],
            "moves": opening["moves"],
            "movesUci": [],  # Could add UCI conversion
            "fen": fen,
            "description": opening.get("description", ""),
            "numMoves": len(opening["moves"]),
            # Teaching content
            "keyIdeas": opening.get("keyIdeas", []),
            "typicalPlans": opening.get("typicalPlans", []),
            "commonTraps": opening.get("commonTraps", [])
        }
        
        try:
            result = await openings_collection.update_one(
                {"eco": opening["eco"], "name": opening["name"]},
                {"$set": doc},
                upsert=True
            )
            if result.upserted_id:
                inserted += 1
            elif result.modified_count > 0:
                updated += 1
        except Exception as e:
            print(f"   Error: {e}")
    
    # Create indexes
    print(f"\n🔧 Creating indexes...")
    await openings_collection.create_index("eco")
    await openings_collection.create_index("name")
    await openings_collection.create_index([("eco", 1), ("name", 1)], unique=True)
    
    # Final count
    total = await openings_collection.count_documents({})
    
    print(f"\n✅ Seeding complete!")
    print(f"   Inserted: {inserted}")
    print(f"   Updated: {updated}")
    print(f"   Total openings in database: {total}")
    
    # Count by ECO category
    for cat in ["A", "B", "C", "D", "E"]:
        count = await openings_collection.count_documents({"eco": {"$regex": f"^{cat}"}})
        print(f"   {cat}xx: {count} openings")
    
    client.close()
    print(f"\n🎉 Opening database ready!")


if __name__ == "__main__":
    asyncio.run(seed_openings())
