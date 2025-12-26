# Grandmaster Guard - AI Chess Coach Platform

> **LLM Context Document** - This file provides comprehensive documentation of the entire platform for AI/LLM understanding.

## 🎯 Project Overview

**Grandmaster Guard** is an AI-powered chess coaching platform that helps players improve through:
- Game analysis with Stockfish engine
- Puzzle training across all game phases
- AI coaching using LangGraph agents
- Video content generation for social media

### Target Users
- Chess players of all levels (800-2500 ELO)
- Content creators wanting chess puzzles for TikTok/Instagram
- Players wanting personalized coaching without paying for a human coach

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js 14)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐    │
│  │  Home    │  │  Games   │  │ Puzzles  │  │  AI Trainer      │    │
│  │  Page    │  │  List    │  │ Training │  │  (Coach Hub)     │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘    │
│                      │                                               │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    Shared Components                          │   │
│  │  ChessBoard | Navigation | BoardThemeSelector | TTSProvider  │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              │ HTTP/REST │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         BACKEND (FastAPI)                           │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                      API Routers                              │   │
│  │  /api/games | /api/analysis | /api/puzzles | /api/coach      │   │
│  │  /api/content | /api/captcha                                  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                     AI Services                               │   │
│  │  StockfishAnalyzer | LangGraph Agents | TTS Service          │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
   ┌────────────┐     ┌────────────┐      ┌────────────┐
   │  MongoDB   │     │  Stockfish │      │   Ollama   │
   │  (Puzzles) │     │  (Engine)  │      │  (Gemma)   │
   └────────────┘     └────────────┘      └────────────┘
```

---

## 📁 Project Structure

```
grandmaster-guard/
├── src/                          # Frontend (Next.js)
│   ├── app/
│   │   ├── page.tsx              # Home page (dashboard)
│   │   ├── games/page.tsx        # Game import & list
│   │   ├── puzzles/page.tsx      # Puzzle training
│   │   ├── trainer/page.tsx      # AI Trainer hub
│   │   └── analysis/[gameId]/    # Game analysis view
│   ├── components/
│   │   ├── ChessBoard.tsx        # Interactive chess board
│   │   ├── Navigation.tsx        # App navigation
│   │   └── BoardThemeSelector.tsx
│   ├── context/
│   │   └── BoardThemeContext.tsx # Theme state management
│   └── hooks/
│       └── useSounds.tsx         # Sound effects
│
├── api/                          # Backend (FastAPI)
│   ├── main.py                   # FastAPI app entry
│   ├── routers/
│   │   ├── games.py              # GET games from Chess.com
│   │   ├── analysis.py           # Stockfish analysis
│   │   ├── puzzles.py            # Puzzle database
│   │   ├── coach.py              # LangGraph AI coaching
│   │   └── content.py            # Video content generation
│   ├── agents/                   # LangGraph agents
│   │   ├── puzzle_coach.py       # Puzzle coaching agent
│   │   ├── game_coach.py         # Game analysis coaching
│   │   └── content_creator.py    # Social media content
│   └── services/
│       ├── stockfish_analyzer.py # Stockfish integration
│       ├── puzzle_service.py     # Lichess puzzle database
│       ├── tts_service.py        # Edge-TTS audio generation
│       └── social_publisher.py   # TikTok/Instagram API
│
├── docker-compose.yml            # Multi-container setup
└── package.json                  # Frontend dependencies
```

---

## 🎮 Features

### 1. Game Import & Analysis
- **Import**: Fetch games from Chess.com by username
- **Analysis**: Stockfish 16 evaluates every move
- **Classifications**: Brilliant, Great, Best, Good, Inaccuracy, Mistake, Blunder
- **Visualizations**: Evaluation graph, move-by-move navigation
- **AI Insights**: LangGraph generates explanations for key moves

### 2. Puzzle Training
- **Database**: 10,000+ puzzles from Lichess
- **Phases**: Opening, Middlegame, Endgame, or All
- **Difficulty**: Puzzles rated 800-2500
- **AI Coach**: Automatic hints on puzzle load, explanations on correct/wrong moves
- **TTS**: Coaching messages spoken aloud
- **Themes**: Fork, pin, skewer, mate patterns detected

### 3. AI Coaching (LangGraph)
- **No Chat Interface**: Prevents prompt injection attacks
- **Automatic**: Coaching triggered by moves, not user input
- **Modes**:
  - `hint` - Initial guidance when puzzle loads
  - `correct` - Celebration + tactical explanation
  - `wrong` - Helpful hint without revealing answer
- **LLM**: Gemma 2B via Ollama (local, private)

### 4. Video Content Generation (Automated Pipeline)
- **Architecture**: Hybrid Python/Node.js pipeline
- **Workflow**:
  1. **Content Agent**: Generates viral hook, caption, hashtags (Gemma LLM)
  2. **TTS Service**: Generates enthusiastic commentary audio (Edge-TTS)
  3. **Video Service**: Orchestrates rendering
  4. **Remotion**: Renders React components to MP4 video
- **Video Components**:
  - `PuzzleVideo.tsx`: Main composition
  - `ChessBoardAnimation.tsx`: Animated board using `react-chessboard`
  - `Title.tsx`: Dynamic hook text animation
- **Resolution**: 1080x1920 (9:16 vertical for TikTok/Reels)
- **Output**: `.mp4` files saved to `/tmp/videos` (or uploaded)

---

## 🔌 API Endpoints

### Games Router (`/api/games`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/games/{username}` | Fetch Chess.com games |
| GET | `/api/games/{username}/{gameId}` | Get specific game PGN |

