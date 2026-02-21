# due Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-20

## Active Technologies

- **Web**: TypeScript 5.9, Vue 3.5, Nuxt 4.2 + Prisma 6.2, Zod, date-fns, Vercel AI SDK, shadcn-vue (reka-ui), Lucide icons (001-orcamento-mensal)
- **iOS**: Swift 6.0, SwiftUI, iOS 17.0+, XcodeGen, Clerk iOS SDK >= 0.40.0, MVVM with @Observable (Due iOS app)

## Project Structure

```text
app/                    # Nuxt frontend (Vue components, pages, composables)
server/                 # Nuxt server (API routes, Prisma)
prisma/                 # Database schema and migrations
ios/Due/Due/            # iOS app (SwiftUI, MVVM)
  ├── Config/           # AppConfig (API URLs, keys)
  ├── Models/           # Codable data models
  ├── Networking/       # APIClient, Endpoints, APIError
  ├── ViewModels/       # @Observable view models
  ├── Views/            # SwiftUI views by feature
  ├── Helpers/          # Extensions, formatters, utilities
  └── Theme/            # DueTheme (animations, radii, gradients)
```

## Commands

### Web
```
npm test && npm run lint
```

### iOS
```
cd ios/Due && xcodegen generate && xcodebuild -scheme Due -destination 'platform=iOS Simulator,name=iPhone 16' build
swift test   # when test target is added
```

## Code Style

- **Web**: TypeScript 5.9, Vue 3.5, Nuxt 4.2: Follow standard conventions
- **iOS**: Swift 6.0 strict concurrency, MVVM with @Observable, adaptive Color(light:dark:) pattern, DueTheme constants for animations/radii

## Constitution (iOS)

The iOS project is governed by a constitution at `ios/.specify/memory/constitution.md` (v1.0.0).
Seven core principles — **every PR MUST self-check against them**:

1. **Privacy First** — HTTPS, Keychain-only secrets, no PII in logs, wipe on sign-out
2. **Offline Access** — CoreData/SwiftData cache, optimistic sync queue, < 1s offline launch
3. **Data Quality** — Decimal (not Double) for currency, explicit timezones, strict Codable
4. **Performance & Speed** — < 2s cold launch, < 300ms tab switch, 60fps scroll, < 100MB RAM
5. **Apple Design Language** — NavigationStack, Dynamic Type, SF Symbols, system materials, Reduce Motion
6. **UI/UX Consistency** — Shared glass effects, skeleton loading, EmptyStateView, ErrorView, pressableStyle
7. **Testing Standards** — 80% ViewModel/Networking coverage, mock URLProtocol, currency formatter tests

## Recent Changes

- 001-orcamento-mensal: Added TypeScript 5.9, Vue 3.5, Nuxt 4.2 + Prisma 6.2, Zod, date-fns, Vercel AI SDK, shadcn-vue (reka-ui), Lucide icons
- Due iOS: Swift 6.0 native app with Dashboard, Transactions, Installments, Onboarding, Settings screens

<!-- MANUAL ADDITIONS START -->

## Lessons Learned

<!--
  Every mistake MUST be logged here with the format:
  - YYYY-MM-DD: [Principle N violated] — <what went wrong> → <corrective action>

  This section is referenced by the iOS constitution (Continuous Learning section).
  When a recurring class of mistakes appears, amend the constitution.
-->

<!-- MANUAL ADDITIONS END -->
