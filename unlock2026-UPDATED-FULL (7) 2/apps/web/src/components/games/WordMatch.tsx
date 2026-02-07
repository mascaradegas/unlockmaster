import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Lesson } from '@unlock2026/shared';
import { useProgressStore } from '@/stores/progressStore';
import { SFX } from '@/utils/sounds';
import { getDisplayAnswer } from '@/utils/matchAnswer';

interface Props { lesson: Lesson; onFinish: () => void; }

function shuffle<T>(a: T[]): T[] { const b=[...a]; for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];} return b; }

export function WordMatchGame({ lesson, onFinish }: Props) {
  const navigate = useNavigate();
  const store = useProgressStore();
  const vocab = lesson.vocabulary || [];
  const pairs = useMemo(() => shuffle(vocab).slice(0, Math.min(6, vocab.length)), [vocab]);
  const leftItems = useMemo(() => shuffle(pairs.map(p => ({ text: p.pt, id: p.en, emoji: p.emoji, pt: p.pt }))), [pairs]);
  const rightItems = useMemo(() => shuffle(pairs.map(p => ({ text: getDisplayAnswer(p.en), id: p.en }))), [pairs]);
  const startTime = useRef(Date.now());
  const answerStart = useRef(Date.now());
  const bestScore = store.getBestScore(lesson.id, 'word-match');

  const [selectedPt, setSelectedPt] = useState<string|null>(null);
  const [selectedEn, setSelectedEn] = useState<string|null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrongPair, setWrongPair] = useState<[string,string]|null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [wave] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [timer, setTimer] = useState(30);
  const [paused, setPaused] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const [recordBeat, setRecordBeat] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const finishedRef = useRef(false);

  useEffect(() => { if (!store.hasTutorialSeen('word-match')) setShowTutorial(true); }, []);

  // Timer
  useEffect(() => {
    if (gameOver || paused || showTutorial) return;
    const iv = setInterval(() => {
      setTimer(t => {
        if (t <= 0.1) { if (!finishedRef.current) finishGame(false); return 0; }
        return t - 0.1;
      });
    }, 100);
    return () => clearInterval(iv);
  }, [gameOver, paused, showTutorial]);

  const finishGame = useCallback((won: boolean) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const duration = Math.round((Date.now() - startTime.current) / 1000);
    const totalAttempts = correctCount + wrongCount;
    const acc = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;
    const result = store.completeGame(lesson.id, 'word-match', score, pairs.length * 10);
    const xp = 50 + (acc === 100 ? 100 : 0);
    store.addXP(xp);
    store.logSession({ type: 'word-match', lessonId: lesson.id, score, accuracy: acc, duration, wordsAttempted: totalAttempts });
    store.updateStreak();
    store.checkAchievements();
    setXpGained(xp);
    setRecordBeat(result.isNewBest);
    setGameOver(true);
    if (won) SFX.victory(); else SFX.gameover();
  }, [correctCount, wrongCount, score, store, lesson, pairs.length]);

  // Check match when both selected
  useEffect(() => {
    if (!selectedPt || !selectedEn) return;
    const ptItem = leftItems.find(l => l.text === selectedPt);
    if (ptItem && ptItem.id === selectedEn) {
      // Correct match
      SFX.match();
      setMatched(m => new Set([...m, selectedEn]));
      setScore(s => s + 10 + combo * 5);
      setCombo(c => c + 1);
      setCorrectCount(c => c + 1);
      // Track word
      const pair = pairs.find(p => p.en === selectedEn);
      if (pair) store.trackWord({
        en: pair.en, pt: pair.pt, emoji: pair.emoji || '📝', correct: true,
        responseTime: Date.now() - answerStart.current, context: 'word-match',
        lessonId: lesson.id, lessonTitle: lesson.title, lessonOrder: lesson.order, module: lesson.module,
      });
      setSelectedPt(null); setSelectedEn(null);
      answerStart.current = Date.now();
    } else {
      // Wrong match
      SFX.wrong();
      setWrongPair([selectedPt, selectedEn]);
      setLives(l => l - 1);
      setCombo(0);
      setWrongCount(w => w + 1);
      // Track as wrong for pt item
      if (ptItem) {
        const pair = pairs.find(p => p.en === ptItem.id);
        if (pair) store.trackWord({
          en: pair.en, pt: pair.pt, emoji: pair.emoji || '📝', correct: false,
          responseTime: Date.now() - answerStart.current, context: 'word-match',
          lessonId: lesson.id, lessonTitle: lesson.title, lessonOrder: lesson.order, module: lesson.module,
        });
      }
      setTimeout(() => {
        setWrongPair(null); setSelectedPt(null); setSelectedEn(null);
        answerStart.current = Date.now();
        if (lives <= 1 && !finishedRef.current) finishGame(false);
      }, 600);
    }
  }, [selectedPt, selectedEn]);

  // Win check
  useEffect(() => {
    if (matched.size === pairs.length && pairs.length > 0 && !finishedRef.current) {
      setTimeout(() => finishGame(true), 500);
    }
  }, [matched, pairs, finishGame]);

  const allMatched = matched.size === pairs.length;

  // Tutorial
  if (showTutorial) {
    return (
      <div className="game-modal"><div className="game-modal-box">
        <div className="game-modal-icon">🔗</div>
        <div className="game-modal-title">COMO JOGAR</div>
        <div style={{ textAlign:'left', padding:'0 10px', lineHeight:1.8, fontSize:'0.9rem' }}>
          <p>1️⃣ Clique uma palavra em <b style={{color:'var(--green)'}}>português</b> 🇧🇷</p>
          <p>2️⃣ Depois clique a tradução em <b style={{color:'var(--red)'}}>inglês</b> 🇺🇸</p>
          <p>3️⃣ Combine todos os pares antes do tempo acabar! 💣</p>
        </div>
        <button className="game-modal-btn primary" onClick={() => { setShowTutorial(false); store.markTutorialSeen('word-match'); }}>COMEÇAR! 🚀</button>
      </div></div>
    );
  }

  // Game Over
  if (gameOver) {
    const acc = correctCount+wrongCount>0 ? Math.round((correctCount/(correctCount+wrongCount))*100) : 0;
    return (
      <div className="game-modal"><div className="game-modal-box">
        {recordBeat && <div className="game-record-alert">🏆 NOVO RECORDE!</div>}
        <div className="game-modal-icon">{allMatched ? '🏆' : '💀'}</div>
        <div className="game-modal-title">{allMatched ? 'PARABÉNS!' : 'GAME OVER!'}</div>
        <div className="game-modal-stats">
          {[['Score',score],['Pares',`${matched.size}/${pairs.length}`],['Precisão',`${acc}%`],['Vidas','❤️'.repeat(Math.max(lives,0))]].map(([k,v]) => (
            <div className="game-modal-stat" key={k as string}><span className="k">{k}</span><span className="v">{v}</span></div>
          ))}
        </div>
        <div className="game-xp-gained">+{xpGained} XP ⚡</div>
        <button className="game-modal-btn primary" onClick={() => window.location.reload()}>🔄 Jogar de Novo</button>
        <button className="game-modal-btn secondary" onClick={() => navigate(`/game/select/${lesson.id}`)}>🎯 Outros Jogos</button>
        <button className="game-modal-btn secondary" onClick={() => navigate('/')}>📚 Menu</button>
      </div></div>
    );
  }

  const fuseW = timer > 0 ? (timer / 30) * 100 : 0;

  return (
    <div className="game-page">
      <button className="game-pause-btn" onClick={() => setPaused(!paused)}>{paused ? '▶️' : '⏸️'}</button>
      <div className="game-title-bar"><h1>🔗 WORD MATCH</h1></div>
      <div className="game-hud">
        {[{l:'SCORE',v:score.toString()},{l:'LIVES',v:'❤️'.repeat(Math.max(lives,0))},{l:'COMBO',v:`${combo}x`},{l:'WAVE',v:wave.toString()}].map(h => (
          <div className="hud-item" key={h.l}><div className="hud-label">{h.l}</div><div className="hud-value">{h.v}</div></div>
        ))}
      </div>
      <div className="timer-bomb">
        <div className="bomb-icon">💣</div>
        <div className="bomb-fuse"><div className="bomb-fuse-fill" style={{width:`${fuseW}%`}}/></div>
        <div className="bomb-time">{Math.ceil(timer)}</div>
      </div>
      <div className="wm-cols">
        <div>
          <div className="wm-col-head pt">🇧🇷 PT</div>
          <div className="wm-col-sub">WAITING</div>
          {leftItems.map(item => {
            let cls = 'wm-btn';
            if (matched.has(item.id)) cls += ' matched';
            else if (item.text === selectedPt) cls += ' selected';
            else if (wrongPair && wrongPair[0] === item.text) cls += ' wrong';
            return <button key={item.text} className={cls} disabled={matched.has(item.id)||paused} onClick={() => { if(!matched.has(item.id)){ setSelectedPt(item.text); SFX.tick(); answerStart.current=Date.now(); }}}>{item.text.toUpperCase()}</button>;
          })}
        </div>
        <div>
          <div className="wm-col-head en">🇺🇸 EN</div>
          <div className="wm-col-sub">WAITING</div>
          {rightItems.map(item => {
            let cls = 'wm-btn';
            if (matched.has(item.id)) cls += ' matched';
            else if (item.text === selectedEn) cls += ' selected';
            else if (wrongPair && wrongPair[1] === item.text) cls += ' wrong';
            return <button key={item.text} className={cls} disabled={matched.has(item.id)||paused} onClick={() => { if(!matched.has(item.id)){ setSelectedEn(item.text); SFX.tick(); }}}>{item.text.toUpperCase()}</button>;
          })}
        </div>
      </div>
    </div>
  );
}
