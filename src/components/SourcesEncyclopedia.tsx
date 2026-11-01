import React, { useState } from 'react';
import { BookOpen, Search, ShieldCheck, CheckCircle2, BookmarkCheck, ArrowRight } from 'lucide-react';
import { CLASSICAL_SOURCES, SCHOLARLY_PRINCIPLES, ClassicalSource } from '../data/sourcesData';

interface SourcesEncyclopediaProps {
  onSelectCategory?: (category: string) => void;
}

export const SourcesEncyclopedia: React.FC<SourcesEncyclopediaProps> = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedSourceId, setExpandedSourceId] = useState<string | null>(CLASSICAL_SOURCES[0].id);

  const categories = [
    { id: 'all', label: 'كافة المصادر المعتمدة' },
    { id: 'primary_sahih', label: 'أمهات الصحيحين' },
    { id: 'encyclopedic_classical', label: 'الموسوعات الجامعة' },
    { id: 'contemporary_concise', label: 'المختصرات المعاصرة' },
  ];

  const filteredSources = CLASSICAL_SOURCES.filter((source) => {
    const matchesCategory =
      selectedCategory === 'all' || source.category === selectedCategory;
    const matchesSearch =
      source.title.includes(searchQuery) ||
      source.author.includes(searchQuery) ||
      source.summary.includes(searchQuery) ||
      source.importance.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Title & Introduction */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-400">
          دليل التوثيق والمصادر التراثية المعتمدة
        </span>
        <h2 className="text-2xl sm:text-4xl font-bold font-tajawal text-stone-900 dark:text-stone-100 mt-1">
          أهم مصادر أذكار المسلم اليومية
        </h2>
        <p className="mt-3 text-sm sm:text-base text-stone-600 dark:text-stone-300 font-tajawal leading-relaxed">
          الأصل في الأذكار النبوية التوقيف والاتباع؛ وقد تتابع جهابذة علماء الحديث عبر القرون على جمع أحاديث الأذكار وتمييز صحيحها من ضعيفها، لتكون للمسلم حصناً حصيناً ونوراً يقتبس منه في يومه وليلته.
        </p>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        {/* Category Filters */}
        <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-900/80 rounded-xl overflow-x-auto w-full sm:w-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium font-tajawal transition-colors whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs font-semibold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث في الكتب أو المؤلفين..."
            className="w-full text-xs py-2 pr-9 pl-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#121A2D] text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-hidden focus:border-emerald-600 font-tajawal"
          />
        </div>
      </div>

      {/* Sources List / Cards */}
      <div className="space-y-6">
        {filteredSources.map((source: ClassicalSource) => {
          const isExpanded = expandedSourceId === source.id;

          return (
            <article
              key={source.id}
              className="bg-white dark:bg-[#121A2D] border border-stone-200/90 dark:border-stone-800 rounded-2xl p-6 sm:p-7 shadow-xs transition-all hover:border-stone-300 dark:hover:border-stone-700"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100 dark:border-stone-800/80">
                <div>
                  <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mb-1">
                    <span>{source.categoryLabel}</span>
                    <span aria-hidden="true">·</span>
                    <span>وفاة المؤلف: {source.deathYearHijri}</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold font-tajawal text-stone-900 dark:text-stone-100">
                    {source.title}
                  </h3>
                  <p className="text-xs text-emerald-800 dark:text-emerald-400 mt-0.5 font-medium">
                    المؤلف: {source.author}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-lg border border-emerald-500/20">
                    {source.verificationGrade}
                  </span>
                </div>
              </div>

              {/* Summary */}
              <p className="mt-4 text-sm sm:text-base text-stone-700 dark:text-stone-300 leading-relaxed font-tajawal">
                {source.summary}
              </p>

              {/* Expandable Deep Dive */}
              {isExpanded ? (
                <div className="mt-5 pt-5 border-t border-stone-100 dark:border-stone-800/80 space-y-4 text-xs sm:text-sm animate-in fade-in duration-150">
                  {/* Methodology */}
                  <div>
                    <h4 className="font-bold text-stone-900 dark:text-stone-100 mb-1 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      المنهج العلمي في التأليف والتحقيق:
                    </h4>
                    <p className="text-stone-600 dark:text-stone-300 leading-relaxed pr-5">
                      {source.methodology}
                    </p>
                  </div>

                  {/* Importance */}
                  <div>
                    <h4 className="font-bold text-stone-900 dark:text-stone-100 mb-1 flex items-center gap-1.5">
                      <BookmarkCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      الأهمية ومكانة الكتاب لدى العلماء:
                    </h4>
                    <p className="text-stone-600 dark:text-stone-300 leading-relaxed pr-5">
                      {source.importance}
                    </p>
                  </div>

                  {/* Key Chapters */}
                  <div>
                    <h4 className="font-bold text-stone-900 dark:text-stone-100 mb-1.5 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      أهم أبواب ومباحث الكتاب:
                    </h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pr-5 text-stone-600 dark:text-stone-300">
                      {source.keyChapters.map((chapter, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>{chapter}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Notable Quote */}
                  <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/60 dark:border-stone-800">
                    <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 block mb-1">
                      من درر كلمات المؤلف:
                    </span>
                    <blockquote className="font-amiri text-base sm:text-lg text-emerald-900 dark:text-emerald-300 italic">
                      {source.notableQuote}
                    </blockquote>
                  </div>

                  <button
                    onClick={() => setExpandedSourceId(null)}
                    className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 underline pt-1"
                  >
                    إخفاء التفاصيل العلمية
                  </button>
                </div>
              ) : (
                <div className="mt-4 pt-3 flex items-center justify-between">
                  <button
                    onClick={() => setExpandedSourceId(source.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:underline"
                  >
                    <span>عرض منهج المؤلف وأهم أبواب الكتاب</span>
                    <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* Scholarly Principles Box (Rules of Islamic Dhikr) */}
      <section className="mt-14 pt-10 border-t border-stone-200 dark:border-stone-800">
        <div className="text-center mb-8">
          <h3 className="text-xl sm:text-2xl font-bold font-tajawal text-stone-900 dark:text-stone-100">
            القواعد الذهبية للعلماء في فقه أذكار اليوم والليلة
          </h3>
          <p className="mt-2 text-xs sm:text-sm text-stone-600 dark:text-stone-400">
            أصول أجمع عليها أئمة الحديث والفقه في التعامل مع الأذكار والأدعية النبوية
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SCHOLARLY_PRINCIPLES.map((principle, index) => (
            <div
              key={index}
              className="p-5 rounded-2xl bg-white dark:bg-[#121A2D] border border-stone-200/80 dark:border-stone-800 shadow-2xs"
            >
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <h4 className="font-bold text-sm sm:text-base font-tajawal text-stone-900 dark:text-stone-100">
                  {principle.title}
                </h4>
              </div>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed font-tajawal pr-7">
                {principle.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
