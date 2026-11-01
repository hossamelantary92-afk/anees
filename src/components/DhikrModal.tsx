import React,{useEffect,useRef} from 'react';
import {X, Sparkles} from 'lucide-react';
import {DhikrItem} from '../data/adhkarData';
interface Props {dhikr:DhikrItem|null;onClose:()=>void;}
export const DhikrModal:React.FC<Props>=({dhikr,onClose})=>{
 const panel=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  if(!dhikr)return;
  const previous=document.activeElement as HTMLElement|null;
  const overflow=document.body.style.overflow;document.body.style.overflow='hidden';
  panel.current?.focus();
  const key=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose();if(e.key==='Tab'){const buttons=panel.current?.querySelectorAll<HTMLButtonElement>('button');if(!buttons?.length)return;const first=buttons[0],last=buttons[buttons.length-1];if(e.shiftKey&&(document.activeElement===first||document.activeElement===panel.current)){e.preventDefault();last.focus();}else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===panel.current)){e.preventDefault();first.focus();}}};
  document.addEventListener('keydown',key);return()=>{document.body.style.overflow=overflow;document.removeEventListener('keydown',key);previous?.focus();};
 },[dhikr,onClose]);
 if(!dhikr)return null;
 return <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-sm sm:p-4" onClick={onClose}><div ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="virtue-title" className="virtue-sheet bg-white dark:bg-[#131C31] w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl p-6 outline-none" onClick={e=>e.stopPropagation()}><div className="flex items-center justify-between gap-3"><h2 id="virtue-title" className="font-bold text-xl flex items-center gap-2"><Sparkles size={22} className="text-emerald-600"/>فضل الذكر</h2><button onClick={onClose} aria-label="إغلاق فضل الذكر" className="utility-action"><X size={22}/></button></div><p className="text-lg sm:text-xl leading-loose mt-5 text-stone-800 dark:text-stone-100">{dhikr.virtue || 'لا يُعرض فضل مخصوص لهذا الذكر في هذه النسخة.'}</p><button onClick={onClose} className="w-full rounded-2xl bg-emerald-800 text-white font-bold py-3 mt-6 min-h-12">تم</button></div></div>;
};
