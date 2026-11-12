/* AR 4C Dash: the AR Smart Home Residence look as a phone dashboard.
 *
 * The "4C Dash" sidebar item (a Home Assistant panel, element ar-4c-dash-panel).
 * Open it in the Home Assistant app on a phone: HA's own login and remote
 * access, and it talks to HA directly. The rooms and devices are set up here
 * too (gear > Setup, admins) and kept by the integration (ar_4c_dash/config).
 * Each person's own choices (room, icons, button look, background) are saved
 * with their HA login, so they follow them to every phone.
 *
 * Also usable as a card on any dashboard: type: custom:ar-4c-dash
 */
(() => {
const VERSION = "1.5.1";
const MENU = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
const SETUP_CATS = [["lights", "Lights"], ["climate", "Comfort"], ["music", "Listen"], ["watch", "Watch"], ["shades", "Shades"], ["scenes", "Scenes"], ["presence", "Presence / motion sensor"]];
const HOUSE_CATS = [["cameras", "Cameras"], ["security", "Alarm"], ["garage", "Garage doors"], ["utilities", "Utilities"]];
const HOUSE_KEYS = ["cameras", "security", "utilities", "garage"]; // whole home, the same in every room
const SOLAR_KEYS = [["solar_power", "Solar power"], ["grid_power", "Grid power (+ in, \u2212 out)"], ["battery_power", "Battery power (+ charging)"], ["battery_soc", "Battery %"], ["home_power", "Home use"], ["solar_daily", "Solar today"], ["grid_import_daily", "Grid in today"], ["grid_export_daily", "Grid out today"], ["home_daily", "Home today"]];
const INVERTERS = [["default", "Other"], ["sunsynk", "Sunsynk"], ["deye", "Deye"], ["inverex", "Inverex"], ["solis_hybrid", "Solis"], ["goodwe_hybrid", "GoodWe"], ["growatt", "Growatt"], ["victron", "Victron"], ["solaredge", "SolarEdge"], ["fronius_gen24", "Fronius"], ["huawei_luna", "Huawei"]];
const PICK_DOM = { presence: ["binary_sensor", "input_boolean"], ptemp: ["sensor", "weather", "climate"], lights: ["light", "switch"], climate: ["climate"], music: ["media_player"], watch: ["media_player", "remote"], shades: ["cover"], scenes: ["scene", "script"], cameras: ["camera"], security: ["alarm_control_panel"], utilities: ["switch", "input_boolean", "sensor", "binary_sensor", "fan", "light", "valve", "water_heater", "lock"], weather: ["weather"], solar: ["sensor"], gsensor: ["binary_sensor", "sensor", "input_boolean"], garage: ["cover", "switch", "button", "input_button", "lock"], people: ["person", "device_tracker"] };
const BASE = "/ar_4c_dash_static";
const PREF_KEY = "ar_4c_dash";
const DROP = '<svg viewBox="0 0 24 24"><path d="M12 3.5c3 3.6 5.5 6.9 5.5 10a5.5 5.5 0 0 1-11 0c0-3.1 2.5-6.4 5.5-10z"/></svg>';
const SUNUP = '<svg viewBox="0 0 24 24"><path d="M4 18h16M7 18a5 5 0 0 1 10 0M12 4v4M9.5 6.5L12 4l2.5 2.5M4.5 13l1.6.9M19.5 13l-1.6.9"/></svg>';
const SUNDN = '<svg viewBox="0 0 24 24"><path d="M4 18h16M7 18a5 5 0 0 1 10 0M12 4v4M9.5 5.5L12 8l2.5-2.5M4.5 13l1.6.9M19.5 13l-1.6.9"/></svg>';
const LINE = {
  garage: '<path d="M3 10.5L12 4l9 6.5V20H3z"/><path d="M6.5 20v-8h11v8M6.5 14.7h11M6.5 17.4h11"/>',
  icons: '<circle cx="7.5" cy="7.5" r="3.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><path d="M7.5 13.5l4 6.5h-8z"/><circle cx="16.5" cy="16.5" r="3.5"/>',
  chev: '<path d="M9 6l6 6-6 6"/>',
  rooms: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeoff: '<path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7a9.6 9.6 0 0 0 4.4-1"/>',
  pencil: '<path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4"/>',
  lights: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/>',
  climate: '<path d="M10 4a2 2 0 0 1 4 0v9.3a4 4 0 1 1-4 0z"/><path d="M12 9v6.5"/><path d="M17.5 6h2.5M17.5 9.5h2.5"/>',
  music: '<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
  watch: '<rect x="3" y="5" width="18" height="12" rx="1.5"/><path d="M8 21h8M12 17v4"/>',
  shades: '<path d="M4 3h16"/><path d="M5 3v11h14V3"/><path d="M5 6.5h14M5 10h14"/><path d="M12 14v3"/><circle cx="12" cy="18.5" r="1.5"/>',
  security: '<path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/>',
  cameras: '<path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="12.5" r="3.5"/>',
  scenes: '<path d="M12 3l1.8 4.6L18.5 9l-4.7 1.4L12 15l-1.8-4.6L5.5 9l4.7-1.4z"/><path d="M18 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
  utilities: '<path d="M12 2.7 6.3 9a7 7 0 1 0 11.4 0z"/><path d="m12.5 10-2.5 4h4l-2.5 4"/>',
  power: '<path d="M12 3v8"/><path d="M6.3 6.8a8 8 0 1 0 11.4 0"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
  chevl: '<path d="M15 5l-7 7 7 7"/>',
  chevr: '<path d="M9 5l7 7-7 7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  back: '<path d="M9 5H20a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H9l-6-7z"/><path d="M12 9l6 6M18 9l-6 6"/>',
  home: '<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/>',
  up: '<path d="M6 15l6-6 6 6"/>',
  down: '<path d="M6 9l6 6 6-6"/>',
  stop: '<rect x="8" y="8" width="8" height="8" rx="1.5"/>',
  open2: '<path d="M9 6l-6 6 6 6M3 12h8M15 6l6 6-6 6M21 12h-8"/>',
  close2: '<path d="M3 6l6 6-6 6M9 12H3M21 6l-6 6 6 6M15 12h6"/>',
  prev: '<path d="M19 6l-8 6 8 6zM7 6v12"/>',
  next: '<path d="M5 6l8 6-8 6zM17 6v12"/>',
  vol: '<path d="M4 10h3l5-4v12l-5-4H4z"/><path d="M16 9a4 4 0 0 1 0 6"/>',
  sparkle: '<path d="M12 3l1.8 4.6L18.5 9l-4.7 1.4L12 15l-1.8-4.6L5.5 9l4.7-1.4z"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  movie: '<rect x="3" y="6" width="18" height="13" rx="1.5"/><path d="M3 10h18M7 6l2 4M12 6l2 4M17 6l2 4"/>',
  dinner: '<path d="M7 3v8M5 3v4a2 2 0 0 0 4 0V3M7 11v10"/><path d="M17 3c-2 1-3 3.5-3 6v3h3v9"/>',
  relax: '<path d="M4 13h16v3a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z"/><path d="M6 13V9a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4M7 19v2M17 19v2"/>',
  party: '<path d="M4 20l5-14 9 9z"/><path d="M14 4l1 2M19 9l2-1M17 3l-1 3"/>',
  away: '<path d="M14 4h5v16h-5"/><path d="M10 8l-4 4 4 4M6 12h9"/>',
  read: '<path d="M4 5c3-1 6-.5 8 1.5 2-2 5-2.5 8-1.5v14c-3-1-6-.5-8 1.5-2-2-5-2.5-8-1.5z"/><path d="M12 6.5v14"/>',
};
const PRESETS = {"villa": "villa.jpg", "cape": "cape.jpg", "sunset-sea": "sunset-sea.jpg", "mountains": "mountains.jpg", "forest-mist": "forest-mist.jpg", "dunes": "dunes.jpg", "stars": "stars.jpg", "aurora": "aurora.jpg", "city-night": "city-night.jpg", "lounge": "lounge.jpg", "marble-white": "marble-white.jpg", "marble-black": "marble-black.jpg", "slate": "slate.jpg", "concrete": "concrete.jpg", "steel": "steel.jpg", "walnut": "walnut.jpg", "oak": "oak.jpg", "leather": "leather.jpg", "linen": "linen.jpg", "colour-midnight": "colour-midnight.jpg", "colour-emerald": "colour-emerald.jpg", "colour-bordeaux": "colour-bordeaux.jpg", "colour-champagne": "colour-champagne.jpg", "colour-graphite": "colour-graphite.jpg", "colour-twilight": "colour-twilight.jpg", "colour-lagoon": "colour-lagoon.jpg", "colour-amber": "colour-amber.jpg", "sky-blue": "sky-blue.jpg", "sky-high": "sky-high.jpg", "sky-golden": "sky-golden.jpg", "sky-dawn": "sky-dawn.jpg", "sky-moon": "sky-moon.jpg"};
const BG_NAMES = { villa: "Villa at dusk", cape: "Cape dusk", "sunset-sea": "Sunset sea", mountains: "Misty mountains", "forest-mist": "Forest mist", dunes: "Desert dunes", stars: "Night sky", aurora: "Aurora", "city-night": "City lights", lounge: "Evening lounge", "marble-white": "White marble", "marble-black": "Black marble", slate: "Slate", concrete: "Concrete", steel: "Brushed steel", walnut: "Walnut", oak: "Oak", leather: "Leather", linen: "Linen", "colour-midnight": "Midnight blue", "colour-emerald": "Emerald", "colour-bordeaux": "Bordeaux", "colour-champagne": "Champagne silk", "colour-graphite": "Graphite silk", "colour-twilight": "Twilight", "colour-lagoon": "Lagoon", "colour-amber": "Amber glow", "sky-blue": "Blue sky", "sky-high": "High clouds", "sky-golden": "Golden hour", "sky-dawn": "Pastel dawn", "sky-moon": "Moonlit clouds" };
const TITLES = { garage: "Garage", lights: "Lights", climate: "Comfort", music: "Listen", watch: "Watch", shades: "Shades", cameras: "Cameras", utilities: "Utilities", security: "Security", scenes: "Scenes" };
const ORDER = ["lights", "climate", "music", "watch", "shades", "garage", "cameras", "utilities", "security", "scenes"];
// Utilities sections (3D slider): key, title, built-in icon, glow colour
const U_SECT = [["pool", "Pool", "r2_pool", "70,190,255"], ["irrigation", "Irrigation", "r2_irrigation", "96,214,120"], ["geyser", "Geysers", "r2_geyser", "255,138,64"], ["more", "Other", "r2_utilities", "250,204,80"]];
const ROOM_KEYS = ["lights", "climate", "music", "watch", "shades", "scenes", "presence"];
const IC_CATS = ["Lighting", "Climate", "Security", "Media", "Doors & shades", "Utilities", "Scenes & rooms"];
const IC_FOR = { garage: "Doors & shades", lights: "Lighting", climate: "Climate", security: "Security", cameras: "Security", music: "Media", watch: "Media", shades: "Doors & shades", utilities: "Utilities", scenes: "Scenes & rooms" };
const LAMP_K = { warm: 2700, soft: 3000, neutral: 4000, cool: 5000, daylight: 6500, dim: 2200 };
const LAMP_NAME = { lamp: "Pendant", edison: "Filament", downlight: "Downlight", bulb: "Bulb" };
const MODE = { off: "Off", heat: "Heat", cool: "Cool", heat_cool: "Heat / cool", auto: "Auto", dry: "Dry", fan_only: "Fan" };
const MODE_COL = { cool: "#7fc6ff", heat: "#ffb070", heat_cool: "#f3d39a", auto: "#f3d39a", dry: "#b9e3a8", fan_only: "#cfd6de", off: "#8a8a8a" };
const ALARM = { disarmed: "Disarmed", armed_home: "Armed home", armed_away: "Armed away", armed_night: "Armed night", armed_vacation: "Armed vacation", armed_custom_bypass: "Armed", arming: "Arming\u2026", pending: "Pending\u2026", disarming: "Disarming\u2026", triggered: "Alarm!" };

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
LINE.speaker = '<rect x="6" y="3" width="12" height="18" rx="2"/><circle cx="12" cy="14" r="3"/><circle cx="12" cy="7.5" r="1"/>';
LINE.mute = '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l4 6M21 9l-4 6"/>';
const line = (k, cls) => '<svg class="' + (cls || "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' + (LINE[k] || LINE.sparkle) + "</svg>";
const PLAY = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l12-7.5z"/></svg>';
const PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5h3v14H8zM13 5h3v14h-3z"/></svg>';
const list = (v) => (Array.isArray(v) ? v : typeof v === "string" && v ? [v] : []).filter((e) => typeof e === "string" && e && e.indexOf("rtsp:") !== 0);
const domain = (e) => e.split(".")[0];

function kelvinRgb(k) {
  const t = k / 100;
  let r, g, b;
  if (t <= 66) { r = 255; g = 99.47 * Math.log(t) - 161.12; b = t <= 19 ? 0 : 138.52 * Math.log(t - 10) - 305.04; }
  else { r = 329.7 * Math.pow(t - 60, -0.1332); g = 288.12 * Math.pow(t - 60, -0.0755); b = 255; }
  return [clamp(Math.round(r), 0, 255), clamp(Math.round(g), 0, 255), clamp(Math.round(b), 0, 255)];
}

let hlsLoading = null; // hls.js (comes with the integration), for live video where the browser can't play HLS itself
function loadHls() {
  if (window.Hls) return Promise.resolve(window.Hls);
  if (!hlsLoading) hlsLoading = new Promise((ok) => {
    const sc = document.createElement("script");
    sc.src = BASE + "/hls.light.min.js?v=" + VERSION;
    sc.onload = () => ok(window.Hls || null);
    sc.onerror = () => ok(null);
    document.head.appendChild(sc);
  });
  return hlsLoading;
}
let LIB = null; // built-in icons (AR NSPanel Pro), loaded once
let libLoading = null;
function loadLib() {
  if (LIB || libLoading) return libLoading;
  libLoading = fetch(BASE + "/icons.json?v=" + VERSION).then((r) => r.json()).then((j) => (LIB = j)).catch(() => (LIB = {}));
  return libLoading;
}
const libSrc = (n) => (LIB && LIB[n] ? "data:image/svg+xml;charset=utf-8," + encodeURIComponent(LIB[n].svg) : "");

const CSS = `
:host{display:block;--fg:#f1ede6;--muted:#a49d92;--line:rgba(255,255,255,.14);--glass:rgba(22,20,24,.58);--accrgb:243,211,154;--acc:rgb(var(--accrgb));--warm:255,196,128;font-family:Jost,"Jost",Roboto,system-ui,sans-serif;color:var(--fg)}
*{box-sizing:border-box}
svg{flex:none}
.app{position:relative;height:var(--dash-h,calc(100dvh - var(--header-height,56px)));min-height:480px;border-radius:var(--dash-r,var(--ha-card-border-radius,12px));overflow:hidden;background:#0b0b0e;display:flex;flex-direction:column;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent}
.bg{position:absolute;inset:0;background:#111 center/cover no-repeat;transition:opacity .4s}
.bg::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,8,12,.4),rgba(8,8,12,.1) 30%,rgba(8,8,12,.55) 70%,rgba(8,8,12,.9))}
.app.inner .bg{filter:blur(16px) brightness(.6);transform:scale(1.08)}
.pg{position:relative;flex:1;display:flex;flex-direction:column;min-height:0;margin:var(--dash-top,0px) 0 var(--dash-bot,0px)}
.top{display:flex;align-items:center;gap:8px;padding:14px 16px 0}
.ib{width:40px;height:40px;border-radius:50%;border:1px solid var(--line);background:var(--glass);display:grid;place-items:center;flex:none;cursor:pointer;color:var(--fg)}
.ib svg{width:19px;height:19px}
.room{font-size:20px;font-weight:400;display:flex;align-items:center;gap:6px;cursor:pointer;min-width:0;white-space:nowrap;overflow:hidden}
.room small{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);display:flex;align-items:center;gap:2px}
.room small svg,.room>svg{width:14px;height:14px}
.sp{flex:1}
.clock{padding:22px 24px 0}
.hero{display:flex;align-items:flex-start;gap:8px;padding-right:16px}.hero .clock{flex:none;max-width:54%}
.stat{flex:1;min-width:0;margin-top:20px;display:flex;justify-content:flex-end;pointer-events:none}
.stz{display:flex;flex-direction:column;align-items:flex-end;gap:7px;max-width:100%}
.sti{max-width:100%;box-sizing:border-box}.sti.sun{flex-wrap:wrap;justify-content:flex-end;row-gap:3px}
.strow{display:flex;gap:6px}
.sti{display:flex;align-items:center;gap:6px;font-size:13px;color:rgba(241,237,230,.85);background:rgba(16,14,18,.45);border:1px solid rgba(255,255,255,.1);border-radius:999px;padding:5px 10px;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.sti svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;opacity:.85}
.sti b{font-weight:500;font-size:14px}
.sti.sun{gap:10px}.sti.sun span{display:flex;align-items:center;gap:4px}.sti.sun svg{color:var(--acc);opacity:1}
.sti.mot span{max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.sti.mot{color:#fff;border-color:rgba(127,214,160,.5);animation:motIn .35s ease-out}.sti.mot i{width:8px;height:8px;border-radius:50%;background:#7fd6a0;box-shadow:0 0 10px #7fd6a0;animation:gblink 1.6s ease-in-out infinite}
@keyframes motIn{from{opacity:0;transform:translateX(12px)}}
.clock .t{font-size:64px;font-weight:300;line-height:1;letter-spacing:-.01em;font-variant-numeric:tabular-nums}
.clock .d{font-size:14px;color:rgba(241,237,230,.78);margin-top:8px}
.clock .d i{font-style:normal;color:var(--acc)}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px 6px;padding:30px 14px 0;margin-bottom:16px}
.btn{display:flex;flex-direction:column;align-items:center;gap:7px;cursor:pointer;min-width:0}
.ring{position:relative;width:72px;height:72px;border-radius:50%;border:1px solid rgba(255,255,255,.28);background:rgba(20,18,22,.42);display:grid;place-items:center;box-shadow:inset 0 1px 0 rgba(255,255,255,.18);transition:transform .12s}
.btn:active .ring{transform:scale(.94)}
.ring svg{width:28px;height:28px}
.ring img{width:60%;height:60%;object-fit:contain}
.btn.lit .ring{border-color:rgba(var(--accrgb),.85);background:rgba(var(--accrgb),.16);box-shadow:0 0 22px -6px rgba(var(--accrgb),.7),inset 0 1px 0 rgba(255,255,255,.2)}
.btn.lit .ring svg{color:var(--acc)}
.badge{position:absolute;top:-3px;right:-3px;min-width:21px;height:21px;padding:0 4px;border-radius:11px;background:var(--acc);color:#2a2116;font-size:12px;font-weight:500;display:grid;place-items:center;border:2px solid #1a1612;font-style:normal}
.btn span{font-size:13px;letter-spacing:.04em;color:rgba(241,237,230,.92);text-align:center}
.bare .ring{border-color:transparent;background:transparent;box-shadow:none}
.bare .ring svg{width:38px;height:38px}
.bare .ring img{width:86%;height:86%}
.bare .btn.lit .ring{background:transparent;border-color:transparent;box-shadow:none}
.bare .btn.lit .ring svg{filter:drop-shadow(0 0 8px rgba(var(--accrgb),.8))}
.bot{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 16px 18px;margin-top:auto}
.pill{height:42px;padding:0 16px;border-radius:21px;border:1px solid var(--line);background:var(--glass);display:flex;align-items:center;gap:8px;font-size:14px;cursor:pointer;color:var(--fg)}
.pill svg{width:18px;height:18px}
.scroll{flex:1;overflow-y:auto;padding:10px 16px 10px;display:flex;flex-direction:column;gap:10px;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.scroll::-webkit-scrollbar{display:none}
.chips{display:flex;gap:8px;padding:14px 16px 2px;overflow-x:auto;scrollbar-width:none;flex:none}
.chips::-webkit-scrollbar{display:none}
.chip{height:36px;padding:0 14px;border-radius:18px;border:1px solid var(--line);background:var(--glass);display:flex;align-items:center;gap:8px;font-size:13px;white-space:nowrap;cursor:pointer;flex:none;color:var(--fg)}
.chip.dot{padding-left:7px}
.chip.dot i{width:22px;height:22px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#fff,#ffe2b4 55%,#c89350)}
.chip.dot.off i{background:radial-gradient(circle at 40% 35%,#9a9aa2,#4b4b52)}
.chip.dot.sc i{background:radial-gradient(circle at 40% 35%,#ffd8a8,#b4562e)}
.chip.on{background:rgba(var(--accrgb),.92);color:#2a2116;border-color:transparent}
.lt{position:relative;height:78px;border-radius:22px;border:1px solid rgba(255,255,255,.12);background:rgba(16,14,18,.62);overflow:hidden;display:flex;align-items:center;gap:12px;padding:0 16px 0 10px;cursor:ew-resize;touch-action:pan-y;flex:none}
.lt .fill{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,rgba(var(--lc),.10),rgba(var(--lc),.34));border-right:2px solid rgba(var(--lc),.9);transition:width .15s linear}
.lt.drag .fill{transition:none}
.lt.off .fill{opacity:0}
.lt canvas{width:52px;height:52px;flex:none;position:relative}
.nm{position:relative;flex:1;min-width:0}
.nm b{display:block;font-weight:400;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.nm small{font-size:11.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.pc{position:relative;font-size:24px;font-weight:300;font-variant-numeric:tabular-nums;min-width:56px;text-align:right}
.off .pc{color:var(--muted);font-size:18px}
.lgh{display:flex;align-items:center;justify-content:space-between;padding:8px 6px 0;flex:none}.lgh b{display:block;font-size:17px;font-weight:600}.lgh small{color:var(--muted);font-size:12px}.lgh+.lt{margin-top:-2px}
.lt.rn{cursor:default;padding:0 14px}.lt.rn .nm{flex:1;min-width:0}.lt.rn input{width:100%;box-sizing:border-box;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);border-radius:12px;color:inherit;font:inherit;font-size:16px;padding:8px 10px;margin-bottom:3px}.lt.rn small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sw{position:relative;width:46px;height:28px;border-radius:14px;background:rgba(255,255,255,.14);flex:none;cursor:pointer}
.sw::after{content:"";position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#bbb;transition:transform .15s}
.sw.on{background:rgba(var(--accrgb),.9)}
.sw.on::after{transform:translateX(18px);background:#fff}
.card{border-radius:22px;border:1px solid rgba(255,255,255,.12);background:rgba(16,14,18,.62);padding:14px;display:flex;flex-direction:column;gap:12px;flex:none}
.row{display:flex;align-items:center;gap:12px}
.gd{gap:14px}.gdh{display:flex;align-items:flex-start;justify-content:space-between}.gdh b{display:block;font-size:18px;font-weight:500}.gdh small{color:var(--muted);font-size:13px}
.gdot{width:10px;height:10px;border-radius:50%;background:#7fd6a0;box-shadow:0 0 10px #7fd6a0;margin-top:6px}
.gd.open .gdot,.gd.opening .gdot,.gd.closing .gdot{background:var(--acc);box-shadow:0 0 12px var(--acc)}.gd.na .gdot{background:#ff8a7a;box-shadow:none}.gd.relay .gdot{display:none}
.gd.opening .gdot,.gd.closing .gdot{animation:gblink 1s ease-in-out infinite}@keyframes gblink{50%{opacity:.3}}
.gdoor{position:relative;aspect-ratio:2/1;border-radius:14px 14px 6px 6px;overflow:hidden;cursor:pointer;border:6px solid rgba(255,255,255,.1);border-bottom-width:0;background:linear-gradient(180deg,rgba(255,196,128,.18),rgba(20,18,22,.9) 70%);box-shadow:inset 0 0 0 1px rgba(0,0,0,.5)}
.gin{position:absolute;inset:0;display:flex;align-items:flex-end;justify-content:center;padding:0 14% 6%}.gin svg{width:100%;fill:rgba(255,255,255,.08)}
.gd.open .gdoor,.gd.opening .gdoor{background:linear-gradient(180deg,rgba(255,206,140,.42),rgba(40,30,24,.9) 75%)}
.gpan{position:absolute;inset:0;background:repeating-linear-gradient(180deg,#c9c3ba 0 calc(25% - 3px),#8f8a82 calc(25% - 3px) 25%);box-shadow:0 4px 10px rgba(0,0,0,.5);transition:transform 1.4s cubic-bezier(.4,0,.2,1)}
.gpan::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.18),transparent 20%,transparent 80%,rgba(0,0,0,.18))}
.gd.relay .gpan{transform:none}
.gbt{display:flex;gap:8px;justify-content:center}.gbt .pill{flex:1;justify-content:center;height:46px;font-size:15px}
.gmain{background:rgba(var(--accrgb),.92) !important;color:#2a2116;border-color:transparent !important}
.u3d{position:relative;flex:1;min-height:0;overflow:hidden;touch-action:pan-y;-webkit-user-select:none;user-select:none}
.u3w{position:absolute;top:0;bottom:0;left:50%;width:min(100%,520px,calc((100dvh - 250px)*1.05));transform:translateX(-50%);perspective:900px}
.u3h{position:absolute;left:4%;top:42%;width:92%;aspect-ratio:1;margin-top:-46%;border-radius:50%;pointer-events:none;opacity:.004;transition:opacity .35s ease;will-change:opacity}
.u3i{position:absolute;left:27%;top:42%;width:46%;aspect-ratio:1;margin-top:-23%;cursor:pointer;will-change:transform,opacity;-webkit-tap-highlight-color:transparent}
.u3i img,.u3i svg{display:block;width:100%;height:100%;object-fit:contain;pointer-events:none;filter:drop-shadow(0 14px 18px rgba(0,0,0,.45))}
.u3i svg{fill:none;stroke:currentColor;stroke-width:1.4;stroke-linecap:round;stroke-linejoin:round}
.u3l{position:absolute;left:0;right:0;top:42%;margin-top:27%;display:flex;flex-direction:column;align-items:center;text-align:center;pointer-events:none;opacity:.004;transition:opacity .35s ease}
.u3l b{font-size:30px;font-weight:500;letter-spacing:.01em;line-height:1.15}
.u3l span{margin-top:4px;font-size:15px;color:var(--muted)}
.u3d.drag .u3l,.u3d.drag .u3h{opacity:.004!important;transition:opacity .15s ease}
.u3dots{position:absolute;left:0;right:0;bottom:16px;display:flex;justify-content:center;align-items:center;gap:10px}
.u3dots i{width:7px;height:7px;border-radius:4px;background:rgba(255,255,255,.3)}
.u3dots i.cur{width:22px;background:rgba(var(--accrgb),.95)}
.u3hd{display:flex;align-items:center;gap:12px;margin:12px 16px 0;padding:8px 16px 8px 8px;border-radius:22px;border:1px solid rgba(255,255,255,.12);background:rgba(16,14,18,.62);cursor:pointer;flex:none}
.u3hd .bk{width:40px;height:40px;border-radius:20px;border:1px solid rgba(255,255,255,.22);display:flex;align-items:center;justify-content:center;flex:none}
.u3hd .bk svg{width:20px;height:20px}
.u3hd .ic{width:48px;height:48px;flex:none}
.u3hd .ic img,.u3hd .ic svg{width:100%;height:100%;object-fit:contain}
.u3hd b{display:block;font-size:19px;font-weight:500}
.u3hd small{display:block;font-size:13px;color:var(--muted)}
.ulist{gap:0;padding:4px 14px}.urow{min-height:58px;border-top:1px solid rgba(255,255,255,.08)}.urow:first-child{border-top:0}
.row>svg{width:22px;height:22px;color:var(--muted)}
.hint{font-size:12px;color:var(--muted);text-align:center;padding:2px 16px 6px;overflow-wrap:anywhere}
.empty{color:var(--muted);text-align:center;padding:40px 20px;font-size:15px}
.tabs{display:flex;gap:8px;padding:12px 16px 0;overflow-x:auto;scrollbar-width:none;flex:none}
.tabs::-webkit-scrollbar{display:none}
/* comfort */
.dialw{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:6px 16px;overflow-y:auto}
.dial{position:relative;width:min(260px,72vw);aspect-ratio:1}
.dial svg{width:100%;height:100%}
.dial .c{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.dial .c small{font-size:12px;letter-spacing:.18em;text-transform:uppercase}
.dial .c b{font-size:68px;font-weight:300;line-height:1;font-variant-numeric:tabular-nums}
.dial .c b sup{font-size:26px;vertical-align:top;position:relative;top:8px}
.dial .c>span{font-size:13px;color:var(--muted)}
.pm{display:flex;gap:24px}
.pm .ib{width:56px;height:56px}
.pm .ib svg{width:24px;height:24px}
.wrapc{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;align-items:center}
.lbl{font-size:11.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted)}
/* shades / media */
.slider{position:relative;height:30px;flex:1;cursor:pointer;touch-action:pan-y}
.slider::before{content:"";position:absolute;left:0;right:0;top:13px;height:4px;border-radius:2px;background:rgba(255,255,255,.16)}
.slider i{position:absolute;left:0;top:13px;height:4px;border-radius:2px;background:var(--acc)}
.slider b{position:absolute;top:4px;width:22px;height:22px;margin-left:-11px;border-radius:50%;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.5)}
.art{width:64px;height:64px;border-radius:14px;background:#222 center/cover;flex:none;display:grid;place-items:center;color:var(--muted)}
.art svg{width:26px;height:26px}
.ctrls{display:flex;justify-content:center;gap:18px}
.ctrls .ib{width:48px;height:48px}
.ctrls .ib.big{width:58px;height:58px;background:rgba(var(--accrgb),.9);color:#2a2116;border-color:transparent}
.ctrls .ib svg{width:22px;height:22px}
/* scenes */
.sgrid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
.scn{height:92px;border-radius:20px;border:1px solid rgba(255,255,255,.12);background:rgba(16,14,18,.62);display:flex;flex-direction:column;justify-content:space-between;padding:14px;cursor:pointer;transition:background .2s}
.scn svg{width:24px;height:24px;color:var(--acc)}
.scn span{font-size:15px}
.scn.hit{background:rgba(var(--accrgb),.3)}
/* security */
.alarm{width:min(220px,60vw);aspect-ratio:1;border-radius:50%;border:2px solid var(--line);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;margin:6px auto;background:rgba(16,14,18,.5)}
.alarm svg{width:48px;height:48px}
.alarm b{font-weight:400;font-size:22px}
.alarm.armed{border-color:#7fd6a0;color:#7fd6a0}
.alarm.trig{border-color:#ff7a6b;color:#ff7a6b}
.keys{display:grid;grid-template-columns:repeat(3,64px);gap:12px;justify-content:center}
.keys svg{width:26px;height:26px}
.keys div{height:64px;border-radius:50%;border:1px solid var(--line);background:var(--glass);display:grid;place-items:center;font-size:24px;font-weight:300;cursor:pointer}
.code{display:flex;justify-content:center;gap:10px;height:16px}
.code i{width:12px;height:12px;border-radius:50%;border:1px solid var(--fg)}
.code i.f{background:var(--fg)}
/* cameras */
.cams{display:grid;grid-template-columns:1fr;gap:10px}
.cam{position:relative;border-radius:18px;overflow:hidden;background:#111;aspect-ratio:16/9;cursor:pointer}
.cam img{width:100%;height:100%;object-fit:cover;display:block}
.cam span{position:absolute;z-index:1;left:10px;bottom:8px;font-size:13px;background:rgba(0,0,0,.55);padding:3px 9px;border-radius:10px}
.view{position:absolute;inset:0;z-index:6;background:#000;display:flex;flex-direction:column;touch-action:pan-y}
.view video,.view .still{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#000}
.view video{opacity:0;transition:opacity .3s}.view video.on{opacity:1}
.view.inr video,.view.inr .still{animation:camR .28s ease-out}.view.inl video,.view.inl .still{animation:camL .28s ease-out}
@keyframes camR{from{transform:translateX(30%);opacity:0}}@keyframes camL{from{transform:translateX(-30%);opacity:0}}
.vnav{position:absolute;top:50%;width:44px;height:44px;margin-top:-22px;border-radius:50%;display:grid;place-items:center;background:rgba(0,0,0,.35);cursor:pointer}.vnav.l{left:8px}.vnav.r{right:8px}.vnav svg{width:22px;height:22px}
.vdots{position:absolute;left:0;right:0;bottom:16px;display:flex;justify-content:center;gap:7px}.vdots i{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.35)}.vdots i.on{background:#fff}
.vcount{color:var(--muted);font-size:13px;padding-right:14px}
.cam video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .3s}.cam.on video{opacity:1}
.clive{position:absolute;right:10px;top:8px;font-style:normal;font-size:10.5px;letter-spacing:.08em;background:rgba(214,48,49,.85);padding:2px 7px;border-radius:8px;opacity:0}.cam.on .clive{opacity:1}
.vmsg{position:absolute;left:0;right:0;bottom:24px;text-align:center;font-size:13px;color:var(--muted);padding:0 20px}
.view .top{position:absolute;top:0;left:0;right:0}
/* sheets */
.sheet{position:absolute;left:0;right:0;bottom:0;top:64px;z-index:5;background:rgba(16,15,19,.98);border-radius:26px 26px 0 0;border-top:1px solid var(--line);display:flex;flex-direction:column}
.sheet.in{animation:up .22s ease-out}
@keyframes up{from{transform:translateY(30px);opacity:0}}
.shh{display:flex;align-items:center;justify-content:space-between;padding:16px 16px 6px}
.shh b{font-weight:400;font-size:21px}
.shb{flex:1;overflow-y:auto;padding:0 12px 22px;scrollbar-width:none}
.shb::-webkit-scrollbar{display:none}
.rm{display:flex;align-items:center;gap:12px;padding:14px;border-radius:16px;border:1px solid rgba(255,255,255,.1);margin-top:8px;cursor:pointer}
.rm.on{border-color:var(--acc);background:rgba(var(--accrgb),.1)}
.rm b{flex:1;font-weight:400;font-size:16px}
.rm small{color:var(--muted);font-size:13px}
.it{border:1px solid rgba(255,255,255,.1);border-radius:18px;margin-top:8px;overflow:hidden}
.it.open{border-color:rgba(var(--accrgb),.6)}
.ih{display:flex;align-items:center;gap:12px;padding:8px 12px;cursor:pointer}
.ih .now{width:42px;height:42px;border-radius:50%;border:1px solid var(--line);display:grid;place-items:center;flex:none}
.ih .now svg{width:20px;height:20px}.ih .now img{width:28px;height:28px;object-fit:contain}
.ih b{font-weight:400;font-size:15px;flex:1}
.ih small{font-size:12px;color:var(--muted)}
.cats{display:flex;gap:6px;overflow-x:auto;padding:2px 12px 6px;scrollbar-width:none}
.cats::-webkit-scrollbar{display:none}
.cats .chip{height:32px;padding:0 12px;font-size:12.5px}
.ig{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:4px 10px 12px}
.gh{grid-column:1/-1;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);margin-top:4px}
.tile{border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:6px 2px;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;min-width:0}
.tile.on{border-color:var(--acc);background:rgba(var(--accrgb),.1)}
.tile i{width:36px;height:36px;display:grid;place-items:center}
.tile i svg{width:22px;height:22px}.tile i img{width:36px;height:36px;object-fit:contain}
.tile span{font-size:10.5px;color:rgba(241,237,230,.82);text-align:center;line-height:1.1;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bgs{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:4px 4px 12px}
.bgt{cursor:pointer;text-align:center;min-width:0}
.bgt i{display:block;aspect-ratio:16/10;border-radius:10px;background:#222 center/cover;border:2px solid transparent}
.bgt.on i{border-color:var(--acc)}
.bgt small{display:block;font-size:11px;color:var(--muted);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.setrow{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 4px}
.seg{display:flex;padding:3px;border-radius:19px;background:rgba(255,255,255,.08);align-self:center;flex:none}
.seg div{height:32px;padding:0 16px;border-radius:16px;display:flex;align-items:center;font-size:13px;cursor:pointer;color:var(--muted)}
.seg div.on{background:var(--fg);color:#17161a}
.np{display:flex;gap:14px;align-items:center}
.np .art{width:84px;height:84px;border-radius:16px;box-shadow:0 8px 24px -8px #000}
.npt{min-width:0;flex:1}
.npt b{display:block;font-weight:400;font-size:18px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.npt small{display:block;font-size:13px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ctrls .ib.big{background:var(--fg);color:#17161a}
.vpc{font-size:13px;min-width:38px;text-align:right;font-variant-numeric:tabular-nums}
.spk{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;flex:none}
.spk::-webkit-scrollbar{display:none}
.sk{position:relative;flex:none;width:122px;padding:10px 10px 9px;border-radius:16px;border:1px solid rgba(255,255,255,.12);background:rgba(16,14,18,.62);cursor:pointer}
.sk svg{width:20px;height:20px;color:var(--muted)}
.sk b{display:block;font-weight:400;font-size:13.5px;margin-top:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sk small{display:block;font-size:11px;color:var(--muted)}
.sk.on{border-color:var(--acc);background:rgba(var(--accrgb),.12)}
.sk.on svg{color:var(--acc)}
.sk.grp{border-color:rgba(var(--accrgb),.5)}
.jn{position:absolute;top:7px;right:7px;width:26px;height:26px;border-radius:50%;border:1px solid var(--line);display:grid;place-items:center;font-size:15px;line-height:1;color:var(--fg);background:rgba(0,0,0,.25)}
.sk.grp .jn{background:var(--acc);color:#2a2116;border-color:transparent}
.lib{gap:2px}
.li{display:flex;align-items:center;gap:12px;padding:7px 4px;border-radius:12px;cursor:pointer}
.li:active{background:rgba(255,255,255,.06)}
.li .a{width:46px;height:46px;border-radius:10px;flex:none;background:rgba(255,255,255,.07) center/cover;display:grid;place-items:center;color:var(--muted)}
.li .a svg{width:20px;height:20px}
.li.round .a{border-radius:50%}
.li>div:not(.a){min-width:0;flex:1}
.li b{display:block;font-weight:400;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.li small{font-size:12px;color:var(--muted)}
.li>svg{width:18px;height:18px;color:var(--muted)}
.li.now b{color:var(--acc)}
.chip svg[viewBox]{width:14px;height:14px}
.ask{font-size:22px;font-weight:300;text-align:center;padding:10px 0 4px;text-wrap:balance}
.srcs{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
.srcs:has(> .src:only-child){grid-template-columns:minmax(0,190px);justify-content:center}
.src{position:relative;border-radius:20px;padding:12px 6px 8px;display:flex;flex-direction:column;align-items:center;gap:8px;cursor:pointer;min-width:0}
.src .lg{height:72px}.src.bare .lg{height:88px}
.src span{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-shadow:0 1px 6px rgba(0,0,0,.6)}
.src:active{transform:scale(.97)}
.src span{font-size:14px;text-align:center}
.src.last .lg{filter:drop-shadow(0 0 14px rgba(var(--accrgb),.45))}
.src.last::after{content:"Last watched";position:absolute;top:-6px;left:50%;transform:translateX(-50%);font-size:10px;letter-spacing:.1em;text-transform:uppercase;background:var(--acc);color:#2a2116;padding:2px 8px;border-radius:9px;white-space:nowrap}
.lg{width:100%;height:70px;border-radius:14px;display:flex;align-items:center;justify-content:center;color:var(--muted);overflow:hidden}
.lg img{width:100%;height:100%;min-width:0;min-height:0;object-fit:contain;filter:drop-shadow(0 2px 8px rgba(0,0,0,.45))}
.lgs{display:grid;place-items:center}
.lg svg{width:34px;height:34px}
.lg.big{width:150px;height:84px;flex:none}
.start{display:flex;flex-direction:column;align-items:center;gap:16px;padding-top:8px}
.chk{width:100%;display:flex;flex-direction:column;gap:8px}
.chk h3{font-weight:400;font-size:18px;margin:0 0 4px;text-align:center}
.st{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:14px;background:rgba(16,14,18,.62);border:1px solid rgba(255,255,255,.1);font-size:14.5px}
.st i{width:24px;height:24px;border-radius:50%;border:1.5px solid rgba(255,255,255,.3);display:grid;place-items:center;font-style:normal;font-size:13px;flex:none}
.st small{margin-left:auto;font-size:12px;color:var(--muted)}
.st.wait{opacity:.45}
.st.go i{border-color:var(--acc);border-top-color:transparent;animation:spin .8s linear infinite}
.st.done i,.st.skip i{background:#7fd6a0;border-color:#7fd6a0;color:#10301c}
.st.fail i{background:#ff8a7a;border-color:#ff8a7a;color:#3a0f0a}
@keyframes spin{to{transform:rotate(360deg)}}
.nowc{display:flex;align-items:center;gap:12px}
.nowc .lg{width:64px;height:46px;flex:none}
.nowc>div:not(.lg){flex:1;min-width:0}
.nowc b{display:block;font-weight:400;font-size:17px}
.nowc small{font-size:12.5px;color:var(--muted)}
.two{display:flex;gap:8px}
.two .chip{flex:1;justify-content:center}
.dpad{position:relative;width:212px;height:212px;margin:4px auto 0;border-radius:50%;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);touch-action:none}
.dk{position:absolute;width:62px;height:62px;display:grid;place-items:center;cursor:pointer;border-radius:50%;color:rgba(255,255,255,.88)}
.dk.down,.dk:active{background:rgba(255,255,255,.12)}
.dk svg{width:26px;height:26px}
.dk.u{top:4px;left:75px}.dk.d{bottom:4px;left:75px}.dk.l{left:4px;top:75px}.dk.r{right:4px;top:75px}
.okk{position:absolute;left:56px;top:56px;width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18);display:grid;place-items:center;font-size:17px;letter-spacing:.08em;cursor:pointer}
.okk:active{background:rgba(var(--accrgb),.35)}
.keys{display:flex;justify-content:space-between;padding:0 4px}
.keys .ib{width:46px;height:46px}
.keys .ib.big{background:var(--fg);color:#17161a;border-color:transparent}
.wvol{display:flex;align-items:center;gap:10px}
.wvol .ib{width:52px;height:52px}
.wvol .ib.down{background:rgba(255,255,255,.14)}
.wvol .ib svg{width:22px;height:22px}
.wvol .n{flex:1;text-align:center;font-size:13px;color:var(--muted);min-width:0}
.wvol .n b{display:block;font-weight:400;font-size:15px;color:var(--fg);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.inp{width:100%;height:42px;border-radius:12px;border:1px solid var(--line);background:rgba(255,255,255,.06);color:var(--fg);font:inherit;font-size:16px;padding:0 12px;outline:none}
.inp:focus{border-color:var(--acc)}
.sbody{padding:4px 12px 14px;display:flex;flex-direction:column;gap:8px}
.stp{display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:8px;border:1px solid rgba(255,255,255,.1);border-radius:14px}
.stp .inp{height:38px;font-size:14px;flex:1;min-width:120px}
.stp .sel,.sel{flex:0 0 auto;width:auto;min-width:0;padding:0 8px;height:38px;font-size:14px}
.ib.sm{width:32px;height:32px}
.ib.sm svg{width:15px;height:15px}
.lgs img{width:28px;height:28px;object-fit:contain}
.rtr{display:flex;flex-direction:column;gap:6px;padding:8px;border:1px solid rgba(255,255,255,.1);border-radius:14px}
.rtr .chip{align-self:flex-end}
.chip svg{width:14px;height:14px}
.lup{border-radius:18px;height:200px;display:grid;place-items:center;padding:18px;background:linear-gradient(160deg,rgba(40,36,44,.9),rgba(12,11,14,.95)),repeating-conic-gradient(rgba(255,255,255,.04) 0 25%,transparent 0 50%) 0 0/16px 16px}
.lup img{width:100%;height:100%;object-fit:contain;min-height:0}
.tile{position:relative}.tile.up{border-style:dashed}.tile .tdel{position:absolute;top:-5px;right:-5px;width:20px;height:20px;border-radius:50%;background:#3a3438;display:grid;place-items:center}.tile .tdel svg{width:11px;height:11px}
.rng{width:100%;accent-color:var(--acc)}
.bgt{position:relative}.bgt.up i{display:grid;place-items:center;border:1.5px dashed rgba(255,255,255,.3);background:rgba(255,255,255,.04)}.bgt.up i svg{width:22px;height:22px}.bgt .tdel{position:absolute;top:-5px;right:-5px;width:20px;height:20px;border-radius:50%;background:#3a3438;display:grid;place-items:center}.bgt .tdel svg{width:11px;height:11px}
.hsc{padding:0 16px 4px;margin-top:auto}.hsc+.bot{margin-top:0}
.ib.hid{background:none;border-color:transparent;box-shadow:none;backdrop-filter:none;-webkit-backdrop-filter:none;-webkit-tap-highlight-color:transparent}
.ib.gear{animation:gearIn .35s ease-out}@keyframes gearIn{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:none}}
.ppl{display:flex;gap:14px;padding:14px 20px 2px;overflow-x:auto;scrollbar-width:none;flex:none}
.pp{display:flex;flex-direction:column;align-items:center;gap:3px;min-width:48px;opacity:.5;filter:grayscale(1);transition:opacity .4s,filter .4s}
.pp.home{opacity:1;filter:none}
.pp .av{position:relative;width:40px;height:40px;border-radius:50%;border:1.5px solid rgba(255,255,255,.28);background:rgba(16,14,18,.55);display:grid;place-items:center}
.pp.home .av{border-color:rgba(127,214,160,.9);box-shadow:0 0 14px rgba(127,214,160,.25)}
.pp .av img{width:100%;height:100%;border-radius:50%;object-fit:cover}.pp .av span{font-size:16px}
.pp .av i{position:absolute;right:-1px;bottom:-1px;width:11px;height:11px;border-radius:50%;background:#77736d;border:2px solid #15131a}
.pp.home .av i{background:#7fd6a0}
.pp b{font-size:12px;font-weight:500;max-width:64px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.pp small{font-size:10.5px;color:var(--muted);margin-top:-3px;max-width:64px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.solar .sh{display:flex;align-items:baseline;justify-content:space-between;padding:2px 4px 0}.solar .sh b{font-weight:500;font-size:17px}.solar .sh small{color:var(--muted);font-size:12.5px}
.sbox{position:relative;width:100%;aspect-ratio:6/5;margin-top:-4px}
.sflow{position:absolute;inset:0;width:100%;height:100%}
.sflow .fl{stroke:rgba(255,255,255,.12);stroke-width:2;fill:none}
.sflow .fd{stroke-width:3;stroke-linecap:round;stroke-dasharray:0.1 16;animation:fdot linear infinite;filter:drop-shadow(0 0 4px currentColor)}
.sflow .fd.rev{animation-direction:reverse}
@keyframes fdot{to{stroke-dashoffset:-16.1}}
.sflow .hub{fill:rgba(16,14,18,.9);stroke:rgba(var(--accrgb),.8);stroke-width:2}
.sn{position:absolute;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:2px;text-align:center}
.sn .si{width:52px;height:52px;border-radius:50%;display:grid;place-items:center;background:rgba(16,14,18,.78);border:1.5px solid var(--c);box-shadow:0 0 18px -4px var(--c);margin-bottom:3px}
.sn svg{width:26px;height:26px;fill:none;stroke:var(--c);stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}.sn svg .bf{fill:var(--c);stroke:none}
.sn b{font-size:15px;font-weight:500}.sn small{font-size:11px;color:var(--muted);white-space:nowrap}
.sn.pv{--c:#f2b84b}.sn.gr{--c:#5fd3a0}.sn.hm{--c:#c9b6ff}.sn.bt{--c:#6cc7f0}
.stot{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
.stot div{border-radius:14px;background:rgba(255,255,255,.05);padding:8px 4px;text-align:center;border-top:2px solid var(--c)}
.stot div.pv{--c:#f2b84b}.stot div.gr{--c:#5fd3a0}.stot div.hm{--c:#c9b6ff}
.stot b{display:block;font-size:15px;font-weight:500}.stot b i{font-style:normal;font-size:10px;color:var(--muted);margin-left:2px}.stot small{font-size:11px;color:var(--muted)}
.efc-host{margin:0 -6px}
.srow{display:flex;align-items:center;justify-content:space-between;gap:8px}.srow small{color:var(--muted);font-size:12.5px}
.lblr{display:flex;align-items:center;justify-content:space-between;padding-right:4px}.lnk{display:inline-flex;align-items:center;gap:5px;font-size:13px;color:var(--acc);cursor:pointer}.lnk svg{width:14px;height:14px}
.spr{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:16px;background:rgba(16,14,18,.55);border:1px solid rgba(255,255,255,.1);margin-bottom:6px}.spr.on{border-color:rgba(var(--accrgb),.7)}.spr>svg{width:20px;height:20px;flex:none;opacity:.8}
.spr .nm{flex:1;min-width:0}.spr input{width:100%;box-sizing:border-box;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);border-radius:10px;color:inherit;font:inherit;font-size:16px;padding:7px 9px}.spr small{display:block;color:var(--muted);font-size:11.5px;margin-top:2px}.spr .chip{flex:none}
.pick{position:absolute;inset:0;z-index:7;background:rgb(16,15,19);border-radius:26px 26px 0 0;display:flex;flex-direction:column}
.msg{position:absolute;left:50%;bottom:calc(76px + var(--dash-bot,0px));transform:translateX(-50%);background:rgba(20,20,24,.95);border:1px solid var(--line);padding:9px 16px;border-radius:18px;font-size:14px;z-index:9;white-space:nowrap;pointer-events:none}
`;

// ---- logo cut-out (as in AR Lighting Scenes): takes a plain background off an
// uploaded logo. The background colour is read from the picture's edge; only
// background joined to the edge goes (a white mark inside the logo stays), edges
// get soft alpha with the background un-mixed (no halo on the dark dash), then
// the logo is trimmed to its own shape.
function logoCutout(src, opt) {
  const W = src.width, H = src.height;
  const g0 = src.getContext("2d", { willReadFrequently: true });
  const im = g0.getImageData(0, 0, W, H);
  const d = im.data, n = W * H;
  // edge pixels: already transparent? plain background?
  const edge = [];
  for (let x = 0; x < W; x++) edge.push(x, (H - 1) * W + x);
  for (let y = 1; y < H - 1; y++) edge.push(y * W, y * W + W - 1);
  let clear = 0;
  for (const i of edge) if (d[i * 4 + 3] < 200) clear++;
  const hasAlpha = opt.info ? opt.info.hasAlpha : clear > edge.length * 0.3;
  const ch = [[], [], []];
  for (const i of edge) if (d[i * 4 + 3] >= 200) for (let c = 0; c < 3; c++) ch[c].push(d[i * 4 + c]);
  const med = (a) => { if (!a.length) return 255; a.sort((x, y) => x - y); return a[a.length >> 1]; };
  const bg = opt.info ? opt.info.bg : [med(ch[0]), med(ch[1]), med(ch[2])];
  const dist = (i) => { const r = d[i * 4] - bg[0], gg = d[i * 4 + 1] - bg[1], b = d[i * 4 + 2] - bg[2]; return Math.sqrt(r * r + gg * gg + b * b); };
  let near = 0, opq = 0;
  for (const i of edge) if (d[i * 4 + 3] >= 200) { opq++; if (dist(i) < 40) near++; }
  const plain = opq > 0 && near / opq > 0.6;
  const info = opt.info ? Object.assign({}, opt.info) : { hasAlpha, plain, bg };
  const A = new Float32Array(n); // 0..1 alpha from the colour
  for (let i = 0; i < n; i++) A[i] = d[i * 4 + 3] / 255;
  if (opt.remove && !hasAlpha) {
    const hi = opt.tol, lo = opt.tol * 0.45;
    const D = new Float32Array(n);
    for (let i = 0; i < n; i++) D[i] = d[i * 4 + 3] < 128 ? 0 : dist(i); // empty room around a zoomed-out picture is background
    const inBg = new Uint8Array(n);
    if (opt.holes) {
      for (let i = 0; i < n; i++) if (D[i] < hi) inBg[i] = 1;
    } else {
      const q = new Int32Array(n);
      let qh = 0, qt = 0;
      for (const i of edge) if (!inBg[i] && D[i] < hi) { inBg[i] = 1; q[qt++] = i; }
      while (qh < qt) {
        const i = q[qh++], x = i % W, y = (i / W) | 0;
        // spread only through clear background: soft edge pixels are taken but
        // don't carry on, so a thin outline can't leak into the icon
        if (D[i] >= lo) continue;
        const nb = [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1];
        for (const j of nb) if (j >= 0 && !inBg[j] && D[j] < hi) { inBg[j] = 1; q[qt++] = j; }
      }
    }
    // the cut edge: background pixels that aren't clear, and icon pixels up to
    // 2 px from the background (the blend between icon and background)
    const near = inBg.slice();
    for (let k = 0; k < 2; k++) {
      const nx = near.slice();
      for (let i = 0; i < n; i++) {
        if (near[i]) continue;
        const x = i % W, y = (i / W) | 0;
        if ((x > 0 && near[i - 1]) || (x < W - 1 && near[i + 1]) || (y > 0 && near[i - W]) || (y < H - 1 && near[i + W])) nx[i] = 1;
      }
      near.set(nx);
    }
    const floor = lo * 0.5; // JPEG noise in the background
    for (let i = 0; i < n; i++) {
      if (inBg[i] && D[i] < lo) { A[i] = 0; continue; }
      if (!near[i]) continue;
      // how far this pixel is from the background, against the icon colour next to it
      const x = i % W, y = (i / W) | 0;
      let fg = 0;
      for (let dy = -3; dy <= 3; dy++) {
        const yy = y + dy; if (yy < 0 || yy >= H) continue;
        for (let dx = -3; dx <= 3; dx++) {
          const xx = x + dx; if (xx < 0 || xx >= W) continue;
          const j = yy * W + xx;
          if (!inBg[j] && D[j] > fg) fg = D[j];
        }
      }
      if (fg <= hi) fg = Math.max(fg, D[i]); // no solid icon colour close by
      if (fg <= floor) continue;
      const a = Math.max(0, Math.min(1, (D[i] - floor) / (fg - floor)));
      A[i] = Math.min(A[i], a);
      if (a > 0 && a < 1) {
        // un-mix the background from the edge colour (no white fringe)
        for (let c = 0; c < 3; c++) d[i * 4 + c] = Math.max(0, Math.min(255, Math.round((d[i * 4 + c] - (1 - a) * bg[c]) / a)));
      }
    }
    // smooth the cut edge a touch (1-2-1), never adding alpha the colour didn't have
    const B = new Float32Array(n);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        let s = 0, w = 0;
        for (let dy = -1; dy <= 1; dy++) {
          const yy = y + dy; if (yy < 0 || yy >= H) continue;
          for (let dx = -1; dx <= 1; dx++) {
            const xx = x + dx; if (xx < 0 || xx >= W) continue;
            const k = (dx ? 1 : 2) * (dy ? 1 : 2); s += A[yy * W + xx] * k; w += k;
          }
        }
        B[y * W + x] = Math.min(A[y * W + x], (A[y * W + x] + s / w) / 2);
      }
    for (let i = 0; i < n; i++) A[i] = B[i];
  }
  let lum = 0, cnt = 0;
  for (let i = 0; i < n; i++) {
    d[i * 4 + 3] = Math.round(A[i] * 255);
    if (A[i] > 0.9) { lum += 0.2126 * d[i * 4] + 0.7152 * d[i * 4 + 1] + 0.0722 * d[i * 4 + 2]; cnt++; }
    if (opt.white && A[i] > 0) { d[i * 4] = 255; d[i * 4 + 1] = 255; d[i * 4 + 2] = 255; }
  }
  info.dark = cnt > 0 && lum / cnt < 80; // hard to see on the dark panel
  const tmp = document.createElement("canvas");
  tmp.width = W; tmp.height = H;
  tmp.getContext("2d").putImageData(im, 0, 0);
  // trim to the icon and centre it with a little room around
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 10) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const out = document.createElement("canvas");
  if (x1 < 0) { out.width = out.height = 8; info.empty = true; return { canvas: out, info }; }
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1, sc = Math.min(1, opt.size / Math.max(bw, bh)), pad = Math.round(Math.max(bw, bh) * sc * 0.03);
  out.width = Math.round(bw * sc) + pad * 2; out.height = Math.round(bh * sc) + pad * 2;
  const g = out.getContext("2d");
  g.imageSmoothingQuality = "high";
  g.drawImage(tmp, x0, y0, bw, bh, pad, pad, bw * sc, bh * sc);
  return { canvas: out, info };
}

class Ar4cDash extends HTMLElement {
  static getStubConfig() { return {}; }
  setConfig(c) { this._cfg = Object.assign({}, c || {}); if (this._ready) this._load(); if (this.isConnected) this._fullScreen(); }
  // full_screen: on its own dashboard the dash fills the phone and Home Assistant's
  // title bar is hidden (shown again while the dashboard is being edited)
  // full screen on a phone: the top bar goes below the status bar (where taps don't
  // reach) and Room Off above the gesture bar
  _safe() {
    this.style.setProperty("--dash-top", "max(var(--safe-area-inset-top, 0px), env(safe-area-inset-top, 0px), 26px)");
    this.style.setProperty("--dash-bot", "max(var(--safe-area-inset-bottom, 0px), env(safe-area-inset-bottom, 0px))");
  }
  _fullScreen(off) {
    const fs = !off && this._cfg && this._cfg.full_screen;
    if (fs) { this.style.setProperty("--dash-h", "100dvh"); this.style.setProperty("--dash-r", "0"); this._safe(); }
    let n = this, root = null;
    for (let i = 0; i < 40 && n; i++) { if (n.tagName === "HUI-ROOT") { root = n; break; } n = n.parentNode || n.host; }
    if (!root || !root.shadowRoot) return;
    const edit = !!(root.lovelace && root.lovelace.editMode);
    let st = root.shadowRoot.getElementById("ar4c-fs");
    if (fs && !edit) {
      if (!st) {
        st = document.createElement("style"); st.id = "ar4c-fs";
        st.textContent = ":host{--header-height:0px !important}.header,.toolbar{display:none !important}#view,hui-view-container{padding-top:0 !important;min-height:100dvh !important}";
        root.shadowRoot.appendChild(st);
      }
    } else if (st) st.remove();
  }
  getCardSize() { return 12; }
  getGridOptions() { return { columns: "full", rows: "auto" }; }
  connectedCallback() {
    this._fullScreen();
    this._clockT = setInterval(() => this._tick(), 15000);
    if (this._ready && !this._unsub && this.conf) { this._subscribe(); this._watchSub(); }
    if (this._ready && this.page === "cameras") this._camLoop();
  }
  disconnectedCallback() {
    this._fullScreen(true);
    clearInterval(this._clockT);
    clearInterval(this._camT);
    this._stopLive();
    if (this._unsub) { this._unsub(); this._unsub = null; }
    if (this._wunsub) { this._wunsub(); this._wunsub = null; }
    if (this.sp) this.sp.stop();
  }
  // which Watch source is on in each room, and each step of the last start (from Home Assistant)
  _watchSub() {
    this._hass.connection
      .subscribeMessage((m) => {
        this.wst = m || {};
        if (this.page === "watch") this._render(true);
      }, { type: "ar_4c_dash/watch_subscribe" })
      .then((u) => (this._wunsub = u))
      .catch(() => {});
  }
  set hass(h) {
    if (this._cfg && this._cfg.full_screen) this._fullScreen();
    const first = !this._hass;
    this._hass = h;
    if (first) this._start();
    else this._changed();
  }
  get hass() { return this._hass; }

  // ---- start-up ------------------------------------------------------------
  _start() {
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = "<style>" + CSS + '</style><div class="app"><div class="bg"></div><div class="pg"><div class="empty">Loading\u2026</div></div></div>';
    this.app = this.shadowRoot.querySelector(".app");
    this.page = "home";
    this.sheet = null;
    this.opt = {}; // optimistic values while Home Assistant catches up
    this.P = { room: null, look: null, icons: {}, bg: null };
    this.media = { icons: [], backgrounds: [] };
    this.up = { icon: [], bg: [] };
    this._ready = true;
    this.shadowRoot.addEventListener("click", (e) => this._click(e));
    // typing: the page isn't redrawn under the keyboard; it catches up when typing stops
    this.shadowRoot.addEventListener("focusout", () => setTimeout(() => {
      if (this._later && !this.typing() && !this.fingerDown()) { this._later = false; this._render(true); }
    }, 60));
    // hold to repeat (remote arrows, volume)
    this.shadowRoot.addEventListener("pointerdown", (ev) => {
      const b = ev.target.closest && ev.target.closest("[data-hold]");
      if (!b) return;
      ev.preventDefault();
      const fire = () => this.watchCmd(b.getAttribute("data-hold"), b.getAttribute("data-v"));
      fire();
      b.classList.add("down");
      let t2 = null;
      const t1 = setTimeout(() => (t2 = setInterval(fire, 280)), 450);
      const up = () => { clearTimeout(t1); clearInterval(t2); b.classList.remove("down"); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up); };
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", up);
    });
    this.shadowRoot.addEventListener("input", (ev) => {
      const t = ev.target, k = t.getAttribute && t.getAttribute("data-in");
      if (k === "so-preset" && this.draft && this.draft.solar) { this.draft.solar.preset = t.value; this.dirty = true; this._render(true); return; }
      if (k === "logofile") { this._upFor = { kind: "logo" }; this.logoFile(t.files && t.files[0]); t.value = ""; return; }
      if (k === "iconfile") { this._upFor = { kind: "icon", k: t.getAttribute("data-k") }; this.logoFile(t.files && t.files[0]); t.value = ""; return; }
      if (k === "bgfile") { this.bgFile(t.files && t.files[0]); t.value = ""; return; }
      if (k === "lutol" && this.logoUp) { this.logoUp.tol = Number(t.value); clearTimeout(this._luT); this._luT = setTimeout(() => this.logoCut(), 60); return; }
      if (k === "spname") { (this.spDraft = this.spDraft || {})[t.getAttribute("data-k")] = t.value; return; }
      if (k === "ssize") {
        // bigger temperature / sunrise / motion: shows straight away, saved for every phone
        const z = Number(t.value) / 100; this.conf.statusScale = z;
        const lab = this.shadowRoot.querySelector("[data-zv]"); if (lab) lab.textContent = t.value + "%";
        const el = this.shadowRoot.querySelector(".stz"); if (el) el.style.zoom = z;
        clearTimeout(this._szT); this._szT = setTimeout(() => this._hass.callWS({ type: "ar_4c_dash/set_look", scale: z }).catch(() => {}), 400);
        return;
      }
      if (k === "nm") {
        (this.nameDraft = this.nameDraft || {})[t.getAttribute("data-e")] = t.value; this.dirty = true;
        const sv = this.shadowRoot.querySelector('[data-act="s-save"]'); if (sv) { sv.textContent = "Save for everyone"; sv.style.cssText = "justify-content:center;background:rgba(var(--accrgb),.92);color:#2a2116;border-color:transparent"; }
        return;
      }
      if (k === "lname") { (this.renDraft = this.renDraft || {})[t.getAttribute("data-e")] = t.value; return; }
      if (k === "name" && this.draft) {
        const rm = this.draft.rooms[Number(t.getAttribute("data-v"))];
        if (rm) { rm.name = t.value; this.dirty = true; const b = t.closest(".it").querySelector(".ih b"); if (b) b.textContent = t.value || "Room"; const sv = this.shadowRoot.querySelector('[data-act="s-save"]'); if (sv) { sv.textContent = "Save for everyone"; sv.style.cssText = "justify-content:center;background:rgba(var(--accrgb),.92);color:#2a2116;border-color:transparent"; } }
      } else if ((k === "rname" || k === "rurl") && this.draft && this.draft.rtsp) {
        const c = this.draft.rtsp[Number(t.getAttribute("data-v"))];
        if (c) { c[k === "rname" ? "name" : "url"] = t.value; this.dirty = true; const sv = this.shadowRoot.querySelector('[data-act="s-save"]'); if (sv) { sv.textContent = "Save for everyone"; sv.style.cssText = "justify-content:center;background:rgba(var(--accrgb),.92);color:#2a2116;border-color:transparent"; } }
      } else if (this.draft && (k === "sname" || k === "stv" || k === "sts" || k === "stt" || k === "rkind")) {
        const key = t.getAttribute("data-v").split(":");
        const sc = this.srcAt(key[0] + ":" + key[1]);
        if (k === "sname") sc.name = t.value;
        else if (k === "rkind") { if (sc.remote) sc.remote.kind = t.value; }
        else {
          const st = sc.steps[Number(key[2])];
          if (k === "stv") st.v = t.value;
          else if (k === "sts") st.s = Math.max(0, Math.min(30, Number(t.value) || 0));
          else { st.t = t.value; this.dirty = true; this._render(true); return; }
        }
        this.dirty = true;
        const sv = this.shadowRoot.querySelector('[data-act="s-save"]');
        if (sv) { sv.textContent = "Save for everyone"; sv.style.cssText = "justify-content:center;background:rgba(var(--accrgb),.92);color:#2a2116;border-color:transparent"; }
      } else if (k === "lq" || k === "sq") {
        // search as you type (a moment after the last key)
        this[k] = t.value;
        if (k === "lq") this.lres = null; else this.sres = null;
        clearTimeout(this._qT);
        const box = this.shadowRoot.querySelector(".lres");
        this._qT = setTimeout(() => {
          const q = t.value.trim();
          const show = () => { const b = this.shadowRoot.querySelector(".lres"); if (b) b.innerHTML = k === "lq" ? this.maSearchHtml() : this.spSearchHtml(); };
          if (!q) return show();
          if (k === "lq") this._hass.callWS({ type: "ar_4c_dash/listen", op: "search", q }).then((res) => { if (this.lq === t.value) { this.lres = res || {}; show(); } }).catch(() => { this.lres = {}; show(); });
          else this.spot().api("GET", "/search?type=track,playlist,artist&limit=8&q=" + encodeURIComponent(q)).then((res) => { if (this.sq === t.value) { this.sres = res || {}; show(); } }).catch((er) => { this.sres = { err: er.message }; show(); });
        }, 450);
        if (box) box.innerHTML = '<div class="empty" style="padding:16px">Searching\u2026</div>';
      } else if (k === "q" && this.pick) {
        this.pickQ = t.value;
        const res = this.shadowRoot.querySelector(".pres");
        if (res) res.innerHTML = this.pickList();
      }
    });
    this._drag();
    this._load();
  }
  async _load() {
    const h = this._hass;
    await this._subscribe();
    try { this.li = await h.callWS({ type: "ar_4c_dash/listen", op: "info" }); } catch (e) { this.li = {}; }
    this._watchSub();
    try {
      const u = await h.callWS({ type: "frontend/get_user_data", key: PREF_KEY });
      if (u && u.value && typeof u.value === "object") this.P = Object.assign(this.P, u.value);
    } catch (e) {}
    try {
      const m = await h.callWS({ type: "ar_lighting_scenes/media" });
      if (m) this.media = { icons: m.icons || [], backgrounds: m.backgrounds || [] };
    } catch (e) {}
    this._setup();
    loadLib().then(() => this._render());
    this._render();
  }
  // the setup, and again whenever anyone changes it (Setup, an icon): every open phone updates
  _subscribe() {
    const h = this._hass;
    return new Promise((ok) => {
      let first = true;
      h.connection
        .subscribeMessage((m) => {
          this.conf = (m && m.config) || { rooms: [] };
          this.admin = !!(m && m.admin);
          this.err = null;
          if (first) { first = false; ok(); return; }
          this._setup();
          this._render(true);
        }, { type: "ar_4c_dash/subscribe" })
        .then((u) => (this._unsub = u))
        .catch(() => { this.err = "AR 4C Dash isn't set up in Home Assistant yet: add it under Settings > Devices & services."; ok(); });
    });
  }
  _setup() {
    this._watch = null;
    const c = this.conf || { rooms: [] };
    this.rc = { lightTypes: c.lightTypes || {}, lightTone: c.lightTone, houseImage: c.houseImage };
    const cr = Array.isArray(c.rooms) ? c.rooms : [];
    // whole-house scenes: on the Whole House room and in every room
    const hs = list((cr.filter((x) => x.whole)[0] || {}).scenes);
    this.houseScenes = hs;
    this.rooms = cr.map((r, i) => {
      if (r.whole) {
        // Whole House: everything from every room (no Watch sources of its own)
        const o = { name: r.name || "Whole House", whole: true, sources: [], listen: r.listen !== false };
        // every room's Watch sources, each still run in its own room
        cr.forEach((x, xi) => { if (!x.whole && Array.isArray(x.sources)) x.sources.forEach((sc) => o.sources.push(Object.assign({}, sc, { id: xi + "/" + sc.id, _id: sc.id, _r: xi, _rn: x.name || "Room " + (xi + 1) }))); });
        ROOM_KEYS.forEach((k) => (o[k] = []));
        cr.forEach((x) => { if (!x.whole) ROOM_KEYS.forEach((k) => list(x[k]).forEach((e) => { if (o[k].indexOf(e) < 0) o[k].push(e); })); });
        // lights stay in their rooms on the Lights page
        o.scenes = hs.slice();
        o.groups = cr.filter((x) => !x.whole && list(x.lights).length).map((x) => ({ name: x.name || "Room", lights: list(x.lights) }));
        // curtains and blinds under their rooms too
        o.shadeGroups = cr.filter((x) => !x.whole && list(x.shades).length).map((x) => ({ name: x.name || "Room", shades: list(x.shades) }));
        return o;
      }
      const o = { name: r.name || "Room " + (i + 1), image: r.image, sources: Array.isArray(r.sources) ? r.sources : [] };
      // Listen in this room: as set in Setup; until then, rooms with speakers
      o.listen = typeof r.listen === "boolean" ? r.listen : list(r.music).length > 0;
      ROOM_KEYS.forEach((k) => (o[k] = list(r[k])));
      hs.forEach((e) => { if (o.scenes.indexOf(e) < 0) o.scenes.push(e); });
      return o;
    });
    this.empty = !this.rooms.length;
    if (this.empty) this.rooms = [{ name: "Home", image: "", lights: [], climate: [], music: [], watch: [], shades: [], scenes: [], sources: [] }];
    this.house = { cameras: list(c.cameras).concat((Array.isArray(c.rtsp) ? c.rtsp : []).map((x, i) => "rtsp:" + i)), security: list(c.security), utilities: list(c.utilities), garage: list(c.garage) };
    this.ri = clamp(typeof this.P.room === "number" ? this.P.room : 0, 0, this.rooms.length - 1);
  }
  _save() {
    clearTimeout(this._saveT);
    this._saveT = setTimeout(() => {
      this._hass.callWS({ type: "frontend/set_user_data", key: PREF_KEY, value: this.P }).catch(() => {});
    }, 400);
  }

  // ---- state helpers -----------------------------------------------------
  st(e) { return (this._hass && this._hass.states[e]) || null; }
  name(e) { const nm = this.conf && this.conf.names && this.conf.names[e]; if (nm) return nm; return this.haName(e); }
  haName(e) { const s = this.st(e); return (s && s.attributes.friendly_name) || e.split(".")[1].replace(/_/g, " "); }
  room() { return this.rooms[this.ri]; }
  call(dom, svc, data) { return this._hass.callService(dom, svc, data).catch((e) => this._toast(e && e.message ? e.message : "That didn't work")); }
  isOn(e) {
    const o = this.opt[e];
    if (o && o.until > Date.now() && o.on != null) return o.on;
    const s = this.st(e);
    return !!s && (s.state === "on" || s.state === "playing" || s.state === "open" || s.state === "opening");
  }
  lightPct(e) {
    const o = this.opt[e];
    if (o && o.until > Date.now() && o.v != null) return o.v;
    const s = this.st(e);
    const b = s && s.attributes.brightness;
    return b != null ? Math.max(1, Math.round((b / 255) * 100)) : this.isOn(e) ? 100 : 0;
  }
  dimmable(e) {
    if (domain(e) !== "light") return false;
    const s = this.st(e);
    const m = (s && s.attributes.supported_color_modes) || [];
    return m.length ? !(m.length === 1 && m[0] === "onoff") : s && s.attributes.brightness != null;
  }
  setOpt(e, o) { this.opt[e] = Object.assign({}, this.opt[e] || {}, o, { until: Date.now() + 4000 }); }
  cats() {
    const r = this.room(), li = this.li || {};
    return ORDER.filter((k) => {
      if (k === "music") return r.listen && (r.music.length || li.ma || li.spotify);
      if (k === "watch") return r.watch.length || r.sources.length;
      if (k === "utilities") return this.house.utilities.length || !!this.solarCfg();
      if (k === "garage") return this.house.garage.length && (r.whole || !(this.rooms || []).some((x) => x.whole)); // on the Whole House home
      return (HOUSE_KEYS.indexOf(k) >= 0 ? this.house[k] : r[k]).length;
    });
  }
  ents(k) { return HOUSE_KEYS.indexOf(k) >= 0 ? this.house[k] : this.room()[k]; }

  // ---- icons + background ------------------------------------------------
  instIcon(k) {
    const ic = this.rc.icons && this.rc.icons[k];
    const src = ic && typeof ic.src === "string" ? ic.src : "";
    if (src.indexOf("lib:") === 0 && libSrc(src.slice(4))) return '<img alt="" src="' + esc(libSrc(src.slice(4))) + '">';
    if (src && src.indexOf("lib:") !== 0) return '<img alt="" src="' + esc(this.url(src)) + '">';
    return line(k);
  }
  icon(k) {
    const v = this.conf && this.conf.icons && this.conf.icons[k];
    if (v === "line") return line(k);
    if (typeof v === "string" && v.indexOf("lib:") === 0 && libSrc(v.slice(4))) return '<img alt="" src="' + esc(libSrc(v.slice(4))) + '">';
    if (typeof v === "string" && v.indexOf("/ar_4c_dash_icons/") === 0) return '<img alt="" src="' + esc(v) + '">';
    if (typeof v === "string" && v.indexOf("media:") === 0) {
      const m = this.media.icons.filter((x) => x.id === v.slice(6))[0];
      if (m) return '<img alt="" src="' + esc(m.url) + '">';
    }
    return this.instIcon(k);
  }
  url(src) {
    if (typeof src !== "string" || !src) return "";
    if (src.indexOf("preset:") === 0) return PRESETS[src.slice(7)] ? BASE + "/backgrounds/" + PRESETS[src.slice(7)] : "";
    if (src.indexOf("media:") === 0) { const m = this.media.backgrounds.filter((x) => x.id === src.slice(6))[0]; return m ? m.url : ""; }
    return src;
  }
  bgUrl() {
    return this.url(this.P.bg) || this.url(this.room() && this.room().image) || this.url(this.rc.houseImage) || BASE + "/backgrounds/" + PRESETS.villa;
  }

  // ---- render ----------------------------------------------------------------
  // the entities on screen anywhere in the dash (rooms, whole home, weather)
  watched() {
    if (this._watch) return this._watch;
    const w = [];
    (this.rooms || []).forEach((r) => ROOM_KEYS.forEach((k) => (r[k] || []).forEach((e) => w.push(e))));
    const hs = this.house || {};
    HOUSE_KEYS.forEach((k) => (hs[k] || []).forEach((e) => w.push(e)));
    Object.keys((this.conf && this.conf.garageSensors) || {}).forEach((k) => w.push(this.conf.garageSensors[k]));
    ((this.li && this.li.maPlayers) || []).forEach((e) => w.push(e));
    const so = this.solarCfg(); if (so) Object.keys(so.e).forEach((k) => w.push(so.e[k]));
    if (this.peopleOn()) this.conf.people.list.forEach((e) => w.push(e));
    const sc = (this.conf && this.conf.status) || {};
    if (sc.temp) w.push(sc.temp);
    if (sc.sun) w.push("sun.sun");
    if (this.conf && this.conf.weather) w.push(this.conf.weather);
    else { const wx = Object.keys(this._hass.states).filter((e) => e.indexOf("weather.") === 0)[0]; if (wx) w.push(wx); }
    return (this._watch = w);
  }
  fingerDown() { return !!this._down && Date.now() - (this._downAt || 0) < 1500; }
  typing() { const a = this.shadowRoot && this.shadowRoot.activeElement; return !!a && (a.tagName === "INPUT" || a.tagName === "SELECT"); }
  _changed() {
    if (!this._ready) return;
    if (this.dragging && Date.now() - (this._dragAt || 0) < 2000) { this._later = true; return; }
    this.dragging = false;
    // Home Assistant hands over new states for every change in the house, many a
    // second; Home Assistant keeps unchanged states as the same objects, so only
    // a change to one of this dash's own entities redraws it
    const seen = this._seen || (this._seen = {});
    let diff = false;
    this.watched().forEach((e) => {
      const o = this._hass.states[e];
      if (seen[e] !== o) { seen[e] = o; diff = true; }
    });
    if (!diff) return;
    if (this.fingerDown() || this.typing()) { this._later = true; return; } // a finger is on the screen: redraw when it lifts
    if (this.sheet === "settings" && this.setTab === "setup") return; // typing: leave the setup page alone
    if (this._raf) return;
    this._raf = requestAnimationFrame(() => { this._raf = 0; this._render(true); });
  }
  _render(soft) {
    if (!this.app) return;
    const pg = this.app.querySelector(".pg");
    if (this.err) { pg.innerHTML = '<div class="empty">' + esc(this.err) + "</div>"; return; }
    if (!this.rooms) return;
    const bg = this.bgUrl();
    const bgEl = this.app.querySelector(".bg");
    if (bgEl.__u !== bg) { bgEl.__u = bg; bgEl.style.backgroundImage = 'url("' + bg.replace(/"/g, "%22") + '")'; }
    this.app.classList.toggle("inner", this.page !== "home");
    this.app.classList.toggle("bare", this.look() === "bare");
    const sc = pg.querySelector(".scroll,.dialw,.shb");
    const y = soft && sc ? sc.scrollTop : 0;
    const shy = soft && this.app.querySelector(".sheet .shb") ? this.app.querySelector(".sheet .shb").scrollTop : 0;
    let h = this.page === "home" ? this.home() : this.inner();
    if (this.sheet) h += this.sheetHtml();
    if (this.viewCam) h += this.camView();
    if (this.efcEl && this.efcEl.isConnected) this.efcEl.hass = this._hass;
    if (pg.__h === h) { if (this.page === "utilities") { this.efcMount(); this.uMount(); } return; } // nothing on screen changed
    pg.__h = h;
    pg.innerHTML = h;
    if (this._sheetIn) { const sh = pg.querySelector(".sheet"); if (sh) sh.classList.add("in"); this._sheetIn = false; }
    if (soft) { const s2 = pg.querySelector(".scroll,.dialw"); if (s2) s2.scrollTop = y; const s3 = this.app.querySelector(".sheet .shb"); if (s3) s3.scrollTop = shy; }
    pg.querySelectorAll("canvas[data-lamp]").forEach((c) => this.lamp(c, c.getAttribute("data-lamp")));
    if (this.page === "climate") this.paintDial();
    if (this.page === "cameras") this._camFill();
    if (this.page === "utilities") { this.efcMount(); this.uMount(); }
    if (this.page === "garage") {
      // the door slides from where it was to where it is now
      const gp = this._gp || (this._gp = {});
      const els = [...pg.querySelectorAll(".gpan[data-to]")];
      requestAnimationFrame(() => requestAnimationFrame(() => els.forEach((el) => { const to = el.getAttribute("data-to"); el.style.transform = "translateY(-" + to + "%)"; gp[el.getAttribute("data-e")] = to; })));
    }
  }
  roomName() { return esc(this.room().name); }
  home() {
    const now = new Date();
    const w = (this.conf && this.conf.weather) || Object.keys(this._hass.states).filter((e) => e.indexOf("weather.") === 0)[0];
    const ws = w && this.st(w);
    const wtxt = ws && ws.attributes.temperature != null ? " \u00b7 " + Math.round(ws.attributes.temperature) + "\u00b0 " + String(ws.state).replace(/-/g, " ").replace("partlycloudy", "partly cloudy") : "";
    let g = "";
    this.cats().forEach((k) => {
      let lit = false, badge = "";
      const es = this.ents(k);
      if (k === "lights") { const n = es.filter((e) => this.isOn(e)).length; lit = n > 0; if (n) badge = '<i class="badge">' + n + "</i>"; }
      else if (k === "climate") lit = es.some((e) => { const s = this.st(e); return s && s.state !== "off" && s.state !== "unavailable"; });
      else if (k === "music" || k === "watch") lit = es.some((e) => { const s = this.st(e); return s && s.state === "playing"; });
      else if (k === "security") lit = es.some((e) => { const s = this.st(e); return s && s.state.indexOf("armed") === 0; });
      else if (k === "garage") lit = es.some((e) => { const s = this.st(e); return s && (s.state === "open" || s.state === "opening" || s.state === "unlocked"); });
      else if (k === "shades") lit = es.some((e) => { const s = this.st(e); return s && s.state === "open"; });
      g += '<div class="btn' + (lit ? " lit" : "") + '" data-act="go" data-k="' + k + '"><div class="ring">' + this.icon(k) + badge + "</div><span>" + TITLES[k] + "</span></div>";
    });
    const hasLights = this.room().lights.length;
    return (
      '<div class="top"><div class="ib" data-act="menu" title="Home Assistant menu">' + MENU + '</div><div class="room" data-act="rooms">' + this.roomName() + line("down") + '</div><div class="sp"></div>' + (this.gearUntil > Date.now() ? '<div class="ib gear" data-act="settings">' + line("icons") + "</div>" : '<div class="ib hid" data-act="gtap"></div>') + "</div>" +
      '<div class="hero"><div class="clock"><div class="t">' + now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }) + '</div><div class="d">' + now.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" }) + (wtxt ? "<i>" + esc(wtxt) + "</i>" : "") + "</div></div>" + this.statusHtml() + "</div>" + this.peopleHtml() +
      (this.empty ? '<div class="empty" style="margin-top:auto">' + (this.admin ? 'Nothing set up yet.<br><br><span class="pill" style="display:inline-flex" data-act="setup">' + line("rooms") + "Set up rooms</span>" : "Nothing set up yet. Ask the person who looks after Home Assistant to set up the 4C Dash.") + "</div>" : '<div class="grid">' + (g || '<div class="empty" style="grid-column:1/-1">Nothing set up for this room yet.</div>') + "</div>") +
      (this.houseScenes && this.houseScenes.length && !this.empty ? '<div class="chips hsc">' + this.houseScenes.map((e) => '<div class="chip dot sc" data-act="scene" data-e="' + esc(e) + '"><i></i>' + esc(this.name(e)) + "</div>").join("") + "</div>" : "") +
      '<div class="bot">' + (hasLights ? '<div class="pill" data-act="roomoff">' + line("power") + "Room Off</div>" : "<span></span>") + "</div>"
    );
  }
  head(title) {
    const house = HOUSE_KEYS.indexOf(this.page) >= 0;
    return '<div class="top"><div class="ib" data-act="back">' + line("chevl") + '</div><div class="room"' + (house ? "" : ' data-act="rooms"') + ">" + title + (house ? "" : "<small>" + this.roomName() + line("down") + "</small>") + '</div><div class="sp"></div><div class="ib" data-act="back" data-v="home">' + line("home") + "</div></div>";
  }
  inner() {
    const k = this.page;
    const f = { garage: this.pGarage, lights: this.pLights, climate: this.pClimate, music: this.pListen, watch: this.pWatch, shades: this.pShades, scenes: this.pScenes, security: this.pSecurity, cameras: this.pCameras, utilities: this.pUtil }[k];
    return this.head(TITLES[k]) + (f ? f.call(this) : "");
  }

  // ---- lights ------------------------------------------------------------------
  pLights() {
    const es = this.room().lights, ren = !!this.ren;
    let chips = '<div class="chips">';
    if (ren) chips += '<div class="chip dot" data-act="ren-done" style="background:rgba(var(--accrgb),.92);color:#2a2116;border-color:transparent">Done</div><div class="chip" data-act="ren-cancel">Cancel</div>';
    else {
      chips += '<div class="chip dot" data-act="allon"><i></i>All on</div>';
      this.room().scenes.forEach((e) => (chips += '<div class="chip dot sc" data-act="scene" data-e="' + esc(e) + '"><i></i>' + esc(this.name(e)) + "</div>"));
      chips += '<div class="chip dot off" data-act="alloff"><i></i>All off</div>' + (es.length ? '<div class="chip" data-act="ren">' + line("pencil") + "Rename</div>" : "");
    }
    chips += "</div>";
    const row = (e) => {
      if (ren) {
        const v = this.renDraft && e in this.renDraft ? this.renDraft[e] : (this.conf && this.conf.names && this.conf.names[e]) || "";
        return '<div class="lt rn"><div class="nm"><input data-in="lname" data-e="' + esc(e) + '" value="' + esc(v) + '" placeholder="' + esc(this.haName(e)) + '" maxlength="40"><small>' + esc(this.haName(e)) + " \u00b7 " + esc(e) + "</small></div></div>";
      }
      const on = this.isOn(e), dim = this.dimmable(e), v = this.lightPct(e);
      const lc = this.lampRgb(e).join(",");
      const t = (this.rc.lightTypes && LAMP_NAME[this.rc.lightTypes[e]]) || (dim ? "Dimmer" : "Switch");
      return '<div class="lt ' + (on ? "on" : "off") + '" data-lt="' + esc(e) + '" style="--lc:' + lc + '"><div class="fill" style="width:' + (dim ? v : 100) + '%"></div><canvas data-lamp="' + esc(e) + '"></canvas><div class="nm"><b>' + esc(this.name(e)) + "</b><small>" + esc(t) + '</small></div><div class="pc">' + (on ? (dim ? v + "%" : "On") : "Off") + '</div><div class="sw' + (on ? " on" : "") + '" data-act="toggle" data-e="' + esc(e) + '"></div></div>';
    };
    let rows = "";
    const groups = this.room().groups;
    if (groups) groups.forEach((g, gi) => {
      const n = g.lights.filter((e) => this.isOn(e)).length;
      rows += '<div class="lgh"><div><b>' + esc(g.name) + "</b><small>" + n + " of " + g.lights.length + " on</small></div>" + (ren ? "" : '<div class="sw' + (n ? " on" : "") + '" data-act="grp" data-v="' + gi + '"></div>') + "</div>";
      g.lights.forEach((e) => (rows += row(e)));
    });
    else es.forEach((e) => (rows += row(e)));
    const n = es.filter((e) => this.isOn(e)).length;
    const hint = ren ? "Type a new name \u00b7 leave it empty to use the Home Assistant name \u00b7 every phone shows it" : "";
    return chips + '<div class="scroll">' + (rows || '<div class="empty">No lights in this room.</div>') + '</div>' + (hint ? '<div class="hint">' + hint + "</div>" : "") + '<div class="bot"><div class="pill" data-act="roomoff">' + line("power") + 'Room Off</div><span class="lbl">' + n + " of " + es.length + " on</span></div>";
  }
  lampRgb(e) {
    const s = this.st(e);
    const a = (s && s.attributes) || {};
    if (Array.isArray(a.rgb_color) && a.color_mode && a.color_mode !== "color_temp") return a.rgb_color;
    if (a.color_temp_kelvin) return kelvinRgb(a.color_temp_kelvin);
    const tone = (this.rc.lightTones && this.rc.lightTones[e]) || this.rc.lightTone || "warm";
    return kelvinRgb(LAMP_K[tone] || 2700);
  }
  lamp(cv, e) {
    const d = Math.min(3, window.devicePixelRatio || 1), g = cv.getContext("2d");
    cv.width = 52 * d; cv.height = 52 * d; g.scale(d, d);
    const on = this.isOn(e), v = this.dimmable(e) ? this.lightPct(e) / 100 : 1, a = on ? 0.3 + 0.7 * v : 0;
    const [r, gg, b] = this.lampRgb(e);
    const type = (this.rc.lightTypes && this.rc.lightTypes[e]) || "lamp";
    if (a) { const gr = g.createRadialGradient(26, 30, 2, 26, 30, 26); gr.addColorStop(0, "rgba(" + r + "," + gg + "," + b + "," + 0.75 * a + ")"); gr.addColorStop(1, "rgba(" + r + "," + gg + "," + b + ",0)"); g.fillStyle = gr; g.fillRect(0, 0, 52, 52); }
    const lit = "rgba(" + Math.min(255, r + 30) + "," + Math.min(255, gg + 40) + "," + Math.min(255, b + 60) + "," + (0.6 + 0.4 * a) + ")";
    g.lineWidth = 1.2;
    if (type === "downlight") {
      g.fillStyle = on ? "#e9e6e1" : "#77756f"; g.beginPath(); g.ellipse(26, 22, 14, 5, 0, 0, 7); g.fill();
      g.fillStyle = on ? lit : "#4d4b47"; g.beginPath(); g.ellipse(26, 22, 8, 2.6, 0, 0, 7); g.fill();
    } else if (type === "bulb" || type === "edison") {
      g.strokeStyle = "rgba(255,255,255,.5)"; g.beginPath(); g.moveTo(26, 2); g.lineTo(26, 12); g.stroke();
      g.fillStyle = "#b89a62"; g.fillRect(22.5, 12, 7, 6);
      g.fillStyle = on ? lit : "rgba(200,200,205,.35)"; g.beginPath(); g.arc(26, 27, 9.5, 0, 7); g.fill();
      if (type === "edison") { g.strokeStyle = on ? "rgba(255,240,210,.95)" : "rgba(255,255,255,.4)"; g.beginPath(); g.moveTo(22, 30); g.lineTo(24, 24); g.lineTo(26, 30); g.lineTo(28, 24); g.lineTo(30, 30); g.stroke(); }
    } else {
      g.strokeStyle = "rgba(255,255,255,.5)"; g.beginPath(); g.moveTo(26, 2); g.lineTo(26, 14); g.stroke();
      g.fillStyle = "#c9a46a"; g.fillRect(23, 13, 6, 5);
      g.fillStyle = on ? "#f2efe9" : "#8d8b88"; g.beginPath(); g.moveTo(13, 31); g.quadraticCurveTo(14, 17, 26, 17); g.quadraticCurveTo(38, 17, 39, 31); g.closePath(); g.fill();
      g.fillStyle = on ? lit : "#55534f"; g.beginPath(); g.ellipse(26, 31, 13, 2.8, 0, 0, 7); g.fill();
    }
  }
  _drag() {
    // lights: slide along a row to dim; a tap switches it. Sliders: shades, volume.
    const R = this.shadowRoot;
    let cur = null;
    // no redraw while a finger is down (a tap must land on the button it started on)
    // A lift the dash doesn't see (finger slid off it, phone locked or the app sent to
    // the background mid-touch) must never stop it updating: a touch counts as down
    // for 1.5 s at most, lifts are caught anywhere on the page, and coming back to
    // the app clears it and redraws.
    R.addEventListener("pointerdown", () => { this._down = true; this._downAt = Date.now(); clearTimeout(this._downT); this._downT = setTimeout(lift, 1600); }, true);
    const lift = () => {
      clearTimeout(this._downT);
      if (!this._down && !this._later) return;
      this._down = false;
      if (this._later) { this._later = false; setTimeout(() => !this.fingerDown() && this._render(true), 50); }
    };
    R.addEventListener("pointerup", lift, true);
    R.addEventListener("pointercancel", lift, true);
    if (!this._liftWin) {
      this._liftWin = () => lift();
      this._wake = () => { if (document.visibilityState === "visible") { this._down = false; this.dragging = false; this._later = false; this._seen = {}; this._render(true); } };
    }
    window.addEventListener("pointerup", this._liftWin, true);
    window.addEventListener("pointercancel", this._liftWin, true);
    window.addEventListener("blur", this._liftWin);
    document.addEventListener("visibilitychange", this._wake);
    R.addEventListener("pointerdown", (ev) => {
      if (ev.target.closest("[data-act]")) return;
      const row = ev.target.closest(".lt");
      const sl = ev.target.closest(".slider");
      if (!row && !sl) return;
      cur = { row, sl, x0: ev.clientX, moved: false, id: ev.pointerId, last: 0 };
      (row || sl).setPointerCapture(ev.pointerId);
      if (sl) this._slide(cur, ev, false);
    });
    R.addEventListener("pointermove", (ev) => {
      if (!cur || ev.pointerId !== cur.id) return;
      if (cur.row) {
        const e = cur.row.getAttribute("data-lt");
        if (!this.dimmable(e)) return;
        if (!cur.moved && Math.abs(ev.clientX - cur.x0) < 8) return;
        cur.moved = true;
        this.dragging = true; this._dragAt = Date.now();
        cur.row.classList.add("drag");
        const r = cur.row.getBoundingClientRect();
        const v = clamp(Math.round(((ev.clientX - r.left) / r.width) * 100), 1, 100);
        this.setOpt(e, { v, on: true });
        cur.row.className = "lt on drag";
        cur.row.querySelector(".fill").style.width = v + "%";
        cur.row.querySelector(".pc").textContent = v + "%";
        cur.row.querySelector(".sw").className = "sw on";
        this.lamp(cur.row.querySelector("canvas"), e);
        const now = Date.now();
        if (now - cur.last > 300) { cur.last = now; this.call("light", "turn_on", { entity_id: e, brightness_pct: v }); }
        cur.v = v;
      } else this._slide(cur, ev, false);
    });
    const end = (ev) => {
      if (!cur || ev.pointerId !== cur.id) return;
      const c = cur;
      cur = null;
      this.dragging = false;
      if (c.row) {
        const e = c.row.getAttribute("data-lt");
        if (c.moved && c.v != null) this.call("light", "turn_on", { entity_id: e, brightness_pct: c.v });
        else if (!c.moved && ev.type === "pointerup") this.toggle(e);
      } else this._slide(c, ev, true);
      this._render(true);
    };
    R.addEventListener("pointerup", end);
    R.addEventListener("pointercancel", end);
    // full-screen camera: swipe sideways for the next one
    let sw = null;
    R.addEventListener("pointerdown", (ev) => { sw = this.viewCam && ev.target.closest("[data-cview]") ? { x: ev.clientX, y: ev.clientY, t: Date.now() } : null; });
    R.addEventListener("pointerup", (ev) => {
      if (!sw || !this.viewCam) return;
      const dx = ev.clientX - sw.x, dy = ev.clientY - sw.y; sw = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) { ev.preventDefault(); this._swiped = Date.now(); this.camGo(dx < 0 ? 1 : -1); }
    });
  }
  _slide(c, ev, done) {
    const sl = c.sl, r = sl.getBoundingClientRect();
    const v = clamp(Math.round(((ev.clientX - r.left) / r.width) * 100), 0, 100);
    this.dragging = !done; this._dragAt = Date.now();
    sl.querySelector("i").style.width = v + "%";
    sl.querySelector("b").style.left = v + "%";
    const e = sl.getAttribute("data-e"), kind = sl.getAttribute("data-kind");
    const now = Date.now();
    if (!done && now - c.last < 300) { c.v = v; return; }
    c.last = now;
    if (kind === "cover") { if (done) this.call("cover", "set_cover_position", { entity_id: e, position: v }); this.setOpt(e + "#pos", { v }); }
    else if (kind === "vol") { this.call("media_player", "volume_set", { entity_id: e, volume_level: v / 100 }); this.setOpt(e + "#vol", { v }); }
    else if (kind === "mvol") {
      // a group: every speaker in it to the same level
      this.setOpt(e + "#mvol", { v });
      [e].concat(this.maMembers(e)).forEach((x) => this.call("media_player", "volume_set", { entity_id: x, volume_level: v / 100 }));
    } else if (kind === "svol") { this.setOpt("SP#vol", { v }); this.spot().api("PUT", "/me/player/volume?volume_percent=" + v).catch(() => {}); }
    const pc = sl.parentNode && sl.parentNode.querySelector(".vpc");
    if (pc) pc.textContent = v + "%";
  }
  toggle(e) {
    const on = !this.isOn(e);
    this.setOpt(e, { on });
    const d = domain(e);
    if (d === "light" || d === "switch" || d === "fan" || d === "input_boolean") this.call(d, on ? "turn_on" : "turn_off", { entity_id: e });
    else this.call("homeassistant", on ? "turn_on" : "turn_off", { entity_id: e });
    this._render(true);
  }

  // ---- comfort -----------------------------------------------------------------
  pClimate() {
    const es = this.room().climate;
    if (!es.length) return '<div class="empty">No climate in this room.</div>';
    if (!this.cl || es.indexOf(this.cl) < 0) this.cl = es[0];
    const e = this.cl, s = this.st(e);
    if (!s) return '<div class="empty">' + esc(e) + " isn't available.</div>";
    const a = s.attributes, mode = s.state;
    const t = this.opt[e + "#t"] && this.opt[e + "#t"].until > Date.now() ? this.opt[e + "#t"].v : a.temperature;
    const col = MODE_COL[mode] || "#f3d39a";
    let tabs = "";
    if (es.length > 1) { tabs = '<div class="tabs">'; es.forEach((x) => (tabs += '<div class="chip' + (x === e ? " on" : "") + '" data-act="cl" data-e="' + esc(x) + '">' + esc(this.name(x)) + "</div>")); tabs += "</div>"; }
    let modes = "";
    (a.hvac_modes || []).forEach((m) => (modes += '<div class="chip' + (m === mode ? " on" : "") + '" data-act="hvac" data-v="' + esc(m) + '">' + esc(MODE[m] || m) + "</div>"));
    let fans = "";
    (a.fan_modes || []).forEach((m) => (fans += '<div class="chip' + (m === a.fan_mode ? " on" : "") + '" data-act="fan" data-v="' + esc(m) + '">' + esc(String(m).charAt(0).toUpperCase() + String(m).slice(1)) + "</div>"));
    this._dial = { t, min: a.min_temp || 16, max: a.max_temp || 30, col: mode === "off" ? "#777" : col };
    return tabs + '<div class="dialw"><div class="dial"><svg viewBox="0 0 200 200"><path d="M40 160 A85 85 0 1 1 160 160" stroke="rgba(255,255,255,.12)" stroke-width="10" fill="none" stroke-linecap="round"/><path class="arc" d="M40 160 A85 85 0 1 1 160 160" stroke-width="10" fill="none" stroke-linecap="round" pathLength="100"/><circle class="knob" r="9" fill="#fff"/></svg>' +
      '<div class="c"><small style="color:' + col + '">' + esc(MODE[mode] || mode) + "</small><b>" + (t != null ? Number(t).toFixed(t % 1 ? 1 : 0) + "<sup>\u00b0</sup>" : "\u2013") + "</b><span>" + (a.current_temperature != null ? "Inside " + a.current_temperature + "\u00b0 \u00b7 " : "") + esc(this.name(e)) + "</span></div></div>" +
      '<div class="pm"><div class="ib" data-act="tmp" data-v="-1">' + line("minus") + '</div><div class="ib" data-act="tmp" data-v="1">' + line("plus") + "</div></div>" +
      (modes ? '<div class="wrapc">' + modes + "</div>" : "") + (fans ? '<div class="wrapc"><span class="lbl">Fan</span>' + fans + "</div>" : "") + "</div>";
  }
  paintDial() {
    const d = this._dial, arc = this.shadowRoot.querySelector(".arc"), kn = this.shadowRoot.querySelector(".knob");
    if (!d || !arc || d.t == null) return;
    const k = clamp((d.t - d.min) / (d.max - d.min), 0, 1);
    arc.setAttribute("stroke", d.col);
    arc.setAttribute("stroke-dasharray", k * 100 + " 100");
    try { const p = arc.getPointAtLength(k * arc.getTotalLength()); kn.setAttribute("cx", p.x); kn.setAttribute("cy", p.y); } catch (e) {}
  }

  // ---- shades / media / scenes / security / cameras / utilities ------------------------
  slider(e, kind, v) {
    return '<div class="slider" data-e="' + esc(e) + '" data-kind="' + kind + '"><i style="width:' + v + '%"></i><b style="left:' + v + '%"></b></div>';
  }
  pShades() {
    const card = (e) => {
      const s = this.st(e); if (!s) return "";
      const pos = this.opt[e + "#pos"] && this.opt[e + "#pos"].until > Date.now() ? this.opt[e + "#pos"].v : s.attributes.current_position;
      return '<div class="card"><div class="row"><div class="nm"><b>' + esc(this.name(e)) + "</b><small>" + esc(pos != null ? pos + "% open" : s.state) + '</small></div><div class="ctrls" style="gap:10px"><div class="ib" data-act="cov" data-v="open_cover" data-e="' + esc(e) + '">' + line("up") + '</div><div class="ib" data-act="cov" data-v="stop_cover" data-e="' + esc(e) + '">' + line("stop") + '</div><div class="ib" data-act="cov" data-v="close_cover" data-e="' + esc(e) + '">' + line("down") + "</div></div></div>" + (pos != null ? this.slider(e, "cover", pos) : "") + "</div>";
    };
    let h = "";
    const groups = this.room().shadeGroups;
    if (groups) groups.forEach((g, gi) => {
      // Whole House: each room's curtains under the room, with open / close for the room
      const n = g.shades.filter((e) => { const s = this.st(e); return s && (s.state === "open" || s.state === "opening"); }).length;
      h += '<div class="lgh"><div><b>' + esc(g.name) + "</b><small>" + n + " of " + g.shades.length + ' open</small></div><div class="ctrls" style="gap:8px;padding:0"><div class="ib sm" data-act="covg" data-v="open_cover" data-g="' + gi + '">' + line("up") + '</div><div class="ib sm" data-act="covg" data-v="close_cover" data-g="' + gi + '">' + line("down") + "</div></div></div>";
      g.shades.forEach((e) => (h += card(e)));
    });
    else this.room().shades.forEach((e) => (h += card(e)));
    return '<div class="scroll">' + (h || '<div class="empty">No shades in this room.</div>') + "</div>";
  }
  pMedia() {
    let h = "";
    this.room()[this.page].forEach((e) => {
      const s = this.st(e); if (!s) return;
      const a = s.attributes, on = s.state !== "off" && s.state !== "unavailable" && s.state !== "standby";
      const vol = this.opt[e + "#vol"] && this.opt[e + "#vol"].until > Date.now() ? this.opt[e + "#vol"].v : a.volume_level != null ? Math.round(a.volume_level * 100) : null;
      const pic = a.entity_picture ? '<div class="art" style="background-image:url(&quot;' + esc(a.entity_picture) + '&quot;)"></div>' : '<div class="art">' + line(this.page === "watch" ? "watch" : "music") + "</div>";
      const title = a.media_title || (on ? (s.state === "playing" ? "Playing" : s.state.charAt(0).toUpperCase() + s.state.slice(1)) : "Off");
      const sub = a.media_artist || a.app_name || a.source || "";
      let src = "";
      if (on && Array.isArray(a.source_list) && a.source_list.length) { src = '<div class="chips" style="padding:0">'; a.source_list.slice(0, 12).forEach((x) => (src += '<div class="chip' + (x === a.source ? " on" : "") + '" data-act="src" data-e="' + esc(e) + '" data-v="' + esc(x) + '">' + esc(x) + "</div>")); src += "</div>"; }
      h += '<div class="card"><div class="row">' + pic + '<div class="nm"><b>' + esc(title) + "</b><small>" + esc(this.name(e)) + (sub ? " \u00b7 " + esc(sub) : "") + '</small></div><div class="sw' + (on ? " on" : "") + '" data-act="power" data-e="' + esc(e) + '"></div></div>' +
        (on ? '<div class="ctrls"><div class="ib" data-act="mp" data-v="media_previous_track" data-e="' + esc(e) + '">' + line("prev") + '</div><div class="ib big" data-act="mp" data-v="media_play_pause" data-e="' + esc(e) + '">' + (s.state === "playing" ? PAUSE : PLAY) + '</div><div class="ib" data-act="mp" data-v="media_next_track" data-e="' + esc(e) + '">' + line("next") + "</div></div>" : "") +
        (on && vol != null ? '<div class="row">' + line("vol") + this.slider(e, "vol", vol) + "</div>" : "") + src + "</div>";
    });
    return '<div class="scroll">' + (h || '<div class="empty">Nothing set up here for this room.</div>') + "</div>";
  }
  // ===== Listen: Music Assistant / Spotify (as on the panels), or the room's players =====
  lmode() {
    const li = this.li || {};
    const want = this.lsrc || this.P.lsrc || (this.conf && this.conf.listenStart) || "ma";
    if (want === "spotify" && li.spotify) return "spotify";
    if (li.ma) return "ma";
    if (li.spotify) return "spotify";
    return "plain";
  }
  pListen() {
    const mode = this.lmode(), li = this.li || {};
    if (mode === "plain") return this.pMedia();
    let h = "";
    if (li.ma && li.spotify) h += '<div class="seg"><div data-act="lsrc" data-v="ma" class="' + (mode === "ma" ? "on" : "") + '">Music Assistant</div><div data-act="lsrc" data-v="spotify" class="' + (mode === "spotify" ? "on" : "") + '">Spotify</div></div>';
    h += mode === "ma" ? this.maHtml() : this.spHtml();
    return '<div class="scroll">' + h + "</div>";
  }
  libRow(it, act, extra) {
    const img = it.image || it.thumb || "";
    return '<div class="li' + (it.round ? " round" : "") + (it.now ? " now" : "") + '" data-act="' + act + '"' + (extra || "") + '><div class="a"' + (img ? ' style="background-image:url(&quot;' + esc(img) + '&quot;)"' : "") + ">" + (img ? "" : line(it.icon || "music")) + "</div><div><b>" + esc(it.name) + "</b><small>" + esc(it.sub || "") + "</small></div>" + (it.chev === false ? "" : line("chevr")) + "</div>";
  }
  nowCard(o) {
    // o: {art, title, sub, on, playing, vol, zone, cmd:(k)->act attrs}
    return '<div class="card"><div class="np"><div class="art"' + (o.art ? ' style="background-image:url(&quot;' + esc(o.art) + '&quot;)"' : "") + ">" + (o.art ? "" : line("music")) + '</div><div class="npt"><b>' + esc(o.title) + "</b><small>" + esc(o.sub || "") + "</small>" + (o.where ? "<small>" + esc(o.where) + "</small>" : "") + "</div></div>" +
      '<div class="ctrls"><div class="ib" data-act="' + o.act + '" data-v="prev">' + line("prev") + '</div><div class="ib big" data-act="' + o.act + '" data-v="play">' + (o.playing ? PAUSE : PLAY) + '</div><div class="ib" data-act="' + o.act + '" data-v="next">' + line("next") + "</div></div>" +
      (o.vol != null ? '<div class="row">' + line("vol") + (o.zone ? '<span class="lbl">Zone · ' + o.zone + "</span>" : "") + this.slider(o.volKey, o.volKind, o.vol) + '<span class="vpc">' + o.vol + "%</span></div>" : "") + "</div>";
  }
  // ---- Music Assistant (Home Assistant's Music Assistant integration) ----
  maTarget() {
    const ps = (this.li && this.li.maPlayers) || [];
    if (this.maT && ps.indexOf(this.maT) >= 0) return this.maT;
    const mine = this.room().music.filter((e) => ps.indexOf(e) >= 0)[0];
    return mine || ps.filter((e) => this.st(e) && this.st(e).state === "playing")[0] || ps[0] || null;
  }
  maMembers(t) { const s = this.st(t); return ((s && s.attributes.group_members) || []).filter((x) => x !== t); }
  maHtml() {
    const t = this.maTarget();
    if (!t) return '<div class="empty">No Music Assistant speakers found in Home Assistant.</div>';
    const s = this.st(t) || { state: "off", attributes: {} }, a = s.attributes;
    const mem = this.maMembers(t);
    const vol = this.opt[t + "#mvol"] && this.opt[t + "#mvol"].until > Date.now() ? this.opt[t + "#mvol"].v : a.volume_level != null ? Math.round(a.volume_level * 100) : null;
    let h = this.nowCard({ art: a.entity_picture, title: a.media_title || (s.state === "playing" ? "Playing" : "Pick something to play"), sub: [a.media_artist, a.media_album_name].filter(Boolean).join(" · "), where: "on " + this.name(t) + (mem.length ? " + " + mem.length : ""), playing: s.state === "playing", act: "mact", vol, volKey: t, volKind: "mvol", zone: mem.length ? mem.length + 1 : 0 });
    const tab = this.libTab || "fav";
    if (tab !== "group" && tab !== "search") h += '<div class="lbl">Speakers</div>' + this.maSpeakers(t, mem);
    h += '<div class="chips" style="padding:0">';
    [["fav", "Favourites"], ["playlists", "Playlists"], ["artists", "Artists"], ["radio", "Radio"], ["search", "Search"], ["group", "Group"]].forEach((x) => (h += '<div class="chip' + (x[0] === tab ? " on" : "") + '" data-act="ltab" data-v="' + x[0] + '">' + x[1] + "</div>"));
    h += "</div>";
    return h + '<div class="card lib">' + this.maLib(t, tab, mem) + "</div>";
  }
  maSpeakers(t, mem) {
    let h = '<div class="spk">';
    (this.li.maPlayers || []).forEach((x) => {
      const on = x === t, g = mem.indexOf(x) >= 0, xs = this.st(x);
      h += '<div class="sk' + (on ? " on" : g ? " grp" : "") + '" data-act="mpick" data-e="' + esc(x) + '">' + line("speaker") + "<b>" + esc(this.name(x)) + "</b><small>" + (on ? "Playing on" : g ? "Joined" : xs && xs.state === "playing" ? "Playing" : "Tap to switch") + "</small>" + (on ? "" : '<div class="jn" data-act="mjoin" data-e="' + esc(x) + '">' + (g ? "✓" : "+") + "</div>") + "</div>";
    });
    return h + "</div>";
  }
  maLib(t, tab, mem) {
    if (tab === "group") {
      let h = '<div class="lbl" style="padding:2px 4px 6px">Play in more rooms with ' + esc(this.name(t)) + "</div>";
      (this.li.maPlayers || []).filter((x) => x !== t).forEach((x) => {
        const g = mem.indexOf(x) >= 0;
        h += '<div class="li" data-act="mjoin" data-e="' + esc(x) + '"><div class="a">' + line("speaker") + "</div><div><b>" + esc(this.name(x)) + "</b><small>" + (g ? "In the group" : "Not in the group") + '</small></div><span class="chip' + (g ? " on" : "") + '" style="height:30px">' + (g ? "Joined" : "Add") + "</span></div>";
      });
      return h;
    }
    if (this.libOpen) return this.tracksHtml("mtrack");
    if (tab === "search") return '<input class="inp" data-in="lq" placeholder="Search Music Assistant" value="' + esc(this.lq || "") + '" autocomplete="off"><div class="lres">' + this.maSearchHtml() + "</div>";
    const items = (this.libCache || {})[tab];
    if (!items) { this.maLoad(tab); return '<div class="empty" style="padding:20px">Loading…</div>'; }
    if (items.err) return '<div class="empty" style="padding:20px">' + esc(items.err) + "</div>";
    if (!items.length) return '<div class="empty" style="padding:20px">' + (tab === "fav" ? "No favourites yet: star playlists or stations in Music Assistant." : "Nothing here in Music Assistant yet.") + "</div>";
    return items.map((it, i) => this.libRow(this.maItem(it), "mitem", ' data-v="' + tab + ":" + i + '"')).join("");
  }
  maItem(it) {
    const mt = it.media_type;
    return { name: it.name, image: it.image, sub: mt === "radio" ? "Radio" : mt === "album" ? "Album" : mt === "artist" ? "Artist" : mt === "track" ? (it.artists && it.artists[0] && it.artists[0].name) || "Song" : "Playlist", round: mt === "artist", chev: mt !== "radio" && mt !== "track", icon: mt === "radio" ? "radio" : "music" };
  }
  maLoad(tab) {
    const c = this.libCache || (this.libCache = {});
    if (c["_" + tab]) return;
    c["_" + tab] = true;
    const lib = (mt, fav) => this._hass.callWS({ type: "ar_4c_dash/listen", op: "library", media_type: mt, favorite: !!fav }).then((r) => (r && r.items) || []);
    const p = tab === "fav" ? Promise.all([lib("playlist", true), lib("radio", true), lib("album", true)]).then((x) => x[0].concat(x[1], x[2])) : lib(tab === "playlists" ? "playlist" : tab === "artists" ? "artist" : "radio");
    p.then((items) => { c[tab] = items; }).catch((e) => { c[tab] = { err: "Music Assistant: " + (e && e.message ? e.message : "can't load this") }; }).then(() => { c["_" + tab] = false; this._render(true); });
  }
  maSearchHtml() {
    const r = this.lres;
    if (!this.lq) return '<div class="empty" style="padding:16px">Type an artist, song, playlist or station.</div>';
    if (!r) return '<div class="empty" style="padding:16px">Searching…</div>';
    let h = "";
    [["playlists", "Playlists"], ["artists", "Artists"], ["albums", "Albums"], ["tracks", "Songs"], ["radio", "Radio"]].forEach((g) => {
      const l = r[g[0]] || [];
      if (!l.length) return;
      h += '<div class="lbl" style="padding:8px 4px 2px">' + g[1] + "</div>" + l.map((it, i) => this.libRow(this.maItem(it), "mitem", ' data-v="s' + g[0] + ":" + i + '"')).join("");
    });
    return h || '<div class="empty" style="padding:16px">Nothing found.</div>';
  }
  maFind(key) {
    const [tab, i] = key.split(":");
    if (tab[0] === "s") return ((this.lres || {})[tab.slice(1)] || [])[Number(i)];
    return ((this.libCache || {})[tab] || [])[Number(i)];
  }
  // a playlist, album or artist: its songs (Home Assistant's media browser for the speaker)
  openLib(it, ent, kind) {
    this.libOpen = { name: it.name, uri: it.uri || it.id, type: it.media_type || it.type, kind, tracks: null };
    const lo = this.libOpen;
    const done = (tracks) => { if (this.libOpen === lo) { lo.tracks = tracks; this._render(true); } };
    if (kind === "sp") {
      const path = lo.type === "playlist" ? "/playlists/" + it.id + "/tracks?limit=100" : "/artists/" + it.id + "/top-tracks?market=from_token";
      this.spot().api("GET", path).then((j) => done(((j && (j.items || j.tracks)) || []).map((x) => x.track || x).filter((x) => x && x.uri).map((x) => ({ name: x.name, sub: (x.artists || []).map((a) => a.name).join(", "), uri: x.uri, image: x.album && x.album.images && x.album.images.length ? x.album.images[x.album.images.length - 1].url : "" })))).catch((e) => done({ err: e.message }));
      return;
    }
    this._hass.callWS({ type: "media_player/browse_media", entity_id: ent, media_content_id: lo.uri, media_content_type: lo.type })
      .then((b) => done(((b && b.children) || []).filter((x) => x.can_play).map((x) => ({ name: x.title, sub: "", uri: x.media_content_id, image: x.thumbnail }))))
      .catch((e) => done({ err: e && e.message ? e.message : "Can't open this" }));
  }
  tracksHtml(act) {
    const lo = this.libOpen;
    let h = '<div class="row" style="padding:2px 2px 6px"><div class="chip" data-act="lback">' + line("chevl") + "Back</div><b style=\"font-weight:400;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis\">" + esc(lo.name) + '</b><div class="chip on" data-act="' + act + '" data-v="all">' + PLAY + "Play</div></div>";
    if (!lo.tracks) return h + '<div class="empty" style="padding:20px">Loading…</div>';
    if (lo.tracks.err) return h + '<div class="empty" style="padding:20px">' + esc(lo.tracks.err) + "</div>";
    return h + lo.tracks.map((t, i) => this.libRow({ name: t.name, sub: t.sub, image: t.image, chev: false }, act, ' data-v="' + i + '"')).join("");
  }
  maPlay(t, uris, type) {
    this.call("music_assistant", "play_media", { entity_id: t, media_id: uris, media_type: type });
    this._toast("Playing on " + this.name(t));
  }
  // ---- Spotify (Spotify's Web API, with Home Assistant's Spotify login) ----
  spot() {
    if (this.sp) return this.sp;
    const card = this;
    const sp = (this.sp = {
      tok: null, exp: 0, player: null, devices: [], err: null, poll: null,
      token(force) {
        if (!force && this.tok && Date.now() < this.exp) return Promise.resolve(this.tok);
        return card._hass.callWS({ type: "ar_4c_dash/listen", op: "spotify_token" }).then((r) => {
          if (!r || !r.token) { this.err = (r && r.error) || "Spotify isn't available"; throw new Error(this.err); }
          this.err = null; this.tok = r.token; this.exp = r.expires_at ? r.expires_at * 1000 - 60000 : Date.now() + 50 * 60000;
          return this.tok;
        });
      },
      api(method, path, body, retried) {
        return this.token(false).then((tok) => fetch(path.indexOf("http") === 0 ? path : "https://api.spotify.com/v1" + path, { method, headers: Object.assign({ Authorization: "Bearer " + tok }, body ? { "Content-Type": "application/json" } : {}), body: body ? JSON.stringify(body) : undefined }).then((r) => {
          if (r.status === 401 && !retried) { this.tok = null; return this.api(method, path, body, true); }
          if (r.status === 204 || r.status === 202) return null;
          return r.text().then((t) => { let j = null; try { j = t ? JSON.parse(t) : null; } catch (e) {} if (!r.ok) throw new Error((j && j.error && (j.error.message || j.error.reason)) || "HTTP " + r.status); return j; });
        }));
      },
      refresh() {
        return Promise.all([this.api("GET", "/me/player").catch(() => null), this.api("GET", "/me/player/devices").catch(() => null)]).then((r) => {
          this.player = r[0]; this.devices = (r[1] && r[1].devices) || this.devices;
          if (card.page === "music" && card.lmode() === "spotify") card._render(true);
        }).catch((e) => { this.err = e.message; card._render(true); });
      },
      start() { if (this.poll) return; this.refresh(); this.poll = setInterval(() => this.refresh(), 4000); },
      stop() { clearInterval(this.poll); this.poll = null; },
      active() { return this.devices.filter((d) => d.is_active)[0] || (this.player && this.player.device) || null; },
      later(ms) { setTimeout(() => this.refresh(), ms || 700); },
    });
    return sp;
  }
  spHtml() {
    const sp = this.spot();
    sp.start();
    const pl = sp.player || {}, it = pl.item, dev = sp.active();
    const vh = this.opt["SP#vol"];
    const vol = vh && vh.until > Date.now() ? vh.v : dev && dev.volume_percent != null ? dev.volume_percent : null;
    let h = this.nowCard({ art: it && it.album && it.album.images && it.album.images[0] ? it.album.images[0].url : "", title: it ? it.name : sp.err ? "Spotify isn't connected" : "Pick something to play", sub: it ? (it.artists || []).map((a) => a.name).join(", ") : sp.err || "", where: dev ? "on " + this.spName(dev) : "", playing: !!pl.is_playing, act: "sact", vol, volKey: "SP", volKind: "svol" });
    const tab = this.spTab || "playlists";
    if (tab !== "group" && tab !== "search") {
      const ren = !!this.spRen;
      h += '<div class="lblr"><span class="lbl">Spotify speakers</span>' + (sp.devices.length ? (ren ? '<span class="lnk" data-act="spren-done">Done</span>' : '<span class="lnk" data-act="spren">' + line("pencil") + "Rename</span>") : "") + "</div>";
      if (ren) {
        // some amps tell Spotify a code instead of their name: name them here (every phone);
        // Play here sends the music to it, so you can hear which one it is
        h += '<div class="hint" style="text-align:left;padding:0 2px 6px">Tap Play here to hear which speaker it is, then type its name. Empty goes back to Spotify\'s name.</div>';
        sp.devices.forEach((d) => {
          const k = "spotify." + d.id, v = this.spDraft && k in this.spDraft ? this.spDraft[k] : (this.conf.names || {})[k] || "";
          h += '<div class="spr' + (d.is_active ? " on" : "") + '">' + line("speaker") + '<div class="nm"><input data-in="spname" data-k="' + esc(k) + '" value="' + esc(v) + '" placeholder="' + esc(d.name) + '" maxlength="40"><small>' + (d.is_active ? "Playing now" : esc(d.type || "Speaker")) + '</small></div><div class="chip" data-act="spick" data-v="' + esc(d.id) + '">Play here</div></div>';
        });
      } else {
        h += '<div class="spk">';
        if (!sp.devices.length) h += '<div class="hint" style="text-align:left;padding:8px 2px">' + (sp.err ? "Spotify: " + esc(sp.err) : "No Spotify speakers awake: open Spotify on one first.") + "</div>";
        sp.devices.forEach((d) => (h += '<div class="sk' + (d.is_active ? " on" : "") + '" data-act="spick" data-v="' + esc(d.id) + '">' + line("speaker") + "<b>" + esc(this.spName(d)) + "</b><small>" + (d.is_active ? "Playing on" : "Tap to switch") + "</small></div>"));
        h += "</div>";
      }
    }
    h += '<div class="chips" style="padding:0">';
    [["playlists", "Playlists"], ["liked", "Liked songs"], ["search", "Search"], ["group", "Group"]].forEach((x) => (h += '<div class="chip' + (x[0] === tab ? " on" : "") + '" data-act="stab2" data-v="' + x[0] + '">' + x[1] + "</div>"));
    h += '</div><div class="card lib">';
    if (tab === "group") h += this.spGroupHtml();
    else if (this.libOpen && this.libOpen.kind === "sp") h += this.tracksHtml("strack");
    else if (tab === "search") h += '<input class="inp" data-in="sq" placeholder="Search Spotify" value="' + esc(this.sq || "") + '" autocomplete="off"><div class="lres">' + this.spSearchHtml() + "</div>";
    else {
      const c = this.spLib || (this.spLib = {});
      const items = c[tab];
      if (!items) {
        if (!c["_" + tab]) {
          c["_" + tab] = true;
          (tab === "liked" ? sp.api("GET", "/me/tracks?limit=50").then((j) => ((j && j.items) || []).map((x) => x.track)) : sp.api("GET", "/me/playlists?limit=50").then((j) => (j && j.items) || []))
            .then((l) => (c[tab] = l.filter(Boolean))).catch((e) => (c[tab] = { err: e.message })).then(() => { c["_" + tab] = false; this._render(true); });
        }
        h += '<div class="empty" style="padding:20px">Loading…</div>';
      } else if (items.err) h += '<div class="empty" style="padding:20px">Spotify: ' + esc(items.err) + "</div>";
      else if (!items.length) h += '<div class="empty" style="padding:20px">' + (tab === "liked" ? "No liked songs yet." : "No playlists in this Spotify account.") + "</div>";
      else h += items.map((x, i) => this.libRow(this.spItem(x, it), "sitem", ' data-v="' + tab + ":" + i + '"')).join("");
    }
    return h + "</div>";
  }
  spItem(x, now) {
    const imgs = (x.album && x.album.images) || x.images || [];
    const img = imgs.length ? imgs[imgs.length - 1].url : "";
    const t = x.type;
    return { name: x.name, image: img, sub: t === "playlist" ? "Playlist" + (x.owner && x.owner.display_name ? " · " + x.owner.display_name : "") : t === "artist" ? "Artist" : (x.artists || []).map((a) => a.name).join(", "), round: t === "artist", chev: t === "playlist" || t === "artist", now: !!(now && now.uri === x.uri) };
  }
  spSearchHtml() {
    const r = this.sres;
    if (!this.sq) return '<div class="empty" style="padding:16px">Type an artist, song or playlist.</div>';
    if (!r) return '<div class="empty" style="padding:16px">Searching…</div>';
    if (r.err) return '<div class="empty" style="padding:16px">Spotify: ' + esc(r.err) + "</div>";
    let h = "";
    [["tracks", "Songs"], ["playlists", "Playlists"], ["artists", "Artists"]].forEach((g) => {
      const l = ((r[g[0]] && r[g[0]].items) || []).filter(Boolean);
      if (!l.length) return;
      h += '<div class="lbl" style="padding:8px 4px 2px">' + g[1] + "</div>" + l.map((x, i) => this.libRow(this.spItem(x), "sitem", ' data-v="s' + g[0] + ":" + i + '"')).join("");
    });
    return h || '<div class="empty" style="padding:16px">Nothing found.</div>';
  }
  spFind(key) {
    const [tab, i] = key.split(":");
    if (tab[0] === "s" && tab !== "sq") { const g = (this.sres || {})[tab.slice(1)]; return ((g && g.items) || []).filter(Boolean)[Number(i)]; }
    return ((this.spLib || {})[tab] || [])[Number(i)];
  }
  // Spotify plays on one speaker; speakers of the same make join it in sync (Home Assistant grouping)
  spLead() {
    const d = this.spot().active();
    if (!d) return null;
    const n = (x) => String(x || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const all = this.musicAll(), dn = n(this.spName(d));
    return all.filter((e) => n(this.name(e)) === dn)[0] || all.filter((e) => dn && (n(this.name(e)).indexOf(dn) >= 0 || dn.indexOf(n(this.name(e))) >= 0))[0] || null;
  }
  // a Spotify speaker's name: the one given on the dash, else Spotify's own
  spName(d) { return (this.conf && this.conf.names && this.conf.names["spotify." + d.id]) || d.name || "Speaker"; }
  musicAll() { const s = []; this.rooms.forEach((r) => r.music.forEach((e) => { if (s.indexOf(e) < 0) s.push(e); })); return s; }
  canGroup(e) { const s = this.st(e); return !!s && ((s.attributes.supported_features || 0) & 524288) !== 0; }
  plat(e) { const x = this._hass.entities && this._hass.entities[e]; return (x && x.platform) || ""; }
  spGroupHtml() {
    const d = this.spot().active();
    if (!d) return '<div class="empty" style="padding:16px">Pick a speaker first: Spotify plays there, the others join it.</div>';
    const lead = this.spLead();
    let h = '<div class="lbl" style="padding:2px 4px 6px">Playing on ' + esc(this.spName(d)) + "</div>";
    if (!lead || !this.canGroup(lead)) return h + '<div class="empty" style="padding:12px">' + (lead ? esc(this.name(lead)) + " can't group with other speakers." : "This speaker isn't one of the rooms' speakers in Setup, so it can't be grouped here.") + "</div>";
    const mem = this.maMembers(lead);
    this.musicAll().filter((e) => e !== lead).forEach((e) => {
      const g = mem.indexOf(e) >= 0, ok = this.canGroup(e) && this.plat(e) === this.plat(lead);
      h += '<div class="li"' + (ok ? ' data-act="sjoin" data-e="' + esc(e) + '"' : ' style="opacity:.5"') + '><div class="a">' + line("speaker") + "</div><div><b>" + esc(this.name(e)) + "</b><small>" + (ok ? (g ? "Playing along" : "Tap to play along") : "Can't group with " + esc(this.name(lead))) + "</small></div>" + (ok ? '<span class="chip' + (g ? " on" : "") + '" style="height:30px">' + (g ? "Joined" : "Add") + "</span>" : "") + "</div>";
    });
    return h;
  }

  // ===== Watch: sources (as on the panels), or the room's TVs =====
  pWatch() {
    const r = this.room();
    if (!r.sources.length) return this.pMedia();
    const room = this.ri, actv = (this.wst || {}).active || {};
    const act = r.whole ? (r.sources.filter((s) => actv[String(s._r)] === s._id)[0] || {}).id : actv[String(room)];
    const wv = this.wv || (this.wv = {});
    if (wv.room !== room) { wv.room = room; wv.view = null; }
    if (!wv.view) { wv.view = act ? "remote" : "pick"; wv.src = act; }
    if (wv.view === "start") return this.watchStart();
    if (wv.view === "remote" && this.srcOf(wv.src || act)) return this.watchRemote(this.srcOf(wv.src || act));
    wv.view = "pick";
    let h = '<div class="ask">What would you like to watch?</div><div class="srcs">';
    const last = (this.wLast || {})[room];
    const tile = (s) => '<div class="src' + (s.id === last ? " last" : "") + (s.hideName ? " bare" : "") + '" data-act="wgo" data-v="' + esc(s.id) + '"><div class="lg">' + this.logo(s) + "</div>" + (s.hideName ? "" : "<span>" + esc(s.name) + "</span>") + "</div>";
    if (r.whole) {
      // Whole House: the sources under their rooms
      h = '<div class="ask">What would you like to watch?</div>';
      let rn = null;
      r.sources.forEach((s) => {
        if (s._rn !== rn) { h += (rn === null ? "" : "</div>") + '<div class="lgh"><div><b>' + esc(s._rn) + '</b></div></div><div class="srcs">'; rn = s._rn; }
        h += tile(s);
      });
      return '<div class="scroll">' + h + "</div></div>";
    }
    r.sources.forEach((s) => (h += tile(s)));
    return '<div class="scroll">' + h + "</div></div>";
  }
  srcOf(id) { return this.room().sources.filter((s) => s.id === id)[0] || null; }
  // the room a source runs in (Whole House runs each source in its own room)
  wTarget(id) { const s = id && this.srcOf(id); return s && s._r != null ? { room: s._r, src: s._id } : { room: this.ri, src: id }; }
  logo(s) {
    const src = s && s.logo && s.logo.src;
    if (src && src.indexOf("lib:") === 0 && libSrc(src.slice(4))) return '<img alt="" src="' + esc(libSrc(src.slice(4))) + '">';
    if (src && src.indexOf("media:") === 0) { const m = this.media.icons.filter((x) => x.id === src.slice(6))[0]; if (m) return '<img alt="" src="' + esc(m.url) + '">'; }
    if (src && src.indexOf("lib:") !== 0 && src.indexOf("media:") !== 0) return '<img alt="" src="' + esc(src) + '">';
    return line("watch");
  }
  stepText(st) {
    const n = st.e ? this.name(st.e) : "", v = st.v ? String(st.v) : "", btn = /^(input_)?button\./.test(st.e || "");
    if (st.t === "on") return [(btn ? "Pressing " : "Turning on ") + n, ""];
    if (st.t === "press") return ["Pressing " + n, ""];
    if (st.t === "input") return ["Switching to " + (v || n), v ? n : ""];
    if (st.t === "source") return ["Source " + (v || n), v ? n : ""];
    if (st.t === "app") return ["Opening " + (v || n), v ? n : ""];
    if (st.t === "scene") return ["Running " + n, ""];
    if (st.t === "wait") return ["Waiting " + (st.s || 0) + " s", ""];
    if (st.t === "cmd") return ["Sending " + v, n];
    return [st.label || v || "Action", n];
  }
  myRun() {
    const wv = this.wv, run = (this.wst || {}).run;
    const tg = this.wTarget(wv.src);
    return run && run.id !== wv.prevRun && run.room === tg.room && wv.src && run.src === tg.src ? run : null;
  }
  watchStart() {
    const wv = this.wv, s = this.srcOf(wv.src);
    if (!s) { wv.view = "pick"; return this.pWatch(); }
    const run = this.myRun();
    const steps = run ? run.steps : (s.steps || []).map((x) => this.stepText(x));
    const state = run ? run.state : steps.map((x, i) => (i === 0 ? "go" : "wait"));
    let h = '<div class="start"><div class="lg big">' + this.logo(s) + '</div><div class="chk"><h3>Getting ' + esc(s.name) + " ready</h3>";
    steps.forEach((x, i) => {
      const st = state[i] || "wait";
      h += '<div class="st ' + st + '"><i>' + (st === "done" || st === "skip" ? "✓" : st === "fail" ? "!" : "") + "</i><span>" + esc(x[0]) + "</span><small>" + esc(st === "skip" ? "already" : st === "fail" ? "didn't answer" : x[1] || "") + "</small></div>";
    });
    if (!steps.length) h += '<div class="st done"><i>✓</i><span>Nothing to switch on</span></div>';
    if (!run && Date.now() - wv.t0 > 8500) h += '<div class="hint">Home Assistant didn\'t answer.</div><div class="chip on" style="align-self:center" data-act="wgo" data-v="' + esc(s.id) + '">Try again</div>';
    h += "</div></div>";
    if (run && run.done && !wv.doneT) {
      if (run.fails) this._toast(run.fails === 1 ? "One step didn't answer" : run.fails + " steps didn't answer");
      wv.doneT = setTimeout(() => { wv.doneT = null; if (wv.view === "start") { wv.view = "remote"; this._render(true); } }, 500);
    }
    return '<div class="scroll">' + h + "</div>";
  }
  watchRemote(s) {
    const hasRemote = !!(s.remote && s.remote.e), hasPlayer = !!s.player, volE = s.volume || s.player;
    let h = '<div class="card"><div class="nowc"><div class="lg">' + this.logo(s) + "</div><div><b>" + esc(s.name) + "</b><small>" + esc((s._rn || this.room().name) + (s.player ? " · " + this.name(s.player) : "")) + '</small></div></div><div class="two"><div class="chip" data-act="wchange">' + line("watch") + 'Change source</div><div class="chip" data-act="woff">' + line("power") + "TV off</div></div></div>";
    if (hasRemote || hasPlayer) {
      h += '<div class="card">';
      if (hasRemote) h += '<div class="dpad"><div class="dk u" data-hold="key" data-v="up">' + line("up") + '</div><div class="dk l" data-hold="key" data-v="left">' + line("chevl") + '</div><div class="dk r" data-hold="key" data-v="right">' + line("chevr") + '</div><div class="dk d" data-hold="key" data-v="down">' + line("down") + '</div><div class="okk" data-act="wkey" data-v="ok">OK</div></div>';
      const keys = hasRemote ? [["back", line("chevl")], ["home", line("home")], ["menu", MENU], ["rew", line("prev")], ["play", PLAY], ["ff", line("next")]] : [["rew", line("prev")], ["play", PLAY], ["ff", line("next")]];
      h += '<div class="keys">' + keys.map((k) => '<div class="ib' + (k[0] === "play" ? " big" : "") + '" data-act="wkey" data-v="' + k[0] + '">' + k[1] + "</div>").join("") + "</div></div>";
    }
    if (volE) h += '<div class="card"><div class="wvol"><div class="ib" data-hold="vol" data-v="-1">' + line("minus") + '</div><div class="n"><span class="lbl">Volume</span><b>' + esc(this.name(volE)) + '</b></div><div class="ib" data-hold="vol" data-v="1">' + line("plus") + '</div><div class="ib" data-act="wmute">' + line("mute") + "</div></div></div>";
    return '<div class="scroll">' + h + "</div>";
  }
  watchCmd(kind, v) {
    const room = this.wTarget(this.wv && this.wv.src).room;
    if (kind === "key") this._hass.callWS({ type: "ar_4c_dash/watch", action: "key", room, k: v }).catch(() => {});
    else if (kind === "vol") this._hass.callWS({ type: "ar_4c_dash/watch", action: "vol", room, d: Number(v) }).catch(() => {});
  }
  pScenes() {
    let h = "";
    this.room().scenes.forEach((e) => (h += '<div class="scn" data-act="scene" data-e="' + esc(e) + '">' + line("sparkle") + "<span>" + esc(this.name(e)) + "</span></div>"));
    return '<div class="scroll">' + (h ? '<div class="sgrid">' + h + "</div>" : '<div class="empty">No scenes in this room.</div>') + "</div>";
  }
  pSecurity() {
    let h = "";
    this.house.security.forEach((e) => {
      const s = this.st(e); if (!s) return;
      const armed = s.state.indexOf("armed") === 0, trig = s.state === "triggered";
      const needCode = !!s.attributes.code_format;
      h += '<div class="card"><div class="alarm' + (trig ? " trig" : armed ? " armed" : "") + '">' + line("security") + "<b>" + esc(ALARM[s.state] || s.state) + "</b><small>" + esc(this.name(e)) + "</small></div>";
      if (this.code && this.code.e === e) {
        let dots = ""; for (let i = 0; i < Math.max(4, this.code.v.length); i++) dots += "<i" + (i < this.code.v.length ? ' class="f"' : "") + "></i>";
        let keys = ""; ["1", "2", "3", "4", "5", "6", "7", "8", "9", "x", "0", "ok"].forEach((k) => (keys += '<div data-act="key" data-v="' + k + '">' + (k === "x" ? line("back") : k === "ok" ? line("chevr") : k) + "</div>"));
        h += '<div class="lbl" style="text-align:center">Enter code to ' + esc(this.code.label) + '</div><div class="code">' + dots + '</div><div class="keys">' + keys + "</div>";
      } else {
        h += '<div class="wrapc">' + (armed || trig ? '<div class="chip" data-act="arm" data-v="alarm_disarm" data-e="' + esc(e) + '" data-c="' + (needCode ? 1 : 0) + '">Disarm</div>' : '<div class="chip" data-act="arm" data-v="alarm_arm_home" data-e="' + esc(e) + '" data-c="' + (needCode ? 1 : 0) + '">Arm home</div><div class="chip" data-act="arm" data-v="alarm_arm_away" data-e="' + esc(e) + '" data-c="' + (needCode ? 1 : 0) + '">Arm away</div>') + "</div>";
      }
      h += "</div>";
    });
    return '<div class="scroll">' + (h || '<div class="empty">No alarm set up.</div>') + "</div>";
  }
  // ---- cameras: Home Assistant cameras ("camera.x") and RTSP addresses ("rtsp:0") ------------
  isRtsp(e) { return e.indexOf("rtsp:") === 0; }
  camName(e) {
    if (!this.isRtsp(e)) return this.name(e);
    const c = ((this.conf && this.conf.rtsp) || [])[Number(e.slice(5))];
    return (c && c.name) || "Camera";
  }
  camSrc(e) {
    if (this.isRtsp(e)) return (this._rsnap && this._rsnap[e]) || "";
    const s = this.st(e);
    const t = s && s.attributes.access_token;
    const at = (this._camAt || (this._camAt = {}))[e] || (this._camAt[e] = Date.now());
    return "/api/camera_proxy/" + e + "?token=" + encodeURIComponent(t || "") + "&t=" + at;
  }
  // a still of an RTSP camera, made by Home Assistant (the address never reaches the phone)
  _snap(e) {
    const h = this._hass;
    const path = "/api/ar_4c_dash/snap/" + e.slice(5);
    const get = h.fetchWithAuth ? h.fetchWithAuth(path) : fetch(path, { headers: { Authorization: "Bearer " + ((h.auth && h.auth.data && h.auth.data.access_token) || "") } });
    return get.then((r) => (r.ok ? r.blob() : null)).then((b) => {
      if (!b) return;
      const m = this._rsnap || (this._rsnap = {});
      if (m[e]) URL.revokeObjectURL(m[e]);
      m[e] = URL.createObjectURL(b);
      this.shadowRoot.querySelectorAll('img[data-cam="' + e + '"]').forEach((im) => (im.src = m[e]));
    }).catch(() => {});
  }
  // ---- cameras: every camera plays live; tap one for full screen, swipe for the next ----
  // The page's HTML doesn't change with the cameras' states, so it is never redrawn
  // under the videos; pictures and streams are put in after drawing.
  pCameras() {
    let h = "";
    this.house.cameras.forEach((e) => {
      h += '<div class="cam" data-act="cam" data-e="' + esc(e) + '"><img alt="" data-cam="' + esc(e) + '"><video playsinline muted autoplay data-cv="' + esc(e) + '"></video><span>' + esc(this.camName(e)) + '</span><i class="clive">LIVE</i></div>';
    });
    return '<div class="scroll">' + (h ? '<div class="cams">' + h + "</div>" : '<div class="empty">No cameras set up.</div>') + "</div>";
  }
  camView() {
    const e = this.viewCam, all = this.house.cameras, i = all.indexOf(e);
    let dots = "";
    if (all.length > 1) all.forEach((x, j) => (dots += "<i" + (j === i ? ' class="on"' : "") + "></i>"));
    return '<div class="view" data-cview><img class="still" alt="" data-cam="' + esc(e) + '"><video playsinline muted autoplay data-vv="' + esc(e) + '"></video><div class="vmsg">Connecting\u2026</div>' +
      '<div class="top"><div class="ib" data-act="camx">' + line("x") + '</div><div class="room">' + esc(this.camName(e)) + '</div><div class="sp"></div>' + (all.length > 1 ? '<small class="vcount">' + (i + 1) + " / " + all.length + "</small>" : "") + "</div>" +
      (all.length > 1 ? '<div class="vnav l" data-act="camnext" data-v="-1">' + line("chevl") + '</div><div class="vnav r" data-act="camnext" data-v="1">' + line("chevr") + '</div><div class="vdots">' + dots + "</div>" : "") + "</div>";
  }
  camGo(step) {
    const all = this.house.cameras; if (all.length < 2) return;
    const i = all.indexOf(this.viewCam);
    this._stopView();
    this.viewCam = all[(i + step + all.length) % all.length];
    this._camDir = step;
    this._render(true);
  }
  // one live stream on a video element; calls back when it plays or can't
  _stream(e, v, on) {
    const st = { hls: null, dead: false };
    const fail = (why) => { if (st.dead) return; st.dead = true; if (st.hls) { st.hls.destroy(); st.hls = null; } on && on(false, why); };
    const ask = this.isRtsp(e) ? { type: "ar_4c_dash/stream", index: Number(e.slice(5)) } : { type: "camera/stream", entity_id: e };
    v.addEventListener("playing", () => on && on(true), { once: true });
    this._hass.callWS(ask).then((res) => {
      if (st.dead) return;
      if (!res || !res.url) return fail();
      loadHls().then((Hls) => {
        if (st.dead) return;
        if (Hls && Hls.isSupported()) {
          const hls = (st.hls = new Hls({ liveSyncDurationCount: 2, maxBufferLength: 8, lowLatencyMode: true }));
          hls.on(Hls.Events.ERROR, (_, d) => { if (d && d.fatal) fail(); });
          hls.loadSource(res.url);
          hls.attachMedia(v);
          v.play().catch(() => {});
        } else if (v.canPlayType("application/vnd.apple.mpegurl")) { v.src = res.url; v.play().catch(() => {}); }
        else fail();
      });
    }).catch((er) => fail(er && er.message));
    st.stop = () => { st.dead = true; if (st.hls) { st.hls.destroy(); st.hls = null; } try { v.removeAttribute("src"); v.load(); } catch (x) { /* gone */ } };
    return st;
  }
  // after drawing the cameras page: pictures in, streams on (the open camera only while one is open)
  _camFill() {
    const R = this.shadowRoot, tiles = this._tiles || (this._tiles = {});
    R.querySelectorAll("img[data-cam]").forEach((im) => { const e = im.getAttribute("data-cam"), src = this.camSrc(e); if (src && !im.getAttribute("src")) im.src = src; });
    const view = !!this.viewCam;
    R.querySelectorAll("video[data-cv]").forEach((v) => {
      const e = v.getAttribute("data-cv"), t = tiles[e];
      if (view) { if (t) { t.stop(); delete tiles[e]; } return; }
      if (t && t.v === v) return;
      if (t) t.stop();
      const cam = v.closest(".cam");
      const nt = this._stream(e, v, (ok) => { if (cam) cam.classList.toggle("on", ok); if (!ok) { nt.failed = true; } });
      nt.v = v; tiles[e] = nt;
    });
    Object.keys(tiles).forEach((e) => { if (!tiles[e].v.isConnected) { tiles[e].stop(); delete tiles[e]; } });
    const vv = R.querySelector("video[data-vv]");
    if (vv && (!this._vs || this._vs.v !== vv)) {
      this._stopView();
      const e = this.viewCam, msg = R.querySelector(".vmsg");
      const vs = (this._vs = this._stream(e, vv, (ok, why) => {
        if (this._vs !== vs) return;
        if (ok) { if (msg) msg.style.display = "none"; vv.classList.add("on"); }
        else { this._liveFail = true; if (msg) msg.textContent = why ? why + ": showing pictures" : "Live video isn't available for this camera: showing pictures"; }
      }));
      vs.v = vv;
      if (this._camDir) { const d = this._camDir; this._camDir = 0; const box = R.querySelector(".view"); if (box) { box.classList.add(d > 0 ? "inr" : "inl"); } }
    }
  }
  _stopView() { if (this._vs) { this._vs.stop(); this._vs = null; } this._liveFail = false; }
  _stopLive() {
    this._stopView();
    Object.keys(this._tiles || {}).forEach((e) => this._tiles[e].stop());
    this._tiles = {};
  }
  _camLoop() {
    // still pictures under the videos (shown until a stream plays, or when one can't)
    clearInterval(this._camT);
    const tick = () => {
      if (this.page !== "cameras") return clearInterval(this._camT);
      this.house.cameras.forEach((e) => {
        if (this.viewCam && e !== this.viewCam) return;
        const t = this.viewCam ? this._vs : (this._tiles || {})[e];
        if (t && !t.dead && t.v && t.v.classList.contains("on") || (t && !t.dead && t.v && t.v.closest(".cam.on"))) return; // playing
        if (this.isRtsp(e)) return this._snap(e);
        (this._camAt || (this._camAt = {}))[e] = Date.now();
        const n = new Image();
        n.onload = () => this.shadowRoot.querySelectorAll('img[data-cam="' + e + '"]').forEach((im) => (im.src = n.src));
        n.src = this.camSrc(e);
      });
    };
    this.house.cameras.filter((e) => this.isRtsp(e) && !(this._rsnap && this._rsnap[e])).forEach((e) => this._snap(e));
    this._camT = setInterval(tick, 5000);
  }
  // ---- Utilities as a 3D slider: one big icon per section, round and round -----------
  uSecs() {
    const gm = (this.conf && this.conf.utilGroups) || {};
    const items = this.house.utilities.filter((e) => this.st(e));
    return U_SECT.map((x) => {
      const list = items.filter((e) => (gm[e] === "pool" || gm[e] === "irrigation" || gm[e] === "geyser" ? gm[e] : "more") === x[0]);
      const tog = list.filter((e) => ["switch", "light", "fan", "input_boolean"].indexOf(domain(e)) >= 0);
      const on = tog.filter((e) => this.isOn(e)).length;
      return { k: x[0], title: x[1], def: x[2], col: x[3], list, on, txt: on ? on + " running" : tog.length ? "Off" : list.length + (list.length === 1 ? " reading" : " readings") };
    }).filter((g) => g.list.length);
  }
  uIcon(g) {
    const v = this.conf && this.conf.icons && this.conf.icons["u_" + g.k];
    if (v && v !== "line") { const h = this.icon("u_" + g.k); if (h.indexOf("<img") === 0) return h; }
    return '<img alt="" src="' + esc(libSrc(g.def)) + '">';
  }
  // where icon i sits when the slider is at pos (both as whole icons; pos may be between two)
  uLay(i, pos, N) {
    let d = i - pos; d -= Math.round(d / N) * N;
    const ad = Math.abs(d), sg = d < 0 ? -1 : 1;
    const tx = sg * (Math.min(ad, 1) * 115 + Math.max(ad - 1, 0) * 56);
    return ["translateX(" + tx.toFixed(1) + "%) rotateY(" + (-sg * Math.min(ad, 1) * 46).toFixed(1) + "deg) scale(" + (1 - Math.min(ad, 1) * 0.4).toFixed(3) + ")", ad > 2.3 ? "0" : String(Math.round((1 - Math.max(ad - 0.9, 0) * 0.75) * 100) / 100)];
  }
  uHub(gs) {
    const n = gs.length, N = n * Math.max(1, Math.ceil(5 / n));
    if (!(this.uix >= 0 && this.uix < n)) this.uix = 0;
    const P = this.uix;
    let h = '<div class="u3d" data-n="' + n + '" data-nn="' + N + '"><div class="u3w">';
    gs.forEach((g, j) => (h += '<div class="u3h" style="background:radial-gradient(circle,rgba(' + g.col + ",.5),rgba(" + g.col + ",.2) 36%,rgba(" + g.col + ',0) 70%);opacity:' + (j === P ? (g.on ? 1 : 0.45) : 0.004) + '"></div>'));
    for (let i = 0; i < N; i++) { const l = this.uLay(i, P, N); h += '<div class="u3i" data-i="' + i + '" data-k="' + gs[i % n].k + '" style="transform:' + l[0] + ";opacity:" + l[1] + '">' + this.uIcon(gs[i % n]) + "</div>"; }
    gs.forEach((g, j) => (h += '<div class="u3l" style="opacity:' + (j === P ? 1 : 0.004) + '"><b>' + esc(g.title) + "</b><span>" + esc(g.txt) + "</span></div>"));
    h += '</div><div class="u3dots">' + gs.map((g, j) => '<i class="' + (j === P ? "cur" : "") + '"></i>').join("") + "</div></div>";
    return h;
  }
  // the slider's touch: drag follows the finger, a flick goes one along, a tap on the
  // front icon opens its section; it glides frame by frame from wherever it is
  uMount() {
    const box = this.app && this.app.querySelector(".pg .u3d");
    if (!box || box.__m) return;
    box.__m = true;
    const n = Number(box.getAttribute("data-n")), N = Number(box.getAttribute("data-nn"));
    const its = [...box.querySelectorAll(".u3i")], halos = [...box.querySelectorAll(".u3h")], lbs = [...box.querySelectorAll(".u3l")], dots = [...box.querySelectorAll(".u3dots i")];
    const gs = this.uSecs();
    let cur = this.uix || 0, raf = 0, x0 = null, y0 = 0, t0 = 0, dx = 0, moved = false, pos0 = 0, SP = 200, downIt = null;
    const lay = (pos) => { cur = pos; its.forEach((it, i) => { const l = this.uLay(i, pos, N); it.style.transform = l[0]; it.style.opacity = l[1]; }); };
    const rest = () => {
      const P = ((Math.round(cur) % n) + n) % n;
      this.uix = P;
      lay(Math.round(cur));
      halos.forEach((el, j) => (el.style.opacity = j === P ? (gs[j] && gs[j].on ? 1 : 0.45) : 0.004));
      lbs.forEach((el, j) => (el.style.opacity = j === P ? 1 : 0.004));
      dots.forEach((el, j) => el.classList.toggle("cur", j === P));
      box.classList.remove("drag");
      this.dragging = false;
      if (this._later) { this._later = false; this._seen = {}; this._render(true); }
    };
    const animTo = (t) => {
      cancelAnimationFrame(raf);
      const from = cur, dist = Math.abs(t - from);
      box.classList.add("drag");
      if (dist < 0.004) return rest();
      const D = Math.max(220, Math.min(460, 220 + dist * 170));
      let ts0 = 0;
      const step = (ts) => {
        if (!ts0) ts0 = ts;
        const k = Math.min(1, (ts - ts0) / D);
        lay(from + (t - from) * (1 - Math.pow(1 - k, 3)));
        if (k < 1) raf = requestAnimationFrame(step); else { raf = 0; rest(); }
      };
      raf = requestAnimationFrame(step);
    };
    box.addEventListener("pointerdown", (ev) => {
      downIt = ev.target.closest(".u3i");
      cancelAnimationFrame(raf); raf = 0;
      pos0 = cur; x0 = ev.clientX; y0 = ev.clientY; t0 = Date.now(); dx = 0; moved = false;
      SP = (box.querySelector(".u3w").getBoundingClientRect().width || 360) * 0.57;
      try { box.setPointerCapture(ev.pointerId); } catch (e) {}
    });
    box.addEventListener("pointermove", (ev) => {
      if (x0 === null) return;
      dx = ev.clientX - x0;
      if (!moved) {
        if (Math.abs(dx) < 8 || Math.abs(ev.clientY - y0) > Math.abs(dx)) return;
        moved = true; box.classList.add("drag");
      }
      this.dragging = true; this._dragAt = Date.now();
      lay(pos0 - dx / SP);
    });
    const end = (ev) => {
      if (x0 === null) return;
      x0 = null;
      if (!moved) {
        const i = downIt ? its.indexOf(downIt) : -1;
        if (ev.type !== "pointerup" || i < 0) return animTo(Math.round(cur));
        let d = i - Math.round(cur); d -= Math.round(d / N) * N;
        if (d !== 0) return animTo(Math.round(cur) + d);
        this.uix = ((Math.round(cur) % n) + n) % n;
        this.usec = downIt.getAttribute("data-k");
        this._swiped = Date.now(); // the click that follows lands on the section: drop it
        this.dragging = false;
        this._render();
        return;
      }
      this._swiped = Date.now();
      const v = dx / Math.max(1, Date.now() - t0), base = Math.round(pos0);
      let t = Math.round(cur);
      if (dx < -SP * 0.22 || v < -0.5) t = Math.max(t, base + 1);
      else if (dx > SP * 0.22 || v > 0.5) t = Math.min(t, base - 1);
      else t = base;
      animTo(t);
    };
    box.addEventListener("pointerup", end);
    box.addEventListener("pointercancel", end);
  }
  uRows(items) {
    let rows = "";
    items.forEach((e) => {
      const s = this.st(e), d = domain(e), tog = ["switch", "light", "fan", "input_boolean"].indexOf(d) >= 0;
      const val = tog ? "" : s.state + (s.attributes.unit_of_measurement ? " " + s.attributes.unit_of_measurement : "");
      rows += '<div class="row urow"><div class="nm"><b>' + esc(this.name(e)) + "</b><small>" + esc(tog ? (this.isOn(e) ? "On" : "Off") : "") + "</small></div>" + (tog ? '<div class="sw' + (this.isOn(e) ? " on" : "") + '" data-act="toggle" data-e="' + esc(e) + '"></div>' : '<div class="pc" style="font-size:20px">' + esc(val) + "</div>") + "</div>";
    });
    return rows;
  }
  pUtil() {
    // Utilities: all the switches and readings in one card; Solar on its own tab
    const so = this.solarCfg(), items = this.house.utilities.filter((e) => this.st(e));
    const tab = so && items.length ? (this.utab === "solar" ? "solar" : "items") : so ? "solar" : "items";
    let h = "";
    if (so && items.length) h += '<div class="seg" style="margin-top:12px"><div data-act="utab" data-v="items" class="' + (tab === "items" ? "on" : "") + '">Utilities</div><div data-act="utab" data-v="solar" class="' + (tab === "solar" ? "on" : "") + '">Solar</div></div>';
    if (tab === "solar") return h + '<div class="scroll">' + this.solarHtml() + "</div>";
    // 3D slider (Setup > Utilities page): the sections as big icons; tap one for its switches
    const gs = this.conf && this.conf.utilPage === "slider" ? this.uSecs() : [];
    if (gs.length > 1) {
      const g = gs.filter((x) => x.k === this.usec)[0];
      if (!g) { this.usec = null; return h + this.uHub(gs); }
      return h + '<div class="u3hd" data-act="uback"><span class="bk">' + line("chevl") + '</span><span class="ic">' + this.uIcon(g) + "</span><div><b>" + esc(g.title) + "</b><small>" + esc(g.txt) + '</small></div></div><div class="scroll"><div class="card ulist">' + this.uRows(g.list) + "</div></div>";
    }
    const rows = this.uRows(items);
    return h + '<div class="scroll">' + (rows ? '<div class="card ulist">' + rows + "</div>" : '<div class="empty">No utilities set up.</div>') + "</div>";
  }

  // ---- garage doors (whole home) ------------------------------------------------
  gState(e) {
    const s = this.st(e), d = domain(e);
    // an open/closed sensor, when one is set, says how the door is
    const sn = this.conf && this.conf.garageSensors && this.conf.garageSensors[e], ss = sn && this.st(sn);
    if (ss && ss.state !== "unavailable" && ss.state !== "unknown") {
      const v = String(ss.state).toLowerCase(), open = ["on", "open", "opening", "true", "1"].indexOf(v) >= 0;
      return { st: open ? "open" : "closed", pos: open ? 100 : 0, label: open ? "Open" : "Closed", sensor: true };
    }
    if (!s || s.state === "unavailable") return { st: "na", pos: 0, label: "Not answering" };
    if (d === "cover") {
      const p = s.attributes.current_position;
      const st = s.state, pos = typeof p === "number" ? p : st === "open" ? 100 : st === "closed" ? 0 : st === "opening" ? 55 : 45;
      const label = { open: "Open", closed: "Closed", opening: "Opening\u2026", closing: "Closing\u2026" }[st] || st;
      return { st, pos, label: label + (typeof p === "number" && (st === "opening" || st === "closing" || (st === "open" && p < 100)) ? " " + p + "%" : "") };
    }
    if (d === "lock") return { st: s.state === "unlocked" ? "open" : "closed", pos: s.state === "unlocked" ? 100 : 0, label: s.state === "unlocked" ? "Unlocked" : "Locked" };
    return { st: "relay", pos: 0, label: "Tap to open or close" }; // a relay or button: no open/closed of its own
  }
  ago(t) {
    const m = Math.round((Date.now() - new Date(t).getTime()) / 60000);
    return m < 1 ? "just now" : m < 60 ? m + " min ago" : m < 1440 ? Math.round(m / 60) + " h ago" : Math.round(m / 1440) + " d ago";
  }
  pGarage() {
    let h = "";
    this.house.garage.forEach((e) => {
      const s = this.st(e); if (!s) return;
      const g = this.gState(e), moving = g.st === "opening" || g.st === "closing", open = g.st === "open" || g.st === "opening";
      const main = g.st === "relay" ? ["press", "Open / close"] : open ? ["close", "Close"] : ["open", "Open"];
      const at = s.last_changed && (g.sensor ? (this.st(this.conf.garageSensors[e]) || {}).last_changed : s.last_changed);
      h += '<div class="card gd ' + g.st + '"><div class="gdh"><div><b>' + esc(this.name(e)) + "</b><small>" + esc(g.label) + (g.st !== "relay" && !moving && at ? " \u00b7 " + this.ago(at) : "") + '</small></div><i class="gdot"></i></div>' +
        '<div class="gdoor" data-act="gdo" data-v="' + main[0] + '" data-e="' + esc(e) + '"><div class="gin"><svg viewBox="0 0 120 40"><path d="M14 34c2-9 9-14 22-15l14-8h28c9 0 15 4 21 10 6 1 9 4 9 9v4z"/><circle cx="32" cy="34" r="6"/><circle cx="90" cy="34" r="6"/></svg></div>' +
        '<div class="gpan" data-e="' + esc(e) + '" data-to="' + Math.max(0, Math.min(96, g.pos)) + '" style="transform:translateY(-' + ((this._gp || {})[e] != null ? this._gp[e] : Math.max(0, Math.min(96, g.pos))) + '%)"></div></div>' +
        '<div class="gbt"><div class="pill gmain" data-act="gdo" data-v="' + main[0] + '" data-e="' + esc(e) + '">' + line(main[0] === "close" ? "down" : main[0] === "open" ? "up" : "garage") + main[1] + "</div></div></div>";
    });
    return '<div class="scroll">' + (h || '<div class="empty">No garage doors set up.</div>') + "</div>";
  }

  // ---- solar (Utilities): the dash's own flow, or the Energy Flow Card --------------
  solarCfg() {
    const so = this.conf && this.conf.solar;
    return so && so.mode && so.mode !== "off" && so.e && (so.e.solar_power || so.e.home_power) ? so : null;
  }
  kw(e) {
    const s = e && this.st(e); if (!s) return null;
    const v = parseFloat(s.state); if (isNaN(v)) return null;
    const u = String(s.attributes.unit_of_measurement || "W").toLowerCase();
    return u === "kw" ? v : u === "mw" ? v * 1000 : v / 1000;
  }
  kwh(e) {
    const s = e && this.st(e); if (!s) return null;
    const v = parseFloat(s.state); if (isNaN(v)) return null;
    const u = String(s.attributes.unit_of_measurement || "kWh").toLowerCase();
    return u === "wh" ? v / 1000 : u === "mwh" ? v * 1000 : v;
  }
  solarHtml() {
    const so = this.solarCfg(); if (!so) return "";
    if (so.mode === "card") {
      if (this.efc === false) return '<div class="card"><div class="hint" style="padding:6px">The Energy Flow Card isn\'t installed in Home Assistant (HACS \u2192 Dashboard). Showing the dash\'s own solar view meanwhile.</div></div>' + this.solarFlow(so);
      return '<div class="efc-host"></div>';
    }
    return this.solarFlow(so);
  }
  solarFlow(so) {
    const e = so.e, pv = this.kw(e.solar_power), soc = e.battery_soc && this.st(e.battery_soc) ? parseFloat(this.st(e.battery_soc).state) : null;
    let grid = this.kw(e.grid_power), bat = this.kw(e.battery_power), home = this.kw(e.home_power);
    if (grid != null && so.invGrid) grid = -grid;
    if (bat != null && so.invBat) bat = -bat;
    const f = (v) => (v == null ? "\u2013" : Math.abs(v) < 1 ? Math.round(Math.abs(v) * 1000) + " W" : Math.abs(v).toFixed(1) + " kW");
    // lines: from each corner to the middle; dots run the way the power goes
    const flow = (x, y, v, out, col) => {
      const on = v != null && Math.abs(v) > 0.02, sp = on ? Math.max(0.5, 2.6 - Math.min(2, Math.abs(v) / 3)) : 0;
      return '<line x1="' + x + '" y1="' + y + '" x2="180" y2="150" class="fl"/>' + (on ? '<line x1="' + x + '" y1="' + y + '" x2="180" y2="150" class="fd' + (out ? " rev" : "") + '" style="stroke:' + col + ";animation-duration:" + sp.toFixed(2) + 's"/>' : "");
    };
    const node = (x, y, cls, ic, label, val, sub) => '<div class="sn ' + cls + '" style="left:' + (x / 3.6) + "%;top:" + (y / 3) + '%"><div class="si">' + ic + "</div><b>" + val + "</b><small>" + label + (sub ? " \u00b7 " + sub : "") + "</small></div>";
    const sun = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5.3 5.3l1.7 1.7M17 17l1.7 1.7M5.3 18.7L7 17M17 7l1.7-1.7"/></svg>';
    const pyl = '<svg viewBox="0 0 24 24"><path d="M8 21l4-18 4 18M6 8h12M5 12h14M9.5 15h5M8 21l6.5-6M16 21l-6.5-6"/></svg>';
    const hse = '<svg viewBox="0 0 24 24"><path d="M3.5 11L12 4l8.5 7M6 9.5V20h12V9.5M10 20v-5h4v5"/></svg>';
    const bt = '<svg viewBox="0 0 24 24"><rect x="6.5" y="4.5" width="11" height="17" rx="2"/><path d="M10 2.5h4"/><rect x="8.5" y="' + (19.5 - 13 * Math.max(0, Math.min(100, soc || 0)) / 100).toFixed(1) + '" width="7" height="' + (13 * Math.max(0, Math.min(100, soc || 0)) / 100).toFixed(1) + '" rx="1" class="bf"/></svg>';
    let svg = '<svg class="sflow" viewBox="0 0 360 300" preserveAspectRatio="none">';
    if (e.solar_power) svg += flow(180, 52, pv, false, "#f2b84b");
    if (e.grid_power) svg += flow(58, 150, grid, grid != null && grid < 0, "#5fd3a0");
    if (e.home_power) svg += flow(302, 150, home, true, "#c9b6ff");
    if (e.battery_power) svg += flow(180, 250, bat, bat != null && bat > 0, "#6cc7f0");
    svg += '<circle cx="180" cy="150" r="9" class="hub"/></svg>';
    let h = '<div class="card solar"><div class="sh"><b>Solar</b>' + (soc != null ? "<small>Battery " + Math.round(soc) + "%</small>" : "") + '</div><div class="sbox">' + svg;
    if (e.solar_power) h += node(180, 52, "pv", sun, "Solar", f(pv));
    if (e.grid_power) h += node(58, 150, "gr", pyl, grid != null && grid < -0.02 ? "Selling" : "Grid", f(grid));
    if (e.home_power) h += node(302, 150, "hm", hse, "Home", f(home));
    if (e.battery_power || e.battery_soc) h += node(180, 250, "bt", bt, bat != null && bat > 0.02 ? "Charging" : bat != null && bat < -0.02 ? "Using" : "Battery", e.battery_power ? f(bat) : Math.round(soc || 0) + "%", e.battery_power && soc != null ? Math.round(soc) + "%" : "");
    h += "</div>";
    const tot = [["solar_daily", "Solar", "pv"], ["grid_import_daily", "Grid in", "gr"], ["grid_export_daily", "Grid out", "gr"], ["home_daily", "Home", "hm"]].filter((x) => e[x[0]]);
    if (tot.length) h += '<div class="lbl" style="margin:4px 2px 0">Today</div><div class="stot">' + tot.map((x) => { const v = this.kwh(e[x[0]]); return '<div class="' + x[2] + '"><b>' + (v == null ? "\u2013" : v.toFixed(1)) + "<i>kWh</i></b><small>" + x[1] + "</small></div>"; }).join("") + "</div>";
    return h + "</div>";
  }
  // the Energy Flow Card (HACS), kept alive across redraws and fed this dash's entities
  efcMount() {
    const so = this.solarCfg(), host = this.shadowRoot.querySelector(".efc-host");
    if (!so || so.mode !== "card" || !host) return;
    if (!customElements.get("energy-flow-card")) {
      if (this.efc === undefined) {
        this.efc = null;
        const done = () => { this.efc = customElements.get("energy-flow-card") ? true : false; this._render(true); };
        this._hass.callWS({ type: "lovelace/resources" }).then((rs) => {
          const r = (rs || []).filter((x) => /energy-flow-card(\.js)?(\?|$)/.test(x.url || ""))[0];
          if (!r) return done();
          // a script tag, as Home Assistant loads dashboard resources (the card finds its icons from it)
          const sc = document.createElement("script");
          sc.type = "module"; sc.src = r.url; sc.onerror = done;
          document.head.appendChild(sc);
          customElements.whenDefined("energy-flow-card").then(done);
          setTimeout(() => { if (this.efc === null) done(); }, 15000);
        }).catch(done);
      }
      return;
    }
    const cfg = Object.assign({ type: "custom:energy-flow-card", inverter_preset: so.preset || "default", theme_mode: "dark", sun_entity: "sun.sun", show_totals: false, compact: true }, so.e);
    if (this.conf.weather) cfg.weather_entity = this.conf.weather;
    if (so.invGrid) cfg.invert_grid_sign = true;
    if (so.invBat) cfg.invert_battery_sign = true;
    const key = JSON.stringify(cfg);
    if (!this.efcEl || this.efcKey !== key) { this.efcEl = document.createElement("energy-flow-card"); this.efcEl.setConfig(cfg); this.efcKey = key; }
    this.efcEl.hass = this._hass;
    if (this.efcEl.parentNode !== host) host.appendChild(this.efcEl);
  }

  // ---- who's home (home screen) ------------------------------------------------------
  // ---- under the settings corner: temperature, sunrise / sunset, motion ------------
  statusHtml() {
    const c = (this.conf && this.conf.status) || {};
    let h = "", row = "";
    if (c.temp) {
      const s = this.st(c.temp);
      let v = s ? (domain(c.temp) === "weather" ? s.attributes.temperature : domain(c.temp) === "climate" ? s.attributes.current_temperature : s.state) : null;
      // a humidity sensor shows as % with a droplet; anything else as degrees
      const hum = s && domain(c.temp) === "sensor" && (s.attributes.device_class === "humidity" || s.attributes.unit_of_measurement === "%");
      if (v != null && !isNaN(parseFloat(v))) row += '<div class="sti">' + (hum ? DROP : line("climate")) + "<b>" + Math.round(parseFloat(v) * 10) / 10 + (hum ? "%" : "\u00b0") + "</b></div>";
    }
    if (c.sun) {
      const s = this.st("sun.sun"), t = (x) => (x ? new Date(x).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }) : "\u2013");
      if (s) row += '<div class="sti sun"><span>' + SUNUP + t(s.attributes.next_rising) + "</span><span>" + SUNDN + t(s.attributes.next_setting) + "</span></div>";
    }
    h += row;
    if (c.motion) {
      // only while something moves: which room (by its presence sensor)
      const rooms = (this.rooms || []).filter((r) => !r.whole && (r.presence || []).some((e) => { const x = this.st(e); return x && (x.state === "on" || x.state === "detected" || x.state === "home"); }));
      rooms.forEach((r) => (h += '<div class="sti mot"><i></i><span>' + esc(r.name) + "</span></div>"));
    }
    const z = Math.max(1, Math.min(1.5, Number((this.conf && this.conf.statusScale) || 1)));
    return h ? '<div class="stat"><div class="stz" style="zoom:' + z + '">' + h + "</div></div>" : "";
  }
  // the home buttons' look, shared by every phone (a phone's own older choice until one is set)
  look() { return this.conf && this.conf.look ? this.conf.look : this.P.look === "bare" ? "bare" : "rings"; }
  peopleOn() { const p = this.conf && this.conf.people; return !!(p && p.on && Array.isArray(p.list) && p.list.length); }
  peopleHtml() {
    if (!this.peopleOn()) return "";
    let h = '<div class="ppl">';
    this.conf.people.list.forEach((e) => {
      const s = this.st(e); if (!s) return;
      // people show their first name; a phone (device tracker) its own name
      const home = s.state === "home", nm = domain(e) === "person" ? this.name(e).split(" ")[0] : this.name(e);
      const zone = home ? "Home" : s.state === "not_home" ? "Away" : s.state === "unknown" || s.state === "unavailable" ? "\u2013" : (this.st("zone." + s.state) ? this.name("zone." + s.state) : s.state.replace(/_/g, " "));
      const pic = s.attributes.entity_picture;
      const av = pic ? '<img alt="" src="' + esc(this._hass.hassUrl ? this._hass.hassUrl(pic) : pic) + '">' : "<span>" + esc(nm.slice(0, 1).toUpperCase()) + "</span>";
      h += '<div class="pp' + (home ? " home" : "") + '"><div class="av">' + av + "<i></i></div><b>" + esc(nm) + "</b><small>" + esc(zone) + "</small></div>";
    });
    return h + "</div>";
  }

  // ---- sheets: rooms + settings ---------------------------------------------------
  sheetHtml() {
    if (this.sheet === "rooms") {
      let h = "";
      this.rooms.forEach((r, i) => {
        const n = r.lights.filter((e) => this.isOn(e)).length;
        h += '<div class="rm' + (i === this.ri ? " on" : "") + '" data-act="room" data-v="' + i + '"><b>' + esc(r.name) + "</b><small>" + (r.lights.length ? (n ? n + " on" : "Lights off") : "") + "</small></div>";
      });
      return '<div class="sheet"><div class="shh"><b>Rooms</b><div class="ib" data-act="close">' + line("x") + '</div></div><div class="shb">' + h + "</div></div>";
    }
    const tab = this.setTab || "icons";
    let h = '<div class="chips" style="padding:0 4px 4px"><div class="chip' + (tab === "icons" ? " on" : "") + '" data-act="stab" data-v="icons">Icons</div><div class="chip' + (tab === "look" ? " on" : "") + '" data-act="stab" data-v="look">Look</div>' + (this.admin ? '<div class="chip' + (tab === "setup" ? " on" : "") + '" data-act="stab" data-v="setup">Setup</div>' : "") + "</div>";
    if (tab === "setup" && this.admin) return '<div class="sheet"><div class="shh"><b>Settings</b><div class="ib" data-act="close">' + line("x") + '</div></div><div class="shb">' + h + this.setupHtml() + "</div>" + (this.pick ? this.pickHtml() : "") + (this.logoPick ? this.logoPickHtml() : "") + "</div>";
    if (tab === "icons") {
      h += '<div class="hint" style="text-align:left;padding:4px 4px 2px">An icon you change here changes on every phone.</div>';
      // the Utilities 3D slider's sections come after the home buttons
      const usl = this.conf && this.conf.utilPage === "slider" ? this.uSecs() : [];
      const ug = {}; (usl.length > 1 ? usl : []).forEach((g) => (ug["u_" + g.k] = g));
      ORDER.filter((k) => this.cats().indexOf(k) >= 0).concat(Object.keys(ug)).forEach((k) => {
        const mine = this.conf && this.conf.icons && this.conf.icons[k];
        const sec = ug[k];
        h += '<div class="it' + (this.icOpen === k ? " open" : "") + '"><div class="ih" data-act="icopen" data-v="' + k + '"><span class="now">' + (sec ? this.uIcon(sec) : this.icon(k)) + "</span><b>" + (sec ? "Utilities: " + sec.title : TITLES[k]) + "</b><small>" + (mine ? "Changed" : "As set up") + "</small></div>";
        if (this.icOpen === k) {
          const cat = this.icCat || (sec ? "Utilities" : IC_FOR[k]) || "all";
          h += '<div class="cats">';
          [["all", "All"]].concat(IC_CATS.map((c) => [c, c])).forEach((c) => (h += '<div class="chip' + (c[0] === cat ? " on" : "") + '" data-act="iccat" data-v="' + esc(c[0]) + '">' + esc(c[1]) + "</div>"));
          h += '</div><div class="ig">';
          const tile = (v, html, l) => (h += '<div class="tile' + ((mine || "") === v ? " on" : "") + '" data-act="icpick" data-k="' + k + '" data-v="' + esc(v) + '"><i>' + html + "</i><span>" + esc(l) + "</span></div>");
          if (sec) tile("", '<img alt="" src="' + esc(libSrc(sec.def)) + '">', "As set up");
          else { tile("", this.instIcon(k), "As set up"); tile("line", line(k), "Line"); }
          h += '<label class="tile up"><i>' + line("plus") + '</i><span>Upload</span><input type="file" accept="image/*" data-in="iconfile" data-k="' + k + '" hidden></label>';
          (this.up.icon || []).forEach((u) => (h += '<div class="tile' + ((mine || "") === u ? " on" : "") + '" data-act="icpick" data-k="' + k + '" data-v="' + esc(u) + '"><i><img alt="" src="' + esc(u) + '"></i><span>Yours</span><b class="tdel" data-act="up-del" data-kind="icon" data-v="' + esc(u) + '">' + line("x") + "</b></div>"));
          this.media.icons.forEach((m) => tile("media:" + m.id, '<img alt="" src="' + esc(m.url) + '">', m.name || "Uploaded"));
          (cat === "all" ? IC_CATS : [cat]).forEach((c) => {
            const names = Object.keys(LIB || {}).filter((n) => LIB[n].c === c);
            if (!names.length) return;
            h += '<div class="gh">' + esc(c) + "</div>";
            names.forEach((n) => tile("lib:" + n, '<img alt="" src="' + esc(libSrc(n)) + '">', LIB[n].n || n));
          });
          h += "</div>";
        }
        h += "</div>";
      });
    } else {
      h += '<div class="setrow"><span class="lbl">Buttons</span><div class="chip' + (this.look() !== "bare" ? " on" : "") + '" data-act="look" data-v="rings">Rings</div><div class="chip' + (this.look() === "bare" ? " on" : "") + '" data-act="look" data-v="bare">Icons only</div></div>';
      const st = (this.conf && this.conf.status) || {};
      if (st.temp || st.sun || st.motion) {
        const z = Math.round(Math.max(1, Math.min(1.5, Number(this.conf.statusScale || 1))) * 100);
        h += '<div class="setrow" style="flex-wrap:wrap"><span class="lbl">Top right size</span><span class="lbl" data-zv style="margin-left:auto">' + z + '%</span><input type="range" class="rng" data-in="ssize" min="100" max="150" step="5" value="' + z + '"></div>';
      }
      h += '<div class="lbl" style="padding:6px 4px">Background</div><div class="bgs">';
      const bt = (v, img, l) => (h += '<div class="bgt' + ((this.P.bg || "") === v ? " on" : "") + '" data-act="bg" data-v="' + esc(v) + '"><i style="background-image:url(&quot;' + esc(img) + '&quot;)"></i><small>' + esc(l) + "</small></div>");
      bt("", this.url(this.room().image) || this.url(this.rc.houseImage) || BASE + "/backgrounds/thumbs/villa.jpg", "As set up");
      h += '<label class="bgt up"><i>' + line("plus") + '</i><small>Upload photo</small><input type="file" accept="image/*" data-in="bgfile" hidden></label>';
      (this.up.bg || []).forEach((u) => (h += '<div class="bgt' + ((this.P.bg || "") === u ? " on" : "") + '" data-act="bg" data-v="' + esc(u) + '"><i style="background-image:url(&quot;' + esc(u) + '&quot;)"></i><small>Yours</small><b class="tdel" data-act="up-del" data-kind="bg" data-v="' + esc(u) + '">' + line("x") + "</b></div>"));
      this.media.backgrounds.forEach((m) => bt("media:" + m.id, m.url, m.name || "Uploaded"));
      Object.keys(PRESETS).forEach((k) => bt("preset:" + k, BASE + "/backgrounds/thumbs/" + PRESETS[k], BG_NAMES[k] || k));
      h += "</div>";
    }
    return '<div class="sheet"><div class="shh"><b>Settings</b><div class="ib" data-act="close">' + line("x") + '</div></div><div class="shb">' + h + "</div>" + (this.logoUp ? '<div class="pick">' + this.upHtml() + "</div>" : "") + "</div>";
  }
  upList(kind) {
    return this._hass.callWS({ type: "ar_4c_dash/logo", op: "list", kind }).then((r) => { this.up[kind] = (r && r.logos) || []; this._render(true); }).catch(() => {});
  }
  bgFile(f) {
    if (!f) return;
    const img = new Image(), u = URL.createObjectURL(f);
    img.onload = () => {
      // a photo for the background: shrunk for phones, sent as JPEG
      const k = Math.min(1, 1920 / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement("canvas");
      c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(u);
      this._toast("Uploading\u2026");
      this._hass.callWS({ type: "ar_4c_dash/logo", op: "upload", kind: "bg", data: c.toDataURL("image/jpeg", 0.86) }).then((r) => {
        this.P.bg = r.url; this._save(); this.upList("bg"); this._toast("Background set");
      }).catch((er) => this._toast(er && er.message ? er.message : "Couldn't upload the photo"));
    };
    img.onerror = () => { URL.revokeObjectURL(u); this._toast("That picture can't be opened"); };
    img.src = u;
  }

  // ---- Setup (admins): rooms and what is in them, saved for everyone ----------------
  draftStart() {
    this.draft = JSON.parse(JSON.stringify(this.conf || { rooms: [] }));
    if (!Array.isArray(this.draft.rooms)) this.draft.rooms = [];
    this.dirty = false;
    this.sOpen = this.draft.rooms.length ? 0 : null;
    this.pick = null;
    // AR NSPanel Pro installed? then its panels can be copied from (optional)
    this.nsp = null;
    this._hass.callWS({ type: "ar_nspanel_pro/list" }).then((l) => { this.nsp = (l && l.panels) || []; this._render(true); }).catch(() => {});
  }
  chipsFor(arr, where) {
    let h = '<div class="wrapc" style="justify-content:flex-start">';
    (arr || []).forEach((e, i) => (h += '<div class="chip" data-act="s-rm" data-w="' + where + '" data-v="' + i + '">' + esc(this.st(e) ? this.name(e) : e) + line("x") + "</div>"));
    h += '<div class="chip" style="border-style:dashed" data-act="s-pick" data-w="' + where + '">' + line("plus") + "Add</div></div>";
    return h;
  }
  setupHtml() {
    if (!this.draft) this.draftStart();
    const d = this.draft;
    let h = '<div class="lbl" style="padding:10px 4px 2px">Rooms</div>';
    d.rooms.forEach((rm, i) => {
      const n = SETUP_CATS.reduce((t, c) => t + ((rm[c[0]] || []).length), 0);
      h += '<div class="it' + (this.sOpen === i ? " open" : "") + '"><div class="ih" data-act="s-open" data-v="' + i + '"><span class="now">' + line(rm.whole ? "rooms" : "home") + "</span><b>" + esc(rm.name || "Room " + (i + 1)) + "</b><small>" + (rm.whole ? "All rooms" : n + (n === 1 ? " device" : " devices") + ((rm.sources || []).length ? " \u00b7 " + rm.sources.length + " to watch" : "")) + "</small></div>";
      if (this.sOpen === i) {
        h += '<div class="sbody"><input class="inp" data-in="name" data-v="' + i + '" value="' + esc(rm.name || "") + '" placeholder="Room name" maxlength="40">';
        if (rm.whole) h += '<div class="hint" style="text-align:left;padding:0">Everything from every room: the lights, speakers and TVs. Move it to where you want it in the list.</div><div class="lbl">Whole-house scenes</div><div class="hint" style="text-align:left;padding:0">Shown on the home screen, and on Scenes and Lights in every room.</div>' + this.chipsFor(rm.scenes, i + ":scenes");
        const lOn = typeof rm.listen === "boolean" ? rm.listen : rm.whole || list(rm.music).length > 0;
        h += '<div class="lbl">Listen in this room</div><div class="wrapc" style="justify-content:flex-start"><div class="chip' + (lOn ? " on" : "") + '" data-act="s-listen" data-v="' + i + '" data-on="1">On</div><div class="chip' + (lOn ? "" : " on") + '" data-act="s-listen" data-v="' + i + '" data-on="0">Off</div></div>';
        if (!rm.whole) {
          SETUP_CATS.forEach((c) => (h += '<div class="lbl">' + c[1] + "</div>" + this.chipsFor(rm[c[0]], i + ":" + c[0])));
          h += this.sourcesHtml(rm, i);
        }
        h += '<div class="wrapc" style="justify-content:flex-start;margin-top:6px">' + (i > 0 ? '<div class="chip" data-act="s-mv" data-v="' + i + '" data-d="-1">' + line("up") + "Move up</div>" : "") + (i < d.rooms.length - 1 ? '<div class="chip" data-act="s-mv" data-v="' + i + '" data-d="1">' + line("down") + "Move down</div>" : "") + '<div class="chip" data-act="s-del" data-v="' + i + '" style="color:#ff9a8a">' + (this.delArm === i ? "Tap again to delete" : "Delete room") + "</div></div></div>";
      }
      h += "</div>";
    });
    h += '<div class="wrapc" style="justify-content:flex-start;margin-top:10px"><div class="chip" style="border-style:dashed" data-act="s-add">' + line("plus") + "Add room</div>" + (d.rooms.some((x) => x.whole) ? "" : '<div class="chip" style="border-style:dashed" data-act="s-whole">' + line("plus") + "Add Whole House</div>") + "</div>";
    {
      // where Listen's music comes from: Home Assistant's own integrations hold the logins
      const li = this.li || {}, n = (li.maPlayers || []).length;
      h += '<div class="lbl" style="padding:18px 4px 6px">Music</div><div class="card" style="background:transparent;padding:12px;gap:10px">';
      h += '<div class="srow"><div><b style="font-weight:500">Music Assistant</b><div class="hint" style="text-align:left;padding:0">' + (li.ma ? "Linked through Home Assistant \u00b7 " + n + (n === 1 ? " speaker" : " speakers") : "Not linked yet: add the Music Assistant integration in Home Assistant with your Music Assistant server address and login.") + '</div></div><div class="chip" data-act="s-goto" data-v="' + (li.ma ? "/config/integrations/integration/music_assistant" : "/config/integrations/dashboard/add?domain=music_assistant") + '">' + (li.ma ? "Open" : "Link") + "</div></div>";
      h += '<div class="srow"><div><b style="font-weight:500">Spotify</b><div class="hint" style="text-align:left;padding:0">' + (li.spotify ? "Linked through Home Assistant (Spotify or SpotifyPlus)" : "Not linked yet: add Spotify (or SpotifyPlus from HACS) in Home Assistant and sign in.") + '</div></div><div class="chip" data-act="s-goto" data-v="' + (li.spotify ? "/config/integrations/integration/spotify" : "/config/integrations/dashboard/add?domain=spotify") + '">' + (li.spotify ? "Open" : "Link") + "</div></div></div>";
    }
    if (this.li && this.li.ma && this.li.spotify) h += '<div class="lbl" style="padding:18px 4px 6px">Listen opens on</div><div class="wrapc" style="justify-content:flex-start"><div class="chip' + (d.listenStart !== "spotify" ? " on" : "") + '" data-act="s-lstart" data-v="ma">Music Assistant</div><div class="chip' + (d.listenStart === "spotify" ? " on" : "") + '" data-act="s-lstart" data-v="spotify">Spotify</div></div>';
    h += '<div class="lbl" style="padding:18px 4px 2px">Whole home</div><div class="card" style="background:transparent;padding:12px">';
    HOUSE_CATS.forEach((c) => {
      h += '<div class="lbl">' + c[1] + "</div>" + this.chipsFor(d[c[0]], "h:" + c[0]);
      if (c[0] === "utilities" && (d.utilities || []).length) {
        const sl = d.utilPage === "slider", ug = d.utilGroups || {};
        h += '<div class="srow"><div><b style="font-weight:500">3D view</b><div class="hint" style="text-align:left;padding:0">' + (sl ? "On: Utilities opens on the 3D icons" : "Off: the plain list of switches") + '</div></div><div class="sw' + (sl ? " on" : "") + '" data-act="u-page" data-v="' + (sl ? "list" : "slider") + '"></div></div>';
        if (sl) {
          h += '<div class="hint" style="text-align:left;padding:0">Each section is one big icon to swipe through (round and round); tap it for its switches. Put each one in its section. The icons: Settings &gt; Icons (pick one or upload your own).</div>';
          d.utilities.forEach((e) => { const g = ug[e] || "more"; h += '<div class="srow" style="flex-wrap:wrap"><small style="flex:1 1 100%">' + esc(this.name(e)) + "</small>" + U_SECT.map((x) => '<div class="chip' + (g === x[0] ? " on" : "") + '" data-act="u-sec" data-e="' + esc(e) + '" data-v="' + x[0] + '">' + x[1] + "</div>").join("") + "</div>"; });
        }
      }
      if (c[0] === "garage" && (d.garage || []).length) {
        // each door: an optional sensor that says open or closed
        h += '<div class="hint" style="text-align:left;padding:0">Shown on the Whole House home screen. Optional: a sensor that says whether each door is open or closed.</div>';
        d.garage.forEach((e) => { const sn = (d.garageSensors || {})[e]; h += '<div class="srow"><small>' + esc(this.name(e)) + "</small>" + (sn ? '<div class="chip" data-act="gs-clr" data-e="' + esc(e) + '">' + esc(this.name(sn)) + line("x") + "</div>" : '<div class="chip" style="border-style:dashed" data-act="s-pick" data-w="h:gsensor:' + esc(e) + '">' + line("plus") + "Open/closed sensor</div>") + "</div>"; });
      }
    });
    h += '<div class="lbl">Weather</div>' + this.chipsFor(d.weather ? [d.weather] : [], "h:weather");
    // top right of the home screen, under the settings corner
    const sc = d.status || {}, onOff = (k, on) => '<div class="wrapc" style="justify-content:flex-start"><div class="chip' + (on ? "" : " on") + '" data-act="s-stat" data-v="' + k + '" data-on="0">Off</div><div class="chip' + (on ? " on" : "") + '" data-act="s-stat" data-v="' + k + '" data-on="1">Show</div></div>';
    h += '<div class="lbl">Top right: temperature or humidity</div><div class="hint" style="text-align:left;padding:0">Your weather (its temperature), a temperature sensor, a humidity sensor (shown as %) or an aircon (its room temperature).</div>' + this.chipsFor(sc.temp ? [sc.temp] : [], "h:ptemp");
    h += '<div class="lbl">Top right: sunrise & sunset</div>' + onOff("sun", sc.sun);
    h += '<div class="lbl">Top right: motion</div>' + onOff("motion", sc.motion) + (sc.motion ? '<div class="hint" style="text-align:left;padding:0">Shows a room while its presence / motion sensor (set in each room) sees someone; nothing when nobody is moving.</div>' : "");
    // who's home on the home screen
    const pe = d.people || {};
    h += '<div class="lbl">Who\'s home (home screen)</div><div class="wrapc" style="justify-content:flex-start"><div class="chip' + (pe.on ? "" : " on") + '" data-act="s-ppl" data-v="0">Off</div><div class="chip' + (pe.on ? " on" : "") + '" data-act="s-ppl" data-v="1">Show</div></div>';
    if (pe.on) h += '<div class="hint" style="text-align:left;padding:0">Only the people and phones added here show on the home screen (people, or device trackers such as the Home Assistant app on a phone).</div>' + this.chipsFor(pe.list || [], "h:people");
    // solar (Utilities)
    const so = d.solar || {}, sm = so.mode || "off";
    h += '<div class="lbl">Solar (in Utilities)</div><div class="wrapc" style="justify-content:flex-start">' + [["off", "Off"], ["simple", "Dash view"], ["card", "Energy Flow Card"]].map((x) => '<div class="chip' + (sm === x[0] ? " on" : "") + '" data-act="s-solar" data-v="' + x[0] + '">' + x[1] + "</div>").join("") + "</div>";
    if (sm !== "off") {
      h += '<div class="hint" style="text-align:left;padding:0">' + (sm === "card" ? "Your Energy Flow Card (HACS), sized for the phone, fed with these sensors." : "The dash's own solar view.") + " Leave out what you don't have.</div>";
      SOLAR_KEYS.forEach((k) => { const v = (so.e || {})[k[0]]; h += '<div class="srow"><small>' + k[1] + "</small>" + (v ? '<div class="chip" data-act="so-clr" data-v="' + k[0] + '">' + esc(this.name(v)) + line("x") + "</div>" : '<div class="chip" style="border-style:dashed" data-act="s-pick" data-w="h:solar:' + k[0] + '">' + line("plus") + "Choose</div>") + "</div>"; });
      if (sm === "card") h += '<div class="lbl">Inverter</div><select class="sel" data-in="so-preset">' + INVERTERS.map((x) => '<option value="' + x[0] + '"' + ((so.preset || "default") === x[0] ? " selected" : "") + ">" + x[1] + "</option>").join("") + "</select>";
      h += '<div class="wrapc" style="justify-content:flex-start"><div class="chip' + (so.invGrid ? " on" : "") + '" data-act="so-inv" data-v="invGrid">Flip grid direction</div><div class="chip' + (so.invBat ? " on" : "") + '" data-act="so-inv" data-v="invBat">Flip battery direction</div></div>';
    }
    h += '<div class="lbl">RTSP cameras</div><div class="hint" style="text-align:left;padding:0">Cameras that aren\'t in Home Assistant: their address, e.g. rtsp://admin:password@192.168.1.64:554/Streaming/Channels/102. Only admins ever see the address.</div>';
    (d.rtsp || []).forEach((c, i) => (h += '<div class="rtr"><input class="inp" data-in="rname" data-v="' + i + '" value="' + esc(c.name || "") + '" placeholder="Name" maxlength="40"><input class="inp" data-in="rurl" data-v="' + i + '" value="' + esc(c.url || "") + '" placeholder="rtsp://\u2026" autocapitalize="off" autocomplete="off" spellcheck="false"><div class="chip" data-act="r-rm" data-v="' + i + '">' + line("x") + "Remove</div></div>"));
    h += '<div class="chip" style="border-style:dashed;align-self:flex-start" data-act="r-add">' + line("plus") + "Add RTSP camera</div></div>";
    h += this.namesHtml(d);
    if (this.nsp && this.nsp.length) {
      h += '<div class="lbl" style="padding:18px 4px 6px">Copy from an AR NSPanel Pro panel</div><div class="wrapc" style="justify-content:flex-start">';
      this.nsp.forEach((pn) => (h += '<div class="chip" data-act="s-import" data-v="' + esc(pn.device_id) + '">' + (this.impArm === pn.device_id ? "Tap again: replaces this setup" : esc(pn.name || pn.device_id)) + "</div>"));
      h += "</div>";
    }
    h += '<div style="position:sticky;bottom:0;padding:16px 0 4px;background:linear-gradient(transparent,rgba(16,15,19,.98) 30%)"><div class="pill" data-act="s-save" style="justify-content:center;background:' + (this.dirty ? "rgba(var(--accrgb),.92);color:#2a2116;border-color:transparent" : "var(--glass)") + '">' + (this.dirty ? "Save for everyone" : "Saved") + "</div></div>";
    return h;
  }
  // ---- Watch sources (the same format as the panels') ----
  sourcesHtml(rm, i) {
    let h = '<div class="lbl" style="margin-top:6px">Watch sources</div><div class="hint" style="text-align:left;padding:0">"What would you like to watch?": each source switches on what it needs, step by step, then shows its remote.</div>';
    (rm.sources || []).forEach((sc, j) => {
      const key = i + ":" + j, open = this.wsOpen === key;
      h += '<div class="it' + (open ? " open" : "") + '" style="margin-top:4px"><div class="ih" data-act="w-open" data-v="' + key + '"><span class="now lgs">' + this.logo(sc) + "</span><b>" + esc(sc.name || "Source") + "</b><small>" + (sc.steps || []).length + " steps</small></div>";
      if (open) {
        h += '<div class="sbody"><input class="inp" data-in="sname" data-v="' + key + '" value="' + esc(sc.name || "") + '" placeholder="Name, e.g. Netflix" maxlength="40">';
        h += '<div class="wrapc" style="justify-content:flex-start"><div class="chip" data-act="s-logo" data-v="' + key + '">' + line("icons") + "Choose logo</div></div>";
        h += '<div class="lbl">On the Watch page</div><div class="wrapc" style="justify-content:flex-start"><div class="chip' + (sc.hideName ? "" : " on") + '" data-act="s-hname" data-v="' + key + '" data-h="0">Name under logo</div><div class="chip' + (sc.hideName ? " on" : "") + '" data-act="s-hname" data-v="' + key + '" data-h="1">Logo only</div></div>';
        h += '<div class="lbl">Steps</div>';
        (sc.steps || []).forEach((st, k) => (h += this.stepHtml(st, key + ":" + k)));
        h += '<div class="chip" style="border-style:dashed;align-self:flex-start" data-act="st-add" data-v="' + key + '">' + line("plus") + "Add step</div>";
        const one = (label, f, val, extra) => '<div class="lbl">' + label + '</div><div class="wrapc" style="justify-content:flex-start">' + (val ? '<div class="chip" data-act="w-clr" data-v="' + key + ":" + f + '">' + esc(this.name(val)) + line("x") + "</div>" : '<div class="chip" style="border-style:dashed" data-act="s-pick" data-w="w:' + key + ":" + f + '">' + line("plus") + "Choose</div>") + (extra || "") + "</div>";
        const kind = (sc.remote && sc.remote.kind) || "appletv";
        h += one("Remote", "remote", sc.remote && sc.remote.e, sc.remote && sc.remote.e ? '<select class="inp sel" data-in="rkind" data-v="' + key + '">' + [["appletv", "Apple TV"], ["androidtv", "Android TV"], ["roku", "Roku"], ["ir", "IR / other"]].map((o) => '<option value="' + o[0] + '"' + (o[0] === kind ? " selected" : "") + ">" + o[1] + "</option>").join("") + "</select>" : "");
        h += one("Player (play / pause)", "player", sc.player);
        h += one("Volume", "volume", sc.volume);
        h += '<div class="wrapc" style="justify-content:flex-start;margin-top:6px"><div class="chip" data-act="w-del" data-v="' + key + '" style="color:#ff9a8a">' + (this.wDelArm === key ? "Tap again to delete" : "Delete source") + "</div></div></div>";
      }
      h += "</div>";
    });
    return h + '<div class="chip" style="border-style:dashed;align-self:flex-start;margin-top:4px" data-act="w-add" data-v="' + i + '">' + line("plus") + "Add source</div>";
  }
  stepHtml(st, key) {
    const T = [["on", "Turn on"], ["input", "Switch input"], ["app", "Open app"], ["scene", "Run scene / script"], ["wait", "Wait"], ["cmd", "Remote command"], ["press", "Press button"]];
    let h = '<div class="stp"><select class="inp sel" data-in="stt" data-v="' + key + '">' + T.map((o) => '<option value="' + o[0] + '"' + (o[0] === st.t ? " selected" : "") + ">" + o[1] + "</option>").join("") + (T.some((o) => o[0] === st.t) ? "" : '<option selected value="' + esc(st.t) + '">' + esc(st.t) + "</option>") + "</select>";
    if (st.t === "wait") h += '<input class="inp" type="number" min="0" max="30" step="1" data-in="sts" data-v="' + key + '" value="' + esc(st.s || 2) + '" style="width:84px"><span class="lbl">seconds</span>';
    else h += st.e ? '<div class="chip" data-act="s-pick" data-w="w:' + key + '">' + esc(this.name(st.e)) + "</div>" : '<div class="chip" style="border-style:dashed" data-act="s-pick" data-w="w:' + key + '">' + line("plus") + "Device</div>";
    if (st.t === "input" || st.t === "app" || st.t === "source" || st.t === "cmd") {
      const sl = st.e && this.st(st.e) && this.st(st.e).attributes.source_list;
      const dl = "dl" + key.replace(/:/g, "-");
      h += '<input class="inp" data-in="stv" data-v="' + key + '" value="' + esc(st.v || "") + '" placeholder="' + (st.t === "cmd" ? "Command" : st.t === "app" ? "App" : "Input") + '"' + (Array.isArray(sl) ? ' list="' + dl + '"><datalist id="' + dl + '">' + sl.slice(0, 80).map((x) => '<option value="' + esc(x) + '">').join("") + "</datalist" : "") + ">";
    }
    return h + '<div class="ib sm" data-act="st-up" data-v="' + key + '">' + line("up") + '</div><div class="ib sm" data-act="st-rm" data-v="' + key + '">' + line("x") + "</div></div>";
  }
  srcAt(key) { const k = key.split(":").map(Number); return this.draft.rooms[k[0]].sources[k[1]]; }
  logoPickHtml() {
    const sc = this.srcAt(this.logoPick), cur = (sc.logo || {}).src || "";
    if (this.logoUp) return '<div class="pick">' + this.upHtml() + "</div>";
    return this.logoGrid(cur);
  }
  upHtml() {
    const up = this.logoUp;
    {
      // the uploaded picture as it will be saved, on the dash's own background
      return '<div class="shh"><b>' + (up.kind === "icon" ? "Upload icon" : "Upload logo") + '</b><div class="ib" data-act="lu-x">' + line("x") + '</div></div><div class="shb" style="padding:0 16px 16px;display:flex;flex-direction:column;gap:12px"><div class="lup"><img data-lu alt="" src="' + up.url + '"></div>' +
        (up.info.hasAlpha ? '<div class="hint" style="padding:0">This picture already has a see-through background.</div>' :
          '<div class="wrapc" style="justify-content:flex-start"><div class="chip' + (up.rm ? " on" : "") + '" data-act="lu-rm" data-v="1">Remove background</div><div class="chip' + (up.rm ? "" : " on") + '" data-act="lu-rm" data-v="0">Keep background</div></div>' +
          (up.rm ? '<div class="lbl">How much to remove</div><input type="range" class="rng" data-in="lutol" min="15" max="140" value="' + up.tol + '"><div class="wrapc" style="justify-content:flex-start"><div class="chip' + (up.holes ? " on" : "") + '" data-act="lu-holes">Inside gaps too</div></div>' : "")) +
        '<div class="pill" data-act="lu-ok" style="justify-content:center;background:rgba(var(--accrgb),.92);color:#2a2116;border-color:transparent">' + (up.busy ? "Saving\u2026" : up.kind === "icon" ? "Use this icon" : "Use this logo") + "</div></div>";
    }
  }
  logoGrid(cur) {
    let g = '<div class="ig">';
    const tile = (v, html, l, del) => (g += '<div class="tile' + (cur === v ? " on" : "") + '" data-act="logo-set" data-v="' + esc(v) + '"><i>' + html + "</i><span>" + esc(l) + "</span>" + (del ? '<b class="tdel" data-act="logo-del" data-v="' + esc(v) + '">' + line("x") + "</b>" : "") + "</div>");
    g += '<label class="tile up"><i>' + line("plus") + '</i><span>Upload</span><input type="file" accept="image/*" data-in="logofile" hidden></label>';
    tile("", line("watch"), "None");
    (this.logos || []).forEach((u) => tile(u, '<img alt="" src="' + esc(u) + '">', "Yours", true));
    this.media.icons.forEach((m) => tile("media:" + m.id, '<img alt="" src="' + esc(m.url) + '">', m.name || "Uploaded"));
    Object.keys(LIB || {}).forEach((n) => tile("lib:" + n, '<img alt="" src="' + esc(libSrc(n)) + '">', LIB[n].n || n));
    return '<div class="pick"><div class="shh"><b>Logo</b><div class="ib" data-act="logo-x">' + line("x") + '</div></div><div class="hint" style="text-align:left">Upload a logo: a plain background is taken off so only the logo shows. Your logos show first, then icons from AR Lighting Scenes.</div><div class="shb">' + g + "</div></div></div>";
  }
  logoFile(f) {
    if (!f) return;
    const img = new Image(), u = URL.createObjectURL(f);
    img.onload = () => {
      const k = Math.min(1, 900 / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(img.naturalWidth * k)); c.height = Math.max(1, Math.round(img.naturalHeight * k));
      c.getContext("2d", { willReadFrequently: true }).drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(u);
      const info = logoCutout(c, { remove: false, tol: 60, size: 8 }).info;
      this.logoUp = Object.assign({ c, info, rm: !info.hasAlpha, tol: 60, holes: false }, this._upFor || { kind: "logo" });
      this.logoCut(); this._render(true);
    };
    img.onerror = () => { URL.revokeObjectURL(u); this._toast("That picture can't be opened"); };
    img.src = u;
  }
  logoCut() {
    const up = this.logoUp; if (!up) return;
    const src = document.createElement("canvas");
    src.width = up.c.width; src.height = up.c.height;
    src.getContext("2d", { willReadFrequently: true }).drawImage(up.c, 0, 0);
    up.out = logoCutout(src, { remove: up.rm, tol: up.tol, holes: up.holes, size: 512, info: up.info }).canvas;
    up.url = up.out.toDataURL("image/png");
    const im = this.shadowRoot.querySelector("img[data-lu]"); if (im) im.src = up.url;
  }
  logoList() {
    return this._hass.callWS({ type: "ar_4c_dash/logo", op: "list" }).then((r) => { this.logos = (r && r.logos) || []; this._render(true); }).catch(() => {});
  }
  pickHtml() {
    return '<div class="pick"><div class="shh"><b>Add</b><div class="ib" data-act="p-done">' + line("x") + '</div></div><div style="padding:0 12px 8px"><input class="inp" data-in="q" placeholder="Search" value="' + esc(this.pickQ || "") + '"></div><div class="shb pres">' + this.pickList() + "</div></div>";
  }
  pickList() {
    const w = this.pick.split(":"), k = w[1];
    let doms = PICK_DOM[k] || [];
    let have = w[0] === "w" ? [] : this.pickArr() || [];
    if (w[0] === "w") {
      const f = w[3];
      if (f === "remote") doms = ["remote", "media_player"];
      else if (f === "player" || f === "volume") doms = ["media_player"];
      else {
        const t = (this.srcAt(w[1] + ":" + w[2]).steps[Number(f)] || {}).t;
        doms = { on: ["media_player", "remote", "switch", "button", "input_button", "light", "fan"], input: ["media_player", "remote", "button", "input_button"], app: ["media_player", "remote", "button"], source: ["media_player", "remote", "button"], scene: ["scene", "script"], cmd: ["remote"], press: ["button", "input_button"] }[t] || ["media_player", "remote", "switch", "button"];
      }
    }
    const q = (this.pickQ || "").toLowerCase();
    const ids = Object.keys(this._hass.states).filter((e) => doms.indexOf(domain(e)) >= 0 && have.indexOf(e) < 0 && (!q || e.toLowerCase().indexOf(q) >= 0 || this.name(e).toLowerCase().indexOf(q) >= 0));
    ids.sort((a, b) => this.name(a).localeCompare(this.name(b)));
    let h = "";
    ids.slice(0, 200).forEach((e) => (h += '<div class="rm" data-act="p-add" data-e="' + esc(e) + '"><b>' + esc(this.name(e)) + "</b><small>" + esc(e) + "</small></div>"));
    return h || '<div class="empty">Nothing ' + (q ? "matches" : "left to add") + ".</div>";
  }
  pickArr(create) {
    const w = this.pick.split(":"), d = this.draft;
    if (w[0] === "h") {
      if (w[1] === "weather") return d.weather ? [d.weather] : [];
      if (w[1] === "solar") { const v = ((d.solar || {}).e || {})[w[2]]; return v ? [v] : []; }
      if (w[1] === "ptemp") { const v = (d.status || {}).temp; return v ? [v] : []; }
      if (w[1] === "gsensor") { const v = (d.garageSensors || {})[w.slice(2).join(":")]; return v ? [v] : []; }
      if (w[1] === "people") { d.people = d.people || { on: true, list: [] }; if (!Array.isArray(d.people.list)) d.people.list = []; return d.people.list; }
      if (create && !Array.isArray(d[w[1]])) d[w[1]] = [];
      return d[w[1]];
    }
    const rm = d.rooms[Number(w[0])];
    if (create && !Array.isArray(rm[w[1]])) rm[w[1]] = [];
    return rm[w[1]];
  }
  importPanel(id) {
    this._hass.callWS({ type: "ar_nspanel_pro/get_config", device_id: id }).then((c) => {
      const dv = (c && c.device) || {}, el = dv.elegant || {}, rs = dv.residence || {};
      const L = (v) => (Array.isArray(v) ? v : []).filter((e) => typeof e === "string" && e.indexOf("rtsp:") !== 0);
      const rooms = (Array.isArray(el.rooms) && el.rooms.length ? el.rooms : [Object.assign({ name: el.title || "Home" }, el)]).map((r, i) => {
        const o = { name: r.name || "Room " + (i + 1) };
        ROOM_KEYS.forEach((k) => (o[k] = L(r[k])));
        if (r.rsImage) o.image = r.rsImage;
        if (Array.isArray(r.rsWatch) && r.rsWatch.length) o.sources = JSON.parse(JSON.stringify(r.rsWatch));
        return o;
      });
      if (el.wholeHouse) rooms.unshift({ whole: true, name: "Whole House" });
      const rtsp = (Array.isArray(el.rtsp) ? el.rtsp : []).filter((x) => x && typeof x.url === "string" && x.url).map((x, i) => ({ name: x.name || "Camera " + (i + 1), url: x.url }));
      this.draft = { rooms, cameras: L(el.cameras), rtsp, security: L(el.security), utilities: el.utilitiesOn ? L(el.utilities) : [], utilGroups: el.utilitiesOn && el.utilGroups && typeof el.utilGroups === "object" ? el.utilGroups : undefined, utilPage: rs.utilPage === "slider" ? "slider" : undefined, lightTypes: rs.lightTypes || {}, lightTone: rs.lightTone, houseImage: rs.houseImage, weather: this.draft && this.draft.weather };
      this.dirty = true;
      this.sOpen = 0;
      this._toast("Copied " + rooms.length + (rooms.length === 1 ? " room" : " rooms") + ": check it, then Save");
      this._render(true);
    }).catch(() => this._toast("Couldn't read that panel"));
  }
  // Names: the dash's own name for any device on it (lights, aircons, speakers, TVs...)
  namesHtml(d) {
    const groups = [];
    const add = (label, arr) => { const es = (arr || []).filter((e) => typeof e === "string" && e.indexOf("rtsp:") !== 0); if (!es.length) return; const g = groups.filter((x) => x[0] === label)[0]; if (g) es.forEach((e) => g[1].indexOf(e) < 0 && g[1].push(e)); else groups.push([label, es.slice()]); };
    (d.rooms || []).forEach((rm) => SETUP_CATS.forEach((c) => add(c[1], rm[c[0]])));
    HOUSE_CATS.forEach((c) => add(c[1], d[c[0]]));
    const n = groups.reduce((a, g) => a + g[1].length, 0);
    let h = '<div class="it' + (this.namesOpen ? " open" : "") + '" style="margin-top:14px"><div class="ih" data-act="s-names"><span class="now">' + line("pencil") + "</span><b>Names</b><small>" + n + " devices</small></div>";
    if (this.namesOpen) {
      h += '<div class="sbody"><div class="hint" style="text-align:left;padding:0">The name every phone shows for each device. Leave it empty to use the Home Assistant name.</div>';
      groups.forEach((g) => {
        h += '<div class="lbl">' + esc(g[0]) + "</div>";
        g[1].forEach((e) => { const v = this.nameDraft && e in this.nameDraft ? this.nameDraft[e] : (this.conf.names || {})[e] || ""; h += '<input class="inp" data-in="nm" data-e="' + esc(e) + '" value="' + esc(v) + '" placeholder="' + esc(this.haName(e)) + '" maxlength="40">'; });
      });
      h += "</div>";
    }
    return h + "</div>";
  }
  saveSetup() {
    const nd = this.nameDraft; this.nameDraft = null;
    // names first (they're kept on their own), then the rest of the setup
    const names = nd && Object.keys(nd).length ? this._hass.callWS({ type: "ar_4c_dash/set_names", names: nd }).catch((er) => this._toast(er && er.message ? er.message : "Couldn't save the names")) : Promise.resolve();
    names.then(() => this._hass.callWS({ type: "ar_4c_dash/save", config: this.draft })).then((res) => {
      this.conf = (res && res.config) || this.draft;
      this.draft = JSON.parse(JSON.stringify(this.conf));
      this.dirty = false;
      this._setup();
      this._toast("Saved: every phone shows it now");
      this._render(true);
    }).catch((e) => this._toast(e && e.message ? e.message : "Couldn't save"));
  }

  // ---- taps -------------------------------------------------------------------------
  _click(ev) {
    if (this._swiped && Date.now() - this._swiped < 400) return;
    const t = ev.target.closest("[data-act]");
    if (!t) return;
    const act = t.getAttribute("data-act"), e = t.getAttribute("data-e"), v = t.getAttribute("data-v");
    const room = this.room();
    switch (act) {
      case "uback": this.usec = null; break;
      case "u-page": if (v === "slider") this.draft.utilPage = "slider"; else delete this.draft.utilPage; this.dirty = true; break;
      case "u-sec": { const g = (this.draft.utilGroups = this.draft.utilGroups || {}); if (v === "more") delete g[e]; else g[e] = v; this.dirty = true; break; }
      case "go": this.page = t.getAttribute("data-k"); this.code = null; this.usec = null; if (this.page === "cameras") this._camLoop(); break;
      case "back": if (this.page === "utilities" && this.usec && v !== "home") { this.usec = null; break; } this.usec = null; if (this.sp) this.sp.stop(); this.libOpen = null; this.page = "home"; this.viewCam = null; this.code = null; this._stopLive(); break;
      case "rooms": this.sheet = this.sheet === "rooms" ? null : "rooms"; this._sheetIn = !!this.sheet; break;
      case "gtap": {
        // the settings button stays hidden from guests: 10 quick taps where it sits show it for 20 seconds
        const now = Date.now();
        this.gTaps = now - (this.gLast || 0) < 1500 ? (this.gTaps || 0) + 1 : 1;
        this.gLast = now;
        if (this.gTaps < 10) return;
        this.gTaps = 0; this.gearUntil = now + 20000;
        clearTimeout(this._gearT);
        this._gearT = setTimeout(() => { this.gearUntil = 0; this._render(true); }, 20000);
        break;
      }
      case "up-del": {
        ev.stopPropagation();
        const kind = t.getAttribute("data-kind");
        this.up[kind] = (this.up[kind] || []).filter((x) => x !== v);
        if (kind === "bg" && this.P.bg === v) { this.P.bg = null; this._save(); }
        if (kind === "icon") Object.keys(this.conf.icons || {}).forEach((k) => { if (this.conf.icons[k] === v) { delete this.conf.icons[k]; this._hass.callWS({ type: "ar_4c_dash/set_icon", key: k, value: null }).catch(() => {}); } });
        this._hass.callWS({ type: "ar_4c_dash/logo", op: "delete", kind, url: v }).catch(() => {});
        break;
      }
      case "settings": this.upList("icon"); this.upList("bg"); clearTimeout(this._gearT); this.gearUntil = 0; this.sheet = "settings"; this._sheetIn = true; this.icOpen = this.icOpen || this.cats()[0]; break;
      case "close": if (this.dirty) this._toast("Setup not saved"); this.sheet = null; this.draft = null; this.dirty = false; this.pick = null; break;
      case "room": this.ri = Number(v); this.P.room = this.ri; this.sheet = null; this.cl = null; this._save(); this.libOpen = null; if (this.wv) this.wv.view = null; if (this.page !== "home" && this.cats().indexOf(this.page) < 0) this.page = "home"; break;
      case "roomoff": room.lights.forEach((x) => this.setOpt(x, { on: false })); if (room.lights.length) this.call("homeassistant", "turn_off", { entity_id: room.lights }); this._toast(room.name + ": lights off"); break;
      case "allon": room.lights.forEach((x) => this.setOpt(x, { on: true, v: 100 })); this.call("homeassistant", "turn_on", { entity_id: room.lights }); break;
      case "alloff": room.lights.forEach((x) => this.setOpt(x, { on: false })); this.call("homeassistant", "turn_off", { entity_id: room.lights }); break;
      case "scene": this.call(domain(e) === "script" ? "script" : "scene", "turn_on", { entity_id: e }); t.classList.add("hit"); setTimeout(() => t.classList.remove("hit"), 600); this._toast(this.name(e)); return;
      case "toggle": ev.stopPropagation(); this.toggle(e); return;
      case "grp": {
        ev.stopPropagation();
        const g = room.groups && room.groups[Number(v)]; if (!g) return;
        const on = !g.lights.some((x) => this.isOn(x));
        g.lights.forEach((x) => this.setOpt(x, on ? { on: true, v: 100 } : { on: false }));
        this.call("homeassistant", on ? "turn_on" : "turn_off", { entity_id: g.lights });
        break;
      }
      case "ren": this.ren = true; this.renDraft = {}; break;
      case "ren-cancel": this.ren = false; this.renDraft = null; break;
      case "ren-done": {
        const d = this.renDraft || {}; this.ren = false; this.renDraft = null;
        const ks = Object.keys(d); if (!ks.length) break;
        const names = Object.assign({}, this.conf.names);
        ks.forEach((k) => { const x = d[k].trim(); if (x) names[k] = x; else delete names[k]; });
        this.conf.names = names;
        this._hass.callWS({ type: "ar_4c_dash/set_names", names: d }).then(() => this._toast("Names saved: every phone shows them")).catch((er) => this._toast(er && er.message ? er.message : "Couldn't save the names"));
        break;
      }
      case "cl": this.cl = e; break;
      case "tmp": {
        const c = this.cl, s = this.st(c); if (!s) return;
        const step = s.attributes.target_temp_step || (s.attributes.temperature % 1 ? 0.5 : 1);
        const cur = this.opt[c + "#t"] && this.opt[c + "#t"].until > Date.now() ? this.opt[c + "#t"].v : s.attributes.temperature;
        if (cur == null) return;
        const nv = clamp(Math.round((cur + Number(v) * step) * 10) / 10, s.attributes.min_temp || 7, s.attributes.max_temp || 35);
        this.setOpt(c + "#t", { v: nv });
        clearTimeout(this._tT);
        this._tT = setTimeout(() => this.call("climate", "set_temperature", { entity_id: c, temperature: nv }), 700);
        break;
      }
      case "hvac": this.call("climate", "set_hvac_mode", { entity_id: this.cl, hvac_mode: v }); break;
      case "fan": this.call("climate", "set_fan_mode", { entity_id: this.cl, fan_mode: v }); break;
      case "cov": this.call("cover", v, { entity_id: e }); return;
      case "mp": this.call("media_player", v, { entity_id: e }); return;
      case "power": this.call("media_player", this.isOn(e) || (this.st(e) && this.st(e).state !== "off") ? "turn_off" : "turn_on", { entity_id: e }); return;
      case "src": this.call("media_player", "select_source", { entity_id: e, source: v }); return;
      case "arm": if (t.getAttribute("data-c") === "1") this.code = { e, svc: v, v: "", label: v === "alarm_disarm" ? "disarm" : v === "alarm_arm_home" ? "arm home" : "arm away" }; else this.call("alarm_control_panel", v, { entity_id: e }); break;
      case "key": {
        const c = this.code; if (!c) return;
        if (v === "x") { if (!c.v) this.code = null; else c.v = c.v.slice(0, -1); }
        else if (v === "ok") { this.call("alarm_control_panel", c.svc, { entity_id: c.e, code: c.v }); this.code = null; }
        else if (c.v.length < 8) c.v += v;
        break;
      }
      case "cam": this.viewCam = e; this._camLoop(); break;
      case "camx": this._stopView(); this.viewCam = null; this._camLoop(); break;
      case "camnext": this.camGo(Number(v)); return;
      case "lsrc": this.lsrc = v; this.P.lsrc = v; this._save(); this.libOpen = null; if (v !== "spotify" && this.sp) this.sp.stop(); break;
      case "ltab": this.libTab = v; this.libOpen = null; break;
      case "stab2": this.spTab = v; this.libOpen = null; break;
      case "lback": this.libOpen = null; break;
      case "mact": { const tg = this.maTarget(); if (tg) this.call("media_player", v === "play" ? "media_play_pause" : v === "next" ? "media_next_track" : "media_previous_track", { entity_id: tg }); return; }
      case "mpick": this.maT = e; break;
      case "mjoin": {
        ev.stopPropagation();
        const tg = this.maTarget(), inG = this.maMembers(tg).indexOf(e) >= 0;
        if (inG) this.call("media_player", "unjoin", { entity_id: e }); else this.call("media_player", "join", { entity_id: tg, group_members: [e] });
        this._toast(inG ? this.name(e) + " removed" : this.name(e) + " joins " + this.name(tg));
        return;
      }
      case "mitem": {
        const it = this.maFind(v), tg = this.maTarget();
        if (!it || !tg) return;
        if (it.media_type === "playlist" || it.media_type === "album" || it.media_type === "artist") this.openLib(it, tg, "ma");
        else { this.maPlay(tg, [it.uri], it.media_type); return; }
        break;
      }
      case "mtrack": {
        const lo = this.libOpen, tg = this.maTarget();
        if (!lo || !tg) return;
        if (v === "all") this.maPlay(tg, [lo.uri], lo.type);
        else if (lo.tracks && !lo.tracks.err) this.maPlay(tg, lo.tracks.slice(Number(v)).map((x) => x.uri).slice(0, 100), "track");
        return;
      }
      case "sact": {
        const sp = this.spot(), pl = sp.player || {};
        (v === "play" ? sp.api("PUT", "/me/player/" + (pl.is_playing ? "pause" : "play")) : sp.api("POST", "/me/player/" + (v === "next" ? "next" : "previous"))).catch((er) => this._toast("Spotify: " + er.message));
        if (v === "play" && sp.player) sp.player.is_playing = !pl.is_playing;
        sp.later(600);
        break;
      }
      case "spick": { const sp = this.spot(); sp.api("PUT", "/me/player", { device_ids: [v], play: true }).then(() => sp.later(900)).catch((er) => this._toast("Spotify: " + er.message)); sp.devices.forEach((d) => (d.is_active = d.id === v)); break; }
      case "sitem": {
        const it = this.spFind(v), sp = this.spot();
        if (!it) return;
        if (it.type === "playlist" || it.type === "artist") this.openLib(it, null, "sp");
        else { sp.api("PUT", "/me/player/play", { uris: [it.uri] }).then(() => sp.later()).catch((er) => this._toast("Spotify: " + er.message)); this._toast("Playing " + it.name); return; }
        break;
      }
      case "strack": {
        const lo = this.libOpen, sp = this.spot();
        if (!lo) return;
        const body = lo.type === "playlist" ? { context_uri: lo.uri, offset: v === "all" ? undefined : { position: Number(v) } } : { uris: (lo.tracks || []).slice(v === "all" ? 0 : Number(v)).map((x) => x.uri) };
        sp.api("PUT", "/me/player/play", body).then(() => sp.later()).catch((er) => this._toast("Spotify: " + er.message));
        this._toast("Playing");
        return;
      }
      case "sjoin": {
        const lead = this.spLead(), inG = this.maMembers(lead).indexOf(e) >= 0;
        if (inG) this.call("media_player", "unjoin", { entity_id: e }); else this.call("media_player", "join", { entity_id: lead, group_members: [e] });
        this._toast(inG ? this.name(e) + " removed" : this.name(e) + " plays along");
        return;
      }
      case "wgo": {
        const wv = this.wv;
        wv.prevRun = (this.wst && this.wst.run && this.wst.run.id) || null;
        wv.t0 = Date.now(); wv.src = v; wv.view = "start";
        (this.wLast || (this.wLast = {}))[this.ri] = v;
        const tg = this.wTarget(v);
        this._hass.callWS({ type: "ar_4c_dash/watch", action: "start", room: tg.room, src: tg.src }).catch((er) => this._toast(er && er.message ? er.message : "That didn't work"));
        clearTimeout(wv.timer);
        wv.timer = setTimeout(() => { if (wv.view === "start" && !this.myRun()) this._render(true); }, 9000);
        break;
      }
      case "wchange": this.wv.view = "pick"; break;
      case "woff": { const s0 = this.srcOf(this.wv.src); this._hass.callWS({ type: "ar_4c_dash/watch", action: "off", room: this.wTarget(this.wv.src).room }).catch(() => {}); this.wv.view = null; this.wv.src = null; this._toast(((s0 && s0.name) || "TV") + " off"); this.page = "home"; break; }
      case "wkey": this.watchCmd("key", v); return;
      case "wmute": this._hass.callWS({ type: "ar_4c_dash/watch", action: "mute", room: this.wTarget(this.wv && this.wv.src).room }).catch(() => {}); this._toast("Mute"); return;
      case "stab": this.setTab = v; if (v === "setup") this.draftStart(); break;
      case "menu": this.dispatchEvent(new Event("hass-toggle-menu", { bubbles: true, composed: true })); return;
      case "setup": this.sheet = "settings"; this._sheetIn = true; this.setTab = "setup"; this.draftStart(); break;
      case "s-open": this.sOpen = this.sOpen === Number(v) ? null : Number(v); this.delArm = null; break;
      case "s-add": this.draft.rooms.push({ name: "Room " + (this.draft.rooms.length + 1), lights: [], climate: [], music: [], watch: [], shades: [], scenes: [] }); this.sOpen = this.draft.rooms.length - 1; this.dirty = true; break;
      case "s-del": { const i = Number(v); if (this.delArm !== i) { this.delArm = i; break; } this.draft.rooms.splice(i, 1); this.delArm = null; this.sOpen = null; this.dirty = true; break; }
      case "s-mv": { const i = Number(v), j = i + Number(t.getAttribute("data-d")); const a = this.draft.rooms; [a[i], a[j]] = [a[j], a[i]]; this.sOpen = j; this.dirty = true; break; }
      case "s-rm": { this.pick = t.getAttribute("data-w"); const w = this.pick.split(":"); if (w[1] === "weather") delete this.draft.weather; else this.pickArr(true).splice(Number(v), 1); this.pick = null; this.dirty = true; break; }
      case "s-pick": this.pick = t.getAttribute("data-w"); this.pickQ = ""; break;
      case "p-add": if (this.pick.indexOf("w:") === 0) {
        const w = this.pick.split(":"), sc = this.srcAt(w[1] + ":" + w[2]), f = w[3];
        if (f === "remote") sc.remote = { e, kind: (sc.remote && sc.remote.kind) || "appletv" };
        else if (f === "player" || f === "volume") sc[f] = e;
        else sc.steps[Number(f)].e = e;
        this.pick = null; this.dirty = true; break;
      } else { const w = this.pick.split(":"); if (w[1] === "ptemp") { (this.draft.status = this.draft.status || {}).temp = e; this.pick = null; this.dirty = true; break; } if (w[1] === "gsensor") { (this.draft.garageSensors = this.draft.garageSensors || {})[w.slice(2).join(":")] = e; this.pick = null; this.dirty = true; break; } if (w[1] === "solar") { const so = (this.draft.solar = this.draft.solar || { mode: "simple" }); so.e = so.e || {}; so.e[w[2]] = e; this.pick = null; this.dirty = true; break; } if (w[1] === "weather") { this.draft.weather = e; this.pick = null; } else this.pickArr(true).push(e); this.dirty = true; break; }
      case "p-done": this.pick = null; break;
      case "s-whole": this.draft.rooms.unshift({ whole: true, name: "Whole House" }); this.sOpen = 0; this.dirty = true; break;
      case "s-lstart": this.draft.listenStart = v; this.dirty = true; break;
      case "w-open": this.wsOpen = this.wsOpen === v ? null : v; this.wDelArm = null; break;
      case "w-add": { const rm = this.draft.rooms[Number(v)]; (rm.sources = rm.sources || []).push({ id: "src" + Date.now().toString(36), name: "New source", steps: [] }); this.wsOpen = v + ":" + (rm.sources.length - 1); this.dirty = true; break; }
      case "w-del": { if (this.wDelArm !== v) { this.wDelArm = v; break; } const k = v.split(":").map(Number); this.draft.rooms[k[0]].sources.splice(k[1], 1); this.wDelArm = null; this.wsOpen = null; this.dirty = true; break; }
      case "w-clr": { const k = v.split(":"); const sc = this.srcAt(k[0] + ":" + k[1]); delete sc[k[2]]; this.dirty = true; break; }
      case "st-add": { const sc = this.srcAt(v); (sc.steps = sc.steps || []).push({ t: (sc.steps || []).length ? "input" : "on" }); this.dirty = true; break; }
      case "st-rm": { const k = v.split(":"); this.srcAt(k[0] + ":" + k[1]).steps.splice(Number(k[2]), 1); this.dirty = true; break; }
      case "st-up": { const k = v.split(":"), a = this.srcAt(k[0] + ":" + k[1]).steps, n = Number(k[2]); if (n > 0) { [a[n - 1], a[n]] = [a[n], a[n - 1]]; this.dirty = true; } break; }
      case "s-logo": this.logoPick = v; this.logoUp = null; this.logoList(); break;
      case "logo-x": this.logoPick = null; this.logoUp = null; break;
      case "s-hname": { const sc = this.srcAt(v); if (t.getAttribute("data-h") === "1") sc.hideName = true; else delete sc.hideName; this.dirty = true; break; }
      case "lu-x": this.logoUp = null; break;
      case "lu-rm": this.logoUp.rm = v === "1"; this.logoCut(); break;
      case "lu-holes": this.logoUp.holes = !this.logoUp.holes; this.logoCut(); break;
      case "lu-ok": {
        const up = this.logoUp; if (!up || up.busy) return;
        up.busy = true;
        if (up.kind === "icon") {
          // an uploaded icon goes straight on its home button, for every phone
          this._hass.callWS({ type: "ar_4c_dash/logo", op: "upload", kind: "icon", data: up.url }).then((r) => {
            this.conf.icons = Object.assign({}, this.conf.icons, { [up.k]: r.url });
            this.logoUp = null; this.upList("icon");
            return this._hass.callWS({ type: "ar_4c_dash/set_icon", key: up.k, value: r.url });
          }).then(() => this._toast("Icon set on every phone")).catch((er) => { up.busy = false; this._toast(er && er.message ? er.message : "Couldn't save the icon"); this._render(true); });
          break;
        }
        this._hass.callWS({ type: "ar_4c_dash/logo", op: "upload", data: up.url }).then((r) => {
          const sc = this.srcAt(this.logoPick); sc.logo = { src: r.url }; this.dirty = true;
          this.logoUp = null; this.logoPick = null; this.logoList(); this._toast("Logo added: Save to show it on every phone");
        }).catch((er) => { up.busy = false; this._toast(er && er.message ? er.message : "Couldn't save the logo"); this._render(true); });
        break;
      }
      case "logo-del": {
        ev.stopPropagation();
        this.logos = (this.logos || []).filter((x) => x !== v);
        this._hass.callWS({ type: "ar_4c_dash/logo", op: "delete", url: v }).then((r) => { this.logos = r.logos || []; this._render(true); }).catch(() => {});
        break;
      }
      case "logo-set": { const sc = this.srcAt(this.logoPick); if (v) sc.logo = { src: v }; else delete sc.logo; this.logoPick = null; this.dirty = true; break; }
      case "r-add": (this.draft.rtsp = this.draft.rtsp || []).push({ name: "Camera " + (this.draft.rtsp.length + 1), url: "" }); this.dirty = true; break;
      case "r-rm": this.draft.rtsp.splice(Number(v), 1); this.dirty = true; break;
      case "s-save": if (this.dirty) this.saveSetup(); return;
      case "spren": this.spRen = true; this.spDraft = {}; break;
      case "spren-done": {
        const d = this.spDraft || {}; this.spRen = false; this.spDraft = null;
        if (!Object.keys(d).length) break;
        this.conf.names = Object.assign({}, this.conf.names);
        Object.keys(d).forEach((k) => { const x = d[k].trim(); if (x) this.conf.names[k] = x; else delete this.conf.names[k]; });
        this._hass.callWS({ type: "ar_4c_dash/set_names", names: d }).then(() => this._toast("Speaker names saved: every phone shows them")).catch((er) => this._toast(er && er.message ? er.message : "Couldn't save the names"));
        break;
      }
      case "covg": { const g = (room.shadeGroups || [])[Number(t.getAttribute("data-g"))]; if (g) this.call("cover", v, { entity_id: g.shades }); return; }
      case "gs-clr": delete this.draft.garageSensors[e]; this.dirty = true; break;
      case "s-stat": { const sc = (this.draft.status = this.draft.status || {}); sc[v] = t.getAttribute("data-on") === "1"; this.dirty = true; break; }
      case "s-names": this.namesOpen = !this.namesOpen; break;
      case "gdo": {
        // garage: open, close, stop; a relay or button just gets pressed
        const d = domain(e), nm = this.name(e);
        if (d === "cover") this.call("cover", v === "close" ? "close_cover" : "open_cover", { entity_id: e });
        else if (d === "lock") this.call("lock", v === "close" ? "lock" : "unlock", { entity_id: e });
        else if (d === "button" || d === "input_button") this.call(d, "press", { entity_id: e });
        else this.call("homeassistant", "turn_on", { entity_id: e });
        this._toast(v === "close" ? nm + ": closing" : v === "open" ? nm + ": opening" : nm);
        return;
      }
      case "utab": this.utab = v; break;
      case "s-listen": { const rm = this.draft.rooms[Number(v)]; rm.listen = t.getAttribute("data-on") === "1"; this.dirty = true; break; }
      case "s-goto": {
        // open a Home Assistant page in the app (Settings > Devices & services)
        if (this.dirty) this._toast("Setup not saved");
        history.pushState(null, "", v);
        window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
        return;
      }
      case "s-ppl": { const pe = (this.draft.people = this.draft.people || { list: [] }); pe.on = v === "1"; if (!Array.isArray(pe.list)) pe.list = []; this.dirty = true; break; }
      case "s-solar": { const so = (this.draft.solar = this.draft.solar || {}); so.mode = v; so.e = so.e || {}; this.dirty = true; break; }
      case "so-clr": delete this.draft.solar.e[v]; this.dirty = true; break;
      case "so-inv": this.draft.solar[v] = !this.draft.solar[v]; if (!this.draft.solar[v]) delete this.draft.solar[v]; this.dirty = true; break;
      case "s-import": if (this.impArm !== v) { this.impArm = v; break; } this.impArm = null; this.importPanel(v); return;
      case "icopen": this.icOpen = this.icOpen === v ? null : v; this.icCat = null; break;
      case "iccat": this.icCat = v; break;
      case "icpick": {
        // one icon for the whole home: every phone shows it (and updates straight away)
        const k = t.getAttribute("data-k");
        this.conf.icons = Object.assign({}, this.conf.icons);
        if (v) this.conf.icons[k] = v; else delete this.conf.icons[k];
        this._hass.callWS({ type: "ar_4c_dash/set_icon", key: k, value: v || null }).catch((er) => this._toast(er && er.message ? er.message : "Couldn't save the icon"));
        break;
      }
      case "look": {
        // Rings or Icons only: the same on every phone (only the background is each phone's own)
        this.conf.look = v === "bare" ? "bare" : "rings";
        this._hass.callWS({ type: "ar_4c_dash/set_look", look: this.conf.look }).catch((er) => this._toast(er && er.message ? er.message : "Couldn't save"));
        break;
      }
      case "bg": this.P.bg = v || null; this._save(); break;
      default: return;
    }
    this._render(act !== "go" && act !== "back");
  }
  _tick() { if (this.page === "home" && !this.sheet && this._ready && this.rooms) this._render(true); }
  _toast(txt) {
    const old = this.app && this.app.querySelector(".msg");
    if (old) old.remove();
    if (!this.app) return;
    const m = document.createElement("div");
    m.className = "msg";
    m.textContent = txt;
    this.app.appendChild(m);
    setTimeout(() => m.remove(), 2200);
  }
}

