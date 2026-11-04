import {formatCalendarDate,calendarPreference} from '../utils/calendar';
import { useEffect, useRef, useState } from 'react';
import { MapPin, Radio, Play, Pause, Moon, Clock3, LocateFixed, Compass, CalendarClock, X, Sunrise, Sunset, MoonStar } from 'lucide-react';

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
const qiblaBearing=(latitude:number,longitude:number)=>{
 const toRad=Math.PI/180;
 const phi=latitude*toRad,delta=(39.8262-longitude)*toRad,kaabaPhi=21.4225*toRad;
 const angle=Math.atan2(Math.sin(delta),Math.cos(phi)*Math.tan(kaabaPhi)-Math.sin(phi)*Math.cos(delta));
 return (angle*180/Math.PI+360)%360;
};
const formatZonedTime=(instant:number,zone:string)=>new Intl.DateTimeFormat('ar-SA',{timeZone:zone,hour:'numeric',minute:'2-digit',hour12:true}).format(new Date(instant));
export function PrayerRadio(){
 const [loc,setLoc]=useState<{label:string;lat:number;lon:number}>(()=>saved() || cities[0]);
 const [mode,setMode]=useState<'auto'|'manual'>(locationMode);
 const lastLocationCheck=useRef(0);
 const modeRef=useRef(mode);
 const locationRequestId=useRef(0);
 const [locating,setLocating]=useState(false);
 const [locationError,setLocationError]=useState('');
 const [prayerPanel,setPrayerPanel]=useState<'qibla'|'details'|null>(null);
 const [noPrayerOpen,setNoPrayerOpen]=useState(false);
 const [compassHeading,setCompassHeading]=useState<number|null>(null);
 const [compassMessage,setCompassMessage]=useState('');
 const lastAlignmentRef=useRef(false);
 useEffect(()=>{
   if(prayerPanel!=='qibla')return;
   const handler=(event:DeviceOrientationEvent)=>{
     const heading=(event as DeviceOrientationEvent & {webkitCompassHeading?:number}).webkitCompassHeading;
     if(typeof heading==='number'&&Number.isFinite(heading)){setCompassHeading((heading%360+360)%360);setCompassMessage('');}
   };
   window.addEventListener('deviceorientation',handler,true);
   return()=>{window.removeEventListener('deviceorientation',handler,true);};
 },[prayerPanel]);
 const askCompass=async()=>{
   const orientation=DeviceOrientationEvent as typeof DeviceOrientationEvent & {requestPermission?:()=>Promise<'granted'|'denied'>};
   if(typeof orientation.requestPermission!=='function'){setCompassMessage('لو البوصلة مش بتتحرك، استخدم زاوية القبلة من الشمال.');return;}
   try{
     if(await orientation.requestPermission()==='granted')setCompassMessage('حرّك الهاتف حركة رقم 8 لمعايرة البوصلة إذا لزم الأمر.');
     else setCompassMessage('لم يتم السماح بمستشعر اتجاه الجهاز. زاوية القبلة من الشمال متاحة.');
   }catch{setCompassMessage('تعذر تشغيل مستشعر الاتجاه؛ يمكنك استخدام زاوية القبلة من الشمال.');}
 };
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
       Math.abs(previous.lat-coords.latitude)<0.005 &&
       Math.abs(previous.lon-coords.longitude)<0.005
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
 const [timetable,setTimetable]=useState<{times:Prayer[];tomorrowFajr:string;sunrise:string;maghrib:string;prayerTimeZone:string;loadedDay:string}>({
   times:[],tomorrowFajr:'',sunrise:'',maghrib:'',prayerTimeZone:'Asia/Riyadh',loadedDay:''
 });
 const {times,tomorrowFajr,sunrise,maghrib,prayerTimeZone,loadedDay}=timetable;
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
       tomorrowFajr:tomorrow.timings.Fajr.slice(0,5),
       sunrise:today.timings.Sunrise.slice(0,5),
       maghrib:today.timings.Maghrib.slice(0,5)
     });
     try{localStorage.setItem('anees_sunset',JSON.stringify({day:localDay,zone:timezone,instant:cityTimeToEpoch(localDay,today.timings.Maghrib.slice(0,5),timezone)}));window.dispatchEvent(new Event('anees-sunset-updated'));}catch{}
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
 const qibla=Math.round(qiblaBearing(loc.lat,loc.lon));
 const qiblaOffset=compassHeading===null?null:((qibla-compassHeading+540)%360)-180;
 const qiblaAligned=qiblaOffset!==null&&Math.abs(qiblaOffset)<=7;
 useEffect(()=>{
   if(prayerPanel!=='qibla'||qiblaOffset===null){lastAlignmentRef.current=false;return;}
   if(qiblaAligned&&!lastAlignmentRef.current){
     if(typeof navigator.vibrate==='function')navigator.vibrate(35);
     lastAlignmentRef.current=true;
   }else if(Math.abs(qiblaOffset)>12){lastAlignmentRef.current=false;}
 },[prayerPanel,qiblaAligned,qiblaOffset===null]);
 const nightStart=loadedDay&&maghrib?cityTimeToEpoch(loadedDay,maghrib,prayerTimeZone):0;
 const nightEnd=loadedDay&&tomorrowFajr?cityTimeToEpoch(addCalendarDay(loadedDay,1),tomorrowFajr,prayerTimeZone):0;
 const midnight=nightStart&&nightEnd?nightStart+(nightEnd-nightStart)/2:0;
 const lastThird=nightStart&&nightEnd?nightStart+(nightEnd-nightStart)*2/3:0;
 const prayerTime=(name:string)=>times.find(t=>t.key===name)?.time||'';
 const fajrInstant=loadedDay&&prayerTime('Fajr')?cityTimeToEpoch(loadedDay,prayerTime('Fajr'),prayerTimeZone):0;
 const sunriseInstant=loadedDay&&sunrise?cityTimeToEpoch(loadedDay,sunrise,prayerTimeZone):0;
 const dhuhrInstant=loadedDay&&prayerTime('Dhuhr')?cityTimeToEpoch(loadedDay,prayerTime('Dhuhr'),prayerTimeZone):0;
 const asrInstant=loadedDay&&prayerTime('Asr')?cityTimeToEpoch(loadedDay,prayerTime('Asr'),prayerTimeZone):0;
 const prohibitionPeriods=[
  {title:'بعد الفجر إلى ارتفاع الشمس',detail:'يشمل وقت شروق الشمس، ويستمر إلى ارتفاعها بعد الشروق بنحو 15 دقيقة تقريبًا.',active:!!fajrInstant&&now>=fajrInstant&&now<sunriseInstant+15*60000,icon:'sunrise'},
  {title:'وقت استواء الشمس قبل الظهر',detail:'وقت قصير قبيل دخول الظهر؛ التقدير التقريبي هنا ليس توقيتًا شرعيًا رسميًا.',active:!!dhuhrInstant&&now>=dhuhrInstant-5*60000&&now<dhuhrInstant,icon:'sun'},
  {title:'بعد العصر إلى غروب الشمس',detail:'يشمل الفترة التي تسبق الغروب مباشرة.',active:!!asrInstant&&now>=asrInstant&&now<nightStart,icon:'sunset'}
 ];
 useEffect(()=>{
   if(!prayerPanel)return;
   const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape')setPrayerPanel(null);};
   document.addEventListener('keydown',onKey);
   return()=>document.removeEventListener('keydown',onKey);
 },[prayerPanel]);
 useEffect(()=>{if(!('mediaSession' in navigator))return;try{navigator.mediaSession.metadata=new MediaMetadata({title:'إذاعة القرآن الكريم من القاهرة',artist:'أنيس',album:'بث مباشر'});navigator.mediaSession.setActionHandler('play',()=>{const a=audio.current;if(a)void a.play().catch(()=>{});});navigator.mediaSession.setActionHandler('pause',()=>{audio.current?.pause();});}catch{}return()=>{try{navigator.mediaSession.setActionHandler('play',null);navigator.mediaSession.setActionHandler('pause',null);}catch{}};},[]);
 const toggle=async()=>{const a=audio.current;if(!a)return;if(!a.paused){a.pause();setPlaying(false);return;}setLoading(true);setError('');try{a.src=RADIO[0];await a.play();setPlaying(true);}catch{setError('تعذّر تشغيل الإذاعة حاليًا. قد يكون مصدر البث غير متاح.');setPlaying(false);}finally{setLoading(false);}};
 useEffect(()=>{if(!sleep)return;const id=window.setTimeout(()=>{audio.current?.pause();setPlaying(false);setSleep(0);},sleep*60000);return()=>clearTimeout(id);},[sleep]);
 const locationControl=<div className="anees-location anees-welcome-location" dir="rtl"><MapPin size={17} aria-hidden="true"/><select aria-label="اختر المدينة أو موقعي الحالي" value={mode==='auto'?'auto':loc.label} onChange={e=>{if(e.target.value==='auto'){locate();return;}const c=cities.find(x=>x.label===e.target.value);if(c)setManualCity(c);}}><option value="auto">موقعي الحالي</option>{cities.map(c=><option key={c.label} value={c.label}>{c.label}</option>)}</select><button type="button" onClick={locate} disabled={locating} title={locating?'جاري تحديد موقعك':'تحديث موقعي الحالي'} aria-label={locating?'جاري تحديد موقعك':'تحديث موقعي الحالي'} aria-busy={locating} className={locating||updatingPrayers?'anees-location-locating':''}><LocateFixed size={18}/></button></div>;
 return <><section className="anees-dashboard" dir="rtl" aria-label="مواقيت الصلاة وإذاعة القرآن">
 <div className="anees-welcome"><div><span className="anees-eyebrow">رفيقك في الذكر والعبادة</span><h1>أنيس <span>✦</span></h1><p>جعل الله يومك مباركًا</p></div>{locationControl}</div><span className="sr-only" role="status" aria-live="polite">{locating?'جاري تحديد موقعك الحالي…':updatingPrayers?'جاري تحديث مواقيت الصلاة':''}</span>{locationError&&<p className="anees-location-feedback anees-location-error" role="alert">{locationError}</p>}
 <div className="anees-next anees-mosque-card"><div className="anees-mosque-illustration" aria-hidden="true"><svg viewBox="0 0 470 260" preserveAspectRatio="xMidYMax meet" xmlns="http://www.w3.org/2000/svg">
 <defs><linearGradient id="anees-mosque-gold" x1="0" y1="0" x2=".72" y2="1"><stop stopColor="#e8d09a"/><stop offset=".55" stopColor="#ab8750"/><stop offset="1" stopColor="#4c6a51"/></linearGradient><linearGradient id="anees-mosque-depth" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#a7b391"/><stop offset="1" stopColor="#315b49"/></linearGradient><radialGradient id="anees-mosque-halo"><stop stopColor="#d8b86c" stopOpacity=".36"/><stop offset="1" stopColor="#d8b86c" stopOpacity="0"/></radialGradient></defs>
 <ellipse cx="220" cy="125" rx="220" ry="120" fill="url(#anees-mosque-halo)"/>
 <path d="M0 218 Q50 187 95 206 T200 202 T300 199 T470 205 V260H0Z" fill="#31604e" opacity=".5"/>
 <g fill="url(#anees-mosque-depth)" opacity=".68"><path d="M0 195h38v-63h8v-10h8v73h32v65H0z"/><path d="M340 182h23v-64h7v-12h8v76h42v78h-80z"/><path d="M425 204h12v-92h7v-13h9v105h17v56h-45z"/></g>
 <g fill="url(#anees-mosque-gold)"><path d="M65 257v-68h31v-27c0-40 34-73 76-84v-11h15v11c42 11 75 44 75 84v27h29v68z"/><path d="M107 96c12-18 38-37 72-41 34 4 60 23 72 41-20-8-46-12-72-12s-52 4-72 12z" opacity=".45"/><rect x="176" y="48" width="7" height="26" rx="2"/><path d="M179 34l-11 17h22z"/><path d="M35 257V97h17v160zM30 97h27L44 78zM42 68h3v12h-3z"/><path d="M292 257V81h18v176zM288 81h26L301 59zM299 48h3v12h-3z"/><path d="M367 257v-139h15v139zM363 118h23l-11-22z"/><path d="M67 257v-46h227v46z" fill="#8c8c62"/></g>
 <g fill="#143d32" opacity=".87"><path d="M147 258v-44c0-16 14-30 31-30s31 14 31 30v44z"/><path d="M84 232v-19c0-9 7-17 16-17s16 8 16 17v19zM228 232v-19c0-9 7-17 16-17s16 8 16 17v19z"/><path d="M38 153v-17c0-4 4-8 7-8s7 4 7 8v17zM296 146v-15c0-4 3-7 6-7s6 3 6 7v15z"/></g>
 <g fill="#f3dca3" opacity=".6"><rect x="36" y="169" width="3" height="49"/><rect x="302" y="169" width="3" height="49"/><path d="M97 192h162v3H97z"/></g>
 </svg></div><div className="anees-next-text"><span>الصلاة القادمة</span><h2 className="anees-fixed-prayer">{next?.name || '—'}</h2><div className="anees-countdown"><Clock3 size={20}/><b dir="ltr" className="anees-fixed-timer">{next?countdown:'--:--:--'}</b></div></div></div>
 <div className="anees-times"><div className="anees-section-heading"><h2>مواقيت الصلاة اليوم</h2><span>{formatCalendarDate(new Date(now),calendar,{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:prayerTimeZone})}</span></div><div className="anees-prayer-grid">{names.map((n,i)=>{const t=times.find(x=>x.key===n.key);return <div className={`anees-prayer ${next?.key===n.key?'upcoming':''}`} key={n.key}><span className="anees-prayer-icon">{['☾','☀','☼','◒','☽'][i]}</span><strong>{n.name}</strong><span dir="ltr">{t?.time || '--:--'}</span></div>;})}</div><div className="anees-prayer-tools"><button type="button" onClick={()=>setPrayerPanel('qibla')}><Compass size={19}/>اتجاه القبلة</button><button type="button" onClick={()=>setPrayerPanel('details')}><CalendarClock size={19}/>تفاصيل الصلاة</button></div><small>المواقيت حسابية وقد تختلف قليلًا عن تقويم المسجد المحلي.</small></div>
 <div className="anees-radio"><div className="anees-radio-heading"><Radio size={24}/><div><h2>إذاعة القرآن الكريم من القاهرة</h2><span>بث مباشر عبر الإنترنت</span></div></div><div className="anees-radio-controls"><button className="anees-play" onClick={toggle} disabled={loading} aria-label={playing?'إيقاف الإذاعة':'تشغيل الإذاعة'}>{playing?<Pause fill="currentColor"/>:<Play fill="currentColor"/>}</button><div className="anees-radio-wave" aria-hidden="true">▂ ▄ ▆ ▃ ▇ ▅ ▂ ▆ ▄ ▇ ▃ ▅ ▂ ▇ ▄ ▆ ▃ ▅ ▂ ▆</div><label><Moon size={15}/><select value={sleep} aria-label="مؤقت النوم" onChange={e=>setSleep(Number(e.target.value))}><option value={0}>مؤقت النوم</option><option value={15}>15 دقيقة</option><option value={30}>30 دقيقة</option><option value={60}>60 دقيقة</option></select></label></div><audio ref={audio} preload="none" onPause={()=>setPlaying(false)} onPlaying={()=>setPlaying(true)} onError={()=>{setPlaying(false);setError('تعذّر الاتصال ببث الإذاعة.');}} /></div>
 {error&&<p className="anees-error" role="status">{error}</p>}
 </section>
 {prayerPanel&&<div className="anees-prayer-modal-backdrop" onClick={()=>setPrayerPanel(null)}>
  <section className="anees-prayer-modal" role="dialog" aria-modal="true" aria-label={prayerPanel==='qibla'?'اتجاه القبلة':'تفاصيل الصلاة'} dir="rtl" onClick={e=>e.stopPropagation()}>
   <header className="anees-prayer-modal-header"><h2>{prayerPanel==='qibla'?'اتجاه القبلة':'تفاصيل الصلاة'}</h2><button type="button" aria-label="إغلاق النافذة" onClick={()=>setPrayerPanel(null)}><X size={21}/></button></header>
   {prayerPanel==='qibla'?<div className="anees-qibla-body">
    <div className={`anees-qibla-compass ${qiblaAligned?'anees-qibla-aligned':''}`} aria-label={`اتجاه القبلة ${qibla} درجة من الشمال`}>
      <span className="anees-qibla-north">ش</span><span className="anees-qibla-east">شـر</span><span className="anees-qibla-south">ج</span><span className="anees-qibla-west">غ</span>
      <div className="anees-qibla-needle" style={{transform:`translate(-50%,-50%) rotate(${qibla-(compassHeading||0)}deg)`}}>
       <svg viewBox="0 0 68 190" aria-hidden="true" focusable="false"><defs><linearGradient id="anees-needle-shine" x1="0" x2="1"><stop stopColor="#fff0c7"/><stop offset="1" stopColor="#c49a50"/></linearGradient></defs><path d="M34 5L57 94H34Z" fill="url(#anees-needle-shine)"/><path d="M34 5L11 94H34Z" fill="#f7dca3"/><path d="M11 94L34 182V94Z" fill="#2d6855"/><path d="M57 94L34 182V94Z" fill="#173d31"/></svg>
      </div><div className="anees-qibla-hub" aria-hidden="true">✦</div>
    </div>
    <strong className="anees-qibla-degrees" dir="ltr">{qibla}°</strong>{qiblaAligned&&<div className="anees-qibla-success" role="status">✓ أنت في اتجاه القبلة</div>}
    <p>اتجاه القبلة من الشمال الجغرافي · {loc.label}</p>
    <p className="anees-qibla-help">{compassHeading===null?'السهم يشير للقبلة بافتراض أن أعلى الشاشة شمال؛ اسمح ببوصلة الجهاز لتحريك السهم مع اتجاه الهاتف.':'حرّك الهاتف ببطء؛ ستضيء البوصلة عند محاذاة اتجاه القبلة.'}</p>
    {compassHeading===null&&<button className="anees-qibla-enable" type="button" onClick={askCompass}>تفعيل بوصلة الهاتف</button>}
    {compassMessage&&<p role="status" className="anees-qibla-help">{compassMessage}</p>}
   </div>:<div className="anees-prayer-details">
    <div className="anees-details-next"><div><span>الصلاة القادمة</span><strong>{next?.name||'—'}</strong></div><div className="anees-details-clock"><span>{next?.time||'--:--'}</span><b dir="ltr">{next?countdown:'--:--:--'}</b></div></div>
    <div className="anees-prayer-detail-list">
      {[
        {label:'الفجر',time:prayerTime('Fajr'),Icon:Moon},
        {label:'الشروق',time:sunrise,Icon:Sunrise},
        {label:'الظهر',time:prayerTime('Dhuhr'),Icon:Clock3},
        {label:'العصر',time:prayerTime('Asr'),Icon:Clock3},
        {label:'المغرب',time:prayerTime('Maghrib'),Icon:Sunset},
        {label:'العشاء',time:prayerTime('Isha'),Icon:MoonStar}
      ].map(({label,time,Icon})=><div key={label}><span><Icon size={18}/>{label}</span><strong dir="ltr">{time||'--:--'}</strong></div>)}
      <div><span><Moon size={18}/>منتصف الليل</span><strong>{midnight?formatZonedTime(midnight,prayerTimeZone):'—'}</strong></div>
      <div><span><MoonStar size={18}/>الثلث الأخير</span><strong>{lastThird?formatZonedTime(lastThird,prayerTimeZone):'—'}</strong></div>
    </div>
    <details className="anees-prohibition" open={noPrayerOpen} onToggle={e=>setNoPrayerOpen(e.currentTarget.open)}>
      <summary><span><Sunset size={19}/>أوقات النهي عن الصلاة</span><span className="anees-prohibition-toggle">{noPrayerOpen?'−':'+'}</span></summary>
      <div className="anees-prohibition-content">
        {prohibitionPeriods.map(p=><div key={p.title}><span>{p.icon==='sunrise'?<Sunrise size={18}/>:p.icon==='sunset'?<Sunset size={18}/>:<Clock3 size={18}/>}</span><div><strong>{p.title}</strong><p>{p.detail}</p></div>{p.active&&<em>وقت نهي تقريبي الآن</em>}</div>)}
        <p>هذه الفترات تتعلق بالنهي عن بعض الصلوات النافلة، وتوجد استثناءات وخلافات فقهية. لا يُستغنى عن التوقيت الشرعي المحلي، خصوصًا لحظة الزوال وارتفاع الشمس.</p>
      </div>
    </details>
    <p className="anees-details-note">المواقيت حسابية، ومنتصف الليل والثلث الأخير محسوبان من مغرب اليوم إلى فجر الغد.</p>
   </div>}
  </section>
 </div>}
 </>;
}
