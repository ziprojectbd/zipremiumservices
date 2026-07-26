# JS to TypeScript Migration Plan — Backend

## Context

The backend at `backend/` is a mixed JS/TS codebase (~66 JS files, ~30 TS files). All models are already TypeScript, but controllers, routes, middleware, utilities, config, and DB connection are plain JS. The frontend is fully TypeScript. This migration converts all remaining JS to production-ready TypeScript with module aliases, proper typing, strict mode, and a complete build pipeline.

---

## Phase 0: Dependencies & Configuration

### Step 0.1 — Install new packages
```bash
cd backend
npm install module-alias
npm install -D @types/express @types/cors @types/compression @types/jsonwebtoken @types/multer @types/bcryptjs @types/module-alias tsc-alias zod
```

### Step 0.2 — Update `tsconfig.json`
Add `baseUrl`, `paths`, and `include`:
- `baseUrl`: `"."`
- `paths`: All requested aliases (`@/*`, `@controllers/*`, `@models/*`, `@routes/*`, `@middlewares/*`, `@utils/*`, `@config/*`, `@types/*`, `@interfaces/*`)
- `include`: `["src/**/*.ts"]`
- Keep all existing strict settings intact

### Step 0.3 — Update `package.json`
Add `_moduleAliases` for runtime alias resolution (points to `dist/`). Update scripts:
- `dev`: `tsx watch src/server.ts`
- `build`: `tsc && tsc-alias`
- `start`: `node -r module-alias/register dist/server.js`
- `type-check`: `tsc --noEmit`

### Step 0.4 — Create new directories
```
src/types/          — Global type declarations (Express Request augmentation, AppError)
src/interfaces/     — Shared interfaces (pagination, etc.)
src/services/       — Empty for now (future use)
src/validators/     — Zod validation schemas
```

### Step 0.5 — Update `.gitignore`
Ensure `dist/`, `*.js.map`, `*.d.ts.map` are ignored in backend.

### Step 0.6 — Create `ecosystem.config.js`
PM2 config with cluster mode, autorestart, memory limit (1G), log separation.

### Step 0.7 — Update Dockerfile
Change CMD from `node src/index.js` to `node -r module-alias/register dist/server.js`. Copy `dist/` from builder instead of `src/`.

---

## Phase 1: Foundation Types

### Step 1.1 — `src/types/express.d.ts`
Augment Express Request with `user?: IUser` property so `req.user` is typed everywhere.

### Step 1.2 — `src/types/app-error.ts`
Create `AppError` class extending `Error` with `statusCode`, `isOperational`, `code` fields.

### Step 1.3 — `src/interfaces/index.ts`
Export `AsyncHandlerFn`, `PaginationQuery`, `SearchQuery` types.

### Step 1.4 — `src/validators/index.ts`
Export shared Zod schemas (email, pagination, mongoId).

---

## Phase 2: Convert Utilities (5 files)

All in `src/utils/`:
| File | Key Changes |
|---|---|
| `asyncHandler.ts` | Add generic `<T>` type parameter, use Express types |
| `apiResponse.ts` | Add `ApiSuccessResponse<T>`, `ApiErrorResponse`, `PaginatedResponse<T>` interfaces |
| `jwt.ts` | Add `JwtPayload` interface, type `signToken`/`verifyToken` properly |
| `currency.ts` | Add parameter/return types |
| `providerMapper.ts` | Add `ProviderItem` interface |

**Pattern:** Replace relative `.js` imports with aliases (e.g., `@config/env`). All logic stays identical.

---

## Phase 3: Convert Config & DB

### Step 3.1 — `src/config/env.ts`
- Add `EnvConfig` interface with all typed fields
- Keep JWT_SECRET validation
- Default `PORT` to `5000`, `NODE_ENV` to `'development'`

### Step 3.2 — `src/db/connect.ts`
- Add `MongooseCache` interface and `global.mongooseCache` type declaration
- Type `connectDB()` return as `Promise<typeof mongoose>`

