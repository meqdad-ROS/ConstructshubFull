# ConstructsHub (BanahBuild) — Remote Deployment & Testing Guide

This guide covers how to publish, configure, secure, and remotely test the **ConstructsHub** ecosystem (Web App, Database, Background Services, and Mobile App) on production or staging servers.

---

## 1. Remote Architecture Overview

```
                      +-----------------------------+
                      |      Custom Domain / DNS    |
                      |    (e.g., constructhub.sa)  |
                      +--------------+--------------+
                                     |
                                     v
                 +---------------------------------------+
                 |    Reverse Proxy / Load Balancer      |
                 |   (Nginx / Caddy / Cloudflare SSL)    |
                 +-------------------+-------------------+
                                     |
             +-----------------------+-----------------------+
             |                                               |
             v                                               v
+-------------------------+                     +-------------------------+
|  Next.js 15 Standalone  |                     |  BIM IfcOpenShell Pod   |
|   (Waquor Web & API)    |                     |   (services/bim:8081)   |
|       Port 3000         |                     +-------------------------+
+------------+------------+
             |
             +-----------------------+-----------------------+
             |                       |                       |
             v                       v                       v
+-------------------------+ +-----------------+ +-------------------------+
| Cloud PostgreSQL 16+    | | S3 / R2 Bucket  | |  External Gateways      |
| (with pg_trgm extension)| |(Dispute Files)  | |  (Moyasar, ZATCA, FCM)  |
+-------------------------+ +-----------------+ +-------------------------+
             ^
             | Remote REST / JWT
+------------+------------+
|  Expo Mobile App (App)  | (Android APK/AAB & iOS IPA)
+-------------------------+
```

---

## 2. Pre-Deployment: Production Environment & Secrets

### Step 2.1: Generate Cryptographic Secrets
Run these commands on a secure terminal to generate random 32-byte production secrets:

```bash
# NextAuth Session Secret (32-byte Base64)
openssl rand -base64 32

# Field-Level Encryption Secret (32-byte Base64 - NFR-SEC-02)
openssl rand -base64 32

# Dispute Evidence Signing Key (32-byte Base64)
openssl rand -base64 32

# BIM Service Shared Token (32-byte Hex)
openssl rand -hex 32
```

### Step 2.2: Production Environment Variables Reference

| Variable | Example Value | Description |
|---|---|---|
| `NODE_ENV` | `production` | Enables Next.js production optimisations and secure cookies. |
| `NEXT_PUBLIC_APP_URL` | `https://app.constructhub.sa` | Public canonical URL. |
| `NEXTAUTH_URL` | `https://app.constructhub.sa` | Base URL used by NextAuth authentication callbacks. |
| `NEXTAUTH_SECRET` | `<32-byte-base64>` | Key used to sign and encrypt JWT session cookies. |
| `DATABASE_URL` | `postgresql://user:pass@host:5432/db?sslmode=require` | Managed PostgreSQL connection string with SSL. |
| `FIELD_ENC_KEY` | `<32-byte-base64>` | AES key used to encrypt sensitive database fields. |
| `EVIDENCE_SIGNING_KEY` | `<32-byte-base64>` | Key for signed time-limited dispute file URLs. |
| `ALLOWED_ORIGINS` | `https://app.constructhub.sa` | Origins permitted for cross-origin requests. |
| `ALLOW_MOCK_PAYMENTS_IN_PROD` | `0` | Must be `0` in production. |
| `PAYMENT_DEFAULT_GATEWAY` | `MOYASAR` | Live gateway for Saudi Arabia (`MOYASAR` or `STRIPE`). |
| `MOYASAR_SECRET_KEY` | `sk_live_...` | Live Moyasar API key. |
| `MOYASAR_WEBHOOK_SECRET` | `sec_...` | Moyasar shared webhook secret. |
| `DISPUTE_STORAGE_BACKEND` | `s3` | S3-compatible backend (`s3` in production). |
| `S3_ENDPOINT` | `https://s3.me-south-1.amazonaws.com` | S3 or Cloudflare R2 endpoint. |
| `S3_BUCKET` | `constructhub-evidence` | Production evidence storage bucket. |
| `S3_ACCESS_KEY_ID` | `AKIA...` | S3 Access Key. |
| `S3_SECRET_ACCESS_KEY` | `...` | S3 Secret Key. |

