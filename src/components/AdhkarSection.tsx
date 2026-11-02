import {TrackerDialog} from './TrackerDialog';
import {FavoriteReciters} from './FavoriteReciters';
import { storage } from '../utils/storage';
import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, SlidersHorizontal, BookOpen, List, ChevronRight, ChevronLeft, RotateCcw } from 'lucide-react';
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
 const [favoriteView,setFavoriteView]=useState<'adhkar'|'reciters'>('adhkar');
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
 const [searchOpen,setSearchOpen]=useState(false);
 const [toolsOpen,setToolsOpen]=useState(false);
 const [confirmReset, setConfirmReset] = useState(false);
 useEffect(() => { storage.setItem('hisn_category',JSON.stringify(category)); },[category]);
 useEffect(() => { storage.setItem('hisn_mode',JSON.stringify(mode)); },[mode]);
 useEffect(() => { storage.setItem('hisn_positions',JSON.stringify(positions)); },[positions]);
 useEffect(() => { storage.setItem('hisn_favorites',JSON.stringify(favorites)); },[favorites]);
 useEffect(() => { storage.setItem('hisn_auto',JSON.stringify(autoNext)); },[autoNext]);
 useEffect(() => { storage.setItem('hisn_prayer',JSON.stringify(prayer)); window.dispatchEvent(new Event('hisn-prayer')); },[prayer]);
 useEffect(() => { setQuery(''); setFilter('all'); setConfirmReset(false); setToolsOpen(false); setSearchOpen(false); }, [props.favoritesOnly]);
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
 const btn = 'px-4 py-2.5 rounded-xl text-sm border border-stone-200 dark:border-stone-700 transition-colors';
 const changeCategory=(value:string)=>{setCategory(value);setQuery('');setSearchOpen(false);setFilter('all');setConfirmReset(false);};
 return <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
   {props.favoritesOnly&&<><h1 className="text-2xl font-bold mb-4">المفضلة</h1><div className="grid grid-cols-2 gap-2 mb-5">{(['adhkar','reciters'] as const).map((v,i)=><button key={v} aria-pressed={favoriteView===v} onClick={()=>setFavoriteView(v)} className={`${btn} min-h-12 ${favoriteView===v?'bg-emerald-800 text-white':''}`}>{i?'قرّاء القرآن':'الأذكار المفضلة'}</button>)}</div></>}
   {props.favoritesOnly&&favoriteView==='reciters'&&<FavoriteReciters/>}
   <div hidden={props.favoritesOnly&&favoriteView==='reciters'}>
     {!props.favoritesOnly&&<div className="adhkar-selector"><h1 className="inline-flex items-center gap-2 font-bold text-base shrink-0"><BookOpen size={22}/><span>الأذكار</span></h1><label className="flex-1 min-w-0"><span className="sr-only">اختيار قسم الأذكار</span><select aria-label="اختيار قسم الأذكار" className="worship-input w-full font-semibold text-sm" value={selectedCategory} onChange={e=>changeCategory(e.target.value)}>{DHIKR_CATEGORIES.map(cat=><option key={cat.id} value={cat.id}>{cat.name}</option>)}</select></label></div>}
     <div className="mb-4" aria-label="تقدم الورد"><div className="flex items-center justify-between gap-3 text-xs text-stone-500 dark:text-stone-400"><span>{query?'نتائج البحث: ':''}المكتمل {completed} من {base.length}</span><div className="flex items-center gap-2"><span className="text-emerald-700 dark:text-emerald-300 font-semibold">{progress}%</span>{!query&&category!=='favorites'&&<button onClick={()=>setConfirmReset(true)} aria-label="إعادة الورد" className="utility-action"><RotateCcw size={17}/></button>}</div></div><div role="progressbar" aria-label="تقدم الورد" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} className="h-1 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden"><div className="h-full bg-emerald-600 transition-all" style={{width:`${progress}%`}}/></div></div>
     {!query&&category==='afterPrayer'&&<div className="flex items-center gap-3 mb-4 text-sm"><label htmlFor="prayer">ورد الصلاة</label><select id="prayer" value={prayer} onChange={e=>setPrayer(e.target.value)} className="worship-input flex-1 min-w-0">{['الفجر','الظهر','العصر','المغرب','العشاء'].map(v=><option key={v}>{v}</option>)}</select><span className="text-xs text-stone-500">تقدم مستقل</span></div>}
     <div className="flex items-center justify-between gap-2 mb-4" aria-label="أدوات القراءة"><button aria-expanded={searchOpen} aria-controls="adhkar-search" onClick={()=>{setSearchOpen(!searchOpen);if(searchOpen)setQuery('');}} aria-label={searchOpen?'إغلاق البحث':'البحث في الأذكار'} className={`utility-action border border-stone-200 dark:border-stone-700 ${searchOpen?'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200':''}`}>{searchOpen?<X size={20}/>:<Search size={20}/>}</button><div className="flex items-center gap-1 p-1 rounded-xl bg-stone-100 dark:bg-stone-900"><button aria-pressed={mode==='focus'} onClick={()=>setMode('focus')} className={`utility-action text-sm ${mode==='focus'?'bg-white dark:bg-stone-800 shadow-sm font-semibold':''}`}><BookOpen size={18}/>قراءة</button><button aria-pressed={mode==='list'} onClick={()=>setMode('list')} className={`utility-action text-sm ${mode==='list'?'bg-white dark:bg-stone-800 shadow-sm font-semibold':''}`}><List size={18}/>قائمة</button></div><button aria-expanded={toolsOpen} onClick={()=>setToolsOpen(true)} aria-label="أدوات العرض" className="utility-action border border-stone-200 dark:border-stone-700 relative"><SlidersHorizontal size={20}/>{filter!=='all'&&<span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-600"/>}</button></div>
     {searchOpen&&<div id="adhkar-search" className="mb-4"><label className="sr-only" htmlFor="dhikr-query">البحث في الأذكار</label><input id="dhikr-query" autoFocus value={query} onChange={e=>{setQuery(e.target.value);setFilter('all');}} placeholder={props.favoritesOnly?'ابحث في أذكارك المفضلة…':'ابحث عن ذكر أو دعاء…'} className="worship-input w-full text-sm"/></div>}
     {filter!=='all'&&<button className="text-xs text-emerald-700 dark:text-emerald-300 mb-4 min-h-11" onClick={()=>setFilter('all')}>تصفية: {filter==='pending'?'المتبقية':'المكتملة'} · إلغاء التصفية ×</button>}
     {!rows.length&&<p className="text-center py-10 text-stone-500">{category==='favorites'&&!favorites.length?'اضغط على القلب بجوار أي ذكر لإضافته هنا.':'لا توجد أذكار مطابقة لهذا العرض.'}</p>}
     <div className="space-y-5">{(mode==='focus'?rows.slice(position,position+1):rows).map(d=><DhikrCard key={d.id} dhikr={d} remainingCount={props.remainingCounts[d.id]??d.count} onCountDecrement={decrement} onReset={props.onReset} onUndo={props.onUndo} onOpenModal={props.onOpenModal} fontSize={props.fontSize} soundEnabled={props.soundEnabled} favorite={favorites.includes(d.id)} onFavorite={toggleFavorite}/>)}</div>
     {mode==='focus'&&rows.length>0&&<nav aria-label="التنقل بين الأذكار" className="flex items-center justify-between gap-2 mt-4"><button aria-label="الذكر السابق" disabled={position===0} className="utility-action text-sm disabled:opacity-25" onClick={()=>move(position-1)}><ChevronRight size={20}/><span>السابق</span></button><span className="text-xs text-stone-500 whitespace-nowrap">الذكر {position+1} من {rows.length}</span><button aria-label="الذكر التالي" disabled={position===rows.length-1} className="utility-action text-sm disabled:opacity-25" onClick={()=>move(position+1)}><span>التالي</span><ChevronLeft size={20}/></button></nav>}
   </div>
   {toolsOpen&&<TrackerDialog label="أدوات العرض" onClose={()=>setToolsOpen(false)}><section className="tracker-panel"><div className="flex items-center justify-between gap-3 mb-4"><h2 className="font-bold text-lg">أدوات العرض</h2><button className="utility-action" onClick={()=>setToolsOpen(false)} aria-label="إغلاق أدوات العرض"><X size={22}/></button></div><label className="block text-sm">الأذكار المعروضة<select aria-label="تصفية الأذكار" value={filter} onChange={e=>setFilter(e.target.value as typeof filter)} className="worship-input w-full mt-2"><option value="all">الكل</option><option value="pending">المتبقية</option><option value="completed">المكتملة</option></select></label><label className="flex items-center justify-between gap-3 min-h-14 mt-3 text-sm"><span>انتقال تلقائي بعد إكمال الذكر</span><input type="checkbox" checked={autoNext} onChange={e=>setAutoNext(e.target.checked)}/></label><p className="text-xs text-stone-500 mb-4">يعمل الانتقال التلقائي في وضع القراءة عند عرض الكل.</p><button onClick={()=>setToolsOpen(false)} className="w-full min-h-12 bg-emerald-800 text-white rounded-xl font-bold">تم</button></section></TrackerDialog>}
   {confirmReset&&<TrackerDialog label="إعادة الورد" onClose={()=>setConfirmReset(false)}><section className="tracker-panel"><h2 className="font-bold text-lg">بدء الورد من جديد؟</h2><p className="text-sm mt-3 mb-4">سيتم تصفير تقدم {meta?.name} وإعادة عدّاداته إلى البداية.</p><div className="flex gap-3"><button className={`${btn} bg-emerald-800 text-white`} onClick={()=>{props.onResetCategory(category);setConfirmReset(false);move(0);}}>نعم، ابدأ من جديد</button><button className={btn} onClick={()=>setConfirmReset(false)}>إلغاء</button></div></section></TrackerDialog>}
 </div>;
};
