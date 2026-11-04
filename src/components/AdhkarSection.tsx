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
 const [selectedDuaGroup,setSelectedDuaGroup]=useState('');
 const [duaCounts,setDuaCounts]=useState<Record<string,number>>(()=>{
  try{
   const record=JSON.parse(storage.getItem('anees_dua_scope_counts')||'null');
   const today=new Date().toLocaleDateString('en-CA');
   return record?.date===today&&record?.counts&&typeof record.counts==='object'?record.counts:{};
  }catch{return {};}
 });
 const duaGroups=[
  {id:'prophets',label:'أدعية الأنبياء'},
  {id:'daily',label:'أدعية الحياة اليومية'},
  {id:'worry',label:'أدعية الهم والكرب'},
  {id:'healing',label:'أدعية الشفاء'},
  {id:'comprehensive',label:'الأدعية الجامعة'}
 ];
 const duaGroupIds:Record<string,string[]> = {
  prophets:['d-quran-repentance','d-quran-musa',...ALL_ADHKAR.filter(d=>d.id.startsWith('prophet-')).map(d=>d.id)],
  worry:['life-karb','d-2','prophet-yunus','prophet-nuh-help','d-quran-mercy'],
  healing:['life-healing','life-extra-sick-visit','life-extra-sick-hope','prophet-ayyub']
 };
 const isDuaCategory=(item:DhikrItem)=>item.category==='dailyDuas'||item.category==='dailyLife';
 const selectDua=(value:string)=>{
  setSelectedDuaGroup(value);
  if(value){setCategory(value==='daily'?'dailyLife':'dailyDuas');setQuery('');setSearchOpen(false);setFilter('all');setConfirmReset(false);setPositions(p=>({...p,['dua:'+value+':all']:0}));}
 };

 useEffect(() => { const open = (event: Event) => { const category = (event as CustomEvent).detail; if (category === 'morning' || category === 'evening') { setCategory(category); setSelectedDuaGroup(''); setQuery(''); setDisplaySettings(p=>({...p,adhkar:{...p.adhkar,filter:'all'}})); } }; window.addEventListener('hisn-open-category', open); return () => window.removeEventListener('hisn-open-category',open); }, []);
 const category = props.favoritesOnly ? 'favorites' : selectedCategory;
 const [displaySettings,setDisplaySettings]=useState(()=>{
  const defaults={mode:'focus' as 'list'|'focus',filter:'all' as 'all'|'pending'|'completed',autoNext:false};
  const read=(key:string,fallback:typeof defaults)=>{try{const v=JSON.parse(storage.getItem(key)||'null');return v&&['list','focus'].includes(v.mode)&&['all','pending','completed'].includes(v.filter)&&typeof v.autoNext==='boolean'?{mode:v.mode as typeof defaults.mode,filter:v.filter as typeof defaults.filter,autoNext:v.autoNext}:fallback;}catch{return fallback;}};
  return {adhkar:read('hisn_display_adhkar',{...defaults,mode:saved('hisn_mode','focus'),autoNext:saved('hisn_auto',false)}),favorites:read('hisn_display_favorites',defaults)};
 });
 const scope=props.favoritesOnly?'favorites':'adhkar';
 const {mode,filter,autoNext}=displaySettings[scope];
 const setMode=(mode:'list'|'focus')=>setDisplaySettings(p=>({...p,[scope]:{...p[scope],mode}}));
 const setFilter=(filter:'all'|'pending'|'completed')=>setDisplaySettings(p=>({...p,[scope]:{...p[scope],filter}}));
 const setAutoNext=(autoNext:boolean)=>setDisplaySettings(p=>({...p,[scope]:{...p[scope],autoNext}}));
 const [positions, setPositions] = useState<Record<string, number>>(() => ({...saved<Record<string,number>>('hisn_positions',{}), 'morning:all':0}));
 const [favorites, setFavorites] = useState<string[]>(() => saved('hisn_favorites',[]));
 const [query, setQuery] = useState('');
 const [prayer, setPrayer] = useState(() => saved('hisn_prayer','الفجر'));
 const [searchOpen,setSearchOpen]=useState(false);
 const [toolsOpen,setToolsOpen]=useState(false);
 const [confirmReset, setConfirmReset] = useState(false);
 useEffect(() => { storage.setItem('hisn_category',JSON.stringify(category)); },[category]);
 useEffect(()=>{storage.setItem('anees_dua_scope_counts',JSON.stringify({date:new Date().toLocaleDateString('en-CA'),counts:duaCounts}));},[duaCounts]);
 const scopedCount=(d:DhikrItem)=>selectedDuaGroup&&!props.favoritesOnly?(duaCounts[selectedDuaGroup+':'+d.id]??d.count):(props.remainingCounts[d.id]??d.count);
 const changeDuaCount=(id:string,step:number)=>{
  if(!selectedDuaGroup||props.favoritesOnly)return;
  const item=ALL_ADHKAR.find(d=>d.id===id);if(!item)return;
  const key=selectedDuaGroup+':'+id;
  setDuaCounts(prev=>({...prev,[key]:Math.max(0,Math.min(item.count,(prev[key]??item.count)+step))}));
 };
 const resetDuaGroup=()=>{
  const prefix=selectedDuaGroup+':';
  setDuaCounts(prev=>Object.fromEntries(Object.entries(prev).filter(([key])=>!key.startsWith(prefix))));
 };
 useEffect(() => { storage.setItem('hisn_display_adhkar',JSON.stringify(displaySettings.adhkar)); storage.setItem('hisn_display_favorites',JSON.stringify(displaySettings.favorites)); },[displaySettings]);
 useEffect(() => { storage.setItem('hisn_positions',JSON.stringify(positions)); },[positions]);
 useEffect(() => { storage.setItem('hisn_favorites',JSON.stringify(favorites)); },[favorites]);
 useEffect(() => { storage.setItem('hisn_prayer',JSON.stringify(prayer)); window.dispatchEvent(new Event('hisn-prayer')); },[prayer]);
 useEffect(() => { setQuery(''); setConfirmReset(false); setToolsOpen(false); setSearchOpen(false); }, [props.favoritesOnly]);
 const meta = DHIKR_CATEGORIES.find(c => c.id === category);
 const base = useMemo(() => ALL_ADHKAR.filter(d => {
  if(query.trim())return (!props.favoritesOnly || favorites.includes(d.id)) && normalize([d.title,d.text,d.source,d.narrator].join(' ')).includes(normalize(query.trim()));
  if(category==='favorites')return favorites.includes(d.id);
  if(selectedDuaGroup){
   if(selectedDuaGroup==='daily')return d.category==='dailyLife';
   if(selectedDuaGroup==='comprehensive')return d.category==='dailyDuas'&&!d.id.startsWith('prophet-')&&!['d-4','d-hawqala','d-tawba'].includes(d.id);
   return duaGroupIds[selectedDuaGroup]?.includes(d.id)||false;
  }
  return d.category===category && !isDuaCategory(d) && (d.id!=='p-ilm'||prayer==='الفجر');
 }),[category,query,favorites,prayer,props.favoritesOnly,selectedDuaGroup]);
 const rows = base.filter(d => filter === 'all' || (filter === 'completed' ? scopedCount(d) === 0 : scopedCount(d) > 0));
 const completed = base.filter(d => scopedCount(d) === 0).length;
 const progress = base.length ? Math.round(completed / base.length * 100) : 0;
 const key = query ? 'search:'+query : (selectedDuaGroup?'dua:'+selectedDuaGroup:category)+':'+filter;
 const position = Math.min(positions[key] || 0,Math.max(0,rows.length-1));
 const move = (next: number) => setPositions(p => ({...p,[key]:Math.max(0,Math.min(rows.length-1,next))}));
 const toggleFavorite = (id: string) => setFavorites(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev,id]);
 const decrement = (id: string) => {
   const d = ALL_ADHKAR.find(v => v.id === id)!;
   if (autoNext && mode === 'focus' && filter === 'all' && scopedCount(d) === 1 && position < rows.length-1) move(position+1);
   if(selectedDuaGroup&&!props.favoritesOnly)changeDuaCount(id,-1);
   else props.onCountDecrement(id);
 };
 const btn = 'px-4 py-2.5 rounded-xl text-sm border border-stone-200 dark:border-stone-700 transition-colors';
 const changeCategory=(value:string)=>{setSelectedDuaGroup('');setCategory(value);setQuery('');setSearchOpen(false);setFilter('all');setConfirmReset(false);};
 return <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
   {props.favoritesOnly&&<><h1 className="text-2xl font-bold mb-4">المفضلة</h1><div className="grid grid-cols-2 gap-2 mb-5">{(['adhkar','reciters'] as const).map((v,i)=><button key={v} aria-pressed={favoriteView===v} onClick={()=>setFavoriteView(v)} className={`${btn} min-h-12 ${favoriteView===v?'bg-emerald-800 text-white':''}`}>{i?'قرّاء القرآن':'الأذكار المفضلة'}</button>)}</div></>}
   {props.favoritesOnly&&favoriteView==='reciters'&&<FavoriteReciters/>}
   <div hidden={props.favoritesOnly&&favoriteView==='reciters'}>
     {!props.favoritesOnly&&<div className="anees-two-selectors" dir="rtl">
   <label className="anees-category-picker"><span className="anees-picker-title">✦ الأدعية</span><select aria-label="اختيار قسم الأدعية" className="worship-input w-full font-semibold text-sm" value={selectedDuaGroup} onChange={e=>selectDua(e.target.value)}><option value="">اختر قسم الأدعية</option>{duaGroups.map(group=><option key={group.id} value={group.id}>{group.label}</option>)}</select></label>
   <label className="anees-category-picker"><span className="anees-picker-title"><BookOpen size={18}/> الأذكار</span><select aria-label="اختيار قسم الأذكار" className="worship-input w-full font-semibold text-sm" value={selectedDuaGroup?'':selectedCategory} onChange={e=>changeCategory(e.target.value)}><option value="" disabled>اختر قسم الأذكار</option>{DHIKR_CATEGORIES.filter(cat=>cat.id!=='dailyDuas'&&cat.id!=='dailyLife').map(cat=><option key={cat.id} value={cat.id}>{cat.name}</option>)}</select></label>
  </div>}
     {!props.favoritesOnly&&!!selectedDuaGroup&&<button type="button" className="anees-back-to-adhkar" onClick={()=>{changeCategory('morning');setPositions(p=>({...p,'morning:all':0}));}}><ChevronRight size={17}/> العودة لأذكار الصباح</button>}
     <div className="mb-4" aria-label="تقدم الورد"><div className="flex items-center justify-between gap-3 text-xs text-stone-500 dark:text-stone-400"><span>{query?'نتائج البحث: ':''}المكتمل {completed} من {base.length}</span><div className="flex items-center gap-2"><span className="text-emerald-700 dark:text-emerald-300 font-semibold">{progress}%</span>{!query&&category!=='favorites'&&<button onClick={()=>setConfirmReset(true)} aria-label="إعادة الورد" className="utility-action"><RotateCcw size={17}/></button>}</div></div><div role="progressbar" aria-label="تقدم الورد" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} className="h-1 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden"><div className="h-full bg-emerald-600 transition-all" style={{width:`${progress}%`}}/></div></div>
     {!query&&category==='afterPrayer'&&<div className="flex items-center gap-3 mb-4 text-sm"><label htmlFor="prayer">ورد الصلاة</label><select id="prayer" value={prayer} onChange={e=>setPrayer(e.target.value)} className="worship-input flex-1 min-w-0">{['الفجر','الظهر','العصر','المغرب','العشاء'].map(v=><option key={v}>{v}</option>)}</select><span className="text-xs text-stone-500">تقدم مستقل</span></div>}
     <div className="flex items-center justify-between gap-2 mb-4" aria-label="أدوات القراءة"><button aria-expanded={searchOpen} aria-controls="adhkar-search" onClick={()=>{setSearchOpen(!searchOpen);if(searchOpen)setQuery('');}} aria-label={searchOpen?'إغلاق البحث':'البحث في الأذكار'} className={`utility-action border border-stone-200 dark:border-stone-700 ${searchOpen?'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200':''}`}>{searchOpen?<X size={20}/>:<Search size={20}/>}</button><div className="flex items-center gap-1 p-1 rounded-xl bg-stone-100 dark:bg-stone-900"><button aria-pressed={mode==='focus'} onClick={()=>setMode('focus')} className={`utility-action text-sm ${mode==='focus'?'bg-white dark:bg-stone-800 shadow-sm font-semibold':''}`}><BookOpen size={18}/>قراءة</button><button aria-pressed={mode==='list'} onClick={()=>setMode('list')} className={`utility-action text-sm ${mode==='list'?'bg-white dark:bg-stone-800 shadow-sm font-semibold':''}`}><List size={18}/>قائمة</button></div><button aria-expanded={toolsOpen} onClick={()=>setToolsOpen(true)} aria-label="أدوات العرض" className="utility-action border border-stone-200 dark:border-stone-700 relative"><SlidersHorizontal size={20}/>{filter!=='all'&&<span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-600"/>}</button></div>
     {searchOpen&&<div id="adhkar-search" className="mb-4"><label className="sr-only" htmlFor="dhikr-query">البحث في الأذكار</label><input id="dhikr-query" autoFocus value={query} onChange={e=>{setQuery(e.target.value);setFilter('all');}} placeholder={props.favoritesOnly?'ابحث في أذكارك المفضلة…':'ابحث عن ذكر أو دعاء…'} className="worship-input w-full text-sm"/></div>}
     {filter!=='all'&&<button className="text-xs text-emerald-700 dark:text-emerald-300 mb-4 min-h-11" onClick={()=>setFilter('all')}>تصفية: {filter==='pending'?'المتبقية':'المكتملة'} · إلغاء التصفية ×</button>}
     {!rows.length&&<p className="text-center py-10 text-stone-500">{category==='favorites'&&!favorites.length?'اضغط على القلب بجوار أي ذكر لإضافته هنا.':'لا توجد أذكار مطابقة لهذا العرض.'}</p>}
     <div className="space-y-5">{(mode==='focus'?rows.slice(position,position+1):rows).map(d=><DhikrCard key={d.id} dhikr={d} remainingCount={scopedCount(d)} onCountDecrement={decrement} onReset={id=>selectedDuaGroup&&!props.favoritesOnly?changeDuaCount(id,Infinity):props.onReset(id)} onUndo={id=>selectedDuaGroup&&!props.favoritesOnly?changeDuaCount(id,1):props.onUndo(id)} onOpenModal={props.onOpenModal} fontSize={props.fontSize} soundEnabled={props.soundEnabled} favorite={favorites.includes(d.id)} onFavorite={toggleFavorite}/>)}</div>
     {mode==='focus'&&rows.length>0&&<nav aria-label="التنقل بين الأذكار" className="flex items-center justify-between gap-2 mt-4"><button aria-label="الذكر السابق" disabled={position===0} className="utility-action text-sm disabled:opacity-25" onClick={()=>move(position-1)}><ChevronRight size={20}/><span>السابق</span></button><span className="text-xs text-stone-500 whitespace-nowrap">الذكر {position+1} من {rows.length}</span><button aria-label="الذكر التالي" disabled={position===rows.length-1} className="utility-action text-sm disabled:opacity-25" onClick={()=>move(position+1)}><span>التالي</span><ChevronLeft size={20}/></button></nav>}
   </div>
   {toolsOpen&&<TrackerDialog label="أدوات العرض" onClose={()=>setToolsOpen(false)}><section className="tracker-panel"><div className="flex items-center justify-between gap-3 mb-4"><h2 className="font-bold text-lg">أدوات العرض</h2><button className="utility-action" onClick={()=>setToolsOpen(false)} aria-label="إغلاق أدوات العرض"><X size={22}/></button></div><label className="block text-sm">الأذكار المعروضة<select aria-label="تصفية الأذكار" value={filter} onChange={e=>setFilter(e.target.value as typeof filter)} className="worship-input w-full mt-2"><option value="all">الكل</option><option value="pending">المتبقية</option><option value="completed">المكتملة</option></select></label><label className="flex items-center justify-between gap-3 min-h-14 mt-3 text-sm"><span>انتقال تلقائي بعد إكمال الذكر</span><input type="checkbox" checked={autoNext} onChange={e=>setAutoNext(e.target.checked)}/></label><p className="text-xs text-stone-500 mb-4">يعمل الانتقال التلقائي في وضع القراءة عند عرض الكل.</p><button onClick={()=>setToolsOpen(false)} className="w-full min-h-12 bg-emerald-800 text-white rounded-xl font-bold">تم</button></section></TrackerDialog>}
   {confirmReset&&<TrackerDialog label="إعادة الورد" onClose={()=>setConfirmReset(false)}><section className="tracker-panel"><h2 className="font-bold text-lg">بدء الورد من جديد؟</h2><p className="text-sm mt-3 mb-4">سيتم إعادة ضبط تقدم {selectedDuaGroup?duaGroups.find(d=>d.id===selectedDuaGroup)?.label:meta?.name} وإعادة عدّاداته إلى البداية.</p><div className="flex gap-3"><button className={`${btn} bg-emerald-800 text-white`} onClick={()=>{if(selectedDuaGroup&&!props.favoritesOnly)resetDuaGroup();else props.onResetCategory(category);setConfirmReset(false);move(0);}}>نعم، ابدأ من جديد</button><button className={btn} onClick={()=>setConfirmReset(false)}>إلغاء</button></div></section></TrackerDialog>}
 </div>;
};
