import type { CSSProperties } from 'react';

export type LogisticsGroup = 'handling' | 'operation';
const defs = [
  ['fragile','handling','fragile','<path d="M18 8h28l-4 17c-2 7-6 10-10 10s-8-3-10-10zM32 35v15m-9 0h18"/>'],
  ['this-side-up','handling','thisSideUp','<path d="M14 30V8L5 17l-4-4L16 0l15 13-4 4-8-8v21zm36 0V8l-8 9-4-4L52 0l12 13-4 4-8-8v21zM10 34h44v28H10z"/>'],
  ['keep-dry','handling','keepDry','<path d="M32 4C19 4 10 13 8 26h48C54 13 45 4 32 4zm-2 24h6v20c0 6-4 9-10 9h-3v-6h3c3 0 4-1 4-4zM12 37l-4 6m22-6-4 6m22-6-4 6"/>'],
  ['protect-heat','handling','protectHeat','<circle cx="32" cy="22" r="13"/><path d="M32 1v8m0 26v8M11 22H3m58 0h-8M17 7l6 6m18 18 6 6m0-30-6 6M23 31l-6 6M8 51h48v10H8z"/>'],
  ['stack-limit','handling','stackLimit','<path d="m4 42 14-8 14 8-14 8zm28 0 14-8 14 8-14 8zM4 56l14-8 14 8-14 8zm28 0 14-8 14 8-14 8zM32 28V3m0 0-9 9m9-9 9 9"/>'],
  ['do-not-stack','handling','doNotStack','<path d="m5 35 27-14 27 14-27 14zm0 7v13l27 9 27-9V42M8 8l48 48M56 8 8 56" stroke-width="6"/>'],
  ['center-gravity','handling','centerGravity','<path d="M32 8 56 54H8z"/><path d="M14 38h36"/><circle cx="32" cy="44" r="4"/>'],
  ['no-hooks','handling','noHooks','<path d="M17 9V5a8 8 0 0 1 16 0v10h-6V5a2 2 0 0 0-4 0v4m6 8h7v16c0 12-8 20-20 20H8v-6h8c8 0 14-6 14-14zM8 8l48 48M56 8 8 56" stroke-width="5"/>'],
  ['do-not-roll','handling','doNotRoll','<path d="M20 22h24v20H20z"/><ellipse cx="20" cy="32" rx="4" ry="10"/><ellipse cx="44" cy="32" rx="4" ry="10"/><circle cx="32" cy="32" r="28"/><path d="M12 12l40 40"/>'],
  ['handle-care','handling','handleCare','<path d="M12 20h40v34H12z"/><path d="M12 32h40"/><path d="M4 30a8 8 0 0 0 8 6M60 30a8 8 0 0 1-8 6"/>'],
  ['forklift-here','handling','forkliftHere','<path d="M5 30h24l11 12v8H5zm8 0V18h12v12m15 12h12V24h-7v10m7-10V8h6v46H4m12-4a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm26 0a5 5 0 1 0 0 10 5 5 0 0 0 0-10z"/>'],
  ['tie-down','handling','tieDown','<path d="M10 20h44v34H10z"/><path d="M22 20V8h20v12"/><path d="M22 20v34M42 20v34"/>'],
  ['temperature-limit','handling','temperatureLimit','<path d="M25 37V10a9 9 0 0 1 18 0v27a16 16 0 1 1-18 0zM34 16v29" stroke-width="6"/><circle cx="34" cy="50" r="7"/><path d="M48 14h10m-10 9h7"/>'],
  ['truck-box','operation','truckBox','<path d="M3 15h37v31H3zm37 10h12l10 12v9H40zM7 21h29v18H7zm10 21a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm34 0a7 7 0 1 0 0 14 7 7 0 0 0 0-14z"/>'],
  ['truck-trailer','operation','truckTrailer','<path d="M2 18h36v28H2zm36 9h13l11 11v8H38zM7 24h26v15H7zm7 18a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm35 0a7 7 0 1 0 0 14 7 7 0 0 0 0-14z"/>'],
  ['van','operation','van','<path d="M5 17h34v29H5zm34 10h12l9 10v9H39zM10 23h24v15H10zm7 19a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm32 0a6 6 0 1 0 0 12 6 6 0 0 0 0-12z"/>'],
  ['forklift','operation','forklift','<path d="M7 33h27l11 11v6H7zm8 0V18h13v15m6 0V8h6v31m0-17h15v34M4 61h56"/><circle cx="17" cy="53" r="6"/><circle cx="42" cy="53" r="6"/>'],
  ['pallet-boxes','operation','palletBoxes','<path d="M4 52h56v6H4zm6 6v5m22-5v5m22-5v5M6 27l13-8 13 8-13 8zm26 0 13-8 13 8-13 8zM6 42l13-8 13 8-13 8zm26 0 13-8 13 8-13 8z"/>'],
  ['closed-box','operation','closedBox','<path d="m4 19 28-14 28 14v34L32 63 4 53zm0 0 28 15 28-15M32 34v29M21 11l28 15v12L21 24z"/>'],
  ['open-box','operation','openBox','<path d="m6 24 26-13 26 13v31L32 63 6 55zm0 0 26 14 26-14M32 38v25M17 18 5 5l18 5m24 8L59 5l-18 5"/>'],
  ['containers','operation','containers','<path d="M4 8h26v48H4zm30 0h26v48H34zM9 13v38m7-38v38m8-38v38m16-38v38m8-38v38m8-38v38M4 19h26m-26 26h26m4-26h26m-26 26h26"/>'],
  ['warehouse','operation','warehouse','<path d="M3 26 32 6l29 20v34H3zm7 4h44v30H10zm7 6h10v10H17zm20 0h10v10H37zm-20 16h10v8H17zm20 0h10v8H37z"/>'],
  ['loading-dock','operation','loadingDock','<path d="M4 56h56"/><path d="M8 56V12h48v44"/><path d="M14 56V22h36v34"/><path d="M14 32h36M14 42h36"/>'],
  ['barcode-scanner','operation','barcodeScanner','<path d="M10 8h39a8 8 0 0 1 8 8v22H10zm7 38h23l9 9H17zm2-30v13m6-13v13m6-13v13m6-13v13m6-13v13M4 4h8M4 4v8m56-8h-8m8 0v8"/>'],
  ['checklist','operation','checklist','<path d="M13 6h38v54H13zm9 11h21M22 29h21M22 41h21M22 53h21M5 17l3 3 6-7M5 29l3 3 6-7M5 41l3 3 6-7"/>'],
  ['invoice','operation','invoice','<path d="M12 4h40v56l-8-5-8 5-8-5-8 5-8-5zm8 13h24m-24 9h24m-24 9h14m-14 9h24"/>'],
  ['route-pin','operation','routePin','<path d="M32 61S13 39 13 25a19 19 0 1 1 38 0C51 39 32 61 32 61z"/><circle cx="32" cy="25" r="7"/><path d="M5 56h17m20 0h17M8 49l7 7-7 7m48-14-7 7 7 7"/>'],
  ['deadline','operation','deadline','<circle cx="32" cy="34" r="24"/><path d="M32 22v12l8 6M26 6h12M32 6v4"/>'],
  ['scale','operation','scale','<path d="M29 8h6v43h-6zm-16 7h38v6H13zm19 0L16 38h32zM9 38h14c0 9-3 13-7 13s-7-4-7-13zm32 0h14c0 9-3 13-7 13s-7-4-7-13zM17 57h30v5H17z"/>'],
  ['return-box','operation','returnBox','<path d="M28 6 16 14l12 8"/><path d="M16 14h20a10 10 0 0 1 0 20H26"/><path d="M12 44h40v16H12z"/>'],
  ['delivered','operation','delivered','<path d="m4 22 20-11 20 11v25L24 59 4 47zm0 0 20 11 20-11M24 33v26m12-12 7 7 16-19"/>'],
] as const;
export type LogisticsIconId = typeof defs[number][0];
export const logisticsIcons = defs.map(([id, group, key, body]) => ({ id, group, key, body }));
const RED_IDS = new Set(['fragile', 'do-not-stack', 'no-hooks']);
const ORANGE_GROUP = 'handling';
const SKY_IDS = new Set(['truck-box', 'truck-trailer', 'van']);
const EMERALD_IDS = new Set(['forklift', 'pallet-boxes', 'closed-box', 'open-box', 'warehouse', 'containers']);
export function logisticsIconToneClass(id: string): string {
  if (RED_IDS.has(id)) return 'text-red-600 dark:text-red-400';
  if (SKY_IDS.has(id)) return 'text-primary';
  if (EMERALD_IDS.has(id)) return 'text-emerald-600 dark:text-emerald-400';
  const icon = getLogisticsIcon(id);
  if (icon?.group === ORANGE_GROUP) return 'text-orange-600 dark:text-orange-400';
  return 'text-indigo-600 dark:text-indigo-400';
}
export function getLogisticsIcon(id: string) { return logisticsIcons.find(icon => icon.id === id); }
export function logisticsIconMarkup(id: string, color = '#18181b', size = 48): string {
  const icon = getLogisticsIcon(id); if (!icon) return '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64" style="color:${color}" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${icon.body}</svg>`;
}
export function LogisticsIconPreview({ id, className = '', style }: { id: string; className?: string; style?: CSSProperties }) {
  return <span className={`${className} ${logisticsIconToneClass(id)}`} style={style} aria-hidden="true" dangerouslySetInnerHTML={{ __html: logisticsIconMarkup(id).replace('width="48" height="48"', 'width="100%" height="100%"') }} />;
}