// ---- the sidebar panel: the same dash, full screen ----------------------------------------
class Ar4cDashPanel extends Ar4cDash {
  connectedCallback() {
    // full screen (set here: an element may not touch its attributes while being created)
    this.style.setProperty("--dash-h", "100dvh");
    this.style.setProperty("--dash-r", "0");
    this._safe();
    this.style.display = "block";
    super.connectedCallback();
  }
  set narrow(v) {}
  set route(v) {}
  set panel(v) {}
}

// Home Assistant swaps in its own element registry while it starts; this file is
// loaded alongside Home Assistant's own scripts, so wait for Home Assistant before
// defining the card, or the card would land in the registry that gets replaced
const define = () => {
  if (!customElements.get("ar-4c-dash")) customElements.define("ar-4c-dash", Ar4cDash);
  if (!customElements.get("ar-4c-dash-panel")) customElements.define("ar-4c-dash-panel", Ar4cDashPanel);
};
if (!document.querySelector("home-assistant") || customElements.get("home-assistant")) define();
else {
  const t0 = Date.now();
  const wait = () => (customElements.get("home-assistant") || Date.now() - t0 > 30000 ? define() : setTimeout(wait, 50));
  wait();
}
window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === "ar-4c-dash")) window.customCards.push({ type: "ar-4c-dash", name: "AR 4C Dash", description: "The AR Smart Home Residence look as a phone dashboard (the same as the 4C Dash sidebar item).", preview: false });
})();
