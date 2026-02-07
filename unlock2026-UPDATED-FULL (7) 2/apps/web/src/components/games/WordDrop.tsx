import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Lesson, VocabularyItem } from '@unlock2026/shared';
import { useProgressStore } from '@/stores/progressStore';
import { SFX } from '@/utils/sounds';
import { getDisplayAnswer } from '@/utils/matchAnswer';

interface Props { lesson: Lesson; onFinish: () => void; }

function shuffle<T>(a: T[]): T[] { const b=[...a]; for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];} return b; }

const MILESTONES = [
  { score: 50, label: '🥉 BRONZE', color: '#CD7F32' },
  { score: 100, label: '🥈 SILVER', color: '#C0C0C0' },
  { score: 200, label: '🥇 GOLD', color: '#FFD700' },
  { score: 350, label: '💎 DIAMOND', color: '#00FFFF' },
];

export function WordDropGame({ lesson, onFinish }: Props) {
  const navigate = useNavigate();
  const store = useProgressStore();
  const vocab = lesson.vocabulary || [];
  const [gameKey, setGameKey] = useState(0);
  const words = useMemo(() => shuffle(vocab).slice(0, Math.min(15, vocab.length)), [vocab, gameKey]);
  const startTime = useRef(Date.now());
  const answerStart = useRef(Date.now());
  const bestScore = store.getBestScore(lesson.id, 'word-drop');

  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(5);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [fb, setFb] = useState<'correct'|'wrong'|null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string|null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [victory, setVictory] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [timer, setTimer] = useState(100);
  const [paused, setPaused] = useState(false);
  const [shake, setShake] = useState(false);
  const [milestone, setMilestone] = useState<typeof MILESTONES[0]|null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [recordBeat, setRecordBeat] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const [blockPosition, setBlockPosition] = useState(0);
  const lastMilestoneRef = useRef(0);

  // Use ref to avoid stale closures in timer callback
  const handleAnswerRef = useRef<(answer: string) => void>(() => {});

  const word = words[idx];
  const total = words.length;

  useEffect(() => { if (!store.hasTutorialSeen('word-drop')) setShowTutorial(true); }, []);

  useEffect(() => {
    if (!word || gameOver) return;
    const ans = getDisplayAnswer(word.en);
    const others = vocab.filter(v => getDisplayAnswer(v.en) !== ans).sort(() => Math.random() - 0.5).slice(0, 2).map(v => getDisplayAnswer(v.en));
    setOptions(shuffle([...others, ans]));
    setTimer(100);
    setBlockPosition(0);
    answerStart.current = Date.now();
  }, [idx, word, vocab, gameOver]);

  useEffect(() => {
    if (gameOver || paused || !word || fb || showTutorial) return;
    const iv = setInterval(() => {
      setTimer(p => {
        if (p <= 0.5) { handleAnswerRef.current('__timeout__'); return 100; }
        return p - 0.5;
      });
      setBlockPosition(p => {
        if (p >= 100) return 100;
        return p + 0.5;
      });
    }, 50);
    return () => clearInterval(iv);
  }, [idx, gameOver, paused, word, fb, showTutorial]);

  // Milestones
  useEffect(() => {
    const ms = [...MILESTONES].reverse().find(m => score >= m.score);
    if (ms && ms.score > lastMilestoneRef.current) {
      lastMilestoneRef.current = ms.score;
      setMilestone(ms);
      SFX.milestone();
      setTimeout(() => setMilestone(null), 2000);
    }
  }, [score]);

  const trackAnswer = useCallback((w: VocabularyItem, isCorrect: boolean) => {
    store.trackWord({
      en: w.en, pt: w.pt, emoji: w.emoji || '📝',
      correct: isCorrect, responseTime: Date.now() - answerStart.current, context: 'word-drop',
      lessonId: lesson.id, lessonTitle: lesson.title, lessonOrder: lesson.order, module: lesson.module,
    });
  }, [store, lesson]);

  const finishGame = useCallback((won: boolean, finalScore: number, totalCorrect: number, totalWrong: number) => {
    const duration = Math.round((Date.now() - startTime.current) / 1000);
    const acc = totalCorrect + totalWrong > 0 ? Math.round((totalCorrect / (totalCorrect + totalWrong)) * 100) : 0;
    const maxScore = total * 10;
    // completeGame already calls addXP, updateStreak, checkAchievements internally
    const result = store.completeGame(lesson.id, 'word-drop', finalScore, maxScore);
    store.logSession({ type: 'word-drop', lessonId: lesson.id, score: finalScore, accuracy: acc, duration, wordsAttempted: totalCorrect + totalWrong });
    // XP display: GAME_COMPLETE (50) + GAME_PERFECT (100) if 100% accuracy
    setXpGained(50 + (result.isPerfect ? 100 : 0));
    setRecordBeat(result.isNewBest);
    setVictory(won);
    setGameOver(true);
    if (won) SFX.victory(); else SFX.gameover();
  }, [total, store, lesson]);

  const handleAnswer = useCallback((answer: string) => {
    if (gameOver || fb) return;
    const ok = answer === getDisplayAnswer(word?.en || '');
    setSelectedAnswer(answer);
    if (ok) {
      setFb('correct'); SFX.correct();
      const newCombo = combo + 1;
      const pts = 10 + combo * 5;
      const newScore = score + pts;
      setScore(newScore); setCombo(newCombo);
      if (newCombo > 0 && newCombo % 5 === 0) SFX.combo();
      setMaxCombo(m => Math.max(m, newCombo));
      const newCorrect = correct + 1;
      setCorrect(newCorrect);
      if (word) trackAnswer(word, true);
      if (newCombo >= 10 && combo < 10) setLives(l => Math.min(l + 1, 5));
      setTimeout(() => {
        setFb(null); setSelectedAnswer(null);
        if (idx >= total - 1) { finishGame(true, newScore, newCorrect, wrong); } else { setIdx(i => i + 1); }
      }, 800);
    } else {
      setFb('wrong'); SFX.wrong();
      setShake(true); setTimeout(() => setShake(false), 500);
      const newLives = lives - 1;
      setLives(newLives); setCombo(0);
      const newWrong = wrong + 1;
      setWrong(newWrong);
      if (word) trackAnswer(word, false);
      setTimeout(() => {
        setFb(null); setSelectedAnswer(null);
        if (newLives <= 0) { finishGame(false, score, correct, newWrong); return; }
        if (idx >= total - 1) { finishGame(true, score, correct, newWrong); } else { setIdx(i => i + 1); }
      }, 800);
    }
  }, [gameOver, fb, word, combo, score, lives, idx, total, correct, wrong, trackAnswer, finishGame]);

  // Keep ref in sync so the timer interval always calls the latest handleAnswer
  useEffect(() => { handleAnswerRef.current = handleAnswer; }, [handleAnswer]);

  // Keyboard
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (showTutorial) { if (e.key === 'Enter') { setShowTutorial(false); store.markTutorialSeen('word-drop'); } return; }
      if (gameOver || fb) return;
      if (e.key >= '1' && e.key <= '3') { const i=parseInt(e.key)-1; if(i<options.length) handleAnswer(options[i]); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [gameOver, fb, options, handleAnswer, showTutorial, store]);

  const resetGame = useCallback(() => {
    setIdx(0); setScore(0); setLives(5); setCombo(0); setMaxCombo(0);
    setCorrect(0); setWrong(0); setGameOver(false); setVictory(false);
    setFb(null); setSelectedAnswer(null);
    lastMilestoneRef.current = 0; startTime.current = Date.now();
    setGameKey(k => k + 1);
  }, []);

  // Tutorial
  if (showTutorial) {
    return (
      <div className="game-modal"><div className="game-modal-box">
        <div className="game-modal-icon">🎮</div>
        <div className="game-modal-title">COMO JOGAR</div>
        <div style={{ textAlign:'left', padding:'0 10px', lineHeight:1.8, fontSize:'0.9rem' }}>
          <p>1️⃣ Veja a palavra em <b style={{color:'var(--gold)'}}>português</b></p>
          <p>2️⃣ Escolha a tradução em <b style={{color:'var(--green)'}}>inglês</b></p>
          <p>3️⃣ Acerte rápido para <b style={{color:'var(--cyan)'}}>combo</b> e mais pontos!</p>
          <p style={{ marginTop:8, color:'var(--gray)', fontSize:'0.8rem' }}>⌨️ Teclas 1, 2, 3 para responder</p>
        </div>
        <button className="game-modal-btn primary" onClick={() => { setShowTutorial(false); store.markTutorialSeen('word-drop'); }}>COMEÇAR! 🚀</button>
      </div></div>
    );
  }

  // Game Over
  if (gameOver) {
    const acc = correct+wrong>0 ? Math.round((correct/(correct+wrong))*100) : 0;
    return (
      <div className="game-modal"><div className="game-modal-box">
        {recordBeat && <div className="game-record-alert">🏆 NOVO RECORDE!</div>}
        <div className="game-modal-icon">{victory ? '🏆' : '💀'}</div>
        <div className="game-modal-title">{victory ? 'PARABÉNS!' : 'GAME OVER!'}</div>
        <div className="game-modal-stats">
          {[['Score',score],['Acertos',`${correct}/${correct+wrong}`],['Precisão',`${acc}%`],['Max Combo',`${maxCombo}x`]].map(([k,v]) => (
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

  const recordPct = bestScore > 0 ? Math.min((score / bestScore) * 100, 100) : 0;

  const getBlockColor = () => {
    if (timer > 50) return '#00ff00';
    if (timer > 25) return '#ffaa00';
    return '#ff0000';
  };

  return (
    <div className="game-page">
      <button className="game-pause-btn" onClick={() => setPaused(!paused)}>{paused ? '▶️' : '⏸️'}</button>
      <div className="game-title-bar"><h1>🔴 WORD DROP</h1></div>
      <div className="game-hud">
        {[{l:'SCORE',v:score.toString()},{l:'VIDAS',v:'❤️'.repeat(Math.max(lives,0))},{l:'COMBO',v:`${combo}x`},{l:'WAVE',v:`${idx+1}/${total}`}].map(h => (
          <div className="hud-item" key={h.l}><div className="hud-label">{h.l}</div><div className="hud-value">{h.v}</div></div>
        ))}
      </div>
      {bestScore > 0 && (
        <div className="game-record-bar"><div className="game-record-fill" style={{width:`${recordPct}%`}}/><div className="game-record-text">Recorde: {bestScore}</div></div>
      )}

      <div className="word-drop-container">
        <div className="word-drop-track">
          {!paused && !fb && (
            <div
              className="falling-block"
              style={{
                top: `${blockPosition}%`,
                backgroundColor: getBlockColor(),
                boxShadow: `0 0 20px ${getBlockColor()}, 0 0 40px ${getBlockColor()}`,
              }}
            >
              <div className="block-content">
                <div className="block-emoji">{word?.emoji || '📦'}</div>
                <div className="block-word">{word?.pt}</div>
              </div>
            </div>
          )}

          <div className="ground-line" />
        </div>
      </div>

      {milestone && <div className="milestone-alert" style={{color:milestone.color}}>{milestone.label}</div>}
      <div className={`game-arena-minimal ${shake ? 'arena-shake' : ''}`}>
        {paused && <div style={{fontFamily:'Orbitron',fontSize:'1.5rem',color:'var(--cyan)'}}>⏸️ PAUSADO</div>}
        {fb === 'correct' && <div className="arena-flash-correct"/>}
        {fb === 'wrong' && <div className="arena-flash-wrong"/>}
      </div>
      <div className="game-prompt-box">
        <div className="game-prompt-label">🇧🇷 Traduza para inglês:</div>
        <div className="game-prompt-text">{word?.pt}</div>
      </div>
      <div className="game-options">
        {options.map((opt, i) => {
          const correctAnswer = getDisplayAnswer(word?.en || '');
          let cls = 'game-opt-btn';
          if (fb === 'correct' && opt === correctAnswer) cls += ' correct';
          else if (fb === 'wrong' && opt === correctAnswer) cls += ' correct';
          else if (fb === 'wrong' && opt === selectedAnswer) cls += ' wrong';
          return <button key={i} className={cls} disabled={!!fb||paused} onClick={() => handleAnswer(opt)}><span className="opt-key">{i+1}</span>{opt}</button>;
        })}
      </div>
    </div>
  );
}
