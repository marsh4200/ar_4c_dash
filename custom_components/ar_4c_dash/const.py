"""Constants for AR 4C Dash."""

DOMAIN = "ar_4c_dash"
STATIC_URL = "/ar_4c_dash_static"
PANEL_URL = "4c-dash"
PANEL_ELEMENT = "ar-4c-dash-panel"
PANEL_JS = "ar-4c-dash.js"
STORE_KEY = f"{DOMAIN}.config"
STORE_VERSION = 1
MAX_ROOMS = 30
LOGO_URL = "/ar_4c_dash_logos"
LOGO_DIR = "ar_4c_dash/logos"  # in the Home Assistant config folder
# pictures uploaded on the dash: kind -> (web address, folder in the config folder)
UPLOADS = {
    "logo": (LOGO_URL, LOGO_DIR),
    "icon": ("/ar_4c_dash_icons", "ar_4c_dash/icons"),
    "bg": ("/ar_4c_dash_backgrounds", "ar_4c_dash/backgrounds"),
}
