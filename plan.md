# Stratum — Implementation Plan

> **Status:** Implemented — ready for device testing.

**App name:** **Stratum** — short, elegant, and apt for a tool that reads the "layer" of your cellular connection (LTE, LTE+, 5G, 5G+).

**Goal:** Build an **Android-only** Expo app that runs a persistent foreground service showing a colored status indicator (red = 4G family, green = 5G family), expandable upload/download speeds, a dismiss (✕) action, and an in-app on/off toggle — with an AMOLED-black minimal UI accented in periwinkle violet.

---

## 1. Platform Scope

**v1 is Android only.** No iOS build, no iOS fallbacks, no cross-platform compromises.

All features target Android foreground services + ongoing notifications:

| Requirement | Approach |
|---|---|
| Persistent indicator in status/notification area | Ongoing foreground notification with colored small icon |
| Expand notification for speeds | BigText layout via NotifyKit |
| Background monitoring on battery saver | `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` + foreground service |
| ✕ to stop from notification | Notification action button |
| On/off toggle in app | Master toggle + persisted state |

### "Dot on the notification bar" — how we achieve it

Android does **not** allow apps to draw arbitrary pixels in the system status bar. The standard approach:

1. Run an **ongoing foreground-service notification** (cannot be swiped away while active).
2. Use a **minimal small icon** (circle/dot silhouette) with `setColor()`:
   - **Red** (`#FF453A`) when on the **4G family** (4G, LTE, LTE+)
   - **Green** (`#32D74B`) when on the **5G family** (5G, 5G+)
3. Collapsed state shows only the tinted dot icon; expanded state shows the carrier-accurate label, speeds, and close action.

On many OEM skins (including Jio devices) the icon appears as a small colored glyph in the status area — the closest platform-supported equivalent to "a dot on the notification bar."

---

## 2. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Expo SDK 53** + **TypeScript** | Modern RN, good DX |
| Build model | **Expo Dev Client** (not Expo Go) | Native modules required |
| Routing | **expo-router** (single screen) | Minimal boilerplate |
| Network generation (base) | **`@react-native-community/netinfo`** | Fast `cellularGeneration` polling |
| Network label (carrier-accurate) | **Custom native module** (`expo-stratum-core`) | Reads `TelephonyManager` for LTE / LTE+ / 5G / 5G+ labels (Jio-aware) |
| Foreground service + notification | **`react-native-notify-kit`** | Foreground services, ongoing notifications, action buttons, Expo config plugin |
| Battery saver permission | **`expo-ignore-battery-optimizations`** + **`expo-intent-launcher`** | Check/request battery exemption |
| Network throughput | **`expo-stratum-core`** (same module) | `TrafficStats.getMobileRxBytes()` / `getMobileTxBytes()` for device-wide cellular throughput |
| Persistent app state | **`@react-native-async-storage/async-storage`** | Remember monitoring on/off preference |
| UI | **React Native core** + **`expo-haptics`** | Custom AMOLED components, no heavy UI kit |
| Typography | **`expo-font`** + **DM Sans** | Clean, minimal, readable |
| Build & distribute | **EAS Build** (`eas.json`) | Required for native code |

### Why a custom native module (`expo-stratum-core`)?

One module handles both concerns NetInfo alone cannot:

1. **Carrier-accurate labels** — Jio and other Indian carriers often display **LTE**, **LTE+**, **5G**, or **5G+** in the system UI rather than "4G". NetInfo returns coarse enums (`'4g'`, `'5g'`). We read Android `TelephonyManager.getDataNetworkType()` (and related APIs) to surface the label the user actually expects.

2. **Live throughput** — App-scoped `TrafficStats` reads zero when the app isn't transferring data. `TrafficStats.getMobileRxBytes()` / `getMobileTxBytes()` track **all mobile data** on the device.

The module will expose:

```ts
type NetworkSample = {
  rxBytes: number;   // cumulative mobile RX since boot
  txBytes: number;   // cumulative mobile TX since boot
  timestamp: number;
};

type CellularInfo = {
  label: 'LTE' | 'LTE+' | '5G' | '5G+' | '4G' | '3G' | '2G' | 'Unknown';
  family: 'fourG' | 'fiveG' | 'other';  // drives dot color
  carrier: string | null;
};

getMobileTrafficStats(): NetworkSample;
getCellularInfo(): CellularInfo;
```

JS layer computes delta over ~1s interval → formatted upload/download rates.

---

## 3. Network Label & Color Mapping (Jio / Indian carriers)

Indian carriers (especially **Jio**) commonly show **LTE** or **LTE+** instead of "4G", and **5G** or **5G+** for next-gen. Stratum mirrors that in the UI and notification.

