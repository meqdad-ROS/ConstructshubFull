# ConstructsHub (BanahBuild) — Local Development & Physical Testing Guide

This guide provides complete, step-by-step instructions to run the full **ConstructsHub** ecosystem locally on **Ubuntu (Linux)**, **Windows**, and test it physically on a **mobile phone (Android / iOS)**.

---

## 1. System Architecture Overview

The system consists of three main components:
1. **Web App & Backend API (`waquor/`)**: Next.js 15 (Turbopack), React 19, NextAuth.js, and Prisma ORM.
2. **Database**: PostgreSQL 16 with the mandatory `pg_trgm` extension (used for fuzzy search, Arabic matching, and autocomplete).
3. **Mobile App (`mobile/`)**: React Native with Expo Router, connecting to the `waquor` backend via JWT.
4. **BIM Service (`services/bim/`)** *(Optional)*: FastAPI + IfcOpenShell for `.ifc` architectural file parsing. If omitted, the web app automatically falls back to an integrated text parser.

---

## 2. Prerequisites & Installation

### Tooling Requirements

| Tool | Recommended Version | Verification Command |
|---|---|---|
| **Node.js** | `20.x` or `22.x` (LTS) | `node -v` |
| **pnpm** (or npm) | `10.x` (pnpm) / `10.x` (npm) | `pnpm -v` or `npm -v` |
| **Docker & Docker Compose** | Docker 24+ / Compose v2+ | `docker --version` |
| **Git** | Recent version | `git --version` |
| **Expo Go App** | Latest (from App Store / Google Play) | Installed on physical mobile phone |

---

## 3. Database Setup (PostgreSQL with `pg_trgm`)

ConstructsHub requires PostgreSQL 16 with the `pg_trgm` extension. The easiest way to run it is via Docker:

### Step 3.1: Start the Database Container
Run the following command in your terminal (works on both Linux and Windows):

```bash
docker run -d --name banabuild-pg \
  -e POSTGRES_USER=banabuild \
  -e POSTGRES_PASSWORD=banabuild_dev_pass \
  -e POSTGRES_DB=banabuild_db \
  -p 5433:5432 \
  postgres:16
```
*(Note: This binds PostgreSQL container port 5432 to host port **5433** to prevent conflicts with any existing local PostgreSQL instances.)*

### Step 3.2: Enable the `pg_trgm` Extension
```bash
docker exec -i banabuild-pg psql -U banabuild -d banabuild_db -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
```

---

## 4. Ubuntu / Linux Local Setup (Step-by-Step)

### Step 4.1: Clone and Navigate to Web Directory
```bash
cd ~/My-Projects/Construct-Hub_Project/waquor
```

### Step 4.2: Install Dependencies
```bash
pnpm install
# (or: npm install)
```

### Step 4.3: Configure Environment Variables (`.env`)
Create `.env` from `.env.example`:
```bash
cp .env.example .env
```

Generate secure random secrets:
```bash
NEXTAUTH_SECRET_VAL=$(openssl rand -base64 32)
FIELD_ENC_KEY_VAL=$(openssl rand -base64 32)
EVIDENCE_KEY_VAL=$(openssl rand -base64 32)
MOCK_KEY_VAL=$(openssl rand -hex 32)
```

Ensure your `waquor/.env` has these core entries:
```ini
NODE_ENV=development
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"

DATABASE_URL="postgresql://banabuild:banabuild_dev_pass@localhost:5433/banabuild_db?schema=public"

NEXTAUTH_SECRET="<paste NEXTAUTH_SECRET_VAL here>"
FIELD_ENC_KEY="<paste FIELD_ENC_KEY_VAL here>"
EVIDENCE_SIGNING_KEY="<paste EVIDENCE_KEY_VAL here>"
MOCK_PAYMENT_SIGNING_KEY="<paste MOCK_KEY_VAL here>"

ALLOWED_ORIGINS="http://localhost:3000,http://127.0.0.1:3000"
PAYMENT_DEFAULT_GATEWAY=MOCK
ALLOW_MOCK_PAYMENTS_IN_PROD=0
SEARCH_ENGINE=postgres
```

