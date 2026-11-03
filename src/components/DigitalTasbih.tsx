import { storage } from '../utils/storage';
import React, { useState, useEffect } from 'react';
import { RotateCcw, Volume2, VolumeX, Sparkles, Check } from 'lucide-react';
import { playBeadClick, playCompletionChime, triggerHaptic } from '../utils/audio';

const PRESET_PHRASES = [
  'سُبْحَانَ اللَّهِ',
  'الْحَمْدُ لِلَّهِ',
  'لا إِلَهَ إِلا اللَّهُ',
  'اللَّهُ أَكْبَرُ',
  'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ',
  'لا حَوْلَ وَلا قُوَّةَ إِلا بِاللَّهِ',
  'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ',
  'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ',
  'لا إِلَهَ إِلا اللَّهُ وَحْدَهُ لا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
];

const TARGET_PRESETS = [33, 100, 1000, 0]; // 0 means open/unlimited

interface DigitalTasbihProps {
  soundEnabled: boolean;
  toggleSound: () => void;
}

export const DigitalTasbih: React.FC<DigitalTasbihProps> = ({
  soundEnabled,
  toggleSound,
}) => {
  const [count, setCount] = useState<number>(() => {
    const saved = storage.getItem('tasbih_count');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [laps, setLaps] = useState<number>(() => {
    const saved = storage.getItem('tasbih_laps');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [selectedPhrase, setSelectedPhrase] = useState<string>(PRESET_PHRASES[0]);
  const [customPhrase, setCustomPhrase] = useState<string>('');
  const [savedPhrases, setSavedPhrases] = useState<string[]>(() => {try {const v=JSON.parse(storage.getItem('anees_saved_tasbih')||'[]');return Array.isArray(v)?v.filter((x:unknown)=>typeof x==='string').slice(0,30):[];}catch{return [];}});
  const [saveMessage,setSaveMessage]=useState('');
  useEffect(()=>{if(!saveMessage)return;const id=window.setTimeout(()=>setSaveMessage(''),3000);return()=>window.clearTimeout(id);},[saveMessage]);
  const savePhrase=()=>{const phrase=customPhrase.trim();if(!phrase)return;const updated=[phrase,...savedPhrases.filter(v=>v!==phrase)].slice(0,30);setSavedPhrases(updated);storage.setItem('anees_saved_tasbih',JSON.stringify(updated));setSelectedPhrase(phrase);setIsCustomMode(false);setSaveMessage('تم حفظ الذكر');};
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [target, setTarget] = useState<number>(33);
  const [totalLifetime, setTotalLifetime] = useState<number>(() => {
    const saved = storage.getItem('tasbih_lifetime');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [isPressing, setIsPressing] = useState<boolean>(false);
  const [justCompletedLap, setJustCompletedLap] = useState<boolean>(false);

  useEffect(() => {
    storage.setItem('tasbih_count', count.toString());
  }, [count]);

  useEffect(() => {
    storage.setItem('tasbih_laps', laps.toString());
  }, [laps]);

  useEffect(() => {
    storage.setItem('tasbih_lifetime', totalLifetime.toString());
  }, [totalLifetime]);

  const handleTap = () => {
    const newCount = count + 1;
    const newTotal = totalLifetime + 1;
    setTotalLifetime(newTotal);

    if (target > 0 && newCount >= target) {
      // Completed target round
      setCount(0);
      setLaps((prev) => prev + 1);
      setJustCompletedLap(true);
      setTimeout(() => setJustCompletedLap(false), 1200);

      if (soundEnabled) playCompletionChime();
      triggerHaptic(60);
    } else {
      setCount(newCount);
      if (soundEnabled) playBeadClick();
      triggerHaptic(20);
    }
  };

  const handleResetCurrent = () => {
    setCount(0);
  };

  const handleResetAll = () => {
    if (window.confirm('هل تريد تصفير عداد السبحة والدورات الحالية؟')) {
      setCount(0);
      setLaps(0);
    }
  };

  const activeDisplayPhrase = isCustomMode && customPhrase.trim()
    ? customPhrase
    : selectedPhrase;

  // Percentage within current target
  const progressPercent = target > 0 ? Math.min(100, Math.round((count / target) * 100)) : 100;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Title & Concept */}
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold font-tajawal text-stone-900 dark:text-stone-100">
          السبحة الإلكترونية التفاعلية
        </h2>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400 font-tajawal">
          سبحة رقمية هادئة تحاكي نقرات حبات المسبحة التراثية مع حفظ الورد وعدد الدورات
        </p>
      </div>

      {/* Main Glass / Slate Shell */}
      <div className="bg-white dark:bg-[#121A2D] border border-stone-200/90 dark:border-stone-800 rounded-3xl p-6 sm:p-10 shadow-sm">
        {/* Phrase Selection Header */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 mb-2">
            اختر صيغة الذكر والتسبيح:
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESET_PHRASES.slice(0, 5).map((phrase) => (
              <button
                key={phrase}
                onClick={() => {
                  setSelectedPhrase(phrase);
                  setIsCustomMode(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium font-tajawal transition-colors ${
                  !isCustomMode && selectedPhrase === phrase
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800/80 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                {phrase}
              </button>
            ))}
          </div>

          {saveMessage && <span role="status" className="text-xs text-emerald-700">{saveMessage}</span>}
          {/* More Phrases Dropdown or Custom */}
          <div className="mt-3 flex items-center gap-2">
            <select
              value={isCustomMode ? 'custom' : selectedPhrase}
              onChange={(e) => {
                if (e.target.value === 'custom') {
                  setIsCustomMode(true);
                } else {
                  setIsCustomMode(false);
                  setSelectedPhrase(e.target.value);
                }
              }}
              className="anees-tasbih-select w-full text-sm font-tajawal focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a65c]"
            >
              <option value="custom">✍️ إدخال ذكر أو دعاء مخصص...</option>
              {[...savedPhrases,...PRESET_PHRASES].filter((v,i,a)=>a.indexOf(v)===i).map((phrase) => (
                <option key={phrase} value={phrase}>
                  {phrase}
                </option>
              ))}
            </select>
          </div>

          {isCustomMode && (
            <div className="anees-custom-entry"><input
              type="text"
              value={customPhrase}
              onChange={(e) => setCustomPhrase(e.target.value)}
              placeholder="اكتب صيغة الذكر هنا (مثال: أستغفر الله العظيم، لا حول ولا قوة إلا بالله)..."
              className="mt-2 w-full text-sm py-2 px-3 rounded-lg border border-emerald-500/50 bg-emerald-50/20 dark:bg-emerald-950/20 text-stone-900 dark:text-stone-100 focus:outline-hidden font-amiri"
            /><button type="button" onClick={savePhrase} disabled={!customPhrase.trim()} className="anees-save-dhikr"><Check size={17}/> حفظ الذكر</button></div>
          )}
        </div>

        {/* Selected Phrase Display Banner */}
        <div className="py-4 px-5 rounded-2xl bg-[#FAF8F5] dark:bg-[#0B1120] border border-stone-200/80 dark:border-stone-800 text-center mb-8">
          <p className="font-amiri text-2xl sm:text-3xl text-emerald-900 dark:text-emerald-300 tracking-wide font-bold">
            {activeDisplayPhrase}
          </p>
        </div>

        {/* Interactive Tasbih Dial / Main Counter Circle */}
        <div className="flex flex-col items-center justify-center my-6">
          <div className="relative">
            {/* Outer Progress Ring SVG */}
            <svg className="w-64 h-64 sm:w-72 sm:h-72 transform -rotate-90">
              <circle
                cx="50%"
                cy="50%"
                r="44%"
                className="stroke-stone-100 dark:stroke-stone-800"
                strokeWidth="8"
                fill="none"
              />
              {target > 0 && (
                <circle
                  cx="50%"
                  cy="50%"
                  r="44%"
                  className="stroke-emerald-600 dark:stroke-emerald-400 transition-all duration-150"
                  strokeWidth="8"
                  strokeDasharray="800"
                  strokeDashoffset={800 - (800 * progressPercent) / 100}
                  strokeLinecap="round"
                  fill="none"
                />
              )}
            </svg>

            {/* Central Giant Touch Bead */}
            <button
              onClick={handleTap}
              onMouseDown={() => setIsPressing(true)}
              onMouseUp={() => setIsPressing(false)}
              onTouchStart={() => setIsPressing(true)}
              onTouchEnd={() => setIsPressing(false)}
              aria-label="تسبيح"
              className={`absolute inset-4 sm:inset-5 rounded-full flex flex-col items-center justify-center cursor-pointer select-none transition-all duration-100 shadow-xl ${
                isPressing
                  ? 'bg-emerald-900 text-white scale-96 shadow-inner'
                  : 'bg-radial from-emerald-700 to-emerald-900 dark:from-emerald-800 dark:to-[#064e3b] text-white hover:scale-101 active:scale-95'
              }`}
            >
              {/* Ripple / Completion indicator */}
              {justCompletedLap && (
                <span className="absolute top-6 flex items-center gap-1 text-xs text-amber-300 font-bold animate-bounce">
                  <Check className="w-4 h-4" /> اكتملت الدورة!
                </span>
              )}

              <span className="text-5xl sm:text-6xl font-extrabold font-mono tabular-nums tracking-tighter">
                {count}
              </span>

              <span className="text-xs uppercase tracking-widest text-emerald-200 mt-1 font-tajawal">
                {target > 0 ? `الهدف: ${target}` : 'تسبيح مفتوح'}
              </span>

              <span className="text-[11px] text-emerald-300/80 mt-2 font-tajawal">
                اضغط هنا للذكر
              </span>
            </button>
          </div>
        </div>

        {/* Target Presets & Stats Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-6 border-t border-stone-100 dark:border-stone-800 text-xs">
          {/* Target Preset Buttons */}
          <div className="flex items-center gap-1.5">
            <span className="text-stone-500 dark:text-stone-400 ml-1">الهدف:</span>
            {TARGET_PRESETS.map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTarget(t);
                  setCount(0);
                }}
                className={`px-2.5 py-1 rounded-md font-mono tabular-nums font-semibold transition-colors ${
                  target === t
                    ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                }`}
              >
                {t === 0 ? 'حر' : t}
              </button>
            ))}
          </div>

          {/* Sound & Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSound}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>الصوت مفعّل</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-stone-400" />
                  <span>الصوت مكتوم</span>
                </>
              )}
            </button>

            <button
              onClick={handleResetCurrent}
              title="تصفير العداد الحالي"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>تصفير الحالي</span>
            </button>
          </div>
        </div>

        {/* Laps & Lifetime Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-stone-100 dark:border-stone-800/80 text-center">
          <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/60 dark:border-stone-800">
            <span className="text-[11px] text-stone-500 dark:text-stone-400 block font-tajawal">
              الدورات المكتملة
            </span>
            <span className="text-lg font-bold font-mono text-emerald-900 dark:text-emerald-300 tabular-nums">
              {laps}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/60 dark:border-stone-800">
            <span className="text-[11px] text-stone-500 dark:text-stone-400 block font-tajawal">
              إجمالي التسبيحات
            </span>
            <span className="text-lg font-bold font-mono text-stone-900 dark:text-stone-100 tabular-nums">
              {totalLifetime}
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/60 dark:border-stone-800 flex items-center justify-center">
            <button
              onClick={handleResetAll}
              className="text-xs text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>إعادة ضبط السبحة كلياً</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hadith encouragement quote */}
      <div className="mt-8 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-center text-xs text-stone-700 dark:text-stone-300 leading-relaxed font-tajawal">
        <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 mx-auto mb-1" />
        قال رسول الله ﷺ: «مُعَقِّبَاتٌ لا يَخِيبُ قَائِلُهُنَّ؛ يُسَبِّحُ اللَّهَ فِي دُبُرِ كُلِّ صَلاةٍ ثَلاثًا وَثَلاثِينَ، وَيَحْمَدُ ثَلاثًا وَثَلاثِينَ، وَيُكَبِّرُ أَرْبَعًا وَثَلاثِينَ». [رواه مسلم]
      </div>
    </div>
  );
};
