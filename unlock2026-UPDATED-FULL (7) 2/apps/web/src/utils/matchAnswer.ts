/**
 * Smart Answer Matching for UNLOCK 2026
 * 
 * Handles: multiple valid answers (split by /), contractions,
 * punctuation, typo tolerance, and common equivalences.
 */

// ─── Strip HTML tags from vocabulary en field ──────────────────────
export function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '');
}

// ─── Normalize: lowercase, trim, remove punctuation ───────────────
function norm(s: string): string {
  return stripHtml(s)
    .toLowerCase()
    .trim()
    .replace(/[?.!,;:'"…\-–—()]/g, '')   // remove punctuation
    .replace(/\s+/g, ' ');                 // collapse whitespace
}

// ─── Expand contractions to allow both forms ──────────────────────
const CONTRACTIONS: [string, string][] = [
  ["what's", "what is"],
  ["where's", "where is"],
  ["who's", "who is"],
  ["how's", "how is"],
  ["it's", "it is"],
  ["that's", "that is"],
  ["there's", "there is"],
  ["here's", "here is"],
  ["he's", "he is"],
  ["she's", "she is"],
  ["i'm", "i am"],
  ["you're", "you are"],
  ["we're", "we are"],
  ["they're", "they are"],
  ["i've", "i have"],
  ["you've", "you have"],
  ["we've", "we have"],
  ["they've", "they have"],
  ["i'll", "i will"],
  ["you'll", "you will"],
  ["he'll", "he will"],
  ["she'll", "she will"],
  ["we'll", "we will"],
  ["they'll", "they will"],
  ["i'd", "i would"],
  ["you'd", "you would"],
  ["he'd", "he would"],
  ["she'd", "she would"],
  ["we'd", "we would"],
  ["they'd", "they would"],
  ["isn't", "is not"],
  ["aren't", "are not"],
  ["wasn't", "was not"],
  ["weren't", "were not"],
  ["don't", "do not"],
  ["doesn't", "does not"],
  ["didn't", "did not"],
  ["won't", "will not"],
  ["wouldn't", "would not"],
  ["can't", "cannot"],
  ["couldn't", "could not"],
  ["shouldn't", "should not"],
  ["haven't", "have not"],
  ["hasn't", "has not"],
  ["let's", "let us"],
];

function expandContractions(s: string): string {
  let result = s.toLowerCase();
  for (const [short, long] of CONTRACTIONS) {
    result = result.replace(new RegExp(short.replace("'", "[''']"), 'gi'), long);
  }
  return result;
}

// ─── Levenshtein distance ─────────────────────────────────────────
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

// ─── Main matching function ───────────────────────────────────────
export interface MatchResult {
  isCorrect: boolean;
  matchedAnswer: string;  // which valid answer it matched
  matchType: 'exact' | 'normalized' | 'contraction' | 'typo' | 'none';
}

/**
 * Check if userAnswer matches any valid answer in correctEn.
 * correctEn can contain multiple answers separated by " / ".
 * 
 * Match priority:
 * 1. Exact normalized match
 * 2. Contraction-expanded match (what's = what is)
 * 3. Typo tolerance (levenshtein ≤ 2 for long phrases, ≤ 1 for short)
 */
export function matchAnswer(userAnswer: string, correctEn: string): MatchResult {
  const userNorm = norm(userAnswer);
  const userExpanded = norm(expandContractions(userAnswer));

  // Split multiple valid answers by /
  const validAnswers = correctEn.split(/\s*\/\s*/);

  for (const valid of validAnswers) {
    const validNorm = norm(valid);
    const validExpanded = norm(expandContractions(valid));

    // 1. Exact normalized match
    if (userNorm === validNorm) {
      return { isCorrect: true, matchedAnswer: valid, matchType: 'exact' };
    }

    // 2. Contraction-expanded match
    if (userExpanded === validExpanded || userExpanded === validNorm || userNorm === validExpanded) {
      return { isCorrect: true, matchedAnswer: valid, matchType: 'contraction' };
    }
  }

  // 3. Typo tolerance (check against all valid answers)
  for (const valid of validAnswers) {
    const validNorm = norm(valid);
    const validExpanded = norm(expandContractions(valid));
    
    // Allow bigger tolerance for longer phrases
    const maxDist = validNorm.length > 15 ? 2 : 1;

    if (levenshtein(userNorm, validNorm) <= maxDist) {
      return { isCorrect: true, matchedAnswer: valid, matchType: 'typo' };
    }
    if (levenshtein(userExpanded, validExpanded) <= maxDist) {
      return { isCorrect: true, matchedAnswer: valid, matchType: 'typo' };
    }
  }

  return { isCorrect: false, matchedAnswer: validAnswers[0], matchType: 'none' };
}

/**
 * Simple boolean check — most games just need true/false
 */
export function isAnswerCorrect(userAnswer: string, correctEn: string): boolean {
  return matchAnswer(userAnswer, correctEn).isCorrect;
}

/**
 * Get the "display" version of en (first answer, no HTML)
 */
export function getDisplayAnswer(en: string): string {
  return stripHtml(en.split(/\s*\/\s*/)[0]);
}
