# Delhi Explorer

Delhi-NCR attractions planner (65 places, 7 categories). One Expo / React Native codebase for **iOS and Android**.

## Run it on your phone (testing)
```bash
npm install
npx expo start        # scan the QR code with Expo Go (iOS / Android)
```
Checks: `npm run check` (typecheck + 16 tests).

## Where things live
- `src/data/places.json` – the 65 places. `src/data/repository.ts` is the only thing screens use to read them, so moving to a hosted database later changes one file.
- `src/lib/` – status (open/closed/partial), pricing, distance, search/filter logic (all unit tested).
- `src/components/`, `App.tsx` – UI, following the "Visit Planner" Figma (light theme).
- `src/config.ts` – support email + privacy policy URL (**placeholders, replace before launch**).
- `app.json` / `eas.json` – store identifiers, permission text, build profiles.

Never hand-edit `ios/` or `android/`; they are generated at build time.

## Build for the stores (no Mac needed)
```bash
npm i -g eas-cli && eas login
eas build:configure
eas build --profile preview --platform android   # installable APK for testers
eas build --profile production --platform all
eas submit --platform all
```
See `LAUNCH_CHECKLIST.md` for everything to finish first.
