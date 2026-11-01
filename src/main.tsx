import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
class AppBoundary extends React.Component<React.PropsWithChildren, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <main dir="rtl" style={{maxWidth:600,margin:'60px auto',padding:24,fontFamily:'sans-serif',lineHeight:2}}><h1>تعذّر فتح الأذكار</h1><p>قد تكون بيانات الجلسة المحفوظة غير سليمة. يمكنك مسح بيانات هذا التطبيق والمحاولة من جديد.</p><button onClick={() => { try { for (const key of Object.keys(window.localStorage)) if (/^(hisn_|adhkar_)/.test(key)) window.localStorage.removeItem(key); } catch {} window.location.reload(); }}>مسح بيانات التطبيق وإعادة المحاولة</button></main>;
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
