"""Timers and the household's own scenes, made on the dash (Timers and Scenes pages).

Anyone who may use a home can make them for that home, without being an admin.
They are ordinary Home Assistant automations (automations.yaml) and scenes
(scenes.yaml), so they also show in Settings > Automations & scenes. The dash
only ever lists, changes or deletes the ones it made itself (ids below); the
installer's own automations and scenes are never touched.

    timer   aas_tmr_<home>_<hex>   (aas_tmr_<hex> from the old Auto & Scenes: first home)
    scene   aas_scn_<home>_<hex>   (aas_<hex> from the old Auto & Scenes: first home)

Everything that comes from a phone is checked here before it is written: a timer
only starts at a time, sunrise or sunset, only switches the home's own lights,
curtains, plugs, fans, aircons and speakers on or off, and can be kept to some
days. A scene only sets the home's own devices. No templates, scripts, locks,
garage doors or anything else, whatever the phone sends.
"""

from __future__ import annotations

import asyncio
import logging
import os
import re
from typing import Any
import uuid

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import entity_registry as er
from homeassistant.util.file import write_utf8_file_atomic
from homeassistant.util.yaml import dump, load_yaml

_LOGGER = logging.getLogger(__name__)

FILES = {"timer": "automations.yaml", "scene": "scenes.yaml"}
RELOAD = {"timer": "automation", "scene": "scene"}
ENTITY = {"timer": ("automation", "automation"), "scene": ("scene", "homeassistant")}

# (on / open, off / close) per kind of device. Locks are never offered.
TIMER_SERVICES: dict[str, tuple[str, str]] = {
    "light": ("turn_on", "turn_off"),
    "switch": ("turn_on", "turn_off"),
    "fan": ("turn_on", "turn_off"),
    "input_boolean": ("turn_on", "turn_off"),
    "cover": ("open_cover", "close_cover"),
    "climate": ("turn_on", "turn_off"),
    "media_player": ("turn_on", "turn_off"),
}
SCENE_STATES: dict[str, tuple[str, ...]] = {
    "light": ("on", "off"),
    "switch": ("on", "off"),
    "fan": ("on", "off"),
    "input_boolean": ("on", "off"),
    "media_player": ("on", "off"),
    "cover": ("open", "closed"),
    "climate": ("off", "heat", "cool", "heat_cool", "auto", "dry", "fan_only"),
}
WEEKDAYS = ("mon", "tue", "wed", "thu", "fri", "sat", "sun")
MAX_EVENTS = 20
MAX_DEVICES = 60

_TIMER_ID = re.compile(r"aas_tmr_(?:(h\d{1,3})_)?[0-9a-f]{12}")
_SCENE_ID = re.compile(r"aas_(?:scn_(h\d{1,3})_)?[0-9a-f]{12}")
_EVENT_ID = re.compile(r"ev\d{1,2}")
_TIME = re.compile(r"([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?")
_OFFSET = re.compile(r"-?\d{1,2}:[0-5]\d:[0-5]\d")


class Unsafe(ValueError):
    """Something a phone sent that the dash doesn't make."""


def home_of(kind: str, item_id: str) -> str | None:
    """The home a timer or scene belongs to, or None if the dash didn't make it."""
    m = (_TIMER_ID if kind == "timer" else _SCENE_ID).fullmatch(item_id)
    if not m:
        return None
    return m.group(1) or "h1"


def new_id(kind: str, home: str) -> str:
    return f"aas_{'tmr' if kind == 'timer' else 'scn'}_{home}_{uuid.uuid4().hex[:12]}"


def home_devices(conf: dict[str, Any]) -> set[str]:
    """What the household may put in timers and scenes: the home's own lights,
    aircons, curtains, speakers and simple utilities (pumps, plugs, geysers on a switch)."""
    out: set[str] = set()
    for room in conf.get("rooms", []):
        for k in ("lights", "climate", "shades", "music"):
            out.update(e for e in room.get(k, []) if isinstance(e, str))
    out.update(e for e in conf.get("utilities", []) if isinstance(e, str))
    return {e for e in out if e.split(".")[0] in TIMER_SERVICES}


# ---- checks ---------------------------------------------------------------------


