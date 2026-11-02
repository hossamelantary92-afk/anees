export interface FavoriteReciter {id:string;name:string;url:string;}
export function normalizeReciterUrl(value:string):string|null {
 const text=value.trim();if(!text)return '';
 try {const candidate=/^[a-z][a-z\d+.-]*:/i.test(text)?text:'https://'+text;const url=new URL(candidate);return ['https:','http:'].includes(url.protocol)&&!!url.hostname&&!url.username&&!url.password?url.href:null;}catch{return null;}
}
export function validReciters(value:unknown):value is FavoriteReciter[]{return Array.isArray(value)&&value.length<=500&&new Set(value.map(v=>v?.id)).size===value.length&&value.every(v=>v&&typeof v.id==='string'&&v.id.length<=100&&typeof v.name==='string'&&!!v.name.trim()&&v.name.length<=100&&typeof v.url==='string'&&v.url.length<=2000&&normalizeReciterUrl(v.url)!==null);}
