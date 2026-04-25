# Infrastructure Setup Guide

## Salesforce Consulting AI Framework

**Version:** 1.0 | **Date:** April 5, 2026 | **Phase:** Pre-Development

---

## Overview

This guide covers every manual step required to provision external services before GSD can execute Phase 1. Complete these steps in order — later services depend on earlier ones.

**Setup Order:**

| Step | Service | Purpose | Required For |
|------|---------|---------|--------------|
| 1 | Node.js & Tooling | Local development runtime | Everything |
| 2 | GitHub Repository | Source control | Everything |
| 3 | Neon | PostgreSQL database with pgvector | Phase 1+ |
| 4 | Clerk | Authentication & user management | Phase 1+ |
| 5 | Inngest | Background jobs & event processing | Phase 1+ |
| 6 | Anthropic | Claude AI API | Phase 2+ |
| 7 | Cloudflare R2 or AWS S3 | File/document storage | Phase 4+ |
| 8 | Vercel | Production hosting & deployment | Production |

**Time estimate:** ~60–90 minutes for all services.

---

## Step 1: Node.js & Local Tooling

### 1.1 Install Node.js

**Required version:** Node.js 20.x LTS (minimum 18.x)

1. Go to https://nodejs.org
2. Download the **LTS** version (20.x recommended)
3. Run the installer
4. Verify installation:

```bash
node --version    # Should show v20.x.x
npm --version     # Should show 9.x+ or 10.x+
```

### 1.2 Install pnpm (Recommended)

pnpm is faster and more disk-efficient than npm.

```bash
npm install -g pnpm
pnpm --version    # Should show 8.x+ or 9.x+
```

### 1.3 Install Git

If not already installed:

```bash
git --version     # Should show 2.x+
```

If missing, install from https://git-scm.com or via Homebrew: `brew install git`

### 1.4 Verify Complete

- [ ] `node --version` returns 18.x+
- [ ] `npm --version` or `pnpm --version` returns expected version
- [ ] `git --version` returns 2.x+

---

## Step 2: GitHub Repository

### 2.1 Create Repository (if not done)

1. Go to https://github.com/new
2. Repository name: `Salesforce-Consulting-SDLC-App` (or your preferred name)
3. Visibility: **Private** (contains proprietary business logic)
4. Do NOT initialize with README (we have an existing project)
5. Click **Create repository**

### 2.2 Connect Local Project

```bash
git remote add origin https://github.com/YOUR-USERNAME/Salesforce-Consulting-SDLC-App.git
git push -u origin main
```

### 2.3 Verify Complete

- [ ] Repository exists on GitHub
- [ ] Local repo is connected (`git remote -v` shows origin)
- [ ] `.gitignore` includes `.env`, `.env.local`, `node_modules/`, `.next/`

---

## Step 3: Neon (PostgreSQL Database)

Neon is a serverless PostgreSQL provider. It handles connection pooling for Vercel's serverless functions automatically.

### 3.1 Create Account

1. Go to https://neon.tech
2. Click **Sign Up** (GitHub OAuth recommended)
3. Select the **Free** plan (sufficient for V1 development)

### 3.2 Create Project

1. Click **New Project**
2. **Project name:** `salesforce-consulting-ai` (or your preference)
3. **PostgreSQL version:** Select **16** (required for pgvector compatibility)
4. **Region:** Choose the region closest to your users (e.g., `us-east-1` for US East)
5. **Compute size:** Leave default (0.25 CU on free tier)
6. Click **Create Project**

### 3.3 Enable pgvector Extension

pgvector is required for AI semantic search (Phase 2+). Enable it now to avoid migration issues later.

1. In the Neon Console, go to your project
2. Click **SQL Editor** in the left sidebar
3. Run this SQL:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

4. Verify it installed:

```sql
SELECT * FROM pg_extension WHERE extname = 'vector';
```

You should see one row returned.

### 3.4 Get Connection Strings

1. In the Neon Console, click **Connection Details** (right sidebar or Dashboard)
2. You need TWO connection strings:

**Pooled connection (for the app at runtime):**
- Select **Pooled** connection type
- Copy the connection string — this is your `DATABASE_URL`
- Format: `postgresql://user:password@ep-xxx-yyy-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require`

