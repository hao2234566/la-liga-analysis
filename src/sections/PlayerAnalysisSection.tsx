import { useEffect, useRef, useState } from 'react';
import ReactECharts from 'echarts-for-react';

interface Player {
  球员姓名: string;
  位置缩写: string;
  球队?: string;
  进球数: number;
  助攻数: number;
  球员评分: number;
  进球效率: number;
  出场时间: number;
  预期进球: number;
  xG差值: number;
}

interface PlayerAnalysisProps {
  topScorers: Player[];
  topAssists: Player[];
  topRated: Player[];
  xgAnalysis: Player[];
  positionStats: Record<string, Record<string, number>>;
}

export default function PlayerAnalysisSection({
  topScorers,
  topAssists,
  topRated,
  xgAnalysis,
  positionStats,
}: PlayerAnalysisProps) {
  const [visible, setVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'scorers' | 'assists' | 'rated'>('scorers');
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

  const positionNames: Record<string, string> = {
    FW: '前锋',
    MF: '中场',
    DF: '后卫',
    GK: '门将',
  };

  const getPosColor = (pos: string) => {
    const colors: Record<string, string> = {
      FW: '#e6005c',
      MF: '#6366f1',
      DF: '#00d4aa',
      GK: '#ffd700',
    };
    return colors[pos] || '#a0a0b0';
  };

  const xgOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(26,26,46,0.95)',
      borderColor: '#2a2a3e',
      textStyle: { color: '#fff', fontSize: 12 },
      formatter: (params: any) => {
        return `<strong>${params.data[3]}</strong> (${params.data[4]})<br/>
                xG: ${params.data[0]}<br/>
                实际进球: ${params.data[1]}<br/>
                xG差值: ${params.data[2] > 0 ? '+' : ''}${params.data[2]}`;
      },
    },
    grid: { left: '10%', right: '8%', top: '8%', bottom: '12%' },
    xAxis: {
      name: '预期进球 (xG)',
      nameTextStyle: { color: '#a0a0b0' },
      axisLine: { lineStyle: { color: '#2a2a3e' } },
      axisLabel: { color: '#a0a0b0' },
      splitLine: { lineStyle: { color: 'rgba(42,42,62,0.3)' } },
    },
    yAxis: {
      name: '实际进球',
      nameTextStyle: { color: '#a0a0b0' },
      axisLine: { lineStyle: { color: '#2a2a3e' } },
      axisLabel: { color: '#a0a0b0' },
      splitLine: { lineStyle: { color: 'rgba(42,42,62,0.3)' } },
    },
    series: [
      {
        type: 'scatter',
        data: xgAnalysis.map(p => [
          p.预期进球,
          p.进球数,
          p.xG差值,
          p.球员姓名,
          p.位置缩写,
        ]),
        symbolSize: 14,
        itemStyle: {
          color: (params: any) => getPosColor(params.data[4]),
          opacity: 0.8,
        },
        emphasis: {
          itemStyle: { opacity: 1, borderColor: '#fff', borderWidth: 2 },
        },
        markLine: {
          silent: true,
          lineStyle: { color: '#a0a0b0', type: 'dashed', opacity: 0.5 },
          data: [
            [
              { coord: [0, 0], symbol: 'none' },
              { coord: [25, 25], symbol: 'none' },
            ],
          ],
          label: {
            show: true,
            formatter: 'xG=实际进球',
            color: '#a0a0b0',
            fontSize: 10,
          },
        },
      },
    ],
  };

  const positionOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(26,26,46,0.95)',
      borderColor: '#2a2a3e',
      textStyle: { color: '#fff', fontSize: 12 },
    },
    legend: {
      data: ['球员评分', '场均进球'],
      bottom: 0,
      textStyle: { color: '#a0a0b0' },
    },
    radar: {
      indicator: Object.keys(positionStats).map(pos => ({
        name: positionNames[pos] || pos,
        max: 10,
      })),
      shape: 'polygon',
      splitNumber: 5,
      axisName: { color: '#a0a0b0', fontSize: 12 },
      splitLine: { lineStyle: { color: 'rgba(42,42,62,0.5)' } },
      splitArea: {
        show: true,
        areaStyle: {
          color: ['rgba(26,26,46,0.3)', 'rgba(26,26,46,0.5)'],
        },
      },
      axisLine: { lineStyle: { color: 'rgba(42,42,62,0.5)' } },
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: Object.keys(positionStats).map(
              pos => positionStats[pos]['球员评分']
            ),
            name: '球员评分',
            lineStyle: { color: '#e6005c', width: 2 },
            areaStyle: { color: '#e6005c', opacity: 0.1 },
            itemStyle: { color: '#e6005c' },
          },
          {
            value: Object.keys(positionStats).map(
              pos => positionStats[pos]['进球数'] * 5
            ),
            name: '场均进球(×5)',
            lineStyle: { color: '#00d4aa', width: 2 },
            areaStyle: { color: '#00d4aa', opacity: 0.1 },
            itemStyle: { color: '#00d4aa' },
          },
        ],
        symbolSize: 6,
      },
    ],
  };

  const tabs = [
    { key: 'scorers' as const, label: '射手榜' },
    { key: 'assists' as const, label: '助攻榜' },
    { key: 'rated' as const, label: '评分榜' },
  ];

  const getActiveData = () => {
    switch (activeTab) {
      case 'scorers':
        return topScorers;
      case 'assists':
        return topAssists;
      case 'rated':
        return topRated;
    }
  };

  const getColumns = () => {
    switch (activeTab) {
      case 'scorers':
        return ['排名', '球员', '位置', '进球', '助攻', '评分', '进球效率'];
      case 'assists':
        return ['排名', '球员', '位置', '助攻', '进球', '评分'];
      case 'rated':
        return ['排名', '球员', '位置', '评分', '进球', '助攻'];
    }
  };

  return (
    <section
      id="player-analysis"
      ref={sectionRef}
      className="section-padding"
      style={{ background: '#12121a' }}
    >
      <div className="container-custom">
        <div
          className={`mb-10 transition-all duration-700 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            球员表现分析
          </h2>
          <p className="text-[#a0a0b0]">
            射手榜、助攻榜、xG分析与位置对比
          </p>
        </div>

        {/* Player Tables with Tabs */}
        <div
          className={`chart-container mb-8 transition-all duration-700 delay-100 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-[#e6005c] text-white'
                    : 'bg-[rgba(255,255,255,0.05)] text-[#a0a0b0] hover:bg-[rgba(255,255,255,0.1)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  {getColumns().map(col => (
                    <th key={col} className="text-left">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {getActiveData().map((player, idx) => (
                  <tr
                    key={player.球员姓名}
                    className="transition-all hover:bg-[rgba(230,0,92,0.05)]"
                    style={{
                      transitionDelay: `${idx * 30}ms`,
                    }}
                  >
                    <td>
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          idx === 0
                            ? 'bg-[#ffd700] text-black'
                            : idx === 1
                            ? 'bg-[#c0c0c0] text-black'
                            : idx === 2
                            ? 'bg-[#cd7f32] text-white'
                            : 'bg-[rgba(255,255,255,0.1)] text-[#a0a0b0]'
                        }`}
                      >
                        {idx + 1}
                      </span>
                    </td>
                    <td className="font-medium text-white">
                      {player.球员姓名}
                    </td>
                    <td>
                      <span
                        className="text-xs px-2 py-0.5 rounded font-medium"
                        style={{
                          background: `${getPosColor(player.位置缩写)}20`,
                          color: getPosColor(player.位置缩写),
                        }}
                      >
                        {player.位置缩写}
                      </span>
                    </td>
                    {activeTab === 'scorers' && (
                      <>
                        <td className="font-mono text-[#e6005c] font-bold">
                          {player.进球数}
                        </td>
                        <td className="font-mono text-[#a0a0b0]">
                          {player.助攻数}
                        </td>
                        <td className="font-mono text-white">
                          {player.球员评分}
                        </td>
                        <td className="font-mono text-[#ffd700]">
                          {player.进球效率}%
                        </td>
                      </>
                    )}
                    {activeTab === 'assists' && (
                      <>
                        <td className="font-mono text-[#00d4aa] font-bold">
                          {player.助攻数}
                        </td>
                        <td className="font-mono text-[#a0a0b0]">
                          {player.进球数}
                        </td>
                        <td className="font-mono text-white">
                          {player.球员评分}
                        </td>
                      </>
                    )}
                    {activeTab === 'rated' && (
                      <>
                        <td className="font-mono text-[#ffd700] font-bold">
                          {player.球员评分}
                        </td>
                        <td className="font-mono text-[#a0a0b0]">
                          {player.进球数}
                        </td>
                        <td className="font-mono text-[#a0a0b0]">
                          {player.助攻数}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* xG Analysis and Position Comparison */}
        <div className="grid lg:grid-cols-2 gap-8">
          <div
            className={`chart-container transition-all duration-700 delay-200 ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <h3 className="text-lg font-bold text-white mb-2">
              预期进球 (xG) 分析
            </h3>
            <p className="text-xs text-[#a0a0b0] mb-4">
              对角线上方为超出预期，下方为低于预期
            </p>
            <ReactECharts
              option={xgOption}
              style={{ height: 380 }}
              opts={{ renderer: 'svg' }}
            />
            <div className="mt-4 flex flex-wrap gap-2">
              {Object.entries(positionNames).map(([pos, name]) => (
                <div key={pos} className="flex items-center gap-1">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: getPosColor(pos) }}
                  />
                  <span className="text-xs text-[#a0a0b0]">{name}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            className={`chart-container transition-all duration-700 delay-300 ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <h3 className="text-lg font-bold text-white mb-4">
              位置对比分析
            </h3>
            <ReactECharts
              option={positionOption}
              style={{ height: 380 }}
              opts={{ renderer: 'svg' }}
            />
            <div className="mt-4 grid grid-cols-2 gap-2">
              {Object.entries(positionNames).map(([pos, name]) => (
                <div
                  key={pos}
                  className="p-2 rounded-lg"
                  style={{
                    background: `${getPosColor(pos)}10`,
                    border: `1px solid ${getPosColor(pos)}30`,
                  }}
                >
                  <div
                    className="text-xs font-medium"
                    style={{ color: getPosColor(pos) }}
                  >
                    {name}
                  </div>
                  <div className="text-[10px] text-[#a0a0b0]">
                    平均评分: {positionStats[pos]?.['球员评分']?.toFixed(2) || '-'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
