#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <Firebase_ESP_Client.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
#include <ArduinoJson.h>

#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"

// configuration 
#define WIFI_SSID "Proxy-Network"
#define WIFI_PASSWORD "Darburhan@admin1"
#define API_KEY "AIzaSyCX7fV4-Gt-4vFZAtSm6jwn6TWpbc3bBu4"
#define DATABASE_URL "https://smart-irrigation-e2db4-default-rtdb.asia-southeast1.firebasedatabase.app"
#define DATABASE_SECRET "umDLplMfd3h3tU6ybKOoMHEYua4VUknqQeyvQ2w0"

// hardware pins
#define RELAY_PIN 5      // D1 on NodeMCU
#define SENSOR_PIN A0    // Analog moisture sensor
#define LED_PIN 2        // D4 (Onboard LED, active LOW)

// relay logic
#define RELAY_ON HIGH
#define RELAY_OFF LOW

// firebase objects
FirebaseData fbdoRead;
FirebaseData fbdoWrite;
FirebaseAuth auth;
FirebaseConfig config;

// ntp and time
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", 19800); // 19800 = +5:30 IST

// scheduile config 
#define MAX_SCHEDULES 5
struct Schedule {
  int startHour;
  int startMinute;
  int stopHour;
  int stopMinute;
  bool enabled;
} schedules[MAX_SCHEDULES];
int scheduleCount = 0;

bool isCurrentlyScheduledWatering = false;

// system state
bool autoMode = false;
int threshold = 600;
const int HYSTERESIS = 50; 
int currentMoisture = 0;
bool relayState = false;
bool rainPredicted = false;

// pump protection 
unsigned long pumpStartMillis = 0;
bool isPumpRunning = false;
bool pumpProtectionTriggered = false;
int maxRuntimeMinutes = 20; 

unsigned long lastPollTime = 0;
const int POLL_INTERVAL = 1500; // Ultra-fast 1.5 second polling

unsigned long lastMoistureUploadTime = 0;
const int MOISTURE_UPLOAD_INTERVAL = 10000;

unsigned long lastBlink = 0;
bool ledState = HIGH;

void setup() {
  Serial.begin(115200);
  
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, RELAY_OFF); 
  digitalWrite(LED_PIN, HIGH);        

  ESP.wdtEnable(8000);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  // Disable WiFi sleep to prevent the router from kicking the ESP during inactivity
  WiFi.setSleepMode(WIFI_NONE_SLEEP);
  
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    digitalWrite(LED_PIN, !digitalRead(LED_PIN));
    ESP.wdtFeed(); 
  }
  Serial.println("\nConnected!");
  digitalWrite(LED_PIN, LOW);

  // Initialize NTP Client
  timeClient.begin();

  // Firebase Setup
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  config.signer.tokens.legacy_token = DATABASE_SECRET;
  config.cert.data = NULL;

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  
  // Increase read buffer to 4096 to handle the larger JSON payload now that schedules are added
  fbdoRead.setBSSLBufferSize(4096, 1024);
  fbdoWrite.setBSSLBufferSize(2048, 512);
}

