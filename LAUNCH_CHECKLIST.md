# Launch checklist

## Accounts (you)
- [ ] Apple Developer Program (US$99/year) – needed for App Store and TestFlight
- [ ] Google Play Console (one-time US$25) – new personal accounts must run a closed test with 12 testers for 14 days before production
- [ ] Expo account (free tier is enough to start) for `eas build`

## Replace placeholders in the code
- [ ] `app.json`: `ios.bundleIdentifier` and `android.package` (now `com.example.delhiexplorer`). Pick your own and never change after first upload
- [ ] `src/config.ts`: real `SUPPORT_EMAIL` and a public `PRIVACY_POLICY_URL` (both stores require it; mention location use, nothing sent off the phone)
- [ ] Icons / splash in `assets/` (current ones are simple placeholders). Needs 1024×1024 icon
- [ ] `bookUrl` for each place: add only official ticket links (button hides when empty)

## Data and content to verify before public release
- [ ] Coordinates are approximate for all 65 places. Check each against the official location
- [ ] Re-verify timings, fees and closed days against official sites (each place shows a source and verified note)
- [ ] 31 places have no photo yet (coloured placeholder is shown). Photo credits for the 34 that do must stay visible (Wikimedia Commons licences require attribution)
- [ ] Decide how fees get updated after launch (app update vs hosted data)

## Store listing
- [ ] Name, short and long description, category (Travel), keywords
- [ ] Screenshots: iPhone 6.9" and 6.5", Android phone
- [ ] Apple: privacy "nutrition label" (location used, not collected); age rating; review notes
- [ ] Google: Data safety form (approximate/precise location, not shared); content rating

## Test before submitting
- [ ] Real iPhone and real Android phone: location allow / deny / pick-area flows
- [ ] Airplane mode (the app works offline; only maps/booking links need internet)
- [ ] Small and large screens, large system font size
- [ ] TestFlight and Play internal testing with a few people

## Login (must do before launch)
- [ ] Remove the demo login (`DEMO_OTP` in `src/config.ts`, the "Demo only" hint lines in `LoginScreen.tsx`, the code check in `src/hooks/useAuth.ts`). Right now any phone or email is accepted with code 123456 and nothing is really sent
- [ ] Add real sign-in: SMS OTP for phone, and Google sign-in with email verification code (+ Sign in with Apple, required by App Store rules when Google login is offered). No passwords
- [ ] Add in-app "Delete my account" (required by both stores once accounts exist)

## Photos (to do)
- [ ] Replace the current low-resolution photos (many are only 360-720px wide and look soft on phones) with sharp ones about 1100px wide, then run `node scripts/generate-photos-index.js`. Keep a credit for every photo (3 have none yet)