### Analysis Router (`/api/analysis`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analysis/analyze` | Analyze a game with Stockfish |
| GET | `/api/analysis/status/{id}` | Check analysis progress |

### Puzzles Router (`/api/puzzles`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/puzzles/phase/{phase}` | Get puzzles by phase |
| GET | `/api/puzzles/random` | Get random puzzle |

### Coach Router (`/api/coach`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/coach/puzzle` | Get puzzle move coaching |
| POST | `/api/coach/game` | Get game move coaching |
| GET | `/api/coach/health` | Service health check |

### Content Router (`/api/content`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/content/generate` | Generate captions, hashtags, commentary |
| POST | `/api/content/tts` | Generate TTS audio |
| POST | `/api/content/full` | Full content + audio pipeline |
| GET | `/api/content/health` | Service health check |

---

## 🤖 AI Components

### LangGraph Agents

#### Puzzle Coach Agent (`puzzle_coach.py`)
```python
State:
  - fen: str              # Current position
  - solution: list[str]   # Expected moves
  - user_move: str        # Player's move
  - is_correct: bool      # Was it right?
  - mode: str             # 'hint', 'correct', 'wrong'
  
Nodes:
  1. analyze_position_node  # Detect tactical patterns
  2. generate_coaching_node # LLM generates message
```

#### Game Coach Agent (`game_coach.py`)
```python
State:
  - fen: str
  - move_san: str
  - classification: str   # 'blunder', 'brilliant', etc.
  - cp_loss: int          # Centipawn loss
  
Nodes:
  1. generate_game_coaching_node  # Explains the move
```

#### Content Creator Agent (`content_creator.py`)
```python
State:
  - fen: str
  - solution: list[str]
  - tactical_theme: str
  
Outputs:
  - hook: str             # "ONLY 1% CAN SOLVE THIS!"
  - caption: str          # Social media caption
  - hashtags: list[str]   # Optimized hashtags
  - commentary: str       # TTS script
```

### Stockfish Integration
- **Version**: Stockfish 16
- **Depth**: 20 (configurable)
- **Output**: Centipawn evaluation, best move, classifications
- **Move Classifications**:
  - `brilliant` (!!): Finds only winning move
  - `great` (!): Strong improvement
  - `best`: Engine's top choice
  - `good`: Minor loss (<20cp)
  - `inaccuracy` (?!): 20-50cp loss
  - `mistake` (?): 50-100cp loss
  - `blunder` (??): >100cp loss

---

## 💾 Database Schema

### MongoDB Collections

#### `puzzles`
```json
{
  "_id": "ObjectId",
  "puzzleId": "abc123",
  "fen": "r1bqkb1r/...",
  "moves": ["e2e4", "e7e5"],
  "rating": 1500,
  "themes": ["fork", "middlegame"],
  "phase": "middlegame"
}
```

#### `games` (cached)
```json
{
  "_id": "ObjectId",
  "username": "player123",
  "gameId": "chess.com/game/123",
  "pgn": "1. e4 e5 ...",
  "result": "1-0",
  "analyzed": true,
  "analysis": { ... }
}
```

