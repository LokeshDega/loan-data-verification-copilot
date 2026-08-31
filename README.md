# Loan Data Verification Copilot

An AI-assisted, full-stack data auditing and verification console designed for the **Intain Campus FinTech Challenge 2026**. This application takes raw, messy loan tapes (spreadsheets), processes them through a configurable rules validation engine, leverages Gemini AI to explain anomalies and suggest corrections, tracks overrides via cryptographic hashes (SHA-256), and outputs a verified canonical database.

---

## Key Features

1. **Multi-Role Workspaces**:
   - **Data Operator**: Ingests raw CSV loan tapes, checks file uploads, tracks run histories, and manages database wipes.
   - **Reviewer**: Audits exception queues, uses Gemini AI to review issues, applies inline field overrides, and signs records.
   - **Data Consumer**: Accesses clean verified archives, inspects cryptographic hash audits, and exports CSV tapes.
2. **AI Review Copilot**:
   - Analyzes validation exceptions and explains why records failed in plain English.
   - Suggests logical corrections and lets reviewers review and apply them with one click.
   - Summarizes batches of exceptions inside an interactive modal.
   - Exposes a playground to translate business guidelines into structured validation rule schemas and test scripts.
3. **Traceability & Integrity**:
   - Generates unique SHA-256 hashes of stable, canonical fields upon approval.
   - Chronicles a complete, immutable audit trail of every database mutation (uploads, edits, approvals).

---

## Tech Stack
- **Frontend**: Next.js 15+ (App Router), Tailwind CSS, Lucide Icons, Shadcn UI Sidebar, Radix UI dropdown menus.
- **Backend**: Next.js API Routes, PapaParse (CSV parser).
- **Database**: SQLite with Prisma ORM.
- **AI Integration**: Gemini API (with deterministic rule-based fallbacks).

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or pnpm

### Installation

1. Install project dependencies:
   ```bash
   npm install
   ```

2. Initialize and migrate the SQLite database:
   ```bash
   npx prisma db push
   ```

3. (Optional) Set your Gemini API key in a `.env` file:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   *Note: If no API key is provided, the application will automatically switch to a deterministic, rules-based mock assistant so all features remain fully demoable without keys.*

4. Launch the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser. You will be redirected to the Ingestion Console (`/upload`).

---

## Test Credentials & Roles

Use the **Simulation Role** dropdown in the top-right header to instantly switch between the simulated desks:
- **OPERATOR** (Alice Smith - `alice_operator`): Accesses `/upload`, `/history`, `/synthetic`.
- **REVIEWER** (Bob Jones - `bob_reviewer`): Accesses `/exceptions`, `/ai-panel`, `/decisions`.
- **CONSUMER** (Charlie Brown - `charlie_consumer`): Accesses `/verified`, `/summary`, `/audits`.

---

## 5-Minute Demo Flow

1. **Ingest Raw Data** (Role: **OPERATOR**):
   - Switch to the `OPERATOR` role.
   - Click "Click to upload CSV File" and select `public/data/loan_tape.csv`.
   - Download sample updates and manifests from the "Synthetic Demo Datasets" card.
   - Upload `public/data/document_manifest.csv` and `public/data/servicer_update.csv` to resolve or trigger cross-source conflicts.
2. **Review Exceptions** (Role: **REVIEWER**):
   - Switch to the `REVIEWER` role.
   - Inspect the **Exception Queue** table. Filter by Severity or Exception Type, or search for a specific Loan ID (e.g. `LN-1001`).
   - Click on any row to open the **AI Review Assistant** drawer.
   - Click "Analyze with AI Copilot" to generate corrections. Accept and edit the fields, log reviewer notes, and click **Approve & Verify** or **Reject**.
   - Check multiple rows on the Exception Queue page and click **AI Batch Summary** to get an executive report.
   - Generate test specs inside the **AI Suggestion Panel** (`/ai-panel`).
3. **Verify Lineage** (Role: **CONSUMER**):
   - Switch to the `CONSUMER` role.
   - Inspect the clean database in `/verified`. Click on a verified record to inspect its read-only attributes, its unique validation hash, and its verification timeline.
   - View quality metrics in `/summary` and audit logs in `/audits`.
   - Click **Export clean CSV Tape** to export the verified database.
