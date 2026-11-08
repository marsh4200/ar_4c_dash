"""The dash's setup (rooms and devices), kept in Home Assistant's storage.

ar_4c_dash/config  any logged-in user: the setup (what the dash shows)
ar_4c_dash/save    admins: replace the setup (from the dash's Setup page)
"""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.storage import Store

from .const import DOMAIN, MAX_ROOMS, STORE_KEY, STORE_VERSION

_DATA = f"{DOMAIN}_store"
ROOM_LISTS = ("lights", "climate", "music", "watch", "shades", "scenes")
HOUSE_LISTS = ("cameras", "security", "utilities")


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
    return out


async def async_store(hass: HomeAssistant) -> dict[str, Any]:
    st = hass.data.get(_DATA)
    if st is None:
        store = Store(hass, STORE_VERSION, STORE_KEY)
        st = hass.data[_DATA] = {"store": store, "config": clean(await store.async_load() or {})}
    return st


@callback
def async_setup(hass: HomeAssistant) -> None:
    websocket_api.async_register_command(hass, ws_config)
    websocket_api.async_register_command(hass, ws_save)


@websocket_api.websocket_command({vol.Required("type"): "ar_4c_dash/config"})
@websocket_api.async_response
async def ws_config(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    st = await async_store(hass)
    connection.send_result(msg["id"], {"config": st["config"], "admin": bool(connection.user and connection.user.is_admin)})


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): "ar_4c_dash/save", vol.Required("config"): dict})
@websocket_api.async_response
async def ws_save(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    st = await async_store(hass)
    st["config"] = clean(msg["config"])
    await st["store"].async_save(st["config"])
    connection.send_result(msg["id"], {"config": st["config"]})
