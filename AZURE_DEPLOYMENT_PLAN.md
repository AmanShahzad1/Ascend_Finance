# AscenD Finance — Azure Deployment Implementation Plan

**Project:** AscenD Finance (Next.js 15, PostgreSQL)
**Target:** Azure App Service (Free F1 → Standard S1 for slots)
**CI/CD:** GitHub Actions
**Database:** Azure Database for PostgreSQL Flexible Server (Free 12-month tier)

---

## Progress Tracker

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Prerequisites & Local Setup | ✅ Complete |
| 2 | Azure Resource Group | ✅ Complete |
| 3 | Azure Database for PostgreSQL | ✅ Complete |
| 4 | Code Updates for Azure | ⬜ Pending |
| 5 | Azure App Service Setup | ⬜ Pending |
| 6 | GitHub Actions CI/CD Pipeline | ⬜ Pending |
| 7 | Deployment Slots (Staging → Production Swap) | ⬜ Pending |
| 8 | Write-up — Elastic Beanstalk vs Azure App Service | ⬜ Pending |

---

## Phase 1: Prerequisites & Local Setup

**Goal:** Get all tools installed and authenticated before touching Azure.

### Step 1.1 — Install Azure CLI
- Download via winget (already completed):
```powershell
winget install --id Microsoft.AzureCLI --silent --accept-package-agreements --accept-source-agreements
```
- Installed at: `C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin\`
- Version: **2.87.0** ✅

### Step 1.2 — Login to Azure
```powershell
az login
# or if PATH not refreshed yet:
az.cmd login
```
A browser window opens — sign in with your Azure free trial account.

### Step 1.3 — Confirm Active Subscription
```powershell
az account show
```
Note your subscription `id` — needed for resource creation.

---

## Phase 2: Azure Resource Group

**Goal:** Create a logical container for all project resources.

### Step 2.1 — Create Resource Group
```powershell
az group create --name ascend-finance-rg --location eastus
```
> All resources (database, app service, web app) will live inside `ascend-finance-rg`.

---

## Phase 3: Azure Database for PostgreSQL

**Goal:** Provision a free-tier cloud PostgreSQL database and initialize it with the app schema.

> **Cost:** Burstable B1ms is included FREE for 12 months in Azure free account.

### Step 3.1 — Create PostgreSQL Flexible Server (Azure Portal)
- Navigate to **Azure Database for PostgreSQL → Create → Flexible Server**
- **Resource Group:** `ascend-finance-rg`
- **Server name:** `ascend-finance-db` (must be globally unique — add initials if needed)
- **Region:** East US
- **PostgreSQL version:** 16
- **Workload type:** Development (selects Burstable B1ms — free tier)
- **Admin username:** `ascendadmin`
- **Password:** Choose a strong password — save it securely

### Step 3.2 — Configure Firewall
- Go to server → **Networking**
- Enable **"Allow public access from any Azure service"**
- Click **"Add current client IP address"**
- Save

### Step 3.3 — Create the Database
```powershell
az postgres flexible-server db create `
  --resource-group ascend-finance-rg `
  --server-name ascend-finance-db `
  --database-name ascend_finance
```

### Step 3.4 — Update Local `.env.local`
```env
DATABASE_URL=postgresql://ascendadmin:YOUR_PASSWORD@ascend-finance-db.postgres.database.azure.com:5432/ascend_finance?sslmode=require
```

### Step 3.5 — Initialize the Database Schema
```powershell
npm run init-db
```

### Step 3.6 — Verify Connection
```powershell
npm run test-db
```

---

## Phase 4: Code Updates for Azure

**Goal:** Modify the app to be Azure-compatible before deploying.

