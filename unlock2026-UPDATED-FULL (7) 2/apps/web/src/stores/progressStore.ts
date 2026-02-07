import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  UserProgress,
  WordStats,
  WordAttempt,
  GameResult,
  GameMode,
  StudySession,
  SessionType,
} from '@unlock2026/shared';
import {
  XP,
  LEVELS,
  SRS_INTERVALS,
  ACHIEVEMENTS,
  MASTERY_THRESHOLDS,
  SLOW_RESPONSE_MS,
  calculateLevel,
  getLevelInfo,
  getMasteryLevel,
} from '@unlock2026/shared';

// ═══════════════════════════════════════════════════════════════════════════
// Helper: generate word ID (matches tracking.js logic)
// ═══════════════════════════════════════════════════════════════════════════

function getWordId(en: string, pt: string): string {
  return (en + '-' + pt)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
}

function getWordMastery(word: WordStats): number {
  if (!word || word.attempts === 0) return 0;

  let mastery = (word.correct / word.attempts) * 100;

  // Penalize slow responses
  const avgTime = word.totalResponseMs / word.attempts;
  if (avgTime > SLOW_RESPONSE_MS) mastery *= 0.9;

  // Penalize lack of recent practice
  if (word.lastSeen) {
    const daysSince = (Date.now() - new Date(word.lastSeen).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince > 30) mastery *= 0.8;
    else if (daysSince > 14) mastery *= 0.9;
  }

  return Math.round(Math.max(0, Math.min(100, mastery)));
}

// ═══════════════════════════════════════════════════════════════════════════
// Default Progress
// ═══════════════════════════════════════════════════════════════════════════

