#pragma once
// Copy to secrets.h (gitignored) and fill in. Never commit secrets.h.

#define WIFI_SSID "your-network"
#define WIFI_PASSWORD "your-password"

// https://<project-ref>.supabase.co/functions/v1/device-sync
#define SYNC_URL "https://YOUR-PROJECT.supabase.co/functions/v1/device-sync"

// The device token printed when you registered the board (64 hex chars).
// It can only post this board's readings and read its own commands.
#define DEVICE_TOKEN "paste-the-device-token-here"
