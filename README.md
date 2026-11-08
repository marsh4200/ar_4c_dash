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
- **Whole home**: Cameras, Alarm, Utilities (pumps, geysers, sensors…) and the Weather shown on the home screen.
- **Copy from an AR NSPanel Pro panel** (only shown when AR NSPanel Pro is installed): takes the rooms, devices, lamp types and background from a panel's Device Setup in one go. Check it, then Save.
- **Save for everyone**: every phone shows the new setup.

## Using it on a phone

Open the Home Assistant app → sidebar → **4C Dash** (Settings → Profile can hide the other sidebar items, or make it the app's default page). The ☰ button top left opens Home Assistant's own menu.

- **Home**: clock, date and weather, the room's buttons three across, Room Off. Tap the room name to switch rooms.
- **Lights**: slide along a light to dim it, tap it for on/off; All on, the room's scenes and All off above.
- **Comfort**: a dial with − and +, modes and fan speeds.
- **Listen / Watch**: now playing, play/pause/skip, volume, sources.
- **Shades**: up/stop/down and position. **Scenes**, **Security** (arm/disarm; a keypad when the alarm needs a code), **Cameras** (snapshots, tap for a bigger live view), **Utilities**.
- Gear → **Icons**: change the home buttons' icons (by category: Lighting, Climate, Security, Media, Doors & shades, Utilities, Scenes & rooms; icons uploaded in AR Lighting Scenes show too). Gear → **Look**: Rings or Icons only, and the background.

Icons, look, background and the last room are saved with each person's Home Assistant login, so they follow them to every phone.

## Also as a card

`type: custom:ar-4c-dash` shows the same dash on any dashboard (best on a Panel view).
