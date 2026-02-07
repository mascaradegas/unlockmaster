// ═══════════════════════════════════════════════════════════════════════════
// UNLOCK 2026 — Shared Types
// ═══════════════════════════════════════════════════════════════════════════

// ─── Lessons ─────────────────────────────────────────────────────────────

export interface VocabularyItem {
  emoji: string;
  pt: string;
  en: string;
  level?: number;
}

export type SlideType =
  | 'title'
  | 'situation'
  | 'rule'
  | 'tip'
  | 'example'
  | 'examples'
  | 'comparison'
  | 'quiz'
  | 'fill-blank'
  | 'list'
  | 'end';

export interface SlideBase {
  type: SlideType;
  cardClass?: string;
}

export interface TitleSlide extends SlideBase {
  type: 'title';
  emoji: string;
  title: string;
  subtitle: string;
}

export interface SituationSlide extends SlideBase {
  type: 'situation';
  emoji: string;
  text: string;
}

export interface RuleSlide extends SlideBase {
  type: 'rule';
  text: string;
  keyword: string;
  keywordAfter?: string;
}

export interface TipSlide extends SlideBase {
  type: 'tip';
  icon: string;
  title: string;
  text: string;
}

export interface ExampleSlide extends SlideBase {
  type: 'example';
  emoji: string;
  question: string;
  questionTr: string;
  answer: string;
  answerTr: string;
}

export interface ExamplesSlide extends SlideBase {
  type: 'examples';
  title: string;
  items: Array<{
    emoji: string;
    en: string;
    pt: string;
  }>;
}

export interface ComparisonSlide extends SlideBase {
  type: 'comparison';
  title: string;
  leftClass: string;
  rightClass: string;
  leftIcon: string;
  rightIcon: string;
  leftLabel: string;
  rightLabel: string;
  left: string;
  leftNote: string;
  right: string;
  rightNote: string;
  explanation?: string;
}

export interface QuizSlide extends SlideBase {
  type: 'quiz';
  question: string;
  options: string[];
  correct: number;
}

export interface FillBlankSlide extends SlideBase {
  type: 'fill-blank';
  prompt: string;
  sentence: string;
  correctWord: string;
}

export interface ListSlide extends SlideBase {
  type: 'list';
  title: string;
  items: Array<{
    emoji: string;
    text: string;
  }>;
}

export interface EndSlide extends SlideBase {
  type: 'end';
}

export type Slide =
  | TitleSlide
  | SituationSlide
  | RuleSlide
  | TipSlide
  | ExampleSlide
  | ExamplesSlide
  | ComparisonSlide
  | QuizSlide
  | FillBlankSlide
  | ListSlide
  | EndSlide;

export interface Lesson {
  id: string;
  title: string;
  emoji: string;
  description: string;
  module: number;
  order: number;
  slides: Slide[];
  vocabulary: VocabularyItem[];
}

export interface Module {
  number: number;
  name: string;
  lessons: Lesson[];
}

// ─── Progress & Tracking (Unified) ──────────────────────────────────────

export interface WordStats {
  en: string;
  pt: string;
  emoji: string;
  lessonId: string | null;
  lessonTitle?: string;
  lessonOrder?: number;
  module?: number;
  lastLessonId?: string;
  lastLessonTitle?: string;
  attempts: number;
  correct: number;
  totalResponseMs: number;
  srsLevel: number;
  nextReview: string; // ISO date
  lastSeen: string | null;
  lastCorrect: string | null;
  history: WordAttempt[];
}

export interface WordAttempt {
  date: string;
  correct: boolean;
  context: string;
  responseTime: number;
  late?: boolean;
}

export interface GameResult {
  lessonId: string;
  mode: GameMode;
  score: number;
  maxScore: number;
  percent: number;
  date: string;
}

export type GameMode = 'word-drop' | 'word-match' | 'word-stack';

export type SessionType =
  | 'lesson'
  | 'homework'
  | 'word-drop'
  | 'word-match'
  | 'word-stack'
  | 'review'
  | 'warmup'
  | 'boss';

export interface StudySession {
  date: string;
  type: SessionType;
  lessonId: string | null;
  score: number;
  accuracy: number;
  duration: number; // seconds
  wordsAttempted: number;
  avgResponseTimeMs?: number;
  questionBreakdown?: Array<{
    en: string;
    pt: string;
    correct: boolean;
    responseTime: number;
  }>;
}

export interface SessionFlow {
  lessonId: string;
  sessions: Record<
    string,
    {
      warmup: boolean;
      lesson: boolean;
      homework: boolean;
      review: boolean;
      boss: boolean;
    }
  >;
  currentLessonId: string;
  updatedAt: string;
}

export type MasteryLevel = 'critical' | 'weak' | 'learning' | 'strong' | 'mastered';

export interface MasteryInfo {
  level: MasteryLevel;
  label: string;
  color: string;
}

export interface LevelInfo {
  level: number;
  xp: number;
  title: string;
  emoji: string;
}

export interface AchievementDef {
  id: string;
  title: string;
  desc: string;
  emoji: string;
  xp: number;
}

export type Plan = 'FREE' | 'BASIC' | 'VIP';

// ─── User Profile (unified from progress.js + tracking.js) ─────────────

export interface UserProgress {
  // Identity
  id: string;
  name: string;
  avatar: string;
  plan: Plan;

  // XP & Level
  xp: number;
  level: number;

  // Streak
  streak: number;
  longestStreak: number;
  lastActiveDate: string | null;

  // Lessons
  lessonsCompleted: string[];
  lessonsInProgress: Record<string, number>; // lessonId → slideIndex
  favorites: string[];

  // Games
  gamesCompleted: GameResult[];
  gamesBestScores: Record<string, number>; // "lessonId_mode" → best score

  // Words
  wordStats: Record<string, WordStats>; // wordId → stats

  // Achievements
  achievements: string[]; // achievement IDs

  // Sessions
  sessions: StudySession[];

  // Analytics
  totalTimeSpent: number; // seconds
  sessionsCount: number;

  // Onboarding
  onboardingComplete: boolean;
  tutorialsSeen: string[];

  // Settings
  settings: {
    dailyGoal: number;
    notifications: boolean;
    soundEffects: boolean;
  };

  // Sync
  createdAt: string;
  updatedAt: string;
  lastSynced: string | null;
  pendingSync: boolean;
}
