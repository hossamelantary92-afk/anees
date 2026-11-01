import React from 'react';
import { Moon, Sun, Volume2, VolumeX, Type } from 'lucide-react';

interface HeaderProps {
  activeTab: 'adhkar' | 'tasbih' | 'sources';
  setActiveTab: (tab: 'adhkar' | 'tasbih' | 'sources') => void;
  isDark: boolean;
  toggleDark: () => void;
  soundEnabled: boolean;
  toggleSound: () => void;
  fontSize: 'normal' | 'large' | 'xlarge';
  cycleFontSize: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isDark,
  toggleDark,
  soundEnabled,
  toggleSound,
  fontSize,
  cycleFontSize,
}) => {
  const fontSizeLabel = {
    normal: 'أ',
    large: 'أ+',
    xlarge: 'أ++',
  }[fontSize];

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 dark:bg-[#0B1120]/90 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 min-h-16 py-3 flex flex-wrap items-center justify-between gap-3 md:gap-8">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => setActiveTab('adhkar')}
          className="text-right text-base sm:text-xl font-bold font-tajawal tracking-tight text-emerald-900 dark:text-emerald-300 whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity"
        >
          حصن الأذكار اليومية
        </button>

        {/* Zone 2: Navigation Links */}
        <nav className="order-3 w-full lg:order-none lg:w-auto flex items-center justify-center gap-1 sm:gap-6 text-xs sm:text-sm font-medium">
          <button
            onClick={() => setActiveTab('adhkar')}
            className={`px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'adhkar'
                ? 'bg-emerald-100/70 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 font-semibold'
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            الأوراد اليومية
          </button>
          <button
            onClick={() => setActiveTab('tasbih')}
            className={`px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'tasbih'
                ? 'bg-emerald-100/70 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 font-semibold'
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            السبحة الإلكترونية
          </button>
          <button
            onClick={() => setActiveTab('sources')}
            className={`px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'sources'
                ? 'bg-emerald-100/70 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 font-semibold'
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            أهم مصادر الأذكار
          </button>
        </nav>

        {/* Zone 3: Primary Utilities */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Font Size Adjuster */}
          <button
            onClick={cycleFontSize}
            title="تغيير حجم خط الأذكار"
            aria-label="تغيير حجم خط الأذكار"
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-colors text-xs font-bold"
          >
            <span className="flex items-center gap-0.5">
              <Type className="w-3.5 h-3.5" />
              <span className="text-[11px]">{fontSizeLabel}</span>
            </span>
          </button>

          {/* Sound Mute/Unmute */}
          <button
            onClick={toggleSound}
            title={soundEnabled ? 'كتم صوت التسبيح' : 'تفعيل صوت التسبيح'}
            aria-label={soundEnabled ? 'كتم صوت التسبيح' : 'تفعيل صوت التسبيح'}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-colors"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-stone-400" />
            )}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleDark}
            title={isDark ? 'الوضع النهاري' : 'الوضع الليلي'}
            aria-label={isDark ? 'الوضع النهاري' : 'الوضع الليلي'}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-colors"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-stone-600" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
