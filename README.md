# AR 4C Dash

The AR Smart Home **Residence** look as a phone dashboard, for Home Assistant.

It adds a **4C Dash** dashboard (Settings → Dashboards) for every user, in the sidebar. Open it in the **Home Assistant app** on a phone: it uses HA's own login and remote access and talks to Home Assistant directly. A phone needs nothing else: no ADB, no APK, no MQTT broker. It works at home and away, wherever the HA app works.

A separate integration: it does not need AR NSPanel Pro.

## Install

1. HACS → Integrations → ⋮ → Custom repositories → `https://github.com/marsh4200/ar_4c_dash` (category Integration) → install **AR 4C Dash**, then restart Home Assistant.
2. Settings → Devices & services → Add integration → **AR 4C Dash**.
3. **4C Dash** is now in Settings → Dashboards and in the sidebar. Like any dashboard: ⋮ → **Edit** to rename it for the customer (e.g. "Smith Residence") or change its icon, ⋮ → **Set as default** to open it first. Renames and deletes are kept: the integration makes the dashboard only once. It fills the phone (Home Assistant's title bar is hidden on it).

## Set it up (admins)

Open 4C Dash → tap the empty top-right corner **10 times quickly** → the gear shows for 20 seconds → gear → **Setup**. (The gear stays hidden so guests and clients don't find it.)

- **Add room**, name it, and add what is in it: Lights (lights and switches), Comfort (climate), Listen and Watch (media players), Shades (covers), Scenes (scenes and scripts). Tap a device to remove it; Move up / Move down sets the room order.
- **Whole House room**: add it with the Whole House chip. It shows every room's lights (grouped by room), speakers and TVs together. Move it up or down like any other room, so it can sit at the top. Its **Whole-house scenes** show on the home screen and on Scenes and Lights in every room; a room's own scenes only show in that room.
- **Listen in this room**: On / Off per room (and for Whole House), so Listen only shows where there are speakers. Rooms not set yet show it only if they have speakers under Listen.
- **Music**: shows whether Music Assistant and Spotify are linked, with a Link / Open button. Music Assistant's server address and login go into Home Assistant's Music Assistant integration (Settings → Devices & services → Add integration → Music Assistant, e.g. `http://<server-ip>:8095`), not into the dash.
- **Listen**: choose whether Listen opens on Music Assistant or Spotify. Music Assistant goes through Home Assistant's Music Assistant integration (which holds the Music Assistant login); its speakers are found by themselves. Spotify uses Home Assistant's Spotify integration or SpotifyPlus (HACS), no extra login. Nothing needs AR NSPanel Pro.
- **Watch sources**: "What would you like to watch?" Each source (Netflix, DStv…) has a name, a logo (pick one, or **Upload** your own: a plain background is taken off so only the logo shows), Name under logo or Logo only, and steps run in order: Turn on, Switch input, Open app, Wait. Turning on is skipped when the device is already on. After the steps, the phone shows that TV's remote.
- **Who's home**: Off / Show, then the people (or phones: device trackers such as the Home Assistant app) to show under the clock (photo in colour with a green dot when home; greyed with Away or the zone name when not).
- **Solar (in Utilities)**: Off, Dash view (the dash's own solar flow and today's totals) or Energy Flow Card (your HACS Energy Flow Card, sized for the phone). Pick the sensors once for either; leave out what you don't have.
- **Whole home**: Cameras, Alarm, **Garage doors**, Utilities (pumps, geysers, sensors…) and the Weather shown on the home screen.
- **Garage doors**: garage doors and gates (covers), or a relay / button wired to the motor. Shown on the Whole House home screen with Open and Close. Optional per door: an open/closed sensor (e.g. a door contact) so the dash shows whether it's open.
- **Names**: the dash's own name for any device (lights, aircons, speakers, TVs, shades, scenes, garage doors…). Leave empty for the Home Assistant name. Every phone shows it.
- **RTSP cameras**: cameras that aren't in Home Assistant, by their RTSP address. Home Assistant turns them into live video for the phones; only admins ever see the address (it has the camera's password in it).
- **Copy from an AR NSPanel Pro panel** (only shown when AR NSPanel Pro is installed): takes the rooms, devices, lamp types and background from a panel's Device Setup in one go. Check it, then Save.
- **Save for everyone**: every phone shows the new setup.

## Using it on a phone

Open the Home Assistant app → sidebar → **4C Dash** (Settings → Profile can hide the other sidebar items, or make it the app's default page). The ☰ button top left opens Home Assistant's own menu.

- **Home**: clock, date and weather, the room's buttons three across, Room Off. Tap the room name to switch rooms.
- **Lights**: slide along a light to dim it, tap it for on/off; All on, the room's scenes and All off above. In Whole House the lights are under their rooms, each room with its own on/off switch. **Rename** gives lights the dash's own names (every phone; empty goes back to Home Assistant's name).
- **Comfort**: a dial with − and +, modes and fan speeds.
- **Listen**: works like the panels. Music Assistant: now playing, speakers (tap one to join or leave the group), Favourites, Playlists, Artists, Radio and Search; open a playlist to play it or one song. Spotify: your playlists, Liked songs, Search, and which speaker plays.
- **Watch**: pick a source; the phone shows each step as it happens (turning on, switching input, opening the app), then the remote: arrows and OK, back, home, menu, play/skip, volume and mute, Change source, TV off.
- **Shades**: up/stop/down and position. **Scenes**, **Security** (arm/disarm; a keypad when the alarm needs a code), **Cameras** (pictures; tap one for live video, from Home Assistant cameras and RTSP cameras), **Utilities**.
- Gear (10 taps top right) → **Icons**: change the home buttons' icons for the whole home: every phone shows the new icon straight away (by category, or **Upload** your own: a plain background is taken off; icons uploaded in AR Lighting Scenes show too). Gear → **Look**: Rings or Icons only, and the background (or **Upload photo**). Uploaded logos, icons and backgrounds are kept in Home Assistant's config folder (`ar_4c_dash/`), so updates keep them.

Icons are the same on every phone. Look, background and the last room are saved with each person's Home Assistant login, so they follow them to every phone.

## Also as a card

`type: custom:ar-4c-dash` shows the same dash on any dashboard (best on a Panel view).

## Changes

- **1.3.5**: Garage doors on the Whole House home screen (open / close, optional open/closed sensor). Names in Setup for every device. Utilities: all switches in one card, Solar on its own tab; the Energy Flow Card no longer rebuilds (looked like a reload) when something else changes. Watch logos keep to their size (a single source no longer shows huge).

- **1.3.4**: Full screen on a phone: the top bar (menu, back, home) sits below the phone's status bar so it can be tapped, and Room Off stays above the gesture bar.

- **1.3.3**: Who's home can also show device trackers (e.g. the Home Assistant app on a phone), not only people.

- **1.3.2**: Listen On / Off per room. Setup shows whether Music Assistant and Spotify are linked, with a button to link them in Home Assistant.

- **1.3.1**: 4C Dash is a real dashboard now (Settings → Dashboards): rename it per customer and set it as the default. Fixes: the dash sometimes didn't load when opened straight from a link, and didn't open on a fresh install before any rooms were set up. Who's home shows only the people you add (it no longer fills in everyone).

- **1.3.0**: Solar in Utilities: the dash's own solar view or your Energy Flow Card. Who's home under the clock (optional). Whole-house scenes on the home screen and in every room. Upload your own icons and background photos (no AR NSPanel Pro or AR Lighting Scenes needed). Spotify also works with SpotifyPlus.

- **1.2.1**: Whole House Lights are grouped by room, each room with an on/off switch. Rename lights on the dash. Watch: logos without a tile, the name under the logo or logo only, upload your own logo with the background taken off; Whole House shows every room's sources. The settings gear is hidden: tap the top-right corner 10 times to show it for 20 seconds.

- **1.2.0**: Listen and Watch now work like AR NSPanel Pro. Listen: Music Assistant (speakers and grouping, favourites, playlists, artists, radio, search) or Spotify (playlists, liked songs, search, choosing the speaker). Watch: sources with start-up steps, then a remote with volume; sources are set up in Setup and copied from a panel too. Whole House is now a room you can add and move anywhere in the room order.

- **1.1.0**: The home buttons sit right under the clock. Icons are for the whole home: change one on a phone and every phone updates straight away (Setup changes too). Cameras: tap one for live video; RTSP cameras can be added in Setup (Home Assistant's Stream integration makes the video; needs `stream`, part of default_config).

- **1.0.1**: No more glitching. The dash only redraws when one of its own devices changes (it was redrawing for every change anywhere in Home Assistant, many times a second), never while a finger is on the screen, and the settings sheet slides in only when it opens. Camera pictures refresh on their own timer instead of reloading with every redraw.
- **1.0.0**: First version.