def _no_templates(v: Any) -> None:
    if isinstance(v, str):
        if "{{" in v or "{%" in v or "{#" in v:
            raise Unsafe("Templates are not allowed")
    elif isinstance(v, dict):
        for k, x in v.items():
            _no_templates(k)
            _no_templates(x)
    elif isinstance(v, list):
        for x in v:
            _no_templates(x)
    elif v is not None and not isinstance(v, (bool, int, float)):
        raise Unsafe("Unsupported value")


def _list(v: Any) -> list:
    return [] if v is None else v if isinstance(v, list) else [v]


def _name(v: Any) -> str:
    if not isinstance(v, str) or not v.strip():
        raise Unsafe("Give it a name")
    if len(v) > 60:
        raise Unsafe("That name is too long")
    return v.strip()


def check_timer(cfg: Any, devices: set[str]) -> None:
    """The exact shape the dash builds, nothing more:
    time / sunrise / sunset triggers with ids evN; one choose with an option per
    trigger (that trigger, maybe some weekdays) switching devices on or off."""
    if not isinstance(cfg, dict):
        raise Unsafe("A timer must be a mapping")
    _no_templates(cfg)
    if set(cfg) - {"id", "alias", "description", "mode", "triggers", "conditions", "actions"}:
        raise Unsafe("Unsupported timer option")
    _name(cfg.get("alias"))
    if cfg.get("mode", "single") not in ("single", "queued", "parallel", "restart"):
        raise Unsafe("Unsupported mode")
    if _list(cfg.get("conditions")):
        raise Unsafe("Timers have no conditions")
    if not isinstance(cfg.get("description", ""), str):
        raise Unsafe("Unsupported description")

    triggers = _list(cfg.get("triggers"))
    if not triggers:
        raise Unsafe("Add at least one time")
    if len(triggers) > MAX_EVENTS:
        raise Unsafe(f"A timer can have at most {MAX_EVENTS} times")
    ids: set[str] = set()
    for t in triggers:
        if not isinstance(t, dict):
            raise Unsafe("Unsupported time")
        tid = t.get("id")
        if not isinstance(tid, str) or not _EVENT_ID.fullmatch(tid) or tid in ids:
            raise Unsafe("Unsupported time")
        ids.add(tid)
        if t.get("trigger") == "time" and set(t) == {"trigger", "at", "id"}:
            if not isinstance(t["at"], str) or not _TIME.fullmatch(t["at"]):
                raise Unsafe("Unsupported time")
        elif t.get("trigger") == "sun" and set(t) - {"offset"} == {"trigger", "event", "id"}:
            if t["event"] not in ("sunrise", "sunset"):
                raise Unsafe("Unsupported time")
            if "offset" in t and (not isinstance(t["offset"], str) or not _OFFSET.fullmatch(t["offset"])):
                raise Unsafe("Unsupported sun offset")
        else:
            raise Unsafe("Timers only start at a time, sunrise or sunset")

    actions = _list(cfg.get("actions"))
    if len(actions) != 1 or not isinstance(actions[0], dict) or set(actions[0]) != {"choose"}:
        raise Unsafe("Unsupported timer action")
    options = actions[0]["choose"]
    if not isinstance(options, list) or not options:
        raise Unsafe("Unsupported timer action")
    done: set[str] = set()
    for opt in options:
        if not isinstance(opt, dict) or set(opt) != {"conditions", "sequence"}:
            raise Unsafe("Unsupported timer step")
        conds = _list(opt["conditions"])
        first = conds[0] if conds else None
        if not isinstance(first, dict) or set(first) != {"condition", "id"} or first["condition"] != "trigger":
            raise Unsafe("Unsupported timer step")
        if first["id"] not in ids or first["id"] in done:
            raise Unsafe("Unsupported timer step")
        done.add(first["id"])
        for c in conds[1:]:
            if not isinstance(c, dict) or set(c) != {"condition", "weekday"} or c["condition"] != "time":
                raise Unsafe("A timer can only be kept to some days")
            days = _list(c["weekday"])
            if not days or any(d not in WEEKDAYS for d in days):
                raise Unsafe("Unsupported day")
        seq = _list(opt["sequence"])
        if not seq:
            raise Unsafe("A time needs at least one device")
        for a in seq:
            if not isinstance(a, dict) or set(a) != {"action", "target"}:
                raise Unsafe("Unsupported timer step")
            svc = a["action"]
            if not isinstance(svc, str) or svc.count(".") != 1:
                raise Unsafe("Unsupported timer step")
            dom, name = svc.split(".")
            if dom not in TIMER_SERVICES or name not in TIMER_SERVICES[dom]:
                raise Unsafe(f"A timer can't do {svc}")
            tgt = a["target"]
            if not isinstance(tgt, dict) or set(tgt) != {"entity_id"}:
                raise Unsafe("Only devices can be targets")
            ents = _list(tgt["entity_id"])
            if not ents or len(ents) > MAX_DEVICES:
                raise Unsafe("A time needs at least one device")
            for e in ents:
                if not isinstance(e, str) or e.split(".")[0] != dom:
                    raise Unsafe(f"{e} can't be used with {svc}")
                if e not in devices:
                    raise Unsafe(f"{e} isn't one of this home's devices")


