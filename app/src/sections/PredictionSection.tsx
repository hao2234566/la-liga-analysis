import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import { Brain, ChevronDown, Swords, BarChart3, Dices, Layers, Zap } from 'lucide-react';

interface TeamData {
  球队: string;
  场均进球: number;
  场均失球: number;
  积分: number;
  排名: number;
}

interface PredictionSectionProps {
  championPoints: Record<string, number>;
  goalsData: TeamData[];
}

/* ============ 数学工具函数 ============ */

function poissonPMF(lambda: number, k: number): number {
  if (k < 0) return 0;
  let res = Math.exp(-lambda);
  for (let i = 1; i <= k; i++) res *= lambda / i;
  return res;
}

/* ============ 算法结果接口 ============ */

interface AlgoResult {
  name: string;
  key: string;
  icon: typeof Brain;
  color: string;
  homeWin: number;
  draw: number;
  awayWin: number;
  homeXG: number;
  awayXG: number;
  bestScore: string;
  desc: string;
}

/* ============ 4种预测算法 ============ */

/** 1. 泊松分布模型 */
function poissonPredict(home: TeamData, away: TeamData, leagueAvg: number) {
  const hAtk = home.场均进球 / leagueAvg;
  const aDef = away.场均失球 / leagueAvg;
  const aAtk = away.场均进球 / leagueAvg;
  const hDef = home.场均失球 / leagueAvg;
  const hAdv = 1.15;

  const hXG = hAtk * aDef * leagueAvg * hAdv;
  const aXG = aAtk * hDef * leagueAvg;

  let hw = 0, dr = 0, aw = 0;
  const dist: { s: string; p: number }[] = [];
  for (let hg = 0; hg <= 5; hg++) {
    for (let ag = 0; ag <= 5; ag++) {
      const p = poissonPMF(hXG, hg) * poissonPMF(aXG, ag) * 100;
      dist.push({ s: `${hg}-${ag}`, p });
      if (hg > ag) hw += p;
      else if (hg === ag) dr += p;
      else aw += p;
    }
  }
  dist.sort((a, b) => b.p - a.p);
  return { hw, dr, aw, hXG, aXG, best: dist[0].s };
}

/** 2. Elo评分模型 */
function eloPredict(home: TeamData, away: TeamData) {
  const baseElo = 1500;
  const homeElo = baseElo + (home.积分 - away.积分) * 8 + (20 - home.排名) * 15;
  const awayElo = baseElo + (away.积分 - home.积分) * 8 + (20 - away.排名) * 15;

  const expHome = 1 / (1 + Math.pow(10, (awayElo - homeElo - 65) / 400));
  const expAway = 1 / (1 + Math.pow(10, (homeElo - awayElo + 65) / 400));
  const expDraw = Math.max(0.18, 0.25 - Math.abs(expHome - 0.5) * 0.3);

  const total = expHome + expDraw + expAway;
  const hw = (expHome / total) * 100;
  const dr = (expDraw / total) * 100;
  const aw = (expAway / total) * 100;

  const hXG = (home.场均进球 * 1.1 + away.场均失球 * 0.5) / 1.6;
  const aXG = (away.场均进球 * 0.9 + home.场均失球 * 0.5) / 1.6;

  const hRounded = Math.round(hXG);
  const aRounded = Math.round(aXG);
  const best = `${Math.min(hRounded, 4)}-${Math.min(aRounded, 4)}`;

  return { hw, dr, aw, hXG, aXG, best };
}

