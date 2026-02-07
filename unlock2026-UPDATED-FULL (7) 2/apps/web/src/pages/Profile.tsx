import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { useProgressStore } from '@/stores/progressStore';
import { getLevelInfo, getXPForNextLevel, ACHIEVEMENTS } from '@unlock2026/shared';

const AVATARS = ['🧑‍🎓','👨‍💻','👩‍💼','🦸','🧙','🧑‍🚀','🎅','🤠','🦊','🐻','🐺','🦅','🔥','⭐','💎','🎯'];

export function Profile() {
  const store = useProgressStore();
  const levelInfo = getLevelInfo(store.level);
  const nextLevel = getXPForNextLevel(store.xp);
  const wordCounts = store.getWordCounts();
  const weakWords = store.getWeakWords(10);
  const reviewWords = store.getWordsForReview().slice(0, 10);
  const achievements = store.getAchievements();
  const [showAvatars, setShowAvatars] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const hours = Math.floor(store.totalTimeSpent / 3600);
  const minutes = Math.floor((store.totalTimeSpent % 3600) / 60);
  const timeStr = hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;

  // Activity heatmap (last 30 days)
  const heatmap = useMemo(() => {
    const days: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = store.sessions.filter(s => s.date.startsWith(dateStr)).length;
      days.push({ date: dateStr, count });
    }
    return days;
  }, [store.sessions]);

  // XP donut
  const xpProgress = nextLevel ? (nextLevel.progress ?? 0) : 100;
  const circumference = 2 * Math.PI * 45;
  const dashOffset = circumference - (circumference * xpProgress) / 100;

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className="relative z-10 min-h-screen pb-20">
      <Header title="👤 Perfil" backTo="/" />

      <div className="max-w-2xl mx-auto px-5 space-y-6">
        {/* Profile Card */}
        <div className="unlock-card unlock-card-purple p-6 text-center">
          <button onClick={() => setShowAvatars(!showAvatars)} style={{ fontSize:'3.5rem', background:'none', border:'none', cursor:'pointer' }}>
            {store.avatar}
          </button>
          {showAvatars && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center', margin:'8px 0' }}>
              {AVATARS.map(a => (
                <button key={a} onClick={() => { store.importFromSync({ ...store.exportForSync(), avatar: a } as any); setShowAvatars(false); }}
                  style={{ fontSize:'1.8rem', background: a===store.avatar ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.05)', border: a===store.avatar ? '2px solid var(--gold)' : '2px solid transparent', borderRadius:8, padding:'4px 6px', cursor:'pointer' }}>
                  {a}
                </button>
              ))}
            </div>
          )}
          <h2 className="text-xl font-bold">{store.name || 'Estudante'}</h2>
          <p className="text-unlock-gray text-sm">{levelInfo.emoji} {levelInfo.title} — Nível {store.level}</p>
        </div>

        {/* XP Donut + Stats */}
        <div className="unlock-card p-6">
          <div style={{ display:'flex', alignItems:'center', gap:24 }}>
            {/* Donut */}
            <svg width="110" height="110" viewBox="0 0 110 110" style={{ flexShrink:0 }}>
              <circle cx="55" cy="55" r="45" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8"/>
              <circle cx="55" cy="55" r="45" fill="none" stroke="var(--gold)" strokeWidth="8"
                strokeDasharray={circumference} strokeDashoffset={dashOffset}
                strokeLinecap="round" transform="rotate(-90 55 55)" style={{ transition:'stroke-dashoffset 0.5s' }}/>
              <text x="55" y="50" textAnchor="middle" fill="var(--gold)" fontFamily="Orbitron" fontSize="14" fontWeight="700">{store.xp}</text>
              <text x="55" y="68" textAnchor="middle" fill="var(--gray)" fontSize="10">XP</text>
            </svg>
            {/* Stats grid */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px 20px', flex:1 }}>
              <div><div style={{ fontSize:'0.7rem', color:'var(--gray)' }}>Nível</div><div style={{ fontFamily:'Orbitron', fontWeight:700, color:'var(--gold)' }}>{store.level}</div></div>
              <div><div style={{ fontSize:'0.7rem', color:'var(--gray)' }}>Streak</div><div style={{ fontFamily:'Orbitron', fontWeight:700, color:'var(--red)' }}>🔥 {store.streak}</div></div>
              <div><div style={{ fontSize:'0.7rem', color:'var(--gray)' }}>Aulas</div><div style={{ fontFamily:'Orbitron', fontWeight:700, color:'var(--green)' }}>{store.lessonsCompleted.length}</div></div>
              <div><div style={{ fontSize:'0.7rem', color:'var(--gray)' }}>Tempo</div><div style={{ fontFamily:'Orbitron', fontWeight:700, color:'var(--cyan)' }}>{timeStr}</div></div>
              <div><div style={{ fontSize:'0.7rem', color:'var(--gray)' }}>Sessões</div><div style={{ fontFamily:'Orbitron', fontWeight:700 }}>{store.sessionsCount}</div></div>
              <div><div style={{ fontSize:'0.7rem', color:'var(--gray)' }}>Recorde</div><div style={{ fontFamily:'Orbitron', fontWeight:700, color:'var(--gold)' }}>🔥 {store.longestStreak}d</div></div>
            </div>
          </div>
          {nextLevel && (
            <div style={{ marginTop:12, fontSize:'0.75rem', color:'var(--gray)', textAlign:'center' }}>
              {nextLevel.needed} XP para nível {store.level + 1}
            </div>
          )}
        </div>

        {/* Activity Heatmap */}
        <div className="unlock-card p-6">
          <h3 className="font-title text-sm text-unlock-green mb-4">📊 Atividade (30 dias)</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(10, 1fr)', gap:4 }}>
            {heatmap.map((d, i) => {
              const intensity = d.count === 0 ? 0 : d.count <= 1 ? 1 : d.count <= 3 ? 2 : 3;
              const bg = ['rgba(255,255,255,0.05)', 'rgba(0,255,136,0.2)', 'rgba(0,255,136,0.45)', 'rgba(0,255,136,0.75)'][intensity];
              const day = new Date(d.date).getDate();
              return (
                <div key={i} title={`${d.date}: ${d.count} sessões`}
                  style={{ aspectRatio:'1', borderRadius:4, background:bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.55rem', color:'var(--gray)' }}>
                  {day}
                </div>
              );
            })}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:8, fontSize:'0.7rem', color:'var(--gray)', justifyContent:'flex-end' }}>
            <span>Menos</span>
            {[0,1,2,3].map(i => <div key={i} style={{ width:12, height:12, borderRadius:3, background:['rgba(255,255,255,0.05)','rgba(0,255,136,0.2)','rgba(0,255,136,0.45)','rgba(0,255,136,0.75)'][i] }}/>)}
            <span>Mais</span>
          </div>
        </div>

        {/* Word Mastery Grid */}
        <div className="unlock-card p-6">
          <h3 className="font-title text-sm text-unlock-cyan mb-4">📝 Domínio de Palavras ({wordCounts.total})</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
            {[
              { label:'Dominadas', count:wordCounts.mastered, color:'#00FF88', emoji:'✅' },
              { label:'Fortes', count:wordCounts.strong, color:'#88FF00', emoji:'💪' },
              { label:'Aprendendo', count:wordCounts.learning, color:'#FFD700', emoji:'📚' },
              { label:'Fracas', count:wordCounts.weak, color:'#FF8C00', emoji:'⚠️' },
              { label:'Críticas', count:wordCounts.critical, color:'#FF4444', emoji:'🔴' },
              { label:'Para Revisão', count:wordCounts.forReview, color:'#00DDFF', emoji:'🔄' },
            ].map(item => (
              <div key={item.label} style={{ background:'rgba(255,255,255,0.03)', borderRadius:10, padding:'12px 8px', textAlign:'center', border:`1px solid ${item.color}22` }}>
                <div style={{ fontSize:'1.2rem' }}>{item.emoji}</div>
                <div style={{ fontFamily:'Orbitron', fontSize:'1.1rem', fontWeight:700, color:item.color }}>{item.count}</div>
                <div style={{ fontSize:'0.65rem', color:'var(--gray)', marginTop:2 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Weak Words */}
        {weakWords.length > 0 && (
          <div className="unlock-card unlock-card-red p-6">
            <h3 className="font-title text-sm text-unlock-red mb-4">⚠️ Palavras Mais Difíceis</h3>
            <div className="space-y-2">
              {weakWords.map((w, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-2">
                    <span>{w.emoji}</span>
                    <span className="font-semibold">{w.en}</span>
                    <span className="text-unlock-gray text-sm">({w.pt})</span>
                  </div>
                  <span className="text-unlock-red text-sm font-mono">{Math.round(w.errorRate*100)}% erro</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Achievements */}
        <div className="unlock-card p-6">
          <h3 className="font-title text-sm text-unlock-gold mb-4">🏆 Conquistas ({unlockedCount}/{achievements.length})</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(80px, 1fr))', gap:8 }}>
            {achievements.map(a => (
              <div key={a.id} title={`${a.title}: ${a.desc}`}
                style={{
                  textAlign:'center', padding:'10px 4px', borderRadius:10,
                  background: a.unlocked ? 'rgba(255,215,0,0.08)' : 'rgba(255,255,255,0.02)',
                  border: a.unlocked ? '1px solid rgba(255,215,0,0.3)' : '1px solid rgba(255,255,255,0.05)',
                  opacity: a.unlocked ? 1 : 0.4,
                }}>
                <div style={{ fontSize:'1.5rem' }}>{a.emoji}</div>
                <div style={{ fontSize:'0.6rem', color: a.unlocked ? 'var(--gold)' : 'var(--gray)', marginTop:4, lineHeight:1.2 }}>{a.title}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Words for Review */}
        {reviewWords.length > 0 && (
          <div className="unlock-card unlock-card-cyan p-6">
            <h3 className="font-title text-sm text-unlock-cyan mb-4">🔄 Prontas para Revisão ({reviewWords.length})</h3>
            <div className="flex flex-wrap gap-2">
              {reviewWords.map((w, i) => (
                <span key={i} className="px-3 py-1.5 rounded-full bg-unlock-cyan/10 border border-unlock-cyan/30 text-sm font-medium">
                  {w.emoji} {w.en}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Export / Import */}
        <div className="unlock-card p-6">
          <h3 className="font-title text-sm text-unlock-gold mb-4">💾 Dados</h3>
          <div style={{ display:'flex', gap:12 }}>
            <button onClick={() => {
              const data = JSON.stringify(store.exportForSync(), null, 2);
              const blob = new Blob([data], { type:'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = `unlock2026-backup-${new Date().toISOString().split('T')[0]}.json`; a.click();
              URL.revokeObjectURL(url);
            }}
              style={{ flex:1, padding:'10px 16px', background:'rgba(0,255,136,0.1)', border:'2px solid var(--green)', borderRadius:10, color:'var(--green)', fontFamily:'Orbitron', fontWeight:700, fontSize:'0.75rem', cursor:'pointer' }}>
              📤 Exportar
            </button>
            <button onClick={() => setShowExport(!showExport)}
              style={{ flex:1, padding:'10px 16px', background:'rgba(0,200,255,0.1)', border:'2px solid var(--cyan)', borderRadius:10, color:'var(--cyan)', fontFamily:'Orbitron', fontWeight:700, fontSize:'0.75rem', cursor:'pointer' }}>
              📥 Importar
            </button>
          </div>
          {showExport && (
            <div style={{ marginTop:12 }}>
              <textarea id="importData" placeholder="Cole o JSON do backup aqui..." rows={4}
                style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:10, color:'white', fontSize:'0.8rem', resize:'vertical', boxSizing:'border-box' }} />
              <button onClick={() => {
                const el = document.getElementById('importData') as HTMLTextAreaElement;
                try {
                  const data = JSON.parse(el.value);
                  store.importFromSync(data);
                  alert('✅ Dados importados!');
                  setShowExport(false);
                } catch { alert('❌ JSON inválido'); }
              }}
                style={{ marginTop:8, padding:'8px 16px', background:'var(--cyan)', color:'#000', borderRadius:8, border:'none', fontFamily:'Orbitron', fontWeight:700, fontSize:'0.75rem', cursor:'pointer' }}>
                Importar Dados
              </button>
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="unlock-card p-6">
          <h3 className="font-title text-sm text-unlock-gold mb-4">⚙️ Configurações</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span>Meta diária</span><span className="text-unlock-gold">{store.settings.dailyGoal} min</span></div>
            <div className="flex justify-between"><span>Efeitos sonoros</span><span>{store.settings.soundEffects ? '✅' : '❌'}</span></div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="text-center">
          <button onClick={() => { if (window.confirm('⚠️ Isso vai apagar TODO seu progresso. Tem certeza?')) store.reset(); }}
            className="text-unlock-red/50 text-xs hover:text-unlock-red transition-colors">
            Resetar Progresso
          </button>
        </div>
      </div>
    </div>
  );
}
