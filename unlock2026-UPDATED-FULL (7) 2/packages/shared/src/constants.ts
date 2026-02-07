import type { LevelInfo, AchievementDef, MasteryInfo, MasteryLevel } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// XP Values
// ═══════════════════════════════════════════════════════════════════════════

export const XP = {
  LESSON_COMPLETE: 100,
  LESSON_SLIDE_VIEW: 2,
  GAME_COMPLETE: 50,
  GAME_PERFECT: 100,
  WORD_CORRECT: 5,
  STREAK_BONUS: 25,
  ACHIEVEMENT_UNLOCK: 50,
  REVIEW_COMPLETE: 30,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// Levels
// ═══════════════════════════════════════════════════════════════════════════

export const LEVELS: LevelInfo[] = [
  { level: 1, xp: 0, title: 'Iniciante', emoji: '🌱' },
  { level: 2, xp: 200, title: 'Aprendiz', emoji: '📚' },
  { level: 3, xp: 500, title: 'Estudante', emoji: '✏️' },
  { level: 4, xp: 1000, title: 'Dedicado', emoji: '💪' },
  { level: 5, xp: 2000, title: 'Avançado', emoji: '🚀' },
  { level: 6, xp: 3500, title: 'Fluente', emoji: '🗣️' },
  { level: 7, xp: 5000, title: 'Expert', emoji: '🎯' },
  { level: 8, xp: 7500, title: 'Mestre', emoji: '👑' },
  { level: 9, xp: 10000, title: 'Lenda', emoji: '🏆' },
  { level: 10, xp: 15000, title: 'Desbloqueado', emoji: '🔓' },
  { level: 11, xp: 20000, title: 'Imortal', emoji: '⭐' },
  { level: 12, xp: 30000, title: 'Divino', emoji: '👼' },
  { level: 13, xp: 50000, title: 'Transcendente', emoji: '🌟' },
];

// ═══════════════════════════════════════════════════════════════════════════
// Spaced Repetition
// ═══════════════════════════════════════════════════════════════════════════

export const SRS_INTERVALS = [1, 3, 7, 14, 30, 90] as const;

// ═══════════════════════════════════════════════════════════════════════════
// Mastery Thresholds
// ═══════════════════════════════════════════════════════════════════════════

export const MASTERY_THRESHOLDS = {
  WEAK: 50,
  LEARNING: 75,
  STRONG: 90,
  MASTERED: 90,
} as const;

export const SLOW_RESPONSE_MS = 5000;

export function getMasteryLevel(mastery: number): MasteryInfo {
  if (mastery >= MASTERY_THRESHOLDS.MASTERED) return { level: 'mastered', label: 'Dominada', color: '#00FF88' };
  if (mastery >= MASTERY_THRESHOLDS.STRONG) return { level: 'strong', label: 'Forte', color: '#88FF00' };
  if (mastery >= MASTERY_THRESHOLDS.LEARNING) return { level: 'learning', label: 'Aprendendo', color: '#FFD700' };
  if (mastery >= MASTERY_THRESHOLDS.WEAK) return { level: 'weak', label: 'Fraca', color: '#FF8C00' };
  return { level: 'critical', label: 'Crítica', color: '#FF4444' };
}

export function calculateLevel(xp: number): number {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xp) return LEVELS[i].level;
  }
  return 1;
}

export function getLevelInfo(level: number): LevelInfo {
  return LEVELS.find((l) => l.level === level) ?? LEVELS[0];
}

