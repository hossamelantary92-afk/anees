import React,{useState,useEffect} from 'react';
import {BookmarkCheck} from 'lucide-react';
import {SURAHS} from '../data/surahs';
import {ReadingPosition,validPosition,nextPosition} from '../utils/bookmark';
interface Props {position?:ReadingPosition|null;legacy:string;onSave:(position:ReadingPosition|null)=>void;}
export const ReadingBookmark:React.FC<Props>=({position,legacy,onSave})=>{
 const [surah,setSurah]=useState<number|''>(position?.surah??1);
 const [ayah,setAyah]=useState<number|''>(position?.ayah??'');
 const [status,setStatus]=useState('');
 useEffect(()=>{setSurah(position?.surah??1);setAyah(position?.ayah??'');},[position?.surah,position?.ayah]);
 const chapter=SURAHS.find(s=>s.id===surah);
 const valid=validPosition({surah,ayah});
 const next=position?nextPosition(position):null;
 return <section className="mt-5 border-t border-stone-200 dark:border-stone-800 pt-5" aria-labelledby="bookmark-title"><h3 id="bookmark-title" className="font-bold flex items-center gap-2"><BookmarkCheck size={20}/>آخر موضع قراءة</h3><p className="text-sm text-stone-500 mt-2 mb-4">حدد آخر آية قرأتها لتعرف من أين تكمل تلاوتك.</p>
 {legacy&&!position&&<p className="text-sm mb-4 rounded-xl bg-stone-50 dark:bg-stone-900 p-3 whitespace-pre-wrap">موضعك السابق: {legacy}</p>}
 <form onSubmit={e=>{e.preventDefault();const p={surah:Number(surah),ayah:Number(ayah)};if(validPosition(p)){onSave(p);setStatus('تم حفظ موضع القراءة.');}}}>
 <div className="grid grid-cols-2 gap-3"><label className="text-sm">السورة<select required aria-label="سورة موضع القراءة" className="worship-input mt-2 w-full min-w-0" value={surah} onChange={e=>{setSurah(e.target.value?Number(e.target.value):1);setAyah('');setStatus('');}}><option value="" disabled>اختر السورة</option>{SURAHS.map(s=><option key={s.id} value={s.id}>{s.id}. {s.name}</option>)}</select></label><label className="text-sm">آخر آية قرأتها<select required aria-label="آخر آية قرأتها" className="worship-input mt-2 w-full min-w-0" value={ayah} onChange={e=>{setAyah(Number(e.target.value));setStatus('');}}><option value="" disabled>اختر الآية</option>{chapter&&Array.from({length:chapter.ayahs},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</select></label></div>
 <button type="submit" disabled={!valid} className="w-full mt-3 min-h-12 rounded-xl bg-emerald-800 text-white font-bold">حفظ الموضع</button></form>
 {position&&<div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-sm leading-loose"><p>المحفوظ: سورة {SURAHS[position.surah-1].name} — الآية {position.ayah}</p><p className="font-bold">{next?`الاستكمال: سورة ${SURAHS[next.surah-1].name} — الآية ${next.ayah}`:'وصلت إلى نهاية سورة الناس.'}</p></div>}
 <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300 mt-2">{status}</p>

 </section>;
};