---

## Phase 4: Convert Middleware (5 files)

| File | Key Types |
|---|---|
| `auth.ts` | `Request`, `Response`, `NextFunction`, `verifyToken` return type |
| `adminOnly.ts` | Minimal — just Express types + `req.user?.role` check |
| `errorHandler.ts` | Handle `AppError` instances, Mongoose `ValidationError`/`CastError`, Mongo `11000` |
| `rateLimiter.ts` | Already simple — just add Express types |
| `upload.ts` | Add `Express.Multer.File` type in `fileFilter` callback |

### Step 4.1 — `src/middleware/validate.ts` (NEW)
Zod validation middleware: `validate(schema: ZodSchema)` returns Express middleware.

---

## Phase 5: Convert Controllers (25 files)

**Conversion pattern for EVERY controller:**
1. Rename `.js` → `.ts`
2. Replace relative imports with aliases
3. Add inline type annotations where destructuring is complex
4. NO behavioral changes

**Special attention files:**
| Controller | Complexity | Notes |
|---|---|---|
| `order.controller.ts` | High (473 lines) | Add `CreateOrderBody` interface, typed `req.body` |
| `admin.controller.ts` | High (768 lines) | Many exported functions |
| `auth.controller.ts` | Medium | Uses `req.user`, `getClientIP`, `getGeoFromIP` |
| `upload.controller.ts` | Medium | `req.file` typed as `Express.Multer.File` |
| `chat.controller.ts` | Medium | Raw MongoDB collection access |
| `proxy.controller.ts` | Low | Exports unwrapped async function |
| `webhook.controller.ts` | Low | Raw `req.headers` access |

---

## Phase 6: Convert Routes (27 files)

**Conversion pattern:**
1. Rename `.js` → `.ts`
2. Replace relative imports with aliases
3. All logic stays identical

### Step 6.1 — `src/routes/index.ts`
All 27 route files imported with aliases. Controller reference to `getPaymentSettings`/`updatePaymentSettings` from `admin.controller` stays identical.

---

## Phase 7: Convert Entry Points

### Step 7.1 — `src/app.ts` (was `app.js`)
- Add Express types, type `_req`/`_res` in health check callback
- Use aliases for imports

### Step 7.2 — `src/server.ts` (was `index.js`)
- Rename, add `async function start(): Promise<void>`
- Type `err` in catch as `Error`
- Use aliases for imports

---

## Verification

After all phases complete:

1. **`npm run type-check`** — `tsc --noEmit` → zero errors
2. **`npm run build`** — `tsc && tsc-alias` → `dist/` with aliased imports
3. **`npm run dev`** — `tsx watch src/server.ts` → server starts without errors
4. **`npm run start`** — `node -r module-alias/register dist/server.js` → production mode works
5. **Health check** — `GET /health` returns 200
6. **Auth flow** — Login, signup, Google OAuth work
7. **CRUD** — Product listing, order creation, admin panel work
8. **Error handling** — Invalid requests return proper error responses
9. **Docker build** — `docker build` succeeds with updated CMD

---

## Files to Create (10 new)

1. `src/types/express.d.ts`
2. `src/types/app-error.ts`
3. `src/types/index.ts`
4. `src/interfaces/index.ts`
5. `src/validators/index.ts`
6. `src/middleware/validate.ts`
7. `ecosystem.config.js`
8. `src/services/.gitkeep`

## Files to Convert (~66)

All `.js` files in: `src/config/`, `src/db/`, `src/middleware/`, `src/controllers/`, `src/routes/`, `src/utils/`, plus `src/app.ts` and `src/server.ts`.

## Files Already TS (no changes)

All `src/models/*.ts`, `src/config/constants.ts`, `src/utils/captchamaster.ts`, `cloudinary.ts`, `devLogger.ts`, `geo.ts`, `sync-admin-email.ts`, `telegram.ts`.
