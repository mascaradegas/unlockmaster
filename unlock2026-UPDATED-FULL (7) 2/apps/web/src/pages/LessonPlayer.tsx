import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getLessonById, getNextLesson } from '@/data/lessons';
import { useProgressStore } from '@/stores/progressStore';
import { SlideRenderer } from '@/components/lessons/SlideRenderer';
import { XP } from '@unlock2026/shared';
import { SFX } from '@/utils/sounds';

export function LessonPlayer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const lesson = id ? getLessonById(id) : undefined;
  const store = useProgressStore();

  const savedIndex = id ? store.getSlideProgress(id) : 0;
  const [currentSlide, setCurrentSlide] = useState(savedIndex);
  const [showComplete, setShowComplete] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const [alreadyDone, setAlreadyDone] = useState(false);

  useEffect(() => { if (!lesson) navigate('/', { replace: true }); }, [lesson, navigate]);
  if (!lesson) return null;

  const slides = lesson.slides;
  const total = slides.length;
  const slide = slides[currentSlide];
  const isFav = store.favorites.includes(lesson.id);
  const progress = total > 1 ? Math.round((currentSlide / (total - 1)) * 100) : 0;
  const nextLesson = getNextLesson(lesson.id);

  const handleComplete = useCallback(() => {
    if (showComplete) return;
    const wasAlreadyComplete = store.isLessonComplete(lesson.id);
    setAlreadyDone(wasAlreadyComplete);

    // Complete the lesson (returns false if already done)
    store.completeLesson(lesson.id);

    // Award XP (less for repeat completions)
    const xp = wasAlreadyComplete ? 25 : XP.LESSON_COMPLETE;
    store.addXP(xp);
    setXpGained(xp);

    // Track vocabulary as "seen" if first time
    if (!wasAlreadyComplete && lesson.vocabulary) {
      lesson.vocabulary.forEach(v => {
        store.trackWord({
          en: v.en, pt: v.pt, emoji: v.emoji || '📝',
          correct: true, responseTime: 0, context: 'lesson',
          lessonId: lesson.id, lessonTitle: lesson.title,
          lessonOrder: lesson.order, module: lesson.module,
        });
      });
    }

    // Log session & update streak
    store.logSession({ type: 'lesson', lessonId: lesson.id });
    store.updateStreak();
    store.checkAchievements();

    SFX.victory();
    setShowComplete(true);
  }, [showComplete, store, lesson]);

  const goNext = useCallback(() => {
    if (currentSlide < total - 1) {
      const n = currentSlide + 1;
      setCurrentSlide(n);
      store.saveSlideProgress(lesson.id, n);
      // Add slide view XP
      store.addXP(XP.LESSON_SLIDE_VIEW);
    } else {
      // Last slide — trigger completion
      handleComplete();
    }
  }, [currentSlide, total, lesson.id, store, handleComplete]);

  const goPrev = useCallback(() => {
    if (currentSlide > 0) setCurrentSlide(currentSlide - 1);
  }, [currentSlide]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (showComplete) return;
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [goNext, goPrev, showComplete]);

  return (
    <div className="relative z-10 min-h-screen flex flex-col" style={{ paddingTop: 10 }}>
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 10, border: '2px solid var(--green)', color: 'var(--green)', fontFamily: 'Orbitron', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none', background: 'rgba(0,255,136,0.08)' }}>
          ← VOLTAR
        </Link>
        <div style={{ fontFamily: 'Orbitron', fontWeight: 700, fontSize: '0.9rem', color: 'var(--gold)', textShadow: '1px 1px 0 #8B6914', padding: '6px 16px', border: '2px solid var(--gold)', borderRadius: 10, background: 'rgba(255,215,0,0.08)' }}>
          {lesson.title}
        </div>
        <button onClick={() => store.toggleFavorite(lesson.id)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>
          {isFav ? '❤️' : '🤍'}
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 4, width: `${progress}%`, background: 'linear-gradient(90deg, var(--green), var(--cyan))', boxShadow: '0 0 10px var(--green)', transition: 'width 0.3s' }} />
          </div>
          <span style={{ fontFamily: 'Orbitron', fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray)' }}>
            {currentSlide + 1}/{total}
          </span>
        </div>
      </div>

      {/* Slide */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 20px 0' }}>
        <div style={{ width: '100%', maxWidth: 650 }} key={currentSlide}>
          <SlideRenderer slide={slide} lessonId={lesson.id} lessonTitle={lesson.title} />
        </div>
      </div>

      {/* Nav arrows */}
      <div className="nav-arrows">
        <button className="nav-arrow" onClick={goPrev} disabled={currentSlide === 0}>◀</button>
        <span className="nav-counter">{currentSlide + 1} / {total}</span>
        <button className="nav-arrow" onClick={() => goNext()} disabled={showComplete}>
          {currentSlide >= total - 1 ? '✓' : '▶'}
        </button>
      </div>

      {/* Completion Modal */}
      {showComplete && (
        <div className="lesson-complete-modal">
          <div className="lesson-complete-box">
            <div style={{ fontSize: '3.5rem', marginBottom: 8 }}>🎉</div>
            <div style={{ fontFamily: 'Orbitron', fontWeight: 900, fontSize: '1.3rem', color: 'var(--green)', marginBottom: 4 }}>
              {alreadyDone ? 'AULA REVISADA!' : 'AULA COMPLETA!'}
            </div>
            <div style={{ color: 'var(--gray)', fontSize: '0.9rem', marginBottom: 12 }}>
              {lesson.title}
            </div>
            <div className="game-xp-gained">+{xpGained} XP ⚡</div>
            {lesson.vocabulary && lesson.vocabulary.length > 0 && (
              <div style={{ fontSize: '0.85rem', color: 'var(--cyan)', margin: '8px 0' }}>
                📝 {lesson.vocabulary.length} palavras {alreadyDone ? 'revisadas' : 'aprendidas'}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
              <button onClick={() => navigate(`/homework/${lesson.id}`)}
                style={{ padding: '12px', background: 'var(--gold)', color: '#0a1628', borderRadius: 12, border: 'none', fontFamily: 'Orbitron', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                📝 FAZER HOMEWORK
              </button>
              <button onClick={() => navigate(`/game/select/${lesson.id}`)}
                style={{ padding: '12px', background: 'rgba(0,255,136,0.12)', color: 'var(--green)', borderRadius: 12, border: '2px solid var(--green)', fontFamily: 'Orbitron', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                🎮 JOGAR AGORA
              </button>
              {nextLesson && (
                <button onClick={() => { setShowComplete(false); setCurrentSlide(0); navigate(`/lesson/${nextLesson.id}`); }}
                  style={{ padding: '12px', background: 'rgba(0,191,255,0.12)', color: 'var(--cyan)', borderRadius: 12, border: '2px solid var(--cyan)', fontFamily: 'Orbitron', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                  ▶ PRÓXIMA AULA
                </button>
              )}
              <button onClick={() => navigate('/')}
                style={{ padding: '10px', background: 'none', color: 'var(--gray)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.8rem', cursor: 'pointer' }}>
                📚 Menu Principal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
