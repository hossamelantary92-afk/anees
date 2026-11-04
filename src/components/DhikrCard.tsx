import React, { useState } from 'react';
import { Check, RotateCcw, Info, Copy, Undo2, Heart } from 'lucide-react';
import { DhikrItem } from '../data/adhkarData';
import { playBeadClick, playCompletionChime, triggerHaptic } from '../utils/audio';

interface DhikrCardProps {
  dhikr: DhikrItem;
  remainingCount: number;
  onCountDecrement: (id: string) => void;
  onReset: (id: string) => void;
  onUndo: (id: string) => void;
  favorite?: boolean;
  onFavorite?: (id: string) => void;
  onOpenModal: (dhikr: DhikrItem) => void;
  fontSize: 'normal' | 'large' | 'xlarge';
  soundEnabled: boolean;
}

export const DhikrCard: React.FC<DhikrCardProps> = ({
  dhikr,
  remainingCount,
  onCountDecrement,
  onReset,
  onUndo,
  favorite,
  onFavorite,
  onOpenModal,
  fontSize,
  soundEnabled,
}) => {
  const [copied, setCopied] = useState(false);
  const [isPressing, setIsPressing] = useState(false);

  const isCompleted = remainingCount <= 0;
  const totalCount = dhikr.count;
  const currentCompleted = Math.max(0, totalCount - remainingCount);
  const progressPercent = Math.min(100, Math.round((currentCompleted / totalCount) * 100));

  const textFontSizeClass = {
    normal: 'text-xl sm:text-2xl leading-loose',
    large: 'text-2xl sm:text-3xl leading-loose',
    xlarge: 'text-3xl sm:text-4xl leading-loose',
  }[fontSize];

  const handleTap = () => {
    if (isCompleted) return;

    if (soundEnabled) {
      if (remainingCount === 1) {
        playCompletionChime();
      } else {
        playBeadClick();
      }
    }
    triggerHaptic(remainingCount === 1 ? 50 : 20);
    onCountDecrement(dhikr.id);
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(`${dhikr.text}\n\n[المصدر: ${dhikr.source}]`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore
    }
  };

  return (
    <article
      className={`anees-dhikr-card group relative rounded-2xl border p-5 sm:p-7 transition-all duration-200 ${
        isCompleted
          ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/30 dark:border-emerald-500/20 shadow-xs'
          : 'bg-white dark:bg-[#121A2D] border-stone-200/90 dark:border-stone-800 shadow-xs hover:border-stone-300 dark:hover:border-stone-700'
      }`}
    >
      {/* Top Header: Unboxed metadata (No pill badges) */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500 dark:text-stone-400 mb-4 pb-3 border-b border-stone-100 dark:border-stone-800/80">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-stone-900 dark:text-stone-100">
            {dhikr.title}
          </span>
          <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">·</span>

          {dhikr.count > 1 && (
            <>
              <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">·</span>
              <span className="tabular-nums font-medium text-emerald-800 dark:text-emerald-400">
                {dhikr.count} مرات
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 card-utilities">
          <button onClick={() => onFavorite?.(dhikr.id)} aria-label={favorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة'} aria-pressed={!!favorite} className="utility-action text-emerald-700"><Heart className="w-4 h-4" fill={favorite ? 'currentColor' : 'none'} /></button>
          <button
            onClick={handleCopy}
            title="نسخ نص الذكر"
            aria-label="نسخ نص الذكر"
            className="utility-action text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => onOpenModal(dhikr)}
            title="عرض فضل الذكر"
            aria-label="عرض فضل الذكر"
            className="utility-action text-xs rounded-lg text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
            <span className="font-medium">فضل الذكر</span>
          </button>
        </div>
      </div>

      {/* Sacred Text Body */}
      <div
        className={`select-text py-2 px-1 text-center sm:text-right transition-opacity ${
          isCompleted ? 'opacity-75' : 'opacity-100'
        }`}
      >
        <p
          className={`font-amiri text-stone-900 dark:text-stone-100 whitespace-pre-line ${textFontSizeClass}`}
        >
          {dhikr.text}
        </p>
      </div>

      {dhikr.timingRule && <p className="mt-4 text-sm text-stone-500 leading-relaxed">{dhikr.timingRule}</p>}
      {/* Progress Line for Multiple Repetitions */}
      {totalCount > 1 && (
        <div className="mt-4 w-full h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-600 dark:bg-emerald-400 transition-all duration-200"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {/* Interactive Bottom Control Strip */}
      <div className="mt-5 pt-3 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between gap-4">
        <button onClick={() => onUndo(dhikr.id)} disabled={remainingCount >= totalCount} aria-label="تراجع عن ضغطة" className="utility-action disabled:opacity-25 text-stone-500"><Undo2 className="w-5 h-5" /></button>
        {/* Reset Counter */}
        <button
          onClick={() => onReset(dhikr.id)}
          title="إعادة ضبط العداد"
          aria-label="إعادة ضبط العداد"
          className="text-xs text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 inline-flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>إعادة</span>
        </button>

        {/* Counter Button */}
        <button
          onClick={handleTap}
          disabled={isCompleted}
          onMouseDown={() => setIsPressing(true)}
          onMouseUp={() => setIsPressing(false)}
          onMouseLeave={() => setIsPressing(false)}
          className={`min-w-[120px] sm:min-w-[140px] h-12 rounded-xl flex items-center justify-center gap-2 font-tajawal text-sm font-bold transition-all transform active:scale-95 ${
            isCompleted
              ? 'bg-emerald-600/15 text-emerald-800 dark:text-emerald-300 cursor-default'
              : isPressing
              ? 'bg-emerald-800 text-white shadow-inner scale-98'
              : 'bg-emerald-700 dark:bg-emerald-600 text-white hover:bg-emerald-800 dark:hover:bg-emerald-500 shadow-md hover:shadow-lg'
          }`}
        >
          {isCompleted ? (
            <>
              <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>تم الإنجاز</span>
            </>
          ) : (
            <>
              <span>تبقى:</span>
              <span className="text-lg tabular-nums font-mono px-1">
                {remainingCount}
              </span>
              <span className="text-xs opacity-80 font-normal">
                / {totalCount}
              </span>
            </>
          )}
        </button>
      </div>
    </article>
  );
};
