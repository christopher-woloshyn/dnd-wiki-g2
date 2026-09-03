import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CampaignData } from '../types/campaign';
import { SessionNavBar } from '../components/SessionNavBar';

interface SessionViewProps {
  data: CampaignData;
}

export const SessionView: React.FC<SessionViewProps> = ({ data }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const currentIndex = data.sessions.findIndex((s) => s.id === id);
  const session = currentIndex !== -1 ? data.sessions[currentIndex] : null;

  // Track navigation states for slide-out and slide-in
  const [prevIndex, setPrevIndex] = useState(currentIndex);
  const [entranceDir, setEntranceDir] = useState<'right' | 'left' | 'fade'>('fade');
  const [exitDir, setExitDir] = useState<'left' | 'right' | null>(null);

  const isTransitioningRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  if (prevIndex !== currentIndex) {
    setEntranceDir(currentIndex > prevIndex ? 'right' : 'left');
    setExitDir(null);
    setPrevIndex(currentIndex);
    isTransitioningRef.current = false;
  }

  // Scroll to top on session change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Clean up any pending timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleNavigate = (targetId: string, direction: 'next' | 'prev') => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    // Next -> slide out to the left and fade away
    // Prev -> slide out to the right and fade away
    setExitDir(direction === 'next' ? 'left' : 'right');

    timerRef.current = window.setTimeout(() => {
      navigate(`/session/${targetId}`);
    }, 180);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') {
        return;
      }

      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        handleNavigate(data.sessions[currentIndex - 1].id, 'prev');
      } else if (e.key === 'ArrowRight' && currentIndex < data.sessions.length - 1) {
        handleNavigate(data.sessions[currentIndex + 1].id, 'next');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, data.sessions]);

  if (!session) {
    return (
      <main className="content">
        <h1>Chronicle Not Found</h1>
        <p style={{ textAlign: 'center', margin: '32px 0' }}>
          The requested session notes could not be found in the archives.
        </p>
        <div style={{ textAlign: 'center' }}>
          <Link to="/" style={{ fontFamily: 'Cinzel, serif', fontWeight: 700 }}>
            ← Return to Session Journal
          </Link>
        </div>
      </main>
    );
  }

  const animationClass = exitDir
    ? `slide-out-${exitDir}`
    : entranceDir === 'right'
    ? 'slide-in-right'
    : entranceDir === 'left'
    ? 'slide-in-left'
    : 'page-fade-in';

  return (
    <main className={`content ${animationClass}`} key={session.id}>
      <SessionNavBar
        sessions={data.sessions}
        currentIndex={currentIndex}
        onNavigate={handleNavigate}
        position="top"
      />

      <h1>{session.title}</h1>

      <div
        className="session-body"
        dangerouslySetInnerHTML={{ __html: session.content_html }}
      />

      <SessionNavBar
        sessions={data.sessions}
        currentIndex={currentIndex}
        onNavigate={handleNavigate}
        position="bottom"
      />
    </main>
  );
};
