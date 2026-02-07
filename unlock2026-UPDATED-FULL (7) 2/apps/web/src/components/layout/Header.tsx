import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  backTo?: string;
  rightContent?: React.ReactNode;
}

export function Header({ title, showBack = true, backTo, rightContent }: HeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="relative z-10 flex items-center gap-4 p-5">
      {showBack && (
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full
                     bg-white/[0.08] border-2 border-unlock-gold text-unlock-gold
                     font-semibold text-sm transition-all hover:bg-unlock-gold hover:text-black"
        >
          ← Voltar
        </button>
      )}
      {title && (
        <h1 className="font-title font-bold text-xl text-unlock-gold">{title}</h1>
      )}
      {rightContent && <div className="ml-auto">{rightContent}</div>}
    </header>
  );
}