/** 3. 蒙特卡洛模拟 */
function monteCarloPredict(home: TeamData, away: TeamData, leagueAvg: number) {
  const hAtk = home.场均进球 / leagueAvg;
  const aDef = away.场均失球 / leagueAvg;
  const aAtk = away.场均进球 / leagueAvg;
  const hDef = home.场均失球 / leagueAvg;
  const hAdv = 1.15;

  const hXG = hAtk * aDef * leagueAvg * hAdv;
  const aXG = aAtk * hDef * leagueAvg;

  let hw = 0, dr = 0, aw = 0;
  const simCount = 10000;
  const scoreMap = new Map<string, number>();

  for (let i = 0; i < simCount; i++) {
    let hg = 0, ag = 0;
    let hProb = 1, aProb = 1;
    for (let g = 0; g <= 5; g++) {
      hProb *= g === 0 ? Math.exp(-hXG) : hXG / g;
      aProb *= g === 0 ? Math.exp(-aXG) : aXG / g;
    }

    let hCum = 0, aCum = 0;
    const hRand = Math.random();
    const aRand = Math.random();
    for (let g = 0; g <= 5; g++) {
      hCum += poissonPMF(hXG, g);
      if (hRand <= hCum) { hg = g; break; }
    }
    for (let g = 0; g <= 5; g++) {
      aCum += poissonPMF(aXG, g);
      if (aRand <= aCum) { ag = g; break; }
    }

    if (hg > ag) hw++;
    else if (hg === ag) dr++;
    else aw++;

    const key = `${hg}-${ag}`;
    scoreMap.set(key, (scoreMap.get(key) || 0) + 1);
  }

  let best = '1-1', bestCount = 0;
  scoreMap.forEach((count, score) => {
    if (count > bestCount) { bestCount = count; best = score; }
  });

  return {
    hw: (hw / simCount) * 100,
    dr: (dr / simCount) * 100,
    aw: (aw / simCount) * 100,
    hXG, aXG, best,
  };
}

/** 4. 加权综合模型 */
function ensemblePredict(home: TeamData, away: TeamData, leagueAvg: number) {
  const p1 = poissonPredict(home, away, leagueAvg);
  const p2 = eloPredict(home, away);
  const p3 = monteCarloPredict(home, away, leagueAvg);

  const w1 = 0.35, w2 = 0.25, w3 = 0.40;

  return {
    hw: p1.hw * w1 + p2.hw * w2 + p3.hw * w3,
    dr: p1.dr * w1 + p2.dr * w2 + p3.dr * w3,
    aw: p1.aw * w1 + p2.aw * w2 + p3.aw * w3,
    hXG: (p1.hXG + p2.hXG + p3.hXG) / 3,
    aXG: (p1.aXG + p2.aXG + p3.aXG) / 3,
    best: p1.best,
  };
}

/* ============ 主组件 ============ */

