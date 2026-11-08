"""AR 4C Dash: the AR Smart Home Residence look as a phone dashboard.

Adds a "4C Dash" dashboard (Settings > Dashboards) for every user, made once when the
integration is added: rename it per customer, change its icon, hide it from the
sidebar or set it as the default dashboard there, like any other dashboard. If
Home Assistant won't let it be made, a plain "4C Dash" sidebar item is added instead. Open it in
the Home Assistant app on a phone: it uses HA's own login and remote access and
talks to HA directly, so a phone needs nothing else (no ADB, no app of ours).
The rooms and devices are set up in the dash itself (gear > Setup, admins).
"""

from __future__ import annotations

import inspect
import json
import logging
from pathlib import Path
from typing import Any

from homeassistant.components.frontend import add_extra_js_url, async_register_built_in_panel, async_remove_panel
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.storage import Store
from homeassistant.helpers.typing import ConfigType

from . import websocket_api
from .const import DOMAIN, PANEL_ELEMENT, PANEL_JS, PANEL_URL, STATIC_URL, UPLOADS

_LOGGER = logging.getLogger(__name__)
_WWW = Path(__file__).parent / "www"
CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    websocket_api.async_setup(hass)
    return True


def _version() -> str:
    try:
        return str(json.loads((Path(__file__).parent / "manifest.json").read_text())["version"])
    except Exception:  # noqa: BLE001
        return "1"


DASH_STORE = f"{DOMAIN}.dashboard"
DASH_CONFIG = {
    "views": [
        {"title": "Home", "path": "home", "type": "panel", "cards": [{"type": "custom:ar-4c-dash", "full_screen": True}]}
    ]
}


def _dashboards(hass: HomeAssistant) -> dict[Any, Any] | None:
    """Home Assistant's dashboards (url path -> dashboard)."""
    data = hass.data.get("lovelace")
    dbs = getattr(data, "dashboards", None)
    if dbs is None and isinstance(data, dict):
        dbs = data.get("dashboards")
    return dbs


def _collection(hass: HomeAssistant) -> Any:
    """Home Assistant's list of dashboards (the one Settings > Dashboards edits)."""
    handler = (hass.data.get("websocket_api") or {}).get("lovelace/dashboards/create")
    if not handler:
        return None
    fn = inspect.unwrap(handler[0])
    return getattr(getattr(fn, "__self__", None), "storage_collection", None)


async def _ensure_dashboard(hass: HomeAssistant) -> bool:
    """Make the 4C Dash dashboard once. True when it's there (or the user removed it on purpose)."""
    store: Store[dict[str, Any]] = Store(hass, 1, DASH_STORE)
    made = await store.async_load() or {}
    dbs = _dashboards(hass)
    if dbs is None:
        return False
    if made.get("url"):
        # made before: renamed, moved or deleted by the user since is theirs to keep
        return True
    col = _collection(hass)
    if col is None:
        return False
    url = next(u for u in (PANEL_URL, "ar-4c-dash", "ar-4c-dash-2") if u not in dbs)
    try:
        await col.async_create_item(
            {"url_path": url, "title": "4C Dash", "icon": "mdi:cellphone-text", "show_in_sidebar": True, "require_admin": False, "mode": "storage"}
        )
        await dbs[url].async_save(DASH_CONFIG)
    except Exception as err:  # noqa: BLE001
        _LOGGER.warning("AR 4C Dash: couldn't add the dashboard (%s); adding a sidebar item instead", err)
        return False
    await store.async_save({"url": url})
    _LOGGER.info("AR 4C Dash: added the dashboard /%s (Settings > Dashboards)", url)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    await websocket_api.async_store(hass)
    if not hass.data.get(f"{DOMAIN}_static"):
        # pictures uploaded on the dash (logos, icons, backgrounds) live in the
        # config folder, so updates keep them
        folders = [(url, Path(hass.config.path(d))) for url, d in UPLOADS.values()]
        await hass.async_add_executor_job(lambda: [f.mkdir(parents=True, exist_ok=True) for _, f in folders])
        await hass.http.async_register_static_paths(
            [StaticPathConfig(STATIC_URL, str(_WWW), cache_headers=False)]
            + [StaticPathConfig(url, str(f), cache_headers=True) for url, f in folders]
        )
        hass.data[f"{DOMAIN}_static"] = True
    version = await hass.async_add_executor_job(_version)
    # the dash as a card on every dashboard (custom:ar-4c-dash), no resource to add
    add_extra_js_url(hass, f"{STATIC_URL}/{PANEL_JS}?v={version}")
    if await _ensure_dashboard(hass):
        return True
    hass.data[f"{DOMAIN}_panel"] = True
    async_register_built_in_panel(
        hass,
        component_name="custom",
        sidebar_title="4C Dash",
        sidebar_icon="mdi:cellphone-text",
        frontend_url_path=PANEL_URL,
        require_admin=False,
        config={
            "_panel_custom": {
                "name": PANEL_ELEMENT,
                "module_url": f"{STATIC_URL}/{PANEL_JS}?v={version}",
                "embed_iframe": False,
                "trust_external": False,
            }
        },
    )
    _LOGGER.info("AR 4C Dash is in the sidebar at /%s", PANEL_URL)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    if hass.data.pop(f"{DOMAIN}_panel", False):
        async_remove_panel(hass, PANEL_URL)
    return True


async def async_remove_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Removing the integration: the dashboard stays (it's the user's); adding it
    again makes a new one only if that one was deleted."""
    await Store(hass, 1, DASH_STORE).async_remove()
