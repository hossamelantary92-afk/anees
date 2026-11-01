import { useState, useEffect, useCallback } from 'react';
import { ALL_ADHKAR, DhikrItem } from './data/adhkarData';
import { Header } from './components/Header';
import { AdhkarSection } from './components/AdhkarSection';
import { DigitalTasbih } from './components/DigitalTasbih';
import { SourcesEncyclopedia } from './components/SourcesEncyclopedia';
import { DhikrModal } from './components/DhikrModal';

const localDay = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const initialCounts = () => Object.fromEntries(ALL_ADHKAR.map(d => [d.id, d.count]));
export default function App() {
  const [countDate, setCountDate] = useState(localDay);
  useEffect(() => {
    const check = () => { const today = localDay(); if (today !== countDate) { setRemainingCounts(initialCounts()); setCountDate(today); } };
    const timer = window.setInterval(check, 30000);
    window.addEventListener('focus', check);
    document.addEventListener('visibilitychange', check);
    return () => { clearInterval(timer); window.removeEventListener('focus', check); document.removeEventListener('visibilitychange', check); };
  }, [countDate]);
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('adhkar_theme');
      if (savedTheme) return savedTheme === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Sound preference
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('adhkar_sound');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });

  // Font size scale
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('adhkar_fontsize');
      if (saved === 'large' || saved === 'xlarge') return saved;
    }
    return 'normal';
  });

  // Active top navigation tab
  const [activeTab, setActiveTab] = useState<'adhkar' | 'tasbih' | 'sources'>('adhkar');

  // Modal inspection state
  const [selectedDhikrForModal, setSelectedDhikrForModal] = useState<DhikrItem | null>(null);

  const [prayerSession, setPrayerSession] = useState<string>(() => { try { return JSON.parse(localStorage.getItem('hisn_prayer') || '"الفجر"'); } catch { return 'الفجر'; } });
  useEffect(() => { const listener = () => { try { setPrayerSession(JSON.parse(localStorage.getItem('hisn_prayer') || '"الفجر"')); } catch {} }; window.addEventListener('hisn-prayer',listener); return () => window.removeEventListener('hisn-prayer',listener); }, []);
  const prayerKey = (id: string) => ALL_ADHKAR.find(d => d.id === id)?.category === 'afterPrayer' ? `${id}:${prayerSession}` : id;
  // Remaining counts per dhikr with date-based persistence
  const [remainingCounts, setRemainingCounts] = useState<Record<string, number>>(() => {
    const today = localDay();
    const savedDate = localStorage.getItem('adhkar_date');
    const savedCounts = localStorage.getItem('adhkar_remaining');

    if (savedDate === today && savedCounts) {
      try {
        const parsed = JSON.parse(savedCounts);
        const result: Record<string, number> = initialCounts();
        for (const d of ALL_ADHKAR) for (const key of [d.id, ...['الفجر','الظهر','العصر','المغرب','العشاء'].map(p => `${d.id}:${p}`)]) if (Number.isInteger(parsed[key])) result[key] = Math.max(0,Math.min(d.count,parsed[key]));
        return result;
      } catch {
        // Fallback to initial
      }
    }

    // New day or fresh session: initialize counts
    const initial: Record<string, number> = {};
    ALL_ADHKAR.forEach((d) => {
      initial[d.id] = d.count;
    });
    localStorage.setItem('adhkar_date', today);
    localStorage.setItem('adhkar_remaining', JSON.stringify(initial));
    return initial;
  });

  // Sync theme to <html> element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('adhkar_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('adhkar_theme', 'light');
    }
  }, [isDark]);

  // Persist sound
  useEffect(() => {
    localStorage.setItem('adhkar_sound', soundEnabled.toString());
  }, [soundEnabled]);

  // Persist font size
  useEffect(() => {
    localStorage.setItem('adhkar_fontsize', fontSize);
  }, [fontSize]);

  // Persist counts
  useEffect(() => {
    const today = localDay();
    localStorage.setItem('adhkar_date', today);
    localStorage.setItem('adhkar_remaining', JSON.stringify(remainingCounts));
  }, [remainingCounts]);

  const toggleDark = useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => !prev);
  }, []);

  const cycleFontSize = useCallback(() => {
    setFontSize((prev) => {
      if (prev === 'normal') return 'large';
      if (prev === 'large') return 'xlarge';
      return 'normal';
    });
  }, []);

  const handleCountDecrement = useCallback((id: string) => {
    setRemainingCounts((prev) => {
      const current = prev[prayerKey(id)] ?? ALL_ADHKAR.find(d => d.id === id)?.count ?? 1;
      if (current <= 0) return prev;
      return {
        ...prev,
        [prayerKey(id)]: current - 1,
      };
    });
  }, [prayerSession]);

  const handleUndo = useCallback((id: string) => {
    const target = ALL_ADHKAR.find(d => d.id === id);
    if (target) setRemainingCounts(prev => ({ ...prev, [prayerKey(id)]: Math.min(target.count, (prev[prayerKey(id)] ?? target.count) + 1) }));
  }, [prayerSession]);

  const handleResetDhikr = useCallback((id: string) => {
    const target = ALL_ADHKAR.find((d) => d.id === id);
    if (!target) return;
    setRemainingCounts((prev) => ({
      ...prev,
      [prayerKey(id)]: target.count,
    }));
  }, [prayerSession]);

  const handleResetCategory = useCallback((categoryId: string) => {
    setRemainingCounts((prev) => {
      const updated = { ...prev };
      ALL_ADHKAR.filter((d) => d.category === categoryId).forEach((d) => {
        updated[prayerKey(d.id)] = d.count;
      });
      return updated;
    });
  }, [prayerSession]);

  const displayCounts = Object.fromEntries(ALL_ADHKAR.map(d => [d.id, remainingCounts[prayerKey(d.id)] ?? d.count]));

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0B1120] text-stone-900 dark:text-stone-100 flex flex-col font-tajawal transition-colors selection:bg-emerald-200 dark:selection:bg-emerald-900">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDark={isDark}
        toggleDark={toggleDark}
        soundEnabled={soundEnabled}
        toggleSound={toggleSound}
        fontSize={fontSize}
        cycleFontSize={cycleFontSize}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'adhkar' && (
          <AdhkarSection
            remainingCounts={displayCounts}
            onCountDecrement={handleCountDecrement}
            onReset={handleResetDhikr}
            onUndo={handleUndo}
            onResetCategory={handleResetCategory}
            onOpenModal={setSelectedDhikrForModal}
            fontSize={fontSize}
            soundEnabled={soundEnabled}
          />
        )}

        {activeTab === 'tasbih' && (
          <DigitalTasbih
            soundEnabled={soundEnabled}
            toggleSound={toggleSound}
          />
        )}

        {activeTab === 'sources' && (
          <SourcesEncyclopedia />
        )}
      </main>

      {/* Detailed Hadith Verification Modal */}
      <DhikrModal
        dhikr={selectedDhikrForModal}
        onClose={() => setSelectedDhikrForModal(null)}
      />

      {/* Footer */}
      <footer className="mt-16 py-8 border-t border-stone-200 dark:border-stone-800 text-xs text-stone-500 dark:text-stone-400">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right">
          <div>
            <p className="font-semibold text-stone-700 dark:text-stone-300">
              حصن الأذكار اليومية الموثقة
            </p>
            <p className="mt-0.5">
              نصوص من الكتاب والسنة مع مراجع للرجوع إليها
            </p>
          </div>

          <div className="flex items-center gap-4 text-stone-600 dark:text-stone-400">
            <button
              onClick={() => setActiveTab('adhkar')}
              className="hover:underline"
            >
              الأوراد
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setActiveTab('tasbih')}
              className="hover:underline"
            >
              السبحة
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setActiveTab('sources')}
              className="hover:underline"
            >
              المصادر التراثية
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
