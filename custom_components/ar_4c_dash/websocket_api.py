"""The dash's setup (rooms, devices, home-button icons), kept in Home Assistant's storage.

ar_4c_dash/config     any logged-in user: the setup (what the dash shows)
ar_4c_dash/subscribe  any logged-in user: the setup now and after every change, so
                      every open phone updates straight away
ar_4c_dash/save       admins: replace the setup (from the dash's Setup page)
ar_4c_dash/set_icon   any logged-in user: one home button's icon, for every phone
ar_4c_dash/set_names  any logged-in user: the dash's own names for lights, for every phone
ar_4c_dash/logo       upload, list and delete pictures: Watch logos (admins), icons and backgrounds
ar_4c_dash/stream     any logged-in user: live video of an RTSP camera (HLS address)
ar_4c_dash/watch      any logged-in user: start a Watch source, remote keys, volume, TV off
ar_4c_dash/watch_subscribe  which source is on in each room and the steps of the last start
ar_4c_dash/listen     any logged-in user: what Listen can use; Music Assistant library and
                      search; a Spotify token

RTSP addresses carry the camera's password, so only admins are sent them; phones
get the names and ask Home Assistant for the stream or a snapshot by number.
"""

from __future__ import annotations

import base64
import binascii
import hashlib
from pathlib import Path
import re
from typing import Any

import voluptuous as vol

from aiohttp import web

from homeassistant.components import websocket_api
from homeassistant.components.http import HomeAssistantView
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.dispatcher import async_dispatcher_connect, async_dispatcher_send
from homeassistant.helpers.storage import Store

from . import listen, watch
from .const import DOMAIN, MAX_ROOMS, STORE_KEY, STORE_VERSION, UPLOADS

_DATA = f"{DOMAIN}_store"
ROOM_LISTS = ("lights", "climate", "music", "watch", "shades", "scenes")
HOUSE_LISTS = ("cameras", "security", "utilities")
ICON_KEYS = ("lights", "climate", "music", "watch", "shades", "cameras", "utilities", "security", "scenes")
SOLAR_KEYS = ("solar_power", "grid_power", "battery_power", "battery_soc", "home_power", "solar_daily", "grid_import_daily", "grid_export_daily", "home_daily")
INVERTERS = ("default", "sunsynk", "deye", "inverex", "solis_hybrid", "goodwe_hybrid", "growatt", "victron", "solaredge", "fronius_gen24", "huawei_luna")
SIGNAL = f"{DOMAIN}_changed"
SNAP_URL = "/api/ar_4c_dash/snap/{index}"


def _ids(v: Any) -> list[str]:
    if not isinstance(v, list):
        return []
    return [x for x in v if isinstance(x, str) and "." in x and len(x) < 255][:40]


def _text(v: Any, n: int = 200) -> str:
    return v.strip()[:n] if isinstance(v, str) else ""


