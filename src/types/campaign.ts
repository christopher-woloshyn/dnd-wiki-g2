export interface SessionSummary {
  id: string;
  title: string;
  order: number;
}

export interface ArcData {
  id: string;
  title: string;
  session_count: number;
  sessions: SessionSummary[];
}

export interface SessionData {
  id: string;
  arc_id: string;
  arc_title: string;
  title: string;
  order: number;
  content_html: string;
}

export interface CampaignData {
  generated_at: string | null;
  total_arcs: number;
  total_sessions: number;
  arcs: ArcData[];
  sessions: SessionData[];
}

