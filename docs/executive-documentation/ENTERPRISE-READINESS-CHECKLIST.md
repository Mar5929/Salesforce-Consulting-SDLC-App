# Enterprise Readiness Checklist

## What This Is

This app is an internal AI-powered web application for our Salesforce consulting firm. It's our project management system, AI knowledge base, and delivery accelerator — used by PMs, BAs, QA, architects, and developers from kickoff through project completion. The AI builds a persistent "project brain" that gets smarter about each client engagement over time.

**The app currently runs on my personal accounts.** Before the firm can use this for real client work, we need to decide which services should move under company control. This document lays out every external dependency, the risk of leaving it as-is, and what it would take to bring it in-house.

---

## Quick Decision Matrix

| Service | What It Does | Risk If Left on Personal Account | Effort to Migrate | Priority |
|---------|-------------|----------------------------------|-------------------|----------|
| **Anthropic (Claude API)** | Powers all AI features — transcript analysis, question answering, knowledge synthesis, chat | **HIGH** — all client data flows through this API; personal key has low rate limits and no spend controls | Low (swap API key) | **Do first** |
| **Vercel** | Hosts the web app and serverless functions | **MEDIUM** — production app on a hobby account has no SLA, limited bandwidth, no team access controls | Low (transfer project or redeploy) | High |
| **Neon (PostgreSQL)** | Stores all project data, client info, knowledge articles, embeddings | **HIGH** — all client/project data lives here; personal free tier has storage limits and no backups SLA | Medium (export/import DB) | **Do first** |
| **Clerk** | User login, roles, permissions | **HIGH** — controls who can access the app and what they can do; no SSO integration on personal plan | Medium (new Clerk org + reconfigure) | **Do first** |
| **AWS S3** | Stores uploaded files and generated documents | **MEDIUM** — client documents stored in a personal AWS account | Low (new bucket + copy files) | High |
| **Inngest** | Runs background jobs (transcript processing, embedding generation, scheduled tasks) | **LOW** — no client data stored here; just orchestrates work | Low (swap keys) | Medium |
| **Voyage AI** | Generates text embeddings for semantic search | **LOW** — stateless API, no data stored | Low (swap API key) | Medium |
| **Salesforce** | Connects to client Salesforce orgs (Phase 4, not yet built) | **N/A for now** — will need a Connected App in the company's Salesforce org when Phase 4 starts | Medium | Later |

---

## Detailed Breakdown

### 1. Anthropic Claude API (AI Engine)

**What it does:** Every AI feature in the app — analyzing discovery transcripts, answering questions, synthesizing knowledge articles, powering the chat interface, running the AI agent harness — calls the Claude API. All client project context passes through this.

**What we need from the company:**
- [ ] Sign up for an Anthropic enterprise/team account (or add the app to an existing one)
- [ ] Create an API key for this application
- [ ] Set a monthly spend limit so costs don't surprise anyone
- [ ] Decide on a usage tier (rate limits depend on plan — higher tiers = more concurrent requests)

**What changes in the app:** One environment variable: `ANTHROPIC_API_KEY`

**Cost estimate:** ~$50-200/month depending on usage volume. Claude API charges per token (input and output).

**Data consideration:** Client project data (transcripts, questions, business processes) is sent to Anthropic's API for processing. Anthropic's enterprise terms include zero data retention — they don't train on API inputs. Confirm this meets company/client data handling requirements.

---

### 2. Vercel (Web Hosting & Serverless Functions)

**What it does:** Hosts the entire web application. Handles deployments, SSL certificates, serverless function execution, and CDN for static assets.

**Options:**
- **Option A: Company Vercel account (recommended)** — Easiest path. Create a Vercel team, transfer the project, add team members. Cost: ~$20/user/month on Pro plan.
- **Option B: Company AWS account** — Migrate to AWS Amplify, ECS, or similar. Significant engineering effort. Only worth it if the company has a strict "everything on our AWS" policy.