def clean(cfg: Any) -> dict[str, Any]:
    """Keep only what the dash understands."""
    cfg = cfg if isinstance(cfg, dict) else {}
    rooms = []
    for r in (cfg.get("rooms") or [])[:MAX_ROOMS]:
        if not isinstance(r, dict):
            continue
        if r.get("whole"):
            # Whole House: everything from every room; it only has a name and a place in the order
            if not any(x.get("whole") for x in rooms):
                whole = {"whole": True, "name": _text(r.get("name"), 40) or "Whole House"}
                if isinstance(r.get("listen"), bool):
                    whole["listen"] = r["listen"]
                if _ids(r.get("scenes")):
                    whole["scenes"] = _ids(r.get("scenes"))  # whole-house scenes: shown in every room
                rooms.append(whole)
            continue
        room: dict[str, Any] = {"name": _text(r.get("name"), 40) or f"Room {len(rooms) + 1}"}
        if isinstance(r.get("listen"), bool):
            room["listen"] = r["listen"]  # Listen shows in this room
        for k in ROOM_LISTS:
            room[k] = _ids(r.get(k))
        srcs = [_source(x) for x in (r.get("sources") or [])[:16] if isinstance(x, dict)]
        if any(srcs):
            room["sources"] = [x for x in srcs if x]
        if _text(r.get("image"), 500):
            room["image"] = _text(r.get("image"), 500)
        rooms.append(room)
    out: dict[str, Any] = {"rooms": rooms}
    for k in HOUSE_LISTS:
        out[k] = _ids(cfg.get(k))
    for k in ("houseImage", "weather"):
        if _text(cfg.get(k), 500):
            out[k] = _text(cfg.get(k), 500)
    types = cfg.get("lightTypes")
    if isinstance(types, dict):
        out["lightTypes"] = {e: t for e, t in types.items() if isinstance(e, str) and t in ("lamp", "edison", "downlight", "bulb")}
    if cfg.get("lightTone") in ("warm", "soft", "neutral", "cool", "daylight"):
        out["lightTone"] = cfg["lightTone"]
    if cfg.get("listenStart") in ("ma", "spotify"):
        out["listenStart"] = cfg["listenStart"]
    icons = cfg.get("icons")
    if isinstance(icons, dict):
        out["icons"] = {k: v for k, v in icons.items() if k in ICON_KEYS and _icon(v)}
    solar = cfg.get("solar")
    if isinstance(solar, dict) and solar.get("mode") in ("simple", "card"):
        so: dict[str, Any] = {"mode": solar["mode"], "e": {k: v for k, v in (solar.get("e") or {}).items() if k in SOLAR_KEYS and _ent(v)}}
        if solar.get("preset") in INVERTERS:
            so["preset"] = solar["preset"]
        for k in ("invGrid", "invBat"):
            if solar.get(k):
                so[k] = True
        out["solar"] = so
    people = cfg.get("people")
    if isinstance(people, dict):
        out["people"] = {"on": bool(people.get("on")), "list": _ids(people.get("list"))}
    names = cfg.get("names")
    if isinstance(names, dict):
        out["names"] = {e: _text(n, 40) for e, n in list(names.items())[:500] if _ent(e) and _text(n, 40)}
    rtsp = []
    for c in (cfg.get("rtsp") or [])[:12]:
        if isinstance(c, dict) and _text(c.get("url"), 1000).lower().startswith(("rtsp://", "rtsps://", "http://", "https://")):
            rtsp.append({"name": _text(c.get("name"), 40) or f"Camera {len(rtsp) + 1}", "url": _text(c.get("url"), 1000)})
    if rtsp:
        out["rtsp"] = rtsp
    return out


def _ent(v: Any) -> str | None:
    return v if isinstance(v, str) and "." in v and len(v) < 255 else None


def _source(s: dict[str, Any]) -> dict[str, Any] | None:
    """One Watch source (the same format as AR NSPanel Pro's)."""
    sid = _text(s.get("id"), 60)
    if not sid:
        return None
    out: dict[str, Any] = {"id": sid, "name": _text(s.get("name"), 40) or "Source"}
    logo = s.get("logo")
    if isinstance(logo, dict) and _text(logo.get("src"), 500):
        out["logo"] = {"src": _text(logo.get("src"), 500)}
    if s.get("hideName"):
        out["hideName"] = True
    steps = []
    for st in (s.get("steps") or [])[:24]:
        if not isinstance(st, dict) or st.get("t") not in watch.STEP_TYPES:
            continue
        x: dict[str, Any] = {"t": st["t"]}
        for k in ("e", "offE"):
            if _ent(st.get(k)):
                x[k] = st[k]
        for k in ("v", "offV", "label"):
            if _text(st.get(k), 200):
                x[k] = _text(st.get(k), 200)
        if isinstance(st.get("s"), (int, float)):
            x["s"] = max(0, min(30, float(st["s"])))
        if st.get("off") is False:
            x["off"] = False
        if st["t"] == "action" and isinstance(st.get("d"), dict):
            x["d"] = {str(k)[:40]: v for k, v in list(st["d"].items())[:10] if isinstance(v, (str, int, float, bool))}
        steps.append(x)
    out["steps"] = steps
    rem = s.get("remote")
    if isinstance(rem, dict) and _ent(rem.get("e")):
        out["remote"] = {"e": rem["e"], "kind": rem.get("kind") if rem.get("kind") in watch.KEYS else "appletv"}
        if isinstance(rem.get("keys"), dict):
            out["remote"]["keys"] = {k: _text(v, 200) for k, v in rem["keys"].items() if k in watch.ADB_KEYS and _text(v, 200)}
    for k in ("player", "volume"):
        if _ent(s.get(k)):
            out[k] = s[k]
    if s.get("offAll"):
        out["offAll"] = True
    return out


