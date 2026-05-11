import { useState, useEffect } from 'react';

const navItems = [
  { label: '赛季概览', href: '#overview' },
  { label: '积分榜', href: '#standings' },
  { label: '球队分析', href: '#team-analysis' },
  { label: '球员分析', href: '#player-analysis' },
  { label: '预测模型', href: '#prediction' },
  { label: '实时数据', href: '#live-data' },
];

export default function Navbar() {
  const [activeSection, setActiveSection] = useState('overview');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);

      const sections = navItems.map(item => item.href.slice(1));
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 100) {
            setActiveSection(sections[i]);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (href: string) => {
    const el = document.getElementById(href.slice(1));
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[rgba(10,10,15,0.95)] backdrop-blur-xl shadow-lg'
          : 'bg-transparent'
      }`}
      style={{ height: 64 }}
    >
      <div className="container-custom h-full flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#e6005c] to-[#ff6b35] flex items-center justify-center">
            <span className="text-white font-bold text-sm">西</span>
          </div>
          <span className="text-white font-bold text-lg hidden sm:block">
            西甲数据分析
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-6">
          {navItems.map(item => (
            <button
              key={item.href}
              onClick={() => scrollTo(item.href)}
              className={`nav-link text-sm px-2 py-1 rounded transition-all ${
                activeSection === item.href.slice(1)
                  ? 'text-[#e6005c] bg-[rgba(230,0,92,0.1)]'
                  : ''
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