---

## 🚀 Running the Application

### Docker (Recommended)
```bash
cd grandmaster-guard
docker-compose up -d
```

Services:
- Frontend: http://localhost:3001
- Backend: http://localhost:8000
- MongoDB: localhost:27017
- Ollama: localhost:11434

### Development
```bash
# Frontend
npm install
npm run dev

# Backend
cd api
pip install -r requirements.txt
uvicorn api.main:app --reload
```

---

## 🎨 Design System & Brand Identity

### Brand Philosophy: "Stone & Sage"

Grandmaster Guard uses a **Zen Chess** design philosophy - calming, cortisol-reducing colors that help players focus and learn without stress. The design is intentionally soft and non-aggressive, unlike typical chess apps with harsh reds and sharp contrasts.

**Design Principles:**
1. **Calming over Alarming**: Soft muted colors, no harsh reds
2. **Focus over Distraction**: Clean layouts, minimal visual noise
3. **Elegance over Flash**: Subtle animations, premium feel
4. **Accessibility First**: High contrast ratios, readable fonts

---

### Color Palette

#### Core Colors
| Name | Hex | Usage |
|------|-----|-------|
| **Charcoal** | `#1a1d21` | Background |
| **Slate** | `#252930` | Cards, surfaces |
| **Sage Green** | `#7fb285` | Primary accent |
| **Warm White** | `#f5f3f0` | Text, foreground |
| **Stone Gray** | `#6b7280` | Muted text |

#### Move Classification Colors (Soft, not harsh)
| Classification | Color | Hex |
|----------------|-------|-----|
| Brilliant !! | Soft Mint | `#98d4a8` |
| Great ! | Soft Teal | `#8ec3d4` |
| Best | Sage | `#7fb285` |
| Good | Muted Sage | `#b4c4be` |
| Inaccuracy ?! | Warm Amber | `#d4a574` |
| Mistake ? | Soft Orange | `#c9a078` |
| Blunder ?? | Muted Rose | `#c97b84` |

> **Note**: Blunders use Muted Rose (`#c97b84`), NOT harsh red. This reduces stress and shame when making mistakes.

---

### Typography

| Element | Font | Weight | Size |
|---------|------|--------|------|
| Body | Inter | 400 | 16px |
| Headings | Inter | 600-700 | 18-32px |
| Monospace | ui-monospace | 400 | 14px |
| Move notation | Monospace | 500 | 14px |

**CSS Variables:**
```css
--font-sans: 'Inter', system-ui, sans-serif;
--font-mono: ui-monospace, monospace;
```

---

### Spacing & Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius` | `1rem` (16px) | Buttons, inputs |
| `--radius-lg` | `1.5rem` (24px) | Cards, chess board |
| Padding | `1.5rem` | Card content |
| Gap | `0.5-1rem` | Element spacing |

> Extra-rounded corners create a calming, modern feel.

---

### Components

#### Zen Card
```css
.zen-card {
  background: var(--card);           /* #252930 */
  border-radius: var(--radius-lg);   /* 24px */
  padding: 1.5rem;
  border: 1px solid var(--border);   /* #363b44 */
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}
```

#### Zen Button
```css
.zen-button {
  background: var(--primary);        /* #7fb285 */
  color: var(--primary-foreground);  /* #1a1d21 */
  border-radius: var(--radius);      /* 16px */
  box-shadow: 0 4px 16px rgba(127, 178, 133, 0.2);
}
```

#### Coach Card
```css
.coach-card {
  background: var(--card);
  border-radius: var(--radius);
  border-left: 3px solid var(--primary);
  animation: gentle-fade-in 0.5s ease-out;
}
```

---

### Animations

All animations are **slow and gentle** to maintain calmness:

| Animation | Duration | Easing |
|-----------|----------|--------|
| Fast | 150ms | cubic-bezier(0.4, 0, 0.2, 1) |
| Medium | 300ms | cubic-bezier(0.4, 0, 0.2, 1) |
| Slow | 500ms | cubic-bezier(0.4, 0, 0.2, 1) |

**Keyframe Animations:**
- `gentle-fade-in`: Fade + 8px translateY (cards appearing)
- `gentle-pulse`: Subtle scale + opacity (loading states)
- `slide-in-left`: Slide + fade (move list items)

