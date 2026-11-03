import {formatCalendarDate,calendarPreference} from '../utils/calendar';
import { useEffect, useRef, useState } from 'react';
import { MapPin, Radio, Play, Pause, Moon, Clock3, LocateFixed } from 'lucide-react';

type Prayer = { name:string; key:string; time:string };
const names = [{name:'الفجر',key:'Fajr'},{name:'الظهر',key:'Dhuhr'},{name:'العصر',key:'Asr'},{name:'المغرب',key:'Maghrib'},{name:'العشاء',key:'Isha'}];
const RADIO = ['https://stream.radiojar.com/8s5u5tpdtwzuv'];
const cities = [{label:'الرياض',lat:24.7136,lon:46.6753},{label:'مكة المكرمة',lat:21.3891,lon:39.8579},{label:'المدينة المنورة',lat:24.5247,lon:39.5692},{label:'جدة',lat:21.4858,lon:39.1925},{label:'القاهرة',lat:30.0444,lon:31.2357},{label:'الإسكندرية',lat:31.2001,lon:29.9187}];
const saved = () => {try {const value=JSON.parse(localStorage.getItem('anees_prayer_location') || 'null');return value && typeof value.lat==='number' && typeof value.lon==='number' && typeof value.label==='string'?value:null;}catch{return null;}};
const locationMode = (): 'auto'|'manual' => localStorage.getItem('anees_prayer_location_mode')==='manual'?'manual':'auto';
// Convert a city's wall-clock prayer time into an absolute instant, including DST.
const zonedParts = (date: Date, timeZone: string) => {
 const parts = new Intl.DateTimeFormat('en-GB', {timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(date);
 const n=(type:string)=>Number(parts.find(p=>p.type===type)?.value || 0);
 return {year:n('year'),month:n('month'),day:n('day'),hour:n('hour'),minute:n('minute'),second:n('second')};
};
const dayKey = (date: Date, timeZone: string) => {
 const p=zonedParts(date,timeZone);
 return `${p.year}-${String(p.month).padStart(2,'0')}-${String(p.day).padStart(2,'0')}`;
};
const addCalendarDay = (key:string,amount:number) => {
 const [year,month,day]=key.split('-').map(Number);
 const d=new Date(Date.UTC(year,month-1,day+amount));
 return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
};
const cityTimeToEpoch = (day:string,time:string,timeZone:string) => {
 const [year,month,date]=day.split('-').map(Number);
 const [hour,minute]=time.split(':').map(Number);
 const wall=Date.UTC(year,month-1,date,hour,minute);
 let utc=wall;
 for(let i=0;i<4;i++){
   const p=zonedParts(new Date(utc),timeZone);
   const represented=Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second);
   const corrected=utc+wall-represented;
   if(corrected===utc)break;
   utc=corrected;
 }
 return utc;
};
export function PrayerRadio(){
 const [loc,setLoc]=useState<{label:string;lat:number;lon:number}>(()=>saved() || cities[0]);
 const [mode,setMode]=useState<'auto'|'manual'>(locationMode);
 const lastLocationCheck=useRef(0);
 const modeRef=useRef(mode);
 const locationRequestId=useRef(0);
 const [locating,setLocating]=useState(false);
 const [locationError,setLocationError]=useState('');
 useEffect(()=>{modeRef.current=mode;try{localStorage.setItem('anees_prayer_location_mode',mode);}catch{}},[mode]);
 const setManualCity=(city:typeof cities[number])=>{
   // Invalidate any pending GPS callback so it cannot override the manual choice.
   locationRequestId.current++;
   setLocating(false);
   setLocationError('');
   modeRef.current='manual';
   setMode('manual');
   try{localStorage.setItem('anees_prayer_location_mode','manual');}catch{}
   setLoc(city);
 };
 const refreshLocation=(force=false,fromUser=false)=>{
   if(modeRef.current!=='auto' && !fromUser)return;
   if(!navigator.geolocation){
     setLocationError('تحديد الموقع غير مدعوم في هذا المتصفح. اختر مدينة من القائمة.');
     return;
   }
   const current=Date.now();
   if(!force && current-lastLocationCheck.current<15*60*1000)return;
   // Do not mark success or switch the selector before iOS actually returns coordinates.
   const request=++locationRequestId.current;
   setLocating(true);
   setLocationError('');
   navigator.geolocation.getCurrentPosition(({coords})=>{
     if(request!==locationRequestId.current)return;
     if(!fromUser && modeRef.current!=='auto')return;
     setLocating(false);
     if(!Number.isFinite(coords.latitude)||!Number.isFinite(coords.longitude)){
       setLocationError('لم نتمكن من قراءة إحداثيات الموقع. جرّب مرة أخرى.');
       return;
     }
     lastLocationCheck.current=Date.now();
     modeRef.current='auto';
     setMode('auto');
     try{localStorage.setItem('anees_prayer_location_mode','auto');}catch{}
     setLocationError('');
     setLoc(previous=>
       previous.label==='موقعي الحالي' &&
       Math.abs(previous.lat-coords.latitude)<0.0001 &&
       Math.abs(previous.lon-coords.longitude)<0.0001
         ? previous
         : {label:'موقعي الحالي',lat:coords.latitude,lon:coords.longitude}
     );
   },(failure)=>{
     if(request!==locationRequestId.current)return;
     setLocating(false);
     // Leave the previously selected city and its prayer times intact on failure.
     lastLocationCheck.current=0;
     setLocationError(failure.code===1
       ? 'إذن الموقع غير مفعّل لـ«أنيس». فعّله من إعدادات الموقع على الآيفون، ثم اضغط موقعي الحالي مجددًا.'
       : failure.code===3
         ? 'انتهت مهلة تحديد الموقع. تأكد من تفعيل خدمات الموقع والاتصال بالإنترنت ثم حاول مرة أخرى.'
         : 'تعذّر تحديد موقعك حاليًا. تأكد من خدمات الموقع ثم أعد المحاولة.');
   },{enableHighAccuracy:false,timeout:15000,maximumAge:0});
 };
 useEffect(()=>{
   if(modeRef.current==='auto')refreshLocation(true);
   const onReturn=()=>{if(document.visibilityState==='visible')refreshLocation();};
   window.addEventListener('focus',onReturn);
   document.addEventListener('visibilitychange',onReturn);
   return()=>{
     locationRequestId.current++;
     window.removeEventListener('focus',onReturn);
     document.removeEventListener('visibilitychange',onReturn);
   };
 },[]);
 // Keep a complete timetable snapshot, so city, timezone, countdown and times
 // switch together on one React commit instead of showing half-updated data.
 const [timetable,setTimetable]=useState<{times:Prayer[];tomorrowFajr:string;prayerTimeZone:string;loadedDay:string}>({
   times:[],tomorrowFajr:'',prayerTimeZone:'Asia/Riyadh',loadedDay:''
 });
 const {times,tomorrowFajr,prayerTimeZone,loadedDay}=timetable;
 const [updatingPrayers,setUpdatingPrayers]=useState(false);
 const [now,setNow]=useState(Date.now());
 const [error,setError]=useState('');
 const [playing,setPlaying]=useState(false);
 const [loading,setLoading]=useState(false);
 const [sleep,setSleep]=useState(0);
 const audio=useRef<HTMLAudioElement>(null);
 const [calendar,setCalendar]=useState(()=>calendarPreference());
 useEffect(()=>{const update=()=>setCalendar(calendarPreference());window.addEventListener('anees-calendar-change',update);return()=>window.removeEventListener('anees-calendar-change',update);},[]);
 const [day,setDay]=useState(()=>dayKey(new Date(),'Asia/Riyadh'));
 useEffect(()=>{const id=window.setInterval(()=>{const instant=Date.now();setNow(instant);setDay(dayKey(new Date(instant),prayerTimeZone));},1000);return()=>clearInterval(id);},[prayerTimeZone]);
 useEffect(()=>{
   localStorage.setItem('anees_prayer_location',JSON.stringify(loc));
   // Keep the last complete schedule visible while the replacement is being fetched.
   // Clearing it made the prayer heading flash and disrupted the countdown.
   const ctl=new AbortController();setError('');setUpdatingPrayers(true);
   const get=async(key:string)=>{
     const [y,m,d]=key.split('-').map(Number);
     const method=loc.label==='القاهرة'||loc.label==='الإسكندرية'?5:4;
     const response=await fetch(`https://api.aladhan.com/v1/timings/${d}-${m}-${y}?latitude=${loc.lat}&longitude=${loc.lon}&method=${method}`,{signal:ctl.signal});
     if(!response.ok)throw Error('Prayer API unavailable');
     const data=await response.json();if(data.code!==200 || !data.data?.meta?.timezone)throw Error('Invalid prayer API result');
     return {timings:data.data.timings as Record<string,string>, timezone:data.data.meta.timezone as string};
   };
   (async()=>{try{
     // The API supplies the timezone for GPS coordinates as well as named cities.
     const first=await get(dayKey(new Date(),prayerTimeZone));
     const timezone=first.timezone;
     const localDay=dayKey(new Date(),timezone);
     const today=localDay===dayKey(new Date(),prayerTimeZone)?first:await get(localDay);
     const tomorrow=await get(addCalendarDay(localDay,1));
     if(ctl.signal.aborted)return;
     setTimetable({
       prayerTimeZone:timezone,
       loadedDay:localDay,
       times:names.map(n=>({...n,time:today.timings[n.key].slice(0,5)})),
       tomorrowFajr:tomorrow.timings.Fajr.slice(0,5)
     });
     setUpdatingPrayers(false);
   }catch(e){if(!ctl.signal.aborted){setUpdatingPrayers(false);setError('تعذّر تحديث المواقيت. ما زالت آخر مواقيت تم تحميلها ظاهرة.');}}})() ;
   return()=>ctl.abort();
 },[loc,day]);
 const schedule=times.map(p=>({...p,instant:loadedDay?cityTimeToEpoch(loadedDay,p.time,prayerTimeZone):0}));
 const upcoming=schedule.find(p=>p.instant>now);
 const next=upcoming || (tomorrowFajr&&loadedDay?{name:'الفجر',key:'Fajr',time:tomorrowFajr,instant:cityTimeToEpoch(addCalendarDay(loadedDay,1),tomorrowFajr,prayerTimeZone)}:undefined);
 const target=next?.instant || 0;
 const remaining=Math.max(0,Math.floor((target-now)/1000));
 const countdown=[Math.floor(remaining/3600),Math.floor(remaining%3600/60),remaining%60].map(n=>String(n).padStart(2,'0')).join(':');
 const locate=()=>refreshLocation(true,true);
 useEffect(()=>{if(!('mediaSession' in navigator))return;try{navigator.mediaSession.metadata=new MediaMetadata({title:'إذاعة القرآن الكريم من القاهرة',artist:'أنيس',album:'بث مباشر'});navigator.mediaSession.setActionHandler('play',()=>{const a=audio.current;if(a)void a.play().catch(()=>{});});navigator.mediaSession.setActionHandler('pause',()=>{audio.current?.pause();});}catch{}return()=>{try{navigator.mediaSession.setActionHandler('play',null);navigator.mediaSession.setActionHandler('pause',null);}catch{}};},[]);
 const toggle=async()=>{const a=audio.current;if(!a)return;if(!a.paused){a.pause();setPlaying(false);return;}setLoading(true);setError('');try{a.src=RADIO[0];await a.play();setPlaying(true);}catch{setError('تعذّر تشغيل الإذاعة حاليًا. قد يكون مصدر البث غير متاح.');setPlaying(false);}finally{setLoading(false);}};
 useEffect(()=>{if(!sleep)return;const id=window.setTimeout(()=>{audio.current?.pause();setPlaying(false);setSleep(0);},sleep*60000);return()=>clearTimeout(id);},[sleep]);
 const locationControl=<div className="anees-location anees-welcome-location" dir="rtl"><MapPin size={17} aria-hidden="true"/><select aria-label="اختر المدينة أو موقعي الحالي" value={mode==='auto'?'auto':loc.label} onChange={e=>{if(e.target.value==='auto'){locate();return;}const c=cities.find(x=>x.label===e.target.value);if(c)setManualCity(c);}}><option value="auto">موقعي الحالي</option>{cities.map(c=><option key={c.label} value={c.label}>{c.label}</option>)}</select><button type="button" onClick={locate} disabled={locating} title={locating?'جاري تحديد موقعك':'تحديث موقعي الحالي'} aria-label={locating?'جاري تحديد موقعك':'تحديث موقعي الحالي'} aria-busy={locating} className={locating?'anees-location-locating':''}><LocateFixed size={18}/></button></div>;
 return <><section className="anees-dashboard" dir="rtl" aria-label="مواقيت الصلاة وإذاعة القرآن">
 <div className="anees-welcome"><div><span className="anees-eyebrow">رفيقك في الذكر والعبادة</span><h1>أنيس <span>✦</span></h1><p>جعل الله يومك مباركًا</p></div>{locationControl}</div><span className="sr-only" role="status" aria-live="polite">{locating?'جاري تحديد موقعك الحالي…':updatingPrayers?'جاري تحديث مواقيت الصلاة':''}</span>{locationError&&<p className="anees-location-feedback anees-location-error" role="alert">{locationError}</p>}
 <div className="anees-next"><div className="anees-lantern">☪</div><div className="anees-next-text"><span>الصلاة القادمة</span><h2 className="anees-fixed-prayer">{next?.name || '—'}</h2><div className="anees-countdown"><Clock3 size={20}/><b dir="ltr" className="anees-fixed-timer">{next?countdown:'--:--:--'}</b></div></div></div>
 <div className="anees-times"><div className="anees-section-heading"><h2>مواقيت الصلاة اليوم</h2><span>{formatCalendarDate(new Date(now),calendar,{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:prayerTimeZone})}</span></div><div className="anees-prayer-grid">{names.map((n,i)=>{const t=times.find(x=>x.key===n.key);return <div className={`anees-prayer ${next?.key===n.key?'upcoming':''}`} key={n.key}><span className="anees-prayer-icon">{['☾','☀','☼','◒','☽'][i]}</span><strong>{n.name}</strong><span dir="ltr">{t?.time || '--:--'}</span></div>;})}</div><small>المواقيت حسابية وقد تختلف قليلًا عن تقويم المسجد المحلي.</small></div>
 <div className="anees-radio"><div className="anees-radio-heading"><Radio size={24}/><div><h2>إذاعة القرآن الكريم من القاهرة</h2><span>بث مباشر عبر الإنترنت</span></div></div><div className="anees-radio-controls"><button className="anees-play" onClick={toggle} disabled={loading} aria-label={playing?'إيقاف الإذاعة':'تشغيل الإذاعة'}>{playing?<Pause fill="currentColor"/>:<Play fill="currentColor"/>}</button><div className="anees-radio-wave" aria-hidden="true">▂ ▄ ▆ ▃ ▇ ▅ ▂ ▆ ▄ ▇ ▃ ▅ ▂ ▇ ▄ ▆ ▃ ▅ ▂ ▆</div><label><Moon size={15}/><select value={sleep} aria-label="مؤقت النوم" onChange={e=>setSleep(Number(e.target.value))}><option value={0}>مؤقت النوم</option><option value={15}>15 دقيقة</option><option value={30}>30 دقيقة</option><option value={60}>60 دقيقة</option></select></label></div><audio ref={audio} preload="none" onPause={()=>setPlaying(false)} onPlaying={()=>setPlaying(true)} onError={()=>{setPlaying(false);setError('تعذّر الاتصال ببث الإذاعة.');}} /></div>
 {error&&<p className="anees-error" role="status">{error}</p>}
 </section></>;
}
