import { Link, useNavigate } from 'react-router-dom';
import { SessionData } from '../types/campaign';

interface SessionNavBarProps {
  sessions: SessionData[];
  currentIndex: number;
  onNavigate?: (targetId: string, direction: 'next' | 'prev') => void;
  position?: 'top' | 'bottom';
}

export const SessionNavBar = ({
  sessions,
  currentIndex,
  onNavigate,
  position = 'bottom',
}: SessionNavBarProps) => {
  const navigate = useNavigate();
  const currentSession = sessions[currentIndex];
  const prevSession = currentIndex > 0 ? sessions[currentIndex - 1] : null;
  const nextSession = currentIndex < sessions.length - 1 ? sessions[currentIndex + 1] : null;

  const handlePrevClick = (e: React.MouseEvent) => {
    if (prevSession) {
      if (onNavigate) {
        e.preventDefault();
        onNavigate(prevSession.id, 'prev');
      }
    }
  };

  const handleNextClick = (e: React.MouseEvent) => {
    if (nextSession) {
      if (onNavigate) {
        e.preventDefault();
        onNavigate(nextSession.id, 'next');
      }
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const targetId = e.target.value;
    if (!targetId) return;

    if (onNavigate) {
      const targetIndex = sessions.findIndex((s) => s.id === targetId);
      const direction = targetIndex >= currentIndex ? 'next' : 'prev';
      onNavigate(targetId, direction);
    } else {
      navigate(`/session/${targetId}`);
    }
  };

  return (
    <nav
      className={`session-nav-bar ${position === 'top' ? 'session-nav-bar-top' : ''}`}
      aria-label="Session navigation"
    >
      {prevSession ? (
        <Link
          to={`/session/${prevSession.id}`}
          className="nav-btn prev-session"
          onClick={handlePrevClick}
        >
          ← Previous
        </Link>
      ) : (
        <button className="nav-btn prev-session" disabled>
          ← Previous
        </button>
      )}

      <select
        className="session-select"
        value={currentSession ? currentSession.id : ''}
        onChange={handleSelectChange}
        aria-label="Select session to jump to"
      >
        {sessions.map((s) => (
          <option key={s.id} value={s.id}>
            {s.title}
          </option>
        ))}
      </select>

      {nextSession ? (
        <Link
          to={`/session/${nextSession.id}`}
          className="nav-btn next-session"
          onClick={handleNextClick}
        >
          Next →
        </Link>
      ) : (
        <button className="nav-btn next-session" disabled>
          Next →
        </button>
      )}
    </nav>
  );
};
