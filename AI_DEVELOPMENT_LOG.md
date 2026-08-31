# AI Development Log - Loan Data Verification Copilot

This log demonstrates how AI-assisted and agentic coding tools (Gemini, Antigravity AI, Claude Code) were utilized during the development, testing, refactoring, and documentation of the Loan Data Verification Copilot.

---

## 1. AI Coding Tools Used
- **Antigravity AI**: Core pair-programmer and agentic editor.
- **Gemini 3.5 Flash**: API helper and code generator for Next.js routes.
- **Prisma Client**: Automated schema migrations and type generators.

---

## 2. Supported Use Cases
1. **API Route Architecture**: Designing clean `/api/exceptions`, `/api/verified-loans/:id`, and `/api/audit/:loanId` REST patterns.
2. **AI Batch Exception Summarizer**: Drafting advanced LLM prompts with SQLite fallback logic.
3. **Validation Rule Generation**: Translating plain text rules into JSON schema constraints.
4. **React Front-End Integration**: Building interactive components in `app/dashboard/page.tsx`, managing multi-select checkboxes, and wiring state variables.
5. **Linting and Debugging**: Troubleshooting Next.js routing parameters and Prisma transaction rollbacks.

---

## 3. Representative Prompts Used

Here are representative prompts used to guide the development:

1. **Prisma Schema Mapping**:
   > *"Draft a Prisma SQLite schema for a loan auditing application. Ensure models for LoanRecord, Exception, and AuditLog are properly related. Include fields for SHA-256 integrity hash, verified user, and exception severity."*
2. **AI Suggestion Route**:
   > *"Write a Next.js POST api route under `app/api/loans/[id]/ai-suggest` that loads a loan's exceptions and sends them to Gemini to suggest schema updates in JSON format. Provide a robust rule-based fallback in case the API key is not present."*
3. **Batch Summarizer API**:
   > *"Create a batch summarizer POST endpoint that accepts an array of loan record IDs, pulls their unresolved exceptions, and writes a prompt asking Gemini to summarize common issues in a professional financial audit tone."*
4. **Rule Translation Prompt**:
   > *"Translate natural language business rules into a structured JSON configuration and a Jest test block using TypeScript. The JSON output should map fields like borrowerState or interestRate with custom condition operators."*
5. **Dashboard State Updates**:
   > *"Update the main dashboard UI to support checking rows in the Exception Queue table. Display a banner showing the selected counts with a button to trigger the batch analysis endpoint."*

---

## 4. Human Review & Verification Process

All AI-generated code underwent strict human engineering review:
1. **Schema Check**: Verified that the SQL indexing on `loanId` exists to prevent slow database queries during bulk CSV uploads.
2. **Type Checking**: Checked TypeScript compilation output to ensure variables like `selectedLoanDetail` are properly typed with nested optional arrays.
3. **API Routing Rules**: Confirmed that Next.js dynamic parameters are typed as `Promise` blocks to match modern App Router standards.
4. **Integrity Validation**: Manually verified that the generated record hash is calculated using stable, ordered fields so that recalculating it always yields the identical SHA-256.

**AI-Generated Code Percentage**: ~90%
**Human Verification / Editing**: ~10%

---

## 5. Rejected AI Suggestions & Corrections

### Example 1: Synchronous Dynamic Page Parameters
* **AI Recommendation**:
  ```typescript
  export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const { id } = params;
    // ...
  }
  ```
* **Why Rejected**: Under Next.js 15+, dynamic route `params` are asynchronous and must be treated as a Promise. Failing to do so throws compile warnings/errors.
* **Correction**:
  ```typescript
  export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const { id } = params;
    // ...
  }
  ```

### Example 2: Insecure Hash Calculation Missing Stable Sorting
* **AI Recommendation**:
  ```typescript
  export function generateHash(record: any) {
    return sha256(JSON.stringify(record));
  }
  ```
* **Why Rejected**: Stringifying the entire record contains volatile metadata fields (such as `createdAt` timestamps, resolution status, or reviewer notes) which changes during the review lifecycle. This breaks cryptographic traceability because the hash changes after verification.
* **Correction**: Restricted hash fields in `lib/validation.ts` to stable, canonical tape fields only (e.g. `loanId`, `borrowerId`, `originalPrincipal`, `interestRate`, `termMonths`) joined with a fixed separator (`|`).

---

## 6. Key Lessons Learned
- **AI Strengths**: AI excel at generating repetitive Tailwind layout classes, standard REST APIs boilerplate, and creating realistic mock datasets (saving hours of manual CSV typing).
- **Human Judgement Value**: Critical for designing secure validation lifecycles (like avoiding silent database edits, separating simulated roles), understanding structural Next.js changes, and maintaining database relationship integrity.
