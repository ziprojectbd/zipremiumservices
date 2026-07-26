# ZI Premium Services — Coolify Production Deployment

> **Repository:** https://github.com/ziprojectbd/zipremiumservices
>
> Best-practice, production-ready, security-hardened deployment guide.

---

## 📋 1. Architecture Overview

```
                        ┌─────────────────────────────────┐
                        │       Coolify Server             │
                        │                                  │
                        │  ┌──────────┐    ┌──────────┐   │
    User ──► HTTPS ──►  │  │ Frontend │◄──►│ Backend  │   │
                        │  │ nginx:80 │    │ Node:5000│   │
                        │  │ SPA +    │    │ Express  │   │
                        │  │ Proxy    │    │ API      │   │
                        │  └──────────┘    └────┬─────┘   │
                        │                       │         │
                        │                ┌──────▼──────┐  │
                        │                │  MongoDB    │  │
                        │                │  (Atlas)    │  │
                        │                └─────────────┘  │
                        └─────────────────────────────────┘
```

### Tech Stack

| Component | Technology | Package Manager | Build Command | Start Command | Port |
|-----------|-----------|----------------|---------------|---------------|------|
| **Frontend** | React 18 + Vite 6 + TypeScript + Tailwind CSS | npm | `npm run build` | nginx 1.27 (static) | 80 |
| **Backend** | Express 4 + Mongoose 9 (ES Modules) | npm | `npm run build` (optional) | `node src/index.js` (Node.js 22) | 5000 |

### Key Design Decisions (Security-First)

| Decision | Implementation |
|----------|---------------|
| **Non-root containers** | Backend runs as `nodeuser` (uid 1001), not root |
| **PID 1 handling** | `dumb-init` for proper signal forwarding & zombie reaping |
| **Production error handling** | Stack traces hidden in production, shown only in dev |
| **MongoDB TLS** | `tlsAllowInvalidCertificates` disabled in production |
| **CORS restricted** | Only `CLIENT_URL` allowed in production |
| **Rate limiting** | Auth: 10 req/15min, API: 100 req/15min |
| **Security headers (nginx)** | HSTS, X-Frame-Options, X-Content-Type-Options, Permissions-Policy |
| **Resource limits** | Backend: 512MB/0.5CPU, Frontend: 256MB/0.25CPU |
| **Immutable caching** | Fingerprinted assets (JS/CSS/images) cached 1 year |

---

## 🚀 2. Recommended: Docker Compose (Single Resource)

Easiest, most secure. Both services on the same Docker network, no exposed backend ports to the internet.

### Coolify Settings

| Setting | Value |
|---------|-------|
| **Resource Type** | Docker Compose |
| **Build Pack** | Docker Compose |
| **Repository** | `ziprojectbd/zipremiumservices` |
| **Branch** | `main` |
| **Base Directory** | `/` |
| **Compose File** | `docker-compose.yml` |

### Step-by-Step

