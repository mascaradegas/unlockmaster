import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type {
  Slide,
  TitleSlide,
  SituationSlide,
  RuleSlide,
  TipSlide,
  ExampleSlide,
  ExamplesSlide,
  ComparisonSlide,
  QuizSlide,
  FillBlankSlide,
  ListSlide,
} from '@unlock2026/shared';
import { SFX } from '@/utils/sounds';

interface SlideRendererProps {
  slide: Slide;
  lessonId?: string;
  lessonTitle?: string;
}

export function SlideRenderer({ slide, lessonId, lessonTitle }: SlideRendererProps) {
  const cardClass = 'cardClass' in slide && slide.cardClass ? slide.cardClass : '';

  switch (slide.type) {
    case 'title':
      return <TitleView slide={slide} lessonId={lessonId} />;
    case 'situation':
      return <SituationView slide={slide} />;
    case 'rule':
      return <RuleView slide={slide} cardClass={cardClass} />;
    case 'tip':
      return <TipView slide={slide} cardClass={cardClass} />;
    case 'example':
      return <ExampleView slide={slide} cardClass={cardClass} />;
    case 'examples':
      return <ExamplesView slide={slide} cardClass={cardClass} />;
    case 'comparison':
      return <ComparisonView slide={slide} cardClass={cardClass} />;
    case 'quiz':
      return <QuizView slide={slide} cardClass={cardClass} />;
    case 'fill-blank':
      return <FillBlankView slide={slide} cardClass={cardClass} />;
    case 'list':
      return <ListView slide={slide} cardClass={cardClass} />;
    case 'end':
      return <EndView lessonId={lessonId} lessonTitle={lessonTitle} />;
    default:
      return null;
  }
}

// ─── Title Slide ──────────────────────────────────────────────────────────

function TitleView({ slide, lessonId }: { slide: TitleSlide; lessonId?: string }) {
  const navigate = useNavigate();

  return (
    <div className="unlock-card unlock-card-gold" style={{ padding: '40px 28px', textAlign: 'center' }}>
      <div className="emoji-big" style={{ marginBottom: 16 }}>{slide.emoji}</div>
      <h1 className="slide-title-text" style={{ marginBottom: 10 }}>{slide.title}</h1>
      <p style={{ fontSize: '1.4rem', color: 'var(--gray)', marginBottom: 20 }}>{slide.subtitle}</p>
      {lessonId && (
        <button
          onClick={() => navigate(`/homework/${lessonId}`)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '14px 28px', borderRadius: 12,
            background: 'linear-gradient(135deg, var(--cyan), #0090cc)',
            color: 'white', border: 'none',
            fontWeight: 900, fontSize: '1rem', cursor: 'pointer',
            boxShadow: '0 0 20px rgba(0,191,255,0.3)',
          }}
        >
          📝 HOMEWORK
        </button>
      )}
    </div>
  );
}

// ─── Situation Slide ──────────────────────────────────────────────────────

function SituationView({ slide }: { slide: SituationSlide }) {
  return (
    <div className="slide-situation-box">
      <div className="emoji-situation" style={{ marginBottom: 14 }}>{slide.emoji}</div>
      <div
        style={{ fontSize: '1.85rem', lineHeight: 1.6, fontStyle: 'italic', color: 'var(--white)' }}
        dangerouslySetInnerHTML={{ __html: slide.text }}
      />
    </div>
  );
}

// ─── Rule Slide ───────────────────────────────────────────────────────────

function RuleView({ slide, cardClass }: { slide: RuleSlide; cardClass: string }) {
  return (
    <div className={`unlock-card unlock-card-${cardClass}`} style={{ padding: '28px 24px', textAlign: 'center' }}>
      <div
        style={{ fontSize: '1.9rem', lineHeight: 1.7, marginBottom: 14 }}
        dangerouslySetInnerHTML={{ __html: slide.text }}
      />
      <div className="slide-keyword" style={{ margin: '14px 0' }}>{slide.keyword}</div>
      {slide.keywordAfter && (
        <p style={{ fontSize: '1.6rem', color: 'var(--gray)', marginTop: 8 }}>{slide.keywordAfter}</p>
      )}
    </div>
  );
}

