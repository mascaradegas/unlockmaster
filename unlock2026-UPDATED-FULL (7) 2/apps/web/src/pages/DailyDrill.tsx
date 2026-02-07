import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProgressStore } from '@/stores/progressStore';
import { LESSONS, getModules } from '@/data/lessons';
import type { Lesson } from '@unlock2026/shared';

const STEPS = [
  { key: 'warmup', name: 'WARMUP', namePt: 'esquenta', emoji: '⚡', desc: 'Ative seu cérebro com 5 palavras' },
  { key: 'lesson', name: 'LESSON', namePt: 'aula', emoji: '📚', desc: 'Aprenda com exemplos práticos' },
  { key: 'homework', name: 'HOMEWORK', namePt: 'tarefa', emoji: '📝', desc: 'Pratique o que aprendeu' },
  { key: 'review', name: 'REVIEW', namePt: 'revisão', emoji: '🔄', desc: 'Fixe as palavras difíceis' },
  { key: 'boss', name: 'BOSS RUN', namePt: 'desafio', emoji: '🎮', desc: 'Teste suas habilidades!' },
];

export function DailyDrill() {
  const navigate = useNavigate();
  const { lessonsCompleted } = useProgressStore();
  const [showPicker, setShowPicker] = useState(false);

  // Find next uncompleted lesson
  const currentLesson = useMemo(() => {
    const next = LESSONS.find(l => !lessonsCompleted.includes(l.id));
    return next || LESSONS[0];
  }, [lessonsCompleted]);

  const [selectedLesson, setSelectedLesson] = useState<Lesson>(currentLesson);

  // Track which steps are done (stored in sessionStorage)
  const sessionKey = `drill_${selectedLesson.id}`;
  const [doneSteps, setDoneSteps] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(sessionStorage.getItem(sessionKey) || '{}'); } catch { return {}; }
  });

  const doneCount = STEPS.filter(s => doneSteps[s.key]).length;
  const pct = Math.round((doneCount / STEPS.length) * 100);

  const markDone = (step: string) => {
    const next = { ...doneSteps, [step]: true };
    setDoneSteps(next);
    sessionStorage.setItem(sessionKey, JSON.stringify(next));
  };

  const resetSession = () => {
    setDoneSteps({});
    sessionStorage.removeItem(sessionKey);
  };

  const getLink = (step: string) => {
    const id = selectedLesson.id;
    switch (step) {
      case 'warmup': return `/warmup/warmup/${id}?returnTo=/daily-drill`;
      case 'lesson': return `/lesson/${id}`;
      case 'homework': return `/homework/${id}`;
      case 'review': return `/warmup/review/${id}?returnTo=/daily-drill`;
      case 'boss': return `/game/word-drop/${id}`;
      default: return '/';
    }
  };

  return (
    <div className="relative z-10 min-h-screen">
      {/* Appbar */}
      <div className="drill-appbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1.6rem' }}>🎯</span>
          <div className="drill-brand">
            DAILY DRILL <span style={{ fontSize: '0.6em', opacity: 0.7, fontFamily: 'Inter', fontWeight: 500 }}>treino diário</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/" style={{ color: 'var(--white)', textDecoration: 'none', fontWeight: 900, opacity: 0.9 }}>📚 Aulas</Link>
          <Link to="/profile" style={{ color: 'var(--white)', textDecoration: 'none', fontWeight: 900, opacity: 0.9 }}>👤 Perfil</Link>
        </div>
      </div>

      <div className="drill-page">
        <div className="drill-hero">
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: 8, margin: -8, borderRadius: 12, transition: 'background 0.2s' }}
                 onClick={() => setShowPicker(true)}>
              <div style={{ fontSize: '2rem' }}>{selectedLesson.emoji}</div>
              <div>
                <h1 style={{ fontFamily: 'Orbitron', fontSize: '1.15rem', letterSpacing: 2 }}>{selectedLesson.title}</h1>
                <div style={{ fontSize: '0.75rem', color: 'var(--cyan)', fontWeight: 600, marginTop: 2 }}>▼ Toque para trocar</div>
              </div>
            </div>
            <div className="drill-pill">{pct}% • {doneCount}/{STEPS.length}</div>
          </div>

          {/* Steps */}
          <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
            {STEPS.map(s => {
              const isDone = !!doneSteps[s.key];
              return (
                <div className="drill-step" key={s.key}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <div className="drill-step-emoji">{s.emoji}</div>
                    <div>
                      <div className="drill-step-name">
                        {s.name} <span className="drill-step-name-pt">{s.namePt}</span>
                      </div>
                      <div className="drill-step-desc">{s.desc}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className={`drill-badge ${isDone ? 'done' : ''}`}>{isDone ? 'DONE ✓' : 'TO DO'}</div>
                    <button className="drill-btn" onClick={() => { markDone(s.key); navigate(getLink(s.key)); }}>
                      {isDone ? 'REDO' : 'START'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ color: 'var(--gray)', fontWeight: 600, fontSize: '0.88rem' }}>
              {doneCount === 5 ? '🎉 Sessão completa! Escolha outra aula.' : 'Complete os 5 passos para dominar esta aula.'}
            </div>
            <button style={{ background: 'rgba(0,191,255,0.18)', color: 'var(--white)', border: '2px solid rgba(0,191,255,0.35)', borderRadius: 12, padding: '10px 14px', fontWeight: 900, cursor: 'pointer', fontSize: '0.8rem' }}
                    onClick={resetSession}>🔄 Reiniciar sessão</button>
          </div>

          {/* Celebration */}
          {doneCount === 5 && (
            <div style={{ marginTop: 14, background: 'linear-gradient(135deg,rgba(255,215,0,0.12),rgba(0,255,136,0.12))', border: '2px solid var(--gold)', borderRadius: 14, padding: 18, textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 6 }}>🏆</div>
              <div style={{ fontFamily: 'Orbitron', fontWeight: 900, fontSize: '1.2rem', color: 'var(--gold)', marginBottom: 4 }}>SESSÃO COMPLETA!</div>
              <div style={{ color: 'var(--gray)', fontWeight: 600, fontSize: '0.88rem', marginBottom: 12 }}>Você dominou esta aula. Quer treinar outra?</div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="drill-btn" onClick={() => setShowPicker(true)}>📚 OUTRA AULA</button>
                <Link to={`/game/select/${selectedLesson.id}`} className="drill-btn" style={{ textDecoration: 'none', background: 'rgba(0,191,255,0.18)', color: 'var(--white)', border: '2px solid rgba(0,191,255,0.35)', boxShadow: 'none' }}>🎮 JOGAR</Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lesson Picker Modal */}
      {showPicker && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.95)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
             onClick={(e) => { if (e.target === e.currentTarget) setShowPicker(false); }}>
          <div style={{ background: 'rgba(15,30,55,0.95)', border: '3px solid var(--cyan)', borderRadius: 18, padding: 24, maxWidth: 500, width: '100%', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 0 60px rgba(0,191,255,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontFamily: 'Orbitron', fontWeight: 900, fontSize: '1.1rem', color: 'var(--cyan)' }}>📚 ESCOLHER AULA</div>
              <button onClick={() => setShowPicker(false)} style={{ background: 'none', border: 'none', color: 'var(--gray)', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {LESSONS.map(l => (
                <div key={l.id} onClick={() => { setSelectedLesson(l); setShowPicker(false); setDoneSteps({}); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: 12,
                    background: l.id === selectedLesson.id ? 'rgba(0,255,136,0.1)' : 'rgba(10,22,40,0.6)',
                    border: `2px solid ${l.id === selectedLesson.id ? 'var(--green)' : 'rgba(0,191,255,0.2)'}`,
                    borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s',
                  }}>
                  <span style={{ fontSize: '1.4rem' }}>{l.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{l.title}</div>
                    <div style={{ color: 'var(--gray)', fontSize: '0.8rem', fontWeight: 600 }}>Módulo {l.module} • Aula {l.order}</div>
                  </div>
                  {lessonsCompleted.includes(l.id) && <span style={{ color: 'var(--green)', fontWeight: 900 }}>✓</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
