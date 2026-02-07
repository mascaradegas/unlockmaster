import { useParams, Link } from 'react-router-dom';
import { getLessonById } from '@/data/lessons';

export function SelectMode() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const lesson = lessonId ? getLessonById(lessonId) : undefined;

  return (
    <div className="relative z-10 min-h-screen" style={{ paddingTop: 20 }}>
      {/* Header */}
      <div style={{ padding: '0 20px', marginBottom: 20 }}>
        <Link
          to="/"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px',
            borderRadius: 10, border: '2px solid var(--green)', color: 'var(--green)',
            fontFamily: 'Orbitron', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none',
            background: 'rgba(0,255,136,0.08)',
          }}
        >
          ← VOLTAR
        </Link>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 30 }}>
        <p style={{ color: 'var(--gray)', fontSize: '1rem', marginBottom: 12 }}>Como você quer praticar?</p>
        {lesson && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 20px',
            borderRadius: 10, border: '2px solid var(--gold)', background: 'rgba(255,215,0,0.08)',
            fontFamily: 'Orbitron', fontWeight: 700, fontSize: '0.85rem', color: 'var(--gold)',
          }}>
            {lesson.emoji} {lesson.title}
          </div>
        )}
      </div>

      {/* Game cards */}
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        <Link to={`/game/word-drop/${lessonId}`} className="game-card purple" style={{ textDecoration: 'none' }}>
          <div className="game-icon">⬇️</div>
          <div className="game-title">WORD DROP</div>
          <div className="game-subtitle">palavras caindo</div>
          <div className="game-desc">Palavras caem do céu! Digite a tradução antes que cheguem no chão.</div>
          <div className="game-tag">💪 Treina: <strong>Velocidade</strong></div>
        </Link>

        <Link to={`/game/word-match/${lessonId}`} className="game-card green" style={{ textDecoration: 'none' }}>
          <div className="game-icon">🔗</div>
          <div className="game-title">WORD MATCH</div>
          <div className="game-subtitle">conectar pares</div>
          <div className="game-desc">Conecte Português ↔ Inglês. Encontre os pares corretos o mais rápido possível!</div>
          <div className="game-tag">💪 Treina: <strong>Memória</strong></div>
        </Link>

        <Link to={`/game/word-stack/${lessonId}`} className="game-card orange" style={{ textDecoration: 'none' }}>
          <div className="game-icon">📚</div>
          <div className="game-title">WORD STACK</div>
          <div className="game-subtitle">empilhar cartas</div>
          <div className="game-desc">Traduza palavras em sequência. Empilhe acertos e construa sua torre!</div>
          <div className="game-tag">💪 Treina: <strong>Precisão</strong></div>
        </Link>
      </div>
    </div>
  );
}
