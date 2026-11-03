import {formatCalendarDate,calendarPreference} from '../utils/calendar';
import { useEffect, useRef, useState } from 'react';
import { MapPin, Radio, Play, Pause, Moon, Clock3, LocateFixed } from 'lucide-react';

type Prayer = { name:string; key:string; time:string };
const names = [{name:'الفجر',key:'Fajr'},{name:'الظهر',key:'Dhuhr'},{name:'العصر',key:'Asr'},{name:'المغرب',key:'Maghrib'},{name:'العشاء',key:'Isha'}];
const RADIO = ['https://stream.radiojar.com/8s5u5tpdtwzuv'];
const cities = [{label:'الرياض',lat:24.7136,lon:46.6753},{label:'مكة المكرمة',lat:21.3891,lon:39.8579},{label:'المدينة المنورة',lat:24.5247,lon:39.5692},{label:'جدة',lat:21.4858,lon:39.1925},{label:'القاهرة',lat:30.0444,lon:31.2357},{label:'الإسكندرية',lat:31.2001,lon:29.9187}];
const saved = () => {try {const value=JSON.parse(localStorage.getItem('anees_prayer_location') || 'null');return value && typeof value.lat==='number' && typeof value.lon==='number' && typeof value.label==='string'?value:null;}catch{return null;}};
const locationMode = (): 'auto'|'manual' => localStorage.getItem('anees_prayer_location_mode')==='manual'?'manual':'auto';
const dayKey = (date:Date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export function PrayerRadio(){
 const [loc,setLoc]=useState<{label:string;lat:number;lon:number}>(()=>saved() || cities[0]);
 const [mode,setMode]=useState<'auto'|'manual'>(locationMode);
 const lastLocationCheck=useRef(0);
 const modeRef=useRef(mode);
 useEffect(()=>{modeRef.current=mode;localStorage.setItem('anees_prayer_location_mode',mode);},[mode]);
 const setManualCity=(city:typeof cities[number])=>{setMode('manual');modeRef.current='manual';localStorage.setItem('anees_prayer_location_mode','manual');setLoc(city);};
 const refreshLocation=(force=false)=>{
   if(!navigator.geolocation || modeRef.current!=='auto')return;
   const current=Date.now();
   if(!force && current-lastLocationCheck.current<15*60*1000)return;
   lastLocationCheck.current=current;
   navigator.geolocation.getCurrentPosition(({coords})=>{
     if(modeRef.current!=='auto')return;
     setLoc(previous=>Math.abs(previous.lat-coords.latitude)<0.005 && Math.abs(previous.lon-coords.longitude)<0.005 && previous.label==='موقعي الحالي'?previous:{label:'موقعي الحالي',lat:coords.latitude,lon:coords.longitude});
     setError('');
   },()=>{ /* Keep last saved location; user can select a city manually. */ },{timeout:12000,maximumAge:5*60*1000});
 };
 useEffect(()=>{
   refreshLocation(true);
   const onReturn=()=>{if(document.visibilityState==='visible')refreshLocation();};
   window.addEventListener('focus',onReturn);
   document.addEventListener('visibilitychange',onReturn);
   return()=>{window.removeEventListener('focus',onReturn);document.removeEventListener('visibilitychange',onReturn);};
 },[]);
 const [times,setTimes]=useState<Prayer[]>([]);
 const [tomorrowFajr,setTomorrowFajr]=useState('');
 const [now,setNow]=useState(Date.now());
 const [error,setError]=useState('');
 const [playing,setPlaying]=useState(false);
 const [loading,setLoading]=useState(false);
 const [sleep,setSleep]=useState(0);
 const audio=useRef<HTMLAudioElement>(null);
 const [calendar,setCalendar]=useState(()=>calendarPreference());
 useEffect(()=>{const update=()=>setCalendar(calendarPreference());window.addEventListener('anees-calendar-change',update);return()=>window.removeEventListener('anees-calendar-change',update);},[]);
 const [day,setDay]=useState(dayKey(new Date()));
 useEffect(()=>{const id=window.setInterval(()=>{setNow(Date.now());setDay(dayKey(new Date()));},1000);return()=>clearInterval(id);},[]);
 useEffect(()=>{localStorage.setItem('anees_prayer_location',JSON.stringify(loc));const ctl=new AbortController();setError('');setTimes([]);
 const get=async(date:Date)=>{const d=`${date.getDate()}-${date.getMonth()+1}-${date.getFullYear()}`;const method=loc.label==='القاهرة'||loc.label==='الإسكندرية'?5:4;const r=await fetch(`https://api.aladhan.com/v1/timings/${d}?latitude=${loc.lat}&longitude=${loc.lon}&method=${method}`,{signal:ctl.signal});if(!r.ok)throw Error('API');const j=await r.json();if(j.code!==200)throw Error('API');return j.data.timings as Record<string,string>;};
 (async()=>{try{const today=await get(new Date());if(ctl.signal.aborted)return;setTimes(names.map(n=>({...n,time:today[n.key].slice(0,5)})));const t=new Date();t.setDate(t.getDate()+1);const next=await get(t);if(!ctl.signal.aborted)setTomorrowFajr(next.Fajr.slice(0,5));}catch(e){if(!ctl.signal.aborted)setError('تعذّر تحميل المواقيت. حاول مرة أخرى لاحقًا.');}})();return()=>ctl.abort();},[loc,day]);
 const toDate=(time:string,add=0)=>{const [h,m]=time.split(':').map(Number);const d=new Date();d.setHours(h,m,0,0);d.setDate(d.getDate()+add);return d.getTime();};
 const next=times.find(p=>toDate(p.time)>now) || (tomorrowFajr?{name:'الفجر',key:'Fajr',time:tomorrowFajr}:undefined);
 const target=next?toDate(next.time,times.some(p=>p.key===next.key&&toDate(p.time)>now)?0:1):0;
 const remaining=Math.max(0,Math.floor((target-now)/1000));
 const countdown=[Math.floor(remaining/3600),Math.floor(remaining%3600/60),remaining%60].map(n=>String(n).padStart(2,'0')).join(':');
 const locate=()=>{
   if(!navigator.geolocation){setError('المتصفح لا يدعم تحديد الموقع');return;}
   setMode('auto');modeRef.current='auto';localStorage.setItem('anees_prayer_location_mode','auto');
   lastLocationCheck.current=0;
   refreshLocation(true);
 };
 useEffect(()=>{if(!('mediaSession' in navigator))return;try{navigator.mediaSession.metadata=new MediaMetadata({title:'إذاعة القرآن الكريم من القاهرة',artist:'أنيس',album:'بث مباشر'});navigator.mediaSession.setActionHandler('play',()=>{const a=audio.current;if(a)void a.play().catch(()=>{});});navigator.mediaSession.setActionHandler('pause',()=>{audio.current?.pause();});}catch{}return()=>{try{navigator.mediaSession.setActionHandler('play',null);navigator.mediaSession.setActionHandler('pause',null);}catch{}};},[]);
 const toggle=async()=>{const a=audio.current;if(!a)return;if(!a.paused){a.pause();setPlaying(false);return;}setLoading(true);setError('');try{a.src=RADIO[0];await a.play();setPlaying(true);}catch{setError('تعذّر تشغيل الإذاعة حاليًا. قد يكون مصدر البث غير متاح.');setPlaying(false);}finally{setLoading(false);}};
 useEffect(()=>{if(!sleep)return;const id=window.setTimeout(()=>{audio.current?.pause();setPlaying(false);setSleep(0);},sleep*60000);return()=>clearTimeout(id);},[sleep]);
 const locationControl=<div className="anees-location anees-welcome-location" dir="rtl"><MapPin size={17} aria-hidden="true"/><select aria-label="اختر المدينة أو موقعي الحالي" value={mode==='auto'?'auto':loc.label} onChange={e=>{if(e.target.value==='auto'){locate();return;}const c=cities.find(x=>x.label===e.target.value);if(c)setManualCity(c);}}><option value="auto">موقعي الحالي</option>{cities.map(c=><option key={c.label} value={c.label}>{c.label}</option>)}</select><button type="button" onClick={locate} title="تحديث موقعي الحالي" aria-label="تحديث موقعي الحالي"><LocateFixed size={18}/></button></div>;
 return <><section className="anees-dashboard" dir="rtl" aria-label="مواقيت الصلاة وإذاعة القرآن">
 <div className="anees-welcome"><div><span className="anees-eyebrow">رفيقك في الذكر والعبادة</span><h1>أنيس <span>✦</span></h1><p>جعل الله يومك مباركًا</p></div>{locationControl}</div>
 <div className="anees-next"><div className="anees-lantern">☪</div><div className="anees-next-text"><span>الصلاة القادمة</span><h2 className="anees-fixed-prayer">{next?.name || 'جاري تحديد المواقيت'}</h2><div className="anees-countdown"><Clock3 size={20}/><b dir="ltr" className="anees-fixed-timer">{next?countdown:'--:--:--'}</b></div></div></div>
 <div className="anees-times"><div className="anees-section-heading"><h2>مواقيت الصلاة اليوم</h2><span>{formatCalendarDate(new Date(now),calendar)}</span></div><div className="anees-prayer-grid">{names.map((n,i)=>{const t=times.find(x=>x.key===n.key);return <div className={`anees-prayer ${next?.key===n.key?'upcoming':''}`} key={n.key}><span className="anees-prayer-icon">{['☾','☀','☼','◒','☽'][i]}</span><strong>{n.name}</strong><span dir="ltr">{t?.time || '--:--'}</span></div>;})}</div><small>المواقيت حسابية وقد تختلف قليلًا عن تقويم المسجد المحلي.</small></div>
 <div className="anees-radio"><div className="anees-radio-heading"><Radio size={24}/><div><h2>إذاعة القرآن الكريم من القاهرة</h2><span>بث مباشر عبر الإنترنت</span></div></div><div className="anees-radio-controls"><button className="anees-play" onClick={toggle} disabled={loading} aria-label={playing?'إيقاف الإذاعة':'تشغيل الإذاعة'}>{playing?<Pause fill="currentColor"/>:<Play fill="currentColor"/>}</button><div className="anees-radio-wave" aria-hidden="true">▂ ▄ ▆ ▃ ▇ ▅ ▂ ▆ ▄ ▇ ▃ ▅ ▂ ▇ ▄ ▆ ▃ ▅ ▂ ▆</div><label><Moon size={15}/><select value={sleep} aria-label="مؤقت النوم" onChange={e=>setSleep(Number(e.target.value))}><option value={0}>مؤقت النوم</option><option value={15}>15 دقيقة</option><option value={30}>30 دقيقة</option><option value={60}>60 دقيقة</option></select></label></div><audio ref={audio} preload="none" onPause={()=>setPlaying(false)} onPlaying={()=>setPlaying(true)} onError={()=>{setPlaying(false);setError('تعذّر الاتصال ببث الإذاعة.');}} /></div>
 {error&&<p className="anees-error" role="status">{error}</p>}
 </section></>;
}