**Direct connection (for Prisma migrations):**
- Select **Direct** connection type
- Copy the connection string — this is your `DIRECT_URL`
- Format: `postgresql://user:password@ep-xxx-yyy.us-east-1.aws.neon.tech/neondb?sslmode=require`

### 3.5 Save Environment Variables

Add to your `.env.local` file (create it in the project root if it doesn't exist):

```env
DATABASE_URL=postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
DIRECT_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
```

**IMPORTANT:** Never commit `.env.local` to Git.

### 3.6 Verify Complete

- [ ] Neon account created
- [ ] Project created with PostgreSQL 16+
- [ ] pgvector extension enabled (ran `CREATE EXTENSION IF NOT EXISTS vector;`)
- [ ] Pooled connection string saved as `DATABASE_URL`
- [ ] Direct connection string saved as `DIRECT_URL`

---

## Step 4: Clerk (Authentication)

Clerk handles sign-up, sign-in, session management, and organization-based access.

### 4.1 Create Account

1. Go to https://clerk.com
2. Click **Get Started** / **Sign Up**
3. Create an account (GitHub OAuth recommended)

### 4.2 Create Application

1. In the Clerk Dashboard, click **Create application**
2. **Application name:** `Salesforce Consulting AI Framework`
3. **Sign-in options:** Enable at minimum:
   - Email address
   - Google (recommended for corporate accounts)
4. Click **Create application**

### 4.3 Enable Organizations Feature

Organizations are required for project-based team management and role assignments.

1. In Clerk Dashboard, go to **Configure** > **Organization settings**
2. Toggle **Enable organizations** to ON
3. Under **Creator role**, keep defaults

> **Note:** RBAC roles (SA, PM, BA, Developer, QA) are stored in our database's `ProjectMember` table, NOT in Clerk's organization roles. Clerk Organizations are used for grouping users into project teams.

### 4.4 Configure Redirect URLs

1. Go to **Configure** > **Paths**
2. Set the following (if configurable):
   - **Sign-in URL:** `/sign-in`
   - **Sign-up URL:** `/sign-up`
   - **After sign-in URL:** `/dashboard`
   - **After sign-up URL:** `/onboarding` (or `/dashboard`)

### 4.5 Get API Keys

1. In Clerk Dashboard, go to **Configure** > **API keys**
2. Copy two values:

| Key | Starts with | Where to use |
|-----|-------------|--------------|
| **Publishable key** | `pk_test_` | Frontend (safe to expose) |
| **Secret key** | `sk_test_` | Backend only (never expose) |

### 4.6 Save Environment Variables

Add to your `.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

### 4.7 Verify Complete

- [ ] Clerk account created
- [ ] Application created
- [ ] Organizations feature enabled
- [ ] Redirect URLs configured
- [ ] Publishable key saved as `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- [ ] Secret key saved as `CLERK_SECRET_KEY`
- [ ] Sign-in/sign-up URL env vars set

---

## Step 5: Inngest (Background Jobs)

Inngest handles event-driven background processing: transcript analysis, embedding generation, article refresh, notifications.

### 5.1 Create Account

1. Go to https://inngest.com
2. Click **Sign Up** (GitHub OAuth recommended)
3. Select the **Free** plan (sufficient for V1)

### 5.2 Create App

1. In the Inngest Dashboard, you'll see your default workspace
2. Note: For **local development**, Inngest works without API keys — it uses the Inngest Dev Server

### 5.3 Get API Keys (for Production)

1. In Inngest Dashboard, go to **Manage** > **Signing Key**
2. Copy the **Signing Key** — this is your `INNGEST_SIGNING_KEY`
3. Go to **Manage** > **Event Keys** > **Create Key**
4. Copy the **Event Key** — this is your `INNGEST_EVENT_KEY`

### 5.4 Local Development Setup

For local development, you'll use the Inngest Dev Server instead of the cloud service:

```bash
npx inngest-cli@latest dev
```

This starts a local dashboard at `http://localhost:8288` where you can see events and function executions. No API keys needed for local dev.

### 5.5 Save Environment Variables

Add to your `.env.local`:

```env
# Leave empty for local development (Inngest Dev Server handles it)
# Set these values for production deployment on Vercel
INNGEST_SIGNING_KEY=signkey-prod-xxxxxxxx
INNGEST_EVENT_KEY=xxxxxxxxxxxxxxxxxxxxxxxx
```

### 5.6 Verify Complete

- [ ] Inngest account created
- [ ] Signing key obtained (for production)
- [ ] Event key obtained (for production)
- [ ] `npx inngest-cli@latest dev` command tested locally

---

## Step 6: Anthropic (Claude AI API)

The Claude API powers transcript processing, question answering, knowledge synthesis, and the chat interface.

> **Note:** Not required for Phase 1 (foundation). Required starting Phase 2.

### 6.1 Create Account

1. Go to https://console.anthropic.com
2. Click **Sign Up**
3. Complete account verification

### 6.2 Set Up Billing

1. Go to **Settings** > **Billing**
2. Add a payment method
3. **Recommended:** Set a monthly usage limit (e.g., $50/month for development)
4. **Recommended:** Enable usage alerts at 50% and 80% of limit

### 6.3 Create API Key

1. Go to **Settings** > **API Keys**
2. Click **Create Key**
3. **Name:** `salesforce-consulting-ai-dev`
4. Copy the key immediately — it won't be shown again

### 6.4 Save Environment Variable

Add to your `.env.local`:

```env
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 6.5 Cost Reference

| Model | Input | Output | Best For |
|-------|-------|--------|----------|
| Claude Sonnet 4 | $3/1M tokens | $15/1M tokens | Complex analysis, document generation |
| Claude Haiku 3.5 | $0.80/1M tokens | $4/1M tokens | Simple tasks, classification, extraction |

### 6.6 Verify Complete

- [ ] Anthropic account created
- [ ] Billing configured with usage limits
- [ ] API key generated and saved as `ANTHROPIC_API_KEY`

---

## Step 7: Cloudflare R2 or AWS S3 (File Storage)

Stores generated documents, uploaded transcripts, and attachments.

> **Note:** Not strictly required until Phase 4. Set up now if you want, or defer.
>
> **Recommendation:** Use Cloudflare R2 — it's S3-compatible but has **zero egress fees**, saving significant cost.

### Option A: Cloudflare R2 (Recommended)

#### 7A.1 Create Cloudflare Account

1. Go to https://dash.cloudflare.com/sign-up
2. Create an account (no domain required for R2)

#### 7A.2 Enable R2

1. In Cloudflare Dashboard, click **R2 Object Storage** in the left sidebar
2. If prompted, verify your payment method (R2 has a generous free tier: 10 GB storage, 10 million reads/month)

#### 7A.3 Create Bucket

1. Click **Create bucket**
2. **Bucket name:** `salesforce-consulting-sdlc-dev`
3. **Location:** Automatic (or select preferred region)
4. Click **Create bucket**

#### 7A.4 Create API Token

1. Go to **R2** > **Manage R2 API Tokens** (or **Overview** > **Manage API Tokens**)
2. Click **Create API token**
3. **Token name:** `salesforce-consulting-ai-dev`
4. **Permissions:** Object Read & Write
5. **Bucket scope:** Specify your bucket (`salesforce-consulting-sdlc-dev`)
6. Click **Create API Token**
7. Copy the **Access Key ID** and **Secret Access Key** — save them immediately

#### 7A.5 Get Account ID

1. In the Cloudflare Dashboard, your **Account ID** is visible in the right sidebar on the R2 overview page
2. Your R2 endpoint will be: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`

#### 7A.6 Save Environment Variables

```env
AWS_ACCESS_KEY_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_S3_BUCKET=salesforce-consulting-sdlc-dev
AWS_S3_REGION=auto
AWS_S3_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
```

### Option B: AWS S3

#### 7B.1 Create AWS Account

1. Go to https://aws.amazon.com
2. Click **Create an AWS Account**
3. Complete account setup and billing verification

#### 7B.2 Create S3 Bucket

1. Go to **S3** in the AWS Console
2. Click **Create bucket**
3. **Bucket name:** `salesforce-consulting-sdlc-dev`
4. **Region:** `us-east-1` (or your preferred region)
5. **Block all public access:** Keep enabled (we use presigned URLs)
6. **Bucket versioning:** Enable
7. Click **Create bucket**

#### 7B.3 Create IAM User

1. Go to **IAM** > **Users** > **Create user**
2. **User name:** `salesforce-consulting-ai-s3`
3. **Access type:** Programmatic access only
4. Attach this inline policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::salesforce-consulting-sdlc-dev",
        "arn:aws:s3:::salesforce-consulting-sdlc-dev/*"
      ]
    }
  ]
}
```

5. Copy the **Access Key ID** and **Secret Access Key**

#### 7B.4 Save Environment Variables

```env
AWS_ACCESS_KEY_ID=AKIAxxxxxxxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_S3_BUCKET=salesforce-consulting-sdlc-dev
AWS_S3_REGION=us-east-1
```

### 7.7 Verify Complete

- [ ] Storage provider chosen (R2 recommended)
- [ ] Bucket created
- [ ] API credentials generated
- [ ] Environment variables saved

---

## Step 8: Vercel (Production Hosting)

Vercel provides serverless hosting optimized for Next.js.

> **Note:** Not needed for local development. Set up when ready to deploy.

### 8.1 Create Account

1. Go to https://vercel.com
2. Click **Sign Up** with GitHub (links your repos automatically)

### 8.2 Import Project

1. Click **Add New** > **Project**
2. Select your GitHub repository
3. Vercel auto-detects Next.js — confirm the settings:
   - **Framework:** Next.js
   - **Build Command:** `npm run build` (or `pnpm build`)
   - **Output Directory:** `.next` (default)

### 8.3 Configure Environment Variables

Before deploying, add ALL environment variables in Vercel:

1. Go to **Project Settings** > **Environment Variables**
2. Add each variable for the **Production** environment:

| Variable | Source |
|----------|--------|
| `DATABASE_URL` | Neon (pooled connection string) |
| `DIRECT_URL` | Neon (direct connection string) |
| `CLERK_SECRET_KEY` | Clerk Dashboard |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Dashboard |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
| `SF_TOKEN_ENCRYPTION_KEY` | Generate: `openssl rand -hex 32` |
| `INNGEST_SIGNING_KEY` | Inngest Dashboard |
| `INNGEST_EVENT_KEY` | Inngest Dashboard |
| `ANTHROPIC_API_KEY` | Anthropic Console |
| `AWS_ACCESS_KEY_ID` | R2 or S3 |
| `AWS_SECRET_ACCESS_KEY` | R2 or S3 |
| `AWS_S3_BUCKET` | Your bucket name |
| `AWS_S3_REGION` | `auto` (R2) or `us-east-1` (S3) |
| `AWS_S3_ENDPOINT` | R2 only: `https://ACCOUNT_ID.r2.cloudflarestorage.com` |

