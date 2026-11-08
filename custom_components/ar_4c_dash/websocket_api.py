"""The dash's setup (rooms, devices, home-button icons), kept in Home Assistant's storage.

ar_4c_dash/config     any logged-in user: the setup (what the dash shows)
ar_4c_dash/subscribe  any logged-in user: the setup now and after every change, so
                      every open phone updates straight away
ar_4c_dash/save       admins: replace the setup (from the dash's Setup page)
ar_4c_dash/set_icon   any logged-in user: one home button's icon, for every phone
ar_4c_dash/stream     any logged-in user: live video of an RTSP camera (HLS address)

RTSP addresses carry the camera's password, so only admins are sent them; phones
get the names and ask Home Assistant for the stream or a snapshot by number.
"""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from aiohttp import web

from homeassistant.components import websocket_api
from homeassistant.components.http import HomeAssistantView
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.dispatcher import async_dispatcher_connect, async_dispatcher_send
from homeassistant.helpers.storage import Store

from .const import DOMAIN, MAX_ROOMS, STORE_KEY, STORE_VERSION

_DATA = f"{DOMAIN}_store"
ROOM_LISTS = ("lights", "climate", "music", "watch", "shades", "scenes")
HOUSE_LISTS = ("cameras", "security", "utilities")
ICON_KEYS = ("lights", "climate", "music", "watch", "shades", "cameras", "utilities", "security", "scenes")
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
        room: dict[str, Any] = {"name": _text(r.get("name"), 40) or f"Room {len(rooms) + 1}"}
        for k in ROOM_LISTS:
            room[k] = _ids(r.get(k))
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
    icons = cfg.get("icons")
    if isinstance(icons, dict):
        out["icons"] = {k: v for k, v in icons.items() if k in ICON_KEYS and _icon(v)}
    rtsp = []
    for c in (cfg.get("rtsp") or [])[:12]:
        if isinstance(c, dict) and _text(c.get("url"), 1000).lower().startswith(("rtsp://", "rtsps://", "http://", "https://")):
            rtsp.append({"name": _text(c.get("name"), 40) or f"Camera {len(rtsp) + 1}", "url": _text(c.get("url"), 1000)})
    if rtsp:
        out["rtsp"] = rtsp
    return out


def _icon(v: Any) -> bool:
    return isinstance(v, str) and len(v) < 300 and (v == "line" or v.startswith(("lib:", "media:")))


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
    websocket_api.async_register_command(hass, ws_stream)
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
