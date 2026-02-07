import { useParams, useNavigate, Link } from 'react-router-dom';
import { getLessonById } from '@/data/lessons';
import { WordDropGame } from '@/components/games/WordDrop';
import { WordMatchGame } from '@/components/games/WordMatch';
import { WordStackGame } from '@/components/games/WordStack';
import type { GameMode } from '@unlock2026/shared';

export function GamePage() {
  const { mode, lessonId } = useParams<{ mode: string; lessonId: string }>();
  const navigate = useNavigate();
  const lesson = lessonId ? getLessonById(lessonId) : undefined;

  if (!lesson || !mode) {
    navigate('/', { replace: true });
    return null;
  }

  const handleFinish = () => navigate(`/game/select/${lesson.id}`);

  return (
    <div className="relative z-10 min-h-screen" style={{ paddingTop: 10 }}>
      <div style={{ padding: '0 20px', marginBottom: 10 }}>
        <Link to={`/game/select/${lesson.id}`} className="game-back-btn">← Voltar</Link>
      </div>
      {mode === 'word-drop' && <WordDropGame lesson={lesson} onFinish={handleFinish} />}
      {mode === 'word-match' && <WordMatchGame lesson={lesson} onFinish={handleFinish} />}
      {mode === 'word-stack' && <WordStackGame lesson={lesson} onFinish={handleFinish} />}
    </div>
  );
}