### 8.4 Connect Inngest to Vercel

1. In the Inngest Dashboard, go to **Integrations** > **Vercel**
2. Click **Connect to Vercel**
3. Authorize the integration
4. Select your Vercel project
5. Inngest will automatically set the signing key and event key

### 8.5 Configure Clerk Production Keys

When deploying to production, switch from test keys to production keys:

1. In Clerk Dashboard, go to **Configure** > **API Keys**
2. Switch to **Production** instance
3. Update the Publishable Key and Secret Key in Vercel's environment variables

### 8.6 Deploy

1. Push your code to GitHub
2. Vercel auto-deploys on push to `main`
3. Check the deployment logs for any build errors

### 8.7 Verify Complete

- [ ] Vercel account created and connected to GitHub
- [ ] Project imported
- [ ] All environment variables configured
- [ ] Inngest integration connected
- [ ] Production Clerk keys configured
- [ ] First deploy successful

---

## Step 9: Generate Encryption Key

The app encrypts sensitive data (Salesforce OAuth tokens) using AES-256-GCM. You need a strong encryption key.

### 9.1 Generate the Key

Run this command in your terminal:

```bash
openssl rand -hex 32
```

This outputs a 64-character hex string (32 bytes).

### 9.2 Save Environment Variable

Add to your `.env.local`:

