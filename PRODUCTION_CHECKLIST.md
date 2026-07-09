# Production Checklist

## Review Summary

- Project uses Create React App with `react-app-rewired` and `customize-cra`.
- `config-overrides.js` is still needed because the app configures Babel via `.babelrc` and provides `path-browserify` as a Webpack fallback.
- React Router uses `BrowserRouter`, so production hosting must serve `index.html` for unknown routes.
- API configuration is centralized through CRA environment variables.

## Changes Made

- Renamed the app package from `fontend` to `japanese-learning-frontend`.
  - Reason: fixes the package metadata typo and makes Docker/build logs easier to identify.
- Replaced `REACT_APP_BASE_URL` and `REACT_APP_BASE_URL_API` usage with `REACT_APP_API_URL`.
  - Reason: keeps one canonical backend API variable for Railway and local Docker builds.
- Moved external AI helper endpoints to `REACT_APP_FURIGANA_API_URL` and `REACT_APP_VOICE_ASSESS_API_URL`.
  - Reason: removes hard-coded service URLs from source code.
- Removed the production Axios baseURL `console.log`.
  - Reason: avoids noisy production logs and leaking deployment configuration in the browser console.
- Removed unused/server-side dependencies from frontend dependencies.
  - Removed: `cloudinary`, `multer`, `multer-storage-cloudinary`, `date-fns`, `fuse.js`, `hanzi-writer`, `js-cookie`, `jwt-decode`, `react-toastify`, `swiper`.
  - Reason: they were not imported by the frontend source and should not increase install/build surface.
- Moved testing-only packages and `web-vitals` to `devDependencies`.
  - Reason: they are needed for tests/build-time source compilation, not for the final Nginx runtime image.
- Added `.dockerignore`.
  - Reason: keeps Docker context small and prevents local `.env` files from being copied into builds.
- Added production `Dockerfile`.
  - Reason: builds React in Node, then serves static artifacts from a small Nginx image.
- Added `nginx.conf`.
  - Reason: supports React SPA refresh, static asset caching, gzip, `/health`, and basic security headers.

## Environment Variables

Required at build time:

- `REACT_APP_API_URL`
- `REACT_APP_FURIGANA_API_URL`
- `REACT_APP_VOICE_ASSESS_API_URL`

Notes:

- CRA embeds `REACT_APP_*` values during `npm run build`.
- On Railway, changing these variables requires a redeploy/rebuild of the frontend service.
- Do not commit `.env`; use `.env.example` only as a template.

## Routing

- `BrowserRouter` is production-safe with the included Nginx rule:
  - `try_files $uri /index.html;`
- This prevents 404 errors when refreshing routes such as `/dictionary`, `/community`, or `/admin`.

## Build

Use:

```bash
npm run build
```

Docker build uses:

```bash
npm ci --no-audit --no-fund
npm run build
```

Verified:

- `npm run build` completed successfully.
- `docker build --check .` completed with no Dockerfile warnings.
- Production Docker image `japanese-learning-frontend:railway-check` built successfully.
- Container smoke test returned `200` for `/health`.
- Container smoke test returned `200` for `/dictionary`, confirming React Router refresh fallback.

Build warnings still present:

- Existing ESLint `no-unused-vars` warnings in several UI files.
- Existing React Hooks dependency warnings in several pages/components.
- Existing footer `href` accessibility warnings.
- CRA bundle size warning: main JS is larger than recommended.
- Browserslist/caniuse-lite data is stale.

These warnings were not broadly refactored in this pass because some fixes can affect render timing, route transitions, or visual behavior. They should be handled in a separate UI-safe cleanup pass.

## Deferred Optimizations

- Route-level lazy loading/code splitting can reduce initial JS size, but it was not applied in this pass.
  - Reason: route transitions and loading behavior are part of the current UX, so this should be done with visual regression testing.

## Railway Readiness

- Dockerfile is multi-stage.
- Runtime is Nginx and contains only static build artifacts.
- Nginx listens on Railway's injected `PORT`.
- `/health` is available for Railway health checks.
- React Router refresh is supported.
- Static assets under `/static/` are cached with immutable long-term cache headers.
- `index.html` is not cached, so new deployments are picked up quickly.
