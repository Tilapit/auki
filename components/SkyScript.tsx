import { computeSky } from '@/lib/sky';

/**
 * Picks the sky before first paint. The page is prerendered without knowing the visitor's
 * time, so this inline script runs in <head>, computes the look from the device clock and
 * time zone, and sets the --sky-* variables on <html>. No network, no storage, no animation.
 * Without JavaScript the twilight defaults in globals.css stay.
 */
export function SkyScript() {
  const code = `(function(){try{var c=${computeSky.toString()};var s=c(Date.now(),Intl.DateTimeFormat().resolvedOptions().timeZone);var r=document.documentElement;for(var k in s.vars)r.style.setProperty(k,s.vars[k]);}catch(e){}})()`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
