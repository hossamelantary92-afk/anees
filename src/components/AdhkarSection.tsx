import { storage } from '../utils/storage';
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Sun, Moon, Bed, Sunrise, Compass, HeartHandshake, Heart, BookOpen, List, ChevronRight, ChevronLeft, RotateCcw } from 'lucide-react';
import { DHIKR_CATEGORIES, ALL_ADHKAR, DhikrItem } from '../data/adhkarData';
import { DhikrCard } from './DhikrCard';
interface Props {
 favoritesOnly?: boolean;
 remainingCounts: Record<string, number>;
 onCountDecrement: (id: string) => void;
 onReset: (id: string) => void;
 onUndo: (id: string) => void;
 onResetCategory: (id: string) => void;
 onOpenModal: (dhikr: DhikrItem) => void;
 fontSize: 'normal' | 'large' | 'xlarge'; soundEnabled: boolean;
}
const normalize = (text: string) => text.normalize('NFKD').replace(/[\u064B-\u065F\u0670\u0640]/g, '').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').toLowerCase();
function saved<T,>(key: string, fallback: T): T {
 try {
  const value = JSON.parse(storage.getItem(key) || 'null');
  if (value === null || typeof value !== typeof fallback || Array.isArray(value) !== Array.isArray(fallback)) return fallback;
  if (key === 'hisn_favorites' && !value.every((v: unknown) => typeof v === 'string')) return fallback;
  if (key === 'hisn_positions' && Object.values(value).some(v => !Number.isInteger(v) || (v as number) < 0)) return fallback;
  if (key === 'hisn_category' && ![...DHIKR_CATEGORIES.map(c => c.id),'favorites'].includes(value)) return fallback;
  if (key === 'hisn_mode' && !['list','focus'].includes(value)) return fallback;
  if (key === 'hisn_prayer' && !['الفجر','الظهر','العصر','المغرب','العشاء'].includes(value)) return fallback;
  return value;
 } catch { return fallback; }
}
export const AdhkarSection: React.FC<Props> = props => {
 const [selectedCategory, setCategory] = useState('morning');
 useEffect(() => { const open = (event: Event) => { const category = (event as CustomEvent).detail; if (category === 'morning' || category === 'evening') { setCategory(category); setQuery(''); setFilter('all'); } }; window.addEventListener('hisn-open-category', open); return () => window.removeEventListener('hisn-open-category',open); }, []);
 const category = props.favoritesOnly ? 'favorites' : selectedCategory;
 const [mode, setMode] = useState<'list' | 'focus'>(() => saved('hisn_mode','focus'));
 const [positions, setPositions] = useState<Record<string, number>>(() => ({...saved<Record<string,number>>('hisn_positions',{}), 'morning:all':0}));
 const [favorites, setFavorites] = useState<string[]>(() => saved('hisn_favorites',[]));
 const [query, setQuery] = useState('');
 const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
 const [autoNext, setAutoNext] = useState(() => saved('hisn_auto',false));
 const [prayer, setPrayer] = useState(() => saved('hisn_prayer','الفجر'));
 const [categoriesOpen,setCategoriesOpen]=useState(false);
 const [confirmReset, setConfirmReset] = useState(false);
 useEffect(() => { storage.setItem('hisn_category',JSON.stringify(category)); },[category]);
 useEffect(() => { storage.setItem('hisn_mode',JSON.stringify(mode)); },[mode]);
 useEffect(() => { storage.setItem('hisn_positions',JSON.stringify(positions)); },[positions]);
 useEffect(() => { storage.setItem('hisn_favorites',JSON.stringify(favorites)); },[favorites]);
 useEffect(() => { storage.setItem('hisn_auto',JSON.stringify(autoNext)); },[autoNext]);
 useEffect(() => { storage.setItem('hisn_prayer',JSON.stringify(prayer)); window.dispatchEvent(new Event('hisn-prayer')); },[prayer]);
 useEffect(() => { setQuery(''); setFilter('all'); setConfirmReset(false); setCategoriesOpen(false); }, [props.favoritesOnly]);
 const meta = DHIKR_CATEGORIES.find(c => c.id === category);
 const base = useMemo(() => ALL_ADHKAR.filter(d => query.trim() ? (!props.favoritesOnly || favorites.includes(d.id)) && normalize([d.title,d.text,d.source,d.narrator].join(' ')).includes(normalize(query.trim())) : category === 'favorites' ? favorites.includes(d.id) : d.category === category && (d.id !== 'p-ilm' || prayer === 'الفجر')),[category,query,favorites,prayer,props.favoritesOnly]);
 const rows = base.filter(d => filter === 'all' || (filter === 'completed' ? (props.remainingCounts[d.id] ?? d.count) === 0 : (props.remainingCounts[d.id] ?? d.count) > 0));
 const completed = base.filter(d => (props.remainingCounts[d.id] ?? d.count) === 0).length;
 const progress = base.length ? Math.round(completed / base.length * 100) : 0;
 const key = query ? 'search:'+query : category+':'+filter;
 const position = Math.min(positions[key] || 0,Math.max(0,rows.length-1));
 const move = (next: number) => setPositions(p => ({...p,[key]:Math.max(0,Math.min(rows.length-1,next))}));
 const toggleFavorite = (id: string) => setFavorites(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev,id]);
 const decrement = (id: string) => {
   const d = ALL_ADHKAR.find(v => v.id === id)!;
   if (autoNext && mode === 'focus' && filter === 'all' && (props.remainingCounts[id] ?? d.count) === 1 && position < rows.length-1) move(position+1);
   props.onCountDecrement(id);
 };
 const icons: Record<string, React.ReactNode> = { morning:<Sun size={17}/>,evening:<Moon size={17}/>,sleep:<Bed size={17}/>,wakeUp:<Sunrise size={17}/>,afterPrayer:<Compass size={17}/>,dailyDuas:<HeartHandshake size={17}/> };
 const btn = 'px-4 py-2.5 rounded-xl text-sm border border-stone-200 dark:border-stone-700 transition-colors';
 return <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
   <div className="mb-6 flex items-center justify-between gap-4"><div><p className="text-xs text-emerald-700 dark:text-emerald-400 mb-1">مساحة هادئة للذكر</p><h1 className="text-2xl sm:text-3xl font-bold">{props.favoritesOnly ? 'أذكارك المفضلة' : 'أذكار ترافق يومك'}</h1></div><span className="text-xs text-stone-500 whitespace-nowrap">{ALL_ADHKAR.length} ذكرًا ودعاءً</span></div>
   {!props.favoritesOnly && <><button className="md:hidden category-picker mb-3" aria-expanded={categoriesOpen} aria-controls="category-options" onClick={() => setCategoriesOpen(!categoriesOpen)}><span>القسم: {meta?.name || 'المفضلة'}</span><span>{categoriesOpen?'إغلاق':'تغيير القسم'}</span></button>
   <div id="category-options" className={`${categoriesOpen?'grid':'hidden'} grid-cols-2 md:flex md:flex-wrap gap-2 pb-3 mb-4`} aria-label="أقسام الأذكار">
     {DHIKR_CATEGORIES.map(cat => <button key={cat.id} onClick={() => {setCategory(cat.id);setCategoriesOpen(false);setQuery('');setFilter('all');setConfirmReset(false);}} className={`${btn} inline-flex items-center gap-2 min-h-12 text-right justify-start ${category === cat.id ? 'bg-emerald-800 text-white border-emerald-800' : 'bg-white dark:bg-[#121A2D]'}`}>{icons[cat.id] || <Heart size={17}/>} {cat.name}</button>)}
   </div></>}
   <div className="bg-white dark:bg-[#121A2D] border border-stone-200 dark:border-stone-800 rounded-2xl p-5 mb-5">
     <div className="flex items-start justify-between gap-3"><div><h2 className="font-bold text-xl">{query ? 'نتائج البحث' : meta?.name || 'أذكارك المفضلة'}</h2><p className="text-sm text-stone-500 mt-2">{query ? `${base.length} نتيجة` : category === 'favorites' ? 'أذكار حفظتها للوصول السريع' : meta?.description}</p></div>{!query && category !== 'favorites' && <button onClick={() => setConfirmReset(v => !v)} className="p-3 text-stone-400" aria-label="إعادة الورد"><RotateCcw size={18}/></button>}</div>
     {confirmReset && <div className="mt-4 flex flex-wrap gap-3 items-center text-sm"><span>بدء الورد من جديد؟</span><button className={btn} onClick={() => {props.onResetCategory(category);setConfirmReset(false);move(0);}}>نعم، ابدأ من جديد</button><button className={btn} onClick={() => setConfirmReset(false)}>إلغاء</button></div>}
     <div className="flex justify-between text-xs text-stone-500 mt-5 mb-2"><span>المكتمل {completed} من {base.length}</span><span>{progress}%</span></div><div className="h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden"><div className="h-full bg-emerald-600 transition-all" style={{width:`${progress}%`}}/></div>
     {!query && category === 'afterPrayer' && <div className="mt-4 flex flex-wrap items-center gap-3"><label htmlFor="prayer" className="text-sm">ورد الصلاة</label><select id="prayer" value={prayer} onChange={e => setPrayer(e.target.value)} className="p-2 rounded-lg bg-stone-100 dark:bg-stone-800">{['الفجر','الظهر','العصر','المغرب','العشاء'].map(p => <option key={p}>{p}</option>)}</select><span className="text-xs text-stone-500">تقدم مستقل لكل صلاة</span></div>}
   </div>
   <div className="flex flex-wrap items-center gap-3 mb-5"><div className="relative flex-1 min-w-48"><Search className="absolute right-3 top-3 text-stone-400" size={18}/><input aria-label="البحث في الأذكار" value={query} onChange={e => {setQuery(e.target.value);setFilter('all');}} placeholder="ابحث عن ذكر أو دعاء…" className="w-full pr-10 pl-3 py-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#121A2D] text-sm"/></div><div className="flex gap-1"><button aria-pressed={mode === 'focus'} onClick={() => setMode('focus')} className={`${btn} ${mode === 'focus' ? 'bg-emerald-800 text-white' : ''}`}><BookOpen size={17} className="inline ml-1"/>قراءة</button><button aria-pressed={mode === 'list'} onClick={() => setMode('list')} className={`${btn} ${mode === 'list' ? 'bg-emerald-800 text-white' : ''}`}><List size={17} className="inline ml-1"/>قائمة</button></div></div>
   <div className="flex flex-wrap justify-between gap-3 items-center mb-5"><div className="flex gap-1">{(['all','pending','completed'] as const).map((f,i) => <button key={f} onClick={() => setFilter(f)} className={`text-xs px-3 py-2 rounded-lg ${filter===f ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200' : 'text-stone-500'}`}>{['الكل','المتبقية','المكتملة'][i]}</button>)}</div>{mode === 'focus' && <label className="flex gap-2 text-xs items-center text-stone-500"><input type="checkbox" checked={autoNext} onChange={e => setAutoNext(e.target.checked)}/>انتقال تلقائي بعد الإكمال</label>}</div>
   {!rows.length && <p className="text-center py-16 text-stone-500">{category === 'favorites' && !favorites.length ? 'اضغط على القلب بجوار أي ذكر لإضافته هنا.' : 'لا توجد أذكار مطابقة لهذا العرض.'}</p>}
   {mode === 'focus' && !!rows.length && <div className="flex items-center justify-between mb-4 text-sm"><button disabled={!position} onClick={() => move(position-1)} className="p-3 rounded-xl disabled:opacity-25" aria-label="الذكر السابق"><ChevronRight/></button><span className="text-stone-500">الذكر {position+1} من {rows.length}</span><button disabled={position===rows.length-1} onClick={() => move(position+1)} className="p-3 rounded-xl disabled:opacity-25" aria-label="الذكر التالي"><ChevronLeft/></button></div>}
   <div className="space-y-5">{(mode === 'focus' ? rows.slice(position,position+1) : rows).map(d => <DhikrCard key={d.id} dhikr={d} remainingCount={props.remainingCounts[d.id] ?? d.count} onCountDecrement={decrement} onReset={props.onReset} onUndo={props.onUndo} onOpenModal={props.onOpenModal} fontSize={props.fontSize} soundEnabled={props.soundEnabled} favorite={favorites.includes(d.id)} onFavorite={toggleFavorite}/>)}</div>
   {!!rows.length && mode === 'focus' && <div className="mt-5 flex justify-between gap-3"><button disabled={!position} onClick={() => move(position-1)} className={`${btn} disabled:opacity-25`}>السابق</button><button disabled={position === rows.length-1} onClick={() => move(position+1)} className={`${btn} bg-emerald-800 text-white disabled:opacity-25`}>الذكر التالي</button></div>}
 </div>;
};