```env
SF_TOKEN_ENCRYPTION_KEY=your-64-character-hex-string-from-above
```

### 9.3 Verify Complete

- [ ] Encryption key generated (64 hex characters)
- [ ] Saved as `SF_TOKEN_ENCRYPTION_KEY` in `.env.local`
- [ ] Same key added to Vercel env vars for production

> **IMPORTANT:** If you lose this key, all encrypted data becomes unrecoverable. Store it securely (e.g., password manager, 1Password, or similar).

---

## Complete .env.local Template

After completing all steps, your `.env.local` should look like this:

```env
# ============================================
# DATABASE (Neon PostgreSQL)
# ============================================
DATABASE_URL=postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
DIRECT_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require

# ============================================
# AUTHENTICATION (Clerk)
# ============================================
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# ============================================
# ENCRYPTION
# ============================================
SF_TOKEN_ENCRYPTION_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ============================================
# BACKGROUND JOBS (Inngest)
# Leave empty for local dev (use Inngest Dev Server)
# ============================================
INNGEST_SIGNING_KEY=
INNGEST_EVENT_KEY=

# ============================================
# AI (Anthropic Claude) — Not needed until Phase 2
# ============================================
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxx

# ============================================
# FILE STORAGE (R2 or S3) — Not needed until Phase 4
# ============================================
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=salesforce-consulting-sdlc-dev
AWS_S3_REGION=auto
AWS_S3_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
```

