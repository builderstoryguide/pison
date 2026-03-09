# PRD Feature Tracker

> **Purpose**: Single source of truth mapping [PRD.md](./PRD.md) requirements to implementation status.
> **Workflow**: Before implementing a feature, check this tracker. Update it as features are completed.

**Last Updated**: 2026-03-09 (Agent daily collection: clientId on tx, session indicator, empty state, E2E session/open)

---

## Status Legend

- `[x]` Done – Fully implemented
- `[~]` Partial – Partially implemented or has gaps
- `[ ]` Not started

---

## I. Core Processing (Section I.1)

| Status | Requirement | Implementation | Location |
|--------|-------------|----------------|----------|
| [x] | Input of daily collections | Daily collection form with area selection, client amounts | `app/(protected)/collections/daily/`, `app/api/collections/daily/` |
| [x] | Management of clients | CRUD, list, detail, area/agent assignment | `app/(protected)/clients/`, `lib/services/client-service.ts` |
| [x] | Management of agents | CRUD, list, detail, area assignments, refill, transfer, withdrawal | `app/(protected)/agents/`, `lib/services/agent-service.ts` |
| [x] | Loan management | Create, approve, reject, repayments, eligibility check | `app/(protected)/loans/`, `lib/services/loan-service.ts` |
| [x] | Monthly balance | By client, area, overall | `app/(protected)/reports/monthly-balance/`, `app/api/reports/monthly-balance/` |
| [x] | Account status | Transaction history, balance | `app/(protected)/accounts/[id]/status/` |
| [x] | Collection journal | By agent, area, date | `app/(protected)/reports/collection-journal/`, `app/api/reports/collection-journal/` |
| [x] | Client statement | Full statement with filters | `app/(protected)/reports/client-statement/`, `app/api/reports/client-statement/` |
| [x] | Statistics by collection area | Deposits, withdrawals, metrics | `app/(protected)/reports/area-statistics/`, `app/api/reports/area-statistics/` |
| [x] | Automatic monthly commission calculation | Manual trigger + cron (1st of month); `commissions.calculate` permission (Accountant/Manager); summary by client; Decimal precision; commission report route + export endpoint restored | `app/api/commissions/calculate/`, `lib/jobs/commission-calculation.ts`, `lib/services/commission-service.ts`, `app/(protected)/reports/commissions/`, `app/api/reports/commissions/export/route.ts` |
| [x] | Transaction validation (four-eye principle) | Pending approval, approve/reject by admin; pending loans appear in same list | `app/(protected)/validation/pending/`, `app/api/transactions/[id]/approve/`, `app/api/loans/[id]/approve/` |
| [x] | Monitoring of surpluses and shortages | Report with physical vs system cash; `reports.surplus_shortage` permission (Accountant/Manager only); shortage alert banner; dashboard widget (last 30 days) | `app/(protected)/reports/surplus-shortage/`, `app/api/reports/surplus-shortage/`, `lib/services/dashboard-service.ts` |

---

## II. Users and Actors (Section I.2, Actors)

| Status | Requirement | Implementation | Location |
|--------|-------------|----------------|----------|
| [x] | Manager role | Full system access, transaction validation | `lib/auth.ts`, role-based routing |
| [x] | Accountant role | Financial operations, client/agent management | `lib/auth.ts`, `config/menu.config.tsx` |
| [x] | Agent role | Collection operations, zone-restricted access | `lib/auth.ts`, `lib/services/client-service.ts` (area filtering) |
| [x] | Client – no direct access | Client role rejected at login; no client dashboard routing | `app/api/auth/[...nextauth]/auth-options.ts`, `app/(protected)/page.tsx` |

---

## III. Supported Languages

| Status | Requirement | Implementation | Location |
|--------|-------------|----------------|----------|
| [x] | French | Translation keys | `i18n/messages/fr.json` |
| [x] | English | Translation keys | `i18n/messages/en.json` |
| [~] | App-wide translated UI coverage | Auth, topbar, search dialogs, notifications, and approval flows migrated to `t(...)`; remaining legacy/demo literals tracked by `npm run i18n:check` warnings | `app/(auth)/`, `app/components/partials/`, `app/(protected)/validation/`, `scripts/check-i18n.ts` |

### i18n Delivery Checklist (for new PRD features)

- [ ] All user-facing strings use `t('...')` keys (labels, placeholders, buttons, aria labels, toasts, empty states).
- [ ] New keys are added in both `i18n/messages/en.json` and `i18n/messages/fr.json`.
- [ ] Locale-sensitive values use locale-aware formatters (date, time, currency, numbers).
- [ ] `npm run i18n:check` passes with no key mismatches or unknown keys.

---

## IV. Operation Sequences

### 4.1 Input of Daily Collections (Ventilation)

