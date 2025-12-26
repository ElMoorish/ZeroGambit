import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * ZeroGambit Newsletter Generator
 * 
 * Uses Gemini LLM to create engaging chess content:
 * - Weekly tactical puzzles
 * - Opening spotlights
 * - Strategic tips
 * - Affiliate recommendations
 */

// Initialize Gemini
const getGenAI = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    return new GoogleGenerativeAI(apiKey);
};

export interface NewsletterContent {
    subject: string;
    html: string;
    plainText: string;
    generatedAt: Date;
}

export interface TacticOfTheWeek {
    fen: string;
    solution: string[];
    theme: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    hint: string;
}

export interface OpeningSpotlight {
    name: string;
    eco: string;
    moves: string;
    keyIdeas: string[];
    famousGame?: string;
}

// Newsletter templates
const NEWSLETTER_STYLES = `
<style>
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0a0a0a; color: #e5e5e5; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
  .header { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
  .header h1 { color: white; margin: 0; font-size: 28px; }
  .header p { color: rgba(255,255,255,0.8); margin: 10px 0 0; }
  .content { background: #1a1a1a; padding: 30px; border-radius: 0 0 12px 12px; }
  .section { margin-bottom: 30px; padding-bottom: 30px; border-bottom: 1px solid #333; }
  .section:last-child { border-bottom: none; margin-bottom: 0; }
  .section-title { color: #a855f7; font-size: 20px; margin: 0 0 15px; display: flex; align-items: center; gap: 10px; }
  .section-title span { font-size: 24px; }
  .tactic-box { background: #262626; border-radius: 8px; padding: 20px; text-align: center; }
  .fen-display { font-family: monospace; background: #333; padding: 10px; border-radius: 4px; margin: 15px 0; word-break: break-all; }
  .solution { background: #7c3aed20; border-left: 3px solid #7c3aed; padding: 15px; margin-top: 15px; border-radius: 0 8px 8px 0; }
  .tip-box { background: #059669; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 20px; border-radius: 8px; }
  .affiliate-box { background: #f59e0b20; border: 1px solid #f59e0b40; padding: 20px; border-radius: 8px; }
  .affiliate-box a { color: #f59e0b; text-decoration: none; font-weight: bold; }
  .cta-button { display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 15px; }
  .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  .footer a { color: #888; }
  ul { padding-left: 20px; }
  li { margin-bottom: 8px; }
</style>
`;

/**
 * Generate weekly chess newsletter using Gemini
 */
export async function generateWeeklyNewsletter(): Promise<NewsletterContent> {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are a chess coach creating an engaging weekly newsletter for club-level players (1200-1800 Elo).

Generate newsletter content with these EXACT sections (output as JSON):

{
  "tacticOfTheWeek": {
    "theme": "Pin/Fork/Skewer/Discovery/etc",
    "fen": "Valid FEN position where tactic works",
    "hint": "One sentence hint",
    "solution": ["Move 1", "Move 2", "..."],
    "explanation": "Why this works"
  },
  "openingSpotlight": {
    "name": "Opening Name",
    "eco": "ECO code",
    "moves": "1.e4 e5 2.Nf3...",
    "keyIdeas": ["Idea 1", "Idea 2", "Idea 3"],
    "trap": "Common trap or mistake to avoid"
  },
  "strategicTip": {
    "title": "Short catchy title",
    "content": "2-3 sentences of actionable advice"
  },
  "weeklyChallenge": {
    "description": "A chess challenge for the reader to try",
    "goal": "What they should achieve"
  }
}

Requirements:
- Use real, valid chess positions and moves
- Make content educational but fun
- Include at least one chess joke or witty comment
- Target intermediate players looking to improve

Return ONLY valid JSON, no markdown.`;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response.text();

        // Parse the JSON response
        const content = JSON.parse(response.replace(/```json\n?|\n?```/g, ''));

        // Build HTML email
        const html = buildNewsletterHtml(content);
        const plainText = buildPlainText(content);

        return {
            subject: `♟️ Weekly Chess Digest: ${content.tacticOfTheWeek.theme} Tactics & ${content.openingSpotlight.name}`,
            html,
            plainText,
            generatedAt: new Date(),
        };
    } catch (error) {
        console.error('Newsletter generation error:', error);
        // Return fallback content
        return getFallbackNewsletter();
    }
}

/**
 * Generate personalized content based on user's chess DNA
 */
export async function generatePersonalizedTip(
    playerStrengths: string[],
    playerWeaknesses: string[]
): Promise<string> {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `As a chess coach, give one specific, actionable tip for a player with these characteristics:

Strengths: ${playerStrengths.join(', ')}
Weaknesses: ${playerWeaknesses.join(', ')}

Provide:
1. One focused recommendation (2-3 sentences)
2. One specific exercise or drill they can do
3. An encouraging closing line

Keep it concise and motivating.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
}

