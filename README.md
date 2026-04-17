# Playwright Starter

A clean Playwright project scaffolded from scratch with TypeScript.

## Setup

```bash
npm install
npx playwright install chromium
```

## Environment setup

Copy `.env.example` to `.env` and update values:

```bash
BASE_URL=https://your-app-url.com/login
LOGIN_USERNAME=your_username
LOGIN_PASSWORD=your_password
CHECKER_USERNAME=your_checker_username
CHECKER_PASSWORD=your_checker_password
```

## Run tests

```bash
npm test
```

## Useful scripts

- `npm test` - run tests headless
- `npm run test:headed` - run tests with browser UI
- `npm run test:ui` - open Playwright UI mode
- `npm run report` - open the HTML report

## Included starter tests

- `tests/example.spec.ts`
- `tests/login.spec.ts`

## Notes

- Default `baseURL` is `https://playwright.dev`
- Override it with environment variable `BASE_URL`
