import {storage} from './storage';
import {ALL_ADHKAR} from '../data/adhkarData';
export const prayers = ['الفجر','الظهر','العصر','المغرب','العشاء'];
export const goodDeeds = ['صدقة','صلة رحم','مساعدة شخص','زيارة مريض','عمل خير آخر'];
export const optionalPrayers = ['السنن الرواتب','الضحى','الوتر'];
export interface DayRecord { prayers: string[]; extras: string[]; deeds: string[]; quran: Partial<Record<'صفحة'|'دقيقة'|'حزب'|'جزء',number>>; quranUnit?:Plan['quranUnit']; memorization: number; revision: number; custom: string[]; }
export interface Plan { quranGoal:number; quranUnit:'صفحة'|'دقيقة'|'حزب'|'جزء'; extras:string[]; showQuran:boolean; showDeeds:boolean; showAdhkar:boolean; showMemorization:boolean; showRevision:boolean; memorizationGoal:number; revisionGoal:number; custom:{id:string;label:string}[]; }
export interface WorshipData { version:1; days:Record<string,DayRecord>; plan:Plan; bookmark:string; }
export interface Summary { morning:{completed:number;total:number}; evening:{completed:number;total:number}; }
export const dateKey=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export const blankDay=():DayRecord=>({prayers:[],extras:[],deeds:[],quran:{},memorization:0,revision:0,custom:[]});
export const defaultPlan:Plan={quranGoal:10,quranUnit:'صفحة',extras:['الوتر'],showQuran:true,showDeeds:true,showAdhkar:true,showMemorization:false,showRevision:false,memorizationGoal:7,revisionGoal:7,custom:[]};
const positive=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=100000;
const stringArray=(v:unknown):v is string[]=>Array.isArray(v)&&v.length<=500&&v.every(x=>typeof x==='string'&&x.length<=200);
export function isWorshipData(x:unknown):x is WorshipData {
 const d=x as WorshipData;const p=d?.plan;
 return !!d&&d.version===1&&typeof d.bookmark==='string'&&d.bookmark.length<=500&&!!p&&positive(p.quranGoal)&&p.quranGoal>0&&['صفحة','دقيقة','حزب','جزء'].includes(p.quranUnit)&&positive(p.memorizationGoal)&&positive(p.revisionGoal)&&['showQuran','showDeeds','showAdhkar','showMemorization','showRevision'].every(k=>typeof p[k as keyof Plan]==='boolean')&&stringArray(p.extras)&&p.extras.every(v=>optionalPrayers.includes(v))&&Array.isArray(p.custom)&&p.custom.length<=50&&p.custom.every(v=>v&&typeof v.id==='string'&&typeof v.label==='string')&&new Set(p.custom.map(v=>v.id)).size===p.custom.length&&p.custom.every(v=>typeof v.id==='string'&&v.id.length<=100&&typeof v.label==='string'&&v.label.length<=80)&&!!d.days&&typeof d.days==='object'&&!Array.isArray(d.days)&&Object.entries(d.days).every(([key,v])=>validDate(key)&&v&&stringArray(v.prayers)&&v.prayers.every(p=>prayers.includes(p))&&stringArray(v.extras)&&stringArray(v.deeds)&&stringArray(v.custom)&&!!v.quran&&typeof v.quran==='object'&&!Array.isArray(v.quran)&&Object.entries(v.quran).every(([u,n])=>['صفحة','دقيقة','حزب','جزء'].includes(u)&&positive(n))&&(v.quranUnit===undefined||['صفحة','دقيقة','حزب','جزء'].includes(v.quranUnit))&&positive(v.memorization)&&positive(v.revision));
}
export function validDate(s:string){if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+'T12:00:00');return !isNaN(+d)&&dateKey(d)===s;}
export function loadWorship():WorshipData {try {const d=JSON.parse(storage.getItem('hisn_worship')||'null');if(isWorshipData(d))return d;}catch{}return {version:1,days:{},plan:{...defaultPlan},bookmark:''};}
export function summarize(counts:Record<string,number>):Summary { const one=(category:string)=>{const list=ALL_ADHKAR.filter(d=>d.category===category);return {total:list.length,completed:list.filter(d=>counts[d.id]===0).length};};return {morning:one('morning'),evening:one('evening')}; }
export function loadAdhkarHistory():Record<string,Summary>{try {const v=JSON.parse(storage.getItem('hisn_adhkar_history')||'{}');if(validHistory(v))return v;}catch{}return {};}
export function validHistory(v:unknown):v is Record<string,Summary>{return !!v&&typeof v==='object'&&!Array.isArray(v)&&Object.entries(v).every(([date,s])=>validDate(date)&&['morning','evening'].every(k=>{const n=(s as Record<string,{completed:number;total:number}>)?.[k];return n&&positive(n.completed)&&positive(n.total)&&n.completed<=n.total;}));}
export function archiveAdhkar(date:string,counts:Record<string,number>){if(!validDate(date))return;const h=loadAdhkarHistory();h[date]=summarize(counts);storage.setItem('hisn_adhkar_history',JSON.stringify(h));}