### Native `TelephonyManager` → display label

| Android `networkType` | Display label | Dot color |
|---|---|---|
| `NETWORK_TYPE_LTE` | **LTE** | 🔴 Red |
| `NETWORK_TYPE_LTE_CA` | **LTE+** | 🔴 Red |
| `NETWORK_TYPE_HSPAP`, `NETWORK_TYPE_HSPA`, etc. | **4G** (fallback) | 🔴 Red |
| `NETWORK_TYPE_NR` | **5G** | 🟢 Green |
| `NETWORK_TYPE_NR_NSA` | **5G** (NSA — may show as LTE on some devices) | 🟢 Green if NR active, else 🔴 Red |
| NetInfo `'4g'` when telephony unavailable | **4G** | 🔴 Red |
| NetInfo `'5g'` when telephony unavailable | **5G** | 🟢 Green |
| `NETWORK_TYPE_LTE_CA` + NR anchor (SA/advanced) | **5G+** | 🟢 Green |

### 5G+ detection heuristic

`5G+` has no single standard Android constant. We derive it when:
- `networkType === NETWORK_TYPE_NR` **and** carrier aggregation is active (LTE CA concurrent), **or**
- `TelephonyDisplayInfo` (API 30+) reports `OVERRIDE_NETWORK_TYPE_NR_ADVANCED` / `NR_NSA_MMWAVE`

If the heuristic is inconclusive, we show **5G** (never overclaim **5G+**).

### Color family (dot logic)

```
fourG family  →  red dot   →  LTE, LTE+, 4G
fiveG family  →  green dot →  5G, 5G+
other         →  gray dot  →  3G, 2G, Wi-Fi, offline, Unknown
```

**NetInfo is the fallback; native telephony is the source of truth for labels.**

---

## 4. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        App UI (React)                       │
│  ┌──────────────┐  ┌────────────────┐  ┌────────────────┐  │
│  │ On/Off Toggle│  │ Permission Cards│  │ Status Preview │  │
│  └──────┬───────┘  └───────┬────────┘  └───────┬────────┘  │
│         │                  │                    │           │
│         └──────────────────┼────────────────────┘           │
│                            ▼                                │
│              MonitoringController (JS service)              │
│         start() / stop() / isRunning() / events             │
└────────────────────────────┬────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
  ┌─────────────┐   ┌─────────────────┐   ┌──────────────┐
  │   NetInfo   │   │ expo-stratum-   │   │ NotifyKit    │
  │  (fallback) │   │ core (label +   │   │ (foreground  │
  │             │   │  speed)         │   │  notification)│
  └─────────────┘   └─────────────────┘   └──────────────┘
                             │
                             ▼
                   Android Foreground Service
                   (polls every 1s, updates notification)
```

### Data flow (when monitoring is ON)

1. User toggles **ON** → request missing permissions → start foreground service.
2. Every **1 second**:
   - Read `getCellularInfo()` → label (e.g. `LTE+`) + family (→ dot color)
   - Fall back to NetInfo if telephony read fails
   - Sample mobile traffic counters → compute Δbytes/Δt → Mbps or KB/s
   - Update notification: dot color, collapsed icon, expanded body with label
3. User taps **✕** in notification → `stopForegroundService()` → clear notification → set toggle OFF.
4. User opens app later → toggle reflects stored state → user can turn ON again.

### State machine

```
OFF ──(toggle on + permissions OK)──► STARTING ──► RUNNING
RUNNING ──(toggle off OR notification ✕)──► STOPPING ──► OFF
RUNNING ──(network change LTE → LTE+ → 5G)──► RUNNING (update label + color)
```

---

## 5. UI Design — AMOLED Minimal

### Palette

| Token | Value | Usage |
|---|---|---|
| `background` | `#000000` | Full screen — true AMOLED black |
| `surface` | `#0A0A0A` | Cards, panels |
| `surfaceRaised` | `#111111` | Toggle track, input areas |
| `border` | `#1C1C1E` | Subtle dividers |
| `textPrimary` | `#F2F2F7` | Headings, speed values |
| `textSecondary` | `#636366` | Labels, hints |
| `accent` | `#8B7CF6` | **Primary UI accent** — toggle on-state, buttons, links, focus rings |
| `accentSoft` | `#8B7CF620` | Accent at 12% — card highlights, active row tint |
| `accent4G` | `#FF453A` | Notification dot + in-app 4G family indicator only |
| `accent5G` | `#32D74B` | Notification dot + in-app 5G family indicator only |
| `accentMuted` | `#3A3A3C` | Disabled states |