def check_scene(cfg: Any, devices: set[str]) -> None:
    if not isinstance(cfg, dict):
        raise Unsafe("A scene must be a mapping")
    _no_templates(cfg)
    if set(cfg) - {"id", "name", "icon", "entities"}:
        raise Unsafe("Unsupported scene option")
    _name(cfg.get("name"))
    icon = cfg.get("icon")
    if icon is not None and (not isinstance(icon, str) or not re.fullmatch(r"(mdi|line):[a-z0-9-]{1,40}", icon)):
        raise Unsafe("Unsupported icon")
    ents = cfg.get("entities")
    if not isinstance(ents, dict) or not ents:
        raise Unsafe("Add at least one device")
    if len(ents) > MAX_DEVICES:
        raise Unsafe("Too many devices")
    for e, v in ents.items():
        if not isinstance(e, str) or e not in devices:
            raise Unsafe(f"{e} isn't one of this home's devices")
        dom = e.split(".")[0]
        if dom not in SCENE_STATES or not isinstance(v, dict):
            raise Unsafe(f"Unsupported setting for {e}")
        if v.get("state") not in SCENE_STATES[dom]:
            raise Unsafe(f"Unsupported state for {e}")
        extra = set(v) - {"state"}
        allowed = {"light": {"brightness"}, "cover": {"current_position"}, "climate": {"temperature"}}.get(dom, set())
        if extra - allowed:
            raise Unsafe(f"Unsupported setting for {e}")
        if "brightness" in v and not (isinstance(v["brightness"], int) and 1 <= v["brightness"] <= 255):
            raise Unsafe("Brightness out of range")
        if "current_position" in v and not (isinstance(v["current_position"], int) and 0 <= v["current_position"] <= 100):
            raise Unsafe("Position out of range")
        if "temperature" in v and not (isinstance(v["temperature"], (int, float)) and 5 <= v["temperature"] <= 35):
            raise Unsafe("Temperature out of range")


# ---- the YAML files -------------------------------------------------------------------

_ORDER = {
    "timer": ("id", "alias", "description", "mode", "triggers", "conditions", "actions"),
    "scene": ("id", "name", "icon", "entities"),
}


def _read(path: str) -> list[dict[str, Any]]:
    if not os.path.isfile(path):
        return []
    data = load_yaml(path)
    if data in (None, {}):
        return []
    if not isinstance(data, list):
        raise HomeAssistantError(f"{os.path.basename(path)} isn't a list, so the dash can't add to it")
    return [dict(x) for x in data if isinstance(x, dict)]


def _write(path: str, data: list[dict[str, Any]]) -> None:
    write_utf8_file_atomic(path, dump(data))


_LOCK = asyncio.Lock()


async def _items(hass: HomeAssistant, kind: str) -> list[dict[str, Any]]:
    return await hass.async_add_executor_job(_read, hass.config.path(FILES[kind]))


async def _reload(hass: HomeAssistant, kind: str) -> None:
    dom = RELOAD[kind]
    if not hass.services.has_service(dom, "reload"):
        raise HomeAssistantError(f"Saved, but '{dom}:' isn't in configuration.yaml, so Home Assistant can't load it")
    await hass.services.async_call(dom, "reload", blocking=True)


