import { Routes, Route } from 'react-router-dom';
import { Background } from './components/layout/Background';
import { Home } from './pages/Home';
import { LessonPlayer } from './pages/LessonPlayer';
import { Dashboard } from './pages/Dashboard';
import { Profile } from './pages/Profile';
import { GamePage } from './pages/GamePage';
import { SelectMode } from './pages/SelectMode';
import { DailyDrill } from './pages/DailyDrill';
import { WarmUp } from './pages/WarmUp';
import { Homework } from './pages/Homework';

export default function App() {
  return (
    <>
      <Background />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lesson/:id" element={<LessonPlayer />} />
        <Route path="/homework/:id" element={<Homework />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/daily-drill" element={<DailyDrill />} />
        <Route path="/warmup/:mode/:lessonId" element={<WarmUp />} />
        <Route path="/game/select/:lessonId" element={<SelectMode />} />
        <Route path="/game/:mode/:lessonId" element={<GamePage />} />
      </Routes>
    </>
  );
}