### Step 4.4: Prepare Database Schema & Seed Data
```bash
# 1. Generate Prisma Client
npx prisma generate

# 2. Synchronize schema to the database
npx prisma db push

# 3. Apply custom trigram search indexes
docker exec -i banabuild-pg psql -U banabuild -d banabuild_db < prisma/migrations/20260401000000_search_indexes/migration.sql

# 4. Seed the database with demo accounts & products
pnpm run db:seed
```

### Step 4.5: Start the Development Server
```bash
pnpm dev
# or: npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## 5. Windows Local Setup (Step-by-Step)

Follow these steps in **PowerShell** (run as Administrator if needed):

### Step 5.1: Prerequisites for Windows
- Ensure **Docker Desktop** is installed and running with the WSL2 backend enabled.
- Ensure **Node.js (v20+)** and **pnpm** are installed.

### Step 5.2: Navigate and Install Dependencies
```powershell
cd C:\path\to\Construct-Hub_Project\waquor
pnpm install
```

### Step 5.3: Setup Database in Docker Desktop
```powershell
docker run -d --name banabuild-pg `
  -e POSTGRES_USER=banabuild `
  -e POSTGRES_PASSWORD=banabuild_dev_pass `
  -e POSTGRES_DB=banabuild_db `
  -p 5433:5432 `
  postgres:16

docker exec -i banabuild-pg psql -U banabuild -d banabuild_db -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
```

### Step 5.4: Generate Secrets and Configure `.env`
In PowerShell, copy the example environment file:
```powershell
Copy-Item .env.example .env
```

Generate 32-byte keys easily using Node.js directly from PowerShell:
```powershell
node -e "console.log('NEXTAUTH_SECRET=' + require('crypto').randomBytes(32).toString('base64'))"
node -e "console.log('FIELD_ENC_KEY=' + require('crypto').randomBytes(32).toString('base64'))"
node -e "console.log('MOCK_PAYMENT_SIGNING_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
```
Open `.env` in Notepad or VS Code, paste these generated values, and configure `DATABASE_URL`:
```ini
DATABASE_URL="postgresql://banabuild:banabuild_dev_pass@localhost:5433/banabuild_db?schema=public"
```

### Step 5.5: Run Schema Sync & Seed
```powershell
npx prisma generate
npx prisma db push
Get-Content prisma\migrations\20260401000000_search_indexes\migration.sql | docker exec -i banabuild-pg psql -U banabuild -d banabuild_db
pnpm run db:seed
```

### Step 5.6: Launch Web App
```powershell
pnpm dev
```
Visit **`http://localhost:3000`**.

---

## 6. Testing on a Physical Mobile Phone (Android & iOS)

To test the mobile app on a physical device, your phone needs to connect to the backend running on your computer.

### Step 6.1: Ensure Same Wi-Fi Network
Your computer (Ubuntu/Windows) and your physical mobile phone **must be connected to the exact same Wi-Fi network**.

### Step 6.2: Find Your Computer's LAN IP Address
- **On Ubuntu/Linux**:
  ```bash
  hostname -I | awk '{print $1}'
  # Example output: 192.168.100.34
  ```
- **On Windows (PowerShell)**:
  ```powershell
  Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi*" | Select-Object -ExpandProperty IPAddress
  # Or run: ipconfig
  ```

Let us assume your computer's LAN IP is `192.168.100.34`.

### Step 6.3: Configure Web Backend for Mobile Access
1. In `waquor/.env`, update `ALLOWED_ORIGINS` to permit the phone's origin:
   ```ini
   ALLOWED_ORIGINS="http://localhost:3000,http://192.168.100.34:3000"
   ```
2. Start the Next.js dev server listening on all network interfaces:
   ```bash
   pnpm dev -H 0.0.0.0
   ```
   *(Next.js will show: `- Network: http://192.168.100.34:3000`)*

### Step 6.4: Adjust Local Firewall
- **On Ubuntu**:
  Allow inbound traffic on port 3000:
  ```bash
  sudo ufw allow 3000/tcp
  ```
- **On Windows**:
  Ensure Windows Defender Firewall allows Node.js through Private networks when prompted. Alternatively:
  ```powershell
  New-NetFirewallRule -DisplayName "ConstructsHub Web" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
  ```

### Step 6.5: Verify Network Connection from Phone
Open the browser (Chrome / Safari) on your **physical phone** and visit:
```text
http://192.168.100.34:3000/api/health
```
You should see:
```json
{"status":"ok","timestamp":"2026-..."}
```
If this page loads, your phone can communicate with the backend.

