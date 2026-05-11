import { useEffect, useRef, useState } from 'react';
import ParticleBackground from '../components/ParticleBackground';
import { Trophy, Users, Target, Calendar } from 'lucide-react';

interface SummaryData {
  totalTeams: number;
  currentRound: number;
  leader: string;
  leaderPoints: number;
  topScorer: string;
  topScorerGoals: number;
}

interface HeroSectionProps {
  summary: SummaryData;
}

function AnimatedNumber({ value, duration = 2000 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const startTime = Date.now();
          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.floor(eased * value));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, duration]);

  return <span ref={ref}>{display}</span>;
}

export default function HeroSection({ summary }: HeroSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const stats = [
    {
      icon: Users,
      value: summary.totalTeams,
      suffix: '支',
      label: '参赛球队',
      color: '#00d4aa',
    },
    {
      icon: Calendar,
      value: summary.currentRound,
      suffix: '轮',
      label: '已赛场次',
      color: '#6366f1',
    },
    {
      icon: Trophy,
      value: summary.leaderPoints,
      suffix: '分',
      label: `榜首: ${summary.leader}`,
      color: '#ffd700',
    },
    {
      icon: Target,
      value: summary.topScorerGoals,
      suffix: '球',
      label: `射手王: ${summary.topScorer}`,
      color: '#e6005c',
    },
  ];

  return (
    <section
      id="overview"
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #1a0a1a 100%)' }}
    >
      <ParticleBackground />

      {/* Hero Background Image Overlay */}
      <div
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage: 'url(/hero-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          mixBlendMode: 'overlay',
        }}
      />

      <div className="relative z-10 container-custom px-6 text-center">
        {/* Badge */}
        <div
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 transition-all duration-700 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'
          }`}
          style={{
            background: 'rgba(230, 0, 92, 0.15)',
            border: '1px solid rgba(230, 0, 92, 0.3)',
          }}
        >
          <span className="w-2 h-2 rounded-full bg-[#e6005c] animate-pulse" />
          <span className="text-sm text-[#e6005c]">2025-2026 赛季进行中</span>
        </div>

        {/* Main Title */}
        <h1
          className={`text-5xl sm:text-6xl lg:text-7xl font-black mb-4 transition-all duration-1000 delay-200 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          <span className="gradient-text">2025-2026</span>
          <br />
          <span className="text-white">西甲联赛</span>
        </h1>

        <p
          className={`text-lg sm:text-xl text-[#a0a0b0] mb-12 max-w-2xl mx-auto transition-all duration-1000 delay-400 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          数据可视化分析与预测平台
        </p>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={`stat-card transition-all duration-700 ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
              }`}
              style={{ transitionDelay: `${600 + index * 150}ms` }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 mx-auto"
                style={{ background: `${stat.color}20` }}
              >
                <stat.icon size={20} style={{ color: stat.color }} />
              </div>
              <div className="font-mono text-3xl font-bold text-white mb-1">
                <AnimatedNumber value={stat.value} />
                <span style={{ color: stat.color }}>{stat.suffix}</span>
              </div>
              <div className="text-xs text-[#a0a0b0]">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Scroll Indicator */}
        <div
          className={`mt-16 transition-all duration-1000 delay-1000 ${
            visible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="flex flex-col items-center gap-2 text-[#a0a0b0]">
            <span className="text-xs">向下滚动探索</span>
            <div className="w-6 h-10 rounded-full border-2 border-[#a0a0b0] flex items-start justify-center p-1">
              <div className="w-1.5 h-3 bg-[#e6005c] rounded-full animate-bounce" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
