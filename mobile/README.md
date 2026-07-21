# TrainTrack Mobile — Android App

Flutter-based Android app for the TrainTrack cycling training platform. Connects to the same Spring Boot backend as the web app.

## Features

- **Dashboard** — overview of today's workout, plan phase, weight, and weekly volume
- **Training Plan** — interactive monthly calendar with color-coded workout types; tap any day for full workout prescription (warm-up / main set / cool-down)
- **Performance** — compliance gauge, weekly bar chart, and per-day assessment cards comparing planned vs. actual Strava/Garmin activities
- **Weight Tracker** — daily weight logging, trend chart with 7-day average, goal progress bar, swipe-to-delete history

## Prerequisites

- Flutter 3.19+ (`flutter --version`)
- Android SDK 35 / Android Studio (for emulator) or a physical device running Android 7+
- The **TrainTrack Spring Boot backend** running (see `/workspace/backend/`)

## Quick Start

```bash
cd mobile

# 1. Install dependencies
flutter pub get

# 2. Connect a device or start an Android emulator

# 3. Run the app
flutter run
```

The app defaults to `http://10.0.2.2:3001` (Android emulator localhost alias).

For a **physical device** on the same Wi-Fi: open the app → Connect Account screen → update the Backend URL field to `http://<your-machine-ip>:3001`.

## Project Structure

```
mobile/
├── lib/
│   ├── main.dart                  # Entry point, MaterialApp, RootGate
│   ├── config.dart                # Backend URL (configurable at runtime)
│   ├── models/
│   │   ├── auth_status.dart       # AuthStatus, AthleteInfo
│   │   ├── training_plan.dart     # TrainingPlan, PlannedWorkout
│   │   ├── weight_entry.dart      # WeightEntry, WeightSummary
│   │   └── performance.dart       # DailyAssessment, PlanCompliance
│   ├── services/
│   │   └── api_service.dart       # Dio HTTP client + cookie session management
│   ├── providers/
│   │   └── app_provider.dart      # ChangeNotifier app state
│   ├── screens/
│   │   ├── main_screen.dart       # Bottom NavigationBar shell
│   │   ├── connect_screen.dart    # OAuth connect (Strava/Garmin/TP) via WebView
│   │   ├── dashboard_screen.dart  # Home dashboard
│   │   ├── plan_screen.dart       # Training plan calendar
│   │   ├── performance_screen.dart# Performance assessment
│   │   └── weight_screen.dart     # Weight tracker
│   └── widgets/
│       └── tt_app_bar.dart        # Shared AppBar
├── android/
│   ├── app/
│   │   ├── build.gradle
│   │   └── src/main/
│   │       ├── AndroidManifest.xml
│   │       ├── kotlin/com/traintrack/app/MainActivity.kt
│   │       └── res/
│   └── build.gradle
└── pubspec.yaml
```

## Authentication Flow

The app uses an in-app **WebView** for OAuth. When you tap "Connect with Strava" (or Garmin/Training Peaks):

1. A WebView loads `http://<backend>/api/auth/strava/connect`
2. The WebView follows all OAuth redirects inside the app
3. When the backend redirects back to `/dashboard`, the WebView detects it and closes
4. Auth status is refreshed via the `/api/auth/status` endpoint
5. The session cookie set by Spring Boot is stored in the Dio cookie jar and sent with all subsequent API calls

## Build APK

```bash
flutter build apk --release
# Output: build/app/outputs/flutter-apk/app-release.apk
```

To install directly on a connected device:
```bash
flutter install
```

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `dio` + `dio_cookie_manager` | HTTP client with session cookie persistence |
| `webview_flutter` | In-app WebView for OAuth flows |
| `fl_chart` | Line chart (weight trend) + pie chart (compliance gauge) + bar chart (week scores) |
| `table_calendar` | Interactive monthly calendar for training plan |
| `provider` | App state management |
| `intl` | Date formatting |
| `shared_preferences` | Persist backend URL setting across app restarts |
