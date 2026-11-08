"""AR 4C Dash: the AR Smart Home Residence look as a phone dashboard.

Adds a "4C Dash" item to the Home Assistant sidebar for every user. Open it in
the Home Assistant app on a phone: it uses HA's own login and remote access and
talks to HA directly, so a phone needs nothing else (no ADB, no app of ours).
The rooms and devices are set up in the dash itself (gear > Setup, admins).
"""

from __future__ import annotations

import json
import logging
from pathlib import Path

from homeassistant.components.frontend import async_register_built_in_panel, async_remove_panel
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.typing import ConfigType

from . import websocket_api
from .const import DOMAIN, PANEL_ELEMENT, PANEL_JS, PANEL_URL, STATIC_URL

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


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    await websocket_api.async_store(hass)
    if not hass.data.get(f"{DOMAIN}_static"):
        await hass.http.async_register_static_paths([StaticPathConfig(STATIC_URL, str(_WWW), cache_headers=False)])
        hass.data[f"{DOMAIN}_static"] = True
    version = await hass.async_add_executor_job(_version)
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
    async_remove_panel(hass, PANEL_URL)
    return True