| Status | Step | Implementation |
|--------|------|----------------|
| [x] | Agent selects Daily Collections | Menu item, route `/collections/daily` |
| [x] | Agent chooses collection area | Area dropdown in form |
| [x] | Agent inputs amounts per client | Client list with amount inputs |
| [x] | System validates input | Zod validation, session check |
| [x] | Amounts recorded against accounts | `POST /api/collections/daily` |
| [x] | Confirmation receipt (print/forward) | VentilationReceiptDialog – print/download after submit (`app/(protected)/collections/daily/components/ventilation-receipt-dialog.tsx`) |
| [x] | Ventilation restricted to agent's assigned clients | Backend: `createCollectionEntries` validates area access; GET /api/clients filters by agent's areas; COLLECTION tx sets `clientId`; session indicator and improved empty state on form | `lib/services/transaction-service.ts`, `app/api/clients/route.ts`, `app/(protected)/collections/daily/components/daily-collection-form.tsx` |

### 4.2 Management of Clients and Agents

| Status | Requirement | Implementation |
|--------|-------------|----------------|
| [x] | View list of clients | `app/(protected)/clients/` |
| [x] | Add new client | `app/(protected)/clients/new/` |
| [x] | Edit client | `app/(protected)/clients/[id]/edit/` |
| [x] | Deactivate/delete client | Delete in client list |
| [x] | View list of agents | `app/(protected)/agents/` |
| [x] | Add new agent | `app/(protected)/agents/new/` |
| [x] | Auto-provision agent credentials on creation | New agent creation now auto-generates `username` + temporary password, creates account/user/agent atomically, and auto-downloads credentials `.txt` | `app/api/agents/route.ts`, `lib/services/agent-service.ts`, `app/(protected)/agents/components/agent-form.tsx`, `app/api/auth/[...nextauth]/auth-options.ts`, `prisma/schema.prisma` |
| [x] | Assign collection areas to agents | `app/(protected)/collection-areas/assignments/` |
| [x] | Modify agent details | `app/(protected)/agents/[id]/` |
| [x] | Refill agent account | `AgentAccountActions` (refill, transfer, withdrawal) |

### 4.3 Loan Management

| Status | Step | Implementation |
|--------|------|----------------|
| [x] | Client requests loan | Loan creation by Accountant/Admin |
| [x] | System checks eligibility | `loanService.checkEligibility()` |
| [x] | Manager approves loan | `POST /api/loans/[id]/approve` |
| [x] | Loan recorded as negative balance | `LOAN_DISBURSEMENT` transaction |
| [x] | Repayments update loan balance | `POST /api/loans/[id]/repayments` |

### 4.4–4.11 Other Operations

| Status | Operation | Implementation |
|--------|-----------|----------------|
| [x] | Periodic balance (monthly) | Monthly balance report |
| [x] | Account status | Account status page |
| [x] | Collection journal | Collection journal report |
| [x] | Client statement | Client statement report |
| [x] | Statistics by area | Area statistics report |
| [x] | Automatic commission calculation | Manual + cron (ENABLE_COMMISSION_CRON, CRON_SECRET) |
| [x] | Four-eye validation | Pending transactions, approve/reject |
| [x] | Surplus/shortage monitoring | Surplus-shortage report |

---

## V. Use Cases

### Clients (via Agent/Accountant only – no direct access)

| Status | Use Case | Implementation |
|--------|----------|----------------|
| [x] | Request to open account | Client creation by Accountant/Admin |
| [x] | Consult account | Account status, client statement (via staff) |
| [x] | Request deposit, withdrawal, loan | Deposit/withdrawal dialogs on client detail; loan creation |
| [x] | Request to close account | Client deactivation |

### Agent

| Status | Use Case | Implementation |
|--------|----------|----------------|
| [x] | Enter collected amounts (ventilation) | Daily collection form |
| [x] | View clients in assigned area only | Zone filtering in `client-service` |

### Accountant

| Status | Use Case | Implementation |
|--------|----------|----------------|
| [x] | Consult agent transactions | Transaction list, reports |
| [x] | Deposit/withdrawal for office clients | Deposit/withdrawal dialogs on client detail |
| [x] | Create client account | Client creation form |
| [x] | Create agent account | Agent creation form |
| [x] | Deposit/withdrawal to agent accounts | `AgentAccountActions` component |

### Manager

| Status | Use Case | Implementation | Location |
|--------|----------|----------------|----------|
| [x] | Validate transactions | Pending validation page | |
| [x] | Validate accounts created by Accountant | Accountant creates → PENDING_APPROVAL; Manager approves/rejects via `/validation/pending-accounts` | `app/(protected)/validation/pending-accounts/`, `app/api/accounts/pending/`, `app/api/clients/[id]/approve`, `app/api/agents/[id]/approve` |
| [x] | Create client/agent/accountant | User management, client/agent forms | |
| [x] | Add/modify/remove users and permissions | User management, roles, permissions | `app/(protected)/user-management/`, `app/(protected)/settings/` |
| [x] | Create and view reports | Reports section | |
| [x] | Total control over transactions | Four-eye principle, audit trail | |

