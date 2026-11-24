# SmartPlants firmware

ESP8266 firmware that reads a soil moisture sensor, waters the plant when the soil is dry, and syncs with the dashboard through Supabase.

## What it does

- Reads the sensor every second and converts it to a percentage (600 raw = 0 %, 200 raw = 100 %; adjust `SENSOR_DRY_RAW` and `SENSOR_WET_RAW` for your sensor).
- Shows the level on three LEDs: red when dry, red and yellow when getting dry, all three when well watered.
- Below the dry threshold, pulses the pump: 1 second on, 5 seconds off, so the water soaks in.
- Every 30 seconds, when WiFi is up and the pump is idle, posts a reading to the `device-sync` function. The reply carries the thresholds set on the dashboard and any "water now" commands (capped at 10 seconds).

Watering never waits for the network: without WiFi the board keeps using the last thresholds it received.

## Wiring

| Part | Pin |
| --- | --- |
| Soil moisture sensor (analog out) | A0 |
| Pump driver (relay or MOSFET, active high) | D8 |
| Red / yellow / green LEDs | D3 / D2 / D1 |
| Status LED (lights while pumping) | built-in, GPIO2 |

## Build and flash

1. Install [PlatformIO](https://platformio.org/install).
2. Copy `include/secrets.example.h` to `include/secrets.h` and fill in your WiFi, the `device-sync` URL and the device token. `secrets.h` is gitignored.
3. From this folder: `pio run -t upload`, then `pio device monitor` to watch the log.

The default board is `nodemcuv2`; change `board` in `platformio.ini` for a Wemos D1 mini (`d1_mini`) or similar.

## Security notes

- The device token only lets the board post its own readings and collect its own commands; it cannot read or change anything else.
- TLS uses `setInsecure()`, so the server certificate is not checked. The payload is not sensitive, but pinning the Supabase certificate would harden it.
