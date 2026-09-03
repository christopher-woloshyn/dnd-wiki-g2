import React from 'react';
import { Link } from 'react-router-dom';
import { ArcData } from '../types/campaign';

interface ArcAccordionProps {
  arc: ArcData;
  isOpen: boolean;
  onToggle: () => void;
  filteredSessionIds?: Set<string>;
}

export const ArcAccordion: React.FC<ArcAccordionProps> = ({
  arc,
  isOpen,
  onToggle,
  filteredSessionIds,
}) => {
  const visibleSessions = filteredSessionIds
    ? arc.sessions.filter((s) => filteredSessionIds.has(s.id))
    : arc.sessions;

  if (visibleSessions.length === 0) {
    return null;
  }

  return (
    <div className={`arc-details ${isOpen ? 'is-open' : ''}`}>
      <div className="arc-summary" onClick={onToggle} role="button" tabIndex={0} onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle();
        }
      }}>
        <div className="arc-summary-left">
          <span className="arc-summary-chevron">▶</span>
          <span>{arc.title}</span>
        </div>
        <span className="arc-badge">
          {visibleSessions.length} {visibleSessions.length === 1 ? 'session' : 'sessions'}
        </span>
      </div>

      <div className={`arc-collapse ${isOpen ? 'is-open' : ''}`}>
        <div className="arc-collapse-inner">
          <ul className="session-list">
            {visibleSessions.map((session) => (
              <li key={session.id}>
                <Link to={`/session/${session.id}`}>
                  {session.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