**What we need from the company:**
- [ ] Decision: Vercel (recommended) or AWS hosting?
- [ ] If Vercel: Create a Vercel team account and invite team members
- [ ] If Vercel: Set up a custom domain (e.g., `projects.ourconsultingfirm.com`)
- [ ] If AWS: Allocate significant engineering time for migration (weeks, not days)

**What changes in the app:** `NEXT_PUBLIC_APP_URL` changes to the production domain. Vercel handles the rest automatically.

---

### 3. Neon (PostgreSQL Database)

**What it does:** Stores everything — projects, clients, team members, discovery questions, knowledge articles, AI-generated embeddings, transcripts, sprint data. This is the most critical piece of infrastructure.

**Options:**
- **Option A: Neon team/pro plan (recommended)** — Easiest path. Upgrade to a paid Neon plan with proper backups, higher storage limits, and team access.
- **Option B: AWS RDS for PostgreSQL** — If the company wants the database on their AWS. Requires enabling the `pgvector` extension manually. Prisma ORM makes the switch straightforward — only the connection string changes.
- **Option C: Supabase** — Another managed PostgreSQL option with built-in pgvector support.

**What we need from the company:**
- [ ] Decision: Neon (recommended), AWS RDS, or Supabase?
- [ ] Provision the database instance (PostgreSQL 16+, with `pgvector` extension enabled)
- [ ] Set up automated backups and a backup retention policy
- [ ] Decide on a data residency region (where client data physically lives)

**What changes in the app:** One environment variable: `DATABASE_URL`

**Data consideration:** This database will contain client names, project details, discovery notes, business process documentation, and more. Ensure the hosting region and provider meet any client data handling agreements.

---

### 4. Clerk (Authentication & User Management)

**What it does:** Handles user sign-up, sign-in, session management, role-based access control (PM, BA, Developer, QA roles), and organization features.

**What we need from the company:**
- [ ] Create a Clerk organization on a paid plan
- [ ] If the company uses SSO (Okta, Azure AD, Google Workspace): configure SAML/OIDC so employees log in with their company credentials
- [ ] Set up user provisioning — who creates accounts and assigns roles?
- [ ] Define password/MFA policies

**What changes in the app:** Three environment variables:
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- (Clerk sign-in/sign-up URLs stay the same)

**Cost estimate:** Clerk Pro is ~$25/month + $0.02/monthly active user.

---

### 5. AWS S3 (File Storage)

**What it does:** Stores uploaded files (discovery transcripts, meeting recordings) and generated documents (requirements docs, branded exports).

**What we need from the company:**
- [ ] Provide an AWS account (or decide to use Cloudflare R2 instead — the app supports both)
- [ ] Create an S3 bucket with appropriate access policies
- [ ] Create an IAM user or role with scoped permissions (read/write to that bucket only)
- [ ] Decide on a storage region and lifecycle policies (e.g., auto-delete files after X months?)