### Step 4.1 — Enable Standalone Output in `next.config.ts`
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
```

### Step 4.2 — Test the Build Locally
```powershell
npm run build
```
Confirm `.next/standalone` folder is generated.

### Step 4.3 — Commit and Push
```powershell
git add next.config.ts
git commit -m "Add standalone output for Azure App Service deployment"
git push origin production
```

---

## Phase 5: Azure App Service Setup

**Goal:** Create the App Service Plan and Web App on Azure.

> **Cost:** F1 tier is completely FREE.

### Step 5.1 — Create App Service Plan (Free F1)
```powershell
az appservice plan create `
  --name ascend-finance-plan `
  --resource-group ascend-finance-rg `
  --sku F1 `
  --is-linux
```

### Step 5.2 — Create the Web App
```powershell
az webapp create `
  --resource-group ascend-finance-rg `
  --plan ascend-finance-plan `
  --name ascend-finance-app `
  --runtime "NODE:22-lts"
```
> App URL will be: `https://ascend-finance-app.azurewebsites.net`

### Step 5.3 — Set the Startup Command
```powershell
az webapp config set `
  --resource-group ascend-finance-rg `
  --name ascend-finance-app `
  --startup-file "node server.js"
```

### Step 5.4 — Configure Environment Variables (App Settings)
```powershell
az webapp config appsettings set `
  --resource-group ascend-finance-rg `
  --name ascend-finance-app `
  --settings `
    DATABASE_URL="postgresql://ascendadmin:YOUR_PASSWORD@ascend-finance-db.postgres.database.azure.com:5432/ascend_finance?sslmode=require" `
    JWT_SECRET="your-super-secret-jwt-key-minimum-32-chars" `
    JWT_EXPIRES_IN="7d" `
    NEXTAUTH_URL="https://ascend-finance-app.azurewebsites.net" `
    NEXTAUTH_SECRET="your-nextauth-secret-key" `
    EMAIL_USER="your-gmail@gmail.com" `
    EMAIL_APP_PASSWORD="your-gmail-app-password" `
    NODE_ENV="production" `
    HOSTNAME="0.0.0.0"
```

---

## Phase 6: GitHub Actions CI/CD Pipeline

**Goal:** Connect GitHub to Azure so every push to `production` triggers an automatic deploy.

### Step 6.1 — Get the Publish Profile
- Azure Portal → Web App (`ascend-finance-app`) → **"Download publish profile"**
- Save the downloaded `.PublishSettings` file

### Step 6.2 — Add Publish Profile as GitHub Secret
- GitHub repo → **Settings → Secrets and variables → Actions**
- Click **"New repository secret"**
- Name: `AZURE_WEBAPP_PUBLISH_PROFILE`
- Value: paste entire contents of the publish profile file

### Step 6.3 — Create GitHub Actions Workflow
Create `.github/workflows/azure-deploy.yml`:

```yaml
name: Deploy AscenD Finance to Azure App Service

on:
  push:
    branches:
      - production
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22.x'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build Next.js app
        run: npm run build

      - name: Copy static assets into standalone output
        run: |
          cp -r .next/static .next/standalone/.next/static
          cp -r public .next/standalone/public

      - name: Zip standalone output for deployment
        run: |
          cd .next/standalone
          zip -r ../../release.zip .

      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: node-app
          path: release.zip

  deploy:
    runs-on: ubuntu-latest
    needs: build
    environment:
      name: Production
      url: ${{ steps.deploy.outputs.webapp-url }}

    steps:
      - name: Download build artifact
        uses: actions/download-artifact@v4
        with:
          name: node-app

      - name: Deploy to Azure Web App
        id: deploy
        uses: azure/webapps-deploy@v3
        with:
          app-name: 'ascend-finance-app'
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: release.zip
          startup-command: 'node server.js'
```

### Step 6.4 — Commit and Push to Trigger First Deployment
```powershell
git add .github/workflows/azure-deploy.yml
git commit -m "Add GitHub Actions workflow for Azure deployment"
git push origin production
```

### Step 6.5 — Monitor the Deployment
- GitHub repo → **Actions** tab
- Watch build and deploy jobs complete

### Step 6.6 — Verify the Live App
```
https://ascend-finance-app.azurewebsites.net
```

---

## Phase 7: Deployment Slots (Staging → Production Swap)

**Goal:** Create a staging environment and perform a production swap.

> **Cost:** S1 tier costs ~$0.10/hour. Scale back to F1 after completing this phase.

### Step 7.1 — Scale Up to Standard S1
```powershell
az appservice plan update `
  --name ascend-finance-plan `
  --resource-group ascend-finance-rg `
  --sku S1
```