**Why periwinkle violet (`#8B7CF6`)?** It sits elegantly on pure black without competing with the functional red/green status dots. Feels premium and calm — not the typical "tech blue" or "neon green" cliché.

### Screen layout (single screen)

```
┌─────────────────────────────────────┐
│  Stratum                            │
│                                     │
│         ┌─────────────┐             │
│         │   ●  LTE+   │  ← large    │
│         │  preview    │    preview  │
│         └─────────────┘    dot      │
│                                     │
│   Monitoring          [====○]       │  ← violet when ON
│                                     │
│   ┌─ Download ─────────────────┐   │
│   │  42.3 Mbps                  │   │  ← violet left accent bar
│   └─────────────────────────────┘   │
│   ┌─ Upload ────────────────────┐   │
│   │  8.1 Mbps                   │   │
│   └─────────────────────────────┘   │
│                                     │
│   Permissions                       │
│   ○ Phone state        [Grant]      │  ← grant buttons in accent
│   ○ Battery exempt     [Grant]      │
│   ○ Notifications      [Grant]      │
│                                     │
│   Jio  •  LTE+                      │
└─────────────────────────────────────┘
```

### Design principles

- True black backgrounds (AMOLED power savings).
- **Violet** for all interactive/chrome UI; **red/green reserved only** for network-family status dots.
- Large toggle as primary control; everything else secondary.
- DM Sans 400 / 500 / 600 — no decorative fonts.
- Light haptic feedback on toggle and permission grants.
- Subtle 150ms ease on toggle slide; no gratuitous animation.

---

## 6. Features — Detailed Spec

### 6.1 Network generation indicator

- **Primary source:** `expo-stratum-core` → `getCellularInfo()`
- **Fallback:** `@react-native-community/netinfo` → `cellularGeneration`
- **Display:** carrier-accurate label (`LTE`, `LTE+`, `5G`, `5G+`)
- **Dot color:** `family` field → red (fourG) or green (fiveG)
- **Permissions:** `READ_PHONE_STATE`
- **Poll interval:** 2s for generation; 1s for speeds

### 6.2 Upload / download speed

- **Source:** `expo-stratum-core` → `getMobileTrafficStats()`
- **Method:** delta of mobile `TrafficStats` counters over 1s window
- **Display format:**
  - `< 1 Mbps` → `KB/s` (e.g. `842 KB/s`)
  - `≥ 1 Mbps` → `Mbps` (e.g. `42.3 Mbps`)
- **Shown in:** expanded notification (primary) + in-app speed cards (mirror)

### 6.3 Foreground notification

**Collapsed (status bar / peek):**
- Small icon: dot silhouette, tinted red or green
- Minimal footprint — no verbose title

**Expanded:**
```
Stratum
● LTE+  •  Jio

↓ 42.3 Mbps     ↑ 8.1 Mbps

                    [ ✕ ]
```

- **Ongoing:** `true`
- **Action button:** `✕` → stops service, sets app state to OFF
- **Tap notification body:** opens app

### 6.4 Background & battery saver

On first enable (or if not yet granted):

1. **Notifications** — `POST_NOTIFICATIONS` (Android 13+)
2. **Phone state** — `READ_PHONE_STATE`
3. **Battery optimization** — `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`
   - Modal copy: *"Stratum needs this to keep monitoring your connection when battery saver is on."*
   - Use `expo-ignore-battery-optimizations` to check + request
   - If denied, deep-link to system settings via `expo-intent-launcher`

### 6.5 On/off toggle

- **ON:** persist `monitoringEnabled: true` → start foreground service
- **OFF:** stop service → dismiss notification → persist `monitoringEnabled: false`
- **Notification ✕:** same as OFF
- **App killed by system:** on next launch, if `monitoringEnabled === true`, offer to restart

### 6.6 Permissions UX

- Three permission rows with status chips: Granted / Needed
- Block toggle ON until notifications + phone state are granted
- Battery exemption: strongly recommended, not hard-blocked (warning banner if skipped)

---

## 7. Project Structure

```
stratum/
├── app/
│   ├── _layout.tsx              # Root layout, font loading, AMOLED theme
│   └── index.tsx                # Main screen
├── src/
│   ├── components/
│   │   ├── MonitoringToggle.tsx
│   │   ├── NetworkPreview.tsx   # Large dot + carrier label (LTE+, 5G, etc.)
│   │   ├── SpeedCard.tsx
│   │   └── PermissionRow.tsx
│   ├── hooks/
│   │   ├── useMonitoring.ts
│   │   ├── useCellularInfo.ts
│   │   └── usePermissions.ts
│   ├── services/
│   │   ├── monitoringController.ts
│   │   ├── notificationService.ts
│   │   └── speedCalculator.ts
│   ├── constants/
│   │   ├── colors.ts
│   │   └── config.ts
│   └── types/
│       └── index.ts
├── modules/
│   └── expo-stratum-core/           # Local Expo module (Kotlin)
│       ├── android/
│       │   └── .../StratumCoreModule.kt
│       ├── src/
│       │   └── index.ts
│       └── expo-module.config.json
├── assets/
│   ├── fonts/DMSans-*.ttf
│   └── notification-dot.xml
├── app.config.ts
├── eas.json
├── package.json
└── plan.md
```