**Important**: Chess board pieces have `transition: none !important` to prevent layout shifts.

---

### Chess Board Themes

| Theme | Light Square | Dark Square |
|-------|--------------|-------------|
| Green | `#eeeed2` | `#769656` |
| Blue | `#dee3e6` | `#8ca2ad` |
| Brown | `#f0d9b5` | `#b58863` |
| Purple | `#e8dff5` | `#9b7fc7` |
| Gray | `#e8e8e8` | `#a0a0a0` |

Board styling:
```css
.chess-board {
  border-radius: 24px;
  overflow: hidden;
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.4),
    0 0 80px rgba(127, 178, 133, 0.05);  /* Subtle sage glow */
}
```

---

### Sound Design

| Event | Sound | Purpose |
|-------|-------|---------|
| Normal move | Soft wood tap | Confirmation |
| Capture | Sharper tap | Material change |
| Check | Alert tone | Danger awareness |
| Blunder | Low thud | Mistake feedback (not alarming) |
| Brilliant | Chime | Achievement celebration |

---

### Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 768px | Stacked, full-width board |
| Tablet | 768-1024px | Collapsible side panels |
| Desktop | > 1024px | Full grid with side panels |

---

### Glassmorphism Utility

```css
.glass {
  background: rgba(37, 41, 48, 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.05);
}
```

---

### Accessibility

- **Focus states**: 2px solid sage green outline (`#7fb285`)
- **Color contrast**: All text passes WCAG AA
- **Keyboard navigation**: Full support
- **Screen reader**: Semantic HTML, ARIA labels
- **Reduced motion**: Respects `prefers-reduced-motion`

---

### Icon System

Uses **Lucide React** for consistent, lightweight icons:
- Navigation: `Home`, `Puzzle`, `BarChart3`, `Bot`
- Actions: `ArrowLeft`, `RefreshCw`, `Check`, `X`
- Feedback: `Sparkles`, `Lightbulb`, `Crown`

---

## 🔒 Security Considerations

### Prompt Injection Prevention
- **No user text input to LLM**: All coaching uses structured data
- **API accepts only**: FEN, moves, classifications, booleans
- **No chat interface**: Removes attack vector entirely

### API Rate Limiting
- Chess.com API: Respects rate limits
- Stockfish: Local, no external calls
- Ollama: Local LLM, no data leaving server

---

## 📊 Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React 18, TypeScript |
| Styling | Tailwind CSS, Framer Motion |
| Chess Board | react-chessboard v5 |
| Chess Logic | chess.js |
| Backend | FastAPI, Python 3.11 |
| Database | MongoDB, Motor (async) |
| Chess Engine | Stockfish 16 |
| AI/LLM | Ollama (Gemma 2B), LangGraph |
| TTS | Edge-TTS |
| Video | Remotion (planned) |
| Deployment | Docker, Docker Compose |

---

## 🗺️ Roadmap

### Completed ✅
- [x] Game import from Chess.com
- [x] Stockfish analysis with move classifications
- [x] Puzzle training with phase selection
- [x] LangGraph AI coaching (puzzle & game)
- [x] TTS for coaching messages
- [x] Content generation API (captions, hashtags)

### In Progress 🚧
- [ ] Remotion video composition for puzzles
- [ ] TikTok/Instagram direct publishing
- [ ] Content Studio UI

### Planned 📋
- [ ] Lichess.org game import
- [ ] Opening trainer
- [ ] Spaced repetition for puzzles
- [ ] Multiplayer puzzle racing
- [ ] Mobile app (React Native)

---

## 📝 Environment Variables

```env
# Backend
MONGODB_URL=mongodb://mongodb:27017
OLLAMA_URL=http://ollama:11434
GOOGLE_API_KEY=your_gemini_key  # Optional fallback

# Social Media (for content publishing)
TIKTOK_CLIENT_KEY=your_key
TIKTOK_CLIENT_SECRET=your_secret
INSTAGRAM_ACCESS_TOKEN=your_token
INSTAGRAM_USER_ID=your_id

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🤝 Contributing

This is an AI-assisted project. When making changes:
1. Update this documentation
2. Add tests for new features
3. Follow existing code patterns
4. Use TypeScript for frontend, Python type hints for backend

---

**Last Updated**: December 25, 2024
**Version**: 1.0.0
**Maintainer**: AI-assisted development with Grandmaster Guard team