def _icon(v: Any) -> bool:
    return isinstance(v, str) and len(v) < 300 and (v == "line" or v.startswith(("lib:", "media:", UPLOADS["icon"][0] + "/")))


def for_user(cfg: dict[str, Any], admin: bool) -> dict[str, Any]:
    """What a phone is sent: no RTSP addresses (passwords) unless admin."""
    if admin or not cfg.get("rtsp"):
        return cfg
    return {**cfg, "rtsp": [{"name": c["name"]} for c in cfg["rtsp"]]}


async def _store_and_tell(hass: HomeAssistant, cfg: dict[str, Any]) -> dict[str, Any]:
    st = await async_store(hass)
    old = {c["url"] for c in st["config"].get("rtsp", [])}
    st["config"] = cfg
    await st["store"].async_save(cfg)
    gone = old - {c["url"] for c in cfg.get("rtsp", [])}
    for url in gone:  # a removed or changed camera: stop its stream
        s = st["streams"].pop(url, None)
        if s:
            hass.async_create_task(s.stop())
    async_dispatcher_send(hass, SIGNAL)
    return cfg


async def async_store(hass: HomeAssistant) -> dict[str, Any]:
    st = hass.data.get(_DATA)
    if st is None:
        store = Store(hass, STORE_VERSION, STORE_KEY)
        st = hass.data[_DATA] = {"store": store, "config": clean(await store.async_load() or {}), "streams": {}}
    return st


async def _rtsp_stream(hass: HomeAssistant, index: int) -> Any:
    """Home Assistant's stream for RTSP camera number ``index`` (made once, kept)."""
    st = await async_store(hass)
    cams = st["config"].get("rtsp", [])
    if not 0 <= index < len(cams):
        raise HomeAssistantError("No such camera")
    url = cams[index]["url"]
    stream = st["streams"].get(url)
    if stream is None:
        from homeassistant.components.stream import HLS_PROVIDER, create_stream  # noqa: PLC0415

        try:
            from homeassistant.components.camera.prefs import DynamicStreamSettings  # noqa: PLC0415
        except ImportError:  # older Home Assistant
            from homeassistant.components.camera import DynamicStreamSettings  # type: ignore[attr-defined] # noqa: PLC0415
        if "stream" not in hass.config.components:
            raise HomeAssistantError("Home Assistant's Stream integration isn't running (it comes with default_config).")
        stream = create_stream(hass, url, {"rtsp_transport": "tcp"}, DynamicStreamSettings(), stream_label=f"4C Dash {cams[index]['name']}")
        stream.add_provider(HLS_PROVIDER)
        st["streams"][url] = stream
    return stream


class SnapView(HomeAssistantView):
    """A still picture of RTSP camera number ``index`` (logged-in users)."""

    url = "/api/ar_4c_dash/snap/{index}"
    name = "api:ar_4c_dash:snap"
    requires_auth = True

    async def get(self, request: web.Request, index: str) -> web.Response:
        hass: HomeAssistant = request.app["hass"]
        try:
            stream = await _rtsp_stream(hass, int(index))
            img = await stream.async_get_image(width=800)
        except Exception:  # noqa: BLE001 - the camera is off or unreachable
            img = None
        if not img:
            return web.Response(status=503)
        return web.Response(body=img, content_type="image/jpeg", headers={"Cache-Control": "no-store"})


