import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Lesson } from '@unlock2026/shared';
import { useProgressStore } from '@/stores/progressStore';
import { SFX } from '@/utils/sounds';
import { getDisplayAnswer } from '@/utils/matchAnswer';

interface Props { lesson: Lesson; onFinish: () => void; }

function shuffle<T>(a: T[]): T[] { const b=[...a]; for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];} return b; }

export function WordStackGame({ lesson, onFinish }: Props) {
  const navigate = useNavigate();
  const store = useProgressStore();
  const vocab = lesson.vocabulary || [];
  const [gameKey, setGameKey] = useState(0);
  const words = useMemo(() => shuffle(vocab).slice(0, Math.min(10, vocab.length)), [vocab, gameKey]);
  const startTime = useRef(Date.now());
  const answerStart = useRef(Date.now());
  const bestScore = store.getBestScore(lesson.id, 'word-stack');

  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [timer, setTimer] = useState(15);
  const [placed, setPlaced] = useState<string[]>([]);
  const [pool, setPool] = useState<string[]>([]);
  const [fb, setFb] = useState<'correct'|'wrong'|null>(null);
  const [showCorrect, setShowCorrect] = useState<string|null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const [recordBeat, setRecordBeat] = useState(false);

  // Use ref to avoid stale closure in timer callback
  const handleSubmitRef = useRef<(timeout?: boolean) => void>(() => {});

  const word = words[idx];
  const total = words.length;

  useEffect(() => { if (!store.hasTutorialSeen('word-stack')) setShowTutorial(true); }, []);

  useEffect(() => {
    if (!word || gameOver) return;
    const enWords = getDisplayAnswer(word.en).split(/\s+/);
    const distractors = ['the','is','it','a','to','my','your','we','do','can'].filter(d => !enWords.includes(d));
    const extra = shuffle(distractors).slice(0, Math.min(2, distractors.length));
    setPool(shuffle([...enWords, ...extra]));
    setPlaced([]);
    setTimer(15);
    setFb(null);
    setShowCorrect(null);
    answerStart.current = Date.now();
  }, [idx, word, gameOver]);

  // Timer - uses ref to avoid stale closure
  useEffect(() => {
    if (gameOver || paused || fb || showTutorial) return;
    const iv = setInterval(() => {
      setTimer(t => {
        if (t <= 0.1) { handleSubmitRef.current(true); return 15; }
        return t - 0.1;
      });
    }, 100);
    return () => clearInterval(iv);
  }, [idx, gameOver, paused, fb, showTutorial]);

  const addWord = (w: string, i: number) => {
    SFX.place();
    setPlaced(p => [...p, w]);
    setPool(p => { const n=[...p]; n.splice(i,1); return n; });
  };

  const undoWord = () => {
    if (placed.length === 0) return;
    const last = placed[placed.length - 1];
    setPlaced(p => p.slice(0, -1));
    setPool(p => [...p, last]);
  };

  const finishGame = useCallback((finalScore: number, totalCorrect: number, totalWrong: number) => {
    const duration = Math.round((Date.now() - startTime.current) / 1000);
    const totalAttempts = totalCorrect + totalWrong;
    const acc = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
    // completeGame already calls addXP, updateStreak, checkAchievements internally
    const result = store.completeGame(lesson.id, 'word-stack', finalScore, total * 15);
    store.logSession({ type: 'word-stack', lessonId: lesson.id, score: finalScore, accuracy: acc, duration, wordsAttempted: totalAttempts });
    setXpGained(50 + (result.isPerfect ? 100 : 0));
    setRecordBeat(result.isNewBest);
    setGameOver(true);
    if (totalCorrect > totalWrong) SFX.victory(); else SFX.gameover();
  }, [store, lesson, total]);

  const handleSubmit = useCallback((timeout = false) => {
    if (fb || !word) return;
    const answer = placed.join(' ');
    const expected = getDisplayAnswer(word.en);
    // For word-stacking, use exact match since user taps pre-defined word tokens
    const isCorrect = answer.toLowerCase().trim() === expected.toLowerCase().trim();

    // Track word
    store.trackWord({
      en: word.en, pt: word.pt, emoji: word.emoji || '📝', correct: isCorrect,
      responseTime: Date.now() - answerStart.current, context: 'word-stack',
      lessonId: lesson.id, lessonTitle: lesson.title, lessonOrder: lesson.order, module: lesson.module,
    });

    if (isCorrect && !timeout) {
      setFb('correct'); SFX.correct();
      const newCombo = combo + 1;
      const pts = 15 + combo * 5;
      const newScore = score + pts;
      setScore(newScore); setCombo(newCombo);
      const newCorrect = correctCount + 1;
      setCorrectCount(newCorrect);
      if (newCombo > 0 && newCombo % 3 === 0) SFX.combo();
      setTimeout(() => {
        setFb(null);
        if (idx >= total - 1) { finishGame(newScore, newCorrect, wrongCount); } else { setIdx(i => i + 1); }
      }, 1000);
    } else {
      setFb('wrong'); SFX.wrong();
      setShowCorrect(getDisplayAnswer(word.en));
      const newLives = lives - 1;
      setLives(newLives); setCombo(0);
      const newWrong = wrongCount + 1;
      setWrongCount(newWrong);
      setTimeout(() => {
        setFb(null); setShowCorrect(null);
        if (newLives <= 0) { finishGame(score, correctCount, newWrong); return; }
        if (idx >= total - 1) { finishGame(score, correctCount, newWrong); } else { setIdx(i => i + 1); }
      }, 1500);
    }
  }, [fb, word, placed, combo, score, lives, idx, total, correctCount, wrongCount, store, lesson, finishGame]);

  // Keep ref in sync so the timer always calls the latest handleSubmit
  useEffect(() => { handleSubmitRef.current = handleSubmit; }, [handleSubmit]);

  const resetGame = useCallback(() => {
    setIdx(0); setScore(0); setLives(3); setCombo(0);
    setCorrectCount(0); setWrongCount(0); setGameOver(false);
    setFb(null); setShowCorrect(null); setPlaced([]); setPool([]);
    setXpGained(0); setRecordBeat(false);
    startTime.current = Date.now();
    setGameKey(k => k + 1);
  }, []);

  // Tutorial
  if (showTutorial) {
    return (
      <div className="game-modal"><div className="game-modal-box">
        <div className="game-modal-icon">📚</div>
        <div className="game-modal-title">COMO JOGAR</div>
        <div style={{ textAlign:'left', padding:'0 10px', lineHeight:1.8, fontSize:'0.9rem' }}>
          <p>1️⃣ Leia a frase em <b style={{color:'var(--gold)'}}>português</b></p>
          <p>2️⃣ Toque nas palavras para montar a tradução em <b style={{color:'var(--green)'}}>inglês</b></p>
          <p>3️⃣ Cuidado com as palavras <b style={{color:'var(--red)'}}>falsas</b>! 🚫</p>
          <p style={{ marginTop:8, color:'var(--gray)', fontSize:'0.8rem' }}>Toque numa palavra colocada para removê-la</p>
        </div>
        <button className="game-modal-btn primary" onClick={() => { setShowTutorial(false); store.markTutorialSeen('word-stack'); }}>COMEÇAR! 🚀</button>
      </div></div>
    );
  }

  // Game Over
  if (gameOver) {
    const won = lives > 0;
    const acc = correctCount+wrongCount>0 ? Math.round((correctCount/(correctCount+wrongCount))*100) : 0;
    return (
      <div className="game-modal"><div className="game-modal-box">
        {recordBeat && <div className="game-record-alert">🏆 NOVO RECORDE!</div>}
        <div className="game-modal-icon">{won ? '🏆' : '💀'}</div>
        <div className="game-modal-title">{won ? 'FIM DE JOGO!' : 'GAME OVER!'}</div>
        <div className="game-modal-stats">
          {[['Pontuação',score],['Corretas',`${correctCount}/${total}`],['Precisão',`${acc}%`],['Vidas','❤️'.repeat(Math.max(lives,0))]].map(([k,v]) => (
            <div className="game-modal-stat" key={k as string}><span className="k">{k}</span><span className="v">{v}</span></div>
          ))}
        </div>
        <div className="game-xp-gained">+{xpGained} XP ⚡</div>
        <button className="game-modal-btn primary" onClick={resetGame}>🔄 Jogar de Novo</button>
        <button className="game-modal-btn secondary" onClick={() => navigate(`/game/select/${lesson.id}`)}>🎯 Outros Jogos</button>
        <button className="game-modal-btn secondary" onClick={() => navigate('/')}>📚 Menu</button>
      </div></div>
    );
  }

  const fuseW = (timer / 15) * 100;
  const recordPct = bestScore > 0 ? Math.min((score / bestScore) * 100, 100) : 0;

  return (
    <div className="game-page">
      <button className="game-pause-btn" onClick={() => setPaused(!paused)}>{paused ? '▶️' : '⏸️'}</button>
      <div className="game-title-bar"><h1>📚 WORD STACK</h1></div>
      <div className="game-hud">
        {[{l:'PONTOS',v:score.toString()},{l:'VIDAS',v:'❤️'.repeat(Math.max(lives,0))},{l:'COMBO',v:`${combo}x`},{l:'CORRETAS',v:`${correctCount}/${total}`}].map(h => (
          <div className="hud-item" key={h.l}><div className="hud-label">{h.l}</div><div className="hud-value">{h.v}</div></div>
        ))}
      </div>
      <div className="timer-bomb">
        <div className="bomb-icon">💣</div>
        <div className="bomb-fuse"><div className="bomb-fuse-fill" style={{width:`${fuseW}%`}}/></div>
        <div className="bomb-time">{Math.ceil(timer)}</div>
      </div>
      {bestScore > 0 && (
        <div className="game-record-bar"><div className="game-record-fill" style={{width:`${recordPct}%`}}/><div className="game-record-text">Recorde: {bestScore}</div></div>
      )}
      <div className="ws-target">
        <div className="ws-target-label">Traduza para inglês:</div>
        <div className="ws-target-emoji">{word?.emoji||'🎯'}</div>
        <div className="ws-target-text">{word?.pt}</div>
      </div>
      <div className={`ws-answer ${fb === 'correct' ? 'correct-glow' : fb === 'wrong' ? 'wrong-glow' : ''}`}
           style={{ borderColor: fb==='correct' ? 'var(--green)' : fb==='wrong' ? 'var(--red)' : undefined,
                    boxShadow: fb==='correct' ? '0 0 20px rgba(0,255,136,0.5)' : fb==='wrong' ? '0 0 20px rgba(255,68,68,0.5)' : undefined }}>
        {placed.length===0 && !showCorrect && <span style={{color:'var(--gray)',fontStyle:'italic'}}>Toque nas palavras abaixo...</span>}
        {showCorrect ? (
          <span style={{color:'var(--green)',fontFamily:'Orbitron',fontWeight:700}}>{showCorrect}</span>
        ) : (
          placed.map((w,i) => (
            <span key={i} className="ws-word-tag placed" onClick={() => { if(!fb){setPlaced(p=>p.filter((_,j)=>j!==i)); setPool(p=>[...p,w]);} }}>{w}</span>
          ))
        )}
      </div>
      <div className="ws-words-pool">
        {pool.map((w,i) => (
          <button key={`${w}-${i}`} className="ws-word-tag" onClick={() => addWord(w,i)} disabled={!!fb||paused}>{w}</button>
        ))}
      </div>
      <div className="ws-controls">
        <button className="ws-ctrl-btn undo" onClick={undoWord} disabled={placed.length===0||!!fb}>↩ DESFAZER</button>
        <button className="ws-ctrl-btn submit" onClick={() => handleSubmit(false)} disabled={placed.length===0||!!fb}>ENVIAR ✓</button>
      </div>
    </div>
  );
}
