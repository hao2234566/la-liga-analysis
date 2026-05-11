import { useEffect, useRef, useState } from 'react';
import { Wifi, Settings, RefreshCw, Database, Cloud, AlertCircle, CheckCircle, ArrowRight, Globe, Key } from 'lucide-react';

interface TeamStanding {
  position: number;
  teamName: string;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

const API_DOC = [
  { step: 1, title: '注册账号', desc: '访问 football-data.org 注册免费账号，获取API Key', icon: Globe },
  { step: 2, title: '配置密钥', desc: '在下方输入框中填入你的API Key', icon: Key },
  { step: 3, title: '获取数据', desc: '点击"获取实时数据"按钮，系统自动拉取最新积分榜', icon: Cloud },
  { step: 4, title: '数据对比', desc: '对比本地数据与实时数据的差异', icon: Database },
];

const STORAGE_KEY = 'la_liga_api_key';

export default function LiveDataSection() {
  const [visible, setVisible] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [liveData, setLiveData] = useState<TeamStanding[] | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.05 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setApiKey(saved);
  }, []);

  const saveKey = () => {
    localStorage.setItem(STORAGE_KEY, apiKey);
    setShowConfig(false);
  };

  const fetchLiveData = async () => {
    const key = apiKey.trim() || 'DEMO_KEY';
    setLoading(true);
    setError(null);

    try {
      // football-data.org API endpoint for La Liga (PD = Primera Division)
      const res = await fetch(
        `https://api.football-data.org/v4/competitions/PD/standings`,
        { headers: { 'X-Auth-Token': key === 'DEMO_KEY' ? '' : key } }
      );

      if (!res.ok) {
        if (res.status === 403) throw new Error('API Key无效或已过期，请检查配置');
        if (res.status === 429) throw new Error('请求过于频繁，免费版限制10次/分钟');
        throw new Error(`请求失败 (HTTP ${res.status})`);
      }

      const data = await res.json();
      const table: TeamStanding[] = data.standings[0].table.map((t: any) => ({
        position: t.position,
        teamName: t.team.name,
        playedGames: t.playedGames,
        won: t.won,
        draw: t.draw,
        lost: t.lost,
        goalsFor: t.goalsFor,
        goalsAgainst: t.goalsAgainst,
        goalDifference: t.goalDifference,
        points: t.points,
      }));

      setLiveData(table);
      setLastUpdate(new Date().toLocaleString('zh-CN'));
    } catch (err: any) {
      // Demo mode: 使用模拟数据展示功能
      console.log('API call failed, showing demo mode:', err.message);
      setError(`${err.message} — 演示模式：以下为模拟数据`);
      setLiveData([
        { position: 1, teamName: 'FC Barcelona', playedGames: 30, won: 23, draw: 4, lost: 3, goalsFor: 78, goalsAgainst: 29, goalDifference: 49, points: 73 },
        { position: 2, teamName: 'Real Madrid CF', playedGames: 30, won: 21, draw: 6, lost: 3, goalsFor: 65, goalsAgainst: 27, goalDifference: 38, points: 69 },
        { position: 3, teamName: 'Atletico Madrid', playedGames: 30, won: 17, draw: 6, lost: 7, goalsFor: 51, goalsAgainst: 29, goalDifference: 22, points: 57 },
        { position: 4, teamName: 'Villarreal CF', playedGames: 30, won: 16, draw: 6, lost: 8, goalsFor: 56, goalsAgainst: 35, goalDifference: 21, points: 54 },
        { position: 5, teamName: 'Real Betis', playedGames: 30, won: 13, draw: 7, lost: 10, goalsFor: 46, goalsAgainst: 38, goalDifference: 8, points: 46 },
      ]);
      setLastUpdate(new Date().toLocaleString('zh-CN') + ' (演示模式)');
    } finally {
      setLoading(false);
    }
  };

  const getRankStyle = (rank: number) => {
    if (rank <= 4) return 'border-l-2 border-[#ffd700] bg-gradient-to-r from-[rgba(255,215,0,0.08)] to-transparent';
    if (rank <= 6) return 'border-l-2 border-[#00d4aa] bg-gradient-to-r from-[rgba(0,212,170,0.05)] to-transparent';
    if (rank >= 18) return 'border-l-2 border-[#e6005c] bg-gradient-to-r from-[rgba(230,0,92,0.05)] to-transparent';
    return '';
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-[#ffd700] text-black';
    if (rank === 2) return 'bg-[#c0c0c0] text-black';
    if (rank === 3) return 'bg-[#cd7f32] text-white';
    if (rank <= 4) return 'bg-[rgba(0,212,170,0.3)] text-[#00d4aa]';
    if (rank >= 18) return 'bg-[rgba(230,0,92,0.3)] text-[#e6005c]';
    return 'bg-[rgba(255,255,255,0.1)] text-[#a0a0b0]';
  };

  return (
    <section id="live-data" ref={sectionRef} className="section-padding" style={{ background: '#12121a' }}>
      <div className="container-custom">
        <div className={`mb-10 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#00d4aa] flex items-center justify-center">
              <Wifi size={18} className="text-white" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">实时数据接入</h2>
          </div>
          <p className="text-[#a0a0b0]">对接 football-data.org API，获取最新西甲联赛数据</p>
        </div>

        {/* 接入步骤 */}
        <div className={`grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 transition-all duration-700 delay-100 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {API_DOC.map((step, idx) => (
            <div key={step.step} className="stat-card text-center" style={{ transitionDelay: `${200 + idx * 100}ms` }}>
              <div className="w-10 h-10 rounded-xl bg-[rgba(0,212,170,0.1)] flex items-center justify-center mb-3 mx-auto">
                <step.icon size={18} className="text-[#00d4aa]" />
              </div>
              <div className="text-[#00d4aa] font-bold text-sm mb-1">步骤 {step.step}</div>
              <h4 className="text-white font-bold text-sm mb-1">{step.title}</h4>
              <p className="text-[11px] text-[#a0a0b0]">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* API配置 + 获取按钮 */}
        <div className={`chart-container mb-8 transition-all duration-700 delay-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Cloud size={18} className="text-[#00d4aa]" />
              API 数据获取
            </h3>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowConfig(!showConfig)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.05)] text-[#a0a0b0] text-sm hover:bg-[rgba(255,255,255,0.1)] transition-colors">
                <Settings size={14} /> {showConfig ? '收起' : '配置'}API Key
              </button>
              <button onClick={fetchLiveData} disabled={loading}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${loading ? 'bg-[rgba(0,212,170,0.3)] text-[#00d4aa] cursor-not-allowed' : 'bg-[#00d4aa] text-white hover:bg-[#00b894]'}`}>
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> {loading ? '获取中...' : '获取实时数据'}
              </button>
            </div>
          </div>

          {/* API Key 配置面板 */}
          {showConfig && (
            <div className="mb-4 p-4 rounded-xl bg-[rgba(0,212,170,0.05)] border border-[rgba(0,212,170,0.2)] animate-fade-in-up">
              <div className="flex flex-col sm:flex-row items-end gap-3">
                <div className="flex-1 w-full">
                  <label className="text-xs text-[#a0a0b0] mb-1 block">API Key (可选，留空使用演示模式)</label>
                  <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
                    placeholder="输入 football-data.org 的 API Key"
                    className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#00d4aa] placeholder:text-[#6b7280]" />
                </div>
                <button onClick={saveKey} className="px-4 py-2 bg-[#00d4aa] text-white rounded-lg text-sm font-medium hover:bg-[#00b894] transition-colors whitespace-nowrap">
                  保存到本地
                </button>
              </div>
              <p className="text-[10px] text-[#6b7280] mt-2">
                API Key 仅保存在你的浏览器本地存储中，不会上传到任何服务器。
                <a href="https://www.football-data.org/" target="_blank" rel="noopener noreferrer" className="text-[#00d4aa] hover:underline ml-1">去 football-data.org 注册 →</a>
              </p>
            </div>
          )}

          {/* 状态提示 */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-[rgba(230,0,92,0.1)] border border-[rgba(230,0,92,0.2)] flex items-start gap-2 animate-fade-in-up">
              <AlertCircle size={16} className="text-[#e6005c] mt-0.5 flex-shrink-0" />
              <div className="text-xs text-[#e6005c]">{error}</div>
            </div>
          )}

          {lastUpdate && !error && (
            <div className="mb-4 p-3 rounded-lg bg-[rgba(0,212,170,0.1)] border border-[rgba(0,212,170,0.2)] flex items-center gap-2 animate-fade-in-up">
              <CheckCircle size={16} className="text-[#00d4aa]" />
              <div className="text-xs text-[#00d4aa]">数据更新成功 — 更新时间: {lastUpdate}</div>
            </div>
          )}

          {/* 实时数据表格 */}
          {liveData && (
            <div className="overflow-x-auto animate-fade-in-up">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th className="w-12">排名</th>
                    <th>球队</th>
                    <th className="text-center">场次</th>
                    <th className="text-center">胜</th>
                    <th className="text-center">平</th>
                    <th className="text-center">负</th>
                    <th className="text-center">进球</th>
                    <th className="text-center">失球</th>
                    <th className="text-center">净胜球</th>
                    <th className="text-center">积分</th>
                  </tr>
                </thead>
                <tbody>
                  {liveData.map(team => (
                    <tr key={team.position} className={`${getRankStyle(team.position)} hover:bg-[rgba(230,0,92,0.05)]`}>
                      <td>
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${getRankBadge(team.position)}`}>
                          {team.position}
                        </span>
                      </td>
                      <td className="font-medium text-white">{team.teamName}</td>
                      <td className="text-center text-[#a0a0b0]">{team.playedGames}</td>
                      <td className="text-center text-[#00d4aa]">{team.won}</td>
                      <td className="text-center text-[#a0a0b0]">{team.draw}</td>
                      <td className="text-center text-[#e6005c]">{team.lost}</td>
                      <td className="text-center font-mono text-white">{team.goalsFor}</td>
                      <td className="text-center font-mono text-[#a0a0b0]">{team.goalsAgainst}</td>
                      <td className="text-center font-mono text-[#00d4aa]">{team.goalDifference > 0 ? '+' : ''}{team.goalDifference}</td>
                      <td className="text-center"><span className="font-mono font-bold text-white text-lg">{team.points}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 接入方案对比 */}
        <div className={`chart-container transition-all duration-700 delay-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h3 className="text-lg font-bold text-white mb-6">实时数据接入方案</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'football-data.org', free: '100次/天', paid: '€12/月', delay: '5分钟', data: '积分榜、赛程、赛果', best: '个人项目、论文演示' },
              { name: 'API-Football', free: '100次/天', paid: '$19/月', delay: '<15秒', data: '2000+联赛，详细统计', best: '高频率数据需求' },
              { name: 'Sportmonks', free: '试用14天', paid: '€29/月', delay: '<15秒', data: '2500+联赛，实时比分', best: '商业级应用' },
            ].map(api => (
              <div key={api.name} className="p-4 rounded-xl border border-[rgba(255,255,255,0.05)] hover:border-[rgba(0,212,170,0.3)] transition-colors">
                <h4 className="text-white font-bold text-sm mb-3">{api.name}</h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between"><span className="text-[#a0a0b0]">免费额度</span><span className="text-[#00d4aa]">{api.free}</span></div>
                  <div className="flex justify-between"><span className="text-[#a0a0b0]">付费版</span><span className="text-[#ffd700]">{api.paid}</span></div>
                  <div className="flex justify-between"><span className="text-[#a0a0b0]">延迟</span><span className="text-white">{api.delay}</span></div>
                  <div className="flex justify-between"><span className="text-[#a0a0b0]">数据范围</span><span className="text-white">{api.data}</span></div>
                  <div className="pt-2 mt-2 border-t border-[rgba(255,255,255,0.05)]">
                    <span className="text-[10px] text-[#00d4aa]">适合: {api.best}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 rounded-xl bg-[rgba(0,212,170,0.05)] border border-[rgba(0,212,170,0.15)]">
            <h4 className="text-sm font-bold text-[#00d4aa] mb-2 flex items-center gap-2">
              <ArrowRight size={14} /> 推荐方案
            </h4>
            <p className="text-xs text-[#a0a0b0] leading-relaxed">
              对于论文演示和个人项目，推荐使用 <strong className="text-white">football-data.org 免费版</strong>。
              注册后获取API Key即可接入，支持西甲积分榜、赛程、赛果等数据，每天有100次请求额度。
              对于需要实时比分的场景，可考虑 API-Football 的免费版（100次/天，延迟&lt;15秒）。
              本系统已内置 API 适配层，切换数据源只需修改配置即可。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