function createDefaultProgress(): UserProgress {
  return {
    id: 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11),
    name: '',
    avatar: '🧑‍🎓',
    plan: 'FREE',
    xp: 0,
    level: 1,
    streak: 0,
    longestStreak: 0,
    lastActiveDate: null,
    lessonsCompleted: [],
    lessonsInProgress: {},
    favorites: [],
    gamesCompleted: [],
    gamesBestScores: {},
    wordStats: {},
    achievements: [],
    sessions: [],
    totalTimeSpent: 0,
    sessionsCount: 0,
    onboardingComplete: false,
    tutorialsSeen: [],
    settings: {
      dailyGoal: 10,
      notifications: true,
      soundEffects: true,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastSynced: null,
    pendingSync: false,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Store Interface
// ═══════════════════════════════════════════════════════════════════════════

interface ProgressActions {
  // XP
  addXP: (amount: number) => { xp: number; level: number; leveledUp: boolean };

  // Streak
  updateStreak: () => { streak: number; isNew: boolean };

  // Lessons
  saveSlideProgress: (lessonId: string, slideIndex: number) => void;
  getSlideProgress: (lessonId: string) => number;
  completeLesson: (lessonId: string) => boolean;
  isLessonComplete: (lessonId: string) => boolean;
  toggleFavorite: (lessonId: string) => boolean;

  // Games
  completeGame: (
    lessonId: string,
    mode: GameMode,
    score: number,
    maxScore: number,
  ) => { percent: number; isPerfect: boolean; isNewBest: boolean };
  getBestScore: (lessonId: string, mode: GameMode) => number;

  // Words
  trackWord: (params: {
    en: string;
    pt: string;
    emoji?: string;
    correct: boolean;
    responseTime: number;
    context: string;
    lessonId?: string;
    lessonTitle?: string;
    lessonOrder?: number;
    module?: number;
    late?: boolean;
  }) => WordStats;
  getWordsForReview: () => (WordStats & { mastery: number })[];
  getWeakWords: (limit?: number) => (WordStats & { mastery: number; errorRate: number })[];
  getAllWords: () => (WordStats & { mastery: number })[];
  getWordCounts: () => {
    total: number;
    critical: number;
    weak: number;
    learning: number;
    strong: number;
    mastered: number;
    forReview: number;
  };

  // Sessions
  logSession: (params: {
    type: SessionType;
    lessonId?: string;
    score?: number;
    accuracy?: number;
    duration?: number;
    wordsAttempted?: number;
  }) => void;

  // Achievements
  unlockAchievement: (achievementId: string) => boolean;
  checkAchievements: () => string[]; // returns newly unlocked IDs
  getAchievements: () => Array<{ id: string; title: string; desc: string; emoji: string; xp: number; unlocked: boolean }>;

  // Onboarding
  markTutorialSeen: (id: string) => void;
  hasTutorialSeen: (id: string) => boolean;
  completeOnboarding: () => void;

  // Sync preparation
  markPendingSync: () => void;
  exportForSync: () => UserProgress & { exportedAt: string; version: string };
  importFromSync: (data: UserProgress) => void;

  // Reset
  reset: () => void;
}

type ProgressStore = UserProgress & ProgressActions;

// ═══════════════════════════════════════════════════════════════════════════
// Store
// ═══════════════════════════════════════════════════════════════════════════

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set, get) => ({
      ...createDefaultProgress(),

      // ─── XP ──────────────────────────────────────────────────────

      addXP(amount: number) {
        const state = get();
        const newXP = state.xp + amount;
        const oldLevel = state.level;
        const newLevel = calculateLevel(newXP);
        const leveledUp = newLevel > oldLevel;

        set({
          xp: newXP,
          level: newLevel,
          updatedAt: new Date().toISOString(),
          pendingSync: true,
        });

        return { xp: newXP, level: newLevel, leveledUp };
      },

      // ─── Streak ──────────────────────────────────────────────────

      updateStreak() {
        const state = get();
        const today = new Date().toISOString().split('T')[0];
        const lastActive = state.lastActiveDate?.split('T')[0] ?? null;

        if (lastActive === today) {
          return { streak: state.streak, isNew: false };
        }

        let newStreak: number;
        if (!lastActive) {
          newStreak = 1;
        } else {
          const lastDate = new Date(lastActive);
          const todayDate = new Date(today);
          const diffDays = Math.floor(
            (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
          );
          newStreak = diffDays === 1 ? state.streak + 1 : 1;
        }

        set({
          streak: newStreak,
          longestStreak: Math.max(newStreak, state.longestStreak),
          lastActiveDate: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          pendingSync: true,
        });

        // Streak bonus XP
        get().addXP(XP.STREAK_BONUS * Math.min(newStreak, 10));

        return { streak: newStreak, isNew: true };
      },

      // ─── Lessons ─────────────────────────────────────────────────

      saveSlideProgress(lessonId, slideIndex) {
        set((s) => ({
          lessonsInProgress: { ...s.lessonsInProgress, [lessonId]: slideIndex },
          updatedAt: new Date().toISOString(),
          pendingSync: true,
        }));
      },

      getSlideProgress(lessonId) {
        return get().lessonsInProgress[lessonId] ?? 0;
      },

      completeLesson(lessonId) {
        const state = get();
        if (state.lessonsCompleted.includes(lessonId)) return false;

        const newCompleted = [...state.lessonsCompleted, lessonId];
        const { [lessonId]: _, ...remainingInProgress } = state.lessonsInProgress;

        set({
          lessonsCompleted: newCompleted,
          lessonsInProgress: remainingInProgress,
          updatedAt: new Date().toISOString(),
          pendingSync: true,
        });

        get().addXP(XP.LESSON_COMPLETE);
        get().updateStreak();
        get().checkAchievements();

        return true;
      },

      isLessonComplete(lessonId) {
        return get().lessonsCompleted.includes(lessonId);
      },

      toggleFavorite(lessonId) {
        const state = get();
        const isFav = state.favorites.includes(lessonId);
        set({
          favorites: isFav
            ? state.favorites.filter((id) => id !== lessonId)
            : [...state.favorites, lessonId],
          updatedAt: new Date().toISOString(),
          pendingSync: true,
        });
        return !isFav;
      },

      // ─── Games ───────────────────────────────────────────────────

      completeGame(lessonId, mode, score, maxScore) {
        const state = get();
        const percent = Math.round((score / maxScore) * 100);
        const isPerfect = percent === 100;
        const key = `${lessonId}_${mode}`;

        const result: GameResult = {
          lessonId,
          mode,
          score,
          maxScore,
          percent,
          date: new Date().toISOString(),
        };

        const prevBest = state.gamesBestScores[key] ?? 0;
        const isNewBest = score > prevBest;

        set({
          gamesCompleted: [...state.gamesCompleted, result],
          gamesBestScores: {
            ...state.gamesBestScores,
            [key]: isNewBest ? score : prevBest,
          },
          updatedAt: new Date().toISOString(),
          pendingSync: true,
        });

        get().addXP(XP.GAME_COMPLETE);
        if (isPerfect) get().addXP(XP.GAME_PERFECT);
        get().updateStreak();
        get().checkAchievements();

        return { percent, isPerfect, isNewBest };
      },

      getBestScore(lessonId, mode) {
        return get().gamesBestScores[`${lessonId}_${mode}`] ?? 0;
      },

      // ─── Words ───────────────────────────────────────────────────

      trackWord(params) {
        const state = get();
        const wordId = getWordId(params.en, params.pt);
        const now = new Date();

        const existing = state.wordStats[wordId];
        const word: WordStats = existing
          ? { ...existing }
          : {
              en: params.en,
              pt: params.pt,
              emoji: params.emoji ?? '📝',
              lessonId: params.lessonId ?? null,
              lessonTitle: params.lessonTitle,
              lessonOrder: params.lessonOrder,
              module: params.module,
              lastLessonId: params.lessonId,
              lastLessonTitle: params.lessonTitle,
              attempts: 0,
              correct: 0,
              totalResponseMs: 0,
              srsLevel: 0,
              nextReview: now.toISOString(),
              lastSeen: null,
              lastCorrect: null,
              history: [],
            };

        // Update metadata
        if (params.lessonId) {
          if (!word.lessonId) word.lessonId = params.lessonId;
          word.lastLessonId = params.lessonId;
        }
        if (params.lessonTitle) {
          if (!word.lessonTitle) word.lessonTitle = params.lessonTitle;
          word.lastLessonTitle = params.lessonTitle;
        }

        // Update stats
        word.attempts++;
        word.lastSeen = now.toISOString();
        word.totalResponseMs += params.responseTime ?? 0;

        if (params.correct) {
          word.correct++;
          word.lastCorrect = now.toISOString();
          word.srsLevel = Math.min(word.srsLevel + 1, SRS_INTERVALS.length - 1);
        } else {
          word.srsLevel = Math.max(0, word.srsLevel - 2);
        }

        // Calculate next review
        const daysUntil = SRS_INTERVALS[word.srsLevel];
        const nextReview = new Date(now);
        nextReview.setDate(nextReview.getDate() + daysUntil);
        word.nextReview = nextReview.toISOString();

        // History (keep last 50)
        word.history = [
          {
            date: now.toISOString(),
            correct: params.correct,
            context: params.context,
            responseTime: params.responseTime,
            late: params.late,
          },
          ...word.history,
        ].slice(0, 50);

        set((s) => ({
          wordStats: { ...s.wordStats, [wordId]: word },
          updatedAt: new Date().toISOString(),
          pendingSync: true,
        }));

        if (params.correct) get().addXP(XP.WORD_CORRECT);

        return word;
      },

      getAllWords() {
        const words = Object.values(get().wordStats);
        return words
          .map((w) => ({ ...w, mastery: getWordMastery(w) }))
          .sort((a, b) => a.mastery - b.mastery);
      },

      getWordsForReview() {
        const now = new Date();
        return Object.values(get().wordStats)
          .filter((w) => new Date(w.nextReview) <= now)
          .map((w) => ({ ...w, mastery: getWordMastery(w) }))
          .sort((a, b) => a.mastery - b.mastery);
      },

      getWeakWords(limit = 10) {
        return Object.values(get().wordStats)
          .filter((w) => w.attempts >= 1)
          .map((w) => {
            const errorRate = 1 - w.correct / w.attempts;
            return { ...w, errorRate, mastery: getWordMastery(w) };
          })
          .filter((w) => w.errorRate > 0.2)
          .sort((a, b) => b.errorRate - a.errorRate)
          .slice(0, limit);
      },

      getWordCounts() {
        const words = get().getAllWords();
        const forReview = get().getWordsForReview();
        return {
          total: words.length,
          critical: words.filter((w) => w.mastery < MASTERY_THRESHOLDS.WEAK).length,
          weak: words.filter(
            (w) => w.mastery >= MASTERY_THRESHOLDS.WEAK && w.mastery < MASTERY_THRESHOLDS.LEARNING,
          ).length,
          learning: words.filter(
            (w) => w.mastery >= MASTERY_THRESHOLDS.LEARNING && w.mastery < MASTERY_THRESHOLDS.STRONG,
          ).length,
          strong: words.filter(
            (w) => w.mastery >= MASTERY_THRESHOLDS.STRONG && w.mastery < MASTERY_THRESHOLDS.MASTERED,
          ).length,
          mastered: words.filter((w) => w.mastery >= MASTERY_THRESHOLDS.MASTERED).length,
          forReview: forReview.length,
        };
      },

      // ─── Sessions ────────────────────────────────────────────────

      logSession(params) {
        const session: StudySession = {
          date: new Date().toISOString(),
          type: params.type,
          lessonId: params.lessonId ?? null,
          score: params.score ?? 0,
          accuracy: params.accuracy ?? 0,
          duration: params.duration ?? 0,
          wordsAttempted: params.wordsAttempted ?? 0,
        };

        set((s) => ({
          sessions: [session, ...s.sessions].slice(0, 100),
          sessionsCount: s.sessionsCount + 1,
          totalTimeSpent: s.totalTimeSpent + (params.duration ?? 0),
          updatedAt: new Date().toISOString(),
          pendingSync: true,
        }));
      },

      // ─── Achievements ────────────────────────────────────────────

      unlockAchievement(achievementId) {
        const state = get();
        if (state.achievements.includes(achievementId)) return false;
        if (!ACHIEVEMENTS[achievementId]) return false;

        set({
          achievements: [...state.achievements, achievementId],
          updatedAt: new Date().toISOString(),
          pendingSync: true,
        });

        const ach = ACHIEVEMENTS[achievementId];
        if (ach.xp > 0) get().addXP(ach.xp);
        return true;
      },

      checkAchievements() {
        const state = get();
        const unlocked: string[] = [];
        const wordCounts = get().getWordCounts();

        const check = (id: string, condition: boolean) => {
          if (!state.achievements.includes(id) && condition) {
            get().unlockAchievement(id);
            unlocked.push(id);
          }
        };

        // First steps
        check('first_lesson', state.lessonsCompleted.length >= 1);
        check('first_game', state.gamesCompleted.length >= 1);
        check('first_perfect', state.gamesCompleted.some((g) => g.percent === 100));

        // Streak
        check('streak_3', state.streak >= 3);
        check('streak_7', state.streak >= 7);
        check('streak_14', state.streak >= 14);
        check('streak_30', state.streak >= 30);

        // Lessons
        check('lessons_10', state.lessonsCompleted.length >= 10);
        check('lessons_25', state.lessonsCompleted.length >= 25);
        check('lessons_50', state.lessonsCompleted.length >= 50);
        check('lessons_100', state.lessonsCompleted.length >= 100);

        // Words
        check('words_25', wordCounts.mastered >= 25);
        check('words_100', wordCounts.mastered >= 100);
        check('words_250', wordCounts.mastered >= 250);
        check('words_500', wordCounts.mastered >= 500);

        // XP
        check('xp_1000', state.xp >= 1000);
        check('xp_5000', state.xp >= 5000);
        check('xp_10000', state.xp >= 10000);

        // Special
        const hour = new Date().getHours();
        check('night_owl', hour >= 0 && hour < 5);
        check('early_bird', hour >= 5 && hour < 6);

        return unlocked;
      },

      getAchievements() {
        const state = get();
        return Object.values(ACHIEVEMENTS).map((a) => ({
          ...a,
          unlocked: state.achievements.includes(a.id),
        }));
      },

      // ─── Onboarding ──────────────────────────────────────────────

      markTutorialSeen(id) {
        set((s) => ({
          tutorialsSeen: s.tutorialsSeen.includes(id) ? s.tutorialsSeen : [...s.tutorialsSeen, id],
        }));
      },

      hasTutorialSeen(id) {
        return get().tutorialsSeen.includes(id);
      },

      completeOnboarding() {
        set({ onboardingComplete: true });
      },

      // ─── Sync ────────────────────────────────────────────────────

      markPendingSync() {
        set({ pendingSync: true });
      },

      exportForSync() {
        const state = get();
        return {
          ...state,
          exportedAt: new Date().toISOString(),
          version: '1.0',
        } as UserProgress & { exportedAt: string; version: string };
      },

      importFromSync(data) {
        set({
          ...data,
          lastSynced: new Date().toISOString(),
          pendingSync: false,
        });
      },

      // ─── Reset ───────────────────────────────────────────────────

      reset() {
        set(createDefaultProgress());
      },
    }),
    {
      name: 'unlock2026_progress',
      version: 1,
    },
  ),
);
