import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CampaignData } from './types/campaign';
import rawData from './data/campaignData.json';
import { Header } from './components/Header';
import { JournalIndex } from './pages/JournalIndex';
import { SessionView } from './pages/SessionView';

const campaignData = rawData as CampaignData;

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="site-container">
        <Header />
        <Routes>
          <Route path="/" element={<JournalIndex data={campaignData} />} />
          <Route path="/session/:id" element={<SessionView data={campaignData} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;

