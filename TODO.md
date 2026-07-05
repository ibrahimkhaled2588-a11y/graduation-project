# TODO (UI/UX + Upload fields)

## Step 1: Prepare
- [x] Inspect Flask routes + templates + existing CSS
- [x] Remove redundant ecg.css (merged into detector.css)

## Step 2: Implement UI/UX improvements
- [x] Unify Stroke + CHD + ECG form styling (shared detector.css)
- [x] Improve ECG upload UX: inline error + filename display + preview
- [x] Add drag/drop support for ECG upload
- [x] Add language selector to all pages (chat, about, stroke, chd, ecg)
- [x] Move inline styles to CSS classes (team avatars, form icons)

## Step 3: Result + Responsiveness tweaks
- [x] Icons properly sized on home page (60x60px SVG icons)
- [x] Modern button styling (ripple effect, hover transitions)
- [ ] Testing: Run app to verify forms and sliders work

## Step 4: Testing
- [ ] Run the app and manually verify:
  - `/stroke` submit with valid numbers
  - `/chd` submit with valid numbers
  - `/ecg_mi` upload selection + preview + submit
  - Result panel renders + doctors slider works