void loop() {
  ESP.wdtFeed();
  timeClient.update();

  // --- CONNECTION STATUS INDICATOR ---
  bool isConnected = (WiFi.status() == WL_CONNECTED && Firebase.ready());
  if (!isConnected) {
    if (millis() - lastBlink > 1000) {
      ledState = !ledState;
      digitalWrite(LED_PIN, ledState);
      lastBlink = millis();
    }
  } else {
    digitalWrite(LED_PIN, LOW);
  }

  // --- FAIL-SAFE & ACTIVE RECONNECT ---
  if (WiFi.status() != WL_CONNECTED) {
    digitalWrite(RELAY_PIN, RELAY_OFF);
    relayState = false;
    isCurrentlyScheduledWatering = false;
    
    // Actively try to reconnect if router dropped the connection
    WiFi.reconnect();
    unsigned long startAttempt = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - startAttempt < 5000) {
       delay(500);
       ESP.wdtFeed();
    }
    return; 
  }

  int currentHour = timeClient.getHours();
  int currentMinute = timeClient.getMinutes();
  int currentTotalMins = currentHour * 60 + currentMinute;

  // --- POLLING LOGIC ---
  if (millis() - lastPollTime >= POLL_INTERVAL || lastPollTime == 0) {
    lastPollTime = millis();

    // 1. Read Moisture
    long sum = 0;
    for(int i=0; i<10; i++) { 
      sum += analogRead(SENSOR_PIN); 
      delay(2); 
      ESP.wdtFeed();
    }
    currentMoisture = sum / 10;

    // 2. Fetch the App State efficiently
    if (Firebase.RTDB.getJSON(&fbdoRead, "/state")) {
      FirebaseJson &json = fbdoRead.jsonObject();
      FirebaseJsonData jsonData;
      
      json.get(jsonData, "auto");
      if (jsonData.success) autoMode = jsonData.intValue == 1;
      
      json.get(jsonData, "threshold");
      if (jsonData.success) threshold = jsonData.intValue;

      json.get(jsonData, "weather/rainPredicted");
      if (jsonData.success) rainPredicted = jsonData.boolValue;

      json.get(jsonData, "maxRuntimeMinutes");
      if (jsonData.success) maxRuntimeMinutes = jsonData.intValue;

      json.get(jsonData, "pumpProtection/triggered");
      if (jsonData.success) pumpProtectionTriggered = jsonData.boolValue;

      json.get(jsonData, "schedules");
      if (jsonData.success) {
         StaticJsonDocument<1024> doc;
         DeserializationError error = deserializeJson(doc, jsonData.stringValue);
         if (!error && doc.is<JsonArray>()) {
             JsonArray arr = doc.as<JsonArray>();
             int newCount = 0;
             for (JsonObject obj : arr) {
                 if (newCount < MAX_SCHEDULES) {
                     schedules[newCount].startHour = obj["startHour"] | 0;
                     schedules[newCount].startMinute = obj["startMinute"] | 0;
                     schedules[newCount].stopHour = obj["stopHour"] | 0;
                     schedules[newCount].stopMinute = obj["stopMinute"] | 0;
                     schedules[newCount].enabled = obj["enabled"] | false;
                     newCount++;
                 }
             }
             scheduleCount = newCount;
         }
      }

      // Manual Priority (Highest Priority)
      json.get(jsonData, "relay");
      if (jsonData.success) {
        bool appRequestedRelayState = (jsonData.intValue == 1);
        if (appRequestedRelayState != relayState) {
          relayState = appRequestedRelayState;
          digitalWrite(RELAY_PIN, relayState ? RELAY_ON : RELAY_OFF);
          Serial.printf("Manual Override! Relay is now %s\n", relayState ? "ON" : "OFF");
          
          // Cancel scheduled watering if user manually turns pump OFF
          if (!relayState && isCurrentlyScheduledWatering) {
             isCurrentlyScheduledWatering = false;
             Serial.println("Scheduled watering manually disabled.");
          }
        }
      }
    } else {
      Serial.printf("Failed to download JSON from Firebase: %s\n", fbdoRead.errorReason().c_str());
    }

    // --- SCHEDULE LOGIC (STATELESS) Priority 3 ---
    bool shouldBeWateringBySchedule = false;

    for (int i = 0; i < scheduleCount; i++) {
       if (schedules[i].enabled) {
          int startTotal = schedules[i].startHour * 60 + schedules[i].startMinute;
          int stopTotal = schedules[i].stopHour * 60 + schedules[i].stopMinute;
          
          // Handle normal and overnight schedules
          if (startTotal <= stopTotal) {
              if (currentTotalMins >= startTotal && currentTotalMins < stopTotal) {
                 shouldBeWateringBySchedule = true;
              }
          } else { // Overnight (e.g. 23:00 to 01:00)
              if (currentTotalMins >= startTotal || currentTotalMins < stopTotal) {
                 shouldBeWateringBySchedule = true;
              }
          }
       }
    }

    // Weather Override for Schedules
    if (shouldBeWateringBySchedule && rainPredicted) {
       shouldBeWateringBySchedule = false;
       Serial.println("Schedule skipped due to rain prediction!");
    }

    // Execute schedule transitions safely
    if (shouldBeWateringBySchedule && !isCurrentlyScheduledWatering) {
       isCurrentlyScheduledWatering = true;
       if (!relayState) { // Only turn on if not already manually turned on
         relayState = true;
         digitalWrite(RELAY_PIN, RELAY_ON);
         Firebase.RTDB.setInt(&fbdoWrite, "/state/relay", 1);
         Serial.println("Schedule Active! Pump ON.");
       }
    } else if (!shouldBeWateringBySchedule && isCurrentlyScheduledWatering) {
       isCurrentlyScheduledWatering = false;
       // Only turn off if the schedule was the reason it was on
       relayState = false;
       digitalWrite(RELAY_PIN, RELAY_OFF);
       Firebase.RTDB.setInt(&fbdoWrite, "/state/relay", 0);
       Serial.println("Schedule Finished! Pump OFF.");
    }

    // 3. Process Auto Logic (Lowest Priority 4)
    // Only process auto mode if we aren't currently forced on by a schedule
    if (autoMode && !isCurrentlyScheduledWatering) {
      bool shouldPumpBeOn = relayState;
      
      // Sensor goes HIGH when dry, LOW when wet
      if (currentMoisture > threshold) {
        if (rainPredicted) {
          shouldPumpBeOn = false; // Block auto watering if rain predicted
        } else {
          shouldPumpBeOn = true;  // Too dry (above threshold) -> Pump ON
        }
      } else if (currentMoisture < (threshold - HYSTERESIS)) {
        shouldPumpBeOn = false; // Wet enough (below threshold - HYSTERESIS) -> Pump OFF
      }
      
      if (shouldPumpBeOn != relayState) {
        relayState = shouldPumpBeOn;
        digitalWrite(RELAY_PIN, relayState ? RELAY_ON : RELAY_OFF);
        Firebase.RTDB.setInt(&fbdoWrite, "/state/relay", relayState ? 1 : 0);
        Serial.printf("Auto Mode triggered! Relay is now %s\n", relayState ? "ON" : "OFF");
      }
    }

    // 4. Sync Moisture
    if (millis() - lastMoistureUploadTime >= MOISTURE_UPLOAD_INTERVAL || lastMoistureUploadTime == 0) {
      Firebase.RTDB.setInt(&fbdoWrite, "/state/moisture", currentMoisture);
      lastMoistureUploadTime = millis();
    }

    // --- PUMP PROTECTION LOGIC (Highest Override) ---
    if (pumpProtectionTriggered && relayState) {
        relayState = false;
        digitalWrite(RELAY_PIN, RELAY_OFF);
        Firebase.RTDB.setInt(&fbdoWrite, "/state/relay", 0);
        Serial.println("Pump turned OFF due to remote Protection State!");
    }

    if (relayState && !isPumpRunning) {
        isPumpRunning = true;
        pumpStartMillis = millis();
        // NTPClient getEpochTime adds the +19800 offset. We subtract it here so the App receives true UTC time.
        Firebase.RTDB.setInt(&fbdoWrite, "/state/pumpStartTimeEpoch", timeClient.getEpochTime() - 19800);
    } else if (!relayState && isPumpRunning) {
        isPumpRunning = false;
        Firebase.RTDB.setInt(&fbdoWrite, "/state/pumpStartTimeEpoch", 0);
    }

    if (isPumpRunning && !pumpProtectionTriggered) {
        unsigned long runDuration = millis() - pumpStartMillis;
        unsigned long maxRunMs = maxRuntimeMinutes * 60UL * 1000UL;
        if (runDuration >= maxRunMs) {
            pumpProtectionTriggered = true;
            relayState = false;
            digitalWrite(RELAY_PIN, RELAY_OFF);
            Firebase.RTDB.setInt(&fbdoWrite, "/state/relay", 0);
            
            FirebaseJson protectionJson;
            protectionJson.set("triggered", true);
            protectionJson.set("reason", "Maximum runtime exceeded");
            Firebase.RTDB.setJSON(&fbdoWrite, "/state/pumpProtection", &protectionJson);
            
            isPumpRunning = false;
            Firebase.RTDB.setInt(&fbdoWrite, "/state/pumpStartTimeEpoch", 0);
            Serial.println("PUMP PROTECTION TRIGGERED! Pump forced OFF.");
        }
    }
  }
}