**What changes in the app:** Five environment variables:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_S3_BUCKET`
- `AWS_S3_REGION`
- `AWS_S3_ENDPOINT` (only if using R2 or a custom endpoint)

---

### 6. Inngest (Background Job Processing)

**What it does:** Runs long-running and scheduled tasks in the background — processing transcripts, generating embeddings, refreshing knowledge articles, synthesizing dashboards. Think of it as the app's task queue.

**What we need from the company:**
- [ ] Create an Inngest team account (or self-host if preferred)
- [ ] Decide on a plan tier based on expected job volume

**What changes in the app:** Two environment variables:
- `INNGEST_SIGNING_KEY`
- `INNGEST_EVENT_KEY`

**Cost estimate:** Free tier handles up to 50,000 function runs/month. Likely sufficient for V1.

---

### 7. Voyage AI (Embedding Generation)

**What it does:** Converts text into numerical vectors for semantic search. When someone searches the knowledge base, the app compares embedding vectors to find relevant content.

**What we need from the company:**
- [ ] Create a Voyage AI account and API key
- [ ] (Alternative: could switch to Anthropic's own embedding API to consolidate vendors)

**What changes in the app:** One environment variable: `VOYAGE_API_KEY`

**Cost estimate:** Very low — ~$5-20/month for typical usage.

---

### 8. Salesforce Connected App (Phase 4 — Future)

**What it does:** Will allow the app to connect to client Salesforce orgs to sync metadata (objects, fields, profiles, etc.) for brownfield project analysis.

**Not needed now**, but when we build Phase 4:
- [ ] Create a Salesforce Connected App in the company's Salesforce org (or a dedicated dev org)
- [ ] Configure OAuth scopes and callback URLs
- [ ] Decide: one Connected App shared across all client orgs, or per-client?

**What changes in the app:**
- `SF_CONNECTED_APP_CLIENT_ID`
- `SF_CONNECTED_APP_CLIENT_SECRET`

---

## Other Items to Discuss

### Application Encryption Key

The app encrypts sensitive stored data (like Salesforce OAuth tokens) using a master encryption key.

- [ ] Generate a production-grade encryption key (minimum 32 characters)
- [ ] Store it securely — this key, if lost, means encrypted data is unrecoverable
- [ ] Environment variable: `SF_TOKEN_ENCRYPTION_KEY`

### Custom Domain

- [ ] Choose a domain for the app (e.g., `app.ourconsultingfirm.com`)
- [ ] Configure DNS to point to Vercel (or wherever we host)
- [ ] Environment variable: `NEXT_PUBLIC_APP_URL`

### Who Has Access?

- [ ] Define which roles exist (PM, BA, Developer, QA, Admin)
- [ ] Decide who can create projects, invite team members, access client data
- [ ] Decide if there should be project-level isolation (team members only see their projects)

### Data & Compliance

- [ ] Does the company have data handling requirements for client information?
- [ ] Are there restrictions on which cloud regions data can be stored in?
- [ ] Do client contracts have provisions about AI processing of their data?
- [ ] Should we keep an audit log of who accessed what?

---

## Complete Environment Variable Reference

These are all the values that would change when moving to company infrastructure:

| Variable | Service | Secret? | Notes |
|----------|---------|---------|-------|
| `DATABASE_URL` | Neon / RDS | Yes | PostgreSQL connection string |
| `ANTHROPIC_API_KEY` | Anthropic | Yes | Claude API key |
| `CLERK_SECRET_KEY` | Clerk | Yes | Backend auth key |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk | No | Frontend auth key (safe to expose) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Clerk | No | URL path — usually stays `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Clerk | No | URL path — usually stays `/sign-up` |
| `SF_TOKEN_ENCRYPTION_KEY` | App internal | Yes | Master encryption key |
| `INNGEST_SIGNING_KEY` | Inngest | Yes | Webhook signature verification |
| `INNGEST_EVENT_KEY` | Inngest | Yes | Event ingestion key |
| `VOYAGE_API_KEY` | Voyage AI | Yes | Embedding API key |
| `AWS_ACCESS_KEY_ID` | AWS | Yes | S3 access |
| `AWS_SECRET_ACCESS_KEY` | AWS | Yes | S3 access |
| `AWS_S3_BUCKET` | AWS | No | Bucket name |
| `AWS_S3_REGION` | AWS | No | AWS region |
| `AWS_S3_ENDPOINT` | AWS / R2 | No | Custom endpoint (R2 only) |
| `SF_CONNECTED_APP_CLIENT_ID` | Salesforce | Yes | OAuth client ID (Phase 4) |
| `SF_CONNECTED_APP_CLIENT_SECRET` | Salesforce | Yes | OAuth client secret (Phase 4) |
| `NEXT_PUBLIC_APP_URL` | App | No | Production URL |

---

## Recommended Next Steps

1. **Start the conversation** — Share this document with your manager / IT lead
2. **Get the big three decided first** — Database, Claude API, and Auth are the highest-risk items
3. **Set up a company Vercel account** — Fastest win; takes 15 minutes
4. **Create a company AWS bucket** — For file storage under company control
5. **Plan the database migration** — Export current data, provision company DB, import
6. **Swap environment variables** — Once accounts are created, updating the app is just changing env vars in Vercel's dashboard

Most of these migrations are "swap an API key" level of effort. The database is the only one that requires actual data migration.
