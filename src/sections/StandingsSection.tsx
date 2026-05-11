import { useEffect, useRef, useState } from 'react';

interface Team {
  排名: number;
  球队: string;
  积分: number;
  场次: number;
  胜: number;
  平: number;
  负: number;
  进球: number;
  失球: number;
  净胜球: number;
}

interface StandingsSectionProps {
  standings: Team[];
}

export default function StandingsSection({ standings }: StandingsSectionProps) {
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
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const getRankStyle = (rank: number) => {
    if (rank <= 4) return 'bg-gradient-to-r from-[rgba(255,215,0,0.15)] to-transparent border-l-2 border-[#ffd700]';
    if (rank <= 6) return 'bg-gradient-to-r from-[rgba(0,212,170,0.08)] to-transparent border-l-2 border-[#00d4aa]';
    if (rank >= 18) return 'bg-gradient-to-r from-[rgba(230,0,92,0.08)] to-transparent border-l-2 border-[#e6005c]';
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
    <section
      id="standings"
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
            联赛积分榜
          </h2>
          <p className="text-[#a0a0b0]">2025-2026赛季 · 截至第29轮</p>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto chart-container">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th className="w-16">排名</th>
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
              {standings.map((team, index) => (
                <tr
                  key={team.排名}
                  className={`transition-all duration-500 ${getRankStyle(team.排名)} hover:bg-[rgba(230,0,92,0.05)]`}
                  style={{
                    transitionDelay: visible ? `${index * 50}ms` : '0ms',
                    opacity: visible ? 1 : 0,
                    transform: visible ? 'translateX(0)' : 'translateX(-30px)',
                  }}
                >
                  <td>
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${getRankBadge(team.排名)}`}
                    >
                      {team.排名}
                    </span>
                  </td>
                  <td className="font-medium text-white">{team.球队}</td>
                  <td className="text-center text-[#a0a0b0]">{team.场次}</td>
                  <td className="text-center text-[#00d4aa]">{team.胜}</td>
                  <td className="text-center text-[#a0a0b0]">{team.平}</td>
                  <td className="text-center text-[#e6005c]">{team.负}</td>
                  <td className="text-center font-mono text-white">{team.进球}</td>
                  <td className="text-center font-mono text-[#a0a0b0]">{team.失球}</td>
                  <td className="text-center font-mono">
                    <span
                      className={
                        team.净胜球 > 0
                          ? 'text-[#00d4aa]'
                          : team.净胜球 < 0
                          ? 'text-[#e6005c]'
                          : 'text-[#a0a0b0]'
                      }
                    >
                      {team.净胜球 > 0 ? '+' : ''}
                      {team.净胜球}
                    </span>
                  </td>
                  <td className="text-center">
                    <span className="font-mono font-bold text-white text-lg">
                      {team.积分}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {standings.map((team, index) => (
            <div
              key={team.排名}
              className={`stat-card p-4 transition-all duration-500 ${getRankStyle(team.排名)}`}
              style={{
                transitionDelay: visible ? `${index * 50}ms` : '0ms',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateX(0)' : 'translateX(-30px)',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${getRankBadge(team.排名)}`}
                  >
                    {team.排名}
                  </span>
                  <span className="font-medium text-white">{team.球队}</span>
                </div>
                <span className="font-mono font-bold text-xl text-white">
                  {team.积分}分
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 mt-3 text-center text-xs">
                <div>
                  <div className="text-[#a0a0b0]">胜/平/负</div>
                  <div className="text-white font-mono">
                    {team.胜}/{team.平}/{team.负}
                  </div>
                </div>
                <div>
                  <div className="text-[#a0a0b0]">进球</div>
                  <div className="text-[#00d4aa] font-mono">{team.进球}</div>
                </div>
                <div>
                  <div className="text-[#a0a0b0]">失球</div>
                  <div className="text-[#e6005c] font-mono">{team.失球}</div>
                </div>
                <div>
                  <div className="text-[#a0a0b0]">净胜球</div>
                  <div
                    className={`font-mono ${
                      team.净胜球 > 0 ? 'text-[#00d4aa]' : 'text-[#e6005c]'
                    }`}
                  >
                    {team.净胜球 > 0 ? '+' : ''}
                    {team.净胜球}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-6 text-xs text-[#a0a0b0]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#ffd700]" />
            <span>欧冠区 (前4)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#00d4aa]" />
            <span>欧联区 (5-6)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#e6005c]" />
            <span>降级区 (18-20)</span>
          </div>
        </div>
      </div>
    </section>
  );
}