@callback
def async_setup(hass: HomeAssistant) -> None:
    websocket_api.async_register_command(hass, ws_config)
    websocket_api.async_register_command(hass, ws_subscribe)
    websocket_api.async_register_command(hass, ws_save)
    websocket_api.async_register_command(hass, ws_set_icon)
    websocket_api.async_register_command(hass, ws_set_names)
    websocket_api.async_register_command(hass, ws_logo)
    websocket_api.async_register_command(hass, ws_stream)
    websocket_api.async_register_command(hass, ws_watch)
    websocket_api.async_register_command(hass, ws_watch_subscribe)
    websocket_api.async_register_command(hass, ws_listen)
    hass.http.register_view(SnapView)


@websocket_api.websocket_command({vol.Required("type"): "ar_4c_dash/config"})
@websocket_api.async_response
async def ws_config(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    st = await async_store(hass)
    admin = bool(connection.user and connection.user.is_admin)
    connection.send_result(msg["id"], {"config": for_user(st["config"], admin), "admin": admin})


@websocket_api.websocket_command({vol.Required("type"): "ar_4c_dash/subscribe"})
@websocket_api.async_response
async def ws_subscribe(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    admin = bool(connection.user and connection.user.is_admin)

    @callback
    def send() -> None:
        st = hass.data[_DATA]
        connection.send_message(websocket_api.event_message(msg["id"], {"config": for_user(st["config"], admin), "admin": admin}))

    await async_store(hass)
    connection.subscriptions[msg["id"]] = async_dispatcher_connect(hass, SIGNAL, send)
    connection.send_result(msg["id"])
    send()


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): "ar_4c_dash/save", vol.Required("config"): dict})
@websocket_api.async_response
async def ws_save(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    st = await async_store(hass)
    cfg = dict(msg["config"])
    # the Setup page sends the icons it had; keep the newest ones from the store
    cfg["icons"] = st["config"].get("icons", {})
    cfg["names"] = st["config"].get("names", {})
    cfg = await _store_and_tell(hass, clean(cfg))
    connection.send_result(msg["id"], {"config": cfg})


@websocket_api.websocket_command({vol.Required("type"): "ar_4c_dash/set_icon", vol.Required("key"): vol.In(ICON_KEYS), vol.Optional("value"): vol.Any(str, None)})
@websocket_api.async_response
async def ws_set_icon(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    st = await async_store(hass)
    cfg = dict(st["config"])
    icons = dict(cfg.get("icons", {}))
    v = msg.get("value")
    if v and _icon(v):
        icons[msg["key"]] = v
    else:
        icons.pop(msg["key"], None)
    cfg["icons"] = icons
    await _store_and_tell(hass, clean(cfg))
    connection.send_result(msg["id"], {"icons": icons})


@websocket_api.websocket_command({vol.Required("type"): "ar_4c_dash/set_names", vol.Required("names"): dict})
@websocket_api.async_response
async def ws_set_names(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Rename lights on the dash (an empty name goes back to Home Assistant's)."""
    st = await async_store(hass)
    cfg = dict(st["config"])
    names = dict(cfg.get("names", {}))
    for e, n in list(msg["names"].items())[:200]:
        n = _text(n, 40)
        if not _ent(e):
            continue
        if n:
            names[e] = n
        else:
            names.pop(e, None)
    cfg["names"] = names
    cfg = await _store_and_tell(hass, clean(cfg))
    connection.send_result(msg["id"], {"names": cfg.get("names", {})})


@websocket_api.websocket_command({
    vol.Required("type"): "ar_4c_dash/logo",
    vol.Required("op"): vol.In(("list", "upload", "delete")),
    vol.Optional("kind", default="logo"): vol.In(tuple(UPLOADS)),
    vol.Optional("data"): str,
    vol.Optional("url"): str,
})
@websocket_api.async_response
async def ws_logo(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Pictures uploaded on the dash: Watch logos (admins), home-button icons and
    backgrounds (anyone, like changing an icon). The phone takes the background
    off logos and icons and shrinks photos before sending them."""
    kind = msg["kind"]
    if kind == "logo" and not connection.user.is_admin:
        connection.send_error(msg["id"], "unauthorized", "Only admins can change Watch logos")
        return
    url, sub = UPLOADS[kind]
    folder = Path(hass.config.path(sub))
    pat = re.compile(r"[0-9a-f]{12}\.(png|jpg)")

    def run() -> Any:
        folder.mkdir(parents=True, exist_ok=True)
        if msg["op"] == "upload":
            data = base64.b64decode(msg.get("data", "").split(",")[-1], validate=True)
            if data.startswith(b"\x89PNG\r\n\x1a\n"):
                ext = "png"
            elif data.startswith(b"\xff\xd8\xff"):
                ext = "jpg"
            else:
                raise ValueError("That isn't a picture")
            if len(data) > 6_000_000:
                raise ValueError("That picture is too big")
            name = hashlib.sha1(data).hexdigest()[:12] + "." + ext
            (folder / name).write_bytes(data)
            return {"url": f"{url}/{name}"}
        if msg["op"] == "delete":
            name = Path(msg.get("url", "")).name
            if pat.fullmatch(name):
                (folder / name).unlink(missing_ok=True)
        files = sorted((f for f in folder.iterdir() if pat.fullmatch(f.name)), key=lambda f: f.stat().st_mtime, reverse=True)
        return {"logos": [f"{url}/{f.name}" for f in files]}

    try:
        connection.send_result(msg["id"], await hass.async_add_executor_job(run))
    except (ValueError, binascii.Error, OSError) as err:
        connection.send_error(msg["id"], "upload", str(err) or "Couldn't save the picture")


@websocket_api.websocket_command({vol.Required("type"): "ar_4c_dash/stream", vol.Required("index"): int})
@websocket_api.async_response
async def ws_stream(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    from homeassistant.components.stream import HLS_PROVIDER  # noqa: PLC0415

    try:
        stream = await _rtsp_stream(hass, msg["index"])
        await stream.start()
        connection.send_result(msg["id"], {"url": stream.endpoint_url(HLS_PROVIDER)})
    except Exception as err:  # noqa: BLE001
        connection.send_error(msg["id"], "stream", str(err) or "The camera can't be streamed")


@websocket_api.websocket_command({vol.Required("type"): "ar_4c_dash/watch", vol.Required("action"): vol.In(("start", "key", "vol", "mute", "off")), vol.Required("room"): int, vol.Optional("src"): str, vol.Optional("k"): str, vol.Optional("d"): int})
@websocket_api.async_response
async def ws_watch(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    st = await async_store(hass)
    try:
        await watch.async_action(hass, st["config"], msg["action"], msg)
        connection.send_result(msg["id"])
    except Exception as err:  # noqa: BLE001
        connection.send_error(msg["id"], "watch", str(err) or "That didn't work")


@websocket_api.websocket_command({vol.Required("type"): "ar_4c_dash/watch_subscribe"})
@callback
def ws_watch_subscribe(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    @callback
    def send() -> None:
        connection.send_message(websocket_api.event_message(msg["id"], watch.state(hass)))

    connection.subscriptions[msg["id"]] = async_dispatcher_connect(hass, watch.SIGNAL_WATCH, send)
    connection.send_result(msg["id"])
    send()


@websocket_api.websocket_command({vol.Required("type"): "ar_4c_dash/listen", vol.Required("op"): vol.In(("info", "library", "search", "spotify_token")), vol.Optional("media_type"): str, vol.Optional("favorite"): bool, vol.Optional("q"): str, vol.Optional("limit"): int})
@websocket_api.async_response
async def ws_listen(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    op = msg["op"]
    try:
        if op == "info":
            res: Any = listen.info(hass)
        elif op == "spotify_token":
            res = await listen.spotify_token(hass)
        else:
            res = await listen.ma_call(hass, op, msg)
        connection.send_result(msg["id"], res)
    except Exception as err:  # noqa: BLE001
        connection.send_error(msg["id"], "listen", str(err) or "That didn't work")