/**
 * Generate affiliate recommendation based on user level
 */
export async function generateAffiliateRecommendation(
    userLevel: 'beginner' | 'intermediate' | 'advanced',
    recentTopics: string[]
): Promise<{ title: string; description: string; type: string }> {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Recommend ONE chess product for a ${userLevel} player who has been studying: ${recentTopics.join(', ')}.

Choose from categories:
- Chess book (specific title)
- Chess course (topic area)
- Chess equipment (board, clock, etc.)
- Chess software

Return JSON:
{
  "title": "Product name",
  "description": "Why this helps them (2 sentences)",
  "type": "book|course|equipment|software"
}

Return ONLY JSON.`;

    try {
        const result = await model.generateContent(prompt);
        return JSON.parse(result.response.text().replace(/```json\n?|\n?```/g, ''));
    } catch {
        return {
            title: "Logical Chess: Move By Move",
            description: "Irving Chernev's classic teaches you to think like a master. Perfect for building intuition.",
            type: "book"
        };
    }
}

/**
 * Build the newsletter HTML
 */
function buildNewsletterHtml(content: Record<string, unknown>): string {
    const tactic = content.tacticOfTheWeek as Record<string, unknown>;
    const opening = content.openingSpotlight as Record<string, unknown>;
    const tip = content.strategicTip as Record<string, unknown>;
    const challenge = content.weeklyChallenge as Record<string, unknown>;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ZeroGambit Weekly Digest</title>
  ${NEWSLETTER_STYLES}
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>♟️ ZeroGambit</h1>
      <p>Your Weekly Chess Digest</p>
    </div>
    
    <div class="content">
      <!-- Tactic of the Week -->
      <div class="section">
        <h2 class="section-title"><span>🎯</span> Tactic of the Week: ${tactic.theme}</h2>
        <div class="tactic-box">
          <p><strong>Find the winning move!</strong></p>
          <div class="fen-display">${tactic.fen}</div>
          <p><em>Hint: ${tactic.hint}</em></p>
          <div class="solution">
            <strong>Solution:</strong> ${(tactic.solution as string[]).join(' ')}
            <p style="margin-top: 10px; margin-bottom: 0;">${tactic.explanation}</p>
          </div>
        </div>
      </div>

      <!-- Opening Spotlight -->
      <div class="section">
        <h2 class="section-title"><span>📚</span> Opening Spotlight: ${opening.name}</h2>
        <p><strong>ECO:</strong> ${opening.eco}</p>
        <p><strong>Moves:</strong> <code>${opening.moves}</code></p>
        <p><strong>Key Ideas:</strong></p>
        <ul>
          ${(opening.keyIdeas as string[]).map(idea => `<li>${idea}</li>`).join('')}
        </ul>
        <p><strong>⚠️ Watch out:</strong> ${opening.trap}</p>
      </div>

      <!-- Strategic Tip -->
      <div class="section">
        <h2 class="section-title"><span>🧠</span> Strategic Tip</h2>
        <div class="tip-box">
          <h3 style="margin-top: 0;">${tip.title}</h3>
          <p style="margin-bottom: 0;">${tip.content}</p>
        </div>
      </div>

      <!-- Weekly Challenge -->
      <div class="section">
        <h2 class="section-title"><span>🏆</span> Weekly Challenge</h2>
        <p>${challenge.description}</p>
        <p><strong>Goal:</strong> ${challenge.goal}</p>
        <a href="https://zerogambit.io/puzzles" class="cta-button">Start Practicing →</a>
      </div>

      <!-- Referral CTA -->
      <div class="section">
        <div class="affiliate-box">
          <h3 style="margin-top: 0;">🎁 Share ZeroGambit, Earn Rewards!</h3>
          <p>Love ZeroGambit? Refer friends and earn <strong>$13.50</strong> for each annual subscription!</p>
          <a href="https://zerogambit.io/referrals">Get Your Referral Link →</a>
        </div>
      </div>
    </div>

    <div class="footer">
      <p>You're receiving this because you subscribed to ZeroGambit updates.</p>
      <p><a href="https://zerogambit.io/settings">Manage preferences</a> | <a href="https://zerogambit.io/unsubscribe">Unsubscribe</a></p>
      <p>© ${new Date().getFullYear()} ZeroGambit. Made with ♟️</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Build plain text version
 */
function buildPlainText(content: Record<string, unknown>): string {
    const tactic = content.tacticOfTheWeek as Record<string, unknown>;
    const opening = content.openingSpotlight as Record<string, unknown>;
    const tip = content.strategicTip as Record<string, unknown>;
    const challenge = content.weeklyChallenge as Record<string, unknown>;

    return `
ZEROGAMBIT WEEKLY DIGEST
========================

🎯 TACTIC OF THE WEEK: ${tactic.theme}
FEN: ${tactic.fen}
Hint: ${tactic.hint}
Solution: ${(tactic.solution as string[]).join(' ')}
${tactic.explanation}

📚 OPENING SPOTLIGHT: ${opening.name}
ECO: ${opening.eco}
Moves: ${opening.moves}
Key Ideas:
${(opening.keyIdeas as string[]).map(idea => `- ${idea}`).join('\n')}
Watch out: ${opening.trap}

🧠 STRATEGIC TIP: ${tip.title}
${tip.content}

🏆 WEEKLY CHALLENGE
${challenge.description}
Goal: ${challenge.goal}

---
Share ZeroGambit and earn $13.50 per referral!
https://zerogambit.io/referrals

Unsubscribe: https://zerogambit.io/unsubscribe
`.trim();
}

/**
 * Fallback newsletter if Gemini fails
 */
function getFallbackNewsletter(): NewsletterContent {
    const fallbackContent = {
        tacticOfTheWeek: {
            theme: "Knight Fork",
            fen: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
            hint: "The queen and bishop eye a weak square",
            solution: ["Qxf7#"],
            explanation: "Scholar's Mate! A classic trap that catches beginners."
        },
        openingSpotlight: {
            name: "Italian Game",
            eco: "C50",
            moves: "1.e4 e5 2.Nf3 Nc6 3.Bc4",
            keyIdeas: [
                "Control the center with pawns",
                "Develop pieces toward the kingside",
                "Castle early for king safety"
            ],
            trap: "Don't fall for the Fried Liver Attack if you play ...Nf6!"
        },
        strategicTip: {
            title: "Activate Your Rooks!",
            content: "Rooks need open files to shine. Look for opportunities to double rooks or place them on files where enemy pawns might open up."
        },
        weeklyChallenge: {
            description: "Solve 5 tactical puzzles rated 1200-1400",
            goal: "Achieve 80% accuracy to level up your tactical vision!"
        }
    };

    return {
        subject: "♟️ Weekly Chess Digest: Knight Fork Tactics & Italian Game",
        html: buildNewsletterHtml(fallbackContent),
        plainText: buildPlainText(fallbackContent),
        generatedAt: new Date(),
    };
}