### Step 6.6: Configure and Run the Mobile App
1. Open a new terminal and navigate to `mobile/`:
   ```bash
   cd ../mobile
   npm install
   ```

2. Point the mobile app to your computer's LAN IP:
   Open `mobile/app.json` and update `extra.apiBaseUrl`:
   ```json
   "extra": {
     "apiBaseUrl": "http://192.168.100.34:3000",
     "eas": { ... }
   }
   ```

3. Start Expo:
   ```bash
   npx expo start
   ```

### Step 6.7: Open on Physical Phone
1. Install **Expo Go** from:
   - **Android**: Google Play Store ("Expo Go")
   - **iOS**: Apple App Store ("Expo Go")
2. Scan the QR code displayed in your terminal:
   - **Android**: Open the **Expo Go** app and tap **"Scan QR code"**.
   - **iOS**: Open the native **Camera** app, point at the QR code, and tap the notification banner to open in Expo Go.
3. The app bundle will download and open on your phone.

> [!TIP]
> **If your Wi-Fi router blocks device-to-device traffic (Access Point / Client Isolation):**
> Run Expo with tunnel mode:
> ```bash
> npx expo start --tunnel
> ```
> And for the backend, you can expose port 3000 temporarily using cloudflare tunnel (`cloudflared tunnel --url http://localhost:3000`) or ngrok, and set `apiBaseUrl` in `app.json` to the tunnel URL.

---

## 7. Optional: Run BIM Service (`services/bim/`)

The BIM service is a microservice that parses `.ifc` CAD/BIM building models with IfcOpenShell.

### Option A: Using Docker (Recommended)
```bash
cd services/bim
export BIM_SERVICE_TOKEN=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
docker compose up --build -d
```
In `waquor/.env`, set:
```ini
BIM_SERVICE_URL="http://localhost:8081"
BIM_SERVICE_TOKEN="<paste BIM_SERVICE_TOKEN here>"
```

### Option B: Without BIM Service
If you do not run this service, no action is needed. The platform automatically uses the built-in fallback parser (`X-IFC-Parser: text-fallback`).

---

## 8. Seeded Demo Accounts Reference

After running `pnpm run db:seed`, sign in at `http://localhost:3000` or on the mobile app:

| Email | Password | Role | Description |
|---|---|---|---|
| `admin@demo.com` | `Admin1234!` | Platform Administrator | Full platform access, admin console, audit logs |
| `owner@demo.com` | `Demo1234!` | Project / Fleet Owner | Creates projects, manages organisations, tenders |
| `contractor@demo.com` | `Demo1234!` | Contractor | Bids on tenders, submits milestones |
| `consultant@demo.com` | `Demo1234!` | Consultant Firm | Engineering supervision, approvals |
| `supplier@demo.com` | `Demo1234!` | Merchant / Supplier | Sells construction materials, equipment catalog |
| `worker@demo.com` | `Demo1234!` | Skilled Worker | Jobs feed, attendance geofence, shifts |
| `driver@demo.com` | `Demo1234!` | Vehicle Driver | Fleet trips, transport orders |
| `casual@demo.com` | `Demo1234!` | Normal User | General retail marketplace customer |

---

## 9. Troubleshooting & Common Issues

- **Slug conflict (`'id' !== 'orgId'`):**
  If encountered, ensure all dynamic routes under `src/app/api/organisations/` use `[id]` consistently. Delete `.next` directory (`rm -rf .next`) to clear stale Next.js cache.
- **Port 5432 in use:**
  The instructions above map PostgreSQL to port **5433** (`-p 5433:5432`). Ensure `DATABASE_URL` uses port `5433`.
- **Phone cannot reach backend (`Network request failed`):**
  1. Verify both devices are on the same Wi-Fi.
  2. Verify firewall allows port 3000 (`sudo ufw allow 3000`).
  3. Ensure Next.js was started with `-H 0.0.0.0`.
  4. Ensure `mobile/app.json` has `extra.apiBaseUrl` set to `http://<LAN_IP>:3000` (never `localhost`).
- **Prisma Client out of sync:**
  Run `npx prisma generate` whenever the schema is changed.
