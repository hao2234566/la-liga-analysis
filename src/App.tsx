import { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HeroSection from './sections/HeroSection';
import StandingsSection from './sections/StandingsSection';
import TeamAnalysisSection from './sections/TeamAnalysisSection';
import PlayerAnalysisSection from './sections/PlayerAnalysisSection';
import PredictionSection from './sections/PredictionSection';
import LiveDataSection from './sections/LiveDataSection';

interface AppData {
  standings: any[];
  radar: Record<string, Record<string, number>>;
  offense: any[];
  goalsData: any[];
  teamStyle: any[];
  topScorers: any[];
  topAssists: any[];
  topRated: any[];
  xgAnalysis: any[];
  positionStats: Record<string, Record<string, number>>;
  championPoints: Record<string, number>;
  summary: {
    totalTeams: number;
    currentRound: number;
    leader: string;
    leaderPoints: number;
    topScorer: string;
    topScorerGoals: number;
  };
}

function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data.json')
      .then(res => res.json())
      .then((json: AppData) => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load data:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#e6005c] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#a0a0b0]">加载数据中...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
        <p className="text-[#e6005c]">数据加载失败</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0f' }}>
      <Navbar />
      <HeroSection summary={data.summary} />
      <StandingsSection standings={data.standings} />
      <TeamAnalysisSection
        radar={data.radar}
        offense={data.offense}
        goalsData={data.goalsData}
        teamStyle={data.teamStyle}
      />
      <PlayerAnalysisSection
        topScorers={data.topScorers}
        topAssists={data.topAssists}
        topRated={data.topRated}
        xgAnalysis={data.xgAnalysis}
        positionStats={data.positionStats}
      />
      <PredictionSection championPoints={data.championPoints} goalsData={data.goalsData} />
      <LiveDataSection />
      <Footer />
    </div>
  );
}

export default App;