---

## 3. Remote Database Provisioning (Managed PostgreSQL)

The database must be PostgreSQL 16+ with the `pg_trgm` extension enabled.

1. **Create Managed Database** on your cloud provider (e.g., AWS RDS, Supabase, Neon, or DigitalOcean Managed Databases).
2. **Enable `pg_trgm`**: Connect using `psql` as administrator:
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_trgm;
   ```
3. **Execute Migrations**:
   Run database migrations from your release pipeline or staging machine:
   ```bash
   cd waquor
   DATABASE_URL="postgresql://user:password@host:5432/db?sslmode=require" npx prisma db push
   
   # Apply trigram search indexes
   psql "postgresql://user:password@host:5432/db?sslmode=require" < prisma/migrations/20260401000000_search_indexes/migration.sql
   ```

---

## 4. Deployment Methods

### Method A: Single-Host VPS Deployment (Ubuntu 22.04 / 24.04 via Docker)

This method uses the repository's `docker-compose.production.yml` with Caddy or Nginx for automated SSL.

#### 1. Setup the Server
```bash
# Update server
sudo apt update && sudo apt upgrade -y

# Install Docker & Compose plugin
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
```

#### 2. Clone Repository & Setup Environment
```bash
git clone https://github.com/your-org/Construct-Hub_Project.git /opt/constructhub
cd /opt/constructhub

# Create production environment file
cat <<EOF > .env.production
NODE_ENV=production
POSTGRES_USER=constructhub
POSTGRES_PASSWORD=$(openssl rand -hex 16)
POSTGRES_DB=constructhub
NEXTAUTH_SECRET=$(openssl rand -base64 32)
FIELD_ENC_KEY=$(openssl rand -base64 32)
EVIDENCE_SIGNING_KEY=$(openssl rand -base64 32)
BIM_SERVICE_TOKEN=$(openssl rand -hex 32)
NEXT_PUBLIC_APP_URL=https://app.yourdomain.com
NEXTAUTH_URL=https://app.yourdomain.com
ALLOWED_ORIGINS=https://app.yourdomain.com
PAYMENT_DEFAULT_GATEWAY=MOYASAR
ALLOW_MOCK_PAYMENTS_IN_PROD=0
EOF
```

#### 3. Start the Stack
```bash
docker compose -f docker-compose.production.yml --env-file .env.production up -d --build
```

#### 4. Configure Caddy with Automated SSL (Reverse Proxy)
Install Caddy:
```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLF 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLF 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy -y
```

Configure `/etc/caddy/Caddyfile`:
```caddy
app.yourdomain.com {
    reverse_proxy 127.0.0.1:3000 {
        header_up X-Forwarded-Proto https
    }
}
```
Reload Caddy:
```bash
sudo systemctl reload caddy
```
Caddy will automatically acquire and renew a Let's Encrypt SSL certificate.

---

### Method B: Kubernetes Deployment (K8s Staging/Prod)

The repository provides pre-configured Kubernetes manifests under `deploy/k8s/staging/`:

```bash
cd deploy/k8s/staging

# 1. Create namespace
kubectl apply -f 00-namespace.yaml

# 2. Deploy production secrets (populated from Vault / AWS Secrets Manager)
kubectl apply -f 10-secrets.yaml

# 3. Run Pre-Deployment Migration Job
kubectl apply -f 20-migration-job.yaml
kubectl -n constructhub-staging wait --for=condition=complete job/waquor-migrate --timeout=5m