export function getXPForNextLevel(currentXP: number) {
  const currentLevel = calculateLevel(currentXP);
  const nextLevel = LEVELS.find((l) => l.level === currentLevel + 1);
  if (!nextLevel) return null;
  const currentLevelInfo = getLevelInfo(currentLevel);
  return {
    needed: nextLevel.xp - currentXP,
    total: nextLevel.xp,
    xpInLevel: currentXP - currentLevelInfo.xp,
    xpRequired: nextLevel.xp - currentLevelInfo.xp,
    progress: Math.round(((currentXP - currentLevelInfo.xp) / (nextLevel.xp - currentLevelInfo.xp)) * 100),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Achievements
// ═══════════════════════════════════════════════════════════════════════════

export const ACHIEVEMENTS: Record<string, AchievementDef> = {
  // First steps
  first_lesson: { id: 'first_lesson', title: 'Primeiro Passo', desc: 'Complete sua primeira aula', emoji: '👣', xp: 50 },
  first_game: { id: 'first_game', title: 'Jogador', desc: 'Complete seu primeiro jogo', emoji: '🎮', xp: 50 },
  first_perfect: { id: 'first_perfect', title: 'Perfeição', desc: 'Acerte 100% em uma atividade', emoji: '💯', xp: 100 },
  first_review: { id: 'first_review', title: 'Revisor', desc: 'Complete sua primeira revisão', emoji: '🔄', xp: 50 },

  // Streak
  streak_3: { id: 'streak_3', title: 'Consistente', desc: '3 dias seguidos', emoji: '🔥', xp: 75 },
  streak_7: { id: 'streak_7', title: 'Dedicação', desc: '7 dias seguidos', emoji: '🔥', xp: 150 },
  streak_14: { id: 'streak_14', title: 'Disciplinado', desc: '14 dias seguidos', emoji: '🔥', xp: 250 },
  streak_30: { id: 'streak_30', title: 'Imparável', desc: '30 dias seguidos', emoji: '🔥', xp: 500 },

  // Lessons
  lessons_10: { id: 'lessons_10', title: 'Estudioso', desc: 'Complete 10 aulas', emoji: '📖', xp: 100 },
  lessons_25: { id: 'lessons_25', title: 'Aplicado', desc: 'Complete 25 aulas', emoji: '📚', xp: 200 },
  lessons_50: { id: 'lessons_50', title: 'Scholar', desc: 'Complete 50 aulas', emoji: '🎓', xp: 400 },
  lessons_100: { id: 'lessons_100', title: 'Graduado', desc: 'Complete 100 aulas', emoji: '🏅', xp: 1000 },

  // Words mastered
  words_25: { id: 'words_25', title: 'Vocabulário', desc: 'Domine 25 palavras', emoji: '💬', xp: 100 },
  words_100: { id: 'words_100', title: 'Linguista', desc: 'Domine 100 palavras', emoji: '📝', xp: 300 },
  words_250: { id: 'words_250', title: 'Poliglota', desc: 'Domine 250 palavras', emoji: '🌍', xp: 600 },
  words_500: { id: 'words_500', title: 'Dicionário Vivo', desc: 'Domine 500 palavras', emoji: '📚', xp: 1500 },

  // XP milestones
  xp_1000: { id: 'xp_1000', title: 'Mil XP', desc: 'Acumule 1.000 XP', emoji: '⚡', xp: 0 },
  xp_5000: { id: 'xp_5000', title: '5K XP', desc: 'Acumule 5.000 XP', emoji: '⚡', xp: 0 },
  xp_10000: { id: 'xp_10000', title: '10K XP', desc: 'Acumule 10.000 XP', emoji: '⚡', xp: 0 },

  // Special
  night_owl: { id: 'night_owl', title: 'Coruja', desc: 'Estude depois da meia-noite', emoji: '🦉', xp: 50 },
  early_bird: { id: 'early_bird', title: 'Madrugador', desc: 'Estude antes das 6h', emoji: '🐦', xp: 50 },
  weekend_warrior: { id: 'weekend_warrior', title: 'Guerreiro', desc: 'Estude sábado e domingo', emoji: '⚔️', xp: 75 },
  speed_demon: { id: 'speed_demon', title: 'Veloz', desc: 'Complete um jogo em menos de 1 minuto', emoji: '💨', xp: 100 },
  combo_master: { id: 'combo_master', title: 'Combo Master', desc: 'Alcance 15 de combo', emoji: '🎯', xp: 150 },
};

// ═══════════════════════════════════════════════════════════════════════════
// Module Names
// ═══════════════════════════════════════════════════════════════════════════

export const MODULE_NAMES: Record<number, string> = {
  1: '📘 Perguntas Básicas (WH-)',
  2: '📗 Estruturas Básicas',
  3: '📙 Verbos Essenciais',
  4: '📕 Tempo Passado',
  5: '📓 Pronomes, Posse e Artigos',
  6: '📔 Preposições e Conectores',
  7: '📒 Comandos, Direções e Ação',
  8: '📚 Situações Reais (Sobrevivência)',
};

// ═══════════════════════════════════════════════════════════════════════════
// Design Tokens (match your CSS variables)
// ═══════════════════════════════════════════════════════════════════════════

export const COLORS = {
  bg: '#0a1628',
  bgCard: 'rgba(15, 30, 55, 0.95)',
  gold: '#FFD700',
  green: '#00FF88',
  orange: '#FF8C00',
  purple: '#9B6DFF',
  red: '#FF4444',
  cyan: '#00BFFF',
  white: '#E8E8E8',
  gray: '#8899aa',
} as const;
