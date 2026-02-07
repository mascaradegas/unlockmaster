import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useProgressStore } from '@/stores/progressStore';
import { LESSONS, getModules } from '@/data/lessons';
import { LEVELS, calculateLevel, getXPForNextLevel } from '@unlock2026/shared';
import type { Lesson, Module } from '@unlock2026/shared';

type Filter = 'all' | 'incomplete' | 'complete' | 'favorites' | 'review';

export function Home() {
  const { xp, level, streak, lessonsCompleted, favorites } = useProgressStore();
  const modules = getModules();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const levelInfo = LEVELS[level - 1] || LEVELS[0];
  const nextLevelInfo = getXPForNextLevel(xp);
  const xpProgress = nextLevelInfo ? nextLevelInfo.progress : 100;
  const nextLevelXP = nextLevelInfo ? nextLevelInfo.total : xp;

  const totalLessons = LESSONS.length;
  const completedCount = lessonsCompleted.length;

  return (
    <div className="relative z-10 min-h-screen">
      {/* ═══ APPBAR ═══ */}
      <header className="appbar">
        <div className="appbar-logo">
          <span className="logo-icon">🔓</span>
          <span className="logo-text">UNLOCK 2026</span>
        </div>
        <Link to="/dashboard" className="appbar-level" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="appbar-level-top">
            <span style={{ fontSize: '1.1rem' }}>{levelInfo?.emoji || '🌱'}</span>
            <span className="level-text">Lv.{level}</span>
            <span className="level-name-mini">{levelInfo?.title || 'Iniciante'}</span>
          </div>
          <div className="appbar-level-bar">
            <div className="appbar-level-fill" style={{ width: `${Math.min(xpProgress, 100)}%` }} />
          </div>
          <div className="appbar-level-xp">{xp} / {nextLevelXP} XP</div>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifySelf: 'end' }}>
          <div className="stat-pill streak">
            <span style={{ fontSize: '1.2rem' }}>🔥</span>
            <span className="value">{streak}</span>
            <span className="stat-label">dias</span>
          </div>
          <div className="stat-pill xp">
            <span style={{ fontSize: '1.2rem' }}>⭐</span>
            <span className="value">{xp}</span>
            <span className="stat-label">total</span>
          </div>
        </div>
      </header>

      {/* ═══ MAIN (below appbar) ═══ */}
      <main style={{ paddingTop: 80, position: 'relative', zIndex: 2 }}>
        {/* ═══ HERO ═══ */}
        <section className="hero">
          <div className="hero-badge">
            <span className="dot" />
            <span>{totalLessons} AULAS COMPLETAS</span>
          </div>
          <div className="hero-emoji">🗣️🔓</div>
          <h1 className="hero-title">
            <span className="unlock">UNLOCK</span>
            <span className="year">2 0 2 6</span>
          </h1>
          <p className="hero-subtitle">
            Destrave seu inglês de <strong>sobrevivência</strong>
          </p>

          {/* Daily Drill + Quick Play */}
          <div className="quick-stats">
            <Link to="/daily-drill" className="quick-stat" style={{ textDecoration: 'none', color: 'inherit', borderColor: 'rgba(0,255,136,0.35)', background: 'rgba(0,255,136,0.10)' }}>
              <div className="number">🎯 DAILY DRILL</div>
              <div className="label-bilingual">treino diário</div>
              <div className="label">SESSÃO COMPLETA DE 5 ETAPAS</div>
              <div className="label-time">⏱️ ~15 min</div>
            </Link>
            <Link to={`/game/select/${LESSONS[0]?.id || 'what'}`} className="quick-stat" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="number">⚡ QUICK PLAY</div>
              <div className="label-bilingual">jogar agora</div>
              <div className="label">PULAR DIRETO PRO JOGO</div>
              <div className="label-time">⏱️ ~5 min</div>
            </Link>
          </div>

          {/* Progress summary */}
          <div className="progress-summary">
            <span>📚 <strong>{completedCount}</strong>/{totalLessons} aulas</span>
            <span style={{ opacity: 0.4 }}>•</span>
            <span>🎖️ Level <strong>{level}</strong></span>
            <span style={{ opacity: 0.4 }}>•</span>
            <span>🔥 <strong>{streak}</strong> dias</span>
          </div>
        </section>

        {/* ═══ STREAK ═══ */}
        <StreakSection streak={streak} />

        {/* ═══ SEARCH + FILTERS ═══ */}
        <section className="search-section">
          <div className="search-box">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Buscar aulas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--gray)', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
            )}
          </div>
          <div className="filter-tabs">
            {([['all', '📚 Todas'], ['incomplete', '⏳ Pendentes'], ['complete', '✅ Concluídas'], ['favorites', '⭐ Favoritas'], ['review', '🔄 Revisar']] as [Filter, string][]).map(([key, label]) => (
              <button
                key={key}
                className={`filter-tab ${filter === key ? 'active' : ''}`}
                onClick={() => setFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* ═══ MODULES ═══ */}
        {modules.map((mod) => (
          <ModuleSection
            key={mod.number}
            module={mod}
            completedIds={lessonsCompleted}
            favoriteIds={favorites || []}
            search={search}
            filter={filter}
          />
        ))}

        <div style={{ height: 80 }} />
      </main>
    </div>
  );
}

// ─── Streak ──────────────────────────────────────────────────────────────

function StreakSection({ streak }: { streak: number }) {
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const today = new Date();
  const dayOfWeek = today.getDay();

  return (
    <section style={{ padding: '0 20px' }}>
      <div className="streak-card">
        <div className="streak-header">
          <div className="streak-title">
            <span>🔥</span> {streak} DAY STREAK
            <span style={{ fontSize: '0.7rem', color: 'var(--gray)', fontFamily: 'Inter', fontWeight: 500, marginLeft: 8 }}>dias seguidos</span>
          </div>
        </div>
        <div className="streak-weekdays">
          {days.map((d) => <span key={d}>{d}</span>)}
        </div>
        <div className="streak-calendar">
          {days.map((_, i) => (
            <div key={i} className={`streak-day ${i === dayOfWeek ? 'today' : i < dayOfWeek ? 'active' : ''}`}>
              {today.getDate() - (dayOfWeek - i)}
            </div>
          ))}
        </div>
        <div className="streak-actions">
          <Link to="/dashboard">🏆 Achievements</Link>
          <Link to="/profile">👤 Profile</Link>
          <Link to="/dashboard">📊 Stats</Link>
        </div>
      </div>
    </section>
  );
}

// ─── Module Section ──────────────────────────────────────────────────────

function ModuleSection({ module: mod, completedIds, favoriteIds, search, filter }: {
  module: Module;
  completedIds: string[];
  favoriteIds: string[];
  search: string;
  filter: Filter;
}) {
  const filteredLessons = useMemo(() => {
    let lessons = mod.lessons;
    if (search) {
      const q = search.toLowerCase();
      lessons = lessons.filter((l) =>
        l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q)
      );
    }
    switch (filter) {
      case 'complete': lessons = lessons.filter((l) => completedIds.includes(l.id)); break;
      case 'incomplete': lessons = lessons.filter((l) => !completedIds.includes(l.id)); break;
      case 'favorites': lessons = lessons.filter((l) => favoriteIds.includes(l.id)); break;
      default: break;
    }
    return lessons;
  }, [mod.lessons, search, filter, completedIds, favoriteIds]);

  if (filteredLessons.length === 0) return null;

  const completed = mod.lessons.filter((l) => completedIds.includes(l.id)).length;
  const total = mod.lessons.length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <section className="module-section">
      <div className="module-header">
        <span className="module-number">MÓDULO {mod.number}</span>
        <span className="module-title">{mod.name}</span>
        <div className="module-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${percent}%` }} />
          </div>
          <span className="progress-text">{percent}%</span>
        </div>
      </div>
      <div className="lessons-grid">
        {filteredLessons.map((lesson) => (
          <LessonCard key={lesson.id} lesson={lesson} isComplete={completedIds.includes(lesson.id)} />
        ))}
      </div>
    </section>
  );
}

// ─── Lesson Card ─────────────────────────────────────────────────────────

function LessonCard({ lesson, isComplete }: { lesson: Lesson; isComplete: boolean }) {
  return (
    <Link
      to={`/lesson/${lesson.id}`}
      className={`lesson-card ${isComplete ? 'done' : ''}`}
    >
      <div className={`status ${isComplete ? 'done' : ''}`} />
      <span className="emoji">{lesson.emoji}</span>
      <div className="title">{lesson.title}</div>
      <div className="desc">{lesson.description}</div>

      {/* Hover overlay */}
      <div className="options-overlay">
        <span className="overlay-btn review" onClick={(e) => { e.preventDefault(); window.location.href = `/lesson/${lesson.id}`; }}>
          📖 REVISAR
        </span>
        <span className="overlay-btn play" onClick={(e) => { e.preventDefault(); window.location.href = `/game/word-drop/${lesson.id}`; }}>
          🎮 JOGAR
        </span>
      </div>
    </Link>
  );
}
