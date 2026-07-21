# GreenTracker (ഗ്രീൻട്രാക്കർ) 🌿

GreenTracker is a modern, bilingual React Native (Expo) application designed to empower farmers and agricultural managers. It offers offline-first tracking of crops, livestock (goats), aquaculture (fish ponds), activities, chemical applications, and expenses.

With full support for **English** and **Malayalam (മലയാളം)**, GreenTracker makes farm management simple, visual, and accessible.

---

## ✨ Features

### 1. 📊 Comprehensive Dashboard
*   **Total Farm Investment:** Real-time breakdown of all expenses categorized by **Labor**, **Materials/Inputs**, and **Equipment/Fuel**.
*   **Visual Insights:** Visual indicator bars comparing costs across active crops and farm operations.
*   **Safety Alerts:** Displays warnings for active harvest withholding periods post-chemical application.

### 2. 🌾 Crop Lifecycle Management
*   Track crop growth stages: *Seedling ➜ Vegetative ➜ Flowering ➜ Fruiting ➜ Harvested ➜ Archived*.
*   Register crop details including variety, field location, planting date, and estimated harvest date.
*   Filter and search crops dynamically.
*   **Work & Expense Logging:** Log farm operations (Tillage, Planting, Irrigation, Spraying, etc.) with duration and cost breakdown.
*   **Smart Pesticide Spray Log:** Record spray applications with re-entry intervals, dosage rates, and withholding periods. Alerts you if you try to harvest during a crop's withholding period.

### 3. 🐐 Goat Farming Module (ആടുകൾ)
*   **Inventory Tracking:** Live count of males, females, and kids.
*   **New Birth Logging:** Log new kid births and specify gender distribution.
*   **Automatic Progression:** The app automatically transitions kids to adults (males/females) after 3 months.
*   **Operations Log:** Track feed schedules, vaccination events, sales, and medical records.

### 4. 🐟 Fish Pond Management (മത്സ്യം)
*   **Stock Tracking:** Monitor fingerling count, active stock, and mortality rates.
*   **Water Quality Logging:** Record crucial parameters like **pH**, **Temperature**, **Ammonia**, and **Dissolved Oxygen (DO)**.
*   **Feeding Tracker:** Log feed type, quantity, frequency, and costs.
*   **Harvesting Logs:** Track total fish harvested and yield weight.

### 5. 🔄 Offline-First & Cloud Sync
*   **Local Storage:** Powered by AsyncStorage for fast, reliable, offline-first access in the field.
*   **Firebase Integration:** Synchronize your updates automatically with the cloud using a simple shared **Sync Code** (e.g., `demofarm`) to keep multiple devices in sync.
*   **Auto-Sync Queue:** Any changes made offline are queued and synced once internet connectivity is restored.

### 6. 📄 PDF Reports
*   Export detailed summary sheets of crop cycles, goat farm operations, and fish pond data directly to PDF for printing or sharing.

---

## 🛠️ Tech Stack

*   **Framework:** React Native / [Expo](https://expo.dev/)
*   **Language:** TypeScript
*   **Database & Cloud:** Google Firebase & `@react-native-async-storage/async-storage`
*   **Styling:** Custom Vanilla React Native Stylesheet system
*   **Reports:** `expo-print` & `expo-sharing`

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v18 or higher recommended)
*   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
*   [Expo Go](https://expo.dev/client) app installed on your Android or iOS device to preview the app.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/sahalz/Green-tracker.git
    cd Green-tracker
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

### Running the App

Start the Expo development server:
```bash
npx expo start
```

*   **On Mobile:** Scan the QR code displayed in the terminal using the Expo Go app (Android) or the default Camera app (iOS).
*   **On Emulator:** Press `a` for Android Emulator or `i` for iOS Simulator (requires Xcode/Android Studio setup).

---

## 📁 Project Structure

```text
├── App.tsx             # Application Entry Point & Tab Navigator
├── assets/             # Images, icons, and fonts
├── src/
│   ├── components/     # UI Components
│   │   ├── Dashboard.tsx             # Main crops dashboard
│   │   ├── CropsTab.tsx              # Crops details, logs, & pesticides
│   │   ├── GoatTab.tsx               # Goat farming tracking & birth logs
│   │   ├── FishTab.tsx               # Aquaculture & water parameters log
│   │   ├── CustomDatePicker.tsx      # Native-style date picker modal
│   │   └── CustomTimePickerModal.tsx # Native-style time picker modal
│   ├── firebase.ts     # Firebase configuration and initializations
│   ├── notifications.native.ts       # Native notification helpers
│   ├── notifications.ts              # Cross-platform notification abstractions
│   ├── storage.ts      # Offline AsyncStorage & Cloud Firestore sync layer
│   ├── translations.ts # English & Malayalam string bundles
│   └── types.ts        # TypeScript Type/Interface definitions
├── package.json        # Dependencies & NPM scripts
└── tsconfig.json       # TypeScript configuration
```

---

## 🔒 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