1. **Coolify Dashboard** → **New Resource** → **Docker Compose**
2. **Connect repository**: Select `ziprojectbd/zipremiumservices`, branch `main`
3. **Base Directory**: `/`
4. **Compose File**: `docker-compose.yml` (auto-detected)
5. **Environment Variables**: Add all variables from [Section 4](#environment-variables)
6. **Domains**:
   - Frontend → `app.yourdomain.com` (port 80)
   - Backend → `api.yourdomain.com` (port 5000) *(optional — only if API needs direct access)*
7. **Deploy** → Coolify builds and starts both services

> **Security note:** Backend port is `expose`d (not `ports`d) — only accessible internally via Docker network. Frontend nginx proxies `/api` to backend. No need to expose backend to internet.

---

## 🔧 3. Alternative: Individual Docker Resources

Use this if you want separate auto-deploy triggers for frontend vs backend changes.

### 3A. Backend Service

| Coolify Setting | Value |
|----------------|-------|
| **Type** | Application |
| **Build Pack** | Docker |
| **Base Directory** | `/backend` |
| **Port** | `5000` |
| **Health Check Path** | `/health` |
| **Container Name** | `zipremium-backend-prod` |

### 3B. Frontend Service

| Coolify Setting | Value |
|----------------|-------|
| **Type** | Application |
| **Build Pack** | Docker |
| **Base Directory** | `/frontend` |
| **Port** | `80` |

**Important:** Since nginx proxies to `http://backend:5000/`, update `frontend/nginx.conf` line 3:

```nginx
upstream backend {
    server zipremium-backend-prod:5000;    # ← use actual container name
}
```

Both services must be on the same Coolify network.

---

## 📝 4. Environment Variables

### Required (Backend)

| Variable | Required | Purpose |
|----------|----------|---------|
| `MONGODB_URI` | ✅ **Yes** | MongoDB connection string |
| `JWT_SECRET` | ✅ **Yes** | JWT signing secret (use a strong random string) |
| `CLIENT_URL` | ✅ **Yes** | Frontend URL for CORS (e.g., `https://app.yourdomain.com`) |

### Optional (Backend — features won't work without these)

| Variable | Purpose |
|----------|---------|
| `ADMIN_EMAIL` | Default admin login email |
| `ADMIN_PASSWORD` | Default admin password |
| `GOOGLE_CLIENT_ID` | Google OAuth login |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret |
| `CLOUDINARY_CLOUD_NAME` | Image upload service |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `CAPTCHAMASTER_API_KEY` | Captcha solving service |
| `TELEGRAM_BOT_TOKEN` | Telegram notifications |
| `TELEGRAM_CHAT_ID` | Telegram notification target |
| `ONESERVICEBD_API_KEY` | OneServiceBD integration |
| `GEMINI_API_KEY` | Google Gemini AI (SEO generation) |
| `PORT` | Server port (default: 5000) |
| `NODE_ENV` | Environment (default: `development` — set to `production`) |

> **Note:** `NODE_ENV=production` is already hardcoded in docker-compose.yml, but if deploying individually, set it manually.

---

## 🌐 5. Domain & SSL Configuration

### DNS Records

```
Type: A
Name: app.yourdomain.com  →  Value: <your-coolify-server-ip>
Name: api.yourdomain.com   →  Value: <your-coolify-server-ip>
```

### Coolify SSL Setup

1. Go to resource → **Domains** tab
2. Add domain (e.g., `app.yourdomain.com`)
3. Toggle **SSL/TLS** → Let's Encrypt auto-provisioned
4. Toggle **Force HTTPS** → HTTP → HTTPS redirect
5. Repeat for `api.yourdomain.com` (backend)

### CORS Configuration

Backend `src/app.js` automatically handles this:

```js
const allowedOrigins = env.NODE_ENV === 'production'
  ? [env.CLIENT_URL]           // ← only your frontend domain
  : ['http://localhost:3000', 'http://localhost:5173'];
```

**Just make sure** `CLIENT_URL` is set to `https://app.yourdomain.com` (no trailing slash).

---

## 🔄 6. Auto Deploy from GitHub

### Setup

1. Go to resource **Settings** → **Deploy**
2. Enable **Auto Deploy**
3. Branch: `main`

### How it works

```
Git push to main → GitHub webhook → Coolify pulls & redeploys
```

### Directory Watching (Individual Resources only)

Set **Directories to Watch** to avoid unnecessary redeploys:
- Frontend resource: `/frontend`
- Backend resource: `/backend`

---

## ✅ 7. Verification Checklist

### Health Check
```bash
curl https://api.yourdomain.com/health
# → { "success": true, "message": "Server is running", "timestamp": "..." }
```

### Frontend
- [ ] Page loads with no console errors
- [ ] SPA routing works (refresh on `/about-us`, `/checkout`, etc.)
- [ ] Assets load (CSS, JS, images, favicon)
- [ ] Google Analytics & AdSense scripts load

### API
- [ ] Products, categories, orders endpoints return data
- [ ] Auth (login/signup) works
- [ ] No CORS errors in browser console
- [ ] WebSocket/chat works (if applicable)

### CORS Check
```bash
curl -H "Origin: https://app.yourdomain.com" \
  -H "Access-Control-Request-Method: GET" \
  https://api.yourdomain.com/api/products -I
# Should return: Access-Control-Allow-Origin: https://app.yourdomain.com
```

---

## 🔒 8. Security Checklist

- [ ] `.env` files are in `.gitignore` and never committed
- [ ] All API keys in `backend/.env` rotated if ever exposed
- [ ] `JWT_SECRET` is a strong random value (run: `openssl rand -hex 32`)
- [ ] `MONGODB_URI` uses a dedicated database user (not admin)
- [ ] MongoDB Atlas IP whitelist includes Coolify server IP (or `0.0.0.0/0` with auth)
- [ ] Rate limiting active on auth routes (10 requests/15 minutes)
- [ ] Backend containers run as non-root user
- [ ] Resource limits set in docker-compose.yml
- [ ] Backend port not exposed to public (only accessible via nginx proxy)

---

## ❓ 9. Troubleshooting

### Blank page or 404 on refresh
**Fix:** nginx `try_files` handles SPA routes. Verify `nginx.conf` includes:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### 502 Bad Gateway on API calls
**Check 1:** Backend container is running (`docker ps`)
**Check 2:** nginx `upstream backend` points to the correct container name
**Check 3:** Both services are on the same Docker network

### CORS errors in browser
**Check 1:** `CLIENT_URL` env var matches frontend domain exactly
**Check 2:** Protocol matches (both HTTPS or both HTTP; no trailing slash)
**Example:** `https://app.yourdomain.com` ✓, not `https://app.yourdomain.com/` ✗

### Backend won't start: "JWT_SECRET is required"
Backend throws on startup if `JWT_SECRET` is missing. Add it in Coolify env vars.

### MongoDB connection failure
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas IP whitelist
- If self-hosted MongoDB, ensure it's accessible from Coolify

### Health check failing in Coolify
- Backend: `wget -O /dev/null http://localhost:5000/health`
- Frontend: `wget -O /dev/null http://localhost:80/`
- If using non-root user, ensure `wget` is available in the container (Alpine includes it)

### Assets returning 404 (JS/CSS not loading)
- Check Vite build succeeded in Docker logs
- Verify `nginx.conf` `root` = `/usr/share/nginx/html`
- Check the `dist` directory exists in the container

### HTTP redirect loop
- Only enable **Force HTTPS** in Coolify domain settings
- Remove any conflicting HSTS or redirect rules elsewhere

---

## ⚡ 10. Production Improvements (Recommended)

### Immediate (before launch)
1. **Rotate secrets** — If `backend/.env` was ever shared or committed, regenerate ALL keys
2. **Strong JWT secret** — `openssl rand -hex 64` → use as `JWT_SECRET`
3. **Dedicated MongoDB user** — Create a MongoDB user with readWrite on only this database

### Performance
4. **CDN for static assets** — Cloudflare or Bunny CDN in front of Coolify
5. **MongoDB indexes** — Ensure all frequently queried fields are indexed

### Monitoring
6. **Logging** — Add `pino` or `winston` instead of `console.log`
7. **Uptime monitoring** — Use Coolify built-in or set up UptimeRobot / BetterStack

### Security Hardening
8. **Fail2Ban on Coolify host** — Blocks brute force SSH attacks
9. **Coolify auto-updates** — Enable in Coolify settings
10. **Docker image scanning** — `docker scout` or Trivy for vulnerability scanning

---

## 📁 11. Deployment Files Reference

| File | Purpose |
|------|---------|
| `frontend/Dockerfile` | Multi-stage build: Node.js 22 build → nginx 1.27-alpine serve |
| `frontend/nginx.conf` | SPA routing, API proxy, security headers, caching |
| `frontend/.dockerignore` | Excludes dev files from Docker context |
| `frontend/.env.example` | Example frontend env vars |
| `frontend/.npmrc` | Safe npm install settings for Docker builds |
| `backend/Dockerfile` | Multi-stage: Node.js 22 build → production deps, dumb-init, non-root |
| `backend/.dockerignore` | Excludes dev files from Docker context |
| `backend/.env.example` | Example backend env vars |
| `backend/.npmrc` | Safe npm install settings for Docker builds |
| `docker-compose.yaml` | Production: both services, health checks, resource limits (Node.js 22) |
| `docker-compose.coolify.yaml` | Coolify-specific: same config, optimized for auto-deploy |
| `.dockerignore` | Root dockerignore |
| `.env.example` | Root env template for Coolify |
| `COOLIFY_DEPLOYMENT.md` | This document |
| `backend/.dockerignore` | Excludes dev files from Docker context |
| `backend/.env.example` | Example backend env vars |
| `docker-compose.yml` | Orchestrates both services with health checks & resource limits |
| `.dockerignore` | Root dockerignore |
| `COOLIFY_DEPLOYMENT.md` | This document |

---

## 🏃 12. Quick Start (30 seconds)

```
1. Coolify → New Resource → Docker Compose
2. Repo: ziprojectbd/zipremiumservices
3. Base Dir: /
4. Add env vars (minimum: MONGODB_URI + JWT_SECRET + CLIENT_URL)
5. Domain: app.yourdomain.com (port 80)
6. Deploy ✅
```
