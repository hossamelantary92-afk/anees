import {SURAHS} from '../data/surahs';
export interface ReadingPosition {surah:number;ayah:number;}
export function validPosition(value:unknown):value is ReadingPosition {
 const p=value as ReadingPosition;
 if(!p||!Number.isInteger(p.surah)||!Number.isInteger(p.ayah))return false;
 const chapter=SURAHS.find(s=>s.id===p.surah);
 return !!chapter&&p.ayah>=1&&p.ayah<=chapter.ayahs;
}
export function nextPosition(p:ReadingPosition):ReadingPosition|null {
 if(!validPosition(p))return null;
 const s=SURAHS[p.surah-1];
 return p.ayah<s.ayahs?{surah:p.surah,ayah:p.ayah+1}:p.surah<114?{surah:p.surah+1,ayah:1}:null;
}
