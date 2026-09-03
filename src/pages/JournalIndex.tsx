import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { CampaignData } from '../types/campaign';
import { ArcAccordion } from '../components/ArcAccordion';

interface JournalIndexProps {
  data: CampaignData;
}

export const JournalIndex: React.FC<JournalIndexProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openArcs, setOpenArcs] = useState<Record<string, boolean>>({});

  const toggleArc = (arcId: string) => {
    setOpenArcs((prev) => ({
      ...prev,
      [arcId]: !prev[arcId],
    }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    data.arcs.forEach((a) => {
      all[a.id] = true;
    });
    setOpenArcs(all);
  };

  const collapseAll = () => {
    setOpenArcs({});
  };

  // Filter sessions and arcs based on search term
  const { matchingSessionIds, matchingArcIds, matchCount } = useMemo(() => {
    const trimmed = searchTerm.trim().toLowerCase();
    if (!trimmed) {
      return {
        matchingSessionIds: null,
        matchingArcIds: null,
        matchCount: data.total_sessions,
      };
    }

    const sessionIds = new Set<string>();
    const arcIds = new Set<string>();

    data.sessions.forEach((s) => {
      if (
        s.title.toLowerCase().includes(trimmed) ||
        s.arc_title.toLowerCase().includes(trimmed) ||
        s.content_html.toLowerCase().includes(trimmed)
      ) {
        sessionIds.add(s.id);
        arcIds.add(s.arc_id);
      }
    });

    data.arcs.forEach((a) => {
      if (a.title.toLowerCase().includes(trimmed)) {
        arcIds.add(a.id);
        a.sessions.forEach((s) => sessionIds.add(s.id));
      }
    });

    return {
      matchingSessionIds: sessionIds,
      matchingArcIds: arcIds,
      matchCount: sessionIds.size,
    };
  }, [searchTerm, data]);

  // When searching, auto-expand arcs that have matches
  const isSearching = searchTerm.trim().length > 0;

  return (
    <main className="content">
      <h1>Session Journal</h1>

      <div className="search-container">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="search-input"
            placeholder="Search sessions, locations, encounters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search session notes"
          />
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          fontSize: '0.9em',
          color: '#8c714a',
        }}
      >
        <span>
          {isSearching && `Found ${matchCount} matching session${matchCount === 1 ? '' : 's'}`}
        </span>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            onClick={expandAll}
            style={{
              background: 'none',
              border: 'none',
              color: '#5c1818',
              cursor: 'pointer',
              fontFamily: 'Cinzel, serif',
              fontSize: '0.85em',
              fontWeight: 600,
            }}
          >
            Expand All
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={collapseAll}
            style={{
              background: 'none',
              border: 'none',
              color: '#5c1818',
              cursor: 'pointer',
              fontFamily: 'Cinzel, serif',
              fontSize: '0.85em',
              fontWeight: 600,
            }}
          >
            Collapse All
          </button>
        </div>
      </div>

      {data.arcs.map((arc) => {
        if (matchingArcIds && !matchingArcIds.has(arc.id)) {
          return null;
        }

        const isOpen = isSearching ? true : !!openArcs[arc.id];

        return (
          <ArcAccordion
            key={arc.id}
            arc={arc}
            isOpen={isOpen}
            onToggle={() => toggleArc(arc.id)}
            filteredSessionIds={matchingSessionIds || undefined}
          />
        );
      })}

      {isSearching && matchCount === 0 && (
        <div style={{ textAlign: 'center', padding: '32px 0', color: '#4a2c17', fontStyle: 'italic' }}>
          No chronicles matched your search for &ldquo;{searchTerm}&rdquo;.
        </div>
      )}
    </main>
  );
};

