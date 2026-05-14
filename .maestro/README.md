# Maestro E2E Tests

End-to-end tests for STEMM Lab using [Maestro](https://maestro.mobile.dev).
Tests drive the real UI on a physical device or simulator running Expo Go.

## Prerequisites

### 1. Install Java
Maestro requires Java. Install via Homebrew:
```bash
brew install openjdk
```
Then add to your shell profile (`~/.zshrc`):
```bash
export PATH="$(brew --prefix openjdk)/bin:$PATH"
```

### 2. Install Maestro CLI
```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```
Then add to PATH (printed at end of install):
```bash
export PATH="$PATH":"$HOME/.maestro/bin"
```
Verify: `maestro --version` should print `2.x.x`

### 3. Set test account credentials
Tests use environment variables so credentials are never committed.
Create a `.env.test` file (gitignored) or export before running:
```bash
export TEST_EMAIL="your-test-account@example.com"
export TEST_PASSWORD="your-test-password"
```
Use a dedicated test Firebase account — not your personal account.

## Running the tests

### All flows
```bash
npm run test:e2e
# or directly:
maestro test .maestro/
```

### Single flow
```bash
maestro test .maestro/01_login_flow.yaml
```

## Test flows

| File | What it tests |
|---|---|
| `01_login_flow.yaml` | Sign in with email/password, verify Home screen loads |
| `02_reaction_board_flow.yaml` | Play Reaction Board end-to-end: start → wait → tap → result → save |
| `03_leaderboard_flow.yaml` | Navigate to Leaderboard, verify entries render, trigger pull-to-refresh |

## Known limitations

- **Expo Go only** — `appId: host.exp.exponent` targets Expo Go. For the production APK, change to the real bundle ID in each `.yaml` file.
- **Reaction Board timing** — flow 02 waits 5.5 seconds to guarantee the green phase has started (random delay is 2–5s). This makes the flow deterministic but slow.
- **Java warnings** — OpenJDK 25 prints `WARNING: A restricted method...` on startup. These are harmless and don't affect test results.
- **Physical device required** — Maestro needs a connected device or running simulator. Run `maestro devices` to see what's available.

## CI note
To run in CI, inject `TEST_EMAIL` and `TEST_PASSWORD` as secrets and ensure a simulator is booted before running `maestro test`.
