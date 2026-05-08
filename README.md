# Smart Irrigation System

Complete smart irrigation system built for Apple Orchards of Kashmir. Controllable from a mobile app. Used for controlling water pumps in drip irrigation.

This repository contains the complete code for a production-ready smart irrigation system using ESP8266 and React Native.

## Folder Structure

* `firmware/` - ESP8266 C++ code (NodeMCU)
* `app/` - React Native (Expo) mobile application

## Part 1: Hardware & Firmware Setup

### Wiring
*   **Relay Module**: Data Pin to **D1 (GPIO 5)**, VCC to 5V (external recommended), GND to common GND.
*   **Soil Moisture Sensor**: Analog Pin to **A0**, VCC to 3.3V, GND to common GND.

### Firmware Upload
1.  Open `firmware/SmartIrrigation.ino` in Arduino IDE.
2.  Install the **Firebase Arduino Client Library for ESP8266 and ESP32** by Mobizt.
3.  Update the configuration variables at the top of the file:
    ```cpp
    #define WIFI_SSID "YOUR_WIFI_SSID"
    #define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"
    #define API_KEY "YOUR_FIREBASE_WEB_API_KEY"
    #define DATABASE_URL "YOUR_FIREBASE_DB_URL"
    ```
4.  Select your ESP8266 board (e.g., NodeMCU 1.0) and correct COM port.
5.  Click Upload.

## Part 2: Mobile App Setup

1.  Navigate to the `app` directory in your terminal.
2.  If this is your first time setting up the app, run the following to initialize Expo and install dependencies (make sure you delete the temporary `App.js` file before running `create-expo-app`, or move it temporarily):
    ```bash
    npx create-expo-app .
    npx expo install firebase @react-native-community/slider lucide-react-native
    ```
    *(If you already have a `package.json`, just run `npm install`)*
3.  Configure Firebase:
    Open `app/src/config/firebase.js` and paste your Firebase project config object.
4.  Start the app:
    ```bash
    npx expo start
    ```
5.  Scan the QR code with the Expo Go app on your phone.

## Firebase Database Rules Setup

Go to the Firebase Realtime Database rules and configure them to allow read/write access. For development, you can use:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```
*(Note: For production, implement proper authentication rules instead of public read/write).*
