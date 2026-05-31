# AgroFlow 🔌🌲 (Edge IoT Controller Firmware)

This directory contains the C++ firmware for the **AgroFlow Smart Irrigation NodeMCU ESP8266 Core**. 

The hardware controller is designed to monitor analog soil moisture sensors, drive physical drip-irrigation pump relays, execute local calendar schedule matrices synced via Network Time Protocol (NTP), and enforce active motor over-runtime protection.

---

## 🔌 Hardware Pin Assignment Matrix

Designed and verified on a **NodeMCU 1.0 (ESP-12E Module)** board:

| Pin Name (Board) | GPIO Reference | Component | Functionality |
| :--- | :--- | :--- | :--- |
| **A0** | **ADC0** | Analog Moisture Sensor | Polls raw soil dry/wet levels. Outputs integer scale: `0` (Dry/High Voltage) to `1024` (Fully Saturated). |
| **D1** | **GPIO 5** | Physical Relay Module | Drives high-power AC/DC pump coils. Mode: `OUTPUT`. Active: `HIGH`. |
| **D4** | **GPIO 2** | Onboard Blue Indicator LED | Indicates connection states. Blinks rapidly on boot/reconnect; remains solid during active database links. |

---

## ⚡ Active Failsafe & Operational Logic

1. **Ultra-Fast Polling (1.5s)**: Polls instruction packets from the Firebase Realtime Database `/state` node every 1.5 seconds, ensuring immediate manual triggers or automatic changes take effect.
2. **Stateless On-Chip Scheduler**:
   * Periodically parses the daily calendar parameters configured from the clients (supports up to 5 concurrent schedules).
   * Synchronizes with public pool NTP time servers under a customized Local Time Offset (default: +5:30 IST / 19,800 seconds).
   * Executes scheduled watering cycles locally, ensuring continuous operations.
3. **Motor Protection Safeguard**:
   * Tracks pump operational duration down to the millisecond.
   * If the pump runs continuously past the safety runtime ceiling (`maxRuntimeMinutes`, default: 20 minutes), the firmware automatically shuts down the relay.
   * Sets `/state/pumpProtection/triggered` to `true` and logs the reason. The motor remains safely locked out until cleared manually by the operator from the client app/dashboard.
4. **Active Reconnect Shield**:
   * If connection is dropped, the firmware automatically shuts down the relay to prevent uncontrolled irrigation loops.
   * Actively attempts to reconnect to the WiFi router, feeding the watchdog timer periodically to prevent hardware restarts.

---

## 🛠️ Software Dependencies

The project is compiled using the **Arduino IDE**. The following libraries must be installed via the **Library Manager**:

* **Firebase Arduino Client Library for ESP8266 and ESP32** (by Mobizt)
* **NTPClient** (by Tarauh)
* **ArduinoJson** (by Benoit Blanchon)

---

## 🚀 Setup & Flashing Instructions

1. Install [Arduino IDE](https://www.arduino.cc/en/software).
2. Go to **File** -> **Preferences** -> Add the board manager URL under **Additional Boards Manager URLs**:
   `http://arduino.esp8266.com/stable/package_esp8266com_index.json`
3. Open the Board Manager from **Tools** -> **Board** -> **Boards Manager**, search for `esp8266` and click **Install**.
4. Open the Library Manager from **Tools** -> **Manage Libraries...**, search for and install the libraries listed in the software dependencies section above.
5. Double-click [SmartIrrigation.ino](SmartIrrigation.ino) to open the project in Arduino IDE.
6. Customize the WiFi credentials and Firebase database parameters in the configuration block at the top of the file:
   ```cpp
   #define WIFI_SSID "YOUR_WIFI_SSID"
   #define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"
   #define API_KEY "YOUR_FIREBASE_WEB_API_KEY"
   #define DATABASE_URL "https://YOUR_FIREBASE_URL.firebasedatabase.app"
   #define DATABASE_SECRET "YOUR_FIREBASE_DATABASE_SECRET"
   ```
7. Connect your NodeMCU board via a micro-USB cable.
8. Set the compiler target to **NodeMCU 1.0 (ESP-12E Module)** and select your USB COM port.
9. Click **Upload** (Ctrl + U) to compile and flash the microcontroller.
10. Open the Serial Monitor at **115200 Baud** to verify active startup logs, WiFi association, and database syncing status.
