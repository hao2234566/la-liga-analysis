import { useEffect, useRef, useState } from 'react';
import ReactECharts from 'echarts-for-react';

interface Team {
  球队: string;
  场均进球: number;
  场均射门: number;
  射门转化率: number;
  传球成功率: number;
  场均抢断: number;
  场均解围: number;
  场均失球: number;
  积分: number;
  射正率: number;
  控球指数: number;
  进攻指数: number;
  战术风格: string;
  排名: number;
}

interface TeamAnalysisProps {
  radar: Record<string, Record<string, number>>;
  offense: Team[];
  goalsData: Team[];
  teamStyle: Team[];
}

export default function TeamAnalysisSection({
  radar,
  offense,
  goalsData,
  teamStyle,
}: TeamAnalysisProps) {
  const [visible, setVisible] = useState(false);
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

  // Radar Chart Option
  const radarOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(26,26,46,0.95)',
      borderColor: '#2a2a3e',
      textStyle: { color: '#fff', fontSize: 12 },
    },
    legend: {
      data: Object.keys(radar),
      bottom: 0,
      textStyle: { color: '#a0a0b0', fontSize: 12 },
      itemWidth: 16,
      itemHeight: 8,
    },
    radar: {
      indicator: [
        { name: '场均进球', max: 1 },
        { name: '场均射门', max: 1 },
        { name: '射门转化率', max: 1 },
        { name: '传球成功率', max: 1 },
        { name: '场均抢断', max: 1 },
        { name: '场均解围', max: 1 },
      ],
      shape: 'polygon',
      splitNumber: 4,
      axisName: {
        color: '#a0a0b0',
        fontSize: 11,
      },
      splitLine: {
        lineStyle: { color: 'rgba(42,42,62,0.5)' },
      },
      splitArea: {
        show: true,
        areaStyle: {
          color: ['rgba(26,26,46,0.3)', 'rgba(26,26,46,0.5)'],
        },
      },
      axisLine: {
        lineStyle: { color: 'rgba(42,42,62,0.5)' },
      },
    },
    series: [
      {
        type: 'radar',
        data: Object.entries(radar).map(([name, values], idx) => ({
          value: [
            values['场均进球'],
            values['场均射门'],
            values['射门转化率'],
            values['传球成功率'],
            values['场均抢断'],
            values['场均解围'],
          ],
          name,
          lineStyle: {
            color: ['#e6005c', '#00d4aa', '#ffd700', '#6366f1'][idx],
            width: 2,
          },
          areaStyle: {
            color: ['#e6005c', '#00d4aa', '#ffd700', '#6366f1'][idx],
            opacity: 0.1,
          },
          itemStyle: {
            color: ['#e6005c', '#00d4aa', '#ffd700', '#6366f1'][idx],
          },
        })),
        symbolSize: 6,
      },
    ],
  };

  // Offense Scatter Option
  const offenseOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(26,26,46,0.95)',
      borderColor: '#2a2a3e',
      textStyle: { color: '#fff', fontSize: 12 },
      formatter: (params: any) => {
        return `<strong>${params.data[3]}</strong><br/>
                场均射门: ${params.data[0]}<br/>
                场均进球: ${params.data[1]}<br/>
                积分: ${params.data[2]}<br/>
                射正率: ${params.data[4]}%`;
      },
    },
    grid: { left: '8%', right: '8%', top: '12%', bottom: '12%' },
    xAxis: {
      name: '场均射门',
      nameTextStyle: { color: '#a0a0b0' },
      axisLine: { lineStyle: { color: '#2a2a3e' } },
      axisLabel: { color: '#a0a0b0' },
      splitLine: { lineStyle: { color: 'rgba(42,42,62,0.3)' } },
    },
    yAxis: {
      name: '场均进球',
      nameTextStyle: { color: '#a0a0b0' },
      axisLine: { lineStyle: { color: '#2a2a3e' } },
      axisLabel: { color: '#a0a0b0' },
      splitLine: { lineStyle: { color: 'rgba(42,42,62,0.3)' } },
    },
    series: [
      {
        type: 'scatter',
        data: offense.map(t => [
          t.场均射门,
          t.场均进球,
          t.积分,
          t.球队,
          t.射正率,
        ]),
        symbolSize: (data: number[]) => Math.sqrt(data[2]) * 3,
        itemStyle: {
          color: (params: any) => {
            const rate = params.data[4];
            if (rate > 40) return '#00d4aa';
            if (rate > 35) return '#ffd700';
            return '#e6005c';
          },
          opacity: 0.7,
        },
        emphasis: {
          itemStyle: { opacity: 1, borderColor: '#fff', borderWidth: 2 },
        },
      },
    ],
  };

  // Goals vs Conceded Scatter
  const goalsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(26,26,46,0.95)',
      borderColor: '#2a2a3e',
      textStyle: { color: '#fff', fontSize: 12 },
      formatter: (params: any) => {
        return `<strong>${params.data[3]}</strong><br/>
                场均进球: ${params.data[0]}<br/>
                场均失球: ${params.data[1]}<br/>
                积分: ${params.data[2]}`;
      },
    },
    grid: { left: '8%', right: '8%', top: '12%', bottom: '12%' },
    xAxis: {
      name: '场均失球',
      nameTextStyle: { color: '#a0a0b0' },
      axisLine: { lineStyle: { color: '#2a2a3e' } },
      axisLabel: { color: '#a0a0b0' },
      splitLine: { lineStyle: { color: 'rgba(42,42,62,0.3)' } },
      inverse: true,
    },
    yAxis: {
      name: '场均进球',
      nameTextStyle: { color: '#a0a0b0' },
      axisLine: { lineStyle: { color: '#2a2a3e' } },
      axisLabel: { color: '#a0a0b0' },
      splitLine: { lineStyle: { color: 'rgba(42,42,62,0.3)' } },
    },
    series: [
      {
        type: 'scatter',
        data: goalsData.map(t => [
          t.场均失球,
          t.场均进球,
          t.积分,
          t.球队,
        ]),
        symbolSize: (data: number[]) => Math.sqrt(data[2]) * 3,
        itemStyle: {
          color: (params: any) => {
            const rank = params.data[2];
            if (rank <= 4) return '#ffd700';
            if (rank <= 10) return '#00d4aa';
            return '#e6005c';
          },
          opacity: 0.7,
        },
        emphasis: {
          itemStyle: { opacity: 1, borderColor: '#fff', borderWidth: 2 },
        },
      },
    ],
  };

  const styleColors: Record<string, string> = {
    '控球进攻型': '#e6005c',
    '控球保守型': '#6366f1',
    '反击型': '#ff6b35',
    '防守型': '#00d4aa',
  };

  return (
    <section
      id="team-analysis"
      ref={sectionRef}
      className="section-padding"
      style={{ background: '#0a0a0f' }}
    >
      <div className="container-custom">
        <div
          className={`mb-10 transition-all duration-700 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            球队深度分析
          </h2>
          <p className="text-[#a0a0b0]">
            从攻防能力、战术风格、进攻效率等多维度剖析球队表现
          </p>
        </div>

        {/* Radar Chart */}
        <div
          className={`chart-container mb-8 transition-all duration-700 delay-100 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <h3 className="text-lg font-bold text-white mb-4">
                Top 4 球队攻防能力对比
              </h3>
              <ReactECharts
                option={radarOption}
                style={{ height: 400 }}
                opts={{ renderer: 'svg' }}
              />
            </div>
            <div className="flex flex-col justify-center">
              <h4 className="text-base font-bold text-white mb-4">分析洞察</h4>
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-[rgba(230,0,92,0.1)] border border-[rgba(230,0,92,0.2)]">
                  <div className="text-[#e6005c] font-medium text-sm mb-1">巴塞罗那</div>
                  <div className="text-[#a0a0b0] text-xs">
                    传球成功率高达89.7%，控球进攻战术成熟，6项指标均衡发展
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[rgba(0,212,170,0.1)] border border-[rgba(0,212,170,0.2)]">
                  <div className="text-[#00d4aa] font-medium text-sm mb-1">皇家马德里</div>
                  <div className="text-[#a0a0b0] text-xs">
                    场均射门17.5次，进攻侵略性最强，射门次数联赛第一
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[rgba(255,215,0,0.1)] border border-[rgba(255,215,0,0.2)]">
                  <div className="text-[#ffd700] font-medium text-sm mb-1">马德里竞技</div>
                  <div className="text-[#a0a0b0] text-xs">
                    射正率40.5%联赛最高，进攻效率出色，防守稳固
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[rgba(99,102,241,0.1)] border border-[rgba(99,102,241,0.2)]">
                  <div className="text-[#6366f1] font-medium text-sm mb-1">比利亚雷亚尔</div>
                  <div className="text-[#a0a0b0] text-xs">
                    防守反击特征明显，解围能力强，战术执行力出色
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scatter Charts */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <div
            className={`chart-container transition-all duration-700 delay-200 ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <h3 className="text-lg font-bold text-white mb-4">
              进攻效率分析
            </h3>
            <p className="text-xs text-[#a0a0b0] mb-3">
              X轴=场均射门, Y轴=场均进球, 气泡大小=积分, 颜色=射正率
            </p>
            <ReactECharts
              option={offenseOption}
              style={{ height: 380 }}
              opts={{ renderer: 'svg' }}
            />
          </div>

          <div
            className={`chart-container transition-all duration-700 delay-300 ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <h3 className="text-lg font-bold text-white mb-4">
              攻防平衡图
            </h3>
            <p className="text-xs text-[#a0a0b0] mb-3">
              X轴=场均失球(反向), Y轴=场均进球, 气泡大小=积分
            </p>
            <ReactECharts
              option={goalsOption}
              style={{ height: 380 }}
              opts={{ renderer: 'svg' }}
            />
          </div>
        </div>

        {/* Tactical Style Classification */}
        <div
          className={`chart-container mb-8 transition-all duration-700 delay-400 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <h3 className="text-lg font-bold text-white mb-6">
            球队战术风格分类
          </h3>
          <div className="grid lg:grid-cols-2 gap-8">
            <ReactECharts
              option={{
                backgroundColor: 'transparent',
                tooltip: {
                  trigger: 'item',
                  backgroundColor: 'rgba(26,26,46,0.95)',
                  borderColor: '#2a2a3e',
                  textStyle: { color: '#fff' },
                  formatter: (params: any) => {
                    return `<strong>${params.data[3]}</strong><br/>
                            控球指数: ${params.data[0].toFixed(2)}<br/>
                            进攻指数: ${params.data[1].toFixed(2)}`;
                  },
                },
                grid: { left: '12%', right: '8%', top: '10%', bottom: '12%' },
                xAxis: {
                  name: '控球指数 →',
                  nameTextStyle: { color: '#a0a0b0' },
                  axisLine: { lineStyle: { color: '#2a2a3e' } },
                  axisLabel: { color: '#a0a0b0' },
                  splitLine: { lineStyle: { color: 'rgba(42,42,62,0.3)' } },
                },
                yAxis: {
                  name: '进攻指数 →',
                  nameTextStyle: { color: '#a0a0b0' },
                  axisLine: { lineStyle: { color: '#2a2a3e' } },
                  axisLabel: { color: '#a0a0b0' },
                  splitLine: { lineStyle: { color: 'rgba(42,42,62,0.3)' } },
                },
                series: [
                  {
                    type: 'scatter',
                    data: teamStyle.map(t => [
                      t.控球指数,
                      t.进攻指数,
                      t.排名,
                      t.球队,
                      t.战术风格,
                    ]),
                    symbolSize: (data: any[]) => (data[2] <= 4 ? 18 : 12),
                    itemStyle: {
                      color: (params: any) =>
                        styleColors[params.data[4]] || '#a0a0b0',
                      opacity: 0.8,
                    },
                    emphasis: {
                      itemStyle: {
                        opacity: 1,
                        borderColor: '#fff',
                        borderWidth: 2,
                      },
                    },
                  },
                ],
              }}
              style={{ height: 400 }}
              opts={{ renderer: 'svg' }}
            />
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(styleColors).map(([style, color]) => (
                <div
                  key={style}
                  className="p-4 rounded-xl border"
                  style={{
                    background: `${color}10`,
                    borderColor: `${color}30`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ background: color }}
                    />
                    <span className="font-medium text-sm" style={{ color }}>
                      {style}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {teamStyle
                      .filter(t => t.战术风格 === style)
                      .map(t => (
                        <span
                          key={t.球队}
                          className="text-xs px-2 py-0.5 rounded bg-[rgba(255,255,255,0.05)] text-[#a0a0b0]"
                        >
                          {t.球队}
                        </span>
                      ))}
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
