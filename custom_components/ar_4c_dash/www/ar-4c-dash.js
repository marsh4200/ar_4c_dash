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
const VERSION = "1.0.1";
const MENU = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
const SETUP_CATS = [["lights", "Lights"], ["climate", "Comfort"], ["music", "Listen"], ["watch", "Watch"], ["shades", "Shades"], ["scenes", "Scenes"]];
const HOUSE_CATS = [["cameras", "Cameras"], ["security", "Alarm"], ["utilities", "Utilities"]];
const PICK_DOM = { lights: ["light", "switch"], climate: ["climate"], music: ["media_player"], watch: ["media_player", "remote"], shades: ["cover"], scenes: ["scene", "script"], cameras: ["camera"], security: ["alarm_control_panel"], utilities: ["switch", "input_boolean", "sensor", "binary_sensor", "fan", "light", "valve", "water_heater", "lock"], weather: ["weather"] };
const BASE = "/ar_4c_dash_static";
const PREF_KEY = "ar_4c_dash";
const LINE = {
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
const TITLES = { lights: "Lights", climate: "Comfort", music: "Listen", watch: "Watch", shades: "Shades", cameras: "Cameras", utilities: "Utilities", security: "Security", scenes: "Scenes" };
const ORDER = ["lights", "climate", "music", "watch", "shades", "cameras", "utilities", "security", "scenes"];
const ROOM_KEYS = ["lights", "climate", "music", "watch", "shades", "scenes"];
const IC_CATS = ["Lighting", "Climate", "Security", "Media", "Doors & shades", "Utilities", "Scenes & rooms"];
const IC_FOR = { lights: "Lighting", climate: "Climate", security: "Security", cameras: "Security", music: "Media", watch: "Media", shades: "Doors & shades", utilities: "Utilities", scenes: "Scenes & rooms" };
const LAMP_K = { warm: 2700, soft: 3000, neutral: 4000, cool: 5000, daylight: 6500, dim: 2200 };
const LAMP_NAME = { lamp: "Pendant", edison: "Filament", downlight: "Downlight", bulb: "Bulb" };
const MODE = { off: "Off", heat: "Heat", cool: "Cool", heat_cool: "Heat / cool", auto: "Auto", dry: "Dry", fan_only: "Fan" };
const MODE_COL = { cool: "#7fc6ff", heat: "#ffb070", heat_cool: "#f3d39a", auto: "#f3d39a", dry: "#b9e3a8", fan_only: "#cfd6de", off: "#8a8a8a" };
const ALARM = { disarmed: "Disarmed", armed_home: "Armed home", armed_away: "Armed away", armed_night: "Armed night", armed_vacation: "Armed vacation", armed_custom_bypass: "Armed", arming: "Arming\u2026", pending: "Pending\u2026", disarming: "Disarming\u2026", triggered: "Alarm!" };

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
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
.pg{position:relative;flex:1;display:flex;flex-direction:column;min-height:0}
.top{display:flex;align-items:center;gap:8px;padding:14px 16px 0}
.ib{width:40px;height:40px;border-radius:50%;border:1px solid var(--line);background:var(--glass);display:grid;place-items:center;flex:none;cursor:pointer;color:var(--fg)}
.ib svg{width:19px;height:19px}
.room{font-size:20px;font-weight:400;display:flex;align-items:center;gap:6px;cursor:pointer;min-width:0;white-space:nowrap;overflow:hidden}
.room small{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);display:flex;align-items:center;gap:2px}
.room small svg,.room>svg{width:14px;height:14px}
.sp{flex:1}
.clock{padding:22px 24px 0}
.clock .t{font-size:64px;font-weight:300;line-height:1;letter-spacing:-.01em;font-variant-numeric:tabular-nums}
.clock .d{font-size:14px;color:rgba(241,237,230,.78);margin-top:8px}
.clock .d i{font-style:normal;color:var(--acc)}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px 6px;padding:22px 14px 0;margin-top:auto;margin-bottom:16px}
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
.bot{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 16px 18px}
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
.sw{position:relative;width:46px;height:28px;border-radius:14px;background:rgba(255,255,255,.14);flex:none;cursor:pointer}
.sw::after{content:"";position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#bbb;transition:transform .15s}
.sw.on{background:rgba(var(--accrgb),.9)}
.sw.on::after{transform:translateX(18px);background:#fff}
.card{border-radius:22px;border:1px solid rgba(255,255,255,.12);background:rgba(16,14,18,.62);padding:14px;display:flex;flex-direction:column;gap:12px;flex:none}
.row{display:flex;align-items:center;gap:12px}
.row>svg{width:22px;height:22px;color:var(--muted)}
.hint{font-size:12px;color:var(--muted);text-align:center;padding:2px 16px 6px}
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
.cam span{position:absolute;left:10px;bottom:8px;font-size:13px;background:rgba(0,0,0,.55);padding:3px 9px;border-radius:10px}
.view{position:absolute;inset:0;z-index:6;background:#000;display:flex;flex-direction:column}
.view img{flex:1;min-height:0;width:100%;object-fit:contain}
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
.inp{width:100%;height:42px;border-radius:12px;border:1px solid var(--line);background:rgba(255,255,255,.06);color:var(--fg);font:inherit;font-size:16px;padding:0 12px;outline:none}
.inp:focus{border-color:var(--acc)}
.sbody{padding:4px 12px 14px;display:flex;flex-direction:column;gap:8px}
.chip svg{width:14px;height:14px}
.pick{position:absolute;inset:0;z-index:7;background:rgb(16,15,19);border-radius:26px 26px 0 0;display:flex;flex-direction:column}
.msg{position:absolute;left:50%;bottom:76px;transform:translateX(-50%);background:rgba(20,20,24,.95);border:1px solid var(--line);padding:9px 16px;border-radius:18px;font-size:14px;z-index:9;white-space:nowrap;pointer-events:none}
`;

class Ar4cDash extends HTMLElement {
  static getStubConfig() { return {}; }
  setConfig(c) { this._cfg = Object.assign({}, c || {}); if (this._ready) this._load(); }
  getCardSize() { return 12; }
  getGridOptions() { return { columns: "full", rows: "auto" }; }
  connectedCallback() {
    this._clockT = setInterval(() => this._tick(), 15000);
    if (this._ready && this.page === "cameras") this._camLoop();
  }
  disconnectedCallback() { clearInterval(this._clockT); clearInterval(this._camT); }
  set hass(h) {
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
    this._ready = true;
    this.shadowRoot.addEventListener("click", (e) => this._click(e));
    this.shadowRoot.addEventListener("input", (ev) => {
      const t = ev.target, k = t.getAttribute && t.getAttribute("data-in");
      if (k === "name" && this.draft) {
        const rm = this.draft.rooms[Number(t.getAttribute("data-v"))];
        if (rm) { rm.name = t.value; this.dirty = true; const b = t.closest(".it").querySelector(".ih b"); if (b) b.textContent = t.value || "Room"; const sv = this.shadowRoot.querySelector('[data-act="s-save"]'); if (sv) { sv.textContent = "Save for everyone"; sv.style.cssText = "justify-content:center;background:rgba(var(--accrgb),.92);color:#2a2116;border-color:transparent"; } }
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
    try {
      const c = await h.callWS({ type: "ar_4c_dash/config" });
      this.conf = (c && c.config) || { rooms: [] };
      this.admin = !!(c && c.admin);
    } catch (e) {
      this.err = "AR 4C Dash isn't set up in Home Assistant yet: add it under Settings > Devices & services.";
    }
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
  _setup() {
    this._watch = null;
    const c = this.conf || { rooms: [] };
    this.rc = { lightTypes: c.lightTypes || {}, lightTone: c.lightTone, houseImage: c.houseImage };
    this.rooms = (Array.isArray(c.rooms) ? c.rooms : []).map((r, i) => {
      const o = { name: r.name || "Room " + (i + 1), image: r.image };
      ROOM_KEYS.forEach((k) => (o[k] = list(r[k])));
      return o;
    });
    this.empty = !this.rooms.length;
    if (this.empty) this.rooms = [{ name: "Home", image: "", lights: [], climate: [], music: [], watch: [], shades: [], scenes: [] }];
    this.house = { cameras: list(c.cameras), security: list(c.security), utilities: list(c.utilities) };
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
  name(e) { const s = this.st(e); return (s && s.attributes.friendly_name) || e.split(".")[1].replace(/_/g, " "); }
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
    const r = this.room();
    return ORDER.filter((k) => (k === "cameras" || k === "security" || k === "utilities" ? this.house[k] : r[k]).length);
  }
  ents(k) { return k === "cameras" || k === "security" || k === "utilities" ? this.house[k] : this.room()[k]; }

  // ---- icons + background ------------------------------------------------
  instIcon(k) {
    const ic = this.rc.icons && this.rc.icons[k];
    const src = ic && typeof ic.src === "string" ? ic.src : "";
    if (src.indexOf("lib:") === 0 && libSrc(src.slice(4))) return '<img alt="" src="' + esc(libSrc(src.slice(4))) + '">';
    if (src && src.indexOf("lib:") !== 0) return '<img alt="" src="' + esc(this.url(src)) + '">';
    return line(k);
  }
  icon(k) {
    const v = this.P.icons && this.P.icons[k];
    if (v === "line") return line(k);
    if (typeof v === "string" && v.indexOf("lib:") === 0 && libSrc(v.slice(4))) return '<img alt="" src="' + esc(libSrc(v.slice(4))) + '">';
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
    ["cameras", "security", "utilities"].forEach((k) => (hs[k] || []).forEach((e) => w.push(e)));
    if (this.conf && this.conf.weather) w.push(this.conf.weather);
    else { const wx = Object.keys(this._hass.states).filter((e) => e.indexOf("weather.") === 0)[0]; if (wx) w.push(wx); }
    return (this._watch = w);
  }
  _changed() {
    if (!this._ready || this.dragging) return;
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
    if (this._down) { this._later = true; return; } // a finger is on the screen: redraw when it lifts
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
    this.app.classList.toggle("bare", this.P.look === "bare");
    const sc = pg.querySelector(".scroll,.dialw,.shb");
    const y = soft && sc ? sc.scrollTop : 0;
    const shy = soft && this.app.querySelector(".sheet .shb") ? this.app.querySelector(".sheet .shb").scrollTop : 0;
    let h = this.page === "home" ? this.home() : this.inner();
    if (this.sheet) h += this.sheetHtml();
    if (this.viewCam) h += this.camView();
    if (pg.__h === h) return; // nothing on screen changed
    pg.__h = h;
    pg.innerHTML = h;
    if (this._sheetIn) { const sh = pg.querySelector(".sheet"); if (sh) sh.classList.add("in"); this._sheetIn = false; }
    if (soft) { const s2 = pg.querySelector(".scroll,.dialw"); if (s2) s2.scrollTop = y; const s3 = this.app.querySelector(".sheet .shb"); if (s3) s3.scrollTop = shy; }
    pg.querySelectorAll("canvas[data-lamp]").forEach((c) => this.lamp(c, c.getAttribute("data-lamp")));
    if (this.page === "climate") this.paintDial();
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
      else if (k === "shades") lit = es.some((e) => { const s = this.st(e); return s && s.state === "open"; });
      g += '<div class="btn' + (lit ? " lit" : "") + '" data-act="go" data-k="' + k + '"><div class="ring">' + this.icon(k) + badge + "</div><span>" + TITLES[k] + "</span></div>";
    });
    const hasLights = this.room().lights.length;
    return (
      '<div class="top"><div class="ib" data-act="menu" title="Home Assistant menu">' + MENU + '</div><div class="room" data-act="rooms">' + this.roomName() + line("down") + '</div><div class="sp"></div><div class="ib" data-act="settings">' + line("icons") + "</div></div>" +
      '<div class="clock"><div class="t">' + now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }) + '</div><div class="d">' + now.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" }) + (wtxt ? "<i>" + esc(wtxt) + "</i>" : "") + "</div></div>" +
      (this.empty ? '<div class="empty" style="margin-top:auto">' + (this.admin ? 'Nothing set up yet.<br><br><span class="pill" style="display:inline-flex" data-act="setup">' + line("rooms") + "Set up rooms</span>" : "Nothing set up yet. Ask the person who looks after Home Assistant to set up the 4C Dash.") + "</div>" : '<div class="grid">' + (g || '<div class="empty" style="grid-column:1/-1">Nothing set up for this room yet.</div>') + "</div>") +
      '<div class="bot">' + (hasLights ? '<div class="pill" data-act="roomoff">' + line("power") + "Room Off</div>" : "<span></span>") + "</div>"
    );
  }
  head(title) {
    const house = this.page === "cameras" || this.page === "security" || this.page === "utilities";
    return '<div class="top"><div class="ib" data-act="back">' + line("chevl") + '</div><div class="room"' + (house ? "" : ' data-act="rooms"') + ">" + title + (house ? "" : "<small>" + this.roomName() + line("down") + "</small>") + '</div><div class="sp"></div><div class="ib" data-act="back">' + line("home") + "</div></div>";
  }
  inner() {
    const k = this.page;
    const f = { lights: this.pLights, climate: this.pClimate, music: this.pMedia, watch: this.pMedia, shades: this.pShades, scenes: this.pScenes, security: this.pSecurity, cameras: this.pCameras, utilities: this.pUtil }[k];
    return this.head(TITLES[k]) + (f ? f.call(this) : "");
  }

  // ---- lights ------------------------------------------------------------------
  pLights() {
    const es = this.room().lights;
    let chips = '<div class="chips"><div class="chip dot" data-act="allon"><i></i>All on</div>';
    this.room().scenes.forEach((e) => (chips += '<div class="chip dot sc" data-act="scene" data-e="' + esc(e) + '"><i></i>' + esc(this.name(e)) + "</div>"));
    chips += '<div class="chip dot off" data-act="alloff"><i></i>All off</div></div>';
    let rows = "";
    es.forEach((e) => {
      const on = this.isOn(e), dim = this.dimmable(e), v = this.lightPct(e);
      const lc = this.lampRgb(e).join(",");
      const t = (this.rc.lightTypes && LAMP_NAME[this.rc.lightTypes[e]]) || (dim ? "Dimmer" : "Switch");
      rows += '<div class="lt ' + (on ? "on" : "off") + '" data-lt="' + esc(e) + '" style="--lc:' + lc + '"><div class="fill" style="width:' + (dim ? v : 100) + '%"></div><canvas data-lamp="' + esc(e) + '"></canvas><div class="nm"><b>' + esc(this.name(e)) + "</b><small>" + esc(t) + '</small></div><div class="pc">' + (on ? (dim ? v + "%" : "On") : "Off") + '</div><div class="sw' + (on ? " on" : "") + '" data-act="toggle" data-e="' + esc(e) + '"></div></div>';
    });
    const n = es.filter((e) => this.isOn(e)).length;
    return chips + '<div class="scroll">' + (rows || '<div class="empty">No lights in this room.</div>') + '</div><div class="hint">Slide a light to dim it \u00b7 tap it to switch on or off</div><div class="bot"><div class="pill" data-act="roomoff">' + line("power") + 'Room Off</div><span class="lbl">' + n + " of " + es.length + " on</span></div>";
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
    R.addEventListener("pointerdown", () => (this._down = true), true);
    const lift = () => {
      this._down = false;
      if (this._later) { this._later = false; setTimeout(() => !this._down && this._render(true), 50); }
    };
    R.addEventListener("pointerup", lift, true);
    R.addEventListener("pointercancel", lift, true);
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
        this.dragging = true;
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
  }
  _slide(c, ev, done) {
    const sl = c.sl, r = sl.getBoundingClientRect();
    const v = clamp(Math.round(((ev.clientX - r.left) / r.width) * 100), 0, 100);
    this.dragging = !done;
    sl.querySelector("i").style.width = v + "%";
    sl.querySelector("b").style.left = v + "%";
    const e = sl.getAttribute("data-e"), kind = sl.getAttribute("data-kind");
    const now = Date.now();
    if (!done && now - c.last < 300) { c.v = v; return; }
    c.last = now;
    if (kind === "cover") { if (done) this.call("cover", "set_cover_position", { entity_id: e, position: v }); this.setOpt(e + "#pos", { v }); }
    else if (kind === "vol") { this.call("media_player", "volume_set", { entity_id: e, volume_level: v / 100 }); this.setOpt(e + "#vol", { v }); }
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
    let h = "";
    this.room().shades.forEach((e) => {
      const s = this.st(e); if (!s) return;
      const pos = this.opt[e + "#pos"] && this.opt[e + "#pos"].until > Date.now() ? this.opt[e + "#pos"].v : s.attributes.current_position;
      h += '<div class="card"><div class="row"><div class="nm"><b>' + esc(this.name(e)) + "</b><small>" + esc(pos != null ? pos + "% open" : s.state) + '</small></div><div class="ctrls" style="gap:10px"><div class="ib" data-act="cov" data-v="open_cover" data-e="' + esc(e) + '">' + line("up") + '</div><div class="ib" data-act="cov" data-v="stop_cover" data-e="' + esc(e) + '">' + line("stop") + '</div><div class="ib" data-act="cov" data-v="close_cover" data-e="' + esc(e) + '">' + line("down") + "</div></div></div>" + (pos != null ? this.slider(e, "cover", pos) : "") + "</div>";
    });
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
  camSrc(e) {
    const s = this.st(e);
    const t = s && s.attributes.access_token;
    const at = (this._camAt || (this._camAt = {}))[e] || (this._camAt[e] = Date.now());
    return "/api/camera_proxy/" + e + "?token=" + encodeURIComponent(t || "") + "&t=" + at;
  }
  pCameras() {
    let h = "";
    this.house.cameras.forEach((e) => (h += '<div class="cam" data-act="cam" data-e="' + esc(e) + '"><img alt="" data-cam="' + esc(e) + '" src="' + esc(this.camSrc(e)) + '"><span>' + esc(this.name(e)) + "</span></div>"));
    return '<div class="scroll">' + (h ? '<div class="cams">' + h + "</div>" : '<div class="empty">No cameras set up.</div>') + "</div>";
  }
  camView() {
    const e = this.viewCam;
    return '<div class="view"><img alt="" data-cam="' + esc(e) + '" src="' + esc(this.camSrc(e)) + '"><div class="top"><div class="ib" data-act="camx">' + line("x") + '</div><div class="room">' + esc(this.name(e)) + "</div></div></div>";
  }
  _camLoop() {
    clearInterval(this._camT);
    this._camT = setInterval(() => {
      if (this.page !== "cameras") return clearInterval(this._camT);
      this.shadowRoot.querySelectorAll("img[data-cam]").forEach((im) => {
        const e = im.getAttribute("data-cam");
        const n = new Image();
        n.onload = () => (im.src = n.src);
        (this._camAt || (this._camAt = {}))[e] = Date.now();
        n.src = this.camSrc(e);
      });
    }, this.viewCam ? 1000 : 8000);
  }
  pUtil() {
    let h = "";
    this.house.utilities.forEach((e) => {
      const s = this.st(e); if (!s) return;
      const d = domain(e), tog = ["switch", "light", "fan", "input_boolean"].indexOf(d) >= 0;
      const val = tog ? "" : s.state + (s.attributes.unit_of_measurement ? " " + s.attributes.unit_of_measurement : "");
      h += '<div class="card"><div class="row"><div class="nm"><b>' + esc(this.name(e)) + "</b><small>" + esc(tog ? (this.isOn(e) ? "On" : "Off") : "") + "</small></div>" + (tog ? '<div class="sw' + (this.isOn(e) ? " on" : "") + '" data-act="toggle" data-e="' + esc(e) + '"></div>' : '<div class="pc" style="font-size:20px">' + esc(val) + "</div>") + "</div></div>";
    });
    return '<div class="scroll">' + (h || '<div class="empty">No utilities set up.</div>') + "</div>";
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
    if (tab === "setup" && this.admin) return '<div class="sheet"><div class="shh"><b>Settings</b><div class="ib" data-act="close">' + line("x") + '</div></div><div class="shb">' + h + this.setupHtml() + "</div>" + (this.pick ? this.pickHtml() : "") + "</div>";
    if (tab === "icons") {
      ORDER.filter((k) => this.cats().indexOf(k) >= 0).forEach((k) => {
        const mine = this.P.icons && this.P.icons[k];
        h += '<div class="it' + (this.icOpen === k ? " open" : "") + '"><div class="ih" data-act="icopen" data-v="' + k + '"><span class="now">' + this.icon(k) + "</span><b>" + TITLES[k] + "</b><small>" + (mine ? "Your pick" : "As set up") + "</small></div>";
        if (this.icOpen === k) {
          const cat = this.icCat || IC_FOR[k] || "all";
          h += '<div class="cats">';
          [["all", "All"]].concat(IC_CATS.map((c) => [c, c])).forEach((c) => (h += '<div class="chip' + (c[0] === cat ? " on" : "") + '" data-act="iccat" data-v="' + esc(c[0]) + '">' + esc(c[1]) + "</div>"));
          h += '</div><div class="ig">';
          const tile = (v, html, l) => (h += '<div class="tile' + ((mine || "") === v ? " on" : "") + '" data-act="icpick" data-k="' + k + '" data-v="' + esc(v) + '"><i>' + html + "</i><span>" + esc(l) + "</span></div>");
          tile("", this.instIcon(k), "As set up");
          tile("line", line(k), "Line");
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
      h += '<div class="setrow"><span class="lbl">Buttons</span><div class="chip' + (this.P.look !== "bare" ? " on" : "") + '" data-act="look" data-v="rings">Rings</div><div class="chip' + (this.P.look === "bare" ? " on" : "") + '" data-act="look" data-v="bare">Icons only</div></div>';
      h += '<div class="lbl" style="padding:6px 4px">Background</div><div class="bgs">';
      const bt = (v, img, l) => (h += '<div class="bgt' + ((this.P.bg || "") === v ? " on" : "") + '" data-act="bg" data-v="' + esc(v) + '"><i style="background-image:url(&quot;' + esc(img) + '&quot;)"></i><small>' + esc(l) + "</small></div>");
      bt("", this.url(this.room().image) || this.url(this.rc.houseImage) || BASE + "/backgrounds/thumbs/villa.jpg", "As set up");
      this.media.backgrounds.forEach((m) => bt("media:" + m.id, m.url, m.name || "Uploaded"));
      Object.keys(PRESETS).forEach((k) => bt("preset:" + k, BASE + "/backgrounds/thumbs/" + PRESETS[k], BG_NAMES[k] || k));
      h += "</div>";
    }
    return '<div class="sheet"><div class="shh"><b>Settings</b><div class="ib" data-act="close">' + line("x") + '</div></div><div class="shb">' + h + "</div></div>";
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
      h += '<div class="it' + (this.sOpen === i ? " open" : "") + '"><div class="ih" data-act="s-open" data-v="' + i + '"><span class="now">' + line("home") + "</span><b>" + esc(rm.name || "Room " + (i + 1)) + "</b><small>" + n + (n === 1 ? " device" : " devices") + "</small></div>";
      if (this.sOpen === i) {
        h += '<div class="sbody"><input class="inp" data-in="name" data-v="' + i + '" value="' + esc(rm.name || "") + '" placeholder="Room name" maxlength="40">';
        SETUP_CATS.forEach((c) => (h += '<div class="lbl">' + c[1] + "</div>" + this.chipsFor(rm[c[0]], i + ":" + c[0])));
        h += '<div class="wrapc" style="justify-content:flex-start;margin-top:6px">' + (i > 0 ? '<div class="chip" data-act="s-mv" data-v="' + i + '" data-d="-1">' + line("up") + "Move up</div>" : "") + (i < d.rooms.length - 1 ? '<div class="chip" data-act="s-mv" data-v="' + i + '" data-d="1">' + line("down") + "Move down</div>" : "") + '<div class="chip" data-act="s-del" data-v="' + i + '" style="color:#ff9a8a">' + (this.delArm === i ? "Tap again to delete" : "Delete room") + "</div></div></div>";
      }
      h += "</div>";
    });
    h += '<div class="chip" style="margin:10px 0 0;border-style:dashed;justify-content:center" data-act="s-add">' + line("plus") + "Add room</div>";
    h += '<div class="lbl" style="padding:18px 4px 2px">Whole home</div><div class="card" style="background:transparent;padding:12px">';
    HOUSE_CATS.forEach((c) => (h += '<div class="lbl">' + c[1] + "</div>" + this.chipsFor(d[c[0]], "h:" + c[0])));
    h += '<div class="lbl">Weather</div>' + this.chipsFor(d.weather ? [d.weather] : [], "h:weather") + "</div>";
    if (this.nsp && this.nsp.length) {
      h += '<div class="lbl" style="padding:18px 4px 6px">Copy from an AR NSPanel Pro panel</div><div class="wrapc" style="justify-content:flex-start">';
      this.nsp.forEach((pn) => (h += '<div class="chip" data-act="s-import" data-v="' + esc(pn.device_id) + '">' + (this.impArm === pn.device_id ? "Tap again: replaces this setup" : esc(pn.name || pn.device_id)) + "</div>"));
      h += "</div>";
    }
    h += '<div style="position:sticky;bottom:0;padding:16px 0 4px;background:linear-gradient(transparent,rgba(16,15,19,.98) 30%)"><div class="pill" data-act="s-save" style="justify-content:center;background:' + (this.dirty ? "rgba(var(--accrgb),.92);color:#2a2116;border-color:transparent" : "var(--glass)") + '">' + (this.dirty ? "Save for everyone" : "Saved") + "</div></div>";
    return h;
  }
  pickHtml() {
    return '<div class="pick"><div class="shh"><b>Add</b><div class="ib" data-act="p-done">' + line("x") + '</div></div><div style="padding:0 12px 8px"><input class="inp" data-in="q" placeholder="Search" value="' + esc(this.pickQ || "") + '"></div><div class="shb pres">' + this.pickList() + "</div></div>";
  }
  pickList() {
    const w = this.pick.split(":"), k = w[1];
    const doms = PICK_DOM[k] || [];
    const have = this.pickArr() || [];
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
        return o;
      });
      this.draft = { rooms, cameras: L(el.cameras), security: L(el.security), utilities: el.utilitiesOn ? L(el.utilities) : [], lightTypes: rs.lightTypes || {}, lightTone: rs.lightTone, houseImage: rs.houseImage };
      this.dirty = true;
      this.sOpen = 0;
      this._toast("Copied " + rooms.length + (rooms.length === 1 ? " room" : " rooms") + ": check it, then Save");
      this._render(true);
    }).catch(() => this._toast("Couldn't read that panel"));
  }
  saveSetup() {
    this._hass.callWS({ type: "ar_4c_dash/save", config: this.draft }).then((res) => {
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
    const t = ev.target.closest("[data-act]");
    if (!t) return;
    const act = t.getAttribute("data-act"), e = t.getAttribute("data-e"), v = t.getAttribute("data-v");
    const room = this.room();
    switch (act) {
      case "go": this.page = t.getAttribute("data-k"); this.code = null; if (this.page === "cameras") this._camLoop(); break;
      case "back": this.page = "home"; this.viewCam = null; this.code = null; break;
      case "rooms": this.sheet = this.sheet === "rooms" ? null : "rooms"; this._sheetIn = !!this.sheet; break;
      case "settings": this.sheet = "settings"; this._sheetIn = true; this.icOpen = this.icOpen || this.cats()[0]; break;
      case "close": if (this.dirty) this._toast("Setup not saved"); this.sheet = null; this.draft = null; this.dirty = false; this.pick = null; break;
      case "room": this.ri = Number(v); this.P.room = this.ri; this.sheet = null; this.cl = null; this._save(); if (this.page !== "home" && this.page !== "cameras" && this.page !== "security" && this.page !== "utilities" && !this.room()[this.page].length) this.page = "home"; break;
      case "roomoff": room.lights.forEach((x) => this.setOpt(x, { on: false })); if (room.lights.length) this.call("homeassistant", "turn_off", { entity_id: room.lights }); this._toast(room.name + ": lights off"); break;
      case "allon": room.lights.forEach((x) => this.setOpt(x, { on: true, v: 100 })); this.call("homeassistant", "turn_on", { entity_id: room.lights }); break;
      case "alloff": room.lights.forEach((x) => this.setOpt(x, { on: false })); this.call("homeassistant", "turn_off", { entity_id: room.lights }); break;
      case "scene": this.call(domain(e) === "script" ? "script" : "scene", "turn_on", { entity_id: e }); t.classList.add("hit"); setTimeout(() => t.classList.remove("hit"), 600); this._toast(this.name(e)); return;
      case "toggle": ev.stopPropagation(); this.toggle(e); return;
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
      case "camx": this.viewCam = null; this._camLoop(); break;
      case "stab": this.setTab = v; if (v === "setup") this.draftStart(); break;
      case "menu": this.dispatchEvent(new Event("hass-toggle-menu", { bubbles: true, composed: true })); return;
      case "setup": this.sheet = "settings"; this._sheetIn = true; this.setTab = "setup"; this.draftStart(); break;
      case "s-open": this.sOpen = this.sOpen === Number(v) ? null : Number(v); this.delArm = null; break;
      case "s-add": this.draft.rooms.push({ name: "Room " + (this.draft.rooms.length + 1), lights: [], climate: [], music: [], watch: [], shades: [], scenes: [] }); this.sOpen = this.draft.rooms.length - 1; this.dirty = true; break;
      case "s-del": { const i = Number(v); if (this.delArm !== i) { this.delArm = i; break; } this.draft.rooms.splice(i, 1); this.delArm = null; this.sOpen = null; this.dirty = true; break; }
      case "s-mv": { const i = Number(v), j = i + Number(t.getAttribute("data-d")); const a = this.draft.rooms; [a[i], a[j]] = [a[j], a[i]]; this.sOpen = j; this.dirty = true; break; }
      case "s-rm": { this.pick = t.getAttribute("data-w"); const w = this.pick.split(":"); if (w[1] === "weather") delete this.draft.weather; else this.pickArr(true).splice(Number(v), 1); this.pick = null; this.dirty = true; break; }
      case "s-pick": this.pick = t.getAttribute("data-w"); this.pickQ = ""; break;
      case "p-add": { const w = this.pick.split(":"); if (w[1] === "weather") { this.draft.weather = e; this.pick = null; } else this.pickArr(true).push(e); this.dirty = true; break; }
      case "p-done": this.pick = null; break;
      case "s-save": if (this.dirty) this.saveSetup(); return;
      case "s-import": if (this.impArm !== v) { this.impArm = v; break; } this.impArm = null; this.importPanel(v); return;
      case "icopen": this.icOpen = this.icOpen === v ? null : v; this.icCat = null; break;
      case "iccat": this.icCat = v; break;
      case "icpick": { const k = t.getAttribute("data-k"); this.P.icons = Object.assign({}, this.P.icons); if (v) this.P.icons[k] = v; else delete this.P.icons[k]; this._save(); break; }
      case "look": this.P.look = v === "bare" ? "bare" : null; this._save(); break;
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
    this.style.display = "block";
    super.connectedCallback();
  }
  set narrow(v) {}
  set route(v) {}
  set panel(v) {}
}

if (!customElements.get("ar-4c-dash")) customElements.define("ar-4c-dash", Ar4cDash);
if (!customElements.get("ar-4c-dash-panel")) customElements.define("ar-4c-dash-panel", Ar4cDashPanel);
window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === "ar-4c-dash")) window.customCards.push({ type: "ar-4c-dash", name: "AR 4C Dash", description: "The AR Smart Home Residence look as a phone dashboard (the same as the 4C Dash sidebar item).", preview: false });
})();