---

## What's Required for Each Phase

Not everything needs to be set up before Phase 1. Here's what's needed when:

| Service | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5 |
|---------|---------|---------|---------|---------|---------|
| Node.js & Git | REQUIRED | -- | -- | -- | -- |
| Neon (Database) | REQUIRED | -- | -- | -- | -- |
| Clerk (Auth) | REQUIRED | -- | -- | -- | -- |
| Inngest (Jobs) | REQUIRED | -- | -- | -- | -- |
| Encryption Key | REQUIRED | -- | -- | -- | -- |
| Anthropic (AI) | -- | REQUIRED | -- | -- | -- |
| R2/S3 (Storage) | -- | -- | -- | REQUIRED | -- |
| Vercel (Deploy) | Optional | Optional | Optional | Optional | REQUIRED |

**Minimum for Phase 1:** Node.js, Neon, Clerk, Inngest, Encryption Key

---

## Final Verification Checklist

Run through this checklist before telling GSD to execute Phase 1:

### Accounts Created
- [ ] Neon account (https://neon.tech)
- [ ] Clerk account (https://clerk.com)
- [ ] Inngest account (https://inngest.com)
- [ ] Anthropic account (https://console.anthropic.com) — can defer to Phase 2
- [ ] Cloudflare account (https://dash.cloudflare.com) — can defer to Phase 4
- [ ] Vercel account (https://vercel.com) — can defer to production

### Services Configured
- [ ] Neon: Project created, PostgreSQL 16+, pgvector extension enabled
- [ ] Clerk: Application created, Organizations enabled, redirect URLs set
- [ ] Inngest: Workspace created
- [ ] Encryption key generated (`openssl rand -hex 32`)

### Environment Variables Set
- [ ] `.env.local` file created in project root
- [ ] `DATABASE_URL` set (Neon pooled)
- [ ] `DIRECT_URL` set (Neon direct)
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` set
- [ ] `CLERK_SECRET_KEY` set
- [ ] `NEXT_PUBLIC_CLERK_SIGN_IN_URL` = `/sign-in`
- [ ] `NEXT_PUBLIC_CLERK_SIGN_UP_URL` = `/sign-up`
- [ ] `SF_TOKEN_ENCRYPTION_KEY` set (64 hex chars)
- [ ] `.env.local` is in `.gitignore`

### Ready for Phase 1
- [ ] All Phase 1 required services are configured
- [ ] `.env.local` has all required variables
- [ ] `node --version` returns 18.x+
- [ ] Project directory is clean (`git status`)

---

*Once all Phase 1 items are checked, run `/gsd-execute-phase` to begin.*
