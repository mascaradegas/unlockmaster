import { useMemo } from 'react';
import { useProgressStore } from '@/stores/progressStore';
import { Header } from '@/components/layout/Header';
import { getLevelInfo, getXPForNextLevel, MODULE_NAMES } from '@unlock2026/shared';
import { LESSONS, getModules } from '@/data/lessons';

export function Dashboard() {
  const store = useProgressStore();
  const levelInfo = getLevelInfo(store.level);
  const nextLevel = getXPForNextLevel(store.xp);
  const wordCounts = store.getWordCounts();
  const achievements = store.getAchievements();
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  // Module progress
  const modules = useMemo(() => {
    const mods = getModules();
    return mods.map(m => {
      const lessons = LESSONS.filter(l => l.module === m.number);
      const completed = lessons.filter(l => store.lessonsCompleted.includes(l.id)).length;
      const emoji = m.name.match(/^(\p{Emoji})/u)?.[1] ?? '📚';
      return { ...m, emoji, total: lessons.length, completed, pct: lessons.length > 0 ? Math.round((completed / lessons.length) * 100) : 0 };
    });
  }, [store.lessonsCompleted]);

  // Recent sessions (last 5)
  const recentSessions = useMemo(() => store.sessions.slice(-5).reverse(), [store.sessions]);

  return (
    <div className="relative z-10 min-h-screen pb-20">
      <Header title="📊 Dashboard" backTo="/" />

      <div className="max-w-4xl mx-auto px-5 space-y-6">
        {/* Level Card */}
        <div className="unlock-card unlock-card-gold p-6 text-center">
          <div className="text-4xl mb-2">{levelInfo.emoji}</div>
          <h2 className="font-title text-xl text-unlock-gold">{levelInfo.title}</h2>
          <p className="text-unlock-gray text-sm">Nível {store.level}</p>
          <div className="mt-4 flex items-center gap-3">
            <span className="text-xs text-unlock-gray">{store.xp} XP</span>
            <div className="flex-1 h-3 rounded-full bg-white/[0.08] overflow-hidden">
              <div
                className="h-full rounded-full bg-unlock-gold transition-all duration-500"
                style={{ width: `${nextLevel?.progress ?? 100}%` }}
              />
            </div>
            <span className="text-xs text-unlock-gray">
              {nextLevel ? `${nextLevel.needed} para Nível ${store.level + 1}` : 'MAX'}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard emoji="🔥" value={store.streak} label="Streak" sub={`Recorde: ${store.longestStreak}`} />
          <StatCard emoji="✅" value={store.lessonsCompleted.length} label="Aulas" sub="Completas" />
          <StatCard emoji="🎮" value={store.gamesCompleted.length} label="Jogos" sub="Completados" />
          <StatCard emoji="💬" value={wordCounts.total} label="Palavras" sub={`${wordCounts.mastered} dominadas`} />
        </div>

        {/* Word Mastery Breakdown */}
        <div className="unlock-card p-6">
          <h3 className="font-title text-sm text-unlock-gold mb-4">📊 Domínio de Vocabulário</h3>
          <div className="space-y-3">
            <MasteryBar label="Dominadas" count={wordCounts.mastered} total={wordCounts.total} color="bg-unlock-green" />
            <MasteryBar label="Fortes" count={wordCounts.strong} total={wordCounts.total} color="bg-[#88FF00]" />
            <MasteryBar label="Aprendendo" count={wordCounts.learning} total={wordCounts.total} color="bg-unlock-gold" />
            <MasteryBar label="Fracas" count={wordCounts.weak} total={wordCounts.total} color="bg-unlock-orange" />
            <MasteryBar label="Críticas" count={wordCounts.critical} total={wordCounts.total} color="bg-unlock-red" />
          </div>
          {wordCounts.forReview > 0 && (
            <p className="text-unlock-cyan text-sm mt-4">
              🔄 {wordCounts.forReview} palavras prontas para revisão
            </p>
          )}
        </div>

        {/* Achievements */}
        <div className="unlock-card p-6">
          <h3 className="font-title text-sm text-unlock-gold mb-4">
            🏆 Conquistas ({unlockedCount}/{achievements.length})
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {achievements.map((ach) => (
              <div
                key={ach.id}
                className={`text-center p-3 rounded-lg transition-all ${
                  ach.unlocked
                    ? 'bg-unlock-gold/10 border border-unlock-gold/30'
                    : 'bg-white/[0.03] opacity-40 grayscale'
                }`}
                title={`${ach.title}: ${ach.desc}`}
              >
                <div className="text-2xl mb-1">{ach.emoji}</div>
                <div className="text-[10px] text-unlock-gray line-clamp-1">{ach.title}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Module Progress */}
        <div className="unlock-card p-6">
          <h3 className="font-title text-sm text-unlock-green mb-4">📚 Progresso por Módulo</h3>
          {modules.map(m => (
            <div className="dash-module-bar" key={m.number}>
              <div className="dash-module-emoji">{m.emoji}</div>
              <div className="dash-module-info">
                <div className="dash-module-name">{m.name}</div>
                <div className="dash-module-count">{m.completed}/{m.total} aulas</div>
                <div className="dash-progress-track">
                  <div className="dash-progress-fill" style={{
                    width: `${m.pct}%`,
                    background: m.pct === 100 ? 'var(--green)' : m.pct > 50 ? 'var(--cyan)' : 'var(--gold)',
                  }} />
                </div>
              </div>
              <span style={{ fontFamily:'Orbitron', fontSize:'0.8rem', fontWeight:700, color: m.pct === 100 ? 'var(--green)' : 'var(--gray)' }}>
                {m.pct}%
              </span>
            </div>
          ))}
        </div>

        {/* Recent Sessions */}
        {recentSessions.length > 0 && (
          <div className="unlock-card p-6">
            <h3 className="font-title text-sm text-unlock-cyan mb-4">🕐 Sessões Recentes</h3>
            <div className="space-y-2">
              {recentSessions.map((s, i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 12px', background:'rgba(255,255,255,0.02)', borderRadius:8 }}>
                  <div>
                    <span style={{ fontSize:'0.85rem', fontWeight:600 }}>
                      {s.type === 'lesson' ? '📚' : s.type === 'homework' ? '📝' : '🎮'} {s.type}
                    </span>
                    {s.lessonId && <span style={{ fontSize:'0.75rem', color:'var(--gray)', marginLeft:8 }}>{s.lessonId}</span>}
                  </div>
                  <div style={{ display:'flex', gap:12, fontSize:'0.75rem', color:'var(--gray)' }}>
                    {s.score !== undefined && <span style={{ color:'var(--gold)' }}>⚡ {s.score}</span>}
                    {s.accuracy !== undefined && <span style={{ color: (s.accuracy ?? 0) >= 80 ? 'var(--green)' : 'var(--red)' }}>{s.accuracy}%</span>}
                    <span>{new Date(s.date).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────

function StatCard({
  emoji,
  value,
  label,
  sub,
}: {
  emoji: string;
  value: number;
  label: string;
  sub: string;
}) {
  return (
    <div className="unlock-card p-4 text-center">
      <div className="text-2xl mb-1">{emoji}</div>
      <div className="text-2xl font-bold text-unlock-gold">{value}</div>
      <div className="text-sm font-semibold">{label}</div>
      <div className="text-xs text-unlock-gray">{sub}</div>
    </div>
  );
}

function MasteryBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const percent = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-unlock-gray w-24 shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-white/[0.08] overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-xs text-unlock-gray w-10 text-right">{count}</span>
    </div>
  );
}
