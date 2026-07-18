# GreenTracker (ഗ്രീൻട്രാക്കർ) 🌿

GreenTracker is a modern, bilingual React Native (Expo) application designed to empower farmers and agricultural managers. It offers offline-first tracking of crop life cycles, activities, pesticide applications, and expenses. 

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

### 3. 🛠️ Work Activity & Expense Logging
*   Log farm operations such as Tillage, Planting, Weeding, Irrigation, Pruning, Spraying, and Harvesting.
*   Record duration and break down expenses (Labor, Materials, Equipment) to calculate cumulative costs for each crop cycle.

### 4. 🧪 Smart Pesticide Spray Log
*   Record spray applications with target pests, active ingredients, dosage rates, and quantities.
*   Track **Re-entry intervals** (in hours) and **Withholding periods** (in days) to ensure safe harvesting.
*   **Automatic Warnings:** The app alerts you with visual warnings if you try to harvest during a crop's withholding period.

### 5. 🌐 Localized & Offline-First
*   **Bilingual support:** Switch seamlessly between English and Malayalam.
*   **Local Storage:** Powered by AsyncStorage for fast, reliable, offline-first access in the field.

---

## 🛠️ Tech Stack

*   **Framework:** React Native / [Expo](https://expo.dev/)
*   **Language:** TypeScript
*   **State & Storage:** React Native Hooks & `@react-native-async-storage/async-storage`
*   **Styling:** Custom Vanilla React Native Stylesheet system

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v16 or higher recommended)
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
│   │   ├── Dashboard.tsx       # Main analytics and status dashboard
│   │   ├── CropsTab.tsx        # Crop list, detail view, & creation
│   │   ├── ActivitiesTab.tsx   # Activity logger and history
│   │   └── PesticidesTab.tsx   # Spray records and chemical inputs
│   ├── storage.ts      # Local database wrapper (AsyncStorage CRUD operations)
│   ├── translations.ts # English & Malayalam string bundles
│   └── types.ts        # TypeScript Type/Interface definitions
├── package.json        # Dependencies & NPM scripts
└── tsconfig.json       # TypeScript configuration
```

---

## 🔒 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