### Step 7.2 — Create the Staging Slot
```powershell
az webapp deployment slot create `
  --name ascend-finance-app `
  --resource-group ascend-finance-rg `
  --slot staging
```

### Step 7.3 — Configure Staging Slot App Settings
```powershell
az webapp config appsettings set `
  --resource-group ascend-finance-rg `
  --name ascend-finance-app `
  --slot staging `
  --settings `
    DATABASE_URL="postgresql://ascendadmin:YOUR_PASSWORD@ascend-finance-db.postgres.database.azure.com:5432/ascend_finance?sslmode=require" `
    JWT_SECRET="your-super-secret-jwt-key-minimum-32-chars" `
    JWT_EXPIRES_IN="7d" `
    NEXTAUTH_URL="https://ascend-finance-app-staging.azurewebsites.net" `
    NEXTAUTH_SECRET="your-nextauth-secret-key" `
    NODE_ENV="production" `
    HOSTNAME="0.0.0.0"
```

### Step 7.4 — Make a Visible Change and Deploy to Staging
Make a small UI change, commit and push, then deploy to staging slot:
```powershell
az webapp deployment source config-zip `
  --resource-group ascend-finance-rg `
  --name ascend-finance-app `
  --slot staging `
  --src release.zip
```

### Step 7.5 — Verify Staging Slot
```
https://ascend-finance-app-staging.azurewebsites.net
```
Confirm the change is visible on staging but NOT on production.

### Step 7.6 — Swap Staging → Production
```powershell
az webapp deployment slot swap `
  --resource-group ascend-finance-rg `
  --name ascend-finance-app `
  --slot staging `
  --target-slot production
```

### Step 7.7 — Verify Production Has the Change
```
https://ascend-finance-app.azurewebsites.net
```

### Step 7.8 — Scale Back to F1
```powershell
az appservice plan update `
  --name ascend-finance-plan `
  --resource-group ascend-finance-rg `
  --sku F1
```
> Note: Scaling back to F1 removes the staging slot (expected behaviour).

---

## Phase 8: Write-up — Elastic Beanstalk vs Azure App Service

**Goal:** Complete the comparison write-up once all deployment phases are done.

Topics to cover:
- Architecture and abstraction level
- Deployment mechanisms (EB CLI vs `az webapp`, GitHub Actions on both)
- Pricing models and free tiers
- Deployment slots vs EB environments/versions
- Configuration management (`.ebextensions` vs Application Settings)
- Platform support and runtime flexibility
- Monitoring and logging differences
- When to choose one over the other

---

## Key Reference Values

| Item | Value |
|------|-------|
| Resource Group | `ascend-finance-rg` |
| Location | `eastus` |
| App Service Plan | `ascend-finance-plan` |
| Web App Name | `ascend-finance-app` |
| App URL | `https://ascend-finance-app.azurewebsites.net` |
| Staging URL | `https://ascend-finance-app-staging.azurewebsites.net` |
| DB Server | `ascend-finance-db.postgres.database.azure.com` |
| DB Name | `ascend_finance` |
| DB Admin | `ascendadmin` |
| Node.js Runtime | `NODE:22-lts` |
| GitHub Secret | `AZURE_WEBAPP_PUBLISH_PROFILE` |
| Workflow File | `.github/workflows/azure-deploy.yml` |

---

## Cost Summary

| Resource | Tier | Cost |
|----------|------|------|
| App Service Plan (F1) | Free | $0.00 |
| Azure PostgreSQL Flexible Server (B1ms) | Free 12 months | $0.00 |
| App Service Plan (S1) for slots | Standard | ~$0.10/hour |
| **Total for this task** | | **< $1.00** |