# 4. Roll out Web App Deployment & Horizontal Pod Autoscaler
kubectl apply -f 30-waquor-deployment.yaml
kubectl apply -f 40-waquor-service.yaml
kubectl apply -f 50-waquor-hpa.yaml

# 5. Deploy BIM Parser Sandbox & Cron Jobs
kubectl apply -f 60-bim-deployment.yaml
kubectl apply -f 70-cronjobs.yaml
```

---

## 5. Publishing the Mobile App (Expo / EAS)

The mobile app (`mobile/`) connects to your remote production API over HTTPS.

### Step 5.1: Configure Remote API URL
In `mobile/app.json`:
```json
"extra": {
  "apiBaseUrl": "https://app.yourdomain.com",
  "eas": {
    "projectId": "<your-eas-project-id>"
  }
}
```

### Step 5.2: Install and Login to EAS CLI
```bash
npm install -g eas-cli
eas login
```

### Step 5.3: Build for Testing & Production

#### 1. Android Preview APK (for direct device installation without Play Store):
```bash
cd mobile
eas build -p android --profile preview
```
Once the build completes, download the `.apk` link on your physical phone to test.

#### 2. Android Play Store Bundle (AAB):
```bash
eas build -p android --profile production
```

#### 3. iOS TestFlight Build:
```bash
eas build -p ios --profile production
eas submit -p ios
```

---

## 6. Remote Testing & Verification Plan

Run these verification tests after publishing:

### Test 1: Service Health Check
Verify the server responds with HTTP 200:
```bash
curl -fsS -I https://app.yourdomain.com/api/health
```
Expected output:
```text
HTTP/2 200
content-type: application/json; charset=utf-8
```

### Test 2: HTTPS & Cookie Security Check
Verify that cookies are issued with `Secure; HttpOnly; SameSite=Lax`:
```bash
curl -i https://app.yourdomain.com/login | grep -i set-cookie
```
Confirm that `Secure` flag is present on all production session cookies.

### Test 3: Remote Mobile API Authentication Check
Verify the mobile JSON login endpoint works over HTTPS:
```bash
curl -X POST https://app.yourdomain.com/api/auth/mobile \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"YourAdminPassword!"}'
```
Expected output:
```json
{
  "token": "eyJhbGciOi...",
  "user": {
    "id": "...",
    "email": "admin@demo.com",
    "role": "USR_ADMIN"
  }
}
```

### Test 4: Search Engine & Database Trigrams
Verify that product and supplier search operates with Arabic & English fuzzy search:
```bash
curl -fsS "https://app.yourdomain.com/api/search?q=cement"
```

### Test 5: Payment Gateway Webhook Verification
Test that your payment provider's webhook endpoint rejects unsigned payloads (HTTP 400 or 401) and accepts signed ones:
```bash
curl -i -X POST https://app.yourdomain.com/api/webhooks/moyasar \
  -H "Content-Type: application/json" \
  -d '{"id":"test"}'
```
Expected output: `400 Bad Request` or `401 Unauthorized` (confirming signature verification is active).

### Test 6: Physical Mobile Remote Test
1. Disconnect your mobile phone from local Wi-Fi and switch to **Cellular Data (4G/5G)**.
2. Open the mobile app (or browse to `https://app.yourdomain.com` in mobile browser).
3. Log in with an account.
4. Verify marketplace products load, search works, and order placement succeeds.

---

## 7. Zero-Downtime Rollback Strategy

If an issue occurs after a release:
- **Kubernetes**:
  ```bash
  kubectl -n constructhub-staging rollout undo deploy/waquor
  ```
- **Docker Compose**:
  Update your image tag in `.env.production` and run:
  ```bash
  docker compose -f docker-compose.production.yml up -d
  ```
- **Database Schema**:
  Always use **expand-contract** backward-compatible migrations. Never execute destructive schema migrations without a transition window.