**Package identifiers:**
- App slug: `stratum`
- Android package: `com.stratum.monitor`
- Display name: **Stratum**

---

## 8. Android Permissions & Manifest

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.READ_PHONE_STATE" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_DATA_SYNC" />
<uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />
```

---

## 9. Implementation Phases

### Phase 1 — Scaffold
- [ ] `npx create-expo-app@latest stratum` with TypeScript + expo-router
- [ ] Configure `app.config.ts` (name: Stratum, package: `com.stratum.monitor`), EAS, dev client
- [ ] Install dependencies
- [ ] AMOLED theme (black + violet accent) + main screen shell

### Phase 2 — Native core module
- [ ] Create `expo-stratum-core` local module
- [ ] Implement `TrafficStats` mobile RX/TX in Kotlin
- [ ] Implement `TelephonyManager` label resolution (LTE, LTE+, 5G, 5G+)
- [ ] JS `speedCalculator` + unit formatting

### Phase 3 — Network detection
- [ ] Wire `getCellularInfo()` + NetInfo fallback
- [ ] `READ_PHONE_STATE` permission flow
- [ ] Map family → dot color; label → display text
- [ ] In-app live preview

### Phase 4 — Foreground service & notification
- [ ] NotifyKit channel + foreground service registration
- [ ] Collapsed notification with colored dot
- [ ] Expanded layout with label (LTE+, 5G, etc.) + speeds + ✕
- [ ] Polling loop

### Phase 5 — Monitoring controller & toggle
- [ ] Toggle ↔ service wiring
- [ ] Persist on/off state
- [ ] Notification ✕ syncs with UI

### Phase 6 — Permissions & battery saver
- [ ] Permission rows + grant flows
- [ ] Battery optimization check/request

### Phase 7 — Polish & device testing
- [ ] Haptics, subtle toggle animation
- [ ] Edge cases: Wi-Fi active, airplane mode, Jio LTE / LTE+ / 5G transitions
- [ ] Physical Android device testing (Jio SIM ideal)
- [ ] EAS development build

---

## 10. Testing Plan

| Test | Expected |
|---|---|
| Toggle ON with permissions | Foreground notification with dot |
| Jio on LTE | Red dot, label **LTE** |
| Jio on LTE+ (CA) | Red dot, label **LTE+** |
| Jio on 5G | Green dot, label **5G** |
| Jio on 5G+ (if available) | Green dot, label **5G+** |
| Download on cellular | Download speed updates in notification |
| Tap ✕ on notification | Notification gone, toggle OFF |
| Toggle OFF in app | Service stopped |
| Battery saver + exemption | Service keeps running |
| Wi-Fi ↔ cellular switch | Label + color update within 2s |

**Test device:** Physical Android phone with Jio (or similar) SIM strongly recommended.

---

## 11. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| 5G NSA shows as LTE on some Jio devices | Show native label; document NSA limitation |
| 5G+ heuristic unavailable on older APIs | Fall back to **5G** label |
| OEM kills background service | Battery exemption + foreground service |
| Play policy on battery optimization permission | Clear in-app justification |
| Status bar dot invisible on some OEM skins | Expanded notification + in-app preview as backup |
| Expo Go incompatibility | Dev-client build documented in README |

---

## 12. Out of Scope (v1)

- iOS
- Historical speed graphs / logging
- Home-screen widgets
- Multi-SIM picker
- Auto-start on boot
- Active speed test (max line speed benchmark)

---

## 13. Deliverables

1. Expo Android project in this workspace
2. EAS-configured dev build
3. Foreground monitor with red/green dot + LTE/LTE+/5G/5G+ labels
4. Expandable notification with speeds + ✕ close
5. AMOLED UI (black + violet accent) with master toggle
6. Permission flows including battery saver exemption
7. README with build/run instructions

---

## 14. Open Items (optional — defaults apply if you just say "start")

| Item | Default |
|---|---|
| Speed units | Auto-switch KB/s ↔ Mbps |
| Auto-restart on boot | Deferred to v1.1 |

---

When you're ready, reply **"start"**. I'll implement phase by phase.
