# AgroFlow 💻🌿 (Web Dashboard Client)

The **AgroFlow Web Dashboard** is a premium, high-performance web interface designed to pair seamlessly with the AgroFlow IoT Smart Irrigation and Drip System. Built on modern web standards, it replicates the full feature set of the mobile app to provide operators with desktop-grade system analytics, remote control, and real-time monitoring of apple orchards in Kashmir.

---

## ⚡ Key Dashboard Modules & Features

The client is built as a highly responsive Single Page Application (SPA) structured around 8 dedicated command views:

1. **Dashboard Overview**: Displays real-time device connection heartbeats, active pump status indicators, manual/automation operating switches, and live telemetry summaries.
2. **Moisture Station**: Features an interactive SVG radial soil moisture gauge, target safety threshold sliders, and visual telemetry readings.
3. **Pump Control Terminal**: Manual override portal featuring instant Firebase sync, a dynamic countdown timer showing the active watering block runtime, and critical motor status readouts.
4. **Schedule Manager**: Supports up to 5 concurrent watering schedule slots with interactive time selectors, run duration calculation banners, and activation toggles.
5. **Weather Station**: Feeds real-time meteorology directly from the Open-Meteo API. Displays current temperature, wind speed, relative humidity, rain probability tables, and WMO summary outlook decoders.
6. **Analytics Center**: Interactive charts powered by Recharts rendering:
   * **Active Watering Duration (Minutes)**: True daily pump runtime durations.
   * **Weekly Irrigation Cycles**: Total weekly irrigation activation counts.
   * **Moisture Session Telemetry**: Real-time graph showing live sensor coordinate changes cached during active sessions.
7. **System Activity Logs**: Renders a clean chronologically ordered log of the last 50 events, including status, success notifications, warning alerts, and motor safety overrides (supports total log clearing).
8. **Settings & Geolocation**: Custom input controls to save coordinates, pull device-location coordinates via HTML5 Browser Geolocation API, and configure operator credential profiles.

---

## 🛠️ Technology Stack & Styling

* **Core**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
* **Build System**: [Vite 5](https://vitejs.dev/) (featuring Hot Module Replacement)
* **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (using native `@import "tailwindcss";` compilation architecture)
* **Icons**: [Lucide React](https://lucide.dev/)
* **Charts**: [Recharts](https://recharts.org/)
* **Database Sync**: Centralized Firebase Realtime Database Hooks

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) (v18.x or v20.x) installed on your system.

### 2. Installation
Navigate to the dashboard directory and install all required modules:
```bash
npm install
```

### 3. Firebase Configuration
Make sure your web API credentials match your project backend in [src/config/firebase.ts](src/config/firebase.ts):
```typescript
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 4. Running Locally (Development Mode)
Launch the Vite hot-reloading development server:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

### 5. Static Production Build
To compile and bundle a production-ready, highly optimized static website:
```bash
npm run build
```
The output directory will be created under `/dist`.

---

## 🌐 Production Deployment

The project contains a built-in static rewrite configuration ([vercel.json](vercel.json)) to support flawless hosting on **Vercel** with client-side SPA routing:

1. Install the Vercel CLI globally:
   ```bash
   npm install -g vercel
   ```
2. Initiate connection inside this folder:
   ```bash
   vercel
   ```
3. Set the output build target directory as `dist` and deploy:
   ```bash
   vercel --prod
   ```
