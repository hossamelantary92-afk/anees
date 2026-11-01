import React from 'react';
import { X, BookOpen, Award, UserCheck, ShieldCheck, Share2, Check } from 'lucide-react';
import { DhikrItem } from '../data/adhkarData';

interface DhikrModalProps {
  dhikr: DhikrItem | null;
  onClose: () => void;
}

export const DhikrModal: React.FC<DhikrModalProps> = ({ dhikr, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!dhikr) return;
    const listener = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', listener);
    return () => document.removeEventListener('keydown', listener);
  }, [dhikr, onClose]);
  if (!dhikr) return null;

  const handleCopy = async () => {
    try {
      const shareText = `${dhikr.title}\n\n${dhikr.text}\n\nالمصدر: ${dhikr.referenceDetails}\nالفضل: ${dhikr.virtue}`;
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore copy error
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-[#131C31] border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto text-right text-stone-900 dark:text-stone-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-stone-100 dark:border-stone-800">
          <div>
            <span className="text-xs font-medium text-emerald-800 dark:text-emerald-400">
              توثيق وتخريج الحديث
            </span>
            <h3 className="text-lg sm:text-xl font-bold font-tajawal text-stone-900 dark:text-stone-100 mt-0.5">
              {dhikr.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="إغلاق النافذة"
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sacred Text Preview */}
        <div className="my-5 p-4 sm:p-5 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/60 dark:border-stone-800/80">
          <p className="font-amiri text-lg sm:text-xl leading-loose text-stone-900 dark:text-stone-100 text-center select-text">
            {dhikr.text}
          </p>
        </div>

        {dhikr.sourceUrl && <a href={dhikr.sourceUrl} target="_blank" rel="noopener noreferrer" className="block mb-5 text-sm text-emerald-700 underline">الرجوع إلى المرجع</a>}
        {/* Detailed Verification Specs */}
        <div className="space-y-4 text-sm">
          {/* Narrator */}
          <div className="flex items-start gap-3">
            <UserCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-stone-800 dark:text-stone-200 block text-xs">
                الصحابي الراوي:
              </span>
              <p className="text-stone-600 dark:text-stone-300 mt-0.5">
                {dhikr.narrator}
              </p>
            </div>
          </div>

          {/* Reference & Book */}
          <div className="flex items-start gap-3">
            <BookOpen className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-stone-800 dark:text-stone-200 block text-xs">
                المصدر والتخريج الدقيق:
              </span>
              <p className="text-stone-600 dark:text-stone-300 mt-0.5 font-sans leading-relaxed">
                {dhikr.referenceDetails}
              </p>
            </div>
          </div>

          {/* Virtue / Reward */}
          {dhikr.virtue && <div className="flex items-start gap-3">
            <Award className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-stone-800 dark:text-stone-200 block text-xs">
                فضل الذكر وثمرته:
              </span>
              <p className="text-stone-700 dark:text-stone-200 mt-0.5 leading-relaxed bg-amber-500/5 dark:bg-amber-400/5 p-2.5 rounded-lg border border-amber-500/15 dark:border-amber-400/15">
                {dhikr.virtue}
              </p>
            </div>
          </div>

          }
          {/* Meaning / Explanation */}
          {dhikr.explanation && (
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-stone-800 dark:text-stone-200 block text-xs">
                  البيان واللطائف الإيمانية:
                </span>
                <p className="text-stone-600 dark:text-stone-300 mt-0.5 leading-relaxed">
                  {dhikr.explanation}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-3">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>تم النسخ بنجاح</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>نسخ الذكر وتخريجه</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-white transition-colors"
          >
            تم
          </button>
        </div>
      </div>
    </div>
  );
};
