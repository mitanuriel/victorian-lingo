# Victorian Lingo

A React Native app for learning Victorian and Regency-era vocabulary through Project Gutenberg texts.

[![SonarQube Cloud](https://sonarcloud.io/images/project_badges/sonarcloud-light.svg)](https://sonarcloud.io/summary/new_code?id=mitanuriel_victorian-lingo)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=mitanuriel_victorian-lingo&metric=alert_status&token=ed8377d4e114f9e6587a2daa39d43e7e5d413dbd)](https://sonarcloud.io/summary/new_code?id=mitanuriel_victorian-lingo)

## Stack

- Expo SDK 54 / React Native
- TypeScript 5.9
- expo-router (file-based navigation)
- Zustand (state management)
- Jest + jest-expo (76 tests)

## Getting started

```bash
nvm use 20
bun install
bun run start
```

## CI

Every push to `main` and every PR runs type-check → lint → tests → SonarCloud quality gate via GitHub Actions.
