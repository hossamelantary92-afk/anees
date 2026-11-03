import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
class AppBoundary extends React.Component<React.PropsWithChildren, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  private exportEmergencyBackup = () => {
    try {
      const keys = [
        'hisn_worship', 'hisn_adhkar_history', 'adhkar_remaining',
        'adhkar_date', 'hisn_favorites', 'hisn_positions',
        'hisn_category', 'hisn_display_adhkar', 'hisn_display_favorites',
        'anees_saved_tasbih', 'tasbih_count', 'tasbih_laps', 'tasbih_lifetime',
        'anees_prayer_location', 'anees_prayer_location_mode', 'anees_calendar'
      ];
      const data: Record<string, string> = {};
      for (const key of keys) {
        const value = window.localStorage.getItem(key);
        if (value !== null) data[key] = value;
      }
      const blob = new Blob([JSON.stringify({ app: 'anees-emergency-backup', version: 1, exportedAt: new Date().toISOString(), data }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'anees-emergency-backup.json';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      window.alert('تعذّر تصدير النسخة. لا تحذف بيانات الموقع، وحاول فتحه من جديد.');
    }
  };
  render() {
    if (this.state.failed) return <main dir="rtl" style={{maxWidth:600,margin:'60px auto',padding:24,fontFamily:'Tajawal,sans-serif',lineHeight:2}}>
      <h1>تعذّر فتح أنيس</h1>
      <p>حدث خطأ مؤقت. بيانات عباداتك محفوظة على جهازك ولم يتم مسحها.</p>
      <button style={{padding:12,margin:8,borderRadius:12,background:'#103e31',color:'white'}} onClick={() => window.location.reload()}>إعادة المحاولة</button>
      <button style={{padding:12,margin:8,borderRadius:12,border:'1px solid #b99854'}} onClick={this.exportEmergencyBackup}>تنزيل نسخة إنقاذ من البيانات</button>
    </main>;
    return this.props.children;
  }
}
createRoot(document.getElementById('root')!).render(<AppBoundary><App /></AppBoundary>);
// Retire only this app's old worker; the single-file build needs no asset fetches.
if (location.protocol !== 'file:' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const registration of registrations) {
      const worker = registration.active || registration.waiting || registration.installing;
      if (worker && worker.scriptURL === new URL('sw.js', location.href).href) void registration.unregister();
    }
  }).catch(() => {});
}
