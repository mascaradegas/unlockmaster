import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getLessonById } from '@/data/lessons';
import { useProgressStore } from '@/stores/progressStore';
import { SFX } from '@/utils/sounds';
import { matchAnswer, getDisplayAnswer, stripHtml } from '@/utils/matchAnswer';

function shuffle<T>(a: T[]): T[] { const b=[...a]; for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];} return b; }

export function Homework() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const store = useProgressStore();
  const lesson = id ? getLessonById(id) : undefined;

  useEffect(() => { if (!lesson) navigate('/', { replace: true }); }, [lesson, navigate]);
  if (!lesson) return null;

  const vocab = lesson.vocabulary || [];
  const words = useMemo(() => shuffle(vocab).slice(0, Math.min(10, vocab.length)), [vocab]);
  const startTime = useRef(Date.now());
  const answerStart = useRef(Date.now());

  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState('');
  const [fb, setFb] = useState<'correct'|'wrong'|null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [done, setDone] = useState(false);
  const [comboTimer, setComboTimer] = useState(100);
  const [xpGained, setXpGained] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const word = words[idx];
  const total = words.length;

  // Focus input
  useEffect(() => { if (inputRef.current && !done) inputRef.current.focus(); }, [idx, fb, done]);

  // Combo timer (ticks down)
  useEffect(() => {
    if (done || fb) return;
    setComboTimer(100);
    const iv = setInterval(() => {
      setComboTimer(p => {
        if (p <= 0) return 0;
        return p - 1;
      });
    }, 80);
    return () => clearInterval(iv);
  }, [idx, done, fb]);

  const finishHomework = useCallback(() => {
    const duration = Math.round((Date.now() - startTime.current) / 1000);
    const totalAttempts = correctCount + wrongCount;
    const acc = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;
    const xp = 50 + (acc === 100 ? 100 : 0);
    store.addXP(xp);
    store.logSession({ type: 'homework', lessonId: lesson.id, score, accuracy: acc, duration, wordsAttempted: totalAttempts });
    store.updateStreak();
    store.checkAchievements();
    setXpGained(xp);
    setDone(true);
    SFX.victory();
  }, [correctCount, wrongCount, score, store, lesson]);

  const handleSubmit = useCallback(() => {
    if (fb || !word) return;
    const answer = input.trim().toLowerCase();
    const correct = word.en.toLowerCase().trim();
    const { isCorrect, matchedAnswer } = matchAnswer(input, word.en);
    const responseTime = Date.now() - answerStart.current;
    const isLate = comboTimer <= 0;

    store.trackWord({
      en: word.en, pt: word.pt, emoji: word.emoji || '📝', correct: isCorrect,
      responseTime, context: 'homework', late: isLate,
      lessonId: lesson.id, lessonTitle: lesson.title, lessonOrder: lesson.order, module: lesson.module,
    });

    if (isCorrect) {
      setFb('correct'); SFX.correct();
      const pts = 15 + (isLate ? 0 : combo * 5);
      setScore(s => s + pts);
      setCombo(c => { const n=c+1; setMaxCombo(m=>Math.max(m,n)); return n; });
      setCorrectCount(c => c + 1);
      setTimeout(() => {
        setFb(null); setInput('');
        if (idx >= total - 1) { finishHomework(); } else { setIdx(i => i + 1); answerStart.current = Date.now(); }
      }, 800);
    } else {
      setFb('wrong'); SFX.wrong();
      setShowAnswer(true);
      setCombo(0);
      setWrongCount(w => w + 1);
    }
  }, [fb, word, input, comboTimer, combo, idx, total, store, lesson, finishHomework]);

  const handleContinue = () => {
    setFb(null); setShowAnswer(false); setInput('');
    if (idx >= total - 1) { finishHomework(); } else { setIdx(i => i + 1); answerStart.current = Date.now(); }
  };

  // Done screen
  if (done) {
    const acc = correctCount+wrongCount>0 ? Math.round((correctCount/(correctCount+wrongCount))*100) : 0;
    return (
      <div className="relative z-10 min-h-screen pb-20">
        <div style={{ padding: '20px' }}>
          <div className="game-modal-box" style={{ margin: '40px auto' }}>
            <div className="game-modal-icon">📝</div>
            <div className="game-modal-title">HOMEWORK COMPLETO!</div>
            <div className="game-modal-stats">
              {[['Score',score],['Acertos',`${correctCount}/${total}`],['Precisão',`${acc}%`],['Max Combo',`${maxCombo}x`]].map(([k,v]) => (
                <div className="game-modal-stat" key={k as string}><span className="k">{k}</span><span className="v">{v}</span></div>
              ))}
            </div>
            <div className="game-xp-gained">+{xpGained} XP ⚡</div>
            <button className="game-modal-btn primary" onClick={() => navigate(`/game/select/${lesson.id}`)}>🎮 Jogar Agora</button>
            <button className="game-modal-btn secondary" onClick={() => navigate(`/daily-drill`)}>🎯 Daily Drill</button>
            <button className="game-modal-btn secondary" onClick={() => navigate('/')}>📚 Menu</button>
          </div>
        </div>
      </div>
    );
  }

  const comboColor = comboTimer > 50 ? 'var(--green)' : comboTimer > 25 ? 'var(--gold)' : 'var(--red)';

  return (
    <div className="relative z-10 min-h-screen pb-20">
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px' }}>
        <Link to={`/lesson/${lesson.id}`} style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'8px 16px', borderRadius:10, border:'2px solid var(--green)', color:'var(--green)', fontFamily:'Orbitron', fontWeight:700, fontSize:'0.8rem', textDecoration:'none', background:'rgba(0,255,136,0.08)' }}>← VOLTAR</Link>
        <div style={{ fontFamily:'Orbitron', fontWeight:700, fontSize:'0.85rem', color:'var(--gold)' }}>📝 HOMEWORK</div>
        <div style={{ fontFamily:'Orbitron', fontSize:'0.75rem', color:'var(--gray)' }}>{idx+1}/{total}</div>
      </div>

      {/* Progress */}
      <div style={{ padding:'0 20px', marginBottom:16 }}>
        <div style={{ height:6, borderRadius:3, background:'rgba(255,255,255,0.08)', overflow:'hidden' }}>
          <div style={{ height:'100%', borderRadius:3, width:`${((idx)/total)*100}%`, background:'linear-gradient(90deg, var(--green), var(--cyan))', transition:'width 0.3s' }} />
        </div>
      </div>

      {/* Combo timer bar */}
      <div style={{ padding:'0 20px', marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontFamily:'Orbitron', fontSize:'0.7rem', color:comboColor }}>COMBO {combo}x</span>
          <div style={{ flex:1, height:6, borderRadius:3, background:'rgba(255,255,255,0.08)', overflow:'hidden' }}>
            <div style={{ height:'100%', borderRadius:3, width:`${comboTimer}%`, background:comboColor, transition:'width 0.08s linear' }} />
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display:'flex', justifyContent:'center', gap:20, marginBottom:20, fontFamily:'Orbitron', fontSize:'0.75rem' }}>
        <span style={{ color:'var(--gold)' }}>⚡ {score}</span>
        <span style={{ color:'var(--green)' }}>✓ {correctCount}</span>
        <span style={{ color:'var(--red)' }}>✗ {wrongCount}</span>
      </div>

      {/* Flashcard */}
      <div style={{ padding:'0 20px' }}>
        <div style={{
          background:'linear-gradient(145deg, rgba(30,30,50,0.95), rgba(15,15,30,0.98))',
          border: fb==='correct' ? '3px solid var(--green)' : fb==='wrong' ? '3px solid var(--red)' : '3px solid var(--cyan)',
          borderRadius:16, padding:'30px 20px', textAlign:'center', minHeight:200,
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12,
          boxShadow: fb==='correct' ? '0 0 30px rgba(0,255,136,0.3)' : fb==='wrong' ? '0 0 30px rgba(255,68,68,0.3)' : '0 0 20px rgba(0,200,255,0.15)',
          transition: 'border-color 0.3s, box-shadow 0.3s',
        }}>
          <div style={{ fontSize:'3rem' }}>{word?.emoji || '📝'}</div>
          <div style={{ fontFamily:'Orbitron', fontSize:'1.4rem', fontWeight:900, color:'var(--gold)', textShadow:'2px 2px 0 #8B6914' }}>
            {word?.pt}
          </div>
          <div style={{ fontSize:'0.85rem', color:'var(--gray)', marginTop:4 }}>🇧🇷 Escreva em inglês:</div>
        </div>

        {/* Input area */}
        <div style={{ marginTop:16, position:'relative' }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                if (showAnswer) handleContinue();
                else if (input.trim()) handleSubmit();
              }
            }}
            disabled={!!fb}
            placeholder="Type the answer..."
            style={{
              width:'100%', padding:'14px 18px', fontSize:'1.1rem', fontFamily:'Inter, sans-serif',
              background:'rgba(255,255,255,0.05)', border:'2px solid rgba(255,255,255,0.15)',
              borderRadius:12, color:'white', outline:'none', boxSizing:'border-box',
            }}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
          />
        </div>

        {/* Wrong answer correction */}
        {showAnswer && (
          <div style={{ marginTop:12, padding:'12px 16px', background:'rgba(255,68,68,0.1)', border:'2px solid var(--red)', borderRadius:12, textAlign:'center' }}>
            <div style={{ fontSize:'0.8rem', color:'var(--red)', marginBottom:4 }}>Resposta correta:</div>
            <div style={{ fontSize:'1.2rem', fontWeight:700, color:'var(--green)' }}>{getDisplayAnswer(word?.en || '')}</div>
            <button onClick={handleContinue}
              style={{ marginTop:12, padding:'10px 24px', background:'var(--cyan)', color:'#000', borderRadius:8, border:'none', fontFamily:'Orbitron', fontWeight:700, fontSize:'0.85rem', cursor:'pointer' }}>
              CONTINUAR →
            </button>
          </div>
        )}

        {/* Submit button */}
        {!showAnswer && !fb && (
          <button onClick={handleSubmit} disabled={!input.trim()}
            style={{
              width:'100%', marginTop:12, padding:'14px', background: input.trim() ? 'var(--green)' : 'rgba(255,255,255,0.05)',
              color: input.trim() ? '#000' : 'var(--gray)', borderRadius:12, border:'none',
              fontFamily:'Orbitron', fontWeight:700, fontSize:'0.95rem', cursor: input.trim() ? 'pointer' : 'default',
              transition: 'all 0.2s',
            }}>
            ENVIAR ✓
          </button>
        )}

        {/* Correct feedback */}
        {fb === 'correct' && (
          <div style={{ marginTop:12, textAlign:'center', color:'var(--green)', fontFamily:'Orbitron', fontWeight:700, fontSize:'1.1rem' }}>
            ✓ CORRETO! {combo > 1 && <span style={{ color:'var(--cyan)' }}>🔥 {combo}x combo</span>}
          </div>
        )}
      </div>
    </div>
  );
}