---

## VI. System Requirements

### Technical Requirements

| Status | Requirement | Implementation |
|--------|-------------|----------------|
| [x] | Hosted on local server | Next.js app, configurable |
| [x] | Multi-language (French, English) | i18n |
| [x] | Daily session management | `DailySession`, open/close |
| [~] | Session closed = no access | Session check on transactions; full lockout to verify |

### Security Requirements

| Status | Requirement | Implementation |
|--------|-------------|----------------|
| [x] | RBAC (Manager, Accountant, Agent, Client) | Roles, permissions |
| [x] | Four-eye principle | Transaction approval workflow |
| [x] | Audit trail | `AuditLog` model, `app/(protected)/operations/audit-log/` |
| [x] | Secure auth and authorization | NextAuth, bcrypt, lockout |

### Functional Requirements

| Status | Requirement | Implementation |
|--------|-------------|----------------|
| [x] | Real-time account balance updates | Balance in transactions, cache invalidation |
| [x] | Transaction history tracking | Transaction list, account status |
| [x] | Report generation (PDF, Excel, CSV) | CSV, Excel, and PDF implemented (`lib/utils/export.ts`, report export routes) |
| [x] | Commission calculation automation | Manual + cron (1st of month) |
| [x] | Surplus/shortage monitoring | Surplus-shortage report |
| [x] | Loan management with negative balance | Loan service, disbursement |

---

## VII. Special Notations (Critical Implementation)

### Special Notation #1: Client Access Restriction

| Status | Requirement | Implementation |
|--------|-------------|----------------|
| [x] | No client direct access | Client role rejected at login |
| [x] | No client dashboard/login | No client routing in main page |
| [x] | All operations via Agent/Accountant | Deposit/withdrawal/transfer dialogs on client detail |
| [x] | Orphaned client dashboard | Removed – PRD forbids client access |

### Special Notation #2: Zone/Geographical Area Management

| Status | Requirement | Implementation |
|--------|-------------|----------------|
| [x] | Manager creates and manages zones | `app/(protected)/collection-areas/` |
| [x] | Assign one or more zones to agent | `app/(protected)/collection-areas/assignments/` |
| [x] | Agent sees only clients in assigned zones | Area filtering in `client-service` |

### Special Notation #3: Account Nature

| Status | Requirement | Implementation |
|--------|-------------|----------------|
| [x] | Account nature dropdown on creation | `client-form.tsx` - Account Type dropdown |
| [x] | Account natures (Daily Collection, Simple Saving, etc.) | `AccountNature` model, 12 types in seed |
| [x] | Minimum balance per nature | Enforced in `transaction-service` on withdrawal |
| [x] | Interest remuneration | `interestRateDefault`, `interestRateMin/Max`, `customInterestRate` on account |
| [x] | Maintenance fees | `maintenanceFee`, `maintenanceFeeType` on AccountNature (config; application TBD) |
| [x] | Transaction fees (withdrawals) | Per-account-nature in `transaction-service` on approval |

### Special Notation #4: Account Creation

| Status | Requirement | Implementation |
|--------|-------------|----------------|
| [x] | Account nature selection during creation | `client-form.tsx` - dropdown + document checklist |
| [x] | Type-specific validation | `account-nature-service.validateAccountCreation()` |
| [x] | Reference table for account types | `AccountNature`, `DocumentType`, `AccountNatureDocument` |

---

## VIII. Missing Pages (Menu Links Exist, Pages 404)

| Status | Route | Notes |
|--------|-------|-------|
| [x] | `/clients/accounts` | Client accounts list – `app/(protected)/clients/accounts/` |
| [x] | `/agents/accounts` | Agent accounts list – `app/(protected)/agents/accounts/` |
| [x] | `/operations/reconciliation` | Cash reconciliation – embeds SurplusShortageReport |
| [x] | `/analytics`, `/analytics/financial`, etc. | Analytics placeholder pages – links to reports (`app/(protected)/analytics/`) |

---

## IX. Implementation Priority (from Plan)

**Phase 1 – Quick wins**
1. [x] Create `/clients/accounts` and `/agents/accounts` pages
2. [x] Create `/operations/reconciliation` (embeds surplus-shortage report)
3. [x] Add PDF export for reports

**Phase 2 – PRD compliance**
4. [x] Remove orphaned `dashboard/client` page
5. [x] Manager validation of accounts created by Accountant
6. [x] Confirmation receipt for ventilation

**Phase 3 – Account nature**
7. [x] Add `AccountNature` enum and reference table
8. [x] Account creation with nature dropdown and validation
9. [x] Enforce min balance, fees per account nature

**Phase 4 – Automation**
10. [x] Commission calculation cron/scheduler
11. [ ] Session closure enforcement (block all operations)
12. [x] Analytics module placeholder pages