// ─── Tip Slide ────────────────────────────────────────────────────────────

function TipView({ slide, cardClass }: { slide: TipSlide; cardClass: string }) {
  return (
    <div className={`unlock-card unlock-card-${cardClass}`} style={{ padding: '28px 24px' }}>
      <div className="slide-tip-box">
        <span className="slide-tip-icon">{slide.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{
            fontWeight: 700, color: 'var(--gold)', fontSize: '1.7rem',
            marginBottom: 12, textTransform: 'uppercase' as const, letterSpacing: 1,
          }}>
            {slide.title}
          </div>
          <div
            style={{ fontSize: '1.9rem', lineHeight: 1.6 }}
            dangerouslySetInnerHTML={{ __html: slide.text }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Example Slide (single) ──────────────────────────────────────────────

function ExampleView({ slide, cardClass }: { slide: ExampleSlide; cardClass: string }) {
  return (
    <div className={`unlock-card unlock-card-${cardClass}`} style={{ padding: '28px 24px' }}>
      <div className="emoji-big" style={{ marginBottom: 12 }}>{slide.emoji}</div>

      <div className="slide-example-box" style={{ marginBottom: 12 }}>
        <div
          style={{ fontSize: '2.1rem', fontWeight: 600, marginBottom: 6 }}
          dangerouslySetInnerHTML={{ __html: slide.question }}
        />
        <div style={{ fontSize: '1.5rem', color: 'var(--gray)' }}>{slide.questionTr}</div>
      </div>

      <div className="slide-example-box response">
        <div style={{ fontSize: '2.1rem', fontWeight: 600, color: 'var(--green)', marginBottom: 6 }}>
          {slide.answer}
        </div>
        <div style={{ fontSize: '1.5rem', color: 'var(--gray)' }}>{slide.answerTr}</div>
      </div>
    </div>
  );
}

// ─── Examples Slide (multi) ──────────────────────────────────────────────

function ExamplesView({ slide, cardClass }: { slide: ExamplesSlide; cardClass: string }) {
  return (
    <div className={`unlock-card unlock-card-${cardClass}`} style={{ padding: '28px 24px' }}>
      <h3 style={{
        fontFamily: 'Orbitron, sans-serif', fontWeight: 700, fontSize: '1.1rem',
        color: 'var(--gold)', marginBottom: 16,
      }}>
        {slide.title}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {slide.items.map((item, i) => (
          <div key={i} className="slide-example-row">
            <span style={{ fontSize: '2.4rem', flexShrink: 0 }}>{item.emoji}</span>
            <div style={{ flex: 1 }}>
              <div
                style={{ fontSize: '1.75rem', fontWeight: 600 }}
                dangerouslySetInnerHTML={{ __html: item.en }}
              />
              <div style={{ fontSize: '1.35rem', color: 'var(--gray)' }}>{item.pt}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Comparison Slide ────────────────────────────────────────────────────

function ComparisonView({ slide, cardClass }: { slide: ComparisonSlide; cardClass: string }) {
  return (
    <div className={`unlock-card unlock-card-${cardClass}`} style={{ padding: '28px 24px' }}>
      <h3 style={{
        fontFamily: 'Orbitron, sans-serif', fontWeight: 700, fontSize: '1.1rem',
        color: 'var(--gold)', textAlign: 'center', marginBottom: 16,
      }}>
        {slide.title}
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Left box */}
        <div className={`compare-box ${slide.leftClass}`}>
          <div style={{
            fontSize: '1.1rem', fontWeight: 700, textTransform: 'uppercase' as const,
            letterSpacing: 2, marginBottom: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            color: slide.leftClass === 'wrong' ? 'var(--red)' :
                   slide.leftClass === 'left-side' ? 'var(--cyan)' : 'var(--gray)',
          }}>
            <span style={{ fontSize: '1.6rem' }}>{slide.leftIcon}</span>
            {slide.leftLabel}
          </div>
          <div
            style={{ fontSize: '1.6rem', fontWeight: 600 }}
            dangerouslySetInnerHTML={{ __html: slide.left }}
          />
          <div style={{ fontSize: '1.1rem', color: 'var(--gray)', marginTop: 8 }}>{slide.leftNote}</div>
        </div>

        {/* Right box */}
        <div className={`compare-box ${slide.rightClass}`}>
          <div style={{
            fontSize: '1.1rem', fontWeight: 700, textTransform: 'uppercase' as const,
            letterSpacing: 2, marginBottom: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            color: slide.rightClass === 'right' ? 'var(--green)' :
                   slide.rightClass === 'right-side' ? 'var(--purple)' : 'var(--gray)',
          }}>
            <span style={{ fontSize: '1.6rem' }}>{slide.rightIcon}</span>
            {slide.rightLabel}
          </div>
          <div
            style={{ fontSize: '1.6rem', fontWeight: 600 }}
            dangerouslySetInnerHTML={{ __html: slide.right }}
          />
          <div style={{ fontSize: '1.1rem', color: 'var(--gray)', marginTop: 8 }}>{slide.rightNote}</div>
        </div>
      </div>

      {slide.explanation && (
        <div
          style={{ textAlign: 'center', fontSize: '1.3rem', color: 'var(--white)', lineHeight: 1.6 }}
          dangerouslySetInnerHTML={{ __html: slide.explanation }}
        />
      )}
    </div>
  );
}

// ─── Quiz Slide ──────────────────────────────────────────────────────────

function QuizView({ slide, cardClass }: { slide: QuizSlide; cardClass: string }) {
  const [selected, setSelected] = useState<number | null>(null);
  const isCorrect = selected === slide.correct;

  const handleSelect = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    if (i === slide.correct) SFX.correct();
    else SFX.wrong();
  };

  return (
    <div className={`unlock-card unlock-card-${cardClass}`} style={{ padding: '28px 24px' }}>
      <h3
        style={{ fontSize: '1.6rem', fontWeight: 600, textAlign: 'center', marginBottom: 18 }}
        dangerouslySetInnerHTML={{ __html: slide.question }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {slide.options.map((opt, i) => {
          let cls = 'slide-quiz-option';
          if (selected !== null) {
            if (i === slide.correct) cls += ' correct';
            else if (i === selected && !isCorrect) cls += ' wrong';
            else cls += ' dimmed';
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              className={cls}
              disabled={selected !== null}
            >
              <span style={{ fontFamily: 'Orbitron', fontWeight: 700, fontSize: '0.85rem', opacity: 0.5 }}>
                {String.fromCharCode(65 + i)})
              </span>
              {opt}
            </button>
          );
        })}
      </div>
      {selected !== null && (
        <div style={{
          textAlign: 'center', marginTop: 16, fontSize: '1.3rem', fontWeight: 900,
          color: isCorrect ? 'var(--green)' : 'var(--red)',
        }}>
          {isCorrect ? '✅ Correto!' : `❌ Resposta: ${slide.options[slide.correct]}`}
        </div>
      )}
    </div>
  );
}

// ─── Fill-in-the-Blank Slide ─────────────────────────────────────────────

function FillBlankView({ slide, cardClass }: { slide: FillBlankSlide; cardClass: string }) {
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const isCorrect = answer.trim().toLowerCase() === slide.correctWord.toLowerCase();

  const handleSubmit = () => {
    if (!answer.trim()) return;
    setSubmitted(true);
    if (isCorrect) SFX.correct();
    else SFX.wrong();
  };

  return (
    <div className={`unlock-card unlock-card-${cardClass}`} style={{ padding: '28px 24px', textAlign: 'center' }}>
      <p style={{ fontSize: '1.6rem', marginBottom: 8 }}>{slide.prompt}</p>
      <p style={{ fontSize: '2.2rem', fontWeight: 600, marginBottom: 24 }}>
        {slide.sentence.replace('_____', submitted ? slide.correctWord : '_____')}
      </p>

      {!submitted ? (
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Digite aqui..."
            style={{
              padding: '14px 20px', borderRadius: 12,
              background: 'rgba(0,191,255,0.08)', border: '2px solid rgba(0,191,255,0.35)',
              color: 'var(--white)', textAlign: 'center', fontSize: '1.2rem',
              fontWeight: 700, outline: 'none', width: 200,
            }}
            autoFocus
          />
          <button
            onClick={handleSubmit}
            disabled={!answer.trim()}
            style={{
              padding: '14px 24px', borderRadius: 12,
              background: answer.trim() ? 'linear-gradient(135deg, var(--cyan), var(--green))' : 'rgba(255,255,255,0.1)',
              color: answer.trim() ? '#0a1628' : 'var(--gray)',
              border: 'none', fontWeight: 900, fontSize: '1rem', cursor: answer.trim() ? 'pointer' : 'default',
            }}
          >
            Verificar
          </button>
        </div>
      ) : (
        <div style={{
          fontSize: '1.3rem', fontWeight: 900,
          color: isCorrect ? 'var(--green)' : 'var(--red)',
        }}>
          {isCorrect ? '✅ Correto!' : `❌ Resposta: ${slide.correctWord}`}
        </div>
      )}
    </div>
  );
}

// ─── List Slide ──────────────────────────────────────────────────────────

function ListView({ slide, cardClass }: { slide: ListSlide; cardClass: string }) {
  return (
    <div className={`unlock-card unlock-card-${cardClass}`} style={{ padding: '28px 24px' }}>
      <h3 style={{
        fontFamily: 'Orbitron, sans-serif', fontWeight: 700, fontSize: '1.1rem',
        color: 'var(--gold)', marginBottom: 14,
      }}>
        {slide.title}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {slide.items.map((item, i) => (
          <div key={i} className="slide-list-item">
            <span style={{ fontSize: '2.2rem', flexShrink: 0 }}>{item.emoji}</span>
            <div
              style={{ fontSize: '1.6rem' }}
              dangerouslySetInnerHTML={{ __html: item.text }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── End Slide (AULA COMPLETA) ───────────────────────────────────────────

function EndView({ lessonId, lessonTitle }: { lessonId?: string; lessonTitle?: string }) {
  const navigate = useNavigate();

  return (
    <div className="unlock-card unlock-card-gold" style={{ padding: '40px 28px', textAlign: 'center' }}>
      <div className="emoji-big" style={{ marginBottom: 16 }}>🎉</div>
      <h1 className="slide-title-text" style={{ marginBottom: 10 }}>AULA COMPLETA!</h1>
      <p style={{ fontSize: '1.4rem', color: 'var(--gray)', marginBottom: 24 }}>
        Você terminou a aula de <strong style={{ color: 'var(--white)' }}>{lessonTitle || ''}</strong>
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        {lessonId && (
          <button
            onClick={() => navigate(`/homework/${lessonId}`)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 24px', borderRadius: 12,
              background: 'linear-gradient(135deg, var(--cyan), #0090cc)',
              color: 'white', border: 'none',
              fontWeight: 900, fontSize: '1rem', cursor: 'pointer',
              boxShadow: '0 0 20px rgba(0,191,255,0.3)',
            }}
          >
            📝 HOMEWORK
          </button>
        )}
        {lessonId && (
          <button
            onClick={() => navigate(`/game/select/${lessonId}`)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 24px', borderRadius: 12,
              background: 'linear-gradient(135deg, var(--green), #00cc6a)',
              color: '#0a1628', border: 'none',
              fontWeight: 900, fontSize: '1rem', cursor: 'pointer',
              boxShadow: '0 0 20px rgba(0,255,136,0.3)',
            }}
          >
            🎮 TREINAR
          </button>
        )}
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '14px 24px', borderRadius: 12,
            background: 'linear-gradient(135deg, var(--gold), var(--orange))',
            color: '#0a1628', border: 'none',
            fontWeight: 900, fontSize: '1rem', cursor: 'pointer',
            boxShadow: '0 0 20px rgba(255,215,0,0.3)',
          }}
        >
          📚 MAIS AULAS
        </button>
      </div>
    </div>
  );
}