async def _upsert(hass: HomeAssistant, kind: str, item_id: str, cfg: dict[str, Any]) -> None:
    cfg = {**cfg, "id": item_id}
    cfg = {**{k: cfg[k] for k in _ORDER[kind] if k in cfg}, **{k: v for k, v in cfg.items() if k not in _ORDER[kind]}}
    path = hass.config.path(FILES[kind])
    async with _LOCK:
        data = await hass.async_add_executor_job(_read, path)
        for i, x in enumerate(data):
            if str(x.get("id")) == item_id:
                data[i] = cfg
                break
        else:
            data.append(cfg)
        await hass.async_add_executor_job(_write, path, data)
    await _reload(hass, kind)


async def _delete(hass: HomeAssistant, kind: str, keep: Any) -> int:
    """Remove the dash's items for which keep(id) is False. Returns how many went."""
    path = hass.config.path(FILES[kind])
    async with _LOCK:
        data = await hass.async_add_executor_job(_read, path)
        new = [x for x in data if keep(str(x.get("id", "")))]
        gone = len(data) - len(new)
        if gone:
            await hass.async_add_executor_job(_write, path, new)
    if gone:
        await _reload(hass, kind)
    return gone


async def async_remove_home(hass: HomeAssistant, home: str) -> None:
    """A home was removed: its timers and scenes go too."""
    for kind in FILES:
        try:
            await _delete(hass, kind, lambda i, k=kind: home_of(k, i) != home)
        except HomeAssistantError as err:
            _LOGGER.warning("4C Dash: couldn't remove the %ss of home %s: %s", kind, home, err)


# ---- websocket ---------------------------------------------------------------------------


@callback
def async_setup(hass: HomeAssistant) -> None:
    websocket_api.async_register_command(hass, ws_routines)


@websocket_api.websocket_command({
    vol.Required("type"): "ar_4c_dash/routines",
    vol.Required("op"): vol.In(("list", "save", "delete")),
    vol.Required("kind"): vol.In(tuple(FILES)),
    vol.Optional("home", default="h1"): str,
    vol.Optional("item_id"): str,
    vol.Optional("config"): dict,
})
@websocket_api.async_response
async def ws_routines(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    from .websocket_api import async_store, home_conf  # noqa: PLC0415 - circular

    kind, home, op = msg["kind"], msg["home"], msg["op"]
    st = await async_store(hass)
    conf = home_conf(st["config"], home, connection.user)
    if conf is None:
        connection.send_error(msg["id"], "unauthorized", "You can't use that home")
        return
    devices = home_devices(conf)
    check = check_timer if kind == "timer" else check_scene
    reg = er.async_get(hass)
    dom, platform = ENTITY[kind]
    try:
        if op == "list":
            out = []
            for x in await _items(hass, kind):
                iid = str(x.get("id", ""))
                if home_of(kind, iid) != home:
                    continue
                try:
                    check(x, devices)
                    reason = None
                except Unsafe as err:
                    reason = str(err)
                out.append({
                    "id": iid,
                    "name": x.get("alias") if kind == "timer" else x.get("name"),
                    "entity_id": reg.async_get_entity_id(dom, platform, iid),
                    "config": x,
                    "reason": reason,
                })
            connection.send_result(msg["id"], out)
            return

        iid = msg.get("item_id")
        if iid is not None and home_of(kind, iid) != home:
            connection.send_error(msg["id"], "unauthorized", "The dash didn't make that one")
            return
        if op == "delete":
            if iid is None or not await _delete(hass, kind, lambda i: i != iid):
                connection.send_error(msg["id"], "not_found", "It's already gone")
                return
            _LOGGER.info("4C Dash: %s deleted %s %s", connection.user.name, kind, iid)
            connection.send_result(msg["id"], {"id": iid})
            return

        cfg = dict(msg.get("config") or {})
        iid = iid or new_id(kind, home)
        cfg["id"] = iid
        check(cfg, devices)
        await _upsert(hass, kind, iid, cfg)
        _LOGGER.info("4C Dash: %s saved %s %s", connection.user.name, kind, iid)
        connection.send_result(msg["id"], {"id": iid, "entity_id": reg.async_get_entity_id(dom, platform, iid)})
    except Unsafe as err:
        connection.send_error(msg["id"], "invalid", str(err))
    except HomeAssistantError as err:
        connection.send_error(msg["id"], "failed", str(err))
