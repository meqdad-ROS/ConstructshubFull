# ConstructsHub Mobile (Expo)

React Native + Expo Router app. Shares the Next.js backend via a signed JWT in
`expo-secure-store`. Dark theme by default, Arabic + English with RTL flip.

## File tree

```
mobile/
├── app/                   expo-router filesystem routes
│   ├── _layout.tsx        root providers (ErrorBoundary, QueryProvider, biometric gate, deep links)
│   ├── index.tsx          splash → tabs or /(auth)/login
│   ├── (auth)/login.tsx   credentials sign-in
│   ├── (tabs)/            tab navigator
│   │   ├── marketplace.tsx    + voice + image search
│   │   ├── orders.tsx         + order detail stack
│   │   ├── messages.tsx       + per-thread chat
│   │   ├── tenders.tsx        contractor/consultant tenders feed
│   │   ├── jobs.tsx           worker job feed + apply
│   │   ├── trips.tsx          driver inbox + accept + live GPS pings
│   │   ├── profile.tsx        wallet + estimator shortcut
│   │   └── settings.tsx       locale, biometric, notification prefs
│   ├── product/[slug].tsx         product detail → add to cart
│   ├── cart/index.tsx             local cart (SQLite)
│   ├── checkout/index.tsx         server-recomputed totals
│   ├── orders/[id].tsx            order detail + status timeline
│   ├── messages/[threadId].tsx    optimistic send + outbox fallback
│   ├── tenders/[id].tsx           tender detail + bid submission
│   └── estimator.tsx              IFC / PDF / Word / Excel → priced estimate
├── components/
│   ├── ui.tsx             Button, Card, Field, StatusPill, Empty, Row, …
│   ├── toast.tsx          one-at-a-time global toast
│   └── error-boundary.tsx last-resort crash screen
├── lib/
│   ├── api.ts             fetch wrapper with retries, bearer, correlation ID
│   ├── query.tsx          TanStack Query provider
│   ├── queries.ts         typed hooks for search, orders, wallet, …
│   ├── outbox.ts          durable offline queue (expo-sqlite + NetInfo)
│   ├── cart.ts            local cart stored in SQLite
│   ├── session.ts         JWT auth, push registration on login
│   ├── biometric.ts       expo-local-authentication gate
│   ├── push.ts            FCM/APNs token registration
│   ├── i18n.ts            runtime locale with ar + en catalogues
│   ├── money.ts           SAR + relative-time formatters
│   ├── pure.ts            Expo-free pure helpers (unit-tested)
│   └── theme.ts           design tokens
├── i18n/{en,ar}.json      translation catalogues
├── tests/pure.test.ts     node:test unit tests on pure helpers
└── app.json               Expo config, deep link scheme, permissions
```

## Quick start

```bash
cd mobile
npm install
# Point at a running web backend
#   edit app.json → expo.extra.apiBaseUrl, or set EXPO_PUBLIC_API_BASE_URL
npx expo start
```

Press `i` for iOS Simulator, `a` for Android emulator, `w` for web.

## Role-aware tabs

The tab bar shows only what each role can act on (SRS §4.3 capability matrix):

| Role | Visible tabs |
|---|---|
| Casual Buyer / Owner / Supplier | marketplace, orders, messages, profile, settings |
| Contractor / Consultant | + tenders |
| Worker | jobs, messages, profile, settings |
| Driver | trips, messages, profile, settings |

## Offline-first

Every mutation lives inside TanStack Query. When the network is down and the
caller catches an `ApiError{status: 0}`, the mutation handler enqueues the
request into `lib/outbox.ts` (SQLite, FIFO, 5-attempt backoff). The drainer
runs on reconnect automatically via `@react-native-community/netinfo`.

Outbox-aware callers:
- `POST /api/orders` from Checkout
- `POST /api/messages/threads/[id]` from Chat
- `POST /api/jobs/[id]/apply` from Jobs
- `PATCH /api/trips/[id]` from Trips
- `POST /api/trips/[id]/ping` from the GPS loop
- `POST /api/tenders/[id]/bids` from Tender detail

## Security

- JWT stays in `expo-secure-store` with `WHEN_UNLOCKED_THIS_DEVICE_ONLY`.
- Biometric lock on launch + re-lock after 5 min in background.
- No secrets land in logs. Correlation IDs are generated per request.
- Deep links resolve inside the authenticated stack only — any
  `constructhub://orders/*` falls through to `/(auth)/login` when logged out.

## Tests

```bash
# Pure-logic suite (no Expo bootstrap required)
npm test                              # requires `npm install` first
# or, from the host without installing deps:
../waquor/node_modules/.bin/tsx --test tests/*.test.ts
```

6 unit tests covering: VAT math, platform fee, line totals, relative time
formatter.

## Verify

```bash
npm run typecheck
npm run lint
```

## Still open

Carried over from `NoteToDeveloper.md`:

- EAS Update signed OTAs (code-signing certs + `eas update:configure`)
- Replace Expo push tokens with native FCM/APNs tokens in a bare build
- Message attachments + image picker from chat
- Supplier role: product add + inventory management screens
- Owner role: project create + milestone approve flow (web-only today)
- Component-level RTL audit on carousels, charts, date pickers
- Push-notification handler → deep link into the referenced entity
- Error reporting (Sentry / Bugsnag) wired into `components/error-boundary.tsx`
