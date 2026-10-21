# 📱 DigitLab Mobile App (Android & iOS)

Enterprise Android Application for **DigitLab Cloud Pathology LIMS**, powered by **Capacitor 7** and **Angular 19**.

---

## 📁 Directory Structure

```
D:\Antigravity\Lab\mobile-app\
├── android/                 # Native Android Gradle Project (Android Studio / Gradle Wrapper)
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml   # Camera, Bluetooth, Network permissions & Cleartext HTTP
│   │   │   └── res/values/strings.xml# App Name ("DigitLab"), Package ID
│   │   └── build.gradle
│   ├── gradlew / gradlew.bat
│   └── build.gradle
├── www/                     # Compiled web assets synced directly from Angular frontend
├── capacitor.config.json    # Capacitor configuration (App ID: com.digitlab.lims)
├── sync-from-web.ps1        # 1-Click script to sync newest Web build into Android app
└── package.json             # Mobile plugins (Camera, Network, Preferences, StatusBar)
```

---

## ⚡ Real-Time Web & App Sync (SignalR)

* The mobile app connects to the central ASP.NET Core SignalR hub (`/hubs/lab`) using WebSockets.
* When a case is registered at the reception counter (Web), the mobile app instantly receives a `CaseCreated` alert without page refresh.
* When sample collection status or pathologist verification changes, both Mobile App and Web sync instantly in < 100ms.
* Panic / Critical alerts (e.g. extreme glucose / hemoglobin values) immediately trigger red audio/visual notifications across all connected devices in the laboratory tenant room.

---

## 🚀 How to Build & Install the Android APK

### Option 1: 100% Free Cloud Build (GitHub Actions - Zero Local Setup) ⭐ Recommended
1. Commit and push this branch to GitHub:
   ```powershell
   git push origin feature/mobile-app-signalr
   ```
2. In GitHub, go to the **Actions** tab -> **Build DigitLab Android APK**.
3. It compiles the APK automatically in 3 minutes.
4. Click on the completed run and download **`DigitLab-Mobile-Debug-APK`** (contains `app-debug.apk`).
5. Send it to your phone via WhatsApp, Google Drive, or USB and tap **Install**!

### Option 2: Local Sync & Build
Whenever you make changes to Angular frontend:
```powershell
# 1. From mobile-app folder, run sync:
.\sync-from-web.ps1

# 2. Open in Android Studio (if installed):
npx cap open android
```
