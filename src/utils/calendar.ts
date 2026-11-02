/** Presentation-only calendar. Persisted dates remain ISO/Gregorian for stable records. */
export type CalendarKind = 'gregory' | 'hijri';
export const calendarPreference = (): CalendarKind => {
  try { return window.localStorage.getItem('anees_calendar') === 'hijri' ? 'hijri' : 'gregory'; }
  catch { return 'gregory'; }
};
export const calendarLocale = (kind: CalendarKind) => kind === 'hijri' ? 'ar-SA-u-ca-islamic-umalqura' : 'ar-SA-u-ca-gregory';
export const calendarDate = (value: Date | string) => typeof value === 'string' ? new Date(value + 'T12:00:00') : value;
export function formatCalendarDate(value: Date | string, kind: CalendarKind, opts: Intl.DateTimeFormatOptions = {weekday:'long',day:'numeric',month:'long',year:'numeric'}) {
  return new Intl.DateTimeFormat(calendarLocale(kind), opts).format(calendarDate(value));
}
const hijriParts = (d: Date) => {
  const parts = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', {year:'numeric',month:'numeric',day:'numeric'}).formatToParts(d);
  const number = (type:string) => Number(parts.find(p=>p.type===type)?.value ?? 0);
  return {year:number('year'),month:number('month'),day:number('day')};
};
const addDays = (date:Date, amount:number) => {const d=new Date(date);d.setDate(d.getDate()+amount);return d;};
export function calendarMonth(anchor: Date, kind: CalendarKind) {
  if (kind === 'gregory') {
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1, 12);
    const last = new Date(anchor.getFullYear(), anchor.getMonth()+1, 0, 12);
    const days = Array.from({length:last.getDate()}, (_, i)=>({date:addDays(first,i),label:String(i+1)}));
    return {first,days};
  }
  const id=hijriParts(anchor);
  let first = new Date(anchor);
  while (first.getTime()>addDays(anchor,-35).getTime()) {
    const prev=addDays(first,-1),p=hijriParts(prev);
    if (p.month!==id.month || p.year!==id.year) break;
    first=prev;
  }
  const days: {date:Date;label:string}[]=[];
  for (let d=first,i=0;i<31;i++,d=addDays(d,1)) {
    const p=hijriParts(d);
    if (p.month!==id.month || p.year!==id.year) break;
    days.push({date:d,label:String(p.day)});
  }
  return {first,days};
}
export function moveCalendarMonth(anchor:Date, kind:CalendarKind, direction:number) {
  if (kind==='gregory') return new Date(anchor.getFullYear(),anchor.getMonth()+direction,15,12);
  const current=calendarMonth(anchor,'hijri');
  if (direction>0) return addDays(current.days[current.days.length-1].date,15);
  return addDays(current.first,-15);
}
