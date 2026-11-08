"""Listen for the 4C Dash: Music Assistant and Spotify, through Home Assistant.

Music Assistant: Home Assistant's Music Assistant integration (library, favourites,
search with its own services; play, group and volume on its media players).
Spotify: Home Assistant's Spotify integration holds the account; a phone asks for
a short-lived access token and talks to Spotify's Web API itself, the same way the
AR NSPanel Pro panels do.
"""

from __future__ import annotations

import logging
from typing import Any

from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er

_LOGGER = logging.getLogger(__name__)
MA = "music_assistant"


def _loaded(hass: HomeAssistant, domain: str) -> list[Any]:
    return [e for e in hass.config_entries.async_entries(domain) if e.state is ConfigEntryState.LOADED]


def info(hass: HomeAssistant) -> dict[str, Any]:
    """What a phone's Listen page can use."""
    ma = _loaded(hass, MA)
    players: list[str] = []
    if ma:
        reg = er.async_get(hass)
        players = sorted(e.entity_id for e in reg.entities.values() if e.platform == MA and e.domain == "media_player" and not e.disabled_by)
    return {"ma": bool(ma), "maPlayers": players, "spotify": bool(_loaded(hass, "spotify"))}


async def ma_call(hass: HomeAssistant, op: str, data: dict[str, Any]) -> Any:
    """library {media_type, favorite?} / search {q}: Music Assistant's own services."""
    entries = _loaded(hass, MA)
    if not entries:
        raise ValueError("Music Assistant isn't set up in Home Assistant")
    eid = entries[0].entry_id
    if op == "library":
        args = {"config_entry_id": eid, "media_type": data.get("media_type") or "playlist", "limit": min(int(data.get("limit") or 60), 200), "order_by": "name"}
        if data.get("favorite"):
            args["favorite"] = True
        return await hass.services.async_call(MA, "get_library", args, blocking=True, return_response=True)
    if op == "search":
        q = str(data.get("q") or "").strip()[:100]
        if not q:
            return {}
        return await hass.services.async_call(MA, "search", {"config_entry_id": eid, "name": q, "limit": 8}, blocking=True, return_response=True)
    raise ValueError("unknown")


async def spotify_token(hass: HomeAssistant) -> dict[str, Any]:
    entries = _loaded(hass, "spotify")
    if not entries:
        return {"error": "Add the Spotify integration in Home Assistant (Settings > Devices & services) first."}
    entry = entries[0]
    try:
        session = getattr(getattr(entry, "runtime_data", None), "session", None)
        if session is None:
            from homeassistant.helpers.config_entry_oauth2_flow import OAuth2Session, async_get_config_entry_implementation  # noqa: PLC0415

            session = OAuth2Session(hass, entry, await async_get_config_entry_implementation(hass, entry))
        await session.async_ensure_token_valid()
        tok = session.token
        return {"token": tok.get("access_token"), "expires_at": tok.get("expires_at"), "name": entry.title}
    except Exception as err:  # noqa: BLE001
        _LOGGER.warning("4C Dash: Spotify token failed: %s", err)
        return {"error": f"Home Assistant couldn't refresh the Spotify login: {err}"}
