# AR 4C Dash

The AR Smart Home **Residence** look as a phone dashboard, for Home Assistant.

It adds a **4C Dash** item to the Home Assistant sidebar for every user. Open it in the **Home Assistant app** on a phone: it uses HA's own login and remote access and talks to Home Assistant directly. A phone needs nothing else: no ADB, no APK, no MQTT broker. It works at home and away, wherever the HA app works.

A separate integration: it does not need AR NSPanel Pro.

## Install

1. HACS → Integrations → ⋮ → Custom repositories → `https://github.com/marsh4200/ar_4c_dash` (category Integration) → install **AR 4C Dash**, then restart Home Assistant.
2. Settings → Devices & services → Add integration → **AR 4C Dash**.
3. **4C Dash** is now in the sidebar.

## Set it up (admins)

Open 4C Dash → gear → **Setup**:

- **Add room**, name it, and add what is in it: Lights (lights and switches), Comfort (climate), Listen and Watch (media players), Shades (covers), Scenes (scenes and scripts). Tap a device to remove it; Move up / Move down sets the room order.
- **Whole House room**: add it with the Whole House chip. It shows every room's lights, speakers and TVs together. Move it up or down like any other room, so it can sit at the top.
- **Listen**: choose whether Listen opens on Music Assistant or Spotify. Music Assistant speakers are found by themselves; Spotify uses Home Assistant's Spotify integration (no extra login).
- **Watch sources**: "What would you like to watch?" Each source (Netflix, DStv…) has a name, a logo and steps run in order: Turn on, Switch input, Open app, Wait. Turning on is skipped when the device is already on. After the steps, the phone shows that TV's remote.
- **Whole home**: Cameras, Alarm, Utilities (pumps, geysers, sensors…) and the Weather shown on the home screen.
- **RTSP cameras**: cameras that aren't in Home Assistant, by their RTSP address. Home Assistant turns them into live video for the phones; only admins ever see the address (it has the camera's password in it).
- **Copy from an AR NSPanel Pro panel** (only shown when AR NSPanel Pro is installed): takes the rooms, devices, lamp types and background from a panel's Device Setup in one go. Check it, then Save.
- **Save for everyone**: every phone shows the new setup.

## Using it on a phone

Open the Home Assistant app → sidebar → **4C Dash** (Settings → Profile can hide the other sidebar items, or make it the app's default page). The ☰ button top left opens Home Assistant's own menu.

- **Home**: clock, date and weather, the room's buttons three across, Room Off. Tap the room name to switch rooms.
- **Lights**: slide along a light to dim it, tap it for on/off; All on, the room's scenes and All off above.
- **Comfort**: a dial with − and +, modes and fan speeds.
- **Listen**: works like the panels. Music Assistant: now playing, speakers (tap one to join or leave the group), Favourites, Playlists, Artists, Radio and Search; open a playlist to play it or one song. Spotify: your playlists, Liked songs, Search, and which speaker plays.
- **Watch**: pick a source; the phone shows each step as it happens (turning on, switching input, opening the app), then the remote: arrows and OK, back, home, menu, play/skip, volume and mute, Change source, TV off.
- **Shades**: up/stop/down and position. **Scenes**, **Security** (arm/disarm; a keypad when the alarm needs a code), **Cameras** (pictures; tap one for live video, from Home Assistant cameras and RTSP cameras), **Utilities**.
- Gear → **Icons**: change the home buttons' icons for the whole home: every phone shows the new icon straight away (by category: Lighting, Climate, Security, Media, Doors & shades, Utilities, Scenes & rooms; icons uploaded in AR Lighting Scenes show too). Gear → **Look**: Rings or Icons only, and the background.

Icons are the same on every phone. Look, background and the last room are saved with each person's Home Assistant login, so they follow them to every phone.

## Also as a card

`type: custom:ar-4c-dash` shows the same dash on any dashboard (best on a Panel view).

## Changes

- **1.2.0**: Listen and Watch now work like AR NSPanel Pro. Listen: Music Assistant (speakers and grouping, favourites, playlists, artists, radio, search) or Spotify (playlists, liked songs, search, choosing the speaker). Watch: sources with start-up steps, then a remote with volume; sources are set up in Setup and copied from a panel too. Whole House is now a room you can add and move anywhere in the room order.

- **1.1.0**: The home buttons sit right under the clock. Icons are for the whole home: change one on a phone and every phone updates straight away (Setup changes too). Cameras: tap one for live video; RTSP cameras can be added in Setup (Home Assistant's Stream integration makes the video; needs `stream`, part of default_config).

- **1.0.1**: No more glitching. The dash only redraws when one of its own devices changes (it was redrawing for every change anywhere in Home Assistant, many times a second), never while a finger is on the screen, and the settings sheet slides in only when it opens. Camera pictures refresh on their own timer instead of reloading with every redraw.
- **1.0.0**: First version.
