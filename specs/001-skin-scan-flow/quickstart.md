# Quickstart Guide: Skin Scan Flow Development

**Date**: 2025-11-18
**Feature**: Skin Scan Flow (001-skin-scan-flow)
**Purpose**: Get developers up and running with local development environment

---

## Prerequisites

### Required Software
- **Node.js**: v18+ (LTS)
- **npm**: v9+ (comes with Node)
- **Expo CLI**: Installed globally via `npm install -g expo-cli` (optional, can use npx)
- **iOS Simulator**: Xcode 14+ on macOS (for iOS development)
- **Git**: For version control

### Required Accounts
- **Supabase Account**: Free tier at [supabase.com](https://supabase.com)
  - Create new project for dev environment
  - Enable Google OAuth provider
  - Enable Apple OAuth provider (requires Apple Developer account)
- **Apple Developer Account** (optional for local dev, required for Apple Sign-In)
- **Backend API Access**: Get `EXPO_PUBLIC_FACE_API_BASE_URL` from backend team

### Recommended Tools
- **VS Code**: With React Native Tools extension
- **Watchman**: For better file watching on macOS (`brew install watchman`)
- **React DevTools**: For debugging

---

## Environment Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd skincare
```

### 2. Install Dependencies
```bash
npm install
```

This installs:
- Expo SDK 54
- React Native Reanimated v4
- Supabase JS Client
- react-native-face-detector-camera
- Zustand (state management)
- All other dependencies from `package.json`

### 3. Configure Environment Variables

Create a `.env` file in the project root (already in `.gitignore`):

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Backend API
EXPO_PUBLIC_FACE_API_BASE_URL=http://localhost:8000

# Optional: For production builds
EAS_PROJECT_ID=f240da61-1b05-46d2-9bc3-bf294cc5b3a8
```

**Get Supabase credentials**:
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to Settings → API
4. Copy `URL` and `anon` key

**Update app.json** (if different from committed values):
```json
{
  "expo": {
    "extra": {
      "supabaseUrl": "https://your-project.supabase.co",
      "supabaseAnonKey": "your-anon-key",
      "EXPO_PUBLIC_FACE_API_BASE_URL": "http://localhost:8000"
    }
  }
}
```

### 4. Configure Supabase OAuth

**Google OAuth**:
1. In Supabase Dashboard → Authentication → Providers
2. Enable Google
3. Add OAuth client ID/secret from [Google Cloud Console](https://console.cloud.google.com)
4. Add redirect URL: `https://your-project.supabase.co/auth/v1/callback`

**Apple OAuth** (optional for local dev):
1. In Supabase Dashboard → Authentication → Providers
2. Enable Apple
3. Add Service ID, Team ID, Key ID from [Apple Developer](https://developer.apple.com)
4. Add redirect URL: `https://your-project.supabase.co/auth/v1/callback`

**Add Mobile Redirect** URLs in Supabase:
- Navigate to Authentication → URL Configuration
- Add redirect URL: `facefit://auth`

---

## Running the App

### Start Development Server
```bash
npx expo start
```

This starts the Metro bundler. You'll see a QR code and menu options.

### Run on iOS Simulator
```bash
# Method 1: From Expo Dev Tools
Press 'i' in the terminal

# Method 2: Direct command
npx expo run:ios
```

**First run takes 5-10 minutes** to build the native app with face detection module.

### Run on Physical iOS Device
1. Install Expo Go app from App Store
2. Scan QR code from `npx expo start`
3. **Note**: Face detection requires development build, not Expo Go

### Create Development Build (Required for Face Detection)
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Create development build for iOS
eas build --profile development --platform ios

# Install build on simulator
eas build:run -p ios
```

---

## Project Structure Overview

```
skincare/
├── app/                          # Expo Router routes
│   ├── _layout.tsx               # Root layout with auth gate
│   ├── (auth)/
│   │   └── signin.tsx            # Sign-in screen
│   ├── (onboarding)/
│   │   └── welcome.tsx           # 5-question flow
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Bottom tabs
│   │   ├── index.tsx             # Home
│   │   ├── scan.tsx              # Camera + face detection
│   │   ├── history.tsx           # Scan history
│   │   ├── track.tsx             # Longitudinal metrics
│   │   └── settings.tsx          # User settings
│   └── (results)/
│       └── [runId].tsx           # Result detail
│
├── components/                   # Reusable UI primitives
├── features/                     # Feature-specific logic
│   ├── auth/
│   │   ├── supabase-client.ts
│   │   └── stores/auth-store.ts
│   ├── onboarding/
│   │   └── stores/onboarding-store.ts
│   ├── scans/
│   │   ├── face-analysis-api.ts
│   │   └── stores/scan-store.ts
│   └── settings/
│       └── stores/settings-store.ts
│
├── constants/
│   ├── Tokens.ts                 # Design system tokens
│   └── Config.ts                 # Environment config
│
├── hooks/                        # Custom hooks
├── types/                        # TypeScript type definitions
├── assets/                       # Images, fonts
│
├── specs/                        # Feature specifications
│   └── 001-skin-scan-flow/
│       ├── spec.md
│       ├── plan.md               # This feature's plan
│       ├── research.md
│       ├── data-model.md
│       ├── quickstart.md         # This file
│       └── contracts/
│
├── docs/                         # Documentation
├── .env                          # Environment variables (gitignored)
├── app.json                      # Expo configuration
├── package.json                  # Dependencies
└── tsconfig.json                 # TypeScript configuration
```

---

## Development Workflow

### 1. Start Feature Branch
```bash
git checkout -b feature/my-feature
```

### 2. Run Dev Server with TypeScript Check
```bash
# Terminal 1: Metro bundler
npx expo start

# Terminal 2: TypeScript type checking
npx tsc --watch --noEmit
```

### 3. Test on iOS Simulator
- Press `i` to launch iOS simulator
- Hot reload is enabled (save file to see changes)
- Shake device to open developer menu

### 4. Common Development Tasks

**Clear cache** (if seeing stale data):
```bash
npx expo start --clear
```

**Reset iOS simulator**:
```bash
xcrun simctl erase all
```

**View Zustand store state**:
```typescript
// In any component or console
import { useAuthStore } from '@/features/auth/stores/auth-store';
console.log('Auth state:', useAuthStore.getState());
```

**View AsyncStorage**:
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

AsyncStorage.getAllKeys().then(keys => {
  AsyncStorage.multiGet(keys).then(stores => {
    console.log('AsyncStorage:', stores);
  });
});
```

**Test face detection**:
1. Navigate to Scan screen
2. Allow camera permissions
3. Point camera at face (or use simulator with image)
4. Verify green overlay appears when face centered

**Test backend API** (with curl):
```bash
# Get Supabase token (sign in via app first, then extract from AsyncStorage)
TOKEN="your-supabase-access-token"

# Start analysis
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@/path/to/selfie.jpg" \
  -F "real_age=28" \
  http://localhost:8000/start-task

# Poll task status (replace task_id)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/tasks/<task_id>
```

---

## Troubleshooting

### "Supabase credentials missing" Error
- Check `.env` file exists with correct variables
- Restart expo server: `npx expo start --clear`
- Verify `app.json` extra config matches

### Camera Not Working
- Check iOS simulator has camera access (Settings → Privacy)
- Face detection requires development build (not Expo Go)
- Verify `react-native-face-detector-camera` in `app.json` plugins

### "Network request failed" on API Calls
- Check backend is running at `EXPO_PUBLIC_FACE_API_BASE_URL`
- For iOS simulator, use `http://localhost:8000` (not `127.0.0.1`)
- For physical device, use computer's local IP (e.g., `http://192.168.1.100:8000`)

### OAuth Redirect Not Working
- Verify redirect URL `facefit://auth` in Supabase dashboard
- Check `scheme: "betterskin"` in `app.json` (deeplink config)
- Restart app after OAuth config changes

### Reanimated Errors
- Clear cache: `npx expo start --clear`
- Verify `"newArchEnabled": true` in `app.json`
- Check Reanimated v4 is installed: `npm list react-native-reanimated`

### TypeScript Errors
```bash
# Regenerate types
npx expo customize tsconfig.json

# Check for missing types
npm install --save-dev @types/react @types/react-native
```

### AsyncStorage Not Persisting
- iOS simulator: Reset simulator (`xcrun simctl erase all`)
- Check Zustand persist config uses `createJSONStorage(() => AsyncStorage)`
- Verify no JSON circular references in store data

---

## Testing Checklist

Before submitting PR, verify:

- [ ] App launches without crashes on iOS simulator
- [ ] Sign-in with Google completes OAuth flow
- [ ] Onboarding 5 questions can be completed
- [ ] Onboarding state persists across app restarts
- [ ] Camera opens on scan screen
- [ ] Face detection overlay shows when face centered
- [ ] Photo capture works
- [ ] Result screen shows loading state while polling
- [ ] Result displays analysis data when complete
- [ ] History list shows past scans
- [ ] Settings screen shows user details
- [ ] Sign-out clears all stored data
- [ ] No unnecessary console warnings
- [ ] TypeScript compiles without errors (`npx tsc`)

---

## Useful Commands

```bash
# Development
npx expo start                    # Start dev server
npx expo start --clear            # Clear cache and start
npx tsc --noEmit                  # Type check

# Building
eas build --profile development   # Dev build
eas build --profile preview       # Preview build
eas build --profile production    # Production build

# iOS Specific
npx expo run:ios                  # Run on simulator
eas build:run -p ios              # Install EAS build

# Debugging
npx react-devtools                # Open React DevTools
npx expo start --dev-client       # Use dev client instead of Expo Go

# Clean
rm -rf node_modules               # Remove dependencies
npm install                       # Reinstall
npx expo start --clear            # Clear Metro cache
xcrun simctl erase all            # Reset iOS simulators
```

---

## Key Files for This Feature

| File | Purpose |
|------|---------|
| `app/(auth)/signin.tsx` | Google/Apple OAuth sign-in |
| `app/(onboarding)/welcome.tsx` | 5-question carousel |
| `app/(tabs)/scan.tsx` | Camera + face detection |
| `app/(results)/[runId].tsx` | Analysis results + routine display |
| `features/auth/supabase-client.ts` | Supabase initialization |
| `features/scans/face-analysis-api.ts` | Backend API client |
| `features/scans/stores/scan-store.ts` | Scan runs state |
| `constants/Tokens.ts` | Design system tokens |

---

## Next Steps

1. **Implement auth flow**: Start with `app/(auth)/signin.tsx`
2. **Add onboarding**: Build `app/(onboarding)/welcome.tsx` with Reanimated
3. **Build scan screen**: Integrate face detection in `app/(tabs)/scan.tsx`
4. **Connect backend**: Wire up API calls in `features/scans/face-analysis-api.ts`
5. **Display results**: Show analysis data in `app/(results)/[runId].tsx`
6. **Polish UI**: Apply design tokens, add micro-interactions

Refer to `specs/001-skin-scan-flow/tasks.md` (generated by `/speckit.tasks`) for detailed implementation checklist.

---

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Face Detector Camera Docs](https://github.com/luicfrr/react-native-face-detector-camera)
- Backend API: `docs/frontend_integration.md`
- Feature Spec: `specs/001-skin-scan-flow/spec.md`

---

**Questions?** Check `docs/` folder or ask the team in Slack.
