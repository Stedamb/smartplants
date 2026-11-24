// SmartPlants: soil moisture sensing and automatic watering on an ESP8266.
//
// Watering is decided here, on the board, so the plant is cared for even without
// WiFi. When online, the board posts a reading to the Supabase `device-sync`
// function and receives its thresholds and any "water now" commands.

#include <Arduino.h>
#include <ArduinoJson.h>
#include <ESP8266HTTPClient.h>
#include <ESP8266WiFi.h>
#include <WiFiClientSecureBearSSL.h>

#include "pins.h"
#include "secrets.h"

// ---- Tuning ---------------------------------------------------------------

// Sensor calibration: raw reading in dry air and in water (600 -> 0 %, 200 -> 100 %).
const int SENSOR_DRY_RAW = 600;
const int SENSOR_WET_RAW = 200;

// Defaults until the backend sends its own (same as the old raw 500 / 350).
int dryThresholdPct = 25;
int warningThresholdPct = 62;

const unsigned long READ_INTERVAL_MS = 1000;
const unsigned long PUMP_PULSE_ON_MS = 1000;   // while dry: pump on for 1 s...
const unsigned long PUMP_PULSE_OFF_MS = 5000;  // ...then off for 5 s, so water can soak in
const unsigned long MAX_WATER_NOW_MS = 10000;  // safety cap for remote "water now"
const unsigned long STARTUP_STEP_MS = 400;
const unsigned long HTTP_TIMEOUT_MS = 5000;
unsigned long syncIntervalMs = 30000;

// ---- State ----------------------------------------------------------------

int rawValue = 0;
int moisturePct = 0;
bool pumpOn = false;
unsigned long pumpChangedAt = 0;
unsigned long manualWaterUntil = 0;  // millis() deadline of a remote "water now"
unsigned long lastReadAt = 0;
unsigned long lastSyncAt = 0;
unsigned long bootAt = 0;
bool starting = true;

int toPercent(int raw) {
  return constrain(map(raw, SENSOR_DRY_RAW, SENSOR_WET_RAW, 0, 100), 0, 100);
}

void setPump(bool on, unsigned long now) {
  if (on == pumpOn) return;
  pumpOn = on;
  pumpChangedAt = now;
  digitalWrite(PIN_PUMP, on ? HIGH : LOW);
  digitalWrite(PIN_STATUS_LED, on ? LOW : HIGH);  // status LED lights while pumping
  Serial.println(on ? "pump on" : "pump off");
}

void setLeds(bool red, bool yellow, bool green) {
  digitalWrite(PIN_RED, red ? HIGH : LOW);
  digitalWrite(PIN_YELLOW, yellow ? HIGH : LOW);
  digitalWrite(PIN_GREEN, green ? HIGH : LOW);
}

// Red, yellow, green on in turn, off in reverse, then all on. Non-blocking.
void startupSequence(unsigned long now) {
  unsigned long step = (now - bootAt) / STARTUP_STEP_MS;
  switch (step) {
    case 0: setLeds(true, false, false); break;
    case 1: setLeds(true, true, false); break;
    case 2: setLeds(true, true, true); break;
    case 3: setLeds(true, true, false); break;
    case 4: setLeds(true, false, false); break;
    case 5: setLeds(false, false, false); break;
    case 6: setLeds(true, true, true); break;
    default:
      setLeds(false, false, false);
      starting = false;
  }
}

// Level meter like before: dry = red, getting dry = red + yellow, fine = all three.
void showLevel() {
  if (moisturePct < dryThresholdPct) setLeds(true, false, false);
  else if (moisturePct < warningThresholdPct) setLeds(true, true, false);
  else setLeds(true, true, true);
}

void controlPump(unsigned long now) {
  if (manualWaterUntil != 0) {
    if ((long)(now - manualWaterUntil) < 0) {
      setPump(true, now);
      return;
    }
    manualWaterUntil = 0;
    setPump(false, now);
  }

  if (moisturePct < dryThresholdPct) {
    unsigned long elapsed = now - pumpChangedAt;
    if (pumpOn && elapsed >= PUMP_PULSE_ON_MS) setPump(false, now);
    else if (!pumpOn && elapsed >= PUMP_PULSE_OFF_MS) setPump(true, now);
  } else {
    setPump(false, now);
  }
}

void applyResponse(const String& body, unsigned long now) {
  JsonDocument doc;
  if (deserializeJson(doc, body)) {
    Serial.println("sync: bad JSON");
    return;
  }

  int dry = doc["thresholds"]["dry_pct"] | dryThresholdPct;
  int warning = doc["thresholds"]["warning_pct"] | warningThresholdPct;
  if (dry >= 0 && warning <= 100 && dry < warning) {
    dryThresholdPct = dry;
    warningThresholdPct = warning;
  }

  int interval = doc["sync_interval_s"] | (int)(syncIntervalMs / 1000);
  if (interval >= 5 && interval <= 3600) syncIntervalMs = (unsigned long)interval * 1000;

  for (JsonObject command : doc["commands"].as<JsonArray>()) {
    if (strcmp(command["kind"] | "", "water") != 0) continue;
    unsigned long duration = min((unsigned long)(command["duration_ms"] | 0), MAX_WATER_NOW_MS);
    if (duration > 0) {
      manualWaterUntil = now + duration;
      Serial.printf("sync: water now for %lu ms\n", duration);
    }
  }
}

void sync(unsigned long now) {
  JsonDocument reading;
  reading["raw"] = rawValue;
  reading["moisture_pct"] = moisturePct;
  reading["pump_on"] = pumpOn;
  String payload;
  serializeJson(reading, payload);

  std::unique_ptr<BearSSL::WiFiClientSecure> client(new BearSSL::WiFiClientSecure);
  // The token only lets this board post its own readings, so the payload is not
  // sensitive; pinning the Supabase certificate is a possible hardening step.
  client->setInsecure();

  HTTPClient http;
  http.setTimeout(HTTP_TIMEOUT_MS);
  if (!http.begin(*client, SYNC_URL)) {
    Serial.println("sync: cannot open connection");
    return;
  }
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-token", DEVICE_TOKEN);

  int status = http.POST(payload);
  if (status == HTTP_CODE_OK) applyResponse(http.getString(), millis());
  else Serial.printf("sync: HTTP %d\n", status);
  http.end();
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_STATUS_LED, OUTPUT);
  pinMode(PIN_SENSOR, INPUT);
  pinMode(PIN_PUMP, OUTPUT);
  pinMode(PIN_RED, OUTPUT);
  pinMode(PIN_YELLOW, OUTPUT);
  pinMode(PIN_GREEN, OUTPUT);
  digitalWrite(PIN_PUMP, LOW);
  digitalWrite(PIN_STATUS_LED, HIGH);

  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);  // connects in the background

  bootAt = millis();
}

void loop() {
  unsigned long now = millis();

  if (starting) {
    startupSequence(now);
    return;
  }

  if (now - lastReadAt >= READ_INTERVAL_MS) {
    rawValue = analogRead(PIN_SENSOR);
    moisturePct = toPercent(rawValue);
    lastReadAt = now;
  }

  controlPump(now);
  showLevel();

  // A sync blocks for up to HTTP_TIMEOUT_MS, so never start one while the pump runs.
  if (!pumpOn && WiFi.status() == WL_CONNECTED && now - lastSyncAt >= syncIntervalMs) {
    lastSyncAt = now;
    sync(now);
  }
}