export default function PredictionSection({
  championPoints,
  goalsData,
}: PredictionSectionProps) {
  const [visible, setVisible] = useState(false);
  const [homeTeamName, setHomeTeamName] = useState('皇家马德里');
  const [awayTeamName, setAwayTeamName] = useState('巴塞罗那');
  const [algoDetail, setAlgoDetail] = useState<string | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.05 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const leagueAvg = useMemo(
    () => goalsData.reduce((s, t) => s + t.场均进球, 0) / goalsData.length,
    [goalsData]
  );

  const home = useMemo(
    () => goalsData.find(t => t.球队 === homeTeamName) || goalsData[0],
    [goalsData, homeTeamName]
  );
  const away = useMemo(
    () => goalsData.find(t => t.球队 === awayTeamName) || goalsData[1],
    [goalsData, awayTeamName]
  );

  const results: AlgoResult[] = useMemo(() => {
    if (!home || !away) return [];
    const p1 = poissonPredict(home, away, leagueAvg);
    const p2 = eloPredict(home, away);
    const p3 = monteCarloPredict(home, away, leagueAvg);
    const p4 = ensemblePredict(home, away, leagueAvg);

    return [
      {
        name: '泊松分布',
        key: 'poisson',
        icon: BarChart3,
        color: '#00d4aa',
        homeWin: Math.round(p1.hw * 10) / 10,
        draw: Math.round(p1.dr * 10) / 10,
        awayWin: Math.round(p1.aw * 10) / 10,
        homeXG: Math.round(p1.hXG * 100) / 100,
        awayXG: Math.round(p1.aXG * 100) / 100,
        bestScore: p1.best,
        desc: '假设进球服从泊松分布，基于球队攻防强度计算各比分概率',
      },
      {
        name: 'Elo评分',
        key: 'elo',
        icon: Zap,
        color: '#6366f1',
        homeWin: Math.round(p2.hw * 10) / 10,
        draw: Math.round(p2.dr * 10) / 10,
        awayWin: Math.round(p2.aw * 10) / 10,
        homeXG: Math.round(p2.hXG * 100) / 100,
        awayXG: Math.round(p2.aXG * 100) / 100,
        bestScore: p2.best,
        desc: '基于国际象棋Elo评分系统，根据积分排名差异计算期望胜率',
      },
      {
        name: '蒙特卡洛',
        key: 'montecarlo',
        icon: Dices,
        color: '#ff6b35',
        homeWin: Math.round(p3.hw * 10) / 10,
        draw: Math.round(p3.dr * 10) / 10,
        awayWin: Math.round(p3.aw * 10) / 10,
        homeXG: Math.round(p3.hXG * 100) / 100,
        awayXG: Math.round(p3.aXG * 100) / 100,
        bestScore: p3.best,
        desc: '进行10000次随机模拟，统计各结果出现频率作为概率估计',
      },
      {
        name: '加权综合',
        key: 'ensemble',
        icon: Layers,
        color: '#e6005c',
        homeWin: Math.round(p4.hw * 10) / 10,
        draw: Math.round(p4.dr * 10) / 10,
        awayWin: Math.round(p4.aw * 10) / 10,
        homeXG: Math.round(p4.hXG * 100) / 100,
        awayXG: Math.round(p4.aXG * 100) / 100,
        bestScore: p4.best,
        desc: '综合泊松(35%)、Elo(25%)、蒙特卡洛(40%)三种模型的加权结果',
      },
    ];
  }, [home, away, leagueAvg]);

  const swapTeams = useCallback(() => {
    setHomeTeamName(awayTeamName);
    setAwayTeamName(homeTeamName);
  }, [homeTeamName, awayTeamName]);

  const teamOptions = goalsData.sort((a, b) => a.排名 - b.排名);

  // 概率对比柱状图
  const compareOption = useMemo(() => ({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(26,26,46,0.95)',
      borderColor: '#2a2a3e',
      textStyle: { color: '#fff' },
    },
    legend: {
      data: ['主胜', '平局', '客胜'],
      textStyle: { color: '#a0a0b0' },
      bottom: 0,
    },
    grid: { left: '12%', right: '5%', top: '8%', bottom: '15%' },
    xAxis: {
      type: 'category',
      data: results.map(r => r.name),
      axisLine: { lineStyle: { color: '#2a2a3e' } },
      axisLabel: { color: '#a0a0b0', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      name: '概率(%)',
      nameTextStyle: { color: '#a0a0b0' },
      axisLine: { lineStyle: { color: '#2a2a3e' } },
      axisLabel: { color: '#a0a0b0' },
      splitLine: { lineStyle: { color: 'rgba(42,42,62,0.3)' } },
    },
    series: [
      {
        name: '主胜',
        type: 'bar',
        stack: 'total',
        data: results.map(r => r.homeWin),
        itemStyle: { color: '#00d4aa', borderRadius: [0, 0, 0, 0] },
        barWidth: '50%',
      },
      {
        name: '平局',
        type: 'bar',
        stack: 'total',
        data: results.map(r => r.draw),
        itemStyle: { color: '#a0a0b0' },
      },
      {
        name: '客胜',
        type: 'bar',
        stack: 'total',
        data: results.map(r => r.awayWin),
        itemStyle: { color: '#e6005c', borderRadius: [4, 4, 0, 0] },
      },
    ],
  }), [results]);

  // XG对比图
  const xgCompareOption = useMemo(() => ({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(26,26,46,0.95)',
      borderColor: '#2a2a3e',
      textStyle: { color: '#fff' },
    },
    legend: {
      data: [`${home?.球队} xG`, `${away?.球队} xG`],
      textStyle: { color: '#a0a0b0' },
      bottom: 0,
    },
    grid: { left: '12%', right: '5%', top: '8%', bottom: '15%' },
    xAxis: {
      type: 'category',
      data: results.map(r => r.name),
      axisLine: { lineStyle: { color: '#2a2a3e' } },
      axisLabel: { color: '#a0a0b0', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      name: '预期进球',
      nameTextStyle: { color: '#a0a0b0' },
      axisLine: { lineStyle: { color: '#2a2a3e' } },
      axisLabel: { color: '#a0a0b0' },
      splitLine: { lineStyle: { color: 'rgba(42,42,62,0.3)' } },
    },
    series: [
      {
        name: `${home?.球队} xG`,
        type: 'bar',
        data: results.map(r => r.homeXG),
        itemStyle: { color: '#00d4aa', borderRadius: [4, 4, 0, 0] },
        barGap: '20%',
      },
      {
        name: `${away?.球队} xG`,
        type: 'bar',
        data: results.map(r => r.awayXG),
        itemStyle: { color: '#e6005c', borderRadius: [4, 4, 0, 0] },
      },
    ],
  }), [results, home, away]);

  // 最可能比分对比
  const scoreCompareOption = useMemo(() => ({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(26,26,46,0.95)',
      borderColor: '#2a2a3e',
      textStyle: { color: '#fff' },
    },
    series: results.map((r, idx) => ({
      type: 'gauge',
      center: [`${18 + idx * 21}%`, '55%'],
      radius: '65%',
      startAngle: 90,
      endAngle: -270,
      pointer: { show: false },
      progress: {
        show: true,
        overlap: false,
        roundCap: true,
        clip: false,
        itemStyle: { color: r.color, borderWidth: 0 },
      },
      axisLine: { lineStyle: { width: 8, color: [[1, 'rgba(255,255,255,0.05)']] } },
      splitLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
      data: [
        {
          value: Math.round(r.homeWin),
          name: r.bestScore,
          title: {
            offsetCenter: ['0%', '0%'],
            fontSize: 28,
            fontWeight: 'bold',
            color: '#fff',
          },
          detail: {
            offsetCenter: ['0%', '55%'],
            fontSize: 11,
            color: '#a0a0b0',
            formatter: `${r.name}\n主胜${r.homeWin}%`,
          },
        },
      ],
      detail: { width: 80, height: 14, fontSize: 11, color: '#a0a0b0' },
      title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    })),
  }), [results]);

  // 历史趋势
  const trendOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(26,26,46,0.95)',
      borderColor: '#2a2a3e',
      textStyle: { color: '#fff', fontSize: 12 },
    },
    grid: { left: '8%', right: '5%', top: '10%', bottom: '15%' },
    xAxis: {
      type: 'category',
      data: Object.keys(championPoints),
      axisLine: { lineStyle: { color: '#2a2a3e' } },
      axisLabel: { color: '#a0a0b0', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      name: '冠军积分',
      min: 70,
      nameTextStyle: { color: '#a0a0b0' },
      axisLine: { lineStyle: { color: '#2a2a3e' } },
      axisLabel: { color: '#a0a0b0' },
      splitLine: { lineStyle: { color: 'rgba(42,42,62,0.3)' } },
    },
    series: [
      {
        type: 'line',
        data: Object.values(championPoints),
        smooth: true,
        symbol: 'circle',
        symbolSize: 10,
        lineStyle: { color: '#e6005c', width: 3, shadowColor: 'rgba(230,0,92,0.5)', shadowBlur: 10 },
        itemStyle: { color: '#e6005c', borderColor: '#fff', borderWidth: 2 },
        areaStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(230,0,92,0.3)' }, { offset: 1, color: 'rgba(230,0,92,0)' }],
          },
        },
        markPoint: {
          data: [{ type: 'max', name: '最高', label: { color: '#fff', fontSize: 10 } }],
          itemStyle: { color: '#ffd700' },
        },
      },
    ],
  };

  const championProbOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(26,26,46,0.95)',
      borderColor: '#2a2a3e',
      textStyle: { color: '#fff', fontSize: 12 },
    },
    series: [{
      type: 'pie',
      radius: ['50%', '75%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 8, borderColor: '#0a0a0f', borderWidth: 3 },
      label: { show: true, color: '#fff', fontSize: 13, fontWeight: 'bold', formatter: '{b}\n{d}%' },
      labelLine: { lineStyle: { color: '#a0a0b0' } },
      emphasis: { label: { fontSize: 15 }, itemStyle: { shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.5)' } },
      data: [
        { value: 78, name: '巴塞罗那', itemStyle: { color: '#e6005c' } },
        { value: 20, name: '皇家马德里', itemStyle: { color: '#ffd700' } },
        { value: 2, name: '其他', itemStyle: { color: '#6366f1' } },
      ],
    }],
  };

  return (
    <section id="prediction" ref={sectionRef} className="section-padding" style={{ background: '#0a0a0f' }}>
      <div className="container-custom">
        {/* Title */}
        <div className={`mb-10 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">比赛预测模型</h2>
          <p className="text-[#a0a0b0]">基于xG-泊松混合模型的智能预测系统 — 选择任意两支球队进行预测</p>
        </div>

        {/* Team Selector */}
        <div className={`chart-container mb-8 transition-all duration-700 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h3 className="text-lg font-bold text-white mb-6"><Swords size={20} className="inline mr-2 text-[#e6005c]" />选择对阵双方</h3>
          <div className="flex flex-col lg:flex-row items-center gap-4 mb-6">
            <div className="flex-1 w-full">
              <label className="text-xs text-[#00d4aa] mb-2 block font-medium">主队 (主场)</label>
              <div className="relative">
                <select value={homeTeamName} onChange={e => setHomeTeamName(e.target.value)}
                  className="w-full appearance-none bg-[rgba(0,212,170,0.1)] border border-[rgba(0,212,170,0.3)] text-white rounded-xl px-4 py-3 pr-10 focus:outline-none focus:border-[#00d4aa] cursor-pointer transition-colors">
                  {teamOptions.map(t => <option key={t.球队} value={t.球队} className="bg-[#1a1a2e]">{t.排名}. {t.球队} ({t.积分}分)</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#00d4aa] pointer-events-none" />
              </div>
            </div>
            <button onClick={swapTeams} className="flex items-center justify-center w-12 h-12 rounded-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] hover:bg-[rgba(230,0,92,0.1)] hover:border-[#e6005c] transition-all group" title="交换主客队">
              <Swords size={18} className="text-[#a0a0b0] group-hover:text-[#e6005c] transition-colors" />
            </button>
            <div className="flex-1 w-full">
              <label className="text-xs text-[#e6005c] mb-2 block font-medium">客队 (客场)</label>
              <div className="relative">
                <select value={awayTeamName} onChange={e => setAwayTeamName(e.target.value)}
                  className="w-full appearance-none bg-[rgba(230,0,92,0.1)] border border-[rgba(230,0,92,0.3)] text-white rounded-xl px-4 py-3 pr-10 focus:outline-none focus:border-[#e6005c] cursor-pointer transition-colors">
                  {teamOptions.map(t => <option key={t.球队} value={t.球队} className="bg-[#1a1a2e]">{t.排名}. {t.球队} ({t.积分}分)</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#e6005c] pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* 4种算法结果卡片 */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {results.map((algo, idx) => (
            <div key={algo.key}
              className={`stat-card cursor-pointer transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{
                transitionDelay: `${300 + idx * 100}ms`,
                borderColor: algoDetail === algo.key ? algo.color : undefined,
                boxShadow: algoDetail === algo.key ? `0 0 0 2px ${algo.color}40` : undefined,
              }}
              onClick={() => setAlgoDetail(algoDetail === algo.key ? null : algo.key)}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${algo.color}20` }}>
                  <algo.icon size={20} style={{ color: algo.color }} />
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm">{algo.name}</h4>
                  <p className="text-[10px] text-[#a0a0b0]">点击{algoDetail === algo.key ? '收起' : '展开'}详情</p>
                </div>
              </div>

              {/* 概率条 */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#00d4aa]">主胜</span>
                  <span className="font-mono text-white">{algo.homeWin}%</span>
                </div>
                <div className="w-full bg-[rgba(255,255,255,0.05)] rounded-full h-1.5">
                  <div className="bg-[#00d4aa] h-1.5 rounded-full transition-all duration-700" style={{ width: `${algo.homeWin}%` }} />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#a0a0b0]">平局</span>
                  <span className="font-mono text-white">{algo.draw}%</span>
                </div>
                <div className="w-full bg-[rgba(255,255,255,0.05)] rounded-full h-1.5">
                  <div className="bg-[#a0a0b0] h-1.5 rounded-full transition-all duration-700" style={{ width: `${algo.draw}%` }} />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#e6005c]">客胜</span>
                  <span className="font-mono text-white">{algo.awayWin}%</span>
                </div>
                <div className="w-full bg-[rgba(255,255,255,0.05)] rounded-full h-1.5">
                  <div className="bg-[#e6005c] h-1.5 rounded-full transition-all duration-700" style={{ width: `${algo.awayWin}%` }} />
                </div>
              </div>

              {/* xG & 最可能比分 */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-1.5 rounded-lg" style={{ background: `${algo.color}10` }}>
                  <div className="text-xs font-mono font-bold" style={{ color: algo.color }}>{algo.homeXG}</div>
                  <div className="text-[9px] text-[#a0a0b0]">主队xG</div>
                </div>
                <div className="p-1.5 rounded-lg bg-[rgba(255,215,0,0.1)]">
                  <div className="text-xs font-mono font-bold text-[#ffd700]">{algo.bestScore}</div>
                  <div className="text-[9px] text-[#a0a0b0]">最可能</div>
                </div>
                <div className="p-1.5 rounded-lg" style={{ background: `${algo.color}10` }}>
                  <div className="text-xs font-mono font-bold" style={{ color: algo.color }}>{algo.awayXG}</div>
                  <div className="text-[9px] text-[#a0a0b0]">客队xG</div>
                </div>
              </div>

              {/* 展开详情 */}
              {algoDetail === algo.key && (
                <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.05)] animate-fade-in-up">
                  <p className="text-[11px] text-[#a0a0b0] leading-relaxed">{algo.desc}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 概率对比柱状图 */}
        <div className={`chart-container mb-8 transition-all duration-700 delay-400 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h3 className="text-lg font-bold text-white mb-4">四种算法预测概率对比</h3>
          <ReactECharts option={compareOption} style={{ height: 320 }} opts={{ renderer: 'svg' }} />
        </div>

        {/* xG对比 + 最可能比分仪表 */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <div className={`chart-container transition-all duration-700 delay-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h3 className="text-lg font-bold text-white mb-4">预期进球(xG)对比</h3>
            <ReactECharts option={xgCompareOption} style={{ height: 320 }} opts={{ renderer: 'svg' }} />
          </div>
          <div className={`chart-container transition-all duration-700 delay-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h3 className="text-lg font-bold text-white mb-4">各算法最可能比分</h3>
            <ReactECharts option={scoreCompareOption} style={{ height: 320 }} opts={{ renderer: 'svg' }} />
          </div>
        </div>

        {/* 冠军预测 + 历史趋势 */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className={`chart-container transition-all duration-700 delay-600 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h4 className="text-sm font-bold text-white mb-4">赛季冠军预测</h4>
            <ReactECharts option={championProbOption} style={{ height: 240 }} opts={{ renderer: 'svg' }} />
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm"><div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#e6005c]" /><span className="text-[#a0a0b0]">巴塞罗那</span></div><span className="text-white font-bold">78%</span></div>
              <div className="flex items-center justify-between text-sm"><div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#ffd700]" /><span className="text-[#a0a0b0]">皇家马德里</span></div><span className="text-white font-bold">20%</span></div>
              <div className="flex items-center justify-between text-sm"><div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#6366f1]" /><span className="text-[#a0a0b0]">其他球队</span></div><span className="text-white font-bold">2%</span></div>
            </div>
          </div>
          <div className={`chart-container lg:col-span-2 transition-all duration-700 delay-600 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h3 className="text-lg font-bold text-white mb-4">近7个赛季冠军积分趋势</h3>
            <ReactECharts option={trendOption} style={{ height: 300 }} opts={{ renderer: 'svg' }} />
          </div>
        </div>
      </div>
    </section>
  );
}
